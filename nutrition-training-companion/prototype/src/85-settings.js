/* Companion prototype — Settings and everything under it (builder E).
   Settings (docs/08 §8.5): profile and goal, targets, connected devices and
   device detail (docs/08 §8.6, docs/07 §7.8), privacy choices, your data
   (export, delete) and about. Safety flags follow docs/07 §7.9. Sign-in,
   device connections and downloads are simulated in the prototype. */
(function () {
  'use strict';

  const C = window.Companion;
  const React = window.React;
  const { useState, useEffect } = React;
  const { html, T, Card, Button, Input, Chip, Screen, Section, Sections, Facts, Rows, Badge, Caption, Callout, Body,
          CardTitle, LinkButton, Switch, EmptyAnswer, ChoiceChips, Stepper, Actions, isoDate } = C.ui;
  const M = C.domain, D = C.data, A = C.actions;

  /* ------------------------------------------------------------ constants */
  /* Device order, as in the Connected devices mockup. */
  const DEVICE_ORDER = ['apple_health', 'oura', 'whoop', 'google_health'];
  /* Data types readiness compares with your own baseline (docs/07 §7.2). */
  const READINESS_TYPES = ['sleep', 'hrv', 'resting_hr'];
  const READINESS_WORDS = { sleep: 'sleep', hrv: 'HRV', resting_hr: 'resting heart rate' };

  const SIGN_IN = { apple: 'Apple', google: 'Google', email: 'email' };
  const EXPERIENCE = [
    { value: 'novice', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];
  const SESSION_MINUTES = [45, 60, 75, 90];
  const SEX_OPTIONS = [
    { value: 'female', label: 'Female' },
    { value: 'male', label: 'Male' },
    { value: 'unspecified', label: 'Prefer not to say' }
  ];
  const REGIONS = [
    { value: 'upper', label: 'Upper body' },
    { value: 'lower', label: 'Lower body' },
    { value: 'core', label: 'Core' }
  ];
  /* docs/07 §7.9: what each flag changes, in one line. */
  const SAFETY = [
    { flag: 'injury_reported', label: 'An injury or pain', detail: "We won't suggest changes that load the injured area." },
    { flag: 'condition_reported', label: 'A medical condition', detail: 'We hold training suggestions until you tell us a professional supervises your training.' },
    { flag: 'pregnancy', label: 'Pregnancy', detail: "We won't make training or nutrition suggestions. Logging still works." },
    { flag: 'eating_disorder_history', label: 'A history of disordered eating', detail: "We won't suggest calorie-deficit or weight-loss targets." },
    { flag: 'clinician_supervised', label: 'A professional supervises my training', detail: 'Lifts the hold that a medical condition puts on suggestions. We note it on every suggestion.' }
  ];
  const TARGET_FIELDS = [
    { key: 'energyKcal', label: 'Calories (kcal)', name: 'Calories', min: 1, max: 10000, format: (v) => M.fmt.kcal(v) },
    { key: 'proteinG', label: 'Protein (g)', name: 'Protein', min: 0, max: 1000, format: (v) => M.fmt.g(v) },
    { key: 'carbohydrateG', label: 'Carbs (g)', name: 'Carbs', min: 0, max: 1000, format: (v) => M.fmt.g(v) },
    { key: 'fatG', label: 'Fat (g)', name: 'Fat', min: 0, max: 1000, format: (v) => M.fmt.g(v) },
    { key: 'fiberG', label: 'Fibre (g)', name: 'Fibre', min: 0, max: 300, format: (v) => M.fmt.g(v) }
  ];
  const CONSENTS = [
    { key: 'health_data_processing', label: 'Health data processing', detail: 'Needed to log food and training.', required: true },
    { key: 'ai_processing', label: 'AI features', detail: 'Lets us read label photos and your requests. Turning it off disables those features.' },
    { key: 'scan_image_upload', label: 'Label photo upload', detail: 'Sends hard-to-read label photos to our server for better text recognition. Deleted after 30 days.' },
    { key: 'off_contribution', label: 'Open Food Facts contributions', detail: 'Shares confirmed label data with Open Food Facts.' },
    { key: 'product_analytics', label: 'Product analytics', detail: 'Anonymous usage counts. No health data.' }
  ];
  /* How each data type is used, for the ones the readiness caption doesn't cover. */
  const TYPE_USE = {
    readiness: (name) => `Shown as ${name}'s own score, never mixed with ours.`,
    recovery: (name) => `Shown as ${name}'s own score, never mixed with ours.`,
    workouts: () => 'Cardio minutes count toward your training week.',
    daily_activity: () => 'Steps and active energy, shown for context.',
    heart_rate: () => 'Heart rate during workouts, shown for context.'
  };
  const PROVIDER_NOTES = {
    apple_health: "Apple Health data is read on your iPhone and synced here. iPhone doesn't tell apps when you've turned off reading, so missing data shows as no data.",
    oura: 'Oura shares data only while your ring has an active membership (Gen3 and later).',
    google_health: "Fitbit now connects through your Google account. If you connected Fitbit before, you'll need to connect again."
  };
  const SAVE_DELAY_MS = 700;

  /* ------------------------------------------------------------- helpers */
  const plural = (n, one, many) => `${n} ${n === 1 ? one : (many || `${one}s`)}`;
  const longDate = (ts) => new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const dayMonthLong = (ts) => new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  /* "today at 07:12", "yesterday at 06:40", "9 Oct at 06:40" (as on Today). */
  function whenText(ts) {
    const day = M.fmt.relativeDay(ts);
    return `${day === 'Today' || day === 'Yesterday' ? day.toLowerCase() : day} at ${M.fmt.time(ts)}`;
  }
  const parseNumber = (v) => {
    const t = String(v == null ? '' : v).trim().replace(',', '.');
    return /^\d+(\.\d+)?$/.test(t) ? Number(t) : NaN;
  };
  const digitsOnly = (v, max) => String(v || '').replace(/[^0-9]/g, '').slice(0, max);
  const decimalOnly = (v) => String(v || '').replace(/[^0-9.,]/g, '').slice(0, 6);
  const toggleIn = (list, value, order) => {
    const next = list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
    return order ? next.sort((a, b) => order.indexOf(a) - order.indexOf(b)) : next;
  };
  const saveProfile = (patch) => {
    A.updateProfile(patch);
    A.toast('Saved');
  };
  const latest = (s, kind) => (s.privacyRequests || []).find((r) => r.kind === kind) || null;
  const scheduledDeletion = (s) => (s.privacyRequests || []).find((r) => r.kind === 'deletion' && r.status === 'scheduled') || null;

  /* A labelled group of controls (the label matches the Input label style). */
  function Field({ label, hint, children }) {
    return html`<div className="stack-xs">
      <${T} size="callout" font="semiBold" as="p">${label}<//>
      ${children}
      ${hint ? html`<${Caption}>${hint}<//>` : null}
    </div>`;
  }
  function MultiChips({ options, values, onChange, label, order }) {
    return html`<div className="row row--wrap" role="group" aria-label=${label}>
      ${options.map((o) => html`<${Chip} key=${o.value} variant="filter" active=${values.includes(o.value)} label=${o.label}
        onPress=${() => onChange(toggleIn(values, o.value, order))} />`)}
    </div>`;
  }
  /* Saves a typed value a moment after the last keystroke, when it is valid. */
  function useAutosave(value, stored, valid, save) {
    useEffect(() => {
      if (!valid || value === stored) return undefined;
      const t = setTimeout(save, SAVE_DELAY_MS);
      return () => clearTimeout(t);
    }, [value, stored, valid]);
  }

  /* Confirmations for the prototype controls (Settings and About). */
  function confirmReset() {
    A.alert({
      title: 'Reset sample data?',
      message: "We'll replace your changes in this prototype with the original sample data.",
      buttons: [
        { label: 'Cancel', style: 'cancel' },
        { label: 'Reset', style: 'destructive', onPress: () => { A.resetPrototype(); A.skipOnboarding(); A.toast('Sample data reset'); } }
      ]
    });
  }
  function confirmOnboarding() {
    A.alert({
      title: 'Start onboarding again?',
      message: "We'll reset the sample data and take you back to the first onboarding screen.",
      buttons: [
        { label: 'Cancel', style: 'cancel' },
        { label: 'Start again', style: 'destructive', onPress: () => A.resetPrototype() }
      ]
    });
  }

  /* ------------------------------------------------------------- Settings */
  function devicesSummary(s) {
    const by = (status) => DEVICE_ORDER.filter((p) => s.devices[p] && s.devices[p].status === status);
    const names = (list) => M.listJoin(list.map((p) => D.PROVIDERS[p].short));
    const parts = [];
    const active = by('active');
    parts.push(active.length ? `${active.length} connected` : 'None connected');
    const reauth = by('needs_reauth');
    if (reauth.length) parts.push(`${names(reauth)} to reconnect`);
    const paused = by('paused');
    if (paused.length) parts.push(`${names(paused)} paused`);
    return parts.join(', ');
  }

  function Settings() {
    const s = C.useApp();
    const p = s.profile;
    const t = s.targets;
    const optional = CONSENTS.filter((c) => !c.required);
    const optionalOn = optional.filter((c) => s.consents[c.key]).length;
    const deletion = scheduledDeletion(s);
    return html`<${Screen} title="Settings" subtitle=${p.email ? p.email : null}>
      <${Sections}>
        <${Section} title="You">
          <${Rows} rows=${[
            { key: 'profile', icon: 'person.crop.circle', iconColor: 'ink', label: 'Profile and goal',
              detail: `${M.goalLabel(p.goal)}. ${plural(p.daysPerWeek, 'day')} a week, ${p.sessionMinutes} min each.`,
              onPress: () => A.push('profile') },
            { key: 'targets', icon: 'target', iconColor: 'ink', label: 'Targets',
              detail: `${M.fmt.kcal(t.energyKcal)} and ${M.fmt.g(t.proteinG)} protein a day.`,
              onPress: () => A.push('targets') }
          ]} />
        <//>
        <${Section} title="Devices and data">
          <${Rows} rows=${[
            { key: 'devices', icon: 'applewatch', iconColor: 'ink', label: 'Connected devices', detail: `${devicesSummary(s)}.`,
              onPress: () => A.push('devices') },
            { key: 'privacy', icon: 'lock.shield', iconColor: 'ink', label: 'Privacy choices',
              detail: `${optionalOn} of ${optional.length} optional choices on.`, onPress: () => A.push('privacy') },
            { key: 'data', icon: 'square.and.arrow.up', iconColor: 'ink', label: 'Your data',
              detail: deletion ? `Account deletion scheduled for ${dayMonthLong(deletion.scheduledFor)}.` : 'Export or delete your data.',
              onPress: () => A.push('your-data') }
          ]} />
        <//>
        <${Section} title="About">
          <${Rows} rows=${[
            { key: 'about', icon: 'doc.text', iconColor: 'ink', label: 'About and disclaimer',
              detail: 'Not medical advice. What this prototype is.', onPress: () => A.push('about') }
          ]} />
        <//>
        <${Section} title="Prototype" caption="These change only the prototype in this browser.">
          <${Rows} rows=${[
            { key: 'reset', icon: 'arrow.clockwise', label: 'Reset sample data', color: 'primary', chevron: false, onPress: confirmReset },
            { key: 'onboarding', icon: 'arrow.uturn.backward', label: 'Start onboarding again', color: 'primary', chevron: false, onPress: confirmOnboarding }
          ]} />
        <//>
      <//>
    <//>`;
  }

  /* -------------------------------------------------------------- Profile */
  function SafetyGroup({ p }) {
    const flags = p.safetyFlags || [];
    const regions = p.injuryRegions || [];
    const has = (f) => flags.includes(f);
    const setFlag = (flag, on) => {
      const others = flags.filter((f) => f !== flag);
      const patch = { safetyFlags: on ? [...others, flag] : others };
      if (flag === 'injury_reported' && !on) patch.injuryRegions = [];
      saveProfile(patch);
    };
    const regionWords = REGIONS.filter((r) => regions.includes(r.value)).map((r) => r.label.toLowerCase());
    const detailFor = (q) => (q.flag === 'injury_reported' && has(q.flag) && regionWords.length
      ? `We won't suggest changes that load your ${M.listJoin(regionWords)}.`
      : q.detail);
    return html`<div className="ads-group" role="list">
      ${SAFETY.map((q) => html`<div key=${q.flag} role="listitem" className="ads-group__row row--stacked">
        <div className="row row--between" style=${{ alignItems: 'flex-start', gap: 'var(--spacing-base)' }}>
          <div className="grow stack-xxs">
            <${T} size="body">${q.label}<//>
            <${T} size="caption" color="inkMuted80">${detailFor(q)}<//>
          </div>
          <${Switch} on=${has(q.flag)} label=${q.label} onChange=${(on) => setFlag(q.flag, on)} />
        </div>
        ${q.flag === 'injury_reported' && has(q.flag) ? html`<div style=${{ paddingTop: 'var(--spacing-sm)' }}>
          <${Field} label="Where is it?"
            hint=${regions.length ? 'Pick every area that applies.' : 'Pick where, so we know which suggestions to pause.'}>
            <${MultiChips} label="Where is the injury?" options=${REGIONS} values=${regions} order=${REGIONS.map((r) => r.value)}
              onChange=${(v) => saveProfile({ injuryRegions: v })} />
          <//>
        </div>` : null}
      </div>`)}
    </div>`;
  }

  function Profile() {
    const s = C.useApp();
    const p = s.profile;
    const goal = M.GOALS.find((g) => g.id === p.goal) || null;
    const [height, setHeight] = useState(() => (p.heightCm != null ? String(p.heightCm) : ''));
    const [weight, setWeight] = useState(() => (p.weightKg != null ? String(p.weightKg) : ''));
    const [notes, setNotes] = useState(() => p.healthNotes || '');
    const h = parseNumber(height);
    const w = parseNumber(weight);
    const hErr = height !== '' && !(h >= 100 && h <= 250) ? 'Between 100 and 250 cm.' : null;
    const wErr = weight !== '' && !(w >= 30 && w <= 300) ? 'Between 30 and 300 kg.' : null;
    useAutosave(height, p.heightCm != null ? String(p.heightCm) : '', height !== '' && !hErr, () => saveProfile({ heightCm: Math.round(h) }));
    useAutosave(weight, p.weightKg != null ? String(p.weightKg) : '', weight !== '' && !wErr && w !== p.weightKg,
      () => saveProfile({ weightKg: Math.round(w * 10) / 10 }));
    useAutosave(notes.trim(), (p.healthNotes || '').trim(), true, () => saveProfile({ healthNotes: notes.trim() }));

    const method = p.signInMethod && SIGN_IN[p.signInMethod] ? p.signInMethod : null;
    const account = method
      ? { key: 'account', label: `Signed in with ${SIGN_IN[method]}`, detail: p.email || null }
      : { key: 'account', label: 'Sample profile', detail: 'You skipped sign-in. In the prototype, sign-in is simulated.' };
    const anyFlag = SAFETY.some((q) => q.flag !== 'clinician_supervised' && (p.safetyFlags || []).includes(q.flag));

    return html`<${Screen} title="Profile and goal" subtitle="Changes save as you make them.">
      <${Sections}>
        <${Section} title="Account">
          <${Rows} rows=${[account]} />
        <//>

        <${Section} title="Goal">
          <${ChoiceChips} label="Goal" options=${M.GOALS.map((g) => ({ value: g.id, label: g.label }))} value=${p.goal}
            onChange=${(v) => saveProfile({ goal: v })} />
          ${goal ? html`<${Callout}>${goal.body}<//>` : null}
        <//>

        <${Section} title="Training" caption="We keep anything we suggest inside these.">
          <${Field} label="Experience">
            <${ChoiceChips} label="Experience" options=${EXPERIENCE} value=${p.experience} onChange=${(v) => saveProfile({ experience: v })} />
          <//>
          <div className="row row--between">
            <${T} size="callout" font="semiBold" as="p">Days per week<//>
            <${Stepper} label="days per week" value=${p.daysPerWeek} min=${1} max=${7} onChange=${(v) => saveProfile({ daysPerWeek: v })} />
          </div>
          <${Field} label="Session length" hint="Including warm-up.">
            <${ChoiceChips} label="Session length" options=${SESSION_MINUTES.map((m) => ({ value: m, label: `${m} min` }))}
              value=${p.sessionMinutes} onChange=${(v) => saveProfile({ sessionMinutes: v })} />
          <//>
          <${Field} label="Equipment you can use" hint="Pick everything you have access to.">
            <${MultiChips} label="Equipment" options=${D.EQUIPMENT.map((e) => ({ value: e, label: M.capitalise(e) }))}
              values=${p.equipment || []} order=${D.EQUIPMENT} onChange=${(v) => saveProfile({ equipment: v })} />
          <//>
        <//>

        <${Section} title="About you" caption="We use these for energy estimates.">
          <div className="grid2">
            <${Input} label="Height (cm)" inputMode="numeric" value=${height} error=${hErr}
              onChange=${(e) => setHeight(digitsOnly(e.target.value, 3))} />
            <${Input} label="Weight (kg)" inputMode="decimal" value=${weight} error=${wErr}
              onChange=${(e) => setWeight(decimalOnly(e.target.value))} />
          </div>
          <${Field} label="Sex for energy equations" hint="Optional. Energy equations differ slightly by sex, and we use it for nothing else.">
            <${ChoiceChips} label="Sex for energy equations" options=${SEX_OPTIONS} value=${p.sexForEquations || 'unspecified'}
              onChange=${(v) => saveProfile({ sexForEquations: v })} />
          <//>
        <//>

        <${Section} title="Health and safety" caption="Turn on anything that applies. Each one changes what we suggest.">
          <${SafetyGroup} p=${p} />
          ${anyFlag ? html`<${Callout}>Please talk to a qualified healthcare professional before you change your training or diet.<//>` : null}
          <${Input} label="Anything else we should know?" value=${notes} hint="Optional. Stored encrypted."
            onChange=${(e) => setNotes(e.target.value)} />
        <//>

        <${Section} title="Notifications">
          <${Rows} rows=${[{
            key: 'notifications',
            label: 'Push notifications',
            detail: 'A suggestion to review or a device to reconnect. Never health values.',
            right: html`<${Switch} on=${!!p.notificationsAllowed} label="Push notifications"
              onChange=${(on) => saveProfile({ notificationsAllowed: on })} />`
          }]} />
          <${Caption}>In the app, your phone asks you to confirm. In the prototype, nothing is sent.<//>
        <//>
      <//>
    <//>`;
  }

  /* -------------------------------------------------------------- Targets */
  function targetSummary(values) {
    return TARGET_FIELDS.filter((f) => values[f.key] != null)
      .map((f, i) => (i === 0 ? f.format(values[f.key]) : `${f.format(values[f.key])} ${f.name.toLowerCase()}`)).join(', ');
  }

  function Targets() {
    const s = C.useApp();
    const t = s.targets;
    const [form, setForm] = useState(() => Object.fromEntries(TARGET_FIELDS.map((f) => [f.key, t[f.key] != null ? String(t[f.key]) : ''])));
    const values = Object.fromEntries(TARGET_FIELDS.map((f) => [f.key, parseNumber(form[f.key])]));
    const errors = Object.fromEntries(TARGET_FIELDS.map((f) => {
      const v = values[f.key];
      return [f.key, Number.isNaN(v) || v < f.min || v > f.max ? `Enter ${f.min} to ${f.max.toLocaleString('en-GB')}.` : null];
    }));
    const ok = TARGET_FIELDS.every((f) => !errors[f.key]);
    const changed = TARGET_FIELDS.some((f) => values[f.key] !== t[f.key]);
    const edHistory = (s.profile.safetyFlags || []).includes('eating_disorder_history');
    const save = () => {
      A.setTargets(Object.fromEntries(TARGET_FIELDS.map((f) => [f.key, Math.round(values[f.key])])));
      A.toast('Targets saved', 'success');
    };
    const field = (f) => html`<${Input} key=${f.key} label=${f.label} inputMode="numeric" value=${form[f.key]} error=${errors[f.key]}
      onChange=${(e) => { const v = digitsOnly(e.target.value, 5); setForm((x) => ({ ...x, [f.key]: v })); }} />`;
    const history = (t.history || []).slice().reverse();

    return html`<${Screen} title="Targets" subtitle="Your daily numbers.">
      <${Sections}>
        <div className="stack">
          ${field(TARGET_FIELDS[0])}
          <div className="grid2">${TARGET_FIELDS.slice(1).map(field)}</div>
          <${Caption}>${`These are your targets. We only suggest targets once our nutrition evidence has ${M.REQUIRED_SOURCES} verified studies per claim.${edHistory ? " We won't suggest calorie targets." : ''}`}<//>
          <${Actions}>
            <${Button} fullWidth=${true} label="Save targets" disabled=${!changed || !ok} onPress=${save} />
          <//>
        </div>

        <${Section} title="Changes" caption="Newest first. Every change is also in History, under Nutrition.">
          <${Rows} rows=${history.map((h, i) => ({
            key: `${h.at}-${i}`,
            label: `${M.fmt.relativeDay(h.at)}${i === 0 ? ', current' : ''}`,
            detail: targetSummary(h.values),
            right: html`<${Badge} palette="splitOrigin" status=${h.origin || 'user_edit'} />`
          }))} />
        <//>
      <//>
    <//>`;
  }

  /* -------------------------------------------------------------- Devices */
  function Devices() {
    const s = C.useApp();
    return html`<${Screen} title="Connected devices" subtitle="Choose what each device shares.">
      <${Sections}>
        <section className="stack-sm">
          <${Rows} rows=${DEVICE_ORDER.filter((p) => s.devices[p]).map((p) => ({
            key: p,
            label: D.PROVIDERS[p].name,
            right: html`<${Badge} palette="connection" status=${s.devices[p].status} />`,
            onPress: () => A.push('device', { provider: p })
          }))} />
          <${Caption}>We use this data to compare you with your own baseline. We never sell it or use it for advertising.<//>
        </section>
        <${Section} title="Your data">
          <${Rows} rows=${[
            { key: 'export', label: 'Export your data', onPress: () => A.push('your-data') },
            { key: 'delete', label: 'Delete your account', color: 'danger', onPress: () => A.push('your-data') }
          ]} />
        <//>
      <//>
    <//>`;
  }

  /* --------------------------------------------------------------- Device */
  function readinessCaption(provider) {
    const types = READINESS_TYPES.filter((t) => D.PROVIDERS[provider].dataTypes.includes(t));
    if (!types.length) return null;
    return `${M.capitalise(M.listJoin(types.map((t) => READINESS_WORDS[t])))} ${types.length > 1 ? 'are' : 'is'} compared with your own baseline to estimate readiness.`;
  }
  function shareRows(provider, name, isOn, onToggle) {
    return D.PROVIDERS[provider].dataTypes.map((type) => ({
      key: type,
      label: D.DATA_TYPE_LABELS[type],
      detail: TYPE_USE[type] ? TYPE_USE[type](name) : null,
      right: html`<${Switch} on=${isOn(type)} label=${D.DATA_TYPE_LABELS[type]} onChange=${(on) => onToggle(type, on)} />`
    }));
  }

  function Device({ params }) {
    const s = C.useApp();
    const provider = params.provider;
    const prov = D.PROVIDERS[provider] || null;
    const dev = prov ? s.devices[provider] : null;
    const [chosen, setChosen] = useState(() => Object.fromEntries((prov ? prov.dataTypes : []).map((t) => [t, true])));
    if (!prov || !dev) {
      return html`<${Screen} title="Device">
        <${EmptyAnswer} icon="applewatch" title="We don't know this device" body="Pick one from Connected devices." />
      <//>`;
    }
    const name = prov.short;
    const status = dev.status;
    const subtitle = dev.lastSync ? `Last synced ${whenText(dev.lastSync)}` : status === 'pending' ? 'Connecting…' : 'Not connected';
    const note = PROVIDER_NOTES[provider] ? html`<${Caption}>${PROVIDER_NOTES[provider]}<//>` : null;
    const badge = html`<div className="row"><${Badge} palette="connection" status=${status} /></div>`;
    const existingTypes = Object.keys(dev.dataTypes || {}).length ? dev.dataTypes : undefined;

    const disconnect = () => A.alert({
      title: `Disconnect ${name}?`,
      message: `We'll stop syncing and delete your ${name} sign-in. What should happen to the data already synced?`,
      buttons: [
        { label: 'Keep synced data', onPress: () => { A.disconnectDevice(provider, false); } },
        { label: 'Delete synced data', style: 'destructive', onPress: () => A.disconnectDevice(provider, true) },
        { label: 'Cancel', style: 'cancel' }
      ]
    });
    const shares = (title, isOn, onToggle) => html`<${Section} title=${title} caption=${readinessCaption(provider)}>
      <${Rows} rows=${shareRows(provider, name, isOn, onToggle)} />
    <//>`;
    const liveShares = shares(`What ${name} shares`, (type) => !!dev.dataTypes[type], (type, on) => A.toggleDataType(provider, type, on));

    /* Not connected: choose what to share, then connect (simulated). */
    if (status === 'revoked') {
      const anyChosen = prov.dataTypes.some((type) => chosen[type]);
      const readinessTypes = READINESS_TYPES.filter((type) => prov.dataTypes.includes(type)).map((type) => READINESS_WORDS[type]);
      return html`<${Screen} title=${prov.name} subtitle=${subtitle}>
        <${Sections}>
          <${Card}>
            ${badge}
            <${Callout}>${`Connect ${name} to compare your ${M.listJoin(readinessTypes)} with your own baseline. You choose what it shares, and you can pause or disconnect at any time.`}<//>
            ${dev.purged === true ? html`<${Caption}>${`We deleted the data ${name} synced before.`}<//>` : null}
            ${dev.purged === false ? html`<${Caption}>${`We kept the data ${name} synced before.`}<//>` : null}
          <//>
          ${shares(`What ${name} will share`, (type) => !!chosen[type], (type, on) => setChosen((c) => ({ ...c, [type]: on })))}
          ${note}
          <div className="stack-sm">
            <${Button} fullWidth=${true} label=${`Connect ${name}`} disabled=${!anyChosen}
              onPress=${() => A.connectDevice(provider, { ...chosen })} />
            <${Caption}>${prov.cloud
              ? `In the app, you'd sign in on ${name}'s site. Here, connecting is simulated.`
              : 'In the app, your iPhone asks which data to share. Here, connecting is simulated.'}<//>
          </div>
        <//>
      <//>`;
    }

    /* Connecting: the simulated sign-in round trip. */
    if (status === 'pending') {
      return html`<${Screen} title=${prov.name} subtitle=${subtitle}>
        <${Sections}>
          <${Card}>
            ${badge}
            <${Callout}>Connecting…<//>
            <${Caption}>${`Waiting for ${name} to confirm. This takes a moment.`}<//>
            <${Button} fullWidth=${true} loading=${true} label=${`Connecting to ${name}`} />
          <//>
          ${note}
        <//>
      <//>`;
    }

    /* Reconnect needed: one primary action, and everything synced so far is kept. */
    if (status === 'needs_reauth' || status === 'error') {
      return html`<${Screen} title=${prov.name} subtitle=${subtitle}>
        <${Sections}>
          <${Card}>
            ${badge}
            <${Callout}>${status === 'error'
              ? `We couldn't reach ${name}. Everything synced so far is safe.`
              : `${name} asked you to sign in again. Everything synced so far is safe.`}<//>
            <${Button} fullWidth=${true} label=${`Reconnect ${name}`} onPress=${() => A.connectDevice(provider, existingTypes)} />
          <//>
          ${liveShares}
          ${note}
          <div className="stack-sm">
            <${Button} fullWidth=${true} variant="danger" label=${`Disconnect ${name}`} onPress=${disconnect} />
          </div>
        <//>
      <//>`;
    }

    /* Connected or paused. */
    const paused = status === 'paused';
    return html`<${Screen} title=${prov.name} subtitle=${subtitle}>
      <${Sections}>
        <${Card}>
          ${badge}
          <${Callout}>${paused
            ? `Sharing is paused. We don't fetch new data from ${name} or use it for readiness.`
            : `Connected since ${longDate(dev.connectedAt || dev.lastSync || Date.now())}. Switch off anything you don't want to share.`}<//>
        <//>
        ${liveShares}
        ${note}
        <div className="stack-sm">
          <${Button} fullWidth=${true} variant="outline" label=${paused ? 'Resume sharing' : 'Pause sharing'}
            onPress=${() => { A.pauseDevice(provider, !paused); A.toast(paused ? `${name} sharing resumed` : `${name} sharing paused`); }} />
          <${Button} fullWidth=${true} variant="danger" label=${`Disconnect ${name}`} onPress=${disconnect} />
        </div>
      <//>
    <//>`;
  }

  /* -------------------------------------------------------------- Privacy */
  function Privacy() {
    const s = C.useApp();
    return html`<${Screen} title="Privacy choices" subtitle="Change these at any time.">
      <${Sections}>
        <section className="stack-sm">
          <${Rows} rows=${CONSENTS.map((c) => ({
            key: c.key,
            label: c.label,
            detail: c.detail,
            right: html`<${Switch} on=${c.required ? true : !!s.consents[c.key]} label=${c.label} disabled=${!!c.required}
              onChange=${c.required ? null : (on) => { A.setConsent(c.key, on); A.toast('Saved'); }} />`
          }))} />
          <${Caption}>Health data processing is how the app works, so it stays on. To stop it, delete your account.<//>
          <${LinkButton} label="Export or delete your data" size="callout" align="flex-start" onPress=${() => A.push('your-data')} />
        </section>
        <${Caption}>In the app, each choice is saved with the date and the wording you agreed to.<//>
      <//>
    <//>`;
  }

  /* ------------------------------------------------------------ Your data */
  function YourData() {
    const s = C.useApp();
    const exp = latest(s, 'export');
    const deletion = scheduledDeletion(s);
    const preparing = !!exp && exp.status === 'running';
    const askDelete = () => A.alert({
      title: 'Delete your account?',
      message: "We'll delete your data in 7 days. You can cancel until then.",
      buttons: [
        { label: 'Cancel', style: 'cancel' },
        { label: 'Delete account', style: 'destructive', onPress: () => { A.requestDeletion(); A.toast('Account deletion scheduled'); } }
      ]
    });
    const exportRow = exp ? {
      key: exp.id,
      label: `Requested ${whenText(exp.requestedAt)}`,
      detail: exp.status === 'ready' ? `Ready. The link expires on ${dayMonthLong(exp.expiresAt)}.` : 'Preparing…'
    } : null;
    return html`<${Screen} title="Your data" subtitle="Take a copy, or delete everything.">
      <${Sections}>
        <${Section} title="Export your data">
          <${Callout}>We put everything in one ZIP file of JSON and CSV: your profile, food log, training, device data and every suggestion with its studies. It includes the disclaimer you agreed to.<//>
          ${exportRow ? html`<${Rows} rows=${[exportRow]} />` : null}
          <${Button} fullWidth=${true} label="Export your data" loading=${preparing} onPress=${() => A.requestExport()} />
          <${Caption}>In the prototype, downloading is simulated, so no file is made.<//>
        <//>

        <${Section} title="Delete your account">
          ${deletion
            ? html`<${Card}>
                <${CardTitle}>Deletion scheduled<//>
                <${Callout}>${`We'll delete your account and all your data on ${longDate(deletion.scheduledFor)}. Until then, the app works as usual.`}<//>
                <${Button} fullWidth=${true} variant="outline" label="Cancel deletion"
                  onPress=${() => { A.cancelDeletion(); A.toast('Deletion cancelled'); }} />
              <//>`
            : html`<${Callout}>We delete your account and everything in it 7 days after you ask. You can cancel until then.<//>
              <${Button} fullWidth=${true} variant="danger" label="Delete your account" onPress=${askDelete} />`}
        <//>
      <//>
    <//>`;
  }

  /* ---------------------------------------------------------------- About */
  /* Studies behind active claims that still pass every check. */
  function verifiedStudies() {
    const seen = new Set();
    const out = [];
    D.CLAIMS.filter((c) => c.status === 'active').forEach((claim) => M.verifiedSourcesFor(claim).forEach((src) => {
      if (!seen.has(src.id)) {
        seen.add(src.id);
        out.push(src);
      }
    }));
    return out;
  }

  function About() {
    const s = C.useApp();
    const studies = verifiedStudies();
    const checked = studies.length ? isoDate(studies[0].verifiedAt) : null;
    const ack = s.disclaimerAcknowledgedAt;
    return html`<${Screen} title="About and disclaimer">
      <${Sections}>
        <div className="band stack-sm">
          <${T} size="headline" font="semiBold" as="h2">Not medical advice<//>
          <${Body}>${D.DISCLAIMER.full}<//>
          <${Caption} color="inkMuted80">${`Version ${D.DISCLAIMER.version}.${ack ? ` You read and accepted it on ${longDate(ack)}.` : ''}`}<//>
        </div>

        <${Section} title="About this prototype">
          <${Callout}>Products, foods, numbers, devices and people here are sample data.<//>
          ${studies.length ? html`<div className="stack-sm">
            <${Callout}>${`The ${plural(studies.length, 'cited study', 'cited studies')} ${studies.length === 1 ? 'is a real publication' : 'are real publications'}${checked ? `, checked by hand on ${checked}` : ''}.`}<//>
            <${Rows} rows=${studies.map((src) => ({ key: src.id, label: src.short, detail: `${src.design}. ${src.journal}.` }))} />
          </div>` : null}
          <${Callout}>Built with the Apple Design System, synced from rukkiecodes/claude-apple-design-system (MIT). Icons are stand-ins for SF Symbols.<//>
          <${Callout}>Nothing leaves your browser. Sign-in, email codes, cameras, device connections and downloads are simulated, and your changes stay in this browser.<//>
          <${Callout}>In the app, Claude by Anthropic reads your change requests. Here, a simple keyword matcher stands in, and the evidence gate is the same.<//>
        <//>

        <${Actions}>
          <${Button} fullWidth=${true} variant="outline" label="Start onboarding again" onPress=${confirmOnboarding} />
        <//>
      <//>
    <//>`;
  }

  /* ------------------------------------------------------------ register */
  const push = (title, extra) => ({ title, tab: 'today', presentation: 'push', demoParams: {}, ...(extra || {}) });
  C.registerScreen('settings', Settings, push('Settings'));
  C.registerScreen('profile', Profile, push('Profile and goal'));
  C.registerScreen('targets', Targets, push('Targets'));
  C.registerScreen('devices', Devices, push('Connected devices'));
  C.registerScreen('device', Device, push('Device', {
    demoParams: { provider: 'oura' },
    demoParamsList: DEVICE_ORDER.map((provider) => ({ provider }))
  }));
  C.registerScreen('privacy', Privacy, push('Privacy choices'));
  C.registerScreen('your-data', YourData, push('Your data'));
  C.registerScreen('about', About, push('About and disclaimer'));
})();
