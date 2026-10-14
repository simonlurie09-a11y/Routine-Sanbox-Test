/* Companion prototype — shared UI kit built on the Apple Design System bundle
   (window.AppleDS). Every colour, size, radius and weight is a token. Screens
   compose these; they never style with raw values. */
(function () {
  'use strict';

  const C = window.Companion;
  const D = C.data;
  const M = C.domain;
  const React = window.React;
  const html = window.htm.bind(React.createElement);
  const DS = window.AppleDS;
  const { ThemedText: T, Icon, StatusBadge, Card, CardFooter, Input, Button, StatGauge, Chip, NotificationBell } = DS;

  /* Context the router provides to every screen. */
  const ScreenContext = React.createContext({ isRoot: true, inModal: false, modalStyle: null, tab: 'today' });
  const useScreen = () => React.useContext(ScreenContext);

  /* --------------------------------------------------------------- icons */
  /* The bundle draws stand-ins for a few SF Symbols; these extra stand-ins
     follow its style. The shipping app renders real SF Symbols (iOS) or a
     mapped Material Symbols set (Android). */
  const BUNDLE_GLYPHS = new Set([
    'chevron.left', 'chevron.right', 'chevron.down', 'magnifyingglass', 'envelope', 'bell', 'gearshape',
    'star', 'star.fill', 'house', 'checkmark', 'plus', 'xmark', 'paperclip', 'ellipsis',
    'line.3.horizontal.decrease', 'checkmark.seal.fill', 'circle.fill'
  ]);
  const CORNERS = ['M4 8V5.5A1.5 1.5 0 015.5 4H8', 'M16 4h2.5A1.5 1.5 0 0120 5.5V8', 'M20 16v2.5a1.5 1.5 0 01-1.5 1.5H16', 'M8 20H5.5A1.5 1.5 0 014 18.5V16'];
  const STAND_INS = {
    'fork.knife': ['M7 3.5v5a2 2 0 004 0v-5', 'M9 3.5v17', 'M17 20.5v-17c-2 1.5-3 4-3 7.5h3'],
    dumbbell: ['M3.5 10v4', 'M6.5 7v10', 'M17.5 7v10', 'M20.5 10v4', 'M6.5 12h11'],
    heart: ['M12 19.5s-7-4.3-7-9.6a3.9 3.9 0 017-2.4 3.9 3.9 0 017 2.4c0 5.3-7 9.6-7 9.6z'],
    'clock.arrow.circlepath': ['M4.5 12a7.5 7.5 0 107.5-7.5A7.6 7.6 0 006.4 7', 'M4.5 4v3.5H8', 'M12 8.5V12l2.5 2'],
    'barcode.viewfinder': [...CORNERS, 'M8 9v6', 'M10.5 9v6', 'M13 9v6', 'M16 9v6'],
    'text.viewfinder': [...CORNERS, 'M8 10h8', 'M8 14h5'],
    camera: ['M4 8h3l1.5-2h7L17 8h3v11H4z', 'M12 16.5a3 3 0 100-6 3 3 0 000 6z'],
    photo: ['M4 5.5h16v13H4z', 'M4 15.5l4.5-4.5 4 4 2.5-2.5 5 5', 'M15.5 9.5h.01'],
    link: ['M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1', 'M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1'],
    flame: ['M12 20.5a6 6 0 006-6c0-4-3-6-4.5-9.5C12 7 10 8 9 10.5 8 9.5 7.5 8.5 7.5 8 6.5 9.5 6 11.5 6 14.5a6 6 0 006 6z'],
    'figure.run': ['M14.5 5.5h.01', 'M9 20l3-5 3 2v4', 'M6 11l3-3h4l2 4h3', 'M12 15l1-5'],
    'figure.strengthtraining.traditional': ['M12 5h.01', 'M4 9h16', 'M6 7v4', 'M18 7v4', 'M12 9v6', 'M12 15l-3 5.5', 'M12 15l3 5.5'],
    'arrow.triangle.2.circlepath': ['M5 12a7 7 0 0112-4.9', 'M17 4v3.5h-3.5', 'M19 12a7 7 0 01-12 4.9', 'M7 20v-3.5h3.5'],
    'arrow.clockwise': ['M19 12a7 7 0 11-2.1-5', 'M19 4v4h-4'],
    'arrow.uturn.backward': ['M9 14L4.5 9.5 9 5', 'M4.5 9.5H14a5.5 5.5 0 010 11h-3'],
    'square.and.arrow.up': ['M12 3.5v11', 'M8 7.5l4-4 4 4', 'M6 10.5H5v10h14v-10h-1'],
    trash: ['M5 7h14', 'M10 7V4.5h4V7', 'M7 7l1 13h8l1-13'],
    pencil: ['M15.5 5.5l3 3', 'M5 19l1-4L16 5l3 3L9 18z'],
    minus: ['M5 12h14'],
    target: ['M12 20.5a8.5 8.5 0 100-17 8.5 8.5 0 000 17z', 'M12 16a4 4 0 100-8 4 4 0 000 8z', 'M12 12h.01'],
    'person.crop.circle': ['M12 20.5a8.5 8.5 0 100-17 8.5 8.5 0 000 17z', 'M12 12.5a3 3 0 100-6 3 3 0 000 6z', 'M6.5 18a6 6 0 0111 0'],
    'lock.shield': ['M12 3.5l7 2.5v5.5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z', 'M9.5 12.5h5v3.5h-5z', 'M10.5 12.5V11a1.5 1.5 0 013 0v1.5'],
    'doc.text': ['M14 3.5H6.5v17h11V7z', 'M14 3.5V7h3.5', 'M9 11h6', 'M9 14h6', 'M9 17h4'],
    'info.circle': ['M12 20.5a8.5 8.5 0 100-17 8.5 8.5 0 000 17z', 'M12 11v5', 'M12 8h.01'],
    'exclamationmark.triangle': ['M12 4l9 16H3z', 'M12 10v4', 'M12 17h.01'],
    keyboard: ['M3.5 7h17v10h-17z', 'M7 10h.01', 'M10 10h.01', 'M13 10h.01', 'M16 10h.01', 'M8 14h8'],
    'play.fill': ['M8 5.5l10 6.5-10 6.5z'],
    'waveform.path.ecg': ['M3 12h4l2-5 3 10 2-7 1.5 2H21'],
    'bed.double': ['M3.5 18V7', 'M3.5 14h17v4', 'M20.5 14v-2.5a2.5 2.5 0 00-2.5-2.5h-7v5', 'M7 11.5h.01'],
    applewatch: ['M8.5 6.5h7a2 2 0 012 2v7a2 2 0 01-2 2h-7a2 2 0 01-2-2v-7a2 2 0 012-2z', 'M9.5 6.5L10 3h4l.5 3.5', 'M9.5 17.5L10 21h4l.5-3.5'],
    'list.bullet': ['M9 7h11', 'M9 12h11', 'M9 17h11', 'M5 7h.01', 'M5 12h.01', 'M5 17h.01']
  };
  function Glyph({ name, size = 20, color }) {
    if (BUNDLE_GLYPHS.has(name) || !STAND_INS[name]) {
      return html`<${Icon} name=${name} size=${size} color=${color} />`;
    }
    return html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"
      style=${{ color: color ? `var(--${color})` : undefined, flex: 'none', display: 'block' }}>
      ${STAND_INS[name].map((d, i) => html`<path key=${i} d=${d} />`)}
    </svg>`;
  }

  /* -------------------------------------------------------------- type */
  const H2 = ({ children }) => html`<${T} size="headline" font="bold" as="h2">${children}<//>`;
  const CardTitle = ({ children }) => html`<${T} size="headline" font="semiBold" as="h3">${children}<//>`;
  const Caption = ({ children, color = 'inkMuted48' }) => html`<${T} size="caption" color=${color} as="p">${children}<//>`;
  const Callout = ({ children, color = 'inkMuted80' }) => html`<${T} size="callout" color=${color} as="p">${children}<//>`;
  const Body = ({ children, color = 'ink' }) => html`<${T} size="body" color=${color} as="p">${children}<//>`;
  const Micro = ({ children }) => html`<${T} size="micro" color="inkMuted48" as="p">${children}<//>`;

  /* ------------------------------------------------------------ badges */
  function Badge({ palette, status, label }) {
    const pal = C.palettes[palette];
    if (!pal) throw new Error(`Unknown palette ${palette}`);
    return html`<${StatusBadge} palette=${pal} status=${status} label=${label} />`;
  }

  /* ------------------------------------------------------------ buttons */
  function LinkButton({ label, onPress, color = 'primary', size = 'body', icon, align }) {
    return html`<button type="button" className="link" onClick=${onPress} style=${align ? { alignSelf: align } : undefined}>
      ${icon ? html`<${Glyph} name=${icon} size=${size === 'caption' ? 16 : 18} color=${color} />` : null}
      <${T} size=${size} color=${color}>${label}<//>
    </button>`;
  }
  function IconButton({ name, label, onPress, color = 'primary', size = 22 }) {
    return html`<button type="button" className="icon-btn" aria-label=${label} onClick=${onPress}><${Glyph} name=${name} size=${size} color=${color} /></button>`;
  }
  const SettingsButton = () => html`<${IconButton} name="gearshape" label="Settings" onPress=${() => C.actions.push('settings')} />`;
  function BellButton() {
    const s = C.useApp();
    const count = M.notifications(s).length;
    return html`<${NotificationBell} count=${count} onPress=${() => C.actions.push('notifications')} />`;
  }

  /* ------------------------------------------------------------ switch */
  /* The platform switch, tinted primary (the design system has none). */
  function Switch({ on, onChange, label, disabled }) {
    return html`<button type="button" role="switch" className="switch" aria-checked=${on ? 'true' : 'false'} aria-label=${label}
      disabled=${disabled} onClick=${() => onChange && onChange(!on)}></button>`;
  }

  /* ----------------------------------------------------------- screens */
  /* Standard screen: the collapsing large-title AppHeader. Tab roots get the
     settings button and the bell; modal roots get a close action. */
  function Screen({ title, subtitle, right, left, children, flush, closeLabel }) {
    const ctx = useScreen();
    const isTabRoot = ctx.isRoot && !ctx.inModal;
    const isModalRoot = ctx.isRoot && ctx.inModal;
    const leftNode = left || (isTabRoot ? html`<${SettingsButton} />` : isModalRoot ? html`<${LinkButton} label=${closeLabel || 'Close'} onPress=${C.actions.dismiss} />` : null);
    const rightNode = right !== undefined ? right : isTabRoot ? html`<${BellButton} />` : null;
    return html`<div className=${'screen' + (ctx.inModal ? ' screen--in-modal' : '')}>
      <div className="screen__body">
        <${DS.AppHeader} title=${title} subtitle=${subtitle} showBack=${!ctx.isRoot}
          onBack=${C.actions.pop} left=${leftNode} right=${rightNode} flush=${flush}>
          <div className="screen__content">${children}</div>
        <//>
      </div>
    </div>`;
  }

  /* Plain screen (onboarding, form sheets): title at the top, content, then the
     action pushed to the bottom. Never centred vertically. */
  function PlainScreen({ title, subtitle, children, footer, topLeft, topRight, dark }) {
    const ctx = useScreen();
    return html`<div className=${'screen plain' + (ctx.inModal ? ' screen--in-modal' : '') + (dark ? ' plain--dark' : '')}>
      ${topLeft || topRight ? html`<div className="plain__bar">${topLeft || html`<span></span>`}${topRight || html`<span></span>`}</div>` : null}
      <div className="plain__scroll">
        ${title ? html`<div className="stack-xs">
          <${T} size="title2" font="bold" as="h1" color=${dark ? 'onDark' : 'ink'}>${title}<//>
          ${subtitle ? html`<${T} size="body" color=${dark ? 'bodyMuted' : 'inkMuted48'} as="p">${subtitle}<//>` : null}
        </div>` : null}
        <div className="stack">${children}</div>
        <div className="spacer"></div>
        ${footer ? html`<div className="stack-sm">${footer}</div>` : null}
      </div>
    </div>`;
  }

  function Section({ title, caption, action, children }) {
    return html`<section className="stack">
      ${title ? html`<div className="stack-xs">
        <div className="row row--between">${typeof title === 'string' ? html`<${H2}>${title}<//>` : title}${action || null}</div>
        ${caption ? html`<${Caption}>${caption}<//>` : null}
      </div>` : null}
      ${children}
    </section>`;
  }
  const Sections = ({ children }) => html`<div className="sections">${children}</div>`;

  /* Label/value list with hairline rows. rows: [[label, value, {tabular, valueColor}]] */
  function Facts({ rows }) {
    return html`<ul className="facts">
      ${rows.filter(Boolean).map(([k, v, o], i) => html`<li key=${k + i}>
        <${T} size="callout" color="inkMuted80">${k}<//>
        <${T} size="callout" color=${(o && o.valueColor) || 'ink'} className=${o && o.tabular === false ? '' : 'tabular'}>${v}<//>
      </li>`)}
    </ul>`;
  }

  /* Grouped rows (surfacePearl, dividerSoft) with an optional second line.
     rows: [{key, label, detail, right, onPress, color, icon, chevron}] */
  function Rows({ rows }) {
    return html`<div className="ads-group" role="list">
      ${rows.filter(Boolean).map((r) => {
        const inner = html`
          ${r.icon ? html`<${Glyph} name=${r.icon} size=${22} color=${r.iconColor || 'primary'} />` : null}
          <div className="grow stack-xxs">
            <${T} size="body" color=${r.color || 'ink'}>${r.label}<//>
            ${r.detail ? html`<${T} size="caption" color="inkMuted80">${r.detail}<//>` : null}
          </div>
          ${r.right || null}
          ${r.onPress && r.chevron !== false ? html`<${Glyph} name="chevron.right" size=${18} color="inkMuted48" />` : null}`;
        return r.onPress
          ? html`<button type="button" key=${r.key || r.label} role="listitem" className="ads-group__row ads-group__row--pressable" onClick=${r.onPress}>${inner}</button>`
          : html`<div key=${r.key || r.label} role="listitem" className="ads-group__row">${inner}</div>`;
      })}
    </div>`;
  }

  /* "Nothing here" / gate answers: the EmptyState layout with any glyph. */
  function EmptyAnswer({ icon = 'magnifyingglass', title, body, children }) {
    return html`<div className="ads-empty">
      <${Glyph} name=${icon} size=${44} color="inkMuted48" />
      <${T} size="title3" font="semiBold" as="h2">${title}<//>
      ${body ? html`<${T} size="body" color="inkMuted48" className="ads-empty__body" as="p">${body}<//>` : null}
      ${children ? html`<div className="ads-empty__cta stack-sm" style=${{ alignSelf: 'stretch' }}>${children}</div>` : null}
    </div>`;
  }

  /* The disclaimer on a canvasParchment band (the surface change is the divider). */
  const DisclaimerBand = ({ text }) => html`<div className="band"><${Caption} color="inkMuted80">${text || D.DISCLAIMER.short}<//></div>`;

  /* Pinned bottom actions inside a scroll view. */
  const Actions = ({ children }) => html`<div className="actions stack-sm">${children}</div>`;

  /* ------------------------------------------------------- food pieces */
  function NutritionCard({ food, grams, title = 'Nutrition' }) {
    const nu = M.nutrientsFor(food, grams);
    const val = (v) => (v == null ? 'Not listed' : M.fmt.g(v));
    return html`<${Card}>
      <div className="row row--between">
        <${CardTitle}>${title}<//>
        <${T} size="headline" font="semiBold" className="tabular">${nu.energyKcal == null ? '—' : M.fmt.kcal(nu.energyKcal)}<//>
      </div>
      <${Facts} rows=${[
        ['Protein', val(nu.proteinG)], ['Carbohydrate', val(nu.carbohydrateG)], ['of which sugars', val(nu.sugarsG)],
        ['Fat', val(nu.fatG)], ['of which saturates', val(nu.saturatedFatG)], ['Fibre', val(nu.fiberG)],
        ['Salt', nu.saltG == null ? 'Not listed' : `${M.fmt.num(nu.saltG, 2)} g`]
      ]} />
    <//>`;
  }

  /* The evidence-library claim that explains why a rating line is shown. */
  const RATING_CLAIMS = {
    sugarsG: 'nutrition.free_sugars_and_health',
    saltG: 'nutrition.sodium_reduction_blood_pressure',
    saturatedFatG: 'nutrition.saturated_fat_replacement_cvd',
    fiberG: 'nutrition.fibre_intake_target',
    processing: 'nutrition.ultra_processed_food_associations'
  };
  const studiedClaim = (key) => {
    const c = key && (D.CLAIMS || []).find((x) => x.key === key);
    return c && ((c.sources || []).length + (c.contradicting || []).length + (c.context || []).length) ? c : null;
  };
  function HealthRatingList({ food, confidence }) {
    const rating = M.healthRating(food);
    return html`<div className="stack">
      <div className="ads-group" role="list">
        ${rating.dimensions.filter((d) => d.key !== 'fatG' || d.status !== 'low').map((d) => {
          const claim = studiedClaim(RATING_CLAIMS[d.key]);
          return html`
          <div key=${d.key} className="ads-group__row row--stacked" role="listitem">
            <div className="row row--between"><${T} size="body">${d.label}<//><${Badge} palette=${d.palette} status=${d.status} /></div>
            <${Caption} color="inkMuted80">${d.explanation}<//>
            ${claim ? html`<${LinkButton} size="caption" align="flex-start" label=${`Why ${d.label.toLowerCase()} is on this list`}
              onPress=${() => C.actions.push('claim', { key: claim.key })} />` : null}
          </div>`;
        })}
      </div>
      ${confidence && confidence !== 'high' ? html`<${Caption}>These levels use estimated values, so treat them as a guide.<//>` : null}
      <${Micro}>${food.attribution ? `${food.attribution}. ` : ''}Levels use the UK front-of-pack guidance and EU Regulation 1924/2006.<//>
    </div>`;
  }

  /* --------------------------------------------------- evidence pieces */
  /* '2026-10-12' -> '12 Oct 2026' without timezone drift. */
  function isoDate(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  /* PubMed first, then DOI, then the page the source was found on (guidelines). */
  function linkFor(src) {
    if (src.pmid) return { href: `https://pubmed.ncbi.nlm.nih.gov/${src.pmid}/`, text: `PubMed ${src.pmid}` };
    if (src.doi) return { href: `https://doi.org/${src.doi}`, text: `doi.org/${src.doi}` };
    if (src.url) return { href: src.url, text: src.url.replace(/^https?:\/\//, '').replace(/\/$/, '') };
    return null;
  }
  /* role: "supports" (default) shows the verification badge; "contradicts" and
     "context" are listed for honesty and never count toward a claim. */
  const ROLE_WORDS = { contradicts: 'Contradicting or mixed evidence', context: 'Background, not counted' };
  function CitationCard({ source, role = 'supports' }) {
    const link = linkFor(source);
    return html`<${Card}>
      <div className="stack-xs">
        <${CardTitle}>${source.short}<//>
        <${Caption}>${source.design}<//>
      </div>
      <${T} size="callout" as="p">${source.title}.<//>
      <${Caption}>${source.authors}. ${source.journal} ${source.citation}.<//>
      <div className="stack-xs">
        <${T} size="callout" font="semiBold" as="p">What it found<//>
        <${Callout}>${source.found}<//>
      </div>
      <div className="stack-xs">
        <${T} size="callout" font="semiBold" as="p">Limitations<//>
        <${Callout}>${source.limitations}<//>
      </div>
      <div className="stack-sm hairline-top">
        <${CardFooter}>
          ${role === 'supports'
            ? html`<${Badge} palette="sourceVerification" status=${M.isVerified(source) ? 'verified' : 'needs_human'} />`
            : html`<${Caption} color="inkMuted80">${ROLE_WORDS[role] || ROLE_WORDS.context}<//>`}
          <${Caption}>${M.isVerified(source) ? `Checked ${isoDate(source.verifiedAt)}` : 'Not yet verified'}<//>
        <//>
        ${link ? html`<a className="link row" href=${link.href} target="_blank" rel="noopener noreferrer">
          <${Glyph} name="link" size=${16} color="primary" /><${T} size="caption" color="primary">${link.text}<//>
        </a>` : null}
      </div>
    <//>`;
  }
  function ClaimCard({ claim, verifiedCount, required = 3, label = 'The claim' }) {
    return html`<${Card}>
      <${Caption}>${label}<//>
      <${T} size="callout" as="p">${claim.statement}<//>
      ${claim.population ? html`<${Caption} color="inkMuted80">Who the studies covered: ${claim.population}<//>` : null}
      <div className="row hairline-top">
        <${Glyph} name="checkmark.seal.fill" size=${18} color=${verifiedCount >= required ? 'primary' : 'inkMuted48'} />
        <${T} size="caption" color="inkMuted80">${verifiedCount >= required
          ? `${verifiedCount} verified ${verifiedCount === 1 ? 'study' : 'studies'}. We need at least ${required}.`
          : `${verifiedCount} of the ${required} verified studies we need`}<//>
      </div>
    <//>`;
  }
  function DiffCard({ ops }) {
    return html`<${Card}>
      ${ops.map((o, i) => html`<div key=${o.op + o.exercise + o.dayKey} className=${'stack-xs' + (i ? ' hairline-top' : '')}>
        <div className="row row--between"><${T} size="body" font="semiBold">${o.name}<//><${Badge} palette="diffOp" status=${o.op} /></div>
        <${Callout}>${o.text}<//>
      </div>`)}
    <//>`;
  }
  function VolumeCard({ deltas, minutes }) {
    return html`<${Card}>
      <${CardTitle}>Weekly sets<//>
      <${Facts} rows=${deltas.map((d) => [d.name, `${M.fmt.sets(d.before)} → ${M.fmt.sets(d.after)}`])} />
      ${(minutes || []).map((m) => html`<${Caption} key=${m.dayKey}>${m.label} goes from ${m.before} to ${m.after} minutes. Your limit is ${m.limit}.<//>`)}
    <//>`;
  }
  function DriversList({ drivers }) {
    return html`<${Rows} rows=${drivers.map((d, i) => ({ key: `${d.label}${i}`, label: d.label, detail: d.detail }))} />`;
  }

  /* --------------------------------------------------------- tab bar */
  const TAB_META = {
    today: { label: 'Today', icon: 'house' },
    food: { label: 'Food', icon: 'fork.knife' },
    training: { label: 'Training', icon: 'dumbbell' },
    recovery: { label: 'Recovery', icon: 'heart' },
    history: { label: 'History', icon: 'clock.arrow.circlepath' }
  };
  /* Same markup and classes as the bundle's TabBar, with stand-in glyphs. */
  function TabBar({ active }) {
    return html`<nav className="ads-tabbar tabbar" aria-label="Tabs">
      ${C.TABS.map((key) => html`
        <button key=${key} type="button" className=${'ads-tab' + (key === active ? ' ads-tab--active' : '')}
          aria-current=${key === active ? 'page' : undefined} onClick=${() => C.actions.go(key)}>
          <${Glyph} name=${TAB_META[key].icon} size=${22} />
          <${T} size="micro" style=${{ color: 'inherit' }}>${TAB_META[key].label}<//>
        </button>`)}
    </nav>`;
  }

  /* ----------------------------------------------------- small helpers */
  /* Filter-chip row (single choice). options: [{value, label}] */
  function ChoiceChips({ options, value, onChange, label }) {
    return html`<div className="row row--wrap" role="group" aria-label=${label}>
      ${options.map((o) => html`<${Chip} key=${o.value} variant="filter" active=${o.value === value} label=${o.label} onPress=${() => onChange(o.value)} />`)}
    </div>`;
  }
  /* Number stepper for sets and amounts. */
  function Stepper({ value, onChange, min = 0, max = 99, step = 1, label, format }) {
    return html`<div className="stepper" role="group" aria-label=${label}>
      <button type="button" className="stepper__btn" aria-label=${`Decrease ${label}`} disabled=${value <= min} onClick=${() => onChange(Math.max(min, value - step))}><${Glyph} name="minus" size=${18} color="primary" /></button>
      <${T} size="body" font="semiBold" className="tabular stepper__value">${format ? format(value) : value}<//>
      <button type="button" className="stepper__btn" aria-label=${`Increase ${label}`} disabled=${value >= max} onClick=${() => onChange(Math.min(max, value + step))}><${Glyph} name="plus" size=${18} color="primary" /></button>
    </div>`;
  }

  /* ------------------------------------------------------------ downloads */
  /* Files from data/ (Companion.downloads). In the claude.ai viewer the page
     asks the viewer through the "downloads" capability; opened as a plain file
     it uses an ordinary download link. When the viewer can't save files, the
     download buttons are hidden. */
  let downloadsPromise = null;
  function downloadsApi() {
    if (!downloadsPromise) {
      const host = window.claude;
      downloadsPromise = host && typeof host.use === 'function'
        ? Promise.resolve(host.use('downloads')).then((api) => (api ? { mode: 'viewer', api } : { mode: 'none' }), () => ({ mode: 'none' }))
        : Promise.resolve({ mode: 'link' });
    }
    return downloadsPromise;
  }
  function useDownloads() {
    const [mode, setMode] = React.useState('checking');
    React.useEffect(() => {
      let live = true;
      downloadsApi().then((d) => { if (live) setMode(d.mode); });
      return () => { live = false; };
    }, []);
    return { available: mode === 'viewer' || mode === 'link', checking: mode === 'checking', items: C.downloads || [] };
  }
  const sizeText = (text) => {
    const kb = new Blob([text]).size / 1024;
    return kb < 1024 ? `${Math.max(1, Math.round(kb))} KB` : `${(kb / 1024).toFixed(1)} MB`;
  };
  async function saveDownload(item) {
    const d = await downloadsApi();
    const toast = (m, v) => C.actions && C.actions.toast(m, v);
    if (d.mode === 'viewer') {
      try {
        const res = await d.api.save({ filename: item.filename, data: item.content });
        if (res && res.status === 'saved') toast(`Saved ${item.filename}`, 'success');
      } catch (e) {
        const code = e && e.code;
        if (code === 'declined') return;
        if (code === 'rate_limited') toast('A download is already waiting for you to confirm.');
        else toast("This view can't save files. The same files are in the project's data folder.");
      }
      return;
    }
    if (d.mode === 'link') {
      const url = URL.createObjectURL(new Blob([item.content], { type: 'application/octet-stream' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = item.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }
  }

  /* Screen registry: Companion.registerScreen(key, Component, meta). */
  C.screenRegistry = {};
  C.registerScreen = (key, Component, meta) => {
    if (C.screenRegistry[key]) throw new Error(`Screen "${key}" is registered twice`);
    C.screenRegistry[key] = { Component, meta: meta || {} };
  };

  C.ui = {
    html, DS, T, Icon, Card, CardFooter, Input, Button, StatGauge, Chip, NotificationBell,
    ScreenContext, useScreen,
    Glyph, H2, CardTitle, Caption, Callout, Body, Micro, Badge,
    LinkButton, IconButton, SettingsButton, BellButton, Switch,
    Screen, PlainScreen, Section, Sections, Facts, Rows, EmptyAnswer, DisclaimerBand, Actions,
    isoDate, NutritionCard, HealthRatingList, CitationCard, ClaimCard, DiffCard, VolumeCard, DriversList,
    TabBar, TAB_META, ChoiceChips, Stepper,
    useDownloads, saveDownload, sizeText, linkFor
  };
})();
