/* Companion prototype — Recovery tab and the readiness explainer (builder B).
   Readiness compares each device with its own 28-night baseline (10-domain.js,
   M.readiness). Recovery-driven training changes go through the evidence gate
   (M.evaluateRecoveryAdjustment); their claim is a draft, so nothing changes.
   Uses C.readinessKit from 50-today.js (same builder, loads first). */
(function () {
  'use strict';

  const C = window.Companion;
  const { html, T, Card, Screen, Section, Sections, Facts, Rows, Badge, Caption, Callout, CardTitle,
          LinkButton, Glyph, DisclaimerBand } = C.ui;
  const M = C.domain, D = C.data, A = C.actions, S = C.selectors;
  const K = C.readinessKit;

  const CLAIM_KEY = 'recovery.hrv_guided_lifting_volume';
  const HRV_METRICS = ['hrv_rmssd_ms', 'hrv_sdnn_ms'];
  const COLUMN_ORDER = ['hrv_rmssd_ms', 'hrv_sdnn_ms', 'resting_hr_bpm', 'sleep_total_min'];
  const COLUMN_LABEL = { hrv_rmssd_ms: 'HRV', hrv_sdnn_ms: 'HRV', resting_hr_bpm: 'Resting HR', sleep_total_min: 'Sleep' };

  /* One metric value in its own unit: "44 ms", "54 bpm", "6 h 10 min". */
  function metricValue(metric, v) {
    if (metric === 'sleep_total_min') return M.fmt.minutes(v);
    if (metric === 'resting_hr_bpm') return `${Math.round(v)} bpm`;
    return `${Math.round(v)} ms`;
  }
  /* Baseline as mean ± sd in the metric's unit. */
  function baselineValue(d) {
    if (d.metric === 'sleep_total_min') return `${M.fmt.minutes(d.mean)} ± ${Math.round(d.sd)} min`;
    return `${Math.round(d.mean)} ± ${Math.round(d.sd)} ${d.unit}`;
  }
  function differenceText(d) {
    const z = Math.abs(d.z);
    if (z < 0.05) return 'Same as your usual';
    return `${M.fmt.num(z, 1)} standard deviations ${d.z < 0 ? 'below' : 'above'}`;
  }
  /* "Sun", "Sat" … for the morning each night ended; the newest is "Last night". */
  function nightLabel(daysAgo) {
    if (daysAgo === 0) return 'Last night';
    return new Date(D.startOfToday() - daysAgo * D.DAY).toLocaleDateString('en-GB', { weekday: 'short' });
  }
  const todaysDay = (def) => def.days.find((d) => d.weekday === new Date().getDay()) || null;

  /* ------------------------------------------------------- readiness */
  function ReadinessCard({ s, r }) {
    if (r.level === 'unknown') {
      const anyConnected = Object.values(s.devices).some((d) => d.status !== 'revoked');
      return html`<${Card}>
        <div className="row row--between">
          <${CardTitle}>Readiness<//>
          <${Badge} palette="readiness" status="unknown" />
        </div>
        <${Callout}>${K.missingReadinessText(s)}<//>
        <${LinkButton} align="flex-start" label=${anyConnected ? 'Choose what your devices share' : 'Connect a device'}
          onPress=${() => A.push('devices')} />
      <//>`;
    }
    return html`<${Card}>
      <div className="row row--between">
        <${CardTitle}>Readiness<//>
        <${Badge} palette="readiness" status=${r.level} />
      </div>
      <${Callout}>${K.LEVEL_TEXT[r.level]}<//>
      <ul className="facts">
        ${r.drivers.map((d) => html`<li key=${d.metric} style=${{ alignItems: 'center' }}>
          <div className="stack-xxs grow">
            <${T} size="callout" className="tabular">${K.keepUnits(d.text.value)}<//>
            <${T} size="caption" color="inkMuted80" className="tabular">${K.keepUnits(d.text.context)}<//>
          </div>
          ${d.effect !== 'normal' ? html`<${Badge} palette="readiness" status=${d.effect} />` : null}
        </li>`)}
        ${r.vendor.map((v) => html`<li key=${v.label}>
          <${T} size="callout" color="inkMuted80">${v.label}<//>
          <${T} size="callout" className="tabular">${K.vendorValue(v)}<//>
        </li>`)}
      </ul>
      <${Caption}>${K.sourceLine(r)}<//>
    <//>`;
  }

  function TodaysTrainingCard({ s, r }) {
    const adj = M.evaluateRecoveryAdjustment(s);
    const day = todaysDay(S.currentDefinition(s));
    const plan = day
      ? `${day.label}: ${day.items.length} exercises, about ${M.dayMinutes(day)} minutes.`
      : 'No session in your split today.';
    let body;
    if (adj) {
      body = html`
        <${Callout}>${adj.reason}<//>
        <div className="row hairline-top">
          <${Glyph} name="checkmark.seal.fill" size=${18} color="inkMuted48" />
          <${T} size="caption" color="inkMuted80">${adj.verifiedCount} of ${adj.required} studies verified for changing a session based on readiness<//>
        </div>`;
    } else if (r.level === 'normal') {
      body = html`<${Callout}>Your readiness is normal, so today's session goes ahead as planned.<//>`;
    } else {
      body = html`<${Callout}>Without readiness data, today's session goes ahead as planned.<//>`;
    }
    return html`<${Card}>
      ${adj ? html`<div className="row"><${Badge} palette="recommendation" status=${adj.status} /></div>` : null}
      <${CardTitle}>Today's training<//>
      <${T} size="callout" font="semiBold" as="p">${plan}<//>
      ${body}
      <${LinkButton} align="flex-start" label="How readiness works" onPress=${() => A.push('readiness')} />
    <//>`;
  }

  /* Last 7 nights for the readiness device: only the metrics it shares. */
  function LastNights({ r }) {
    if (!r.provider) return null;
    const set = D.WEARABLE_SERIES[r.provider];
    const metrics = COLUMN_ORDER.filter((m) => r.drivers.some((d) => d.metric === m));
    if (!metrics.length) return null;
    /* One grid for the whole table; each row is a subgrid so columns line up. */
    const table = { display: 'grid', gridTemplateColumns: `minmax(0, 1fr) repeat(${metrics.length}, auto)`, columnGap: 'var(--spacing-md)' };
    const cols = { display: 'grid', gridColumn: '1 / -1', gridTemplateColumns: 'subgrid', alignItems: 'baseline' };
    const cell = { whiteSpace: 'nowrap' };
    const nights = [0, 1, 2, 3, 4, 5, 6];
    const at = (m, daysAgo) => {
      const p = set[m].points.find((x) => x.daysAgo === daysAgo);
      return p ? metricValue(m, p.value) : '—';
    };
    const driver = (m) => r.drivers.find((d) => d.metric === m);
    const hrvKind = metrics.find((m) => HRV_METRICS.includes(m));
    const caption = `From ${r.providerName}${hrvKind ? `. HRV is ${hrvKind === 'hrv_sdnn_ms' ? 'SDNN' : 'RMSSD'}` : ''}. Your usual is your average over the 28 nights before last night.`;
    return html`<${Section} title="Last 7 nights" caption=${caption}>
      <${Card}>
        <ul className="facts" aria-label="Last 7 nights" style=${table}>
          <li style=${cols}>
            <${T} size="caption" color="inkMuted48">Night<//>
            ${metrics.map((m) => html`<${T} key=${m} size="caption" color="inkMuted48" align="right" style=${cell}>${COLUMN_LABEL[m]}<//>`)}
          </li>
          ${nights.map((n) => html`<li key=${n} style=${cols}>
            <${T} size="callout" color="inkMuted80">${nightLabel(n)}<//>
            ${metrics.map((m) => html`<${T} key=${m} size="callout" align="right" className="tabular" style=${cell}>${at(m, n)}<//>`)}
          </li>`)}
          <li style=${cols}>
            <${T} size="callout" font="semiBold">Your usual<//>
            ${metrics.map((m) => html`<${T} key=${m} size="callout" font="semiBold" align="right" className="tabular" style=${cell}>${metricValue(m, driver(m).mean)}<//>`)}
          </li>
        </ul>
      <//>
    <//>`;
  }

  function HrvNote() {
    return html`<div className="row row--top">
      <${Glyph} name="info.circle" size=${18} color="inkMuted48" />
      <${Caption}>Apple Health reports HRV as SDNN, while Oura, WHOOP and Fitbit report RMSSD. They measure different things, so we never compare HRV across devices. A device's own score, like the Oura readiness score, keeps its maker's name.<//>
    </div>`;
  }

  function Recovery() {
    const s = C.useApp();
    const r = M.readiness(s);
    return html`<${Screen} title="Recovery" subtitle="Compared with your own baseline">
      <${Sections}>
        <${ReadinessCard} s=${s} r=${r} />
        <${TodaysTrainingCard} s=${s} r=${r} />
        <${LastNights} r=${r} />
        <${HrvNote} />
        <${Section} title="Devices" caption="We use this data to compare you with your own baseline. We never sell it or use it for advertising.">
          <${Rows} rows=${K.deviceRows(s, true)} />
        <//>
      <//>
    <//>`;
  }

  /* ------------------------------------------------- readiness detail */
  const RULES = [
    { key: 'hrv', label: 'Heart rate variability', detail: 'More than one standard deviation below your usual HRV is reduced. More than two is low.' },
    { key: 'resting_hr', label: 'Resting heart rate', detail: 'More than one standard deviation above your usual resting heart rate is reduced. More than two is low.' },
    { key: 'sleep', label: 'Sleep', detail: 'More than one standard deviation below your usual sleep time is reduced.' }
  ];

  function DriverTable({ r }) {
    return html`<${Card}>
      ${r.drivers.map((d, i) => html`<div key=${d.metric} className=${'stack-xs' + (i ? ' hairline-top' : '')}>
        <div className="row row--between">
          <${T} size="body" font="semiBold">${d.label}<//>
          <${Badge} palette="readiness" status=${d.effect} />
        </div>
        <${Facts} rows=${[
          ['Last night', metricValue(d.metric, d.value)],
          ['Your usual', baselineValue(d)],
          ['Difference', differenceText(d)]
        ]} />
      </div>`)}
    <//>`;
  }

  /* Which readiness data the device shares, with a link to change it. */
  function SharedData({ s, provider }) {
    const dev = s.devices[provider];
    const name = D.PROVIDERS[provider].short;
    const types = D.PROVIDERS[provider].dataTypes;
    const vendorType = types.find((t) => t === 'readiness' || t === 'recovery');
    const rows = K.READINESS_TYPES.filter((t) => types.includes(t)).map((t) => [D.DATA_TYPE_LABELS[t], dev.dataTypes[t] ? 'Used' : 'Off', { tabular: false }]);
    if (vendorType) rows.push([`${name} ${D.DATA_TYPE_LABELS[vendorType].toLowerCase()}`, dev.dataTypes[vendorType] ? 'Shown, not used' : 'Off', { tabular: false }]);
    return html`<div className="stack-sm">
      <${Card}>
        <div className="row row--between">
          <${CardTitle}>${D.PROVIDERS[provider].name}<//>
          <${Badge} palette="connection" status=${dev.status} />
        </div>
        <${Facts} rows=${rows} />
      <//>
      <${LinkButton} align="flex-start" label=${`Change what ${name} shares`} onPress=${() => A.push('device', { provider })} />
    </div>`;
  }

  function EvidenceStatus() {
    const claim = M.claimByKey(CLAIM_KEY);
    if (!claim) return null;
    const verified = M.verifiedSourcesFor(claim).length;
    const enough = verified >= M.REQUIRED_SOURCES;
    return html`<${Section} title="Changing your training" caption="Lowering today's training because readiness is down would be a change to your plan, so it needs 3 verified studies like any other change.">
      <${Card}>
        <div className="row row--between">
          <${Caption}>${claim.status === 'draft' ? 'The claim, still a draft' : 'The claim'}<//>
          ${enough
            ? html`<${Badge} palette="sourceVerification" status="verified" />`
            : html`<${Badge} palette="recommendation" status="blocked_insufficient_evidence" />`}
        </div>
        <${T} size="callout" as="p">${claim.statement}<//>
        <div className="row hairline-top">
          <${Glyph} name="checkmark.seal.fill" size=${18} color=${enough ? 'primary' : 'inkMuted48'} />
          <${T} size="caption" color="inkMuted80">${verified} of ${M.REQUIRED_SOURCES} studies verified<//>
        </div>
      <//>
      ${enough ? null : html`<${Callout}>Until 3 studies are verified, readiness never changes your plan. We show it so you can decide for yourself.<//>`}
    <//>`;
  }

  /* Claims in the evidence library that explain this screen. */
  const RELATED = ['recovery.hrv_guided_lifting_volume', 'recovery.sleep_loss_impairs_performance', 'wearables.measurement_validity', 'recovery.hrv_guided_endurance_training'];
  function RelatedEvidence() {
    const claims = RELATED.map((k) => (D.CLAIMS || []).find((c) => c.key === k)).filter(Boolean);
    if (!claims.length) return null;
    return html`<${Section} title="Related evidence">
      <${Rows} rows=${claims.map((c) => ({
        key: c.key, label: c.title,
        detail: c.status === 'active' ? 'Enough verified evidence' : 'Not enough evidence yet',
        onPress: () => A.push('claim', { key: c.key })
      }))} />
    <//>`;
  }

  function Readiness() {
    const s = C.useApp();
    const r = M.readiness(s);
    const provider = r.provider || K.DEVICE_ORDER.find((p) => D.WEARABLE_SERIES[p] && s.devices[p] && s.devices[p].status !== 'revoked') || null;
    return html`<${Screen} title="How readiness works" subtitle="Each device against its own baseline">
      <${Sections}>
        <${Section} title="How we work it out">
          <${Callout}>Each morning we compare last night's numbers with your own average over the 28 nights before, from the same device. We never compare one device with another, or you with anyone else.<//>
          <${Rows} rows=${RULES.map((x) => ({ key: x.key, label: x.label, detail: x.detail }))} />
          <${Caption}>A standard deviation is how much your numbers usually vary from night to night. Your readiness is the lowest of these.<//>
        <//>

        <${Section} title="Last night" caption=${r.provider ? `${K.sourceLine(r)} Your usual is your average over the 28 nights before, ± how much it usually varies.` : null}>
          ${r.level === 'unknown'
            ? html`<${Card}>
                <div className="row row--between">
                  <${CardTitle}>Readiness<//>
                  <${Badge} palette="readiness" status="unknown" />
                </div>
                <${Callout}>${K.missingReadinessText(s)}<//>
              <//>`
            : html`<${DriverTable} r=${r} />`}
        <//>

        <${Section} title="What we use" caption="A data type you switch off is never used. If this device has nothing to share, we use the next connected device, on its own baseline.">
          ${provider
            ? html`<${SharedData} s=${s} provider=${provider} />`
            : html`<${LinkButton} align="flex-start" label="Connect a device" onPress=${() => A.push('devices')} />`}
        <//>

        <${EvidenceStatus} />
        <${RelatedEvidence} />
        <${DisclaimerBand} />
      <//>
    <//>`;
  }

  C.registerScreen('recovery', Recovery, {
    title: 'Recovery', tab: 'recovery', presentation: 'tab', demoParams: {}
  });
  C.registerScreen('readiness', Readiness, {
    title: 'How readiness works', tab: 'recovery', presentation: 'push', demoParams: {}
  });
})();
