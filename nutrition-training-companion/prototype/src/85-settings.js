/* Companion prototype — Settings and everything under it (builder E).
   Settings (docs/08 §8.5): you (goal, age, weight, height and sex, health and
   safety, training: each its own page in 35-setup.js), targets, connected
   devices and device detail (docs/08 §8.6, docs/07 §7.8), notifications,
   privacy choices, your data (export, delete) and about. Targets, devices and
   privacy choices use the sign-up page layout (Companion.setup.FormPage), as
   they're also steps in "Finish setting up". Sign-in, device connections and
   downloads are simulated in the prototype. */
(function () {
  'use strict';

  const C = window.Companion;
  const React = window.React;
  const { useState } = React;
  const { html, T, Card, Button, Input, Screen, Section, Sections, Rows, Badge, Caption, Callout, Body,
          CardTitle, LinkButton, Switch, EmptyAnswer, Actions, isoDate } = C.ui;
  const M = C.domain, D = C.data, A = C.actions, U = C.setup;
  const { FormPage, Primary } = U;

  /* ------------------------------------------------------------ constants */
  /* Device order, as in the Connected devices mockup. */
  const DEVICE_ORDER = ['apple_health', 'oura', 'whoop', 'google_health'];
  /* Data types readiness compares with your own baseline (docs/07 §7.2). */
  const READINESS_TYPES = ['sleep', 'hrv', 'resting_hr'];
  const READINESS_WORDS = { sleep: 'sleep', hrv: 'HRV', resting_hr: 'resting heart rate' };

  const SIGN_IN = { apple: 'Apple', google: 'Google', email: 'email' };
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
    apple_health: "Apple Health data is read on your iPhone and synced here. iPhone doesn't tell apps when you've turned off reading, so missing data shows as no data. A web page can't read Health, so this prototype simulates the connection; you can import a real Health export instead.",
    oura: 'Oura shares data only while your ring has an active membership (Gen3 and later).',
    google_health: "Fitbit now connects through your Google account. If you connected Fitbit before, you'll need to connect again."
  };

  /* ------------------------------------------------------------- helpers */
  const plural = (n, one, many) => `${n} ${n === 1 ? one : (many || `${one}s`)}`;
  const longDate = (ts) => new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const dayMonthLong = (ts) => new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
  /* "today at 07:12", "yesterday at 06:40", "9 Oct at 06:40" (as on Today). */
  function whenText(ts) {
    const day = M.fmt.relativeDay(ts);
    return `${day === 'Today' || day === 'Yesterday' ? day.toLowerCase() : day} at ${M.fmt.time(ts)}`;
  }
  const digitsOnly = (v, max) => String(v || '').replace(/[^0-9]/g, '').slice(0, max);
  const latest = (s, kind) => (s.privacyRequests || []).find((r) => r.kind === kind) || null;
  const scheduledDeletion = (s) => (s.privacyRequests || []).find((r) => r.kind === 'deletion' && r.status === 'scheduled') || null;

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
      title: 'Start sign-up again?',
      message: "We'll reset the sample data and take you back to the first sign-up screen.",
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

  const EXPERIENCE_WORDS = { novice: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };
  const NOT_YET = 'Not set yet';

  function Settings() {
    const s = C.useApp();
    const p = s.profile;
    const t = s.targets;
    const done = (key) => U.isDone(s, key);
    const optional = CONSENTS.filter((c) => !c.required);
    const optionalOn = optional.filter((c) => s.consents[c.key]).length;
    const deletion = scheduledDeletion(s);
    const left = U.remaining(s);
    const flags = (p.safetyFlags || []).filter((f) => f !== 'clinician_supervised');
    const method = p.signInMethod && SIGN_IN[p.signInMethod] ? p.signInMethod : null;
    const age = p.birthDate ? C.healthImport.ageOn(p.birthDate) : p.birthYear ? new Date().getFullYear() - p.birthYear : null;
    const sexWord = p.sexForEquations && p.sexForEquations !== 'unspecified' ? `, ${p.sexForEquations}` : '';
    const weight = p.weightKg == null ? NOT_YET : p.weightUnit === 'lb' ? `${U.weightText(p.weightKg, 'lb')} lb` : `${M.fmt.num(p.weightKg, 1)} kg`;
    return html`<${Screen} title="Settings" subtitle=${p.email ? p.email : null}>
      <${Sections}>
        ${left.length ? html`<${Rows} rows=${[{
          key: 'setup', icon: 'checkmark', iconColor: 'primary', label: 'Finish setting up',
          detail: `${plural(left.length, 'thing')} left: ${M.listJoin(left.slice(0, 2).map((i) => i.title.toLowerCase()))}${left.length > 2 ? ' and more' : ''}.`,
          onPress: () => A.push('setup')
        }]} />` : null}
        <${Section} title="You">
          <${Rows} rows=${[
            { key: 'account',
              label: method ? `Signed in with ${SIGN_IN[method]}` : 'Sample profile',
              detail: method ? p.email || null : 'You skipped sign-in. In the prototype, sign-in is simulated.' },
            { key: 'goal', label: 'Goal', detail: M.goalLabel(p.goal), onPress: () => A.push('setup-goal') },
            { key: 'age', label: 'Age', detail: age != null ? `${age}, born ${p.birthYear}` : NOT_YET, onPress: () => A.push('setup-age') },
            { key: 'weight', label: 'Weight', detail: weight, onPress: () => A.push('setup-weight') },
            { key: 'body', label: 'Height and sex', detail: done('body') && p.heightCm ? `${p.heightCm} cm${sexWord}` : NOT_YET,
              onPress: () => A.push('setup-body') },
            { key: 'health', label: 'Health and safety',
              detail: !done('health') ? 'Not answered yet. We need it before we suggest a change.' : flags.length ? `${plural(flags.length, 'thing')} reported. Some suggestions are paused.` : 'Nothing reported.',
              onPress: () => A.push('setup-health') },
            { key: 'training', label: 'Training',
              detail: done('training') ? `${EXPERIENCE_WORDS[p.experience] || 'Intermediate'}. ${plural(p.daysPerWeek, 'day')} a week, ${p.sessionMinutes} min each.` : NOT_YET,
              onPress: () => A.push('setup-training') },
            { key: 'targets', label: 'Targets',
              detail: done('targets') ? `${M.fmt.kcal(t.energyKcal)} and ${M.fmt.g(t.proteinG)} protein a day.` : NOT_YET,
              onPress: () => A.push('targets') }
          ]} />
        <//>
        <${Section} title="Devices and data">
          <${Rows} rows=${[
            { key: 'devices', icon: 'applewatch', iconColor: 'ink', label: 'Connected devices', detail: `${devicesSummary(s)}.`,
              onPress: () => A.push('devices') },
            { key: 'notifications', icon: 'bell', iconColor: 'ink', label: 'Notifications',
              detail: !done('notifications') ? NOT_YET : p.notificationsAllowed ? 'On. Never with health values.' : 'Off.',
              onPress: () => A.push('setup-notifications') },
            { key: 'privacy', icon: 'lock.shield', iconColor: 'ink', label: 'Privacy choices',
              detail: `${optionalOn} of ${optional.length} optional choices on.`, onPress: () => A.push('privacy') },
            { key: 'data', icon: 'square.and.arrow.up', iconColor: 'ink', label: 'Your data',
              detail: deletion ? `Account deletion scheduled for ${dayMonthLong(deletion.scheduledFor)}.` : 'Export or delete your data.',
              onPress: () => A.push('your-data') }
          ]} />
        <//>
        <${Section} title="About">
          <${Rows} rows=${[
            { key: 'evidence', icon: 'checkmark.seal.fill', iconColor: 'ink', label: 'Evidence library',
              detail: `${plural(D.CLAIMS.filter((c) => c.status === 'active').length, 'claim')} we can act on, ${plural(D.SOURCES.length, 'study', 'studies')}, and the data to download.`,
              onPress: () => A.push('evidence') },
            { key: 'about', icon: 'doc.text', iconColor: 'ink', label: 'About and disclaimer',
              detail: 'Not medical advice. What this prototype is.', onPress: () => A.push('about') }
          ]} />
        <//>
        <${Section} title="Prototype" caption="These change only the prototype in this browser.">
          <${Rows} rows=${[
            { key: 'reset', icon: 'arrow.clockwise', label: 'Reset sample data', color: 'primary', chevron: false, onPress: confirmReset },
            { key: 'onboarding', icon: 'arrow.uturn.backward', label: 'Start sign-up again', color: 'primary', chevron: false, onPress: confirmOnboarding }
          ]} />
        <//>
      <//>
    <//>`;
  }

  /* -------------------------------------------------------------- Targets */
  function targetSummary(values) {
    return TARGET_FIELDS.filter((f) => values[f.key] != null)
      .map((f, i) => (i === 0 ? f.format(values[f.key]) : `${f.format(values[f.key])} ${f.name.toLowerCase()}`)).join(', ');
  }

  /* Runs the evidence gate on one target and opens the answer. */
  function checkTarget(key, label) {
    const text = label;
    const intent = { type: 'nutrition_target', nutrient: key, summary: `Check your daily ${M.TARGET_RULES[key].label} target against the evidence.` };
    const draft = M.evaluateChange(intent, C.getState(), { requestText: text });
    const id = A.createRecommendation(draft, { trigger: 'user_request', requestText: text });
    A.push('recommendation', { id });
  }

  const RECENT_CHANGES = 3;
  function Targets() {
    const s = C.useApp();
    const t = s.targets;
    const done = U.isDone(s, 'targets');
    const [form, setForm] = useState(() => Object.fromEntries(TARGET_FIELDS.map((f) => [f.key, t[f.key] != null ? String(t[f.key]) : ''])));
    const values = Object.fromEntries(TARGET_FIELDS.map((f) => [f.key, U.parseNumber(form[f.key])]));
    const errors = Object.fromEntries(TARGET_FIELDS.map((f) => {
      const v = values[f.key];
      return [f.key, Number.isNaN(v) || v < f.min || v > f.max ? `Enter ${f.min} to ${f.max.toLocaleString('en-GB')}.` : null];
    }));
    const ok = TARGET_FIELDS.every((f) => !errors[f.key]);
    const changed = TARGET_FIELDS.some((f) => values[f.key] !== t[f.key]);
    const edHistory = (s.profile.safetyFlags || []).includes('eating_disorder_history');
    const save = () => {
      if (changed) A.setTargets(Object.fromEntries(TARGET_FIELDS.map((f) => [f.key, Math.round(values[f.key])])));
      A.completeSetup('targets');
      A.toast(changed ? 'Targets saved' : 'Targets kept', 'success');
      A.pop();
    };
    const field = (f) => html`<div key=${f.key} style=${{ minWidth: 0 }}><${Input} label=${f.label} inputMode="numeric" value=${form[f.key]} error=${errors[f.key]}
      onChange=${(e) => { const v = digitsOnly(e.target.value, 5); setForm((x) => ({ ...x, [f.key]: v })); }} /></div>`;
    const history = (t.history || []).slice().reverse();

    return html`<${FormPage} title="Your daily targets" subtitle="Your own numbers. We never change them without asking."
      footer=${html`<${Primary} label=${!done && !changed ? 'These are right' : 'Save targets'} disabled=${!ok || (done && !changed)} onPress=${save} />`}>
      ${field(TARGET_FIELDS[0])}
      <div className="grid2">${TARGET_FIELDS.slice(1).map(field)}</div>
      ${edHistory ? html`<${Card}>
        <${Callout}>You told us about a history of disordered eating, so we won't suggest calorie targets. Keep these numbers, or change them yourself.<//>
      <//>` : null}
      <${Caption}>${`We suggest a change only when its claim has ${M.REQUIRED_SOURCES} verified studies, and only when you ask.`}<//>

      <${Section} title="Check against the evidence" caption="We look at your target, your goal and your weight, and suggest a change only if verified studies back it.">
        <${Rows} rows=${[['proteinG', 'Check my protein target'], ['fiberG', 'Check my fibre target']].map(([key, label]) => ({
          key, label, icon: 'checkmark.seal.fill', iconColor: 'ink',
          detail: M.claimByKey(M.TARGET_RULES[key].claim) && M.claimByKey(M.TARGET_RULES[key].claim).status === 'active' ? 'Backed by verified studies.' : 'Not enough evidence yet. We\'ll tell you why.',
          onPress: () => checkTarget(key, label)
        }))} />
      <//>

      <${Section} title="Changes" caption=${history.length > RECENT_CHANGES ? `The latest ${RECENT_CHANGES}, newest first. Every change is in History, under Nutrition.` : 'Newest first. Every change is also in History, under Nutrition.'}>
        <${Rows} rows=${history.slice(0, RECENT_CHANGES).map((h, i) => ({
          key: `${h.at}-${i}`,
          label: `${M.fmt.relativeDay(h.at)}${i === 0 ? ', current' : ''}`,
          detail: targetSummary(h.values),
          right: html`<${Badge} palette="splitOrigin" status=${h.origin || 'user_edit'} />`
        }))} />
      <//>
    <//>`;
  }

  /* -------------------------------------------------------------- Devices */
  function Devices() {
    const s = C.useApp();
    const done = U.isDone(s, 'devices');
    const imported = s.devices.apple_health && s.devices.apple_health.lastImport;
    const finish = () => {
      A.completeSetup('devices');
      A.pop();
    };
    return html`<${FormPage} title="Connected devices" subtitle="Optional. Choose what each one shares."
      footer=${html`<${Primary} label="Done" onPress=${finish} />`}>
      <${Rows} rows=${DEVICE_ORDER.filter((p) => s.devices[p]).map((p) => ({
        key: p,
        label: D.PROVIDERS[p].name,
        right: html`<${Badge} palette="connection" status=${s.devices[p].status} />`,
        onPress: () => A.push('device', { provider: p })
      }))} />
      <${Rows} rows=${[{
        key: 'import', icon: 'heart', iconColor: 'ink', label: 'Import a Health export',
        detail: imported ? `Last imported ${M.fmt.relativeDay(imported.at).toLowerCase()}, from ${imported.fileName || 'a Health export'}.` : 'Fill in your age, height and weight from the file the Health app exports.',
        onPress: () => A.push('health-import')
      }]} />
      <${Caption}>${`We compare this data with your own baseline. We never sell it or use it for advertising.${done ? '' : ' Tap Done when you\'ve connected what you want.'}`}<//>
    <//>`;
  }

  /* --------------------------------------------------------------- Device */
  const IMPORT_WORDS = { birthDate: 'birth date', sexForEquations: 'sex', heightCm: 'height', weightKg: 'weight' };
  function importUse(note) {
    const words = (note.used || []).map((k) => IMPORT_WORDS[k]).filter(Boolean);
    return words.length ? `We used your ${M.listJoin(words)} from it.` : 'We didn’t use anything from it.';
  }
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
    const imported = dev.lastImport;
    const note = PROVIDER_NOTES[provider] ? html`<div className="stack-sm">
      <${Caption}>${PROVIDER_NOTES[provider]}<//>
      ${provider === 'apple_health' ? html`<${LinkButton} label="Import a Health export" size="callout" align="flex-start" onPress=${() => A.push('health-import')} />` : null}
      ${imported ? html`<${Caption}>${`Last import: ${imported.fileName || 'a Health export'}, ${longDate(imported.at)}. ${importUse(imported)}`}<//>` : null}
    </div>` : null;
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
    const [choices, setChoices] = useState(() => Object.fromEntries(CONSENTS.map((c) => [c.key, c.required ? true : !!s.consents[c.key]])));
    const changed = CONSENTS.some((c) => !c.required && choices[c.key] !== !!s.consents[c.key]);
    const done = U.isDone(s, 'privacy');
    const save = () => {
      CONSENTS.forEach((c) => {
        if (!c.required && choices[c.key] !== !!s.consents[c.key]) A.setConsent(c.key, choices[c.key]);
      });
      A.completeSetup('privacy');
      A.toast('Saved');
      A.pop();
    };
    return html`<${FormPage} title="Privacy choices" subtitle="Only the first one is required. Change these any time."
      footer=${html`<${Primary} label="Save" disabled=${done && !changed} onPress=${save} />`}>
      <${Rows} rows=${CONSENTS.map((c) => ({
        key: c.key,
        label: c.label,
        detail: c.detail,
        right: html`<${Switch} on=${!!choices[c.key]} label=${c.label} disabled=${!!c.required}
          onChange=${c.required ? null : (on) => setChoices((x) => ({ ...x, [c.key]: on }))} />`
      }))} />
      <${Caption}>Health data processing is how the app works, so it stays on. To stop it, delete your account. Turning another one off stops that use from then on.<//>
      <${LinkButton} label="Export or delete your data" size="callout" align="flex-start" onPress=${() => A.push('your-data')} />
      <${Caption}>In the app, each choice is saved with the date and the wording you agreed to.<//>
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
            <${Callout}>${`The ${plural(D.SOURCES.length, 'cited study', 'cited studies')} ${D.SOURCES.length === 1 ? 'is a real publication' : 'are real publications'}. ${plural(studies.length, 'study', 'studies')} currently back the claims we act on${checked ? `, last checked ${checked}` : ''}.`}<//>
            <${LinkButton} align="flex-start" label="See the evidence library" onPress=${() => A.push('evidence')} />
          </div>` : null}
          <${Callout}>Built with the Apple Design System, synced from rukkiecodes/claude-apple-design-system (MIT). Icons are stand-ins for SF Symbols.<//>
          <${Callout}>Nothing leaves your browser. Sign-in, email codes, cameras, device connections and downloads are simulated, and your changes stay in this browser.<//>
          <${Callout}>In the app, Claude by Anthropic reads your change requests. Here, a simple keyword matcher stands in, and the evidence gate is the same.<//>
        <//>

        <${Actions}>
          <${Button} fullWidth=${true} variant="outline" label="Start sign-up again" onPress=${confirmOnboarding} />
        <//>
      <//>
    <//>`;
  }

  /* ------------------------------------------------------------ register */
  const push = (title, extra) => ({ title, tab: 'today', presentation: 'push', demoParams: {}, ...(extra || {}) });
  C.registerScreen('settings', Settings, push('Settings'));
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
