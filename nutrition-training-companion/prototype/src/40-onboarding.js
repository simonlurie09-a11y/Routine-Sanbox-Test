/* Companion prototype — sign-up (builder A).
   Only what the app can't start without (docs/07 §7.1): splash, three slides,
   the disclaimer, your account (with the required health-data consent), an
   optional Apple Health connection that fills in the next two answers, then
   age, weight and goal. Everything else is set up later from the tabs
   (35-setup.js), on pages laid out like these. Every step uses the sign-up
   page layout: back chevron, large title, grey subtitle, then one primary
   pill at the bottom. Sign-in, email codes and HealthKit are simulated; a
   real Health export can be read on the device. */
(function () {
  'use strict';

  const C = window.Companion;
  const React = window.React;
  const { useState, useEffect, useLayoutEffect, useRef } = React;
  const { html, DS, T, Button, Input, Rows, Caption, Callout, Body, LinkButton, IconButton, Glyph, PlainScreen } = C.ui;
  const M = C.domain, D = C.data, A = C.actions;
  const U = C.setup, H = C.healthImport;

  /* ------------------------------------------------------------ constants */
  const STEPS = ['splash', 'slides', 'disclaimer', 'account', 'code', 'health', 'import', 'age', 'under18', 'weight', 'goal'];
  /* The default path (email code, the Health export and the under-18 stop are branches). */
  const MAIN = STEPS.filter((s) => s !== 'code' && s !== 'import' && s !== 'under18');
  /* The back chevron appears from the account step on. */
  const NO_BACK = ['splash', 'slides', 'disclaimer'];

  const SPLASH_MS = 1500;
  const CODE_LENGTH = 6;
  const RESEND_SECONDS = 60;
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

  /* What the Apple Health connection reads, and what for. The connection
     shares exactly these (HEALTH_TYPES), and is made only once the age gate
     has passed, when sign-up finishes. */
  const HEALTH_READS = [
    { key: 'dob', icon: 'person.crop.circle', label: 'Date of birth', detail: 'Your age, so you don\'t type it.' },
    { key: 'body', icon: 'target', label: 'Weight and height', detail: 'Protein and energy targets.' },
    { key: 'readiness', icon: 'waveform.path.ecg', label: 'Sleep, HRV and resting heart rate', detail: 'Readiness, against your own baseline.' },
    { key: 'workouts', icon: 'figure.run', label: 'Workouts', detail: 'Cardio minutes in your training week.' }
  ];
  const HEALTH_TYPES = { hrv: true, resting_hr: true, sleep: true, workouts: true, daily_activity: false, heart_rate: false };

  /* ------------------------------------------------------------- helpers */
  const clock = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

  function initialAnswers(s, demo) {
    const d = demo || {};
    const fromHealth = d.fromHealth ? H.SIMULATED : null;
    return {
      authMethod: d.step === 'code' ? 'email' : null,
      email: d.email || s.profile.email || (d.step === 'code' ? DEMO_EMAIL : ''),
      agreed: !!d.agreed || d.step === 'code',
      birthYear: d.birthYear ? String(d.birthYear) : fromHealth ? fromHealth.birthDate.slice(0, 4) : '',
      birthDate: fromHealth ? fromHealth.birthDate : null,
      weight: fromHealth ? String(Math.round(fromHealth.weightKg.value * 10) / 10) : '',
      weightUnit: 'kg',
      goal: d.goal || null,
      /* What Apple Health filled in: a summary, or null. */
      health: fromHealth,
      healthSource: fromHealth ? 'connected' : null
    };
  }

  /* The steps "behind" a demo start, so the back chevron works there too. */
  function initialTrail(step) {
    if (step === 'code') return MAIN.slice(0, MAIN.indexOf('account') + 1);
    if (step === 'import') return MAIN.slice(0, MAIN.indexOf('health') + 1);
    if (step === 'under18') return MAIN.slice(0, MAIN.indexOf('age') + 1);
    const i = MAIN.indexOf(step);
    return i > 0 ? MAIN.slice(0, i) : [];
  }

  /* ------------------------------------------------------------ pieces */
  function Step({ title, subtitle, onBack, topRight, footer, children }) {
    return html`<${U.FormPage} title=${title} subtitle=${subtitle} onBack=${onBack || null} topRight=${topRight} footer=${footer}>
      ${children}
    <//>`;
  }
  const { Primary, Ghost } = U;

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

  /* 4. Account: Sign in with Apple (Apple's own black button), Google, or email,
     with the one consent the app can't run without. */
  function Account({ ans, set, go, back, commit }) {
    const [nudge, setNudge] = useState(false);
    const email = ans.email || '';
    const valid = EMAIL_RE.test(email.trim());
    const ready = () => {
      if (ans.agreed) return true;
      setNudge(true);
      return false;
    };
    const agree = () => A.setConsent('health_data_processing', true);
    const viaProvider = (method) => {
      if (!ready()) return;
      agree();
      set({ authMethod: method });
      commit({ signInMethod: method });
      go('health');
    };
    const sendCode = () => {
      if (!ready()) return;
      agree();
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
      <${U.Check} checked=${ans.agreed} onChange=${(on) => { set({ agreed: on }); if (on) setNudge(false); }}
        label="I agree to Companion storing my health data to run the app"
        detail="Your food, training, body and device data, encrypted, used only to run the app, by us and the services that host it. Required. To withdraw, delete your account in Settings."
        error=${nudge && !ans.agreed ? 'Tick this to continue.' : null} />
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
          onComplete=${(v) => { if (v.length === CODE_LENGTH) go('health'); }} />
      </div>
      <${Caption}>In the prototype, any ${CODE_LENGTH} digits work.<//>
      ${left > 0
        ? html`<${T} size="callout" color="inkMuted48" as="p" className="tabular">Resend code in ${clock(left)}<//>`
        : html`<${LinkButton} label="Resend code" size="callout" align="flex-start" onPress=${resend} />`}
    <//>`;
  }

  /* Forget whatever Apple Health filled in earlier (going back and choosing again). */
  const clearHealth = (ans) => (ans.health
    ? { health: null, healthSource: null, birthDate: null, birthYear: '', weight: '', weightUnit: 'kg' }
    : { health: null, healthSource: null });
  /* Health says the person is under 18: sign-up stops, whatever year is typed. */
  const healthMinor = (ans) => !!(ans.health && ans.health.birthDate && H.ageOn(ans.health.birthDate) < U.ADULT_AGE);

  /* Answers that Apple Health (connected or exported) fills in. */
  const fromSummary = (summary, source) => {
    const patch = { health: summary, healthSource: source };
    if (summary.birthDate) {
      patch.birthYear = summary.birthDate.slice(0, 4);
      patch.birthDate = summary.birthDate;
    }
    if (summary.weightKg) {
      patch.weight = String(Math.round(summary.weightKg.value * 10) / 10);
      patch.weightUnit = 'kg';
    }
    return patch;
  };

  /* 6. Apple Health (optional): HealthKit's permission sheet in the app; here
     it's simulated, or a real Health export can be read on the device. */
  function Health({ ans, set, go, back }) {
    const connect = () => {
      set({ ...clearHealth(ans), ...fromSummary(H.SIMULATED, 'connected') });
      go('age');
    };
    const notNow = () => {
      set({ ...clearHealth(ans), healthSource: 'not_connected' });
      go('age');
    };
    const skip = html`<${LinkButton} label="Not now" size="callout" color="inkMuted48" onPress=${notNow} />`;
    return html`<${Step} title="Connect Apple Health" subtitle="We'll fill in your age and weight from it, so you don't have to type them." onBack=${back}
      topRight=${skip}
      footer=${html`<${Primary} label="Connect Apple Health" onPress=${connect} />
        <${Ghost} label="Import a Health export instead" onPress=${() => go('import')} />`}>
      <${Rows} rows=${HEALTH_READS.map((r) => ({ key: r.key, icon: r.icon, iconColor: 'ink', label: r.label, detail: r.detail }))} />
      <${Caption}>Your iPhone asks which of these to share, and you can change it any time in the Health app. We never sell this data. In the prototype, connecting is simulated.<//>
    <//>`;
  }

  /* 6b. A real Health export, read on this device. */
  function Import({ ans, set, go, back }) {
    const [summary, setSummary] = useState(null);
    const use = () => {
      set({ ...clearHealth(ans), ...fromSummary(summary, 'export') });
      go('age');
    };
    return html`<${Step} title="Import a Health export" subtitle="Use the file the Health app exports. It's read on this device." onBack=${back}
      footer=${summary ? html`<${Primary} label="Use these details" onPress=${use} />` : null}>
      <${U.HealthImportPanel} summary=${summary} onResult=${setSummary} />
    <//>`;
  }

  const healthLine = (ans, what) => (ans.healthSource === 'export' ? `${what}, from your Health export.` : `${what}, from Apple Health.`);

  /* 7. Age gate. */
  function Age({ ans, set, go, back, commit }) {
    const year = ans.birthYear || '';
    const keepDate = ans.birthDate && ans.birthDate.slice(0, 4) === year ? ans.birthDate : null;
    const check = U.checkAge(year, keepDate);
    const adult = () => {
      commit({ birthYear: check.year, birthDate: keepDate });
      go('weight');
    };
    const next = () => {
      if (check.verdict === 'minor' || healthMinor(ans)) return go('under18');
      if (check.verdict === 'adult') return adult();
      return A.alert({
        title: `Have you turned ${U.ADULT_AGE} yet?`,
        message: `If you were born in ${check.year}, you turn ${U.ADULT_AGE} this year.`,
        buttons: [
          { label: 'Not yet', style: 'cancel', onPress: () => go('under18') },
          { label: `Yes, I'm ${U.ADULT_AGE}`, onPress: adult }
        ]
      });
    };
    return html`<${Step} title="What year were you born?" subtitle=${`Companion is for adults, ${U.ADULT_AGE} and over.`} onBack=${back}
      footer=${html`<${Primary} label="Continue" onPress=${next} disabled=${!check.valid} />`}>
      <${U.AgeField} value=${year} error=${check.error} onChange=${(v) => set({ birthYear: v })} />
      ${keepDate ? html`<${U.FromHealth} text=${healthLine(ans, `Born ${U.longBirth(keepDate)}`)} />` : null}
      ${!keepDate && healthMinor(ans) ? html`<${U.FromHealth} text=${healthLine(ans, `Born ${U.longBirth(ans.health.birthDate)}`)} />` : null}
      <${Caption}>We use it to check your age and for energy estimates.<//>
    <//>`;
  }

  /* 7b. Under 18: sign-up stops here. */
  function Under18({ ans, back }) {
    return html`<${Step} title="Companion is for adults" subtitle=${`You need to be ${U.ADULT_AGE} or over to use it.`} onBack=${back}>
      <${Body}>${healthMinor(ans)
        ? `Its training and nutrition information is written for adults, and your Apple Health data says you're under ${U.ADULT_AGE}, so you can't continue. We haven't kept anything from Apple Health.`
        : "Its training and nutrition information is written for adults, so you can't continue. If you entered the wrong year, go back and change it."}<//>
      <${Callout}>For advice about training or food, talk to a parent, a coach or your doctor.<//>
    <//>`;
  }

  /* 8. Weight. */
  function Weight({ ans, set, go, back, commit }) {
    const check = U.checkWeight(ans.weight || '', ans.weightUnit);
    const fromHealth = ans.health && ans.health.weightKg && ans.weight === String(Math.round(ans.health.weightKg.value * 10) / 10) && ans.weightUnit === 'kg';
    const next = () => {
      commit({ weightKg: check.kg, weightUnit: ans.weightUnit });
      go('goal');
    };
    return html`<${Step} title="What do you weigh?" subtitle="We use it to work out protein and energy targets." onBack=${back}
      footer=${html`<${Primary} label="Continue" onPress=${next} disabled=${!check.valid} />`}>
      <${U.WeightField} value=${ans.weight || ''} unit=${ans.weightUnit} error=${check.error}
        onChange=${(v) => set({ weight: v })} onUnit=${(u) => set({ weightUnit: u })} />
      ${fromHealth ? html`<${U.FromHealth} text=${healthLine(ans, `Weighed ${new Date(ans.health.weightKg.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`)} />` : null}
      <${Caption}>Only you see it. You can update it any time in Settings.<//>
    <//>`;
  }

  /* 9. What you want to work on: selectable cards, as the mockup. */
  function Goal({ ans, set, back, finish }) {
    return html`<${Step} title="What do you want to work on?" subtitle="Pick one. You can change it any time." onBack=${back}
      footer=${html`<${Primary} label="Finish" onPress=${finish} disabled=${!ans.goal} />`}>
      <${U.GoalOptions} value=${ans.goal} onChange=${(g) => set({ goal: g })} />
    <//>`;
  }

  const STEP_COMPONENTS = {
    splash: Splash, slides: Slides, disclaimer: Disclaimer, account: Account, code: Code, health: Health, import: Import,
    age: Age, under18: Under18, weight: Weight, goal: Goal
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
    const finish = () => {
      commit({ goal: ans.goal });
      /* Height and sex come with Health when it has them. */
      const extraProfile = {};
      const h = ans.health;
      if (h && h.heightCm) extraProfile.heightCm = Math.round(h.heightCm.value);
      if (h && h.sex) extraProfile.sexForEquations = h.sex;
      const used = [];
      if (h) {
        if (committed.current.birthDate) used.push('birthDate');
        if (h.weightKg && committed.current.weightKg === Math.round(h.weightKg.value * 10) / 10) used.push('weightKg');
        if (extraProfile.heightCm) used.push('heightCm');
        if (extraProfile.sexForEquations) used.push('sexForEquations');
      }
      if (ans.healthSource === 'export' && h) A.recordHealthImport(h, used);
      const connected = ans.healthSource === 'connected';
      A.completeOnboarding({ ...committed.current, ...extraProfile }, {
        setup: { ...U.FRESH_SETUP, body: !!extraProfile.heightCm, devices: connected },
        /* Optional purposes are opt-in, so they start off; each is asked for where it's used. */
        consents: { health_data_processing: true, ai_processing: false, scan_image_upload: false, off_contribution: false, product_analytics: false },
        appleHealth: connected ? 'connected' : 'not_connected'
      });
      /* Connected only now, past the age gate, sharing exactly what the page listed. */
      if (connected) A.connectDevice('apple_health', { ...HEALTH_TYPES });
      A.toast('Account created', 'success');
    };

    const StepComp = STEP_COMPONENTS[nav.step];
    const canGoBack = nav.trail.length > 0 && !NO_BACK.includes(nav.step);
    return html`<${StepComp} key=${nav.step} ans=${ans} set=${set} go=${go} back=${canGoBack ? back : null}
      commit=${commit} finish=${finish} demo=${demo} />`;
  }

  /* Restart the flow when the debug hook picks a step (a new onboardingDemo
     object) or the prototype is reset (a new nav object). Nothing navigates
     while sign-up is showing, so nav only changes on a reset. */
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
    title: 'Sign-up', tab: null, presentation: 'root',
    demoParams: { step: 'splash' },
    demoParamsList: [
      { step: 'splash' },
      { step: 'slides' },
      { step: 'slides', slide: 2 },
      { step: 'slides', slide: 3 },
      { step: 'disclaimer' },
      { step: 'account' },
      { step: 'account', agreed: true, email: 'sam@example.com' },
      { step: 'code', email: 'sam@example.com' },
      { step: 'code', email: 'sam@example.com', resendIn: 0 },
      { step: 'health' },
      { step: 'import' },
      { step: 'age' },
      { step: 'age', fromHealth: true },
      { step: 'under18' },
      { step: 'weight' },
      { step: 'weight', fromHealth: true },
      { step: 'goal' },
      { step: 'goal', goal: 'muscle_gain' }
    ]
  });
})();
