/* Companion prototype — onboarding (builder A).
   The journey from docs/07 §7.1 on the design system's login and onboarding
   blueprint (docs/08 §8.5): splash, three slides, disclaimer, account, code,
   privacy, age gate, goal, basics, health and safety, training, split,
   targets, devices, notifications. Each step is a plain screen; answers live
   in this component and are applied through Companion.actions as each step
   completes. Sign-in, email codes, OAuth and notifications are simulated. */
(function () {
  'use strict';

  const C = window.Companion;
  const React = window.React;
  const { useState, useEffect, useLayoutEffect, useRef } = React;
  const { html, DS, T, Card, Button, Input, Chip, PlainScreen, Rows, Facts, Badge, Caption, Callout, Body,
    CardTitle, LinkButton, IconButton, Switch, Glyph, ChoiceChips, Stepper } = C.ui;
  const M = C.domain, D = C.data, A = C.actions, S = C.selectors;

  /* ------------------------------------------------------------ constants */
  const STEPS = ['splash', 'slides', 'disclaimer', 'account', 'code', 'privacy', 'age', 'under18', 'goal', 'basics',
    'health', 'training', 'split', 'targets', 'devices', 'notifications'];
  /* The default path (email code and the under-18 stop are branches). */
  const MAIN = STEPS.filter((s) => s !== 'code' && s !== 'under18');
  /* The back chevron appears from the account step on. */
  const NO_BACK = ['splash', 'slides', 'disclaimer'];

  const SPLASH_MS = 1500;
  const CODE_LENGTH = 6;
  const RESEND_SECONDS = 60;
  const ADULT_AGE = 18;
  const EARLIEST_YEAR = 1900;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const DEMO_EMAIL = 'you@example.com';

  const SLIDES = [
    { icon: 'barcode.viewfinder', title: 'Track food from a barcode or a label photo',
      body: "Scan a barcode, or photograph the label when there isn't one. We show what's in it and how sure we are." },
    { icon: 'checkmark.seal.fill', title: 'Training changes backed by research',
      body: `We only suggest a change when ${M.REQUIRED_SOURCES} verified studies support it. Otherwise we say so and change nothing.` },
    { icon: 'waveform.path.ecg', title: 'Your wearables, compared with you',
      body: "Sleep, HRV and resting heart rate are read against your own baseline, not anyone else's." }
  ];

  const CONSENTS = [
    { key: 'health_data_processing', label: 'Health data processing', required: true,
      detail: 'We store your food, training and device data, encrypted, to run the app. Required.' },
    { key: 'ai_processing', label: 'AI features',
      detail: 'Claude, by Anthropic, reads your change requests and hard-to-read labels. Off means you edit your split yourself.' },
    { key: 'scan_image_upload', label: 'Label photo upload',
      detail: "If your phone can't read a label, we upload the photo and delete it within 30 days." },
    { key: 'product_analytics', label: 'Product analytics',
      detail: 'Which screens you use, never health values. It helps us improve the app.' }
  ];

  const SAFETY = [
    { flag: 'injury_reported', label: 'An injury or pain', detail: 'Anything that affects how you train.' },
    { flag: 'condition_reported', label: 'A medical condition', detail: 'Anything a doctor is treating or monitoring.' },
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

  const TARGET_FIELDS = [
    { key: 'energyKcal', label: 'Calories (kcal)', min: 1, max: 10000 },
    { key: 'proteinG', label: 'Protein (g)', min: 0, max: 1000 },
    { key: 'carbohydrateG', label: 'Carbs (g)', min: 0, max: 1000 },
    { key: 'fatG', label: 'Fat (g)', min: 0, max: 1000 },
    { key: 'fiberG', label: 'Fibre (g)', min: 0, max: 300 }
  ];

  /* Muscles shown in the split's quick description (values come from M.reviewSplit). */
  const REVIEW_MUSCLES = ['chest', 'lats', 'quads', 'hamstrings'];

  const DEVICE_ORDER = ['apple_health', 'oura', 'whoop', 'google_health'];

  /* ------------------------------------------------------------- helpers */
  const thisYear = () => new Date().getFullYear();
  const parseNumber = (v) => {
    const t = String(v == null ? '' : v).trim().replace(',', '.');
    return /^\d+(\.\d+)?$/.test(t) ? Number(t) : NaN;
  };
  const digitsOnly = (v, max) => String(v || '').replace(/[^0-9]/g, '').slice(0, max);
  const decimalOnly = (v) => String(v || '').replace(/[^0-9.,]/g, '').slice(0, 6);
  const clock = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  const toggleIn = (list, value, order) => {
    const next = list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
    return order ? next.sort((a, b) => order.indexOf(a) - order.indexOf(b)) : next;
  };

  function initialAnswers(s, demo) {
    const p = s.profile;
    const d = demo || {};
    const t = s.targets;
    return {
      authMethod: d.step === 'code' ? 'email' : null,
      email: d.email || p.email || (d.step === 'code' ? DEMO_EMAIL : ''),
      /* Optional purposes start off: consent is opt-in. */
      consents: { health_data_processing: true, ai_processing: false, scan_image_upload: false, product_analytics: false },
      birthYear: d.birthYear ? String(d.birthYear) : '',
      goal: d.goal || null,
      heightCm: p.heightCm != null ? String(p.heightCm) : '',
      weightKg: p.weightKg != null ? String(p.weightKg) : '',
      sexForEquations: p.sexForEquations || 'unspecified',
      flags: d.flags ? d.flags.slice() : (p.safetyFlags || []).filter((f) => SAFETY_FLAGS.includes(f)),
      injuryRegions: d.regions ? d.regions.slice() : (p.injuryRegions || []).slice(),
      healthNotes: p.healthNotes || '',
      experience: p.experience || 'intermediate',
      daysPerWeek: p.daysPerWeek || 4,
      sessionMinutes: SESSION_MINUTES.includes(p.sessionMinutes) ? p.sessionMinutes : 60,
      equipment: (p.equipment || D.EQUIPMENT).slice(),
      splitChoice: d.choice || null,
      targets: Object.fromEntries(TARGET_FIELDS.map((f) => [f.key, t[f.key] != null ? String(t[f.key]) : '']))
    };
  }

  /* The steps "behind" a demo start, so the back chevron works there too. */
  function initialTrail(step) {
    if (step === 'code') return MAIN.slice(0, MAIN.indexOf('account') + 1);
    if (step === 'under18') return MAIN.slice(0, MAIN.indexOf('age') + 1);
    const i = MAIN.indexOf(step);
    return i > 0 ? MAIN.slice(0, i) : [];
  }

  /* ------------------------------------------------------------ pieces */
  function Step({ title, subtitle, onBack, topRight, footer, children }) {
    const topLeft = onBack ? html`<${IconButton} name="chevron.left" label="Back" size=${26} onPress=${onBack} />` : null;
    return html`<${PlainScreen} title=${title} subtitle=${subtitle} topLeft=${topLeft} topRight=${topRight} footer=${footer}>
      ${children}
    <//>`;
  }

  const Primary = ({ label, onPress, disabled }) =>
    html`<${Button} fullWidth=${true} label=${label} onPress=${onPress} disabled=${!!disabled} />`;
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

  /* A grid cell that lets its field shrink to the column (inputs have an intrinsic width). */
  const Cell = ({ children }) => html`<div style=${{ minWidth: 0 }}>${children}</div>`;

  function MultiChips({ options, values, onChange, label, order }) {
    return html`<div className="row row--wrap" role="group" aria-label=${label}>
      ${options.map((o) => html`<${Chip} key=${o.value} variant="filter" active=${values.includes(o.value)} label=${o.label}
        onPress=${() => onChange(toggleIn(values, o.value, order))} />`)}
    </div>`;
  }

  /* Selectable option card: the system's "account type" pattern (mockup: goal). */
  function OptionCard({ icon, title, body, selected, onPress }) {
    return html`<${Card} selected=${selected} onPress=${onPress} className="option">
      <${Glyph} name=${icon} size=${28} color=${selected ? 'primary' : 'ink'} />
      <div className="stack-xs grow">
        <${T} size="headline" font="semiBold">${title}<//>
        <${T} size="callout" color="inkMuted48">${body}<//>
      </div>
    <//>`;
  }

  /* Pager dots: active 20 × 8 primary pill, others 8 × 8 hairline pills. */
  function Dots({ count, active }) {
    return html`<div className="row" role="img" aria-label=${`Slide ${active + 1} of ${count}`}>
      ${Array.from({ length: count }, (_, i) => html`<span key=${i} style=${{
        display: 'block',
        width: i === active ? 'var(--spacing-lg)' : 'var(--spacing-sm)',
        height: 'var(--spacing-sm)',
        borderRadius: 'var(--radius-pill)',
        background: i === active ? 'var(--primary)' : 'var(--hairline)'
      }}></span>`)}
    </div>`;
  }

  /* --------------------------------------------------------------- steps */

  /* 1. Splash: the wordmark, centred (the blueprint's one centred screen). */
  function Splash({ go }) {
    useEffect(() => {
      const t = setTimeout(() => go('slides'), SPLASH_MS);
      return () => clearTimeout(t);
    }, []);
    return html`<div className="screen">
      <button type="button" className="link" aria-label="Companion. Tap to start." onClick=${() => go('slides')}
        style=${{ flex: 1, width: '100%', justifyContent: 'center' }}>
        <${T} size="title2" font="bold" color="ink">Companion<//>
      </button>
    </div>`;
  }

  /* 2. Three horizontally paged slides. */
  function Slides({ go, demo }) {
    const startAt = Math.max(0, Math.min(SLIDES.length - 1, ((demo && demo.slide) || 1) - 1));
    const [idx, setIdx] = useState(startAt);
    const track = useRef(null);
    useLayoutEffect(() => {
      if (track.current && startAt) track.current.scrollLeft = startAt * track.current.clientWidth;
    }, []);
    const onScroll = (e) => {
      const el = e.currentTarget;
      const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
      if (i !== idx && i >= 0 && i < SLIDES.length) setIdx(i);
    };
    const toSlide = (i) => {
      setIdx(i);
      const el = track.current;
      if (!el) return;
      const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollTo({ left: i * el.clientWidth, behavior: reduce ? 'auto' : 'smooth' });
    };
    const last = idx === SLIDES.length - 1;
    const skip = html`<${LinkButton} label="Skip" size="callout" color="inkMuted48" onPress=${() => go('disclaimer')} />`;
    return html`<${Step} topRight=${skip}
      footer=${html`<${Primary} label=${last ? 'Get started' : 'Next'} onPress=${() => (last ? go('disclaimer') : toSlide(idx + 1))} />`}>
      <div ref=${track} onScroll=${onScroll} role="region" aria-roledescription="carousel" aria-label="What Companion does"
        style=${{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', scrollbarWidth: 'none',
          margin: '0 calc(-1 * var(--spacing-xl))' }}>
        ${SLIDES.map((sl, i) => html`<div key=${sl.title} className="stack" aria-roledescription="slide"
          aria-label=${`${i + 1} of ${SLIDES.length}`} aria-hidden=${i === idx ? undefined : 'true'}
          style=${{ flex: '0 0 100%', scrollSnapAlign: 'start', padding: '0 var(--spacing-xl)' }}>
          <div className="photo" style=${{ height: 'auto', aspectRatio: '4 / 3' }}>
            <${Glyph} name=${sl.icon} size=${56} color="inkMuted48" />
          </div>
          <div className="stack-sm">
            <${T} size="title2" font="bold" as="h1">${sl.title}<//>
            <${T} size="headline" color="inkMuted48" as="p">${sl.body}<//>
          </div>
        </div>`)}
      </div>
      <${Dots} count=${SLIDES.length} active=${idx} />
    <//>`;
  }

  /* 3. The medical disclaimer, acknowledged before anything else. */
  function Disclaimer({ go }) {
    const accept = () => {
      A.acknowledgeDisclaimer();
      go('account');
    };
    return html`<${Step} title="This isn't medical advice" subtitle="Please read this before you start."
      footer=${html`<${Primary} label="I understand" onPress=${accept} />`}>
      <${Body}>${D.DISCLAIMER.full}<//>
      <${Caption}>You can read this again in Settings, under About.<//>
    <//>`;
  }

  /* 4. Account: Sign in with Apple (Apple's own black button), Google, or email. */
  function Account({ ans, set, go, back, commit }) {
    const email = ans.email || '';
    const valid = EMAIL_RE.test(email.trim());
    const viaProvider = (method) => {
      set({ authMethod: method });
      commit({ signInMethod: method });
      go('privacy');
    };
    const sendCode = () => {
      const e = email.trim();
      set({ email: e, authMethod: 'email' });
      commit({ email: e, signInMethod: 'email' });
      go('code');
    };
    return html`<${Step} title="Create your account" subtitle="Your log and your plan are saved to it." onBack=${back}
      footer=${html`<${Primary} label="Send code" onPress=${sendCode} disabled=${!valid} />`}>
      <div className="stack-sm">
        <button type="button" className="ads-btn ads-btn--full" onClick=${() => viaProvider('apple')}
          style=${{ background: 'var(--surfaceBlack)', color: 'var(--onDark)' }}>
          <${T} size="body" style=${{ color: 'inherit' }}>Sign in with Apple<//>
        </button>
        <${Button} fullWidth=${true} variant="outline" label="Continue with Google" onPress=${() => viaProvider('google')} />
      </div>
      <div className="hairline-top">
        <${Input} label="Email" leftIcon="envelope" type="email" inputMode="email" autoComplete="email"
          placeholder=${DEMO_EMAIL} value=${email} onChange=${(e) => set({ email: e.target.value })}
          hint=${`We'll send you a ${CODE_LENGTH}-digit code.`} />
      </div>
      <${Caption}>In the prototype, Apple and Google sign-in are simulated and we don't send email.<//>
    <//>`;
  }

  /* 5. The 6-digit code (email only). Auto-submits on the last digit. */
  function Code({ ans, go, back, demo }) {
    const [code, setCode] = useState('');
    const [left, setLeft] = useState(demo && demo.resendIn != null ? demo.resendIn : RESEND_SECONDS);
    const wrap = useRef(null);
    useEffect(() => {
      const el = wrap.current && wrap.current.querySelector('input');
      if (el) el.focus();
    }, []);
    useEffect(() => {
      if (left <= 0) return undefined;
      const t = setTimeout(() => setLeft((l) => l - 1), 1000);
      return () => clearTimeout(t);
    }, [left]);
    const resend = () => {
      setCode('');
      setLeft(RESEND_SECONDS);
      A.toast('New code sent', 'info');
    };
    return html`<${Step} title="Enter the code" subtitle=${`We sent a ${CODE_LENGTH}-digit code to ${ans.email || DEMO_EMAIL}.`} onBack=${back}>
      <div ref=${wrap}>
        <${DS.OtpInput} length=${CODE_LENGTH} value=${code} onChange=${setCode} label=${`${CODE_LENGTH}-digit code`}
          onComplete=${(v) => { if (v.length === CODE_LENGTH) go('privacy'); }} />
      </div>
      <${Caption}>In the prototype, any ${CODE_LENGTH} digits work.<//>
      ${left > 0
        ? html`<${T} size="callout" color="inkMuted48" as="p" className="tabular">Resend code in ${clock(left)}<//>`
        : html`<${LinkButton} label="Resend code" size="callout" align="flex-start" onPress=${resend} />`}
    <//>`;
  }

  /* 6. Privacy choices: what, why, who, and how to withdraw. */
  function Privacy({ ans, set, go, back }) {
    const save = () => {
      CONSENTS.forEach((c) => A.setConsent(c.key, c.required ? true : !!ans.consents[c.key]));
      go('age');
    };
    return html`<${Step} title="Your privacy choices" subtitle="Only the first one is required." onBack=${back}
      footer=${html`<${Primary} label="Continue" onPress=${save} />`}>
      <${Rows} rows=${CONSENTS.map((c) => ({
        key: c.key,
        label: c.label,
        detail: c.detail,
        right: html`<${Switch} on=${c.required ? true : !!ans.consents[c.key]} label=${c.label} disabled=${!!c.required}
          onChange=${(on) => set({ consents: { ...ans.consents, [c.key]: on } })} />`
      }))} />
      <${Caption}>Change these any time in Settings, under Privacy choices. Turning one off stops that use from then on.<//>
    <//>`;
  }

  /* 7. Age gate. */
  function Age({ ans, set, go, back, commit }) {
    const year = ans.birthYear || '';
    const now = thisYear();
    const y = Number(year);
    const complete = year.length === 4;
    const valid = complete && y >= EARLIEST_YEAR && y <= now;
    const error = complete && !valid ? `Enter a year between ${EARLIEST_YEAR} and ${now}.` : null;
    const adult = () => {
      commit({ birthYear: y });
      go('goal');
    };
    const next = () => {
      const age = now - y;
      if (age < ADULT_AGE) return go('under18');
      if (age > ADULT_AGE) return adult();
      /* Born exactly 18 years ago: the year alone can't tell, so ask. */
      return A.alert({
        title: `Have you turned ${ADULT_AGE} yet?`,
        message: `If you were born in ${y}, you turn ${ADULT_AGE} this year.`,
        buttons: [
          { label: 'Not yet', style: 'cancel', onPress: () => go('under18') },
          { label: `Yes, I'm ${ADULT_AGE}`, onPress: adult }
        ]
      });
    };
    return html`<${Step} title="What year were you born?" subtitle=${`Companion is for adults, ${ADULT_AGE} and over.`} onBack=${back}
      footer=${html`<${Primary} label="Continue" onPress=${next} disabled=${!valid} />`}>
      <${Input} label="Birth year" inputMode="numeric" autoComplete="bday-year" placeholder="For example, 1990"
        value=${year} error=${error} onChange=${(e) => set({ birthYear: digitsOnly(e.target.value, 4) })} />
      <${Caption}>We use it to check your age and for energy estimates.<//>
    <//>`;
  }

  /* 7b. Under 18: onboarding stops here. */
  function Under18({ back }) {
    return html`<${Step} title="Companion is for adults" subtitle=${`You need to be ${ADULT_AGE} or over to use it.`} onBack=${back}>
      <${Body}>Its training and nutrition information is written for adults, so you can't continue. If you entered the wrong year, go back and change it.<//>
      <${Callout}>For advice about training or food, talk to a parent, a coach or your doctor.<//>
    <//>`;
  }

  /* 8. Goal: selectable cards, exactly as the mockup. */
  function Goal({ ans, set, go, back, commit }) {
    const next = () => {
      commit({ goal: ans.goal });
      go('basics');
    };
    return html`<${Step} title="What's your goal?" subtitle="You can change this later." onBack=${back}
      footer=${html`<${Primary} label="Continue" onPress=${next} disabled=${!ans.goal} />`}>
      <div className="stack-sm" style=${{ gap: 'var(--spacing-base)' }}>
        ${M.GOALS.map((g) => html`<${OptionCard} key=${g.id} icon=${g.icon} title=${g.label} body=${g.body}
          selected=${ans.goal === g.id} onPress=${() => set({ goal: g.id })} />`)}
      </div>
    <//>`;
  }

  /* 9. Basics: height, weight, sex for energy equations. */
  function Basics({ ans, set, go, back, commit }) {
    const h = parseNumber(ans.heightCm);
    const w = parseNumber(ans.weightKg);
    const hErr = ans.heightCm !== '' && !(h >= 100 && h <= 250) ? 'Between 100 and 250 cm.' : null;
    const wErr = ans.weightKg !== '' && !(w >= 30 && w <= 300) ? 'Between 30 and 300 kg.' : null;
    const ok = !hErr && !wErr && ans.heightCm !== '' && ans.weightKg !== '';
    const next = () => {
      commit({ heightCm: Math.round(h), weightKg: Math.round(w * 10) / 10, sexForEquations: ans.sexForEquations });
      go('health');
    };
    return html`<${Step} title="About you" subtitle="We use these for energy estimates." onBack=${back}
      footer=${html`<${Primary} label="Continue" onPress=${next} disabled=${!ok} />
        <${Ghost} label="Skip for now" onPress=${() => go('health')} />`}>
      <div className="grid2">
        <${Cell}><${Input} label="Height (cm)" inputMode="numeric" value=${ans.heightCm} error=${hErr}
          onChange=${(e) => set({ heightCm: digitsOnly(e.target.value, 3) })} /><//>
        <${Cell}><${Input} label="Weight (kg)" inputMode="decimal" value=${ans.weightKg} error=${wErr}
          onChange=${(e) => set({ weightKg: decimalOnly(e.target.value) })} /><//>
      </div>
      <${Field} label="Sex for energy equations" hint="Optional. Energy equations differ slightly by sex, and we use it for nothing else.">
        <${ChoiceChips} label="Sex for energy equations" options=${SEX_OPTIONS} value=${ans.sexForEquations}
          onChange=${(v) => set({ sexForEquations: v })} />
      <//>
    <//>`;
  }

  /* 10. Health and safety: yes/no first, optional free text second. */
  function Health({ ans, set, go, back, commit }) {
    const has = (f) => ans.flags.includes(f);
    const injured = has('injury_reported');
    const needsRegion = injured && !ans.injuryRegions.length;
    const regionWords = REGIONS.filter((r) => ans.injuryRegions.includes(r.value)).map((r) => r.label.toLowerCase());
    const changes = [];
    if (injured) {
      changes.push(regionWords.length
        ? `We won't suggest changes that load your ${M.listJoin(regionWords)}.`
        : 'Tell us where, so we know which suggestions to pause.');
    }
    if (has('condition_reported')) changes.push('We hold training suggestions until you tell us a professional is supervising your training.');
    if (has('pregnancy')) changes.push("We won't make training or nutrition suggestions. Logging still works.");
    if (has('eating_disorder_history')) changes.push("We won't suggest calorie-deficit or weight-loss targets.");
    const next = () => {
      const others = (C.getState().profile.safetyFlags || []).filter((f) => !SAFETY_FLAGS.includes(f));
      commit({
        safetyFlags: [...others, ...ans.flags],
        injuryRegions: injured ? ans.injuryRegions.slice() : [],
        healthNotes: ans.healthNotes.trim()
      });
      go('training');
    };
    return html`<${Step} title="Health and safety" subtitle="Do any of these apply to you?" onBack=${back}
      footer=${html`<${Primary} label="Continue" onPress=${next} disabled=${needsRegion} />`}>
      <${Rows} rows=${SAFETY.map((q) => ({
        key: q.flag,
        label: q.label,
        detail: q.detail,
        right: html`<${Switch} on=${has(q.flag)} label=${q.label} onChange=${(on) => {
          const without = ans.flags.filter((f) => f !== q.flag);
          set({ flags: on ? toggleIn(without, q.flag, SAFETY_FLAGS) : without });
        }} />`
      }))} />
      ${injured ? html`<${Field} label="Where is it?" hint=${needsRegion ? 'Pick at least one area to continue.' : 'Pick every area that applies.'}>
        <${MultiChips} label="Where is the injury?" options=${REGIONS} values=${ans.injuryRegions}
          order=${REGIONS.map((r) => r.value)} onChange=${(v) => set({ injuryRegions: v })} />
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
      <//>` : null}
      <${Input} label="Anything else we should know?" value=${ans.healthNotes} hint="Optional. Stored encrypted."
        onChange=${(e) => set({ healthNotes: e.target.value })} />
    <//>`;
  }

  /* 11. Training background. */
  function Training({ ans, set, go, back, commit }) {
    const next = () => {
      commit({ experience: ans.experience, daysPerWeek: ans.daysPerWeek, sessionMinutes: ans.sessionMinutes, equipment: ans.equipment.slice() });
      go('split');
    };
    return html`<${Step} title="Your training" subtitle="So anything we suggest fits your week." onBack=${back}
      footer=${html`<${Primary} label="Continue" onPress=${next} />
        <${Ghost} label="Skip for now" onPress=${() => go('split')} />`}>
      <${Field} label="Experience">
        <${ChoiceChips} label="Experience" options=${EXPERIENCE} value=${ans.experience} onChange=${(v) => set({ experience: v })} />
      <//>
      <div className="row row--between">
        <${T} size="callout" font="semiBold" as="p">Days per week<//>
        <${Stepper} label="days per week" value=${ans.daysPerWeek} min=${1} max=${7} onChange=${(v) => set({ daysPerWeek: v })} />
      </div>
      <${Field} label="Session length" hint="Including warm-up. We keep suggestions inside it.">
        <${ChoiceChips} label="Session length" options=${SESSION_MINUTES.map((m) => ({ value: m, label: `${m} min` }))}
          value=${ans.sessionMinutes} onChange=${(v) => set({ sessionMinutes: v })} />
      <//>
      <${Field} label="Equipment you can use" hint="Pick everything you have access to.">
        <${MultiChips} label="Equipment" options=${D.EQUIPMENT.map((e) => ({ value: e, label: M.capitalise(e) }))}
          values=${ans.equipment} order=${D.EQUIPMENT} onChange=${(v) => set({ equipment: v })} />
      <//>
    <//>`;
  }

  /* 12. Current split, with a descriptive (never advisory) review. */
  function Split({ ans, set, go, back, commit }) {
    const s = C.useApp();
    const def = S.currentDefinition(s);
    const review = M.reviewSplit(def, { ...s.profile, goal: ans.goal || s.profile.goal, sessionMinutes: ans.sessionMinutes });
    const minutes = Object.values(review.minutes);
    const lo = Math.min(...minutes);
    const hi = Math.max(...minutes);
    const restDays = 7 - new Set(def.days.map((d) => d.weekday).filter((w) => w != null)).size;
    const next = () => {
      commit({ splitSource: ans.splitChoice });
      go('targets');
    };
    return html`<${Step} title="Your current split" subtitle="Start from the sample, or add yours later." onBack=${back}
      footer=${html`<${Primary} label="Continue" onPress=${next} disabled=${!ans.splitChoice} />`}>
      <div className="stack-sm" style=${{ gap: 'var(--spacing-base)' }}>
        <${OptionCard} icon="list.bullet" title="Use the sample split" body=${`${s.split.name}, already set up.`}
          selected=${ans.splitChoice === 'sample'} onPress=${() => set({ splitChoice: 'sample' })} />
        <${OptionCard} icon="pencil" title="Add it later" body="Enter your own from the Training tab."
          selected=${ans.splitChoice === 'later'} onPress=${() => set({ splitChoice: 'later' })} />
      </div>
      ${ans.splitChoice === 'sample' ? html`<${Card}>
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
      ${ans.splitChoice === 'later' ? html`<${Caption}>The prototype keeps the sample split so the Training tab has something to show.<//>` : null}
    <//>`;
  }

  /* 13. Nutrition targets: the user's own numbers; suggestions wait for the gate. */
  function Targets({ ans, set, go, back }) {
    const s = C.useApp();
    const values = Object.fromEntries(TARGET_FIELDS.map((f) => [f.key, parseNumber(ans.targets[f.key])]));
    const errors = Object.fromEntries(TARGET_FIELDS.map((f) => {
      const v = values[f.key];
      return [f.key, Number.isNaN(v) || v < f.min || v > f.max ? `Enter ${f.min} to ${f.max.toLocaleString('en-GB')}.` : null];
    }));
    const ok = TARGET_FIELDS.every((f) => !errors[f.key]);
    const nutritionClaims = D.CLAIMS.filter((c) => c.key.startsWith('nutrition.'));
    const ready = nutritionClaims.filter((c) => M.verifiedSourcesFor(c).length >= M.REQUIRED_SOURCES).length;
    const edHistory = ans.flags.includes('eating_disorder_history');
    const field = (f) => html`<${Cell} key=${f.key}><${Input} label=${f.label} inputMode="numeric" value=${ans.targets[f.key]}
      error=${errors[f.key]} onChange=${(e) => set({ targets: { ...ans.targets, [f.key]: digitsOnly(e.target.value, 5) } })} /><//>`;
    const next = () => {
      const changed = TARGET_FIELDS.some((f) => values[f.key] !== s.targets[f.key]);
      if (changed) A.setTargets(Object.fromEntries(TARGET_FIELDS.map((f) => [f.key, Math.round(values[f.key])])));
      go('devices');
    };
    return html`<${Step} title="Your nutrition targets" subtitle="Set your own daily numbers." onBack=${back}
      footer=${html`<${Primary} label="Continue" onPress=${next} disabled=${!ok} />
        <${Ghost} label="Skip for now" onPress=${() => go('devices')} />`}>
      ${field(TARGET_FIELDS[0])}
      <div className="grid2">${TARGET_FIELDS.slice(1).map(field)}</div>
      ${edHistory ? html`<${Card}>
        <${Callout}>You told us about a history of disordered eating, so we won't suggest calorie targets. Keep these numbers, change them, or skip this step.<//>
      <//>` : null}
      <${Caption}>We only suggest targets once a nutrition claim has ${M.REQUIRED_SOURCES} verified studies behind it. ${ready
        ? `${ready} of ${nutritionClaims.length} have so far.`
        : 'None has yet, so for now you set your own.'}<//>
    <//>`;
  }

  /* 14. Devices: simulated OAuth via A.connectDevice. */
  function Devices({ go, back }) {
    const s = C.useApp();
    const action = (p, dev) => {
      const name = D.PROVIDERS[p].short;
      if (dev.status === 'active' || dev.status === 'pending') return null;
      if (dev.status === 'paused') {
        return html`<${LinkButton} label="Resume" size="callout" onPress=${() => A.pauseDevice(p, false)} />`;
      }
      const reconnect = dev.status === 'needs_reauth' || dev.status === 'error';
      const types = dev.dataTypes && Object.keys(dev.dataTypes).length ? dev.dataTypes : undefined;
      return html`<button type="button" className="link" aria-label=${`${reconnect ? 'Reconnect' : 'Connect'} ${name}`}
        onClick=${() => A.connectDevice(p, reconnect ? types : undefined)} style=${{ minHeight: 'calc(var(--spacing-xxl) + var(--spacing-md))' }}>
        <${T} size="callout" color="primary">${reconnect ? 'Reconnect' : 'Connect'}<//>
      </button>`;
    };
    return html`<${Step} title="Connect your devices" subtitle="Optional. You can connect them later." onBack=${back}
      footer=${html`<${Primary} label="Continue" onPress=${() => go('notifications')} />
        <${Ghost} label="Skip for now" onPress=${() => go('notifications')} />`}>
      <${Rows} rows=${DEVICE_ORDER.filter((p) => s.devices[p]).map((p) => ({
        key: p,
        label: D.PROVIDERS[p].name,
        detail: html`<span className="row" style=${{ paddingTop: 'var(--spacing-xxs)' }}><${Badge} palette="connection" status=${s.devices[p].status} /></span>`,
        right: action(p, s.devices[p])
      }))} />
      <${Caption}>In the prototype, connecting is simulated. Choose what each device shares in Settings, under Connected devices. We never sell this data.<//>
    <//>`;
  }

  /* 15. Notifications (simulated). */
  function Notifications({ back, finish }) {
    return html`<${Step} title="Stay in the loop" subtitle="Only when something needs you." onBack=${back}
      footer=${html`<${Primary} label="Allow notifications" onPress=${() => finish(true)} />
        <${Ghost} label="Not now" onPress=${() => finish(false)} />`}>
      <${Rows} rows=${[
        { key: 'suggestion', icon: 'dumbbell', iconColor: 'ink', label: 'A suggestion to review' },
        { key: 'device', icon: 'applewatch', iconColor: 'ink', label: 'A device to reconnect' },
        { key: 'export', icon: 'square.and.arrow.up', iconColor: 'ink', label: 'Your data export is ready' }
      ]} />
      <${Caption}>Notifications never include health values. In the app, your phone asks you to confirm. In the prototype, nothing is sent.<//>
    <//>`;
  }

  const STEP_COMPONENTS = {
    splash: Splash, slides: Slides, disclaimer: Disclaimer, account: Account, code: Code, privacy: Privacy,
    age: Age, under18: Under18, goal: Goal, basics: Basics, health: Health, training: Training, split: Split,
    targets: Targets, devices: Devices, notifications: Notifications
  };

  /* ---------------------------------------------------------------- flow */
  function Flow({ demo }) {
    const start = demo && STEP_COMPONENTS[demo.step] ? demo.step : 'splash';
    const [nav, setNav] = useState(() => ({ step: start, trail: initialTrail(start) }));
    const [ans, setAns] = useState(() => initialAnswers(C.getState(), demo));
    const committed = useRef({});

    const set = (patch) => setAns((a) => ({ ...a, ...patch }));
    const go = (next) => setNav((n) => ({ step: next, trail: [...n.trail, n.step] }));
    const back = () => setNav((n) => (n.trail.length ? { step: n.trail[n.trail.length - 1], trail: n.trail.slice(0, -1) } : n));
    /* Apply profile answers as each step completes, and remember them for the finish. */
    const commit = (patch) => {
      A.updateProfile(patch);
      Object.assign(committed.current, patch);
    };
    const finish = (allowNotifications) => {
      commit({ notificationsAllowed: !!allowNotifications });
      A.completeOnboarding({ ...committed.current });
      A.toast("You're set up", 'success');
    };

    const StepComp = STEP_COMPONENTS[nav.step];
    const canGoBack = nav.trail.length > 0 && !NO_BACK.includes(nav.step);
    return html`<${StepComp} key=${nav.step} ans=${ans} set=${set} go=${go} back=${canGoBack ? back : null}
      commit=${commit} finish=${finish} demo=${demo} />`;
  }

  /* Restart the flow when the debug hook picks a step (a new onboardingDemo
     object) or the prototype is reset (a new nav object). Nothing navigates
     while onboarding is showing, so nav only changes on a reset. */
  const ids = new WeakMap();
  let seq = 0;
  const idOf = (obj) => {
    if (!obj || typeof obj !== 'object') return 0;
    if (!ids.has(obj)) ids.set(obj, ++seq);
    return ids.get(obj);
  };
  function Onboarding() {
    const s = C.useApp();
    const demo = s.onboardingDemo || null;
    return html`<${Flow} key=${`${idOf(demo)}-${idOf(s.nav)}`} demo=${demo} />`;
  }

  C.registerScreen('onboarding', Onboarding, {
    title: 'Onboarding', tab: null, presentation: 'root',
    demoParams: { step: 'splash' },
    demoParamsList: [
      { step: 'splash' },
      { step: 'slides' },
      { step: 'slides', slide: 2 },
      { step: 'slides', slide: 3 },
      { step: 'disclaimer' },
      { step: 'account' },
      { step: 'code', email: 'sam@example.com' },
      { step: 'code', email: 'sam@example.com', resendIn: 0 },
      { step: 'privacy' },
      { step: 'age' },
      { step: 'under18' },
      { step: 'goal' },
      { step: 'goal', goal: 'muscle_gain' },
      { step: 'basics' },
      { step: 'health' },
      { step: 'health', flags: ['injury_reported', 'eating_disorder_history'], regions: ['lower'] },
      { step: 'training' },
      { step: 'split' },
      { step: 'split', choice: 'sample' },
      { step: 'targets' },
      { step: 'targets', flags: ['eating_disorder_history'] },
      { step: 'devices' },
      { step: 'notifications' }
    ]
  });
})();
