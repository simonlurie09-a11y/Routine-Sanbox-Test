/* Companion prototype — setting up, after sign-up (core).
   Sign-up asks only for what the app can't start without: the disclaimer,
   your account (with the health-data consent), age, weight and goal, plus an
   optional Apple Health connection that fills in age and weight. Everything
   else is set up from the tabs, on pages laid out like the sign-up page
   (docs/07 §7.1, docs/08 §8.5): back chevron, large title, grey subtitle, the
   fields, then one primary pill at the bottom.

   This file holds the shared pieces (Companion.setup) and the setup pages:
   the "Finish setting up" list, health and safety, training, split, height
   and sex, goal, age, weight, notifications and the Apple Health import.
   Targets, devices and privacy choices live in 85-settings.js and use the
   same layout. */
(function () {
  'use strict';

  const C = window.Companion;
  const React = window.React;
  const { useState, useRef } = React;
  const { html, T, Card, Button, Input, Chip, PlainScreen, Rows, Facts, Caption, Callout, CardTitle, LinkButton,
    IconButton, Switch, Glyph, ChoiceChips, Stepper } = C.ui;
  const M = C.domain, D = C.data, A = C.actions, S = C.selectors, H = C.healthImport;

  /* ------------------------------------------------------------ constants */
  const ADULT_AGE = 18;
  const EARLIEST_YEAR = 1900;
  const SAFETY = [
    { flag: 'injury_reported', label: 'An injury or pain', detail: 'Anything that affects how you train.' },
    { flag: 'condition_reported', label: 'A medical condition', detail: 'Anything a doctor is treating or monitoring.' },
    { flag: 'clinician_supervised', label: 'A professional supervises my training', detail: 'For example a doctor or physiotherapist. It lifts the hold a medical condition puts on suggestions.', onlyWith: 'condition_reported' },
    { flag: 'pregnancy', label: 'Pregnancy', detail: 'Now, or if you might be.' },
    { flag: 'eating_disorder_history', label: 'A history of disordered eating', detail: 'Now or in the past.' }
  ];
  const SAFETY_FLAGS = SAFETY.map((x) => x.flag);
  const REGIONS = [
    { value: 'upper', label: 'Upper body' },
    { value: 'lower', label: 'Lower body' },
    { value: 'core', label: 'Core' }
  ];
  const SEX_OPTIONS = [
    { value: 'female', label: 'Female' },
    { value: 'male', label: 'Male' },
    { value: 'unspecified', label: 'Prefer not to say' }
  ];
  const EXPERIENCE = [
    { value: 'novice', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];
  const SESSION_MINUTES = [45, 60, 75, 90];
  const WEIGHT_UNITS = [{ value: 'kg', label: 'kg' }, { value: 'lb', label: 'lb' }];
  const LB = 0.45359237;
  const REVIEW_MUSCLES = ['chest', 'lats', 'quads', 'hamstrings'];

  /* What's left to set up after sign-up, most important first. A key that is
     false still needs doing; the sample profile has everything done. */
  const ITEMS = [
    { key: 'health', screen: 'setup-health', icon: 'heart', title: 'Health and safety', why: 'We need this before we suggest any change.' },
    { key: 'training', screen: 'setup-training', icon: 'dumbbell', title: 'Your training', why: 'Experience, days a week, session length and equipment.' },
    { key: 'split', screen: 'setup-split', icon: 'list.bullet', title: 'Your current split', why: 'Start from the sample, or add yours later.' },
    { key: 'targets', screen: 'targets', icon: 'target', title: 'Daily targets', why: 'Calories, protein, carbs, fat and fibre.' },
    { key: 'body', screen: 'setup-body', icon: 'person.crop.circle', title: 'Height and sex', why: 'Optional. For energy estimates.' },
    { key: 'devices', screen: 'devices', icon: 'applewatch', title: 'Connect your devices', why: 'Apple Health, Oura, WHOOP or Google.' },
    { key: 'notifications', screen: 'setup-notifications', icon: 'bell', title: 'Notifications', why: 'Only when something needs you.' },
    { key: 'privacy', screen: 'privacy', icon: 'lock.shield', title: 'Privacy choices', why: 'AI features, label photos and analytics. Off until you turn them on.' }
  ];
  const FRESH_SETUP = Object.fromEntries(ITEMS.map((i) => [i.key, false]));
  const isDone = (s, key) => !s.setup || s.setup[key] !== false;
  const remaining = (s, keys) => ITEMS.filter((i) => (!keys || keys.includes(i.key)) && !isDone(s, i.key));

  /* ------------------------------------------------------------- helpers */
  const thisYear = () => new Date().getFullYear();
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
  const plural = (n, one, many) => `${n.toLocaleString('en-GB')} ${n === 1 ? one : (many || `${one}s`)}`;
  const shortDate = (ts) => new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const longBirth = (iso) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  /* Birth year (and the exact date, when Health gave one) -> can they use the app? */
  function checkAge(yearText, birthDate) {
    const y = Number(yearText);
    const now = thisYear();
    const complete = String(yearText || '').length === 4;
    const valid = complete && y >= EARLIEST_YEAR && y <= now;
    const error = complete && !valid ? `Enter a year between ${EARLIEST_YEAR} and ${now}.` : null;
    if (!valid) return { valid: false, error, year: y, verdict: null };
    const exact = birthDate && Number(birthDate.slice(0, 4)) === y ? H.ageOn(birthDate) : null;
    const age = exact != null ? exact : now - y;
    /* Born exactly 18 years ago with no exact date: the year alone can't tell. */
    const verdict = exact != null ? (exact >= ADULT_AGE ? 'adult' : 'minor') : age > ADULT_AGE ? 'adult' : age < ADULT_AGE ? 'minor' : 'ask';
    return { valid: true, error: null, year: y, age, verdict };
  }
  /* Weight text in kg (30 to 300) or lb (66 to 661) -> kilograms. Pounds are
     kept to 0.01 kg so they convert back to exactly what was typed. */
  const WEIGHT_RANGE = { kg: [30, 300], lb: [66, 661] };
  function checkWeight(text, unit) {
    const v = parseNumber(text);
    const [lo, hi] = WEIGHT_RANGE[unit] || WEIGHT_RANGE.kg;
    const error = text !== '' && !(v >= lo && v <= hi) ? `Between ${lo} and ${hi} ${unit}.` : null;
    const kg = unit === 'lb' ? Math.round(v * LB * 100) / 100 : Math.round(v * 10) / 10;
    return { valid: text !== '' && !error, error, kg };
  }
  const weightText = (kg, unit) => (kg == null ? '' : String(unit === 'lb' ? Math.round((kg / LB) * 10) / 10 : Math.round(kg * 10) / 10));

  /* ------------------------------------------------------------- layout */
  /* The sign-up page layout. onBack defaults to popping the stack; pass null
     for no chevron. */
  function FormPage({ title, subtitle, onBack, topRight, footer, children }) {
    const back = onBack === undefined ? A.pop : onBack;
    const topLeft = back ? html`<${IconButton} name="chevron.left" label="Back" size=${26} onPress=${back} />` : null;
    return html`<${PlainScreen} title=${title} subtitle=${subtitle} topLeft=${topLeft} topRight=${topRight} footer=${footer}>
      ${children}
    <//>`;
  }
  const Primary = ({ label, onPress, disabled, loading }) =>
    html`<${Button} fullWidth=${true} label=${label} onPress=${onPress} disabled=${!!disabled} loading=${!!loading} />`;
  const Ghost = ({ label, onPress }) =>
    html`<${Button} fullWidth=${true} variant="ghost" label=${label} onPress=${onPress} />`;

  /* A labelled group of controls (the label matches the Input label style). */
  function Field({ label, hint, children }) {
    return html`<div className="stack-xs">
      <${T} size="callout" font="semiBold" as="p">${label}<//>
      ${children}
      ${hint ? html`<${Caption}>${hint}<//>` : null}
    </div>`;
  }
  /* A grid cell that lets its field shrink to the column. */
  const Cell = ({ children }) => html`<div style=${{ minWidth: 0 }}>${children}</div>`;

  function MultiChips({ options, values, onChange, label, order }) {
    return html`<div className="row row--wrap" role="group" aria-label=${label}>
      ${options.map((o) => html`<${Chip} key=${o.value} variant="filter" active=${values.includes(o.value)} label=${o.label}
        onPress=${() => onChange(toggleIn(values, o.value, order))} />`)}
    </div>`;
  }

  /* Selectable option card: the system's "account type" pattern. */
  function OptionCard({ icon, title, body, selected, onPress }) {
    return html`<${Card} selected=${selected} onPress=${onPress} className="option">
      <${Glyph} name=${icon} size=${28} color=${selected ? 'primary' : 'ink'} />
      <div className="stack-xs grow">
        <${T} size="headline" font="semiBold">${title}<//>
        <${T} size="callout" color="inkMuted48">${body}<//>
      </div>
    <//>`;
  }

  /* A tick box with its label (the design system has none): a circle that
     fills with the primary colour, like an iOS selection mark. */
  function Check({ checked, onChange, label, detail, error }) {
    return html`<button type="button" role="checkbox" aria-checked=${checked ? 'true' : 'false'} className="check"
      onClick=${() => onChange(!checked)}>
      <span className=${'check__box' + (checked ? ' check__box--on' : '') + (error ? ' check__box--error' : '')} aria-hidden="true">
        ${checked ? html`<${Glyph} name="checkmark" size=${16} color="onPrimary" />` : null}
      </span>
      <span className="stack-xxs grow">
        <${T} size="body">${label}<//>
        ${detail ? html`<${T} size="caption" color="inkMuted80">${detail}<//>` : null}
        ${error ? html`<${T} size="caption" color="danger">${error}<//>` : null}
      </span>
    </button>`;
  }

  /* The source line under a value Apple Health filled in. */
  const FromHealth = ({ text }) => html`<div className="row">
    <${Glyph} name="heart" size=${16} color="primary" />
    <${T} size="caption" color="inkMuted80">${text}<//>
  </div>`;

  /* --------------------------------------------- forms shared with sign-up */
  function GoalOptions({ value, onChange }) {
    return html`<div className="stack-sm" style=${{ gap: 'var(--spacing-base)' }}>
      ${M.GOALS.map((g) => html`<${OptionCard} key=${g.id} icon=${g.icon} title=${g.label} body=${g.body}
        selected=${value === g.id} onPress=${() => onChange(g.id)} />`)}
    </div>`;
  }
  function AgeField({ value, onChange, error }) {
    return html`<${Input} label="Birth year" inputMode="numeric" autoComplete="bday-year" placeholder="For example, 1990"
      value=${value} error=${error} onChange=${(e) => onChange(digitsOnly(e.target.value, 4))} />`;
  }
  function WeightField({ value, unit, onChange, onUnit, error }) {
    const changeUnit = (next) => {
      if (next === unit) return;
      const v = parseNumber(value);
      if (!Number.isNaN(v)) onChange(String(Math.round((next === 'lb' ? v / LB : v * LB) * 10) / 10));
      onUnit(next);
    };
    return html`<div className="stack-sm">
      <${Input} label=${`Weight (${unit})`} inputMode="decimal" autoComplete="off" value=${value} error=${error}
        placeholder=${unit === 'lb' ? 'For example, 165' : 'For example, 75'} onChange=${(e) => onChange(decimalOnly(e.target.value))} />
      <${ChoiceChips} label="Weight unit" options=${WEIGHT_UNITS} value=${unit} onChange=${changeUnit} />
    </div>`;
  }

  /* ------------------------------------------------------ setup actions */
  function saved(key, message) {
    A.completeSetup(key);
    A.toast(message || 'Saved');
    A.pop();
  }

  /* ----------------------------------------------- the "finish" card */
  /* Shown in a tab while any of `keys` (default: all) is left to do. */
  function SetupCard({ keys, title = 'Finish setting up', max = 3 }) {
    const s = C.useApp();
    const left = remaining(s, keys);
    if (!left.length) return null;
    const total = keys ? keys.length : ITEMS.length;
    const shown = left.slice(0, max);
    return html`<${Card}>
      <div className="stack-xs">
        <${CardTitle}>${title}<//>
        <${Caption}>${keys && keys.length === 1
          ? left[0].why
          : `${total - left.length} of ${total} done. Each takes about a minute.`}<//>
      </div>
      <${Rows} rows=${shown.map((item) => ({
        key: item.key, icon: item.icon, iconColor: 'ink', label: item.title,
        detail: keys && keys.length === 1 ? null : item.why,
        onPress: () => A.push(item.screen)
      }))} />
      ${left.length > shown.length ? html`<${LinkButton} align="flex-start" size="callout" label=${`See all ${left.length}`}
        onPress=${() => A.push('setup')} />` : null}
    <//>`;
  }

  /* -------------------------------------------------------- the list */
  function SetupList() {
    const s = C.useApp();
    const left = remaining(s);
    const done = ITEMS.length - left.length;
    return html`<${FormPage} title="Finish setting up"
      subtitle=${left.length ? `${done} of ${ITEMS.length} done. Each takes about a minute.` : "You're all set up."}
      footer=${html`<${Primary} label="Done" onPress=${A.pop} />`}>
      <${Rows} rows=${ITEMS.map((item) => {
        const ok = isDone(s, item.key);
        return {
          key: item.key, icon: ok ? 'checkmark' : item.icon, iconColor: ok ? 'primary' : 'ink',
          label: item.title, detail: ok ? 'Done' : item.why, onPress: () => A.push(item.screen)
        };
      })} />
      <${Caption}>You can change any of these later in Settings.<//>
    <//>`;
  }

  /* ------------------------------------------------ health and safety */
  function HealthPage() {
    const s = C.useApp();
    const p = s.profile;
    const [flags, setFlags] = useState(() => (p.safetyFlags || []).filter((f) => SAFETY_FLAGS.includes(f)));
    const [regions, setRegions] = useState(() => (p.injuryRegions || []).slice());
    const [notes, setNotes] = useState(() => p.healthNotes || '');
    const has = (f) => flags.includes(f);
    const injured = has('injury_reported');
    const needsRegion = injured && !regions.length;
    const regionWords = REGIONS.filter((r) => regions.includes(r.value)).map((r) => r.label.toLowerCase());
    const changes = [];
    if (injured) {
      changes.push(regionWords.length
        ? `We won't suggest changes that load your ${M.listJoin(regionWords)}.`
        : 'Tell us where, so we know which suggestions to pause.');
    }
    if (has('condition_reported')) {
      changes.push(has('clinician_supervised')
        ? "A professional supervises your training, so we'll make suggestions and note it on each one."
        : 'We hold training suggestions until you tell us a professional is supervising your training.');
    }
    if (has('pregnancy')) changes.push("We won't make training or nutrition suggestions. Logging still works.");
    if (has('eating_disorder_history')) changes.push("We won't suggest calorie-deficit or weight-loss targets.");
    const setFlag = (flag, on) => {
      let next = flags.filter((f) => f !== flag);
      if (on) next = toggleIn(next, flag, SAFETY_FLAGS);
      if (flag === 'condition_reported' && !on) next = next.filter((f) => f !== 'clinician_supervised');
      setFlags(next);
    };
    const save = () => {
      const others = (p.safetyFlags || []).filter((f) => !SAFETY_FLAGS.includes(f));
      A.updateProfile({
        safetyFlags: [...others, ...flags],
        injuryRegions: injured ? regions.slice() : [],
        healthNotes: notes.trim()
      });
      saved('health');
    };
    const shown = SAFETY.filter((q) => !q.onlyWith || has(q.onlyWith));
    return html`<${FormPage} title="Health and safety" subtitle="Do any of these apply to you?"
      footer=${html`<${Primary} label="Save" onPress=${save} disabled=${needsRegion} />`}>
      <${Rows} rows=${shown.map((q) => ({
        key: q.flag, label: q.label, detail: q.detail,
        right: html`<${Switch} on=${has(q.flag)} label=${q.label} onChange=${(on) => setFlag(q.flag, on)} />`
      }))} />
      ${injured ? html`<${Field} label="Where is it?" hint=${needsRegion ? 'Pick at least one area to save.' : 'Pick every area that applies.'}>
        <${MultiChips} label="Where is the injury?" options=${REGIONS} values=${regions}
          order=${REGIONS.map((r) => r.value)} onChange=${setRegions} />
      <//>` : null}
      ${changes.length ? html`<${Card}>
        <div className="row">
          <${Glyph} name="info.circle" size=${22} color="ink" />
          <${CardTitle}>What this changes<//>
        </div>
        <ul className="stack-sm">
          ${changes.map((c) => html`<li key=${c}><${Callout}>${c}<//></li>`)}
        </ul>
        <div className="hairline-top">
          <${Callout}>Please talk to a qualified healthcare professional before you change your training or diet.<//>
        </div>
      <//>` : html`<${Caption}>If none of these apply, leave them off and save. You can change them any time.<//>`}
      <${Input} label="Anything else we should know?" value=${notes} hint="Optional. Stored encrypted."
        onChange=${(e) => setNotes(e.target.value)} />
    <//>`;
  }

  /* --------------------------------------------------------- training */
  function TrainingPage() {
    const s = C.useApp();
    const p = s.profile;
    const [form, setForm] = useState(() => ({
      experience: p.experience || 'intermediate',
      daysPerWeek: p.daysPerWeek || 4,
      sessionMinutes: SESSION_MINUTES.includes(p.sessionMinutes) ? p.sessionMinutes : 60,
      equipment: (p.equipment || D.EQUIPMENT).slice()
    }));
    const set = (patch) => setForm((f) => ({ ...f, ...patch }));
    const save = () => {
      A.updateProfile({ ...form, equipment: form.equipment.slice() });
      saved('training');
    };
    return html`<${FormPage} title="Your training" subtitle="So anything we suggest fits your week."
      footer=${html`<${Primary} label="Save" onPress=${save} />`}>
      <${Field} label="Experience">
        <${ChoiceChips} label="Experience" options=${EXPERIENCE} value=${form.experience} onChange=${(v) => set({ experience: v })} />
      <//>
      <div className="row row--between">
        <${T} size="callout" font="semiBold" as="p">Days per week<//>
        <${Stepper} label="days per week" value=${form.daysPerWeek} min=${1} max=${7} onChange=${(v) => set({ daysPerWeek: v })} />
      </div>
      <${Field} label="Session length" hint="Including warm-up. We keep suggestions inside it.">
        <${ChoiceChips} label="Session length" options=${SESSION_MINUTES.map((m) => ({ value: m, label: `${m} min` }))}
          value=${form.sessionMinutes} onChange=${(v) => set({ sessionMinutes: v })} />
      <//>
      <${Field} label="Equipment you can use" hint="Pick everything you have access to.">
        <${MultiChips} label="Equipment" options=${D.EQUIPMENT.map((e) => ({ value: e, label: M.capitalise(e) }))}
          values=${form.equipment} order=${D.EQUIPMENT} onChange=${(v) => set({ equipment: v })} />
      <//>
    <//>`;
  }

  /* ------------------------------------------------------------ split */
  function SplitPage() {
    const s = C.useApp();
    const p = s.profile;
    const [choice, setChoice] = useState(() => (isDone(s, 'split') ? p.splitSource || 'sample' : null));
    const def = S.currentDefinition(s);
    const review = M.reviewSplit(def, p);
    const minutes = Object.values(review.minutes);
    const lo = Math.min(...minutes);
    const hi = Math.max(...minutes);
    const restDays = 7 - new Set(def.days.map((d) => d.weekday).filter((w) => w != null)).size;
    const save = () => {
      A.updateProfile({ splitSource: choice });
      saved('split');
    };
    return html`<${FormPage} title="Your current split" subtitle="Start from the sample, or add yours later."
      footer=${html`<${Primary} label="Save" onPress=${save} disabled=${!choice} />`}>
      <div className="stack-sm" style=${{ gap: 'var(--spacing-base)' }}>
        <${OptionCard} icon="list.bullet" title="Use the sample split" body=${`${s.split.name}, already set up.`}
          selected=${choice === 'sample'} onPress=${() => setChoice('sample')} />
        <${OptionCard} icon="pencil" title="Add mine later" body="Enter your own from the Training tab."
          selected=${choice === 'later'} onPress=${() => setChoice('later')} />
      </div>
      ${choice === 'sample' ? html`<${Card}>
        <div className="stack-xs">
          <${CardTitle}>${s.split.name}<//>
          <${Caption}>Weekly sets per muscle<//>
        </div>
        <${Facts} rows=${[
          ...REVIEW_MUSCLES.map((id) => [M.muscleById(id).name, `${M.fmt.sets(review.volume[id])} sets`]),
          ['Sessions a week', String(def.days.length)],
          ['Session length', lo === hi ? `About ${lo} min` : `${lo}–${hi} min`],
          ['Rest days', String(restDays)]
        ]} />
        <${Caption}>This describes your plan; it isn't advice. A set counts once for its main muscle and half for helpers. The full review is in Training.<//>
      <//>` : null}
      ${choice === 'later' ? html`<${Caption}>The prototype keeps the sample split so the Training tab has something to show.<//>` : null}
    <//>`;
  }

  /* --------------------------------------------------- height and sex */
  function BodyPage() {
    const s = C.useApp();
    const p = s.profile;
    const [height, setHeight] = useState(() => (p.heightCm != null ? String(p.heightCm) : ''));
    const [sex, setSex] = useState(() => p.sexForEquations || 'unspecified');
    const h = parseNumber(height);
    const hErr = height !== '' && !(h >= 100 && h <= 250) ? 'Between 100 and 250 cm.' : null;
    const save = () => {
      A.updateProfile({ heightCm: height === '' ? null : Math.round(h), sexForEquations: sex });
      saved('body');
    };
    return html`<${FormPage} title="Height and sex" subtitle="We use these for energy estimates. Both are optional."
      footer=${html`<${Primary} label="Save" onPress=${save} disabled=${!!hErr} />`}>
      <${Input} label="Height (cm)" inputMode="numeric" value=${height} error=${hErr}
        onChange=${(e) => setHeight(digitsOnly(e.target.value, 3))} />
      <${Field} label="Sex for energy equations" hint="Energy equations differ slightly by sex, and we use it for nothing else.">
        <${ChoiceChips} label="Sex for energy equations" options=${SEX_OPTIONS} value=${sex} onChange=${setSex} />
      <//>
    <//>`;
  }

  /* ------------------------------------------------- goal, age, weight */
  function GoalPage() {
    const s = C.useApp();
    const [goal, setGoal] = useState(s.profile.goal || null);
    const save = () => {
      A.updateProfile({ goal });
      A.toast('Saved');
      A.pop();
    };
    return html`<${FormPage} title="What do you want to work on?" subtitle="Pick one. We use it to decide which studies apply to you."
      footer=${html`<${Primary} label="Save" onPress=${save} disabled=${!goal || goal === s.profile.goal} />`}>
      <${GoalOptions} value=${goal} onChange=${setGoal} />
    <//>`;
  }

  function AgePage() {
    const s = C.useApp();
    const p = s.profile;
    const [year, setYear] = useState(() => (p.birthYear ? String(p.birthYear) : ''));
    const keepDate = p.birthDate && Number(p.birthDate.slice(0, 4)) === Number(year) ? p.birthDate : null;
    const check = checkAge(year, keepDate);
    const minor = check.valid && check.verdict === 'minor';
    const store = () => {
      A.updateProfile({ birthYear: check.year, birthDate: keepDate });
      A.toast('Saved');
      A.pop();
    };
    /* Born exactly 18 years ago: the year alone can't tell, so ask (as sign-up does). */
    const save = () => (check.verdict !== 'ask' ? store() : A.alert({
      title: `Have you turned ${ADULT_AGE} yet?`,
      message: `If you were born in ${check.year}, you turn ${ADULT_AGE} this year.`,
      buttons: [
        { label: 'Not yet', style: 'cancel', onPress: () => A.toast(`Companion is for adults, ${ADULT_AGE} and over, so we haven't saved it.`, 'error') },
        { label: `Yes, I'm ${ADULT_AGE}`, onPress: store }
      ]
    }));
    return html`<${FormPage} title="What year were you born?" subtitle=${`Companion is for adults, ${ADULT_AGE} and over.`}
      footer=${html`<${Primary} label="Save" onPress=${save} disabled=${!check.valid || minor || check.year === p.birthYear} />`}>
      <${AgeField} value=${year} onChange=${setYear}
        error=${check.error || (minor ? `Companion is for adults, ${ADULT_AGE} and over, so we can't save this year.` : null)} />
      ${keepDate ? html`<${FromHealth} text=${`Born ${longBirth(keepDate)}, from Apple Health.`} />` : null}
      <${Caption}>We use it for energy estimates.<//>
    <//>`;
  }

  function WeightPage() {
    const s = C.useApp();
    const p = s.profile;
    const [unit, setUnit] = useState(() => p.weightUnit || 'kg');
    const [text, setText] = useState(() => weightText(p.weightKg, p.weightUnit || 'kg'));
    const check = checkWeight(text, unit);
    const same = check.valid && unit === (p.weightUnit || 'kg') && parseNumber(text) === parseNumber(weightText(p.weightKg, unit));
    const save = () => {
      A.updateProfile({ weightKg: check.kg, weightUnit: unit });
      A.toast('Saved');
      A.pop();
    };
    return html`<${FormPage} title="What do you weigh?" subtitle="We use it to work out protein and energy targets."
      footer=${html`<${Primary} label="Save" onPress=${save} disabled=${!check.valid || same} />`}>
      <${WeightField} value=${text} unit=${unit} onChange=${setText} onUnit=${setUnit} error=${check.error} />
      <${Caption}>Weigh yourself at the same time of day for the most useful numbers.<//>
    <//>`;
  }

  /* --------------------------------------------------- notifications */
  function NotificationsPage() {
    const s = C.useApp();
    const on = !!s.profile.notificationsAllowed;
    const decide = (allow) => {
      A.updateProfile({ notificationsAllowed: allow });
      saved('notifications', allow ? 'Notifications on' : 'Notifications off');
    };
    return html`<${FormPage} title="Stay in the loop" subtitle="We only notify you when something needs you."
      footer=${on
        ? html`<${Primary} label="Keep them on" onPress=${() => decide(true)} /><${Ghost} label="Turn them off" onPress=${() => decide(false)} />`
        : html`<${Primary} label="Allow notifications" onPress=${() => decide(true)} /><${Ghost} label="Not now" onPress=${() => decide(false)} />`}>
      <${Rows} rows=${[
        { key: 'suggestion', icon: 'dumbbell', iconColor: 'ink', label: 'A suggestion to review' },
        { key: 'device', icon: 'applewatch', iconColor: 'ink', label: 'A device to reconnect' },
        { key: 'export', icon: 'square.and.arrow.up', iconColor: 'ink', label: 'Your data export is ready' }
      ]} />
      <${Caption}>${`Notifications are ${on ? 'on' : 'off'}. They never include health values. In the app, your phone asks you to confirm. In the prototype, nothing is sent.`}<//>
    <//>`;
  }

  /* ------------------------------------------------ Apple Health import */
  /* Pick the Health export, read it on the device, show what we found.
     onResult(summary) runs once it's read; the caller decides what to keep. */
  function HealthImportPanel({ onResult, summary }) {
    const [state, setState] = useState({ phase: 'idle', progress: 0, error: null, name: null });
    const input = useRef(null);
    const abort = useRef(null);
    const pick = (e) => {
      const file = e.target.files && e.target.files[0];
      e.target.value = '';
      if (!file) return;
      const ctl = typeof AbortController === 'function' ? new AbortController() : null;
      abort.current = ctl;
      setState({ phase: 'reading', progress: 0, error: null, name: file.name });
      let last = 0;
      H.read(file, {
        signal: ctl && ctl.signal,
        onProgress: (f) => {
          if (f - last >= 0.01 || f === 1) {
            last = f;
            setState((st) => (st.phase === 'reading' ? { ...st, progress: f } : st));
          }
        }
      }).then((result) => {
        setState({ phase: 'done', progress: 1, error: null, name: file.name });
        onResult(result);
      }, (err) => {
        const message = err && err.code === 'cancelled' ? null
          : err instanceof H.ImportError ? err.message : "We couldn't read this file. Try exporting from Health again.";
        setState({ phase: message ? 'error' : 'idle', progress: 0, error: message, name: file.name });
      });
    };
    const stop = () => abort.current && abort.current.abort();
    const reading = state.phase === 'reading';
    return html`<div className="stack">
      <ol className="steps">
        <li><${Callout}>On your iPhone, open the Health app.<//></li>
        <li><${Callout}>Tap your picture, then Export All Health Data.<//></li>
        <li><${Callout}>Save export.zip to Files, then choose it here.<//></li>
      </ol>
      ${reading ? html`<${Card}>
        <div className="row row--between">
          <${T} size="body" font="semiBold">Reading ${state.name || 'your export'}<//>
          <${T} size="callout" color="inkMuted80" className="tabular">${Math.round(state.progress * 100)}%<//>
        </div>
        <div className="bar" role="progressbar" aria-label="Reading the export" aria-valuemin="0" aria-valuemax="100"
          aria-valuenow=${Math.round(state.progress * 100)}><span style=${{ width: `${Math.round(state.progress * 100)}%` }}></span></div>
        <${Caption}>A few years of data can take a minute. It stays on this device.<//>
        <${LinkButton} label="Stop" size="callout" align="flex-start" onPress=${stop} />
      <//>` : html`<label className=${'ads-btn ads-btn--full file-pick ' + (summary ? 'ads-btn--outline' : 'ads-btn--primary')}>
        <input ref=${input} type="file" accept=".zip,.xml,application/zip,text/xml,application/xml" onChange=${pick} />
        <${T} size="body" style=${{ color: 'inherit' }}>${summary ? 'Choose another file' : 'Choose your Health export'}<//>
      </label>`}
      ${state.error ? html`<${Callout} color="danger">${state.error}<//>` : null}
      ${summary ? html`<${HealthSummary} summary=${summary} />` : null}
      <${Caption}>We read the file on this device. Nothing is uploaded, and the file isn't stored. We keep your birth date, sex, height and weight, and a note of the file's name and how many records it had.<//>
    </div>`;
  }

  /* What an export (or the simulated connection) holds. */
  function HealthSummary({ summary }) {
    const c = summary.counts;
    const age = summary.birthDate ? H.ageOn(summary.birthDate) : null;
    const when = (x) => (x && Number.isFinite(x.at) ? `, ${shortDate(x.at)}` : '');
    const found = [
      c.sleep ? plural(c.sleep, 'night of sleep', 'nights of sleep') : null,
      c.hrv ? plural(c.hrv, 'HRV reading') : null,
      c.restingHr ? plural(c.restingHr, 'resting heart rate') : null,
      c.workouts ? plural(c.workouts, 'workout') : null
    ].filter(Boolean);
    return html`<${Card}>
      <${CardTitle}>${summary.simulated ? 'From Apple Health' : `From ${summary.fileName || 'your export'}`}<//>
      <${Facts} rows=${[
        ['Born', summary.birthDate ? `${longBirth(summary.birthDate)} (${age})` : 'Not in Health'],
        ['Weight', summary.weightKg ? `${M.fmt.num(summary.weightKg.value, 1)} kg${when(summary.weightKg)}` : 'Not in Health'],
        ['Height', summary.heightCm ? `${Math.round(summary.heightCm.value)} cm${when(summary.heightCm)}` : 'Not in Health'],
        ['Sex', summary.sex ? M.capitalise(summary.sex) : 'Not in Health']
      ]} />
      ${found.length ? html`<${Caption}>${`It also has ${M.listJoin(found)}. The app reads these from Health every day; a one-off export can't stay up to date, so the prototype doesn't use them.`}<//>` : null}
    <//>`;
  }

  /* The import as a page (from Connected devices or the Apple Health page). */
  function HealthImportPage() {
    const s = C.useApp();
    const [summary, setSummary] = useState(null);
    const patch = summary ? H.toProfile(summary) : null;
    const minor = !!(summary && summary.birthDate && H.ageOn(summary.birthDate) < ADULT_AGE);
    const use = () => {
      if (minor) return;
      const p = { ...patch };
      A.updateProfile(p);
      A.recordHealthImport(summary, Object.keys(p).filter((k) => k !== 'birthYear'));
      if (p.heightCm) A.completeSetup('body');
      A.toast('Details updated from Apple Health', 'success');
      A.pop();
    };
    const fields = patch ? Object.keys(patch).filter((k) => k !== 'birthDate').length : 0;
    const prior = s.devices.apple_health && s.devices.apple_health.lastImport;
    return html`<${FormPage} title="Import from Apple Health" subtitle="Use the file the Health app exports."
      footer=${summary ? html`<${Primary} label="Use these details" onPress=${use} disabled=${!fields || minor} />` : null}>
      <${HealthImportPanel} summary=${summary} onResult=${setSummary} />
      ${minor ? html`<${Callout} color="danger">${`This export says its owner is under ${ADULT_AGE}, so we can't use any of it. Companion is for adults.`}<//>` : null}
      ${!summary && prior ? html`<${Caption}>${`Last import: ${prior.fileName}, ${shortDate(prior.at)}.`}<//>` : null}
    <//>`;
  }

  /* --------------------------------------------------- AI consent, at use */
  /* AI features are optional and start off, so they're asked for where
     they're first used: a request in your own words, or a label photo.
     One consent covers both, so the text names both. */
  const AI_USE = {
    requests: {
      subtitle: 'So we can understand requests in your own words.',
      body: 'Claude, by Anthropic, reads the words you type here and works out what you’re asking for. Our evidence check then decides, the same as always.',
      sent: 'We send the words you type, not your health records.'
    },
    labels: {
      subtitle: 'So we can read label photos.',
      body: 'Your phone reads the text on the label. When the text is hard to read, or there’s no nutrition panel, Claude, by Anthropic, tidies the ingredients and estimates the values from them, and we show how sure we are.',
      sent: 'We send the text from the label, not your health records.'
    }
  };
  function AiConsent({ use, topLeft, dark, otherLabel, onOther }) {
    const u = AI_USE[use];
    const turnOn = () => {
      A.setConsent('ai_processing', true);
      A.toast('AI features on');
    };
    return html`<${PlainScreen} dark=${dark} title="Turn on AI features?" subtitle=${u.subtitle} topLeft=${topLeft}
      footer=${html`<${Button} fullWidth=${true} label="Turn on and continue" onPress=${turnOn} />
        <${Button} fullWidth=${true} variant="ghost" label=${otherLabel} onPress=${onOther} />`}>
      <${T} size="body" color=${dark ? 'onDark' : 'ink'} as="p">${u.body}<//>
      <${T} size="callout" color=${dark ? 'bodyOnDark' : 'inkMuted80'} as="p">${`${u.sent} The same setting covers requests in your own words and label photos. You can turn it off in Settings, under Privacy choices.`}<//>
      <${T} size="caption" color=${dark ? 'bodyMuted' : 'inkMuted48'} as="p">In the prototype, simple rules stand in for Claude, and nothing leaves your browser.<//>
    <//>`;
  }

  /* ------------------------------------------------------------ register */
  const push = (title, extra) => ({ title, tab: 'today', presentation: 'push', demoParams: {}, ...(extra || {}) });
  C.registerScreen('setup', SetupList, push('Finish setting up'));
  C.registerScreen('setup-health', HealthPage, push('Health and safety'));
  C.registerScreen('setup-training', TrainingPage, push('Your training'));
  C.registerScreen('setup-split', SplitPage, push('Your current split'));
  C.registerScreen('setup-body', BodyPage, push('Height and sex'));
  C.registerScreen('setup-goal', GoalPage, push('Goal'));
  C.registerScreen('setup-age', AgePage, push('Age'));
  C.registerScreen('setup-weight', WeightPage, push('Weight'));
  C.registerScreen('setup-notifications', NotificationsPage, push('Notifications'));
  C.registerScreen('health-import', HealthImportPage, push('Import from Apple Health'));

  C.setup = {
    ITEMS, FRESH_SETUP, isDone, remaining, SetupCard,
    ADULT_AGE, SAFETY, REGIONS, SEX_OPTIONS, EXPERIENCE, SESSION_MINUTES,
    FormPage, Primary, Ghost, Field, Cell, MultiChips, OptionCard, Check, FromHealth, AiConsent,
    GoalOptions, AgeField, WeightField, HealthImportPanel, HealthSummary,
    checkAge, checkWeight, weightText, parseNumber, digitsOnly, decimalOnly, toggleIn, longBirth
  };
})();
