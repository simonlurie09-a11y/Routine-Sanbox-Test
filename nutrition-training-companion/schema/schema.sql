-- Nutrition & Training Companion: reference schema (PostgreSQL 16)
--
-- Conventions
--   * Columns ending in _enc hold application-level ciphertext (AES-256-GCM)
--     under the owning user's data key (see user_keys). The database never
--     sees the plaintext. Everything else relies on storage encryption (KMS)
--     plus row-level security.
--   * Timestamps are timestamptz (UTC). "Day" columns (local_date) are the
--     user's local calendar day, derived from users.timezone at write time.
--   * Tables marked GLOBAL hold no personal data.
--   * The evidence gate is enforced here as well as in the application:
--     a recommendation cannot reach 'proposed' or 'accepted' unless every
--     claim it relies on has at least min_sources_required verified sources,
--     and no app-originated split version or nutrition target can exist
--     without an accepted recommendation behind it.

BEGIN;

CREATE SCHEMA IF NOT EXISTS app;
SET search_path = app, public;

-------------------------------------------------------------------------------
-- Enumerations
-------------------------------------------------------------------------------
CREATE TYPE goal_kind AS ENUM
  ('fat_loss', 'muscle_gain', 'strength', 'endurance', 'hybrid', 'general_health');
CREATE TYPE experience_level AS ENUM ('novice', 'intermediate', 'advanced');
CREATE TYPE food_source AS ENUM
  ('open_food_facts', 'usda_fdc', 'ingredient_scan', 'user_custom');
CREATE TYPE scan_status AS ENUM
  ('processing', 'needs_review', 'confirmed', 'discarded', 'failed');
CREATE TYPE confidence_level AS ENUM ('high', 'medium', 'low');
CREATE TYPE meal_slot AS ENUM ('breakfast', 'lunch', 'dinner', 'snack', 'other');
CREATE TYPE change_origin AS ENUM ('user_edit', 'app_recommendation', 'import');
CREATE TYPE recommendation_kind AS ENUM
  ('split_change', 'nutrition_target', 'session_adjustment');
CREATE TYPE recommendation_status AS ENUM (
  'draft',                          -- being assembled by the engine
  'evidence_check',                 -- verification run in progress
  'blocked_insufficient_evidence',  -- fewer than the required verified sources
  'blocked_safety',                 -- safety rule (injury, condition, age) stopped it
  'blocked_verification_unavailable', -- external checks could not run; fail closed
  'proposed',                       -- shown to the user with citations
  'accepted', 'rejected', 'superseded', 'expired',
  'withdrawn'                       -- pulled after a cited source was retracted
);
CREATE TYPE claim_status AS ENUM ('draft', 'in_review', 'active', 'suspended', 'retired');
CREATE TYPE verification_check AS ENUM (
  'identifier_resolves',   -- DOI registered / PMID exists
  'metadata_matches',      -- title, authors, year, journal agree across registries
  'study_design_strong',   -- meta-analysis, systematic review, RCT, other peer-reviewed study
  'peer_reviewed_indexed', -- indexed journal; not a preprint
  'not_retracted',         -- no retraction / withdrawal notice
  'finding_supported'      -- the stored summary is supported by the abstract
);
CREATE TYPE check_status AS ENUM ('pass', 'fail', 'error', 'needs_human');
CREATE TYPE wearable_provider AS ENUM ('whoop', 'oura', 'google_health', 'apple_health');
CREATE TYPE connection_status AS ENUM
  ('pending', 'active', 'needs_reauth', 'paused', 'revoked', 'error');

-------------------------------------------------------------------------------
-- Users, keys, profile, consent
-------------------------------------------------------------------------------
CREATE TABLE users (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_subject             text NOT NULL UNIQUE,      -- identity provider 'sub'
  timezone                 text NOT NULL DEFAULT 'UTC',
  unit_system              text NOT NULL DEFAULT 'metric'
                             CHECK (unit_system IN ('metric', 'imperial')),
  created_at               timestamptz NOT NULL DEFAULT now(),
  onboarding_completed_at  timestamptz,
  deletion_requested_at    timestamptz
);

-- Per-user data encryption key (DEK), wrapped by a KMS key. Destroying the
-- wrapped DEK makes every *_enc column, export and backup copy unreadable
-- (crypto-shredding), which is how deletion reaches backups.
CREATE TABLE user_keys (
  user_id       uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  kms_key_arn   text NOT NULL,
  wrapped_dek   bytea,
  created_at    timestamptz NOT NULL DEFAULT now(),
  rotated_at    timestamptz,
  destroyed_at  timestamptz,
  CHECK ((wrapped_dek IS NULL) = (destroyed_at IS NOT NULL))
);

CREATE TABLE user_profiles (
  user_id                  uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  birth_year               smallint CHECK (birth_year BETWEEN 1900 AND 2100),
  height_cm                numeric(5,1) CHECK (height_cm > 0),
  sex_for_energy_equations text CHECK (sex_for_energy_equations IN ('female', 'male', 'unspecified')),
  goal                     goal_kind,
  experience               experience_level,
  training_days_per_week   smallint CHECK (training_days_per_week BETWEEN 0 AND 7),
  session_minutes          smallint CHECK (session_minutes > 0),
  equipment                text[] NOT NULL DEFAULT '{}',
  health_notes_enc         bytea,                    -- injuries / conditions, free text
  -- Structured safety flags drive hard rules (see docs/07-product-flows.md):
  -- 'under_18', 'injury_reported', 'condition_reported', 'pregnancy',
  -- 'eating_disorder_history', 'clinician_supervised'
  safety_flags             text[] NOT NULL DEFAULT '{}',
  -- NULL until the health and safety questions are answered. Sign-up asks
  -- only for the account, age, weight and goal; these questions come after,
  -- from the app's tabs (docs/07 §7.1), and nothing is suggested until then.
  safety_answered_at       timestamptz,
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE body_measurements (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  measured_at   timestamptz NOT NULL,
  weight_kg     numeric(5,2) CHECK (weight_kg > 0),
  body_fat_pct  numeric(4,1) CHECK (body_fat_pct BETWEEN 0 AND 100),
  source        text NOT NULL DEFAULT 'manual',
  UNIQUE (user_id, measured_at, source)
);

-- One row per grant; revocation closes the row, a new grant opens a new one.
CREATE TABLE consents (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- 'terms', 'privacy_policy', 'medical_disclaimer', 'health_data_processing',
  -- 'ai_processing', 'wearable:whoop', 'wearable:oura', 'wearable:google_health',
  -- 'wearable:apple_health', 'scan_image_upload', 'off_contribution', 'product_analytics'
  purpose           text NOT NULL,
  document_version  text NOT NULL,
  granted_at        timestamptz NOT NULL DEFAULT now(),
  revoked_at        timestamptz,
  client_info       jsonb NOT NULL DEFAULT '{}'      -- app version, platform, locale
);
CREATE UNIQUE INDEX consents_one_active ON consents (user_id, purpose) WHERE revoked_at IS NULL;

-------------------------------------------------------------------------------
-- Food catalogue (GLOBAL unless owner_user_id is set) and health ratings
-------------------------------------------------------------------------------
CREATE TABLE food_items (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source              food_source NOT NULL,
  source_ref          text,                 -- OFF code, FDC fdcId, scan id
  gtin14              char(14),             -- barcode normalised to zero-padded GTIN-14
  owner_user_id       uuid REFERENCES users(id) ON DELETE CASCADE, -- NULL = shared catalogue
  name                text NOT NULL,
  brand               text,
  is_beverage         boolean NOT NULL DEFAULT false,  -- selects per-100 ml thresholds
  serving_size_g      numeric(7,2) CHECK (serving_size_g > 0),
  serving_label       text,
  -- Canonical keys, per 100 g (or 100 ml for beverages):
  -- energy_kcal, protein_g, carbohydrate_g, sugars_g, fat_g, saturated_fat_g,
  -- fiber_g, sodium_mg, salt_g (derived = sodium_mg * 2.5 / 1000)
  nutrients_per_100   jsonb NOT NULL,
  ingredients_text    text,
  nova_group          smallint CHECK (nova_group BETWEEN 1 AND 4),
  nutriscore_grade    char(1) CHECK (nutriscore_grade IN ('a', 'b', 'c', 'd', 'e')),
  additives           text[] NOT NULL DEFAULT '{}',
  completeness        numeric(3,2) CHECK (completeness BETWEEN 0 AND 1),
  data_license        text NOT NULL,        -- 'ODbL-1.0' | 'CC0-1.0' | 'user'
  fetched_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source, source_ref)
);
CREATE INDEX food_items_gtin ON food_items (gtin14) WHERE gtin14 IS NOT NULL;

-- Negative and positive cache for barcode lookups (GLOBAL).
CREATE TABLE barcode_lookups (
  gtin14         char(14) PRIMARY KEY,
  food_item_id   uuid REFERENCES food_items(id),
  outcome        text NOT NULL CHECK (outcome IN ('found_off', 'found_fdc', 'incomplete', 'not_found')),
  sources_tried  text[] NOT NULL,
  looked_up_at   timestamptz NOT NULL DEFAULT now(),
  expires_at     timestamptz NOT NULL
);

-- The rating is a set of explained dimensions, never a single score.
CREATE TABLE health_ratings (
  food_item_id     uuid NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
  ruleset_version  text NOT NULL,
  -- [{dimension: 'sugar'|'sodium'|'fiber'|'saturated_fat'|'processing'|'protein_quality',
  --   level, value, unit, basis: 'per_100g'|'per_100ml'|'per_serving',
  --   rule_ref, explanation, confidence}]
  dimensions       jsonb NOT NULL,
  summary          text NOT NULL,
  data_gaps        text[] NOT NULL DEFAULT '{}',
  computed_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (food_item_id, ruleset_version)
);

CREATE TABLE ingredient_scans (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gtin14                 char(14),              -- the barcode that missed, if any
  status                 scan_status NOT NULL DEFAULT 'processing',
  image_object_keys      text[] NOT NULL DEFAULT '{}', -- only if the user allowed upload
  image_purge_after      timestamptz,
  ocr_engine             text,                  -- 'apple_vision' | 'mlkit_text_v2' | 'textract'
  ocr_text               text,
  ocr_mean_confidence    numeric(4,3),
  has_nutrition_panel    boolean NOT NULL DEFAULT false,
  parsed_ingredients     jsonb,  -- [{position, raw, canonical_id, percent, flags[]}]
  parsed_panel           jsonb,  -- values read from a photographed nutrition panel
  estimate               jsonb,  -- {per_100: {energy_kcal: {value, low, high}, ...}, method}
  health_rating          jsonb,
  confidence             confidence_level,
  low_confidence_reasons text[] NOT NULL DEFAULT '{}',
  user_corrections       jsonb NOT NULL DEFAULT '[]', -- [{field, before, after, at}]
  estimator_version      text,
  llm_model              text,
  food_item_id           uuid REFERENCES food_items(id),
  created_at             timestamptz NOT NULL DEFAULT now(),
  confirmed_at           timestamptz,
  CHECK (status <> 'confirmed' OR food_item_id IS NOT NULL)
);

-------------------------------------------------------------------------------
-- Food log and nutrition targets
-------------------------------------------------------------------------------
CREATE TABLE food_log_entries (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_entry_id      uuid NOT NULL,        -- idempotency key from the device (offline logging)
  local_date           date NOT NULL,
  eaten_at             timestamptz NOT NULL,
  meal                 meal_slot NOT NULL DEFAULT 'other',
  food_item_id         uuid REFERENCES food_items(id),
  quantity_g           numeric(8,2) NOT NULL CHECK (quantity_g > 0),
  -- Nutrients for this quantity, frozen at log time so later catalogue
  -- corrections never rewrite a user's history.
  nutrients_snapshot   jsonb NOT NULL,
  entry_source         text NOT NULL
                         CHECK (entry_source IN ('barcode', 'search', 'ingredient_scan', 'quick_add', 'recent')),
  estimate_confidence  confidence_level NOT NULL DEFAULT 'high',
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  deleted_at           timestamptz,
  UNIQUE (user_id, client_entry_id)
);
CREATE INDEX food_log_by_day ON food_log_entries (user_id, local_date) WHERE deleted_at IS NULL;

CREATE VIEW daily_nutrition AS
SELECT user_id,
       local_date,
       sum((nutrients_snapshot ->> 'energy_kcal')::numeric)     AS energy_kcal,
       sum((nutrients_snapshot ->> 'protein_g')::numeric)       AS protein_g,
       sum((nutrients_snapshot ->> 'carbohydrate_g')::numeric)  AS carbohydrate_g,
       sum((nutrients_snapshot ->> 'fat_g')::numeric)           AS fat_g,
       sum((nutrients_snapshot ->> 'fiber_g')::numeric)         AS fiber_g,
       sum((nutrients_snapshot ->> 'sodium_mg')::numeric)       AS sodium_mg,
       count(*) FILTER (WHERE estimate_confidence <> 'high')    AS estimated_entries
FROM food_log_entries
WHERE deleted_at IS NULL
GROUP BY user_id, local_date;

CREATE TABLE nutrition_targets (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  energy_kcal        integer NOT NULL CHECK (energy_kcal > 0),
  protein_g          integer CHECK (protein_g >= 0),
  carbohydrate_g     integer CHECK (carbohydrate_g >= 0),
  fat_g              integer CHECK (fat_g >= 0),
  fiber_g            integer CHECK (fiber_g >= 0),
  effective_from     date NOT NULL,
  effective_to       date,
  origin             change_origin NOT NULL,
  recommendation_id  uuid,                         -- FK added below
  created_at         timestamptz NOT NULL DEFAULT now(),
  CHECK (effective_to IS NULL OR effective_to >= effective_from),
  CHECK (origin <> 'app_recommendation' OR recommendation_id IS NOT NULL)
);

-------------------------------------------------------------------------------
-- Exercise catalogue (GLOBAL)
-------------------------------------------------------------------------------
CREATE TABLE muscles (
  id            text PRIMARY KEY,        -- 'lats', 'side_delts', 'quads', ...
  display_name  text NOT NULL,
  region        text NOT NULL            -- 'upper_push', 'upper_pull', 'lower', 'core'
);

CREATE TABLE exercises (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              text NOT NULL UNIQUE,
  name              text NOT NULL,
  modality          text NOT NULL CHECK (modality IN ('resistance', 'cardio', 'mobility', 'plyometric')),
  equipment         text[] NOT NULL DEFAULT '{}',
  movement_pattern  text,
  catalog_version   text NOT NULL
);

-- How much one hard set of an exercise counts toward each muscle's weekly
-- volume (e.g. 1.0 primary, 0.5 secondary). The weighting convention is a
-- catalogue setting reviewed by the evidence editor, not a hard-coded rule.
CREATE TABLE exercise_muscles (
  exercise_id  uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  muscle_id    text NOT NULL REFERENCES muscles(id),
  role         text NOT NULL CHECK (role IN ('primary', 'secondary')),
  set_credit   numeric(3,2) NOT NULL CHECK (set_credit > 0 AND set_credit <= 1),
  PRIMARY KEY (exercise_id, muscle_id)
);

-------------------------------------------------------------------------------
-- Workout splits (versioned), reviews, sessions, check-ins
-------------------------------------------------------------------------------
CREATE TABLE workout_splits (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                text NOT NULL,
  current_version_id  uuid,                     -- FK added below
  archived_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- Versions are immutable snapshots; a change creates a new version whose
-- diff_from_parent is what the history view renders.
CREATE TABLE split_versions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  split_id           uuid NOT NULL REFERENCES workout_splits(id) ON DELETE CASCADE,
  version_no         integer NOT NULL CHECK (version_no >= 1),
  parent_version_id  uuid REFERENCES split_versions(id),
  style              text NOT NULL
                       CHECK (style IN ('hypertrophy', 'strength', 'endurance', 'hybrid', 'general')),
  -- {days: [{key, label, weekday?, items: [{exercise_id, sets, rep_min, rep_max,
  --   rir, rest_s, notes}] | cardio: [{kind, minutes, intensity}]}], rest_days: [...]}
  definition         jsonb NOT NULL,
  weekly_volume      jsonb NOT NULL,            -- {muscle_id: weighted hard sets per week}
  diff_from_parent   jsonb,                     -- [{op, path, before, after}] + volume deltas
  origin             change_origin NOT NULL,
  recommendation_id  uuid,                      -- FK added below
  change_note        text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (split_id, version_no),
  CHECK ((version_no = 1) = (parent_version_id IS NULL)),
  CHECK (origin <> 'app_recommendation' OR recommendation_id IS NOT NULL)
);

ALTER TABLE workout_splits
  ADD CONSTRAINT workout_splits_current_version_fk
  FOREIGN KEY (current_version_id) REFERENCES split_versions(id) DEFERRABLE INITIALLY DEFERRED;

-- Descriptive findings only (facts about the split). Turning a finding into a
-- proposed change goes through recommendations and the evidence gate.
CREATE TABLE split_reviews (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  split_version_id  uuid NOT NULL REFERENCES split_versions(id) ON DELETE CASCADE,
  analyzer_version  text NOT NULL,
  -- [{code, muscles[], metric, observed, reference, reference_claim_key, severity}]
  findings          jsonb NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE workout_sessions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  split_version_id  uuid REFERENCES split_versions(id),
  split_day_key     text,
  started_at        timestamptz NOT NULL,
  ended_at          timestamptz,
  session_rpe       smallint CHECK (session_rpe BETWEEN 1 AND 10),
  soreness          smallint CHECK (soreness BETWEEN 0 AND 10),
  notes_enc         bytea,
  source            text NOT NULL DEFAULT 'app',  -- or a wearable provider
  CHECK (ended_at IS NULL OR ended_at >= started_at)
);

CREATE TABLE set_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   uuid NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id  uuid NOT NULL REFERENCES exercises(id),
  set_index    smallint NOT NULL,
  reps         smallint CHECK (reps >= 0),
  load_kg      numeric(6,2) CHECK (load_kg >= 0),
  rir          smallint CHECK (rir BETWEEN 0 AND 10),
  duration_s   integer CHECK (duration_s >= 0),
  distance_m   numeric(9,1) CHECK (distance_m >= 0),
  UNIQUE (session_id, exercise_id, set_index)
);

-- Follow-up questions the app asks to adapt the split over time.
CREATE TABLE check_ins (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_key    text NOT NULL,   -- 'experience', 'injury_update', 'equipment', 'schedule',
                                   -- 'sleep_recovery', 'soreness', 'progress_stalled', ...
  trigger_reason  text NOT NULL,   -- 'new_split', 'stalled_progress', 'low_recovery_streak',
                                   -- 'missed_sessions', 'scheduled'
  asked_at        timestamptz NOT NULL DEFAULT now(),
  answered_at     timestamptz,
  answer_enc      bytea,           -- free text may contain health details
  answer_struct   jsonb            -- the structured part the engines read
);

-------------------------------------------------------------------------------
-- Evidence library (GLOBAL) and verification audit
-------------------------------------------------------------------------------
CREATE TABLE sources (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doi                  text UNIQUE,
  pmid                 text UNIQUE,
  pmcid                text,
  title                text NOT NULL,
  authors              jsonb NOT NULL,          -- [{family, given, orcid?}]
  journal              text,
  issn                 text[] NOT NULL DEFAULT '{}',
  pub_year             smallint,
  publication_types    text[] NOT NULL DEFAULT '{}', -- PubMed PT and/or Crossref type
  abstract             text,
  canonical_url        text NOT NULL,
  metadata_fetched_at  timestamptz NOT NULL,
  metadata_hash        text NOT NULL,           -- detects silent upstream metadata changes
  CHECK (doi IS NOT NULL OR pmid IS NOT NULL),
  CHECK (doi IS NULL OR doi = lower(doi))
);

-- A claim is a reviewed, reusable statement that a rule in the engine relies
-- on, e.g. key 'hypertrophy.volume.raise_low_weekly_sets'.
CREATE TABLE claims (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key          text NOT NULL,
  version      integer NOT NULL CHECK (version >= 1),
  statement    text NOT NULL,
  applies_to   jsonb NOT NULL,     -- {goals[], experience[], population_notes}
  status       claim_status NOT NULL DEFAULT 'draft',
  reviewed_by  text,
  reviewed_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (key, version),
  CHECK (status NOT IN ('active') OR (reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL))
);

CREATE TABLE claim_sources (
  claim_id          uuid NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  source_id         uuid NOT NULL REFERENCES sources(id),
  finding_summary   text NOT NULL,   -- what the study found, in plain language
  limitations       text NOT NULL,   -- shown next to the citation
  supporting_quote  text NOT NULL,   -- verbatim from the abstract; must string-match
  added_by          text NOT NULL,
  added_at          timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (claim_id, source_id)
);

CREATE TABLE verification_runs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger           text NOT NULL
                      CHECK (trigger IN ('recommendation', 'scheduled', 'claim_review', 'manual')),
  pipeline_version  text NOT NULL,
  started_at        timestamptz NOT NULL DEFAULT now(),
  finished_at       timestamptz
);

-- One row per check per source per run; never updated, only appended.
CREATE TABLE source_checks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id      uuid NOT NULL REFERENCES verification_runs(id),
  claim_id    uuid REFERENCES claims(id),        -- set for finding_supported
  source_id   uuid NOT NULL REFERENCES sources(id),
  check_kind  verification_check NOT NULL,
  status      check_status NOT NULL,
  -- e.g. {http_status, registry, field_scores: {title: 0.99, first_author: true},
  --       retraction_notice_doi, judge: {verdict, quote, model, prompt_version}}
  detail      jsonb NOT NULL,
  checker     text NOT NULL,     -- 'system:crossref', 'llm:<model>@<prompt>', 'human:<reviewer>'
  checked_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX source_checks_latest ON source_checks (source_id, check_kind, checked_at DESC);

-------------------------------------------------------------------------------
-- Recommendations and their frozen evidence
-------------------------------------------------------------------------------
CREATE TABLE recommendations (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind                   recommendation_kind NOT NULL,
  status                 recommendation_status NOT NULL DEFAULT 'draft',
  trigger                text NOT NULL,   -- 'user_request', 'split_review', 'low_recovery',
                                          -- 'check_in', 'scheduled_review'
  request_text_enc       bytea,           -- the user's own words, if they asked
  intent                 jsonb NOT NULL,  -- structured intent, e.g. {type: 'develop_muscle', muscle: 'lats'}
  proposed_change        jsonb NOT NULL,  -- diff ops or target deltas
  claim_ids              uuid[] NOT NULL DEFAULT '{}', -- every claim the change relies on
  drivers                jsonb NOT NULL,  -- data behind it: [{metric, value, baseline, provider, date}]
  rationale              text NOT NULL,
  engine_version         text NOT NULL,
  llm_model              text,            -- model id + prompt version, if an LLM was involved
  min_sources_required   smallint NOT NULL DEFAULT 3 CHECK (min_sources_required >= 3),
  verified_source_count  smallint NOT NULL DEFAULT 0,  -- weakest claim's count; set by trigger
  disclaimer_version     text NOT NULL,
  created_at             timestamptz NOT NULL DEFAULT now(),
  gate_decided_at        timestamptz,
  decided_at             timestamptz,     -- user accepted / rejected
  CHECK (status NOT IN ('proposed', 'accepted')
         OR verified_source_count >= min_sources_required)
);
CREATE INDEX recommendations_by_user ON recommendations (user_id, created_at DESC);

-- The exact citations shown to the user, frozen at decision time so the
-- history view can replay what was shown even if the library changes later.
CREATE TABLE recommendation_evidence (
  recommendation_id    uuid NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
  claim_id             uuid NOT NULL REFERENCES claims(id),
  source_id            uuid NOT NULL REFERENCES sources(id),
  verification_run_id  uuid NOT NULL REFERENCES verification_runs(id),
  verified             boolean NOT NULL,
  -- {title, authors, journal, year, doi, pmid, url, finding_summary,
  --  limitations, checks: {identifier_resolves: 'pass', ...}}
  snapshot             jsonb NOT NULL,
  PRIMARY KEY (recommendation_id, claim_id, source_id)
);

-- Raised when a later sweep finds a problem with a source an accepted
-- recommendation relied on (retraction, failed re-verification).
CREATE TABLE evidence_alerts (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id  uuid NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
  source_id          uuid NOT NULL REFERENCES sources(id),
  reason             text NOT NULL,     -- 'retracted', 'expression_of_concern', 'identifier_gone', ...
  raised_at          timestamptz NOT NULL DEFAULT now(),
  user_notified_at   timestamptz,
  resolved_at        timestamptz
);

ALTER TABLE nutrition_targets
  ADD CONSTRAINT nutrition_targets_recommendation_fk
  FOREIGN KEY (recommendation_id) REFERENCES recommendations(id);
ALTER TABLE split_versions
  ADD CONSTRAINT split_versions_recommendation_fk
  FOREIGN KEY (recommendation_id) REFERENCES recommendations(id);

-- Gate 1: 'proposed' / 'accepted' requires that the recommendation names the
-- claims it relies on, that each claim is active, and that each has at least
-- min_sources_required verified sources. Counts are recomputed from
-- recommendation_evidence, never trusted from the caller. It also requires
-- that the user has answered the health and safety questions.
CREATE FUNCTION enforce_recommendation_gate() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  weakest integer;
BEGIN
  IF NEW.status IN ('proposed', 'accepted') THEN
    IF EXISTS (
      SELECT 1
      FROM unnest(NEW.claim_ids) AS c(id)
      LEFT JOIN claims cl USING (id)
      WHERE cl.status IS DISTINCT FROM 'active'
    ) THEN
      RAISE EXCEPTION 'evidence gate: recommendation % relies on a claim that is not active', NEW.id
        USING ERRCODE = 'check_violation';
    END IF;

    SELECT min(coalesce(e.n, 0)) INTO weakest
    FROM unnest(NEW.claim_ids) AS c(claim_id)
    LEFT JOIN (
      SELECT claim_id, count(*) FILTER (WHERE verified) AS n
      FROM recommendation_evidence
      WHERE recommendation_id = NEW.id
      GROUP BY claim_id
    ) e USING (claim_id);

    IF weakest IS NULL OR weakest < NEW.min_sources_required THEN
      RAISE EXCEPTION
        'evidence gate: recommendation % has % verified source(s) for its weakest claim; % required',
        NEW.id, coalesce(weakest, 0), NEW.min_sources_required
        USING ERRCODE = 'check_violation';
    END IF;
    NEW.verified_source_count := weakest;

    -- Safety gate: the safety flags decide what may be suggested, so nothing is
    -- suggested before the user has answered the health and safety questions.
    IF NOT EXISTS (
      SELECT 1 FROM user_profiles p
      WHERE p.user_id = NEW.user_id AND p.safety_answered_at IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'safety gate: recommendation % is for a user who has not answered the health and safety questions', NEW.id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER recommendations_gate
  BEFORE INSERT OR UPDATE OF status, claim_ids ON recommendations
  FOR EACH ROW EXECUTE FUNCTION enforce_recommendation_gate();

-- Gate 2: an app-originated split version or nutrition target must point at
-- an accepted recommendation of the matching kind for the same user.
CREATE FUNCTION enforce_accepted_recommendation() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  expected_kind recommendation_kind := TG_ARGV[0]::recommendation_kind;
  row_user      uuid;
BEGIN
  IF NEW.origin <> 'app_recommendation' THEN
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'split_versions' THEN
    SELECT user_id INTO row_user FROM workout_splits WHERE id = NEW.split_id;
  ELSE
    row_user := NEW.user_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM recommendations r
    WHERE r.id = NEW.recommendation_id
      AND r.status = 'accepted'
      AND r.kind = expected_kind
      AND r.user_id = row_user
  ) THEN
    RAISE EXCEPTION
      'evidence gate: % row requires an accepted % recommendation for the same user',
      TG_TABLE_NAME, expected_kind
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER split_versions_require_accepted
  BEFORE INSERT ON split_versions
  FOR EACH ROW EXECUTE FUNCTION enforce_accepted_recommendation('split_change');
CREATE TRIGGER nutrition_targets_require_accepted
  BEFORE INSERT OR UPDATE ON nutrition_targets
  FOR EACH ROW EXECUTE FUNCTION enforce_accepted_recommendation('nutrition_target');

-- Frozen evidence rows are immutable once the recommendation has been shown.
CREATE FUNCTION forbid_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION '% is append-only', TG_TABLE_NAME USING ERRCODE = 'insufficient_privilege';
END;
$$;

CREATE TRIGGER source_checks_append_only
  BEFORE UPDATE OR DELETE ON source_checks
  FOR EACH ROW EXECUTE FUNCTION forbid_mutation();
CREATE TRIGGER recommendation_evidence_append_only
  BEFORE UPDATE ON recommendation_evidence
  FOR EACH ROW EXECUTE FUNCTION forbid_mutation();
-- Split versions are immutable snapshots; a change is a new version.
CREATE TRIGGER split_versions_immutable
  BEFORE UPDATE ON split_versions
  FOR EACH ROW EXECUTE FUNCTION forbid_mutation();

-------------------------------------------------------------------------------
-- Wearables
-------------------------------------------------------------------------------
CREATE TABLE wearable_connections (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider                 wearable_provider NOT NULL,
  status                   connection_status NOT NULL DEFAULT 'pending',
  external_user_id         text,
  scopes_granted           text[] NOT NULL DEFAULT '{}',
  -- The subset the user lets the app read and use; enforced at ingest and at
  -- recommendation time. Example: '{sleep,hrv,resting_hr,recovery}'.
  data_types_enabled       text[] NOT NULL DEFAULT '{}',
  access_token_enc         bytea,          -- NULL for apple_health (on-device only)
  refresh_token_enc        bytea,
  access_token_expires_at  timestamptz,
  token_version            integer NOT NULL DEFAULT 0, -- optimistic lock for refresh rotation
  webhook_subscriptions    jsonb NOT NULL DEFAULT '[]',
  backfill_days            smallint NOT NULL DEFAULT 30 CHECK (backfill_days BETWEEN 0 AND 365),
  last_successful_sync_at  timestamptz,
  last_error               jsonb,
  connected_at             timestamptz,
  disconnected_at          timestamptz,
  UNIQUE (user_id, provider)
);

CREATE TABLE sync_cursors (
  connection_id   uuid NOT NULL REFERENCES wearable_connections(id) ON DELETE CASCADE,
  data_type       text NOT NULL,
  cursor          text,     -- provider next_token, HealthKit anchor (base64) or updated-since
  last_synced_at  timestamptz,
  PRIMARY KEY (connection_id, data_type)
);

-- Long/narrow daily metrics. HRV is stored under the statistic the device
-- reports (hrv_rmssd_ms vs hrv_sdnn_ms) because they are not interchangeable,
-- and vendor scores keep a vendor_ prefix because they are proprietary.
CREATE TABLE wearable_daily_metrics (
  user_id           uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  local_date        date NOT NULL,
  provider          wearable_provider NOT NULL,
  metric            text NOT NULL,
  value             numeric NOT NULL,
  unit              text NOT NULL,
  source_record_id  text,
  ingested_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, local_date, provider, metric)
) PARTITION BY RANGE (local_date);
CREATE TABLE wearable_daily_metrics_default PARTITION OF wearable_daily_metrics DEFAULT;

CREATE TABLE wearable_workouts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider     wearable_provider NOT NULL,
  external_id  text NOT NULL,
  sport        text,
  started_at   timestamptz NOT NULL,
  ended_at     timestamptz NOT NULL,
  avg_hr_bpm   smallint,
  max_hr_bpm   smallint,
  energy_kcal  numeric(7,1),
  distance_m   numeric(9,1),
  vendor_load  jsonb,         -- e.g. WHOOP strain, HR zone durations
  UNIQUE (provider, external_id),
  CHECK (ended_at >= started_at)
);

-- Readiness relative to the user's own baseline, with the drivers kept so
-- the UI can show exactly which data produced it.
CREATE TABLE readiness_snapshots (
  user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  local_date     date NOT NULL,
  model_version  text NOT NULL,
  level          text NOT NULL CHECK (level IN ('normal', 'reduced', 'low', 'unknown')),
  drivers        jsonb NOT NULL, -- [{metric, provider, value, baseline_mean, baseline_sd, z, window_days}]
  PRIMARY KEY (user_id, local_date, model_version)
);

-- Raw webhook deliveries; processed asynchronously and idempotently.
CREATE TABLE webhook_inbox (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider           wearable_provider NOT NULL,
  provider_event_id  text NOT NULL,
  received_at        timestamptz NOT NULL DEFAULT now(),
  signature_valid    boolean NOT NULL,
  payload            jsonb NOT NULL,     -- thin notifications: ids and types, no health values
  processed_at       timestamptz,
  UNIQUE (provider, provider_event_id)
);

-------------------------------------------------------------------------------
-- Privacy requests and tamper-evident audit log
-------------------------------------------------------------------------------
CREATE TABLE privacy_requests (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL,      -- no FK: outlives the user for deletion receipts
  kind               text NOT NULL CHECK (kind IN ('export', 'deletion')),
  status             text NOT NULL
                       CHECK (status IN ('queued', 'running', 'ready', 'completed', 'failed', 'cancelled')),
  requested_at       timestamptz NOT NULL DEFAULT now(),
  scheduled_for      timestamptz,        -- end of the deletion grace period
  completed_at       timestamptz,
  export_object_key  text,
  export_expires_at  timestamptz,
  detail             jsonb NOT NULL DEFAULT '{}'
);

-- Append-only, hash-chained. Payloads carry ids, statuses and versions,
-- never health values, so the log can be retained after account deletion.
CREATE TABLE audit_events (
  seq              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  occurred_at      timestamptz NOT NULL DEFAULT clock_timestamp(),
  actor            text NOT NULL,        -- 'user:<id>', 'system:<service>', 'admin:<id>'
  subject_user_id  uuid,                 -- no FK, see above
  action           text NOT NULL,        -- 'recommendation.gate_decided', 'data.exported', ...
  entity_type      text NOT NULL,
  entity_id        uuid,
  payload          jsonb NOT NULL DEFAULT '{}',
  prev_hash        bytea,
  entry_hash       bytea NOT NULL
);

CREATE FUNCTION chain_audit_event() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  -- Serialise writers so each entry chains from the true predecessor.
  PERFORM pg_advisory_xact_lock(hashtext('app.audit_events'));
  SELECT entry_hash INTO NEW.prev_hash FROM audit_events ORDER BY seq DESC LIMIT 1;
  NEW.entry_hash := sha256(
    coalesce(NEW.prev_hash, '\x'::bytea) ||
    convert_to(
      concat_ws('|', extract(epoch FROM NEW.occurred_at)::text, NEW.actor, coalesce(NEW.subject_user_id::text, ''),
                NEW.action, NEW.entity_type, coalesce(NEW.entity_id::text, ''), NEW.payload::text),
      'UTF8'));
  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_events_chain
  BEFORE INSERT ON audit_events
  FOR EACH ROW EXECUTE FUNCTION chain_audit_event();
CREATE TRIGGER audit_events_append_only
  BEFORE UPDATE OR DELETE ON audit_events
  FOR EACH ROW EXECUTE FUNCTION forbid_mutation();

-------------------------------------------------------------------------------
-- Row-level security: the API sets app.current_user_id per transaction.
-- Applies to every table that carries a user_id column.
-------------------------------------------------------------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables tb
      ON tb.table_schema = c.table_schema AND tb.table_name = c.table_name
    WHERE c.table_schema = 'app'
      AND c.column_name = 'user_id'
      AND tb.table_type = 'BASE TABLE'
      AND c.table_name NOT IN ('privacy_requests')
      AND c.table_name NOT LIKE 'wearable_daily_metrics\_%'
  LOOP
    EXECUTE format('ALTER TABLE app.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY owner_only ON app.%I USING (user_id = current_setting(''app.current_user_id'', true)::uuid)',
      t);
  END LOOP;
END;
$$;

-- Shared catalogue rows are visible to everyone; private foods (custom foods,
-- confirmed ingredient scans) only to their owner.
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY shared_or_owner ON food_items
  USING (owner_user_id IS NULL
         OR owner_user_id = current_setting('app.current_user_id', true)::uuid);

COMMIT;
