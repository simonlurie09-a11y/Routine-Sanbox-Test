-- Tests for schema.sql: evidence gate, immutability, audit hash chain, row-level
-- security, crypto-shred invariant and deletion cascade.
-- Run against a THROWAWAY database after loading schema.sql (creates role app_api if missing):
--   psql -d ntc_test -v ON_ERROR_STOP=1 -f schema/schema_test.sql
-- Expected last line: NOTICE:  ALL SCHEMA TESTS PASSED

\set ON_ERROR_STOP 1
SET search_path = app, public;

CREATE SCHEMA t;
CREATE FUNCTION t.expect_error(stmt text, pattern text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    EXECUTE stmt;
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM ~ pattern THEN
      RAISE NOTICE 'PASS (rejected as expected): %', left(SQLERRM, 110);
      RETURN;
    END IF;
    RAISE EXCEPTION 'FAIL: wrong error for [%]: %', stmt, SQLERRM;
  END;
  RAISE EXCEPTION 'FAIL: statement succeeded but should have been rejected: %', stmt;
END $$;

-- Fixtures -------------------------------------------------------------------
INSERT INTO users (id, auth_subject) VALUES
  ('00000000-0000-0000-0000-00000000000a', 'sub-a'),
  ('00000000-0000-0000-0000-00000000000b', 'sub-b');
INSERT INTO user_profiles (user_id, safety_answered_at) VALUES
  ('00000000-0000-0000-0000-00000000000a', now()),
  ('00000000-0000-0000-0000-00000000000b', now());

INSERT INTO claims (id, key, version, statement, applies_to, status, reviewed_by, reviewed_at) VALUES
  ('10000000-0000-0000-0000-000000000001', 'hypertrophy.volume.raise_low_weekly_sets', 1,
   'Raising weekly hard sets for a muscle trained with low volume is associated with greater hypertrophy.',
   '{"goals":["muscle_gain"]}', 'active', 'editor-1', now()),
  ('10000000-0000-0000-0000-000000000002', 'recovery.frequency.48h_between_same_muscle', 1,
   'placeholder second claim', '{}', 'active', 'editor-1', now());

-- An active claim without a reviewer is rejected.
SELECT t.expect_error($$INSERT INTO claims (key, version, statement, applies_to, status)
  VALUES ('x', 1, 'x', '{}', 'active')$$, 'claims_check');

INSERT INTO sources (id, doi, pmid, title, authors, canonical_url, metadata_fetched_at, metadata_hash) VALUES
  ('20000000-0000-0000-0000-000000000001', '10.1519/jsc.0b013e3181d4d436', '20300012', 'S1', '[]', 'https://pubmed.ncbi.nlm.nih.gov/20300012/', now(), 'h1'),
  ('20000000-0000-0000-0000-000000000002', '10.1080/02640414.2016.1210197', NULL, 'S2', '[]', 'https://doi.org/10.1080/02640414.2016.1210197', now(), 'h2'),
  ('20000000-0000-0000-0000-000000000003', '10.2478/hukin-2022-0017', '35291645', 'S3', '[]', 'https://pubmed.ncbi.nlm.nih.gov/35291645/', now(), 'h3'),
  ('20000000-0000-0000-0000-000000000004', '10.0000/unverifiable', NULL, 'S4', '[]', 'https://doi.org/10.0000/unverifiable', now(), 'h4');

-- Mixed-case DOI is rejected (DOIs are stored lower-cased for matching).
SELECT t.expect_error($$INSERT INTO sources (doi, title, authors, canonical_url, metadata_fetched_at, metadata_hash)
  VALUES ('10.1080/ABC', 'x', '[]', 'u', now(), 'h')$$, 'sources_doi_check');

INSERT INTO verification_runs (id, trigger, pipeline_version)
  VALUES ('30000000-0000-0000-0000-000000000001', 'recommendation', 'pipeline-1');

INSERT INTO recommendations (id, user_id, kind, trigger, intent, proposed_change, claim_ids, drivers, rationale,
                             engine_version, disclaimer_version)
VALUES ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'split_change',
        'user_request', '{"type":"develop_muscle","muscle":"lats"}', '[]',
        '{10000000-0000-0000-0000-000000000001}', '[]', 'r', 'engine-1', 'disc-1');

-- 1. No evidence at all: cannot be proposed.
SELECT t.expect_error($$UPDATE recommendations SET status = 'proposed'
  WHERE id = '40000000-0000-0000-0000-000000000001'$$, 'evidence gate: .* has 0 verified');

-- 2. Two verified + one unverified source: still blocked.
INSERT INTO recommendation_evidence VALUES
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', true,  '{}'),
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', true,  '{}'),
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000001', false, '{}');
SELECT t.expect_error($$UPDATE recommendations SET status = 'proposed'
  WHERE id = '40000000-0000-0000-0000-000000000001'$$, 'has 2 verified source');

-- 3. Inserting directly as 'proposed' is also gated.
SELECT t.expect_error($$INSERT INTO recommendations (user_id, kind, status, trigger, intent, proposed_change, drivers,
  rationale, engine_version, disclaimer_version) VALUES ('00000000-0000-0000-0000-00000000000a', 'split_change',
  'proposed', 'user_request', '{}', '[]', '[]', 'r', 'e', 'd')$$, 'evidence gate');

-- 4. The minimum cannot be configured below 3.
SELECT t.expect_error($$UPDATE recommendations SET min_sources_required = 2
  WHERE id = '40000000-0000-0000-0000-000000000001'$$, 'min_sources_required_check');

-- 5. Third verified source: passes, and the trigger records the count.
INSERT INTO recommendation_evidence VALUES
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', true, '{}');
UPDATE recommendations SET status = 'proposed' WHERE id = '40000000-0000-0000-0000-000000000001';
DO $$ BEGIN
  ASSERT (SELECT verified_source_count FROM recommendations
          WHERE id = '40000000-0000-0000-0000-000000000001') = 3, 'count should be 3';
  RAISE NOTICE 'PASS: proposed with 3 verified sources';
END $$;

-- 5b. Not before the health and safety questions are answered: the same change
--     is blocked while safety_answered_at is NULL, and passes once it is set.
UPDATE recommendations SET status = 'draft' WHERE id = '40000000-0000-0000-0000-000000000001';
UPDATE user_profiles SET safety_answered_at = NULL WHERE user_id = '00000000-0000-0000-0000-00000000000a';
SELECT t.expect_error($$UPDATE recommendations SET status = 'proposed'
  WHERE id = '40000000-0000-0000-0000-000000000001'$$, 'safety gate: .* has not answered');
UPDATE user_profiles SET safety_answered_at = now() WHERE user_id = '00000000-0000-0000-0000-00000000000a';
UPDATE recommendations SET status = 'proposed' WHERE id = '40000000-0000-0000-0000-000000000001';

-- 6. Every named claim must clear the bar: a second claim with only 1 source
--    blocks it, and so does a named claim with no evidence rows at all.
UPDATE recommendations SET status = 'draft' WHERE id = '40000000-0000-0000-0000-000000000001';
INSERT INTO recommendation_evidence VALUES
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', true, '{}');
SELECT t.expect_error($$UPDATE recommendations SET status = 'proposed', claim_ids =
  '{10000000-0000-0000-0000-000000000001,10000000-0000-0000-0000-000000000002}'
  WHERE id = '40000000-0000-0000-0000-000000000001'$$, 'has 1 verified source');
DELETE FROM recommendation_evidence
  WHERE recommendation_id = '40000000-0000-0000-0000-000000000001'
    AND claim_id = '10000000-0000-0000-0000-000000000002';
SELECT t.expect_error($$UPDATE recommendations SET status = 'proposed', claim_ids =
  '{10000000-0000-0000-0000-000000000001,10000000-0000-0000-0000-000000000002}'
  WHERE id = '40000000-0000-0000-0000-000000000001'$$, 'has 0 verified source');
-- A claim that is suspended (e.g. after a retraction sweep) blocks it too.
UPDATE claims SET status = 'suspended' WHERE id = '10000000-0000-0000-0000-000000000001';
SELECT t.expect_error($$UPDATE recommendations SET status = 'proposed'
  WHERE id = '40000000-0000-0000-0000-000000000001'$$, 'not active');
UPDATE claims SET status = 'active' WHERE id = '10000000-0000-0000-0000-000000000001';
UPDATE recommendations SET status = 'proposed' WHERE id = '40000000-0000-0000-0000-000000000001';

-- 7. Frozen evidence cannot be edited.
SELECT t.expect_error($$UPDATE recommendation_evidence SET verified = true
  WHERE source_id = '20000000-0000-0000-0000-000000000004'$$, 'append-only');

-- 8. App-originated split version needs an *accepted* recommendation.
INSERT INTO workout_splits (id, user_id, name) VALUES
  ('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'PPL');
INSERT INTO split_versions (id, split_id, version_no, style, definition, weekly_volume, origin)
  VALUES ('60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 1,
          'hypertrophy', '{"days":[]}', '{}', 'user_edit');
SELECT t.expect_error($$INSERT INTO split_versions (split_id, version_no, parent_version_id, style, definition,
  weekly_volume, origin, recommendation_id) VALUES ('50000000-0000-0000-0000-000000000001', 2,
  '60000000-0000-0000-0000-000000000001', 'hypertrophy', '{}', '{}', 'app_recommendation',
  '40000000-0000-0000-0000-000000000001')$$, 'requires an accepted split_change');
SELECT t.expect_error($$INSERT INTO split_versions (split_id, version_no, parent_version_id, style, definition,
  weekly_volume, origin) VALUES ('50000000-0000-0000-0000-000000000001', 2,
  '60000000-0000-0000-0000-000000000001', 'hypertrophy', '{}', '{}', 'app_recommendation')$$, 'split_versions_check|requires an accepted');

UPDATE recommendations SET status = 'accepted', decided_at = now()
  WHERE id = '40000000-0000-0000-0000-000000000001';
INSERT INTO split_versions (split_id, version_no, parent_version_id, style, definition, weekly_volume,
  origin, recommendation_id) VALUES ('50000000-0000-0000-0000-000000000001', 2,
  '60000000-0000-0000-0000-000000000001', 'hypertrophy', '{}', '{}', 'app_recommendation',
  '40000000-0000-0000-0000-000000000001');
DO $$ BEGIN RAISE NOTICE 'PASS: app-originated version accepted after recommendation accepted'; END $$;

-- 9. Versions are immutable.
SELECT t.expect_error($$UPDATE split_versions SET change_note = 'x'
  WHERE id = '60000000-0000-0000-0000-000000000001'$$, 'append-only');

-- 10. Wrong kind and wrong user are both rejected for nutrition targets.
SELECT t.expect_error($$INSERT INTO nutrition_targets (user_id, energy_kcal, effective_from, origin, recommendation_id)
  VALUES ('00000000-0000-0000-0000-00000000000a', 2400, current_date, 'app_recommendation',
  '40000000-0000-0000-0000-000000000001')$$, 'requires an accepted nutrition_target');
INSERT INTO nutrition_targets (user_id, energy_kcal, effective_from, origin)
  VALUES ('00000000-0000-0000-0000-00000000000a', 2400, current_date, 'user_edit');
DO $$ BEGIN RAISE NOTICE 'PASS: user-entered target needs no recommendation'; END $$;

INSERT INTO workout_splits (id, user_id, name) VALUES
  ('50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-00000000000b', 'B split');
INSERT INTO split_versions (id, split_id, version_no, style, definition, weekly_volume, origin)
  VALUES ('60000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', 1,
          'strength', '{}', '{}', 'user_edit');
SELECT t.expect_error($$INSERT INTO split_versions (split_id, version_no, parent_version_id, style, definition,
  weekly_volume, origin, recommendation_id) VALUES ('50000000-0000-0000-0000-000000000002', 2,
  '60000000-0000-0000-0000-000000000002', 'strength', '{}', '{}', 'app_recommendation',
  '40000000-0000-0000-0000-000000000001')$$, 'same user');

-- 11. Audit log: hash chain verifies, and rows cannot be changed.
INSERT INTO audit_events (actor, subject_user_id, action, entity_type, entity_id, payload) VALUES
  ('system:gate', '00000000-0000-0000-0000-00000000000a', 'recommendation.gate_decided', 'recommendation',
   '40000000-0000-0000-0000-000000000001', '{"status":"proposed","verified":3}');
INSERT INTO audit_events (actor, subject_user_id, action, entity_type, entity_id, payload) VALUES
  ('user:a', '00000000-0000-0000-0000-00000000000a', 'recommendation.accepted', 'recommendation',
   '40000000-0000-0000-0000-000000000001', '{}');
INSERT INTO audit_events (actor, action, entity_type, payload) VALUES
  ('system:sweep', 'evidence.reverified', 'verification_run', '{"sources":3}');

DO $$
DECLARE r record; prev bytea := NULL; expected bytea; n int := 0;
BEGIN
  FOR r IN SELECT * FROM audit_events ORDER BY seq LOOP
    ASSERT r.prev_hash IS NOT DISTINCT FROM prev, 'prev_hash link broken at seq ' || r.seq;
    expected := sha256(coalesce(prev, '\x'::bytea) || convert_to(concat_ws('|',
      extract(epoch FROM r.occurred_at)::text, r.actor, coalesce(r.subject_user_id::text, ''),
      r.action, r.entity_type, coalesce(r.entity_id::text, ''), r.payload::text), 'UTF8'));
    ASSERT r.entry_hash = expected, 'entry_hash mismatch at seq ' || r.seq;
    prev := r.entry_hash; n := n + 1;
  END LOOP;
  RAISE NOTICE 'PASS: audit chain of % entries recomputes', n;
END $$;
SELECT t.expect_error($$UPDATE audit_events SET actor = 'x' WHERE seq = 1$$, 'append-only');
SELECT t.expect_error($$DELETE FROM audit_events WHERE seq = 1$$, 'append-only');

-- 12. Row-level security for a non-owner API role.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_api') THEN
    CREATE ROLE app_api NOLOGIN;
  END IF;
END $$;
GRANT USAGE ON SCHEMA app TO app_api;
GRANT SELECT ON ALL TABLES IN SCHEMA app TO app_api;
INSERT INTO food_items (source, name, nutrients_per_100, data_license, owner_user_id) VALUES
  ('user_custom', 'A private food', '{}', 'user', '00000000-0000-0000-0000-00000000000a'),
  ('user_custom', 'B private food', '{}', 'user', '00000000-0000-0000-0000-00000000000b');
INSERT INTO food_items (source, source_ref, name, nutrients_per_100, data_license) VALUES
  ('open_food_facts', '3017624010006', 'Shared food', '{}', 'ODbL-1.0');
INSERT INTO wearable_daily_metrics (user_id, local_date, provider, metric, value, unit) VALUES
  ('00000000-0000-0000-0000-00000000000a', current_date, 'oura', 'hrv_rmssd_ms', 52, 'ms'),
  ('00000000-0000-0000-0000-00000000000b', current_date, 'apple_health', 'hrv_sdnn_ms', 61, 'ms');

BEGIN;
SET LOCAL ROLE app_api;
SELECT set_config('app.current_user_id', '00000000-0000-0000-0000-00000000000a', true);
DO $$ BEGIN
  ASSERT (SELECT count(*) FROM workout_splits) = 1, 'user A should see 1 split';
  ASSERT (SELECT count(*) FROM recommendations) = 1, 'user A should see 1 recommendation';
  ASSERT (SELECT count(*) FROM food_items) = 2, 'user A sees shared + own private food';
  ASSERT (SELECT count(*) FROM wearable_daily_metrics) = 1, 'user A sees own metrics only';
  ASSERT (SELECT count(*) FROM claims) = 2, 'global evidence library is readable';
  RAISE NOTICE 'PASS: RLS scopes user A';
END $$;
SELECT set_config('app.current_user_id', '00000000-0000-0000-0000-00000000000b', true);
DO $$ BEGIN
  ASSERT (SELECT count(*) FROM recommendations) = 0, 'user B must not see A''s recommendation';
  ASSERT (SELECT count(*) FROM food_items WHERE name LIKE 'A %') = 0, 'user B must not see A''s food';
  RAISE NOTICE 'PASS: RLS hides user A rows from user B';
END $$;
ROLLBACK;

-- 13. Crypto-shred invariant: key and destroyed_at move together.
INSERT INTO user_keys (user_id, kms_key_arn, wrapped_dek)
  VALUES ('00000000-0000-0000-0000-00000000000a', 'arn:aws:kms:region:acct:key/x', '\x01');
SELECT t.expect_error($$UPDATE user_keys SET wrapped_dek = NULL
  WHERE user_id = '00000000-0000-0000-0000-00000000000a'$$, 'user_keys_check');
UPDATE user_keys SET wrapped_dek = NULL, destroyed_at = now()
  WHERE user_id = '00000000-0000-0000-0000-00000000000a';
DO $$ BEGIN RAISE NOTICE 'PASS: key destroyed together with destroyed_at'; END $$;

-- 14. Deleting a user cascades personal rows; audit log survives.
DELETE FROM users WHERE id = '00000000-0000-0000-0000-00000000000a';
DO $$ BEGIN
  ASSERT (SELECT count(*) FROM recommendations) = 0, 'recommendations should cascade';
  ASSERT (SELECT count(*) FROM wearable_daily_metrics WHERE user_id = '00000000-0000-0000-0000-00000000000a') = 0;
  ASSERT (SELECT count(*) FROM audit_events) = 3, 'audit log is retained';
  ASSERT (SELECT count(*) FROM sources) = 4, 'global library untouched';
  RAISE NOTICE 'PASS: user deletion cascades, audit and library retained';
END $$;

DO $$ BEGIN RAISE NOTICE 'ALL SCHEMA TESTS PASSED'; END $$;
