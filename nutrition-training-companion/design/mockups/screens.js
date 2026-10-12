/* Companion app screens built from the Apple Design System bundle (window.AppleDS).
   Every colour, size, radius and weight comes from a token; components are the
   bundle's own. Numbers and product names are illustrative. */
/* global React, ReactDOM, htm, AppleDS */
(async function () {
  'use strict';

  const html = htm.bind(React.createElement);
  const {
    ThemedText: T,
    Icon,
    Button,
    Chip,
    Input,
    Card,
    CardFooter,
    GroupedRows,
    StatGauge,
    StatusBadge,
    Alert,
    Sheet,
    AppHeader,
    NotificationBell
  } = AppleDS;

  const palettes = await (await fetch('../app-palettes.json')).json();
  const Badge = ({ palette, status }) =>
    html`<${StatusBadge} palette=${palettes[palette]} status=${status} />`;

  /* ---------------------------------------------------------------- icons */
  /* The bundle draws stand-ins for a handful of SF Symbols. These extra
     stand-ins follow its drawing style; the app renders the real SF Symbols
     (iOS) or a mapped Material Symbols set (Android). */
  const BUNDLE_GLYPHS = new Set([
    'chevron.left', 'chevron.right', 'chevron.down', 'magnifyingglass', 'envelope', 'bell',
    'gearshape', 'star', 'star.fill', 'house', 'checkmark', 'plus', 'xmark', 'paperclip',
    'ellipsis', 'line.3.horizontal.decrease', 'checkmark.seal.fill', 'circle.fill'
  ]);
  const STAND_INS = {
    'fork.knife': ['M7 3.5v5a2 2 0 004 0v-5', 'M9 3.5v17', 'M17 20.5v-17c-2 1.5-3 4-3 7.5h3'],
    dumbbell: ['M3.5 10v4', 'M6.5 7v10', 'M17.5 7v10', 'M20.5 10v4', 'M6.5 12h11'],
    heart: ['M12 19.5s-7-4.3-7-9.6a3.9 3.9 0 017-2.4 3.9 3.9 0 017 2.4c0 5.3-7 9.6-7 9.6z'],
    'clock.arrow.circlepath': ['M4.5 12a7.5 7.5 0 107.5-7.5A7.6 7.6 0 006.4 7', 'M4.5 4v3.5H8', 'M12 8.5V12l2.5 2'],
    'barcode.viewfinder': [
      'M4 8V5.5A1.5 1.5 0 015.5 4H8', 'M16 4h2.5A1.5 1.5 0 0120 5.5V8',
      'M20 16v2.5a1.5 1.5 0 01-1.5 1.5H16', 'M8 20H5.5A1.5 1.5 0 014 18.5V16',
      'M8 9v6', 'M10.5 9v6', 'M13 9v6', 'M16 9v6'
    ],
    'text.viewfinder': [
      'M4 8V5.5A1.5 1.5 0 015.5 4H8', 'M16 4h2.5A1.5 1.5 0 0120 5.5V8',
      'M20 16v2.5a1.5 1.5 0 01-1.5 1.5H16', 'M8 20H5.5A1.5 1.5 0 014 18.5V16',
      'M8 10h8', 'M8 14h5'
    ],
    camera: ['M4 8h3l1.5-2h7L17 8h3v11H4z', 'M12 16.5a3 3 0 100-6 3 3 0 000 6z'],
    photo: ['M4 5.5h16v13H4z', 'M4 15.5l4.5-4.5 4 4 2.5-2.5 5 5', 'M15.5 9.5h.01'],
    link: ['M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1', 'M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1'],
    flame: ['M12 20.5a6 6 0 006-6c0-4-3-6-4.5-9.5C12 7 10 8 9 10.5 8 9.5 7.5 8.5 7.5 8 6.5 9.5 6 11.5 6 14.5a6 6 0 006 6z'],
    'figure.run': ['M14.5 5.5h.01', 'M9 20l3-5 3 2v4', 'M6 11l3-3h4l2 4h3', 'M12 15l1-5'],
    'figure.strengthtraining.traditional': ['M12 5h.01', 'M4 9h16', 'M6 7v4', 'M18 7v4', 'M12 9v6', 'M12 15l-3 5.5', 'M12 15l3 5.5'],
    'arrow.triangle.2.circlepath': ['M5 12a7 7 0 0112-4.9', 'M17 4v3.5h-3.5', 'M19 12a7 7 0 01-12 4.9', 'M7 20v-3.5h3.5'],
    'square.and.arrow.up': ['M12 3.5v11', 'M8 7.5l4-4 4 4', 'M6 10.5H5v10h14v-10h-1'],
    trash: ['M5 7h14', 'M10 7V4.5h4V7', 'M7 7l1 13h8l1-13']
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

  /* --------------------------------------------------------------- pieces */
  const H2 = ({ children }) => html`<${T} size="headline" font="bold" as="h2">${children}<//>`;
  const CardTitle = ({ children }) => html`<${T} size="headline" font="semiBold" as="h3">${children}<//>`;
  const Caption = ({ children, color = 'inkMuted48' }) =>
    html`<${T} size="caption" color=${color} as="p">${children}<//>`;
  const Callout = ({ children, color = 'inkMuted80' }) =>
    html`<${T} size="callout" color=${color} as="p">${children}<//>`;
  const Chevron = () => html`<${Glyph} name="chevron.right" size=${18} color="inkMuted48" />`;
  const SettingsButton = () =>
    html`<button type="button" className="icon-btn" aria-label="Settings"><${Glyph} name="gearshape" size=${22} color="primary" /></button>`;

  const TABS = [
    { key: 'today', label: 'Today', icon: 'house' },
    { key: 'food', label: 'Food', icon: 'fork.knife' },
    { key: 'training', label: 'Training', icon: 'dumbbell' },
    { key: 'recovery', label: 'Recovery', icon: 'heart' },
    { key: 'history', label: 'History', icon: 'clock.arrow.circlepath' }
  ];
  /* Same markup and classes as the bundle's TabBar, with stand-in glyphs. */
  const Tabs = ({ active }) => html`
    <div>
      <nav className="ads-tabbar" aria-label="Tabs">
        ${TABS.map((t) => html`
          <button key=${t.key} type="button" className=${'ads-tab' + (t.key === active ? ' ads-tab--active' : '')}
            aria-current=${t.key === active ? 'page' : undefined}>
            <${Glyph} name=${t.icon} size=${22} />
            <${T} size="micro" style=${{ color: 'inherit' }}>${t.label}<//>
          </button>`)}
      </nav>
      <div className="safe-bottom"></div>
    </div>`;

  const Switch = ({ on, label }) =>
    html`<button type="button" role="switch" className="switch" aria-checked=${on ? 'true' : 'false'} aria-label=${label}></button>`;

  const Disclaimer = () => html`
    <div className="surface-parchment">
      <${Caption} color="inkMuted80">General fitness information, not medical advice. If you have an injury or a medical
        condition, check with a qualified professional before changing your training.<//>
    </div>`;

  /* ---------------------------------------------------------- 1. Today */
  function TodayBody() {
    return html`
      <div className="safe-top"></div>
      <header className="hero">
        <div className="stack-xs">
          <${T} size="title3" font="bold" as="h1">Good morning<//>
          <${T} size="body" color="inkMuted48" as="p">Monday, 12 October<//>
        </div>
        <div className="row" style=${{ gap: 'var(--spacing-base)' }}>
          <${SettingsButton} />
          <${NotificationBell} count=${1} />
        </div>
      </header>
      <main className="gutter sections" style=${{ paddingBottom: 'var(--spacing-xxl)' }}>
        <section className="stack-sm">
          <div className="grid2">
            <${StatGauge} value="1,640 kcal" label="Calories, of 2,300" pct=${0.71} />
            <${StatGauge} value="112 g" label="Protein, of 160 g" pct=${0.7} />
            <${StatGauge} value="180 g" label="Carbs, of 260 g" pct=${0.69} />
            <${StatGauge} value="52 g" label="Fat, of 75 g" pct=${0.69} />
            <${StatGauge} value="21 g" label="Fibre, of 30 g" pct=${0.7} />
            <${StatGauge} value="2 of 4" label="Workouts this week" pct=${0.5} />
          </div>
          <div className="row row--wrap">
            <${Caption}>2 of today's 7 entries are estimates.<//>
            <button type="button" className="link"><${T} size="caption" color="primary">Review<//></button>
          </div>
        </section>

        <section className="stack">
          <${H2}>Recovery<//>
          <${Card}>
            <div className="row row--between">
              <${CardTitle}>Readiness<//>
              <${Badge} palette="readiness" status="reduced" />
            </div>
            <ul className="facts">
              <li><${T} size="callout">HRV 44 ms<//><${T} size="callout" color="inkMuted80" className="tabular">Your baseline 52 ± 6 ms<//></li>
              <li><${T} size="callout">Sleep 6 h 10 min<//><${T} size="callout" color="inkMuted80">Your average 7 h 15 min<//></li>
              <li><${T} size="callout">Resting HR 54 bpm<//><${T} size="callout" color="inkMuted80">In your usual range<//></li>
            </ul>
            <${Caption}>From Oura, last night. Synced at 07:12.<//>
          <//>
        </section>

        <section className="stack">
          <${H2}>Training this week<//>
          <div className="grid2">
            <${StatGauge} value="8 of 14" label="Back sets" pct=${0.57} />
            <${StatGauge} value="10 of 14" label="Chest sets" pct=${0.71} />
            <${StatGauge} value="12 of 20" label="Leg sets" pct=${0.6} />
            <${StatGauge} value="6 of 10" label="Shoulder sets" pct=${0.6} />
          </div>
        </section>

        <section className="stack">
          <${H2}>Suggestions<//>
          <${Card} onPress=${() => {}}>
            <div className="row"><${Badge} palette="recommendation" status="proposed" /></div>
            <${CardTitle}>More back work in your split<//>
            <${Callout}>From your request, backed by 3 verified studies.<//>
            <${CardFooter}>
              <${Caption}>Upper / Lower, version 3 to 4<//>
              <${Chevron} />
            <//>
          <//>
        </section>

        <section className="stack">
          <${H2}>Data sources<//>
          <${GroupedRows} rows=${[
            { key: 'oura', label: 'Oura', right: html`<${Badge} palette="connection" status="active" />` },
            { key: 'apple', label: 'Apple Health', right: html`<${Badge} palette="connection" status="active" />` },
            { key: 'whoop', label: 'WHOOP', right: html`<${Badge} palette="connection" status="needs_reauth" />`, onPress: () => {} }
          ]} />
        </section>
      </main>`;
  }
  const Today = () => html`<div className="phone">${TodayBody()}<${Tabs} active="today" /></div>`;

  /* ------------------------------------------------------ 2. Add food */
  const AddFood = () => html`
    <div className="phone phone--fixed">
      ${TodayBody()}
      <${Sheet} options=${[
        { label: 'Scan a barcode' },
        { label: 'Photograph a label' },
        { label: 'Search foods' },
        { label: 'Quick add calories' }
      ]} />
    </div>`;

  /* ------------------------------------------------------- 3. Scanner */
  const Scanner = () => html`
    <div className="phone phone--fixed phone--dark">
      <div className="safe-top"></div>
      <div className="row row--between gutter">
        <button type="button" className="round-ctrl" aria-label="Close"><${Glyph} name="xmark" size=${18} color="onDark" /></button>
        <${T} size="body" font="semiBold" color="onDark">Scan a barcode<//>
        <span style=${{ width: '36px' }}></span>
      </div>
      <div className="spacer"></div>
      <div className="stack" style=${{ alignItems: 'center' }}>
        <div className="viewfinder" aria-hidden="true"><span className="tl"></span><span className="tr"></span><span className="bl"></span><span className="br"></span></div>
        <div className="gutter"><${T} size="callout" color="bodyMuted" align="center" as="p">Hold the barcode inside the frame. We'll find it automatically.<//></div>
      </div>
      <div className="spacer"></div>
      <div className="stack-sm gutter" style=${{ alignItems: 'center', paddingBottom: 'var(--spacing-xl)' }}>
        <button type="button" className="link"><${T} size="body" color="primaryOnDark">Type the number instead<//></button>
        <button type="button" className="link"><${T} size="body" color="primaryOnDark">Photograph the label instead<//></button>
      </div>
      <div className="safe-bottom"></div>
    </div>`;

  /* --------------------------------------------------- 4. Food detail */
  const RATING = [
    ['Sugar', 'nutrientToLimit', 'high', "28 g per 100 g, above the UK 'high' level of 22.5 g. This bar has 11 g."],
    ['Saturated fat', 'nutrientToLimit', 'high', "5.8 g per 100 g, just above the 'high' level of 5 g."],
    ['Salt', 'nutrientToLimit', 'medium', '0.6 g per 100 g, between the 0.3 g and 1.5 g levels.'],
    ['Fibre', 'nutrientToEncourage', 'source', "4.2 g per 100 g meets the EU 'source of fibre' level of 3 g."],
    ['Processing', 'processing', 'nova4', 'NOVA group 4. Contains an emulsifier (E471) and flavouring.'],
    ['Protein', 'nutrientToEncourage', 'low', "6% of the calories come from protein, below the 12% 'source of protein' level."]
  ];
  const FACTS = [
    ['Protein', '2.4 g'], ['Carbohydrate', '25.6 g'], ['of which sugars', '11.2 g'], ['Fat', '5.2 g'],
    ['of which saturates', '2.3 g'], ['Fibre', '1.7 g'], ['Salt', '0.24 g']
  ];
  const FoodDetail = () => html`
    <div className="phone">
      <div className="safe-top"></div>
      <${AppHeader} title="Oat and chocolate bar" subtitle="Example Foods, 40 g bar">
        <div className="sections">
          <div className="stack">
            <div className="photo"><${Glyph} name="photo" size=${44} color="inkMuted48" /></div>
            <div className="row">
              <${Chip} variant="filter" active=${true} label="Per bar, 40 g" />
              <${Chip} variant="filter" label="Per 100 g" />
            </div>
            <${Card}>
              <div className="row row--between">
                <${CardTitle}>Nutrition<//>
                <${T} size="headline" font="semiBold" className="tabular">165 kcal<//>
              </div>
              <ul className="facts">
                ${FACTS.map(([k, v]) => html`<li key=${k}><${T} size="callout" color="inkMuted80">${k}<//><${T} size="callout" className="tabular">${v}<//></li>`)}
              </ul>
            <//>
          </div>

          <section className="stack">
            <div className="stack-xs">
              <${H2}>How healthy is it?<//>
              <${Caption}>Each line compares this food with a published reference, per 100 g.<//>
            </div>
            <div className="ads-group" role="list">
              ${RATING.map(([label, palette, status, why]) => html`
                <div key=${label} className="ads-group__row row--stacked" role="listitem">
                  <div className="row row--between"><${T} size="body">${label}<//><${Badge} palette=${palette} status=${status} /></div>
                  <${Caption} color="inkMuted80">${why}<//>
                </div>`)}
            </div>
            <${T} size="micro" color="inkMuted48" as="p">Product data from Open Food Facts (ODbL). Levels use the UK front-of-pack guidance and EU Regulation 1924/2006.<//>
          </section>

          <section className="stack">
            <div className="row">
              <${Chip} variant="filter" label="Breakfast" />
              <${Chip} variant="filter" label="Lunch" />
              <${Chip} variant="filter" label="Dinner" />
              <${Chip} variant="filter" active=${true} label="Snack" />
            </div>
            <${Button} fullWidth=${true} label="Log 1 bar, 165 kcal" />
          </section>
        </div>
      <//>
      <div className="safe-bottom"></div>
    </div>`;

  /* --------------------------------------------------- 5. Label check */
  const ESTIMATES = [
    ['Calories', '360–450 kcal', 'estimate'], ['Protein', '5–9 g', 'estimate'], ['Carbohydrate', '58–72 g', 'estimate'],
    ['of which sugars', '15–32 g', 'check'], ['Fat', '8–17 g', 'estimate']
  ];
  const LabelCheck = () => html`
    <div className="phone">
      <div className="safe-top"></div>
      <div className="gutter stack" style=${{ paddingTop: 'var(--spacing-base)', paddingBottom: 'var(--spacing-xl)' }}>
        <div className="stack-xs">
          <${T} size="title2" font="bold" as="h1">Check the label<//>
          <${T} size="body" color="inkMuted48" as="p">We read this from your photo. Fix anything that looks wrong.<//>
        </div>

        <${Card}>
          <div className="row"><${Badge} palette="estimateConfidence" status="low" /></div>
          <ul className="stack-xs">
            <li><${Callout}>There's no nutrition panel, so calories are estimated from the ingredient order.<//></li>
            <li><${Callout}>1 word was hard to read. It's marked below.<//></li>
          </ul>
          <${Button} variant="outline" label="Photograph the nutrition panel" />
        <//>

        <section className="stack">
          <${H2}>Ingredients<//>
          <div className="ads-group" role="list">
            <div className="ads-group__row" role="listitem"><${T} size="body" className="grow">1. Oats (42%)<//></div>
            <div className="ads-group__row" role="listitem"><${T} size="body" className="grow">2. Sugar<//></div>
          </div>
          <div className="stack-xs">
            <div className="row row--between">
              <${T} size="callout" font="semiBold">Ingredient 3<//>
              <${Badge} palette="estimateConfidence" status="check" />
            </div>
            <${Input} defaultValue="maltodextr1n" hint="Did you mean maltodextrin?" />
          </div>
        </section>

        <section className="stack">
          <div className="stack-xs">
            <${H2}>Estimated, per 100 g<//>
            <${Caption}>From 7 similar products, checked against basic nutrition maths.<//>
          </div>
          <${Card}>
            <ul className="facts">
              ${ESTIMATES.map(([k, v, s]) => html`
                <li key=${k}>
                  <${T} size="callout" color="inkMuted80" className="grow">${k}<//>
                  <div className="row"><${T} size="callout" className="tabular">${v}<//><${Badge} palette="estimateConfidence" status=${s} /></div>
                </li>`)}
            </ul>
          <//>
        </section>

        <div className="stack-sm" style=${{ marginTop: 'var(--spacing-sm)' }}>
          <${Button} fullWidth=${true} label="Save food" />
          <${Button} fullWidth=${true} variant="ghost" label="Discard" />
        </div>
      </div>
      <div className="safe-bottom"></div>
    </div>`;

  /* ---------------------------------------------- 6. Suggested change */
  const CITATIONS = [
    {
      card: 'Krieger, 2010',
      kind: 'Meta-analysis',
      title: 'Single vs. multiple sets of resistance exercise for muscle hypertrophy: a meta-analysis.',
      journal: 'Journal of Strength and Conditioning Research 24(4):1150–1159',
      found: 'Multiple sets were linked to about 40% larger growth effects than single sets, in trained and untrained people.',
      limits: "Counts sets per exercise, not weekly sets per muscle, and doesn't show where the benefit levels off.",
      id: 'PubMed 20300012'
    },
    {
      card: 'Schoenfeld et al., 2017',
      kind: 'Systematic review and meta-analysis',
      title: 'Dose-response relationship between weekly resistance training volume and increases in muscle mass.',
      journal: 'Journal of Sports Sciences 35:1073–1082',
      found: 'Across 15 studies, each extra weekly set was linked to a small further gain in muscle size.',
      limits: "The top group was '10 or more' weekly sets, and only 2 of the 15 studies involved trained people.",
      id: 'doi 10.1080/02640414.2016.1210197'
    },
    {
      card: 'Baz-Valle et al., 2022',
      kind: 'Systematic review',
      title: 'A systematic review of the effects of different resistance training volumes on muscle hypertrophy.',
      journal: 'Journal of Human Kinetics 81:199–210',
      found: 'Moderate (12–20) and high (over 20) weekly sets grew the quadriceps and biceps similarly.',
      limits: 'Only 7 studies, all in adults aged 18 to 35.',
      id: 'PubMed 35291645'
    }
  ];
  function SuggestedBody() {
    return html`
      <div className="safe-top"></div>
      <${AppHeader} title="Suggested change" subtitle="Upper / Lower, version 3 to 4">
        <div className="sections" style=${{ paddingBottom: 'var(--spacing-xl)' }}>
          <div className="stack-sm">
            <div className="row"><${Badge} palette="recommendation" status="proposed" /></div>
            <${Callout}>From your request: "I want a bigger back."<//>
          </div>

          <section className="stack">
            <${H2}>What changes<//>
            <${Card}>
              <div className="stack-xs">
                <div className="row row--between"><${T} size="body" font="semiBold">Lat pulldown<//><${Badge} palette="diffOp" status="add" /></div>
                <${Callout}>Monday, Upper A. 3 sets of 8–12, 2 reps in reserve.<//>
              </div>
              <div className="stack-xs hairline-top">
                <div className="row row--between"><${T} size="body" font="semiBold">Chest-supported row<//><${Badge} palette="diffOp" status="change" /></div>
                <${Callout}>Thursday, Upper B. 2 sets to 3 sets.<//>
              </div>
            <//>
            <${Card}>
              <${CardTitle}>Weekly sets<//>
              <ul className="facts">
                <li><${T} size="callout" color="inkMuted80">Lats<//><${T} size="callout" className="tabular">6 → 9.5<//></li>
                <li><${T} size="callout" color="inkMuted80">Upper back<//><${T} size="callout" className="tabular">7 → 9.5<//></li>
                <li><${T} size="callout" color="inkMuted80">Biceps<//><${T} size="callout" className="tabular">6 → 8<//></li>
              </ul>
              <${Caption}>Upper A goes from 52 to 58 minutes. Your limit is 60.<//>
            <//>
          </section>

          <section className="stack">
            <${H2}>Why we suggest it<//>
            <ul className="stack-sm">
              <li><${T} size="body" as="p">You asked to build your back.<//></li>
              <li><${T} size="body" as="p">Your lats get 6 weekly sets, the lowest pulling volume in your plan.<//></li>
              <li><${T} size="body" as="p">Your goal is building muscle.<//></li>
            </ul>
          </section>

          <section className="stack">
            <${H2}>Evidence<//>
            <${Card}>
              <${Caption}>The claim<//>
              <${T} size="callout" as="p">More weekly sets per muscle are linked to more growth within the ranges studied. Moving a muscle from low volume toward a moderate range is supported.<//>
              <div className="row hairline-top">
                <${Glyph} name="checkmark.seal.fill" size=${18} color="primary" />
                <${T} size="caption" color="inkMuted80">3 of 3 studies verified on 12 October 2026<//>
              </div>
            <//>
            ${CITATIONS.map((c) => html`
              <${Card} key=${c.card}>
                <div className="stack-xs">
                  <${CardTitle}>${c.card}<//>
                  <${Caption}>${c.kind}<//>
                </div>
                <${T} size="callout" as="p">${c.title}<//>
                <${Caption}>${c.journal}<//>
                <div className="stack-xs">
                  <${T} size="callout" font="semiBold" as="p">What it found<//>
                  <${Callout}>${c.found}<//>
                </div>
                <div className="stack-xs">
                  <${T} size="callout" font="semiBold" as="p">Limitations<//>
                  <${Callout}>${c.limits}<//>
                </div>
                <div className="stack-sm hairline-top">
                  <${CardFooter}>
                    <${Badge} palette="sourceVerification" status="verified" />
                    <${Caption}>Checked 12 Oct 2026<//>
                  <//>
                  <button type="button" className="link row"><${Glyph} name="link" size=${16} color="primary" /><${T} size="caption" color="primary">${c.id}<//></button>
                </div>
              <//>`)}
          </section>
        </div>
      <//>
      <${Disclaimer} />
      <div className="gutter stack-sm" style=${{ paddingTop: 'var(--spacing-xl)' }}>
        <${Button} fullWidth=${true} label="Apply change" />
        <${Button} fullWidth=${true} variant="ghost" label="Not now" />
      </div>
      <div className="safe-bottom"></div>`;
  }
  const Suggested = () => html`<div className="phone">${SuggestedBody()}</div>`;

  /* ------------------------------------------------- 7. Apply confirm */
  const ApplyConfirm = () => html`
    <div className="phone phone--fixed">
      ${SuggestedBody()}
      <${Alert} title="Apply this change?" message="Your split moves to version 4. You can go back to version 3 from History."
        buttons=${[{ label: 'Cancel', style: 'cancel' }, { label: 'Apply' }]} />
    </div>`;

  /* ---------------------------------------------- 8. Not enough evidence */
  const NotEnough = () => html`
    <div className="phone">
      <div className="safe-top"></div>
      <${AppHeader} title="Your request">
        <div className="stack">
          <${Card}>
            <${Caption}>You asked<//>
            <${T} size="body" as="p">[Your request, in your words]<//>
            <${CardFooter}><${Badge} palette="recommendation" status="blocked_insufficient_evidence" /><${Caption}>Today<//><//>
          <//>
          <div className="ads-empty">
            <${Glyph} name="magnifyingglass" size=${44} color="inkMuted48" />
            <${T} size="title3" font="semiBold">Not enough evidence yet<//>
            <${T} size="body" color="inkMuted48" className="ads-empty__body">We found 1 verified study. We need 3 before we change your plan, so your split stays as it is.<//>
          </div>
          <div className="stack-sm">
            <${Button} fullWidth=${true} label="Edit my split myself" />
            <${Button} fullWidth=${true} variant="outline" label="Keep my current split" />
          </div>
          <${Caption}>Your own edits are always yours to make. We'll label them "Your edit" in History.<//>
        </div>
      <//>
      <div className="safe-bottom"></div>
    </div>`;

  /* ------------------------------------------- 9. Connected devices */
  const badgeRight = (status) => html`<div className="row"><${Badge} palette="connection" status=${status} /><${Chevron} /></div>`;
  const Devices = () => html`
    <div className="phone">
      <div className="safe-top"></div>
      <${AppHeader} title="Connected devices" subtitle="Choose what each device shares.">
        <div className="sections">
          <section className="stack-sm">
            <${GroupedRows} rows=${[
              { key: 'apple', label: 'Apple Health', right: badgeRight('active'), onPress: () => {} },
              { key: 'oura', label: 'Oura', right: badgeRight('needs_reauth'), onPress: () => {} },
              { key: 'whoop', label: 'WHOOP', right: badgeRight('revoked'), onPress: () => {} },
              { key: 'fitbit', label: 'Fitbit, via Google', right: badgeRight('revoked'), onPress: () => {} }
            ]} />
            <${Caption}>We use this data to compare you with your own baseline. We never sell it or use it for advertising.<//>
          </section>
          <section className="stack">
            <${H2}>Your data<//>
            <${GroupedRows} rows=${[
              { key: 'export', label: 'Export your data', right: html`<${Chevron} />`, onPress: () => {} },
              { key: 'delete', label: 'Delete your account', color: 'danger', right: html`<${Chevron} />`, onPress: () => {} }
            ]} />
          </section>
        </div>
      <//>
      <div className="safe-bottom"></div>
    </div>`;

  /* ------------------------------------------------- 10. Oura detail */
  const SHARES = [
    ['Sleep', true], ['Heart rate variability', true], ['Resting heart rate', true],
    ['Readiness score', true], ['Workouts', false], ['Daily activity', false]
  ];
  function OuraBody() {
    return html`
      <div className="safe-top"></div>
      <${AppHeader} title="Oura" subtitle="Last synced today at 07:12">
        <div className="sections" style=${{ paddingBottom: 'var(--spacing-xl)' }}>
          <${Card}>
            <div className="row"><${Badge} palette="connection" status="needs_reauth" /></div>
            <${Callout}>Oura asked you to sign in again. Everything synced so far is safe.<//>
            <${Button} fullWidth=${true} label="Reconnect Oura" />
          <//>
          <section className="stack">
            <div className="stack-xs">
              <${H2}>What Oura shares<//>
              <${Caption}>Sleep, HRV and resting heart rate are compared with your own baseline to estimate readiness.<//>
            </div>
            <${GroupedRows} rows=${SHARES.map(([label, on]) => ({ key: label, label, right: html`<${Switch} on=${on} label=${label} />` }))} />
          </section>
          <div className="stack-sm">
            <${Button} fullWidth=${true} variant="outline" label="Pause sharing" />
            <${Button} fullWidth=${true} variant="danger" label="Disconnect Oura" />
          </div>
        </div>
      <//>
      <div className="safe-bottom"></div>`;
  }
  const Oura = () => html`<div className="phone">${OuraBody()}</div>`;

  /* ------------------------------------------- 11. Disconnect confirm */
  const Disconnect = () => html`
    <div className="phone phone--fixed">
      ${OuraBody()}
      <${Alert} title="Disconnect Oura?" message="We'll stop syncing and delete your Oura sign-in. What should happen to the data already synced?"
        buttons=${[{ label: 'Keep synced data' }, { label: 'Delete synced data', style: 'destructive' }, { label: 'Cancel', style: 'cancel' }]} />
    </div>`;

  /* ------------------------------------------------ 12. Onboarding goal */
  const GOALS = [
    ['dumbbell', 'Build muscle', 'Grow muscle with training volume to match.', true],
    ['figure.strengthtraining.traditional', 'Get stronger', 'Lift more on your main exercises.', false],
    ['flame', 'Lose fat', 'Eat a little less and keep your strength.', false],
    ['figure.run', 'Endurance', 'Run, ride or swim further.', false],
    ['arrow.triangle.2.circlepath', 'Hybrid', 'Strength and endurance in one plan.', false],
    ['heart', 'General health', 'Move well and eat well, without a single target.', false]
  ];
  const Goal = () => html`
    <div className="phone">
      <div className="safe-top"></div>
      <div className="gutter stack" style=${{ paddingTop: 'var(--spacing-xl)' }}>
        <div className="stack-xs">
          <${T} size="title2" font="bold" as="h1">What's your goal?<//>
          <${T} size="body" color="inkMuted48" as="p">You can change this later.<//>
        </div>
        <div className="stack-sm" style=${{ gap: 'var(--spacing-base)' }}>
          ${GOALS.map(([icon, title, body, selected]) => html`
            <${Card} key=${title} selected=${selected} onPress=${() => {}} className="option">
              <${Glyph} name=${icon} size=${28} color=${selected ? 'primary' : 'ink'} />
              <div className="stack-xs grow">
                <${T} size="headline" font="semiBold">${title}<//>
                <${T} size="callout" color="inkMuted48">${body}<//>
              </div>
            <//>`)}
        </div>
        <${Button} fullWidth=${true} label="Continue" />
      </div>
      <div style=${{ height: 'var(--spacing-xl)' }}></div>
      <div className="safe-bottom"></div>
    </div>`;

  /* -------------------------------------------------------- 13. History */
  const ENTRIES = [
    ['app_recommendation', 'splitOrigin', 'Version 4', 'Added lat pulldown. Chest-supported row 2 to 3 sets.', '12 Oct, 3 verified studies'],
    ['blocked_insufficient_evidence', 'recommendation', 'Not changed', '[Your request, in your words]', '9 Oct, 1 of 3 studies verified'],
    ['user_edit', 'splitOrigin', 'Version 3', 'Swapped incline barbell press for incline dumbbell press.', '28 Sep'],
    ['user_edit', 'splitOrigin', 'Version 2', 'Moved legs from Friday to Saturday.', '14 Sep'],
    ['import', 'splitOrigin', 'Version 1', 'Upper / Lower, 4 days.', '2 Sep']
  ];
  const History = () => html`
    <div className="phone">
      <div className="safe-top"></div>
      <${AppHeader} title="History" showBack=${false} left=${html`<${SettingsButton} />`} right=${html`<${NotificationBell} count=${1} />`}>
        <div className="stack">
          <div className="row">
            <${Chip} variant="filter" active=${true} label="Split" />
            <${Chip} variant="filter" label="Nutrition" />
            <${Chip} variant="filter" label="Not changed" />
          </div>
          <div className="stack-sm" style=${{ gap: 'var(--spacing-base)' }}>
            ${ENTRIES.map(([status, palette, title, body, meta]) => html`
              <${Card} key=${title + meta} onPress=${() => {}}>
                <div className="row"><${Badge} palette=${palette} status=${status} /></div>
                <${CardTitle}>${title}<//>
                <${Callout}>${body}<//>
                <${CardFooter}><${Caption}>${meta}<//><${Chevron} /><//>
              <//>`)}
          </div>
          <${T} size="caption" color="inkMuted48" align="center" as="p">That's everything<//>
        </div>
      <//>
      <${Tabs} active="history" />
    </div>`;

  /* -------------------------------------------------------------- mount */
  const SCREENS = [
    ['goal', 'Onboarding: goal', Goal],
    ['today', 'Today', Today],
    ['add-food', 'Add food', AddFood],
    ['scanner', 'Barcode scanner', Scanner],
    ['food-detail', 'Food and health rating', FoodDetail],
    ['label-check', 'Label check (OCR fallback)', LabelCheck],
    ['suggested-change', 'Suggested change with evidence', Suggested],
    ['apply-confirm', 'Apply confirmation', ApplyConfirm],
    ['not-enough-evidence', 'Not enough evidence', NotEnough],
    ['history', 'History', History],
    ['devices', 'Connected devices', Devices],
    ['oura', 'Device detail', Oura],
    ['disconnect', 'Disconnect confirmation', Disconnect]
  ];
  window.COMPANION_SCREENS = SCREENS.map(([key, name]) => ({ key, name }));

  const wanted = new URLSearchParams(location.search).get('screen');
  const shown = wanted ? SCREENS.filter(([key]) => key === wanted) : SCREENS;
  const App = () => html`
    <div className="sheet-page">
      ${shown.map(([key, name, Screen]) => html`
        <div key=${key} className="frame" data-screen=${key}>
          ${wanted ? null : html`<${T} size="caption" color="inkMuted80">${name}<//>`}
          <${Screen} />
        </div>`)}
    </div>`;
  ReactDOM.createRoot(document.getElementById('root')).render(html`<${App} />`);
  window.COMPANION_READY = true;
})();
