/* Companion prototype — state, actions and navigation.
   One global store; components read it with Companion.useApp() and change it
   only through Companion.actions. Domain state persists per viewer in
   localStorage (wrapped in try/catch); navigation and overlays do not. */
(function () {
  'use strict';

  const C = window.Companion;
  const D = C.data;
  const M = C.domain;
  const STORAGE_KEY = 'companion-prototype-v1';
  const TABS = ['today', 'food', 'training', 'recovery', 'history'];

  /* ------------------------------------------------------------- seed */
  let nextId = 1;
  const uid = (prefix) => `${prefix}-${Date.now().toString(36)}-${(nextId++).toString(36)}`;

  function logEntry(food, grams, meal, hour, minute, confidence) {
    return {
      id: uid('log'),
      at: D.daysAgo(0, hour, minute),
      meal,
      foodId: food.id,
      name: food.name,
      brand: food.brand || null,
      grams,
      isBeverage: !!food.isBeverage,
      nutrients: M.nutrientsFor(food, grams),
      confidence: confidence || food.confidence || 'high',
      source: food.source
    };
  }

  function scannedGranola() {
    const sample = D.LABEL_SAMPLES.find((s) => s.id === 'label-granola');
    const assessed = M.assessLabel(sample);
    return {
      id: 'c-granola-scan',
      name: 'Granola clusters',
      brand: 'Your label scan',
      source: 'ingredient_scan',
      attribution: 'Estimated from your label photo',
      serving: { grams: 45, label: '1 bowl (45 g)' },
      nutrients: assessed.nutrients,
      ranges: assessed.ranges,
      confidence: assessed.confidence,
      ingredients: sample.ingredientsText.replace('maltodextr1n', 'maltodextrin'),
      nova: 4,
      additives: ['flavouring'],
      createdAt: D.daysAgo(3, 8, 10)
    };
  }

  function seedState() {
    const g = (id) => D.GENERIC_FOODS.find((f) => f.id === id);
    const p = (id) => D.PRODUCTS.find((f) => f.id === id);
    const granola = scannedGranola();
    const sessionSets = (def, dayKey) => def.days.find((d) => d.key === dayKey).items.map((it) => ({ exercise: it.exercise, setsDone: it.sets }));
    return {
      version: 1,
      onboarded: false,
      sampleData: true,
      profile: {
        name: '', email: '', goal: 'muscle_gain', heightCm: 180, weightKg: 82, birthYear: 1994,
        sexForEquations: 'unspecified', experience: 'intermediate', daysPerWeek: 4, sessionMinutes: 60,
        equipment: D.EQUIPMENT.slice(), safetyFlags: [], injuryRegions: [], healthNotes: ''
      },
      consents: {
        health_data_processing: true, ai_processing: true, scan_image_upload: false,
        off_contribution: false, product_analytics: false
      },
      disclaimerAcknowledgedAt: null,
      targets: {
        energyKcal: 2300, proteinG: 160, carbohydrateG: 260, fatG: 75, fiberG: 30,
        history: [{ at: D.daysAgo(30), origin: 'user_edit', values: { energyKcal: 2300, proteinG: 160, carbohydrateG: 260, fatG: 75, fiberG: 30 } }]
      },
      customFoods: [granola],
      foodLog: [
        logEntry(g('g-oats'), 60, 'breakfast', 7, 40),
        logEntry(p('p-yogurt'), 150, 'breakfast', 7, 40),
        logEntry(g('g-banana'), 120, 'breakfast', 7, 41),
        logEntry(g('g-chicken'), 150, 'lunch', 12, 50),
        logEntry(g('g-rice'), 180, 'lunch', 12, 50),
        logEntry(g('g-broccoli'), 100, 'lunch', 12, 51),
        logEntry(g('g-olive-oil'), 10, 'lunch', 12, 51),
        logEntry(p('p-oat-bar'), 40, 'snack', 15, 30),
        logEntry(granola, 30, 'snack', 15, 32, granola.confidence)
      ],
      split: {
        name: 'Upper / Lower, 4 days',
        current: 3,
        versions: [
          { number: 1, createdAt: D.daysAgo(42), origin: 'import', note: 'Imported from your previous plan.', definition: D.clone(D.SPLIT_V1) },
          { number: 2, createdAt: D.daysAgo(28), origin: 'user_edit', note: 'Added face pulls to Upper B.', definition: D.clone(D.SPLIT_V2) },
          { number: 3, createdAt: D.daysAgo(14), origin: 'user_edit', note: 'Swapped the incline barbell press for dumbbells.', definition: D.clone(D.SPLIT_V3) }
        ]
      },
      recommendations: [
        {
          id: 'rec-seed-five-day', kind: 'split_change', status: 'blocked_insufficient_evidence', trigger: 'user_request',
          createdAt: D.daysAgo(9, 19, 5), requestText: 'Switch me to a five-day split',
          intent: { type: 'switch_style', style: 'five_day', summary: 'Switch to a five-day split.' },
          title: 'Five-day split', claimKey: null, verifiedCount: 0, required: 3,
          reason: "Our evidence library doesn't yet have 3 verified studies behind this kind of change, so we haven't changed your plan.",
          disclaimerVersion: D.DISCLAIMER.version
        }
      ],
      sessions: [
        { id: uid('ses'), at: D.daysAgo(5, 18, 0), dayKey: 'upper_b', version: 3, sets: sessionSets(D.SPLIT_V3, 'upper_b'), rpe: 8, soreness: 3 },
        { id: uid('ses'), at: D.daysAgo(4, 18, 0), dayKey: 'lower_b', version: 3, sets: sessionSets(D.SPLIT_V3, 'lower_b'), rpe: 8, soreness: 4 },
        { id: uid('ses'), at: D.daysAgo(1, 18, 0), dayKey: 'upper_a', version: 3, sets: sessionSets(D.SPLIT_V3, 'upper_a'), rpe: 7, soreness: 2 }
      ],
      devices: {
        apple_health: { status: 'active', connectedAt: D.daysAgo(60), lastSync: D.daysAgo(0, 7, 5),
          dataTypes: { hrv: true, resting_hr: true, sleep: false, workouts: true, daily_activity: true, heart_rate: false } },
        oura: { status: 'active', connectedAt: D.daysAgo(90), lastSync: D.daysAgo(0, 7, 12),
          dataTypes: { sleep: true, hrv: true, resting_hr: true, readiness: true, workouts: false, daily_activity: false } },
        whoop: { status: 'needs_reauth', connectedAt: D.daysAgo(120), lastSync: D.daysAgo(3, 6, 40),
          dataTypes: { recovery: true, hrv: true, resting_hr: true, sleep: true, workouts: true } },
        google_health: { status: 'revoked', connectedAt: null, lastSync: null, dataTypes: {} }
      },
      notificationsReadAt: 0,
      privacyRequests: []
    };
  }

  function initialNav() {
    const stacks = {};
    TABS.forEach((t) => { stacks[t] = [{ key: t, params: {}, id: uid('nav') }]; });
    return { tab: 'today', stacks, modals: [], direction: 'none' };
  }

  /* ------------------------------------------------------------ store */
  const PERSISTED = ['version', 'onboarded', 'sampleData', 'profile', 'consents', 'disclaimerAcknowledgedAt', 'targets',
    'customFoods', 'foodLog', 'split', 'recommendations', 'sessions', 'devices', 'notificationsReadAt', 'privacyRequests'];

  function load() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const saved = JSON.parse(raw);
      if (!saved || saved.version !== 1) return null;
      /* Today's sample log is relative to the day it was seeded; a new day starts empty. */
      return saved;
    } catch (e) {
      return null;
    }
  }
  function save(state) {
    try {
      const out = {};
      PERSISTED.forEach((k) => { out[k] = state[k]; });
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(out));
    } catch (e) {
      /* Storage can be unavailable (private window, previews). The app works without it. */
    }
  }

  let state = { ...seedState(), ...(load() || {}), nav: initialNav(), overlay: null, toast: null };
  const listeners = new Set();
  let saveTimer = null;
  function setState(updater) {
    const patch = typeof updater === 'function' ? updater(state) : updater;
    state = { ...state, ...patch };
    listeners.forEach((fn) => fn());
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => save(state), 150);
  }
  const getState = () => state;
  const subscribe = (fn) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  };
  function useApp() {
    return window.React.useSyncExternalStore(subscribe, getState);
  }

  /* -------------------------------------------------------- navigation */
  const entry = (key, params) => ({ key, params: params || {}, id: uid('nav') });
  function topStackOf(nav) {
    return nav.modals.length ? nav.modals[nav.modals.length - 1].stack : nav.stacks[nav.tab];
  }
  function withTopStack(nav, fn) {
    if (nav.modals.length) {
      const modals = nav.modals.slice();
      const top = modals[modals.length - 1];
      modals[modals.length - 1] = { ...top, stack: fn(top.stack) };
      return { ...nav, modals };
    }
    return { ...nav, stacks: { ...nav.stacks, [nav.tab]: fn(nav.stacks[nav.tab]) } };
  }
  const setNav = (fn) => setState((s) => ({ nav: fn(s.nav) }));

  const nav = {
    TABS,
    go(tab) {
      setNav((n) => {
        if (n.tab === tab) return { ...n, stacks: { ...n.stacks, [tab]: [n.stacks[tab][0]] }, direction: 'back' };
        return { ...n, tab, direction: 'none' };
      });
    },
    push(key, params) {
      setNav((n) => ({ ...withTopStack(n, (st) => [...st, entry(key, params)]), direction: 'forward' }));
    },
    replace(key, params) {
      setNav((n) => ({ ...withTopStack(n, (st) => [...st.slice(0, -1), entry(key, params)]), direction: 'none' }));
    },
    pop() {
      setNav((n) => {
        const st = topStackOf(n);
        if (st.length > 1) return { ...withTopStack(n, (s2) => s2.slice(0, -1)), direction: 'back' };
        if (n.modals.length) return { ...n, modals: n.modals.slice(0, -1), direction: 'back' };
        return n;
      });
    },
    popToRoot() {
      setNav((n) => ({ ...withTopStack(n, (st) => [st[0]]), direction: 'back' }));
    },
    /* style: 'sheet' (form sheet over the app) or 'cover' (full screen, e.g. camera). */
    present(key, params, style) {
      setNav((n) => ({ ...n, modals: [...n.modals, { id: uid('modal'), style: style || 'sheet', stack: [entry(key, params)] }], direction: 'up' }));
    },
    dismiss() {
      setNav((n) => ({ ...n, modals: n.modals.slice(0, -1), direction: 'down' }));
    },
    dismissAll() {
      setNav((n) => ({ ...n, modals: [], direction: 'down' }));
    },
    /* Close every modal, switch tab and open a screen there. */
    openIn(tab, key, params) {
      setNav((n) => ({ ...n, modals: [], tab, stacks: { ...n.stacks, [tab]: key === tab ? [n.stacks[tab][0]] : [n.stacks[tab][0], entry(key, params)] }, direction: 'forward' }));
    },
    current() {
      const n = state.nav;
      const st = topStackOf(n);
      return st[st.length - 1];
    }
  };

  /* Alerts and sheets run their handler after the overlay closes (~240 ms). */
  const AFTER_CLOSE_MS = 240;
  function alert(props) {
    setState({ overlay: { type: 'alert', id: uid('ov'), props } });
  }
  function sheet(props) {
    setState({ overlay: { type: 'sheet', id: uid('ov'), props } });
  }
  function closeOverlay(then) {
    setState({ overlay: null });
    if (then) setTimeout(then, AFTER_CLOSE_MS);
  }
  let toastTimer = null;
  function toast(message, variant) {
    clearTimeout(toastTimer);
    setState({ toast: { id: uid('toast'), message, variant: variant || 'info' } });
    toastTimer = setTimeout(() => setState({ toast: null }), 3500);
  }

  /* ----------------------------------------------------------- actions */
  const actions = {
    ...nav,
    alert, sheet, closeOverlay, toast,

    /* Profile, onboarding, consent */
    updateProfile(patch) {
      setState((s) => ({ profile: { ...s.profile, ...patch } }));
    },
    completeOnboarding(profilePatch) {
      setState((s) => ({ onboarded: true, profile: { ...s.profile, ...(profilePatch || {}) }, disclaimerAcknowledgedAt: s.disclaimerAcknowledgedAt || Date.now(), nav: initialNav() }));
    },
    acknowledgeDisclaimer() {
      setState({ disclaimerAcknowledgedAt: Date.now() });
    },
    setConsent(purpose, on) {
      setState((s) => ({ consents: { ...s.consents, [purpose]: !!on } }));
    },

    /* Food */
    logFood({ food, grams, meal, at }) {
      const e = { ...logEntry(food, grams, meal || 'snack', 0, 0), at: at || Date.now() };
      setState((s) => ({ foodLog: [...s.foodLog, e] }));
      return e.id;
    },
    updateLogEntry(id, patch) {
      setState((s) => ({
        foodLog: s.foodLog.map((e) => {
          if (e.id !== id) return e;
          const next = { ...e, ...patch };
          if (patch.grams != null) {
            const food = M.findFood(e.foodId, s.customFoods);
            if (food) next.nutrients = M.nutrientsFor(food, patch.grams);
          }
          return next;
        })
      }));
    },
    deleteLogEntry(id) {
      setState((s) => ({ foodLog: s.foodLog.filter((e) => e.id !== id) }));
    },
    saveCustomFood(food) {
      const f = { ...food, id: food.id || uid('food'), createdAt: Date.now() };
      setState((s) => ({ customFoods: [f, ...s.customFoods.filter((x) => x.id !== f.id)] }));
      return f.id;
    },
    setTargets(values) {
      setState((s) => ({ targets: { ...s.targets, ...values, history: [...s.targets.history, { at: Date.now(), origin: 'user_edit', values }] } }));
    },

    /* Training */
    saveSplitEdit(definition, note) {
      let number;
      setState((s) => {
        number = Math.max(...s.split.versions.map((v) => v.number)) + 1;
        const version = { number, createdAt: Date.now(), origin: 'user_edit', note: note || 'Your edit.', definition };
        return { split: { ...s.split, current: number, versions: [...s.split.versions, version] } };
      });
      return number;
    },
    revertToVersion(target) {
      const v = state.split.versions.find((x) => x.number === target);
      if (!v) return null;
      return actions.saveSplitEdit(D.clone(v.definition), `Went back to version ${target}.`);
    },
    logSession(session) {
      const s2 = { id: uid('ses'), at: Date.now(), ...session };
      setState((s) => ({ sessions: [...s.sessions, s2] }));
      return s2.id;
    },

    /* Recommendations. create() stores whatever the gate decided. */
    createRecommendation(draft, extra) {
      const rec = {
        id: uid('rec'),
        createdAt: Date.now(),
        trigger: (extra && extra.trigger) || 'user_request',
        requestText: (extra && extra.requestText) || null,
        fromVersion: state.split.current,
        ...draft
      };
      setState((s) => ({ recommendations: [rec, ...s.recommendations] }));
      return rec.id;
    },
    /* Accept re-checks the gate (the database trigger in schema.sql does the
       same) and only then writes the new split version. */
    acceptRecommendation(id) {
      const rec = state.recommendations.find((r) => r.id === id);
      if (!rec || rec.status !== 'proposed') return { ok: false, reason: 'not_proposed' };
      const claim = M.claimByKey(rec.claimKey);
      const verified = M.verifiedSourcesFor(claim);
      if (!claim || claim.status !== 'active' || verified.length < M.REQUIRED_SOURCES) {
        setState((s) => ({ recommendations: s.recommendations.map((r) => (r.id === id ? { ...r, status: 'withdrawn', decidedAt: Date.now() } : r)) }));
        return { ok: false, reason: 'gate_failed' };
      }
      if (rec.fromVersion !== state.split.current) {
        setState((s) => ({ recommendations: s.recommendations.map((r) => (r.id === id ? { ...r, status: 'superseded', decidedAt: Date.now() } : r)) }));
        return { ok: false, reason: 'superseded' };
      }
      let number;
      setState((s) => {
        number = Math.max(...s.split.versions.map((v) => v.number)) + 1;
        const version = { number, createdAt: Date.now(), origin: 'app_recommendation', recommendationId: id, note: M.summarizeOps(rec.proposal.ops), definition: rec.proposal.definition };
        return {
          split: { ...s.split, current: number, versions: [...s.split.versions, version] },
          recommendations: s.recommendations.map((r) => (r.id === id ? { ...r, status: 'accepted', decidedAt: Date.now(), toVersion: number } : r))
        };
      });
      return { ok: true, version: number };
    },
    rejectRecommendation(id) {
      setState((s) => ({ recommendations: s.recommendations.map((r) => (r.id === id ? { ...r, status: 'rejected', decidedAt: Date.now() } : r)) }));
    },

    /* Devices */
    toggleDataType(provider, type, on) {
      setState((s) => ({ devices: { ...s.devices, [provider]: { ...s.devices[provider], dataTypes: { ...s.devices[provider].dataTypes, [type]: !!on } } } }));
    },
    pauseDevice(provider, paused) {
      setState((s) => ({ devices: { ...s.devices, [provider]: { ...s.devices[provider], status: paused ? 'paused' : 'active' } } }));
    },
    /* Simulated OAuth (or HealthKit permission) round trip. */
    connectDevice(provider, dataTypes) {
      const types = dataTypes || Object.fromEntries(D.PROVIDERS[provider].dataTypes.map((t) => [t, true]));
      setState((s) => ({ devices: { ...s.devices, [provider]: { ...s.devices[provider], status: 'pending', dataTypes: types } } }));
      setTimeout(() => {
        setState((s) => ({ devices: { ...s.devices, [provider]: { ...s.devices[provider], status: 'active', connectedAt: s.devices[provider].connectedAt || Date.now(), lastSync: Date.now() } } }));
        toast(`${D.PROVIDERS[provider].short} connected`, 'success');
      }, 1200);
    },
    disconnectDevice(provider, purge) {
      setState((s) => ({ devices: { ...s.devices, [provider]: { status: 'revoked', connectedAt: null, lastSync: null, dataTypes: {}, purged: !!purge } } }));
      toast(purge ? `${D.PROVIDERS[provider].short} disconnected and its data deleted` : `${D.PROVIDERS[provider].short} disconnected`, 'info');
    },

    /* Notifications and privacy */
    markNotificationsRead() {
      setState({ notificationsReadAt: Date.now() });
    },
    requestExport() {
      const req = { id: uid('priv'), kind: 'export', status: 'running', requestedAt: Date.now() };
      setState((s) => ({ privacyRequests: [req, ...s.privacyRequests] }));
      setTimeout(() => {
        setState((s) => ({ privacyRequests: s.privacyRequests.map((r) => (r.id === req.id ? { ...r, status: 'ready', readyAt: Date.now(), expiresAt: Date.now() + 7 * D.DAY } : r)) }));
        toast('Your export is ready', 'success');
      }, 1500);
    },
    requestDeletion() {
      const req = { id: uid('priv'), kind: 'deletion', status: 'scheduled', requestedAt: Date.now(), scheduledFor: Date.now() + 7 * D.DAY };
      setState((s) => ({ privacyRequests: [req, ...s.privacyRequests.filter((r) => r.kind !== 'deletion')] }));
    },
    cancelDeletion() {
      setState((s) => ({ privacyRequests: s.privacyRequests.filter((r) => !(r.kind === 'deletion' && r.status === 'scheduled')) }));
    },

    resetPrototype() {
      try { window.localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
      state = { ...seedState(), nav: initialNav(), overlay: null, toast: null };
      listeners.forEach((fn) => fn());
    },
    /* Skip onboarding with the sample profile (side panel and debug). */
    skipOnboarding() {
      setState((s) => ({ onboarded: true, disclaimerAcknowledgedAt: s.disclaimerAcknowledgedAt || Date.now(), nav: initialNav() }));
    }
  };

  /* ---------------------------------------------------------- selectors */
  const selectors = {
    todayEntries: (s) => s.foodLog.filter((e) => e.at >= D.startOfToday() && e.at < D.startOfToday() + D.DAY),
    todayTotals: (s) => M.sumNutrients(selectors.todayEntries(s)),
    currentVersion: (s) => s.split.versions.find((v) => v.number === s.split.current),
    currentDefinition: (s) => selectors.currentVersion(s).definition,
    /* Sessions in the last 7 days and the sets they covered per muscle. */
    weekSessions: (s) => s.sessions.filter((x) => x.at >= D.startOfToday() - 6 * D.DAY),
    weekDoneVolume: (s) => {
      const vol = Object.fromEntries(D.MUSCLES.map((m) => [m.id, 0]));
      selectors.weekSessions(s).forEach((ses) => ses.sets.forEach((st) => {
        const ex = M.exerciseById(st.exercise);
        Object.entries(ex.credit).forEach(([mu, c]) => { vol[mu] += st.setsDone * c; });
      }));
      return vol;
    },
    unreadNotifications: (s) => M.notifications(s).length,
    recommendation: (s, id) => s.recommendations.find((r) => r.id === id) || null
  };

  C.TABS = TABS;
  C.getState = getState;
  C.setState = setState;
  C.subscribe = subscribe;
  C.useApp = useApp;
  C.actions = actions;
  C.selectors = selectors;
  C.uid = uid;
})();
