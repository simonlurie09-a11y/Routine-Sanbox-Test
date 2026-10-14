/* Companion prototype — Today tab (builder B).
   The dashboard: the one screen with a fixed, non-collapsing hero (docs/08 §8.5),
   nutrition and training gauges, readiness, pending suggestions and data sources.
   Also defines C.readinessKit, the small readiness helpers shared with
   55-recovery.js (both files are builder B's and always ship together). */
(function () {
  'use strict';

  const C = window.Companion;
  const { html, T, Card, CardFooter, Button, StatGauge, Section, Sections, Rows, Badge, Caption, Callout,
          CardTitle, LinkButton, Glyph, SettingsButton, BellButton } = C.ui;
  const M = C.domain, D = C.data, A = C.actions, S = C.selectors;

  /* ------------------------------------------------- readiness helpers */
  /* Device order for lists: the readiness sources first, as in the mockup. */
  const DEVICE_ORDER = ['oura', 'apple_health', 'whoop', 'google_health'];
  /* The data types readiness can use (docs/07 §7.8). */
  const READINESS_TYPES = ['hrv', 'resting_hr', 'sleep'];

  const providerName = (p) => D.PROVIDERS[p].name;
  const typeLabel = (t) => D.DATA_TYPE_LABELS[t];
  const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1);
  const isToday = (ts) => ts >= D.startOfToday() && ts < D.startOfToday() + D.DAY;

  /* "today at 07:12", "yesterday at 06:40", "9 Oct at 06:40" */
  function whenText(ts) {
    const day = M.fmt.relativeDay(ts);
    return `${day === 'Today' || day === 'Yesterday' ? day.toLowerCase() : day} at ${M.fmt.time(ts)}`;
  }

  /* Readiness data types a connected device has switched off. */
  function offTypes(provider, dev) {
    if (!dev || dev.status === 'revoked') return [];
    return READINESS_TYPES.filter((t) => D.PROVIDERS[provider].dataTypes.includes(t) && !dev.dataTypes[t]);
  }

  /* One plain line per device: last sync, and a note when a data type is off.
     The connection badge beside it carries the status word. */
  function syncLine(provider, dev) {
    if (!dev || dev.status === 'revoked') return 'Not connected';
    if (dev.status === 'pending') return 'Connecting';
    const last = dev.lastSync ? whenText(dev.lastSync) : null;
    let line;
    if (dev.status === 'active') line = last ? `Synced ${last}` : 'Not synced yet';
    else line = last ? `Last synced ${last}` : 'Not synced yet';
    const off = offTypes(provider, dev);
    if (off.length && dev.status === 'active') {
      line += `. ${M.capitalise(M.listJoin(off.map((t) => lower(typeLabel(t)))))} ${off.length > 1 ? 'are' : 'is'} switched off`;
    }
    return line;
  }

  /* Rows for the device list. includeRevoked: false hides devices that were never connected. */
  function deviceRows(s, includeRevoked) {
    const rows = DEVICE_ORDER.filter((p) => s.devices[p] && (includeRevoked || s.devices[p].status !== 'revoked')).map((p) => ({
      key: p,
      label: providerName(p),
      detail: syncLine(p, s.devices[p]),
      right: html`<${Badge} palette="connection" status=${s.devices[p].status} />`,
      onPress: () => A.push('device', { provider: p })
    }));
    if (!rows.length) {
      rows.push({ key: 'connect', label: 'Connect a device', color: 'primary', onPress: () => A.push('devices') });
    }
    return rows;
  }

  /* When readiness is unknown: which data is missing, in one plain sentence. */
  function missingReadinessText(s) {
    const names = (list) => M.listJoin(list.map((p) => D.PROVIDERS[p].short));
    const verb = (list) => (list.length > 1 ? 'are' : 'is');
    const active = DEVICE_ORDER.filter((p) => s.devices[p] && s.devices[p].status === 'active');
    if (!active.length) {
      const waiting = DEVICE_ORDER.filter((p) => s.devices[p] && ['needs_reauth', 'paused', 'error', 'pending'].includes(s.devices[p].status));
      if (waiting.length) {
        return `No device is sharing sleep, heart rate variability or resting heart rate right now. ${names(waiting)} ${verb(waiting)} connected but not syncing.`;
      }
      return 'No device is sharing sleep, heart rate variability or resting heart rate. Connect one to see your readiness.';
    }
    const allOff = active.filter((p) => offTypes(p, s.devices[p]).length === READINESS_TYPES.filter((t) => D.PROVIDERS[p].dataTypes.includes(t)).length);
    const rest = active.filter((p) => !allOff.includes(p));
    if (!rest.length) {
      return `${names(allOff)} ${verb(allOff)} connected, but sleep, heart rate variability and resting heart rate are switched off.`;
    }
    const noData = `${names(rest)} ${rest.length > 1 ? "haven't" : "hasn't"} sent enough nights`;
    if (!allOff.length) return `${noData} of sleep, heart rate variability or resting heart rate to set your baseline yet.`;
    return `${names(allOff)} ${allOff.length > 1 ? 'have' : 'has'} sleep, heart rate variability and resting heart rate switched off, and ${noData} to set your baseline yet.`;
  }

  /* "From Oura, last night. Synced at 07:12." */
  function sourceLine(r) {
    if (!r.provider) return null;
    if (r.syncedAt && isToday(r.syncedAt)) return `From ${r.providerName}, last night. Synced at ${M.fmt.time(r.syncedAt)}.`;
    return r.syncedAt ? `From ${r.providerName}. Last synced ${whenText(r.syncedAt)}.` : `From ${r.providerName}.`;
  }

  /* Keep a unit on the same line as its number ("51 ± 4 ms"). */
  const keepUnits = (str) => String(str).replace(/ (ms|bpm|min|kcal|g)\b/g, '\u00a0$1').replace(/ ± /g, '\u00a0±\u00a0');

  /* A vendor's own score, always under the vendor's name. */
  const vendorValue = (v) => `${M.fmt.int(v.value)}${v.unit === '%' ? '%' : v.unit ? ` ${v.unit}` : ''}`;

  const LEVEL_TEXT = {
    normal: "Last night's numbers are within your usual range.",
    reduced: "Some of last night's numbers are outside your usual range.",
    low: "Last night's numbers are well outside your usual range."
  };

  C.readinessKit = {
    DEVICE_ORDER, READINESS_TYPES, whenText, offTypes, syncLine, deviceRows, missingReadinessText, sourceLine,
    vendorValue, LEVEL_TEXT, isToday, keepUnits
  };

  /* ------------------------------------------------------------ gauges */
  const kcalText = (v) => M.fmt.kcal(v);
  const gramText = (v) => `${M.fmt.int(v)} g`;

  /* Over target, the value says how much over; the gauge stays primary and full. */
  function nutrientGauge(key, name, totals, targets, unit) {
    const total = totals[key] || 0;
    const target = targets ? targets[key] : null;
    const fmtV = unit === 'kcal' ? kcalText : gramText;
    if (!target) return { key, value: fmtV(total), label: `${name}, no target set`, pct: 0 };
    const over = Math.round(total) - Math.round(target);
    return {
      key,
      value: over > 0 ? `${fmtV(total)}, ${M.fmt.int(over)}\u00a0over` : fmtV(total),
      label: `${name}, of ${unit === 'kcal' ? M.fmt.int(target) : gramText(target)}`,
      pct: Math.min(1, total / target)
    };
  }

  /* Muscle groups in the mockup's order, with the singular the labels use. */
  const GROUPS = ['Back', 'Chest', 'Legs', 'Shoulders', 'Arms', 'Core'];
  const GROUP_LABEL = { Back: 'Back', Chest: 'Chest', Legs: 'Leg', Shoulders: 'Shoulder', Arms: 'Arm', Core: 'Core' };

  function greetingFor(hour) {
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  /* --------------------------------------------------------- sections */
  function NutritionSection({ s }) {
    const totals = S.todayTotals(s);
    const entries = S.todayEntries(s);
    const estimates = entries.filter((e) => e.confidence !== 'high').length;
    const sessions = S.weekSessions(s).length;
    const planned = S.currentDefinition(s).days.length;
    const gauges = [
      nutrientGauge('energyKcal', 'Calories', totals, s.targets, 'kcal'),
      nutrientGauge('proteinG', 'Protein', totals, s.targets, 'g'),
      nutrientGauge('carbohydrateG', 'Carbs', totals, s.targets, 'g'),
      nutrientGauge('fatG', 'Fat', totals, s.targets, 'g'),
      nutrientGauge('fiberG', 'Fibre', totals, s.targets, 'g'),
      { key: 'workouts', value: `${sessions} of ${planned}`, label: 'Workouts, last 7 days', pct: planned ? Math.min(1, sessions / planned) : 0 }
    ];
    const addFood = () => ((C.flows && C.flows.openAddFood) ? C.flows.openAddFood() : A.go('food'));
    return html`<section className="stack-sm" aria-label="Today's food">
      <div className="grid2">
        ${gauges.map((g) => html`<${StatGauge} key=${g.key} value=${g.value} label=${g.label} pct=${g.pct} />`)}
      </div>
      ${!entries.length
        ? html`<${Caption}>Nothing logged yet today.<//>`
        : estimates
          ? html`<div className="row row--wrap">
              <${Caption}>${estimates === 1
                ? `1 of today's ${entries.length} entries is an estimate.`
                : `${estimates} of today's ${entries.length} entries are estimates.`}<//>
              <${LinkButton} label="Review" size="caption" onPress=${() => A.go('food')} />
            </div>`
          : null}
      <div className="actions">
        <${Button} variant="outline" fullWidth=${true} leftIcon="plus" label="Add food" onPress=${addFood} />
      </div>
    </section>`;
  }

  function ReadinessCard({ s }) {
    const r = M.readiness(s);
    if (r.level === 'unknown') {
      const anyActive = Object.values(s.devices).some((d) => d.status !== 'revoked');
      return html`<${Card}>
        <div className="row row--between">
          <${CardTitle}>Readiness<//>
          <${Badge} palette="readiness" status="unknown" />
        </div>
        <${Callout}>${missingReadinessText(s)}<//>
        <${LinkButton} align="flex-start" label=${anyActive ? 'Choose what your devices share' : 'Connect a device'}
          onPress=${() => A.push('devices')} />
      <//>`;
    }
    return html`<${Card} onPress=${() => A.go('recovery')}>
      <div className="row row--between">
        <${CardTitle}>Readiness<//>
        <${Badge} palette="readiness" status=${r.level} />
      </div>
      <ul className="facts">
        ${r.drivers.map((d) => html`<li key=${d.metric}>
          <${T} size="callout" className="tabular" style=${{ flex: 'none' }}>${d.text.value}<//>
          <${T} size="callout" color="inkMuted80" align="right" className="tabular">${keepUnits(d.text.context)}<//>
        </li>`)}
        ${r.vendor.map((v) => html`<li key=${v.label}>
          <${T} size="callout" color="inkMuted80">${v.label}<//>
          <${T} size="callout" className="tabular">${vendorValue(v)}<//>
        </li>`)}
      </ul>
      <${CardFooter}>
        <${Caption}>${sourceLine(r)}<//>
        <${Glyph} name="chevron.right" size=${18} color="inkMuted48" />
      <//>
    <//>`;
  }

  function TrainingSection({ s }) {
    const planned = M.groupVolume(M.weeklyVolume(S.currentDefinition(s)));
    const done = M.groupVolume(S.weekDoneVolume(s));
    const groups = GROUPS.filter((g) => Math.round(planned[g] || 0) > 0 || Math.round(done[g] || 0) > 0);
    return html`<${Section} title="Training this week" caption="Sets done in the last 7 days, of the sets in your plan.">
      <div className="grid2">
        ${groups.map((g) => {
          const p = Math.round(planned[g] || 0);
          const d = Math.round(done[g] || 0);
          return html`<${StatGauge} key=${g} value=${`${d} of ${p}`} label=${`${GROUP_LABEL[g]} sets`} pct=${p ? Math.min(1, d / p) : 0} />`;
        })}
      </div>
    <//>`;
  }

  /* Count only sources the gate still accepts as verified. */
  function verifiedCount(rec) {
    return (rec.sourceIds || []).map(M.sourceById).filter(Boolean).filter(M.isVerified).length;
  }

  function SuggestionCard({ s, rec }) {
    const n = verifiedCount(rec);
    const studies = `${n} verified ${n === 1 ? 'study' : 'studies'}`;
    const fromReview = rec.trigger === 'split_review' || (rec.intent && rec.intent.source === 'split_review');
    const next = Math.max(...s.split.versions.map((v) => v.number)) + 1;
    return html`<${Card} onPress=${() => A.push('recommendation', { id: rec.id })}>
      <div className="row"><${Badge} palette="recommendation" status="proposed" /></div>
      <${CardTitle}>${rec.title}<//>
      <${Callout}>${fromReview ? `From your split review, backed by ${studies}.` : `From your request, backed by ${studies}.`}<//>
      <${CardFooter}>
        <${Caption}>${rec.kind === 'target_change' ? 'Your daily targets' : `Split version ${rec.fromVersion != null ? rec.fromVersion : s.split.current} to ${next}`}<//>
        <${Glyph} name="chevron.right" size=${18} color="inkMuted48" />
      <//>
    <//>`;
  }

  function SuggestionsSection({ s }) {
    const proposed = s.recommendations.filter((r) => r.status === 'proposed');
    return html`<${Section} title="Suggestions">
      ${proposed.length
        ? html`<div className="stack-sm">${proposed.map((rec) => html`<${SuggestionCard} key=${rec.id} s=${s} rec=${rec} />`)}</div>`
        : html`<${Card}>
            <${CardTitle}>Want to change your training?<//>
            <${Callout}>Tell us what you'd like in your own words. We only suggest a change when 3 verified studies back it.<//>
            <${LinkButton} align="flex-start" label="Ask for a change" onPress=${() => A.present('change-request', {}, 'sheet')} />
          <//>`}
    <//>`;
  }

  /* -------------------------------------------------------------- screen */
  function Today() {
    const s = C.useApp();
    const now = Date.now();
    const first = (s.profile && s.profile.name ? s.profile.name.trim().split(/\s+/)[0] : '');
    const greeting = greetingFor(new Date(now).getHours());
    return html`<div className="screen">
      <header className="row row--between" style=${{ padding: 'var(--spacing-sm) var(--spacing-xl) var(--spacing-base)' }}>
        <div className="stack-xs grow">
          <${T} size="title3" font="bold" as="h1">${first ? `${greeting}, ${first}` : greeting}<//>
          <${T} size="body" color="inkMuted48" as="p">${M.fmt.weekdayLong(now)}<//>
        </div>
        <div className="row" style=${{ gap: 'var(--spacing-base)' }}>
          <${SettingsButton} />
          <${BellButton} />
        </div>
      </header>
      <div className="gutter" style=${{ flex: 1, minHeight: 0, overflowY: 'auto', paddingBottom: 'var(--spacing-xxl)' }}>
        <${Sections}>
          <${C.setup.SetupCard} />
          <${NutritionSection} s=${s} />
          <${Section} title="Recovery"><${ReadinessCard} s=${s} /><//>
          <${TrainingSection} s=${s} />
          <${SuggestionsSection} s=${s} />
          <${Section} title="Data sources"><${Rows} rows=${deviceRows(s, false)} /><//>
        <//>
      </div>
    </div>`;
  }

  C.registerScreen('today', Today, {
    title: 'Today', tab: 'today', presentation: 'tab', demoParams: {}
  });
})();
