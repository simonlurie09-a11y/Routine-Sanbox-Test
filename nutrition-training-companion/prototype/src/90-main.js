/* Companion prototype — router, shell, overlays and mount.
   Screens register themselves with Companion.registerScreen(key, Component, meta). */
(function () {
  'use strict';

  const C = window.Companion;
  const React = window.React;
  const { html, ScreenContext, TabBar, Screen, EmptyAnswer, DS } = C.ui;

  const registry = C.screenRegistry;

  function Missing({ params }) {
    const entry = C.ui.useScreen().entry;
    return html`<${Screen} title="Not built yet">
      <${EmptyAnswer} icon="info.circle" title="This screen isn't in the prototype yet"
        body=${`Screen "${entry ? entry.key : '?'}" has no implementation.`} />
    <//>`;
  }

  /* One screen in a stack. Remounts (and animates) when the entry changes. */
  function ScreenHost({ entry, isRoot, inModal, modalStyle, tab, direction }) {
    const reg = registry[entry.key];
    const Comp = reg ? reg.Component : Missing;
    const ctx = React.useMemo(() => ({ isRoot, inModal, modalStyle, tab, entry }), [isRoot, inModal, modalStyle, tab, entry]);
    return html`<${ScreenContext.Provider} value=${ctx}>
      <div className=${`layer layer--${direction}`} data-screen=${entry.key}>
        <${Comp} params=${entry.params || {}} />
      </div>
    <//>`;
  }

  function Onboarding() {
    const reg = registry.onboarding;
    const ctx = React.useMemo(() => ({ isRoot: true, inModal: false, modalStyle: null, tab: null, entry: { key: 'onboarding', params: {} } }), []);
    return html`<${ScreenContext.Provider} value=${ctx}>
      <div className="layer layer--none" data-screen="onboarding">${reg ? html`<${reg.Component} params=${{}} />` : html`<${Missing} />`}</div>
    <//>`;
  }

  function Shell() {
    const s = C.useApp();
    if (!s.onboarded) return html`<div className="app-body"><div className="app-main"><${Onboarding} /></div></div>`;
    const stack = s.nav.stacks[s.nav.tab];
    const top = stack[stack.length - 1];
    const modals = s.nav.modals;
    return html`<div className="app-body">
      <div className="app-main" aria-hidden=${modals.length ? 'true' : undefined}>
        <${ScreenHost} key=${top.id} entry=${top} isRoot=${stack.length === 1} inModal=${false} tab=${s.nav.tab}
          direction=${modals.length ? 'none' : s.nav.direction} />
      </div>
      <${TabBar} active=${s.nav.tab} />
      ${modals.map((m, i) => {
        const mt = m.stack[m.stack.length - 1];
        const isTop = i === modals.length - 1;
        return html`<div key=${m.id} className=${`modal modal--${m.style}`} aria-hidden=${isTop ? undefined : 'true'}>
          <div className="modal__scrim"></div>
          <div className="modal__panel" role="dialog" aria-modal="true">
            <${ScreenHost} key=${mt.id} entry=${mt} isRoot=${m.stack.length === 1} inModal=${true} modalStyle=${m.style} tab=${s.nav.tab}
              direction=${isTop && m.stack.length > 1 ? s.nav.direction : 'none'} />
          </div>
        </div>`;
      })}
    </div>`;
  }

  /* Alerts and sheets are ours, never the platform's. Handlers run after close. */
  function OverlayHost() {
    const s = C.useApp();
    const ov = s.overlay;
    if (!ov) return null;
    if (ov.type === 'alert') {
      const buttons = (ov.props.buttons && ov.props.buttons.length ? ov.props.buttons : [{ label: 'OK' }])
        .map((b) => ({ ...b, onPress: () => C.actions.closeOverlay(b.onPress) }));
      return html`<div className="overlay" key=${ov.id}><${DS.Alert} title=${ov.props.title} message=${ov.props.message} buttons=${buttons} /></div>`;
    }
    const options = ov.props.options.map((o) => ({ ...o, onPress: () => C.actions.closeOverlay(o.onPress) }));
    return html`<div className="overlay" key=${ov.id}>
      <${DS.Sheet} title=${ov.props.title} message=${ov.props.message} options=${options}
        cancelLabel=${ov.props.cancelLabel} onCancel=${() => C.actions.closeOverlay(ov.props.onCancel)} />
    </div>`;
  }

  function ToastHost() {
    const s = C.useApp();
    if (!s.toast) return null;
    return html`<div className="toast-host" aria-live="polite">
      <${DS.Toast} key=${s.toast.id} message=${s.toast.message} variant=${s.toast.variant} onDismiss=${() => C.setState({ toast: null })} />
    </div>`;
  }

  function App() {
    return html`<div className="app" data-theme="readable">
      <${Shell} />
      <${OverlayHost} />
      <${ToastHost} />
    </div>`;
  }

  /* ------------------------------------------------- tour (side panel) */
  const TOUR = [
    { label: 'Start from onboarding', run: () => { C.actions.resetPrototype(); } },
    { label: 'Scan a barcode', run: () => { C.actions.skipOnboarding(); C.actions.present('scanner', {}, 'cover'); } },
    { label: 'Photograph a label', run: () => { C.actions.skipOnboarding(); C.actions.present('label-capture', {}, 'cover'); } },
    { label: 'Ask for a bigger back', run: () => { C.actions.skipOnboarding(); C.actions.go('training'); C.actions.present('change-request', { text: 'I want a bigger back' }); } },
    { label: 'Ask to get stronger', run: () => { C.actions.skipOnboarding(); C.actions.go('training'); C.actions.present('change-request', { text: 'Make me stronger' }); } },
    { label: "See today's readiness", run: () => { C.actions.skipOnboarding(); C.actions.go('recovery'); } },
    { label: 'Reconnect WHOOP', run: () => { C.actions.skipOnboarding(); C.actions.openIn('today', 'device', { provider: 'whoop' }); } },
    { label: 'Reset sample data', run: () => { C.actions.resetPrototype(); C.actions.skipOnboarding(); C.actions.toast('Sample data reset'); } }
  ];
  function Tour() {
    return html`<div className="tour" role="list">
      ${TOUR.map((t) => html`<button key=${t.label} type="button" role="listitem" className="tour__btn" onClick=${t.run}>${t.label}</button>`)}
    </div>`;
  }

  /* --------------------------------------------------------- debug hook */
  /* Used by scripts/harness.mjs to open any screen directly. */
  window.CompanionDebug = {
    screens: () => Object.entries(registry).map(([key, r]) => ({ key, ...r.meta })),
    state: () => C.getState(),
    actions: C.actions,
    show(key, params, opts) {
      const reg = registry[key];
      const meta = (reg && reg.meta) || {};
      const p = params || meta.demoParams || {};
      if (key === 'onboarding') {
        C.setState({ onboarded: false, onboardingDemo: p });
        return;
      }
      C.actions.skipOnboarding();
      C.actions.dismissAll();
      C.actions.closeOverlay();
      const presentation = (opts && opts.presentation) || meta.presentation || 'push';
      if (presentation === 'tab') {
        C.actions.openIn(meta.tab || key, key, params || meta.demoParams || null);
      } else if (presentation === 'sheet' || presentation === 'cover') {
        if (meta.tab) C.actions.go(meta.tab);
        C.actions.present(key, p, presentation);
      } else {
        C.actions.openIn(meta.tab || 'today', key, p);
      }
    }
  };

  /* -------------------------------------------------------------- mount */
  ReactDOM.createRoot(document.getElementById('app-root')).render(html`<${App} />`);
  const tourRoot = document.getElementById('tour-root');
  if (tourRoot) ReactDOM.createRoot(tourRoot).render(html`<${Tour} />`);
  window.COMPANION_READY = true;
})();
