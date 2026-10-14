/* Companion prototype — History tab and notifications (builder E).
   History (docs/07 §7.3, docs/08 §8.6 "History"): filter chips for the split
   timeline, nutrition target changes and what we chose not to change. As in
   the mockup, the split timeline also shows the requests we didn't apply, in
   date order; "Not changed" lists only those. Every entry is a frozen record
   from state: split versions, recommendations and target history.
   Notifications lists what needs you, from M.notifications. */
(function () {
  'use strict';

  const C = window.Companion;
  const React = window.React;
  const { useState, useEffect } = React;
  const { html, T, Card, CardFooter, Screen, Sections, Facts, Rows, Badge, Caption, Callout, CardTitle,
          LinkButton, Switch, Glyph, EmptyAnswer, ChoiceChips } = C.ui;
  const M = C.domain, A = C.actions, S = C.selectors;

  /* ------------------------------------------------------------ constants */
  const FILTERS = [
    { value: 'split', label: 'Split' },
    { value: 'nutrition', label: 'Nutrition' },
    { value: 'not_changed', label: 'Not changed' }
  ];
  /* Recommendation states where the split stayed as it was. */
  const NOT_CHANGED = ['blocked_insufficient_evidence', 'blocked_safety', 'blocked_constraints', 'blocked_verification_unavailable',
    'rejected', 'superseded', 'withdrawn', 'expired', 'not_needed'];
  /* States the recommendation palette has no word for. */
  const EXTRA_LABELS = { blocked_constraints: "Didn't fit", not_needed: 'No change needed' };
  const TARGET_FIELDS = [
    { key: 'energyKcal', label: 'Calories', format: (v) => M.fmt.kcal(v) },
    { key: 'proteinG', label: 'Protein', format: (v) => M.fmt.g(v) },
    { key: 'carbohydrateG', label: 'Carbs', format: (v) => M.fmt.g(v) },
    { key: 'fatG', label: 'Fat', format: (v) => M.fmt.g(v) },
    { key: 'fiberG', label: 'Fibre', format: (v) => M.fmt.g(v) }
  ];
  const MAX_DELTAS = 3;

  /* The chosen filter survives opening an entry and coming back (the tab
     root remounts when it is on top of the stack again). */
  let lastFilter = 'split';

  /* ------------------------------------------------------------- helpers */
  const plural = (n, one, many) => `${n} ${n === 1 ? one : (many || `${one}s`)}`;
  const lowerFirst = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
  function quoted(text) {
    const t = String(text).trim();
    return `“${/[.?!]$/.test(t) ? t : `${t}.`}”`;
  }

  function RecBadge({ status, needs }) {
    const known = C.palettes.recommendation[status];
    const label = status === 'blocked_constraints' && needs ? 'Needed a detail' : EXTRA_LABELS[status] || status;
    return html`<${Badge} palette="recommendation" status=${status} label=${known ? undefined : label} />`;
  }

  const Chevron = () => html`<${Glyph} name="chevron.right" size=${18} color="inkMuted48" />`;
  const End = () => html`<${T} size="caption" color="inkMuted48" align="center" as="p">That's everything<//>`;

  /* "Weekly sets: rear delts 2 → 4, upper back 9 → 10." from the previous version. */
  function deltaLine(prev, v) {
    if (!prev) return null;
    const deltas = M.volumeDeltas(prev.definition, v.definition);
    if (!deltas.length) return null;
    const shown = deltas.slice(0, MAX_DELTAS).map((d) => `${lowerFirst(d.name)} ${M.fmt.sets(d.before)} → ${M.fmt.sets(d.after)}`);
    const more = deltas.length > MAX_DELTAS ? ` and ${deltas.length - MAX_DELTAS} more` : '';
    return `Weekly sets: ${shown.join(', ')}${more}.`;
  }

  /* What the "Not changed" card quotes: the request in the person's words. */
  function requestLine(rec) {
    if (rec.requestText) return quoted(rec.requestText);
    if (rec.trigger === 'split_review' || (rec.intent && rec.intent.source === 'split_review')) return 'From your split review.';
    return rec.intent && rec.intent.summary ? rec.intent.summary : null;
  }
  function reasonLine(rec) {
    if (rec.status === 'rejected') return 'You declined this suggestion, so your split stayed as it was.';
    if (rec.status === 'superseded') return 'Your split changed before you applied it, so we left it.';
    if (rec.status === 'withdrawn') return 'Its studies no longer passed our checks, so we withdrew it.';
    if (rec.status === 'expired') return 'It expired before you decided.';
    return rec.reason || null;
  }
  function studiesLine(rec) {
    if (typeof rec.verifiedCount !== 'number') return '';
    const required = rec.required || M.REQUIRED_SOURCES;
    return rec.verifiedCount >= required
      ? `, ${plural(rec.verifiedCount, 'verified study', 'verified studies')}`
      : `, ${rec.verifiedCount} of ${required} studies verified`;
  }

  /* ---------------------------------------------------------------- cards */
  function VersionCard({ v, prev, isCurrent, rec }) {
    const deltas = deltaLine(prev, v);
    const studies = v.origin === 'app_recommendation' && rec && typeof rec.verifiedCount === 'number'
      ? `, ${plural(rec.verifiedCount, 'verified study', 'verified studies')}` : '';
    return html`<${Card} onPress=${() => A.push('split-version', { number: v.number })}>
      <div className="row"><${Badge} palette="splitOrigin" status=${v.origin} /></div>
      <div className="row row--between">
        <${CardTitle}>${`Version ${v.number}`}<//>
        ${isCurrent ? html`<${Caption}>Current<//>` : null}
      </div>
      <${Callout}>${v.note}<//>
      ${deltas ? html`<${Caption}>${deltas}<//>` : null}
      <${CardFooter}><${Caption}>${`${M.fmt.dayMonth(v.createdAt)}${studies}`}<//><${Chevron} /><//>
    <//>`;
  }

  function NotChangedCard({ rec }) {
    const request = requestLine(rec);
    const reason = reasonLine(rec);
    return html`<${Card} onPress=${() => A.push('recommendation', { id: rec.id })}>
      <div className="row"><${RecBadge} status=${rec.status} needs=${rec.needs} /></div>
      <${CardTitle}>${rec.title || 'Not changed'}<//>
      ${request ? html`<${Callout}>${request}<//>` : null}
      ${reason ? html`<${Caption} color="inkMuted80">${reason}<//>` : null}
      <${CardFooter}><${Caption}>${`${M.fmt.dayMonth(rec.createdAt)}${studiesLine(rec)}`}<//><${Chevron} /><//>
    <//>`;
  }

  /* "Changed protein from 160 g to 170 g." against the entry before it. */
  function targetChangeLine(entry, prev) {
    if (!prev) return 'Your starting targets.';
    const changed = TARGET_FIELDS.filter((f) => entry.values[f.key] !== prev.values[f.key]);
    if (!changed.length) return 'Saved with no changes.';
    return `Changed ${M.listJoin(changed.map((f) => `${f.label.toLowerCase()} from ${f.format(prev.values[f.key])} to ${f.format(entry.values[f.key])}`))}.`;
  }

  function TargetsCard({ entry, prev, isCurrent }) {
    return html`<${Card}>
      <div className="row"><${Badge} palette="splitOrigin" status=${entry.origin || 'user_edit'} /></div>
      <div className="row row--between">
        <${CardTitle}>Daily targets<//>
        ${isCurrent ? html`<${Caption}>Current<//>` : null}
      </div>
      <${Callout}>${targetChangeLine(entry, prev)}<//>
      <${Facts} rows=${TARGET_FIELDS.filter((f) => entry.values[f.key] != null).map((f) => [f.label, f.format(entry.values[f.key])])} />
      <${CardFooter}><${Caption}>${M.fmt.dayMonth(entry.at)}<//><//>
    <//>`;
  }

  /* -------------------------------------------------------------- lists */
  function SplitTimeline({ s }) {
    const versions = s.split.versions.slice().sort((a, b) => a.number - b.number);
    const prevOf = (v) => versions.filter((x) => x.number < v.number).pop() || null;
    const items = [
      ...versions.map((v) => ({ kind: 'version', at: v.createdAt, order: v.number, v })),
      ...s.recommendations.filter((r) => NOT_CHANGED.includes(r.status)).map((r) => ({ kind: 'rec', at: r.createdAt, order: 0, rec: r }))
    ].sort((a, b) => b.at - a.at || b.order - a.order);
    return html`<div className="stack">
      <${Caption}>Every version of your split, and the requests we didn't apply. Tap one to see the record.<//>
      <div className="stack-sm" style=${{ gap: 'var(--spacing-base)' }}>
        ${items.map((it) => (it.kind === 'version'
          ? html`<${VersionCard} key=${`v${it.v.number}`} v=${it.v} prev=${prevOf(it.v)} isCurrent=${it.v.number === s.split.current}
              rec=${it.v.recommendationId ? S.recommendation(s, it.v.recommendationId) : null} />`
          : html`<${NotChangedCard} key=${it.rec.id} rec=${it.rec} />`))}
      </div>
      <${End} />
    </div>`;
  }

  function NotChangedList({ s }) {
    const recs = s.recommendations.filter((r) => NOT_CHANGED.includes(r.status)).slice().sort((a, b) => b.createdAt - a.createdAt);
    if (!recs.length) {
      return html`<${EmptyAnswer} icon="clock.arrow.circlepath" title="Nothing here yet"
        body="When we don't make a change you asked for, it shows here with the reason." />`;
    }
    return html`<div className="stack">
      <${Caption}>Requests and suggestions we didn't apply, and why. Your split stayed as it was each time.<//>
      <div className="stack-sm" style=${{ gap: 'var(--spacing-base)' }}>
        ${recs.map((r) => html`<${NotChangedCard} key=${r.id} rec=${r} />`)}
      </div>
      <${End} />
    </div>`;
  }

  function NutritionList({ s }) {
    const history = s.targets.history || [];
    const ready = Object.values(M.TARGET_RULES).filter((r) => M.verifiedSourcesFor(M.claimByKey(r.claim)).length >= M.REQUIRED_SOURCES).map((r) => r.label);
    const intro = html`<${Caption}>${ready.length
      ? `We suggest a target only when its claim has ${M.REQUIRED_SOURCES} verified studies. Today that covers ${M.listJoin(ready)}. Ask from Targets.`
      : `Target suggestions arrive once our nutrition evidence library has ${M.REQUIRED_SOURCES} verified studies per claim, so for now your targets are yours to set.`}<//>`;
    if (!history.length) {
      return html`<div className="stack">
        ${intro}
        <${EmptyAnswer} icon="target" title="No target changes yet" body="Your daily targets show here each time you change them.">
          <${LinkButton} label="Set your targets" align="center" onPress=${() => A.push('targets')} />
        <//>
      </div>`;
    }
    const newestFirst = history.map((entry, i) => ({ entry, prev: i ? history[i - 1] : null, isCurrent: i === history.length - 1 })).reverse();
    return html`<div className="stack">
      ${intro}
      <${LinkButton} label="Change your targets" align="flex-start" onPress=${() => A.push('targets')} />
      <div className="stack-sm" style=${{ gap: 'var(--spacing-base)' }}>
        ${newestFirst.map((x) => html`<${TargetsCard} key=${`${x.entry.at}-${x.entry.origin}`} entry=${x.entry} prev=${x.prev} isCurrent=${x.isCurrent} />`)}
      </div>
      <${End} />
    </div>`;
  }

  /* ------------------------------------------------------------- History */
  function History() {
    const s = C.useApp();
    const [filter, setFilterState] = useState(lastFilter);
    const setFilter = (v) => {
      lastFilter = v;
      setFilterState(v);
    };
    return html`<${Screen} title="History">
      <div className="stack">
        <${ChoiceChips} label="Show" options=${FILTERS} value=${filter} onChange=${setFilter} />
        ${filter === 'split' ? html`<${SplitTimeline} s=${s} />` : null}
        ${filter === 'nutrition' ? html`<${NutritionList} s=${s} />` : null}
        ${filter === 'not_changed' ? html`<${NotChangedList} s=${s} />` : null}
      </div>
    <//>`;
  }

  /* -------------------------------------------------------- Notifications */
  function Notifications() {
    const s = C.useApp();
    const items = M.notifications(s);
    useEffect(() => {
      A.markNotificationsRead();
    }, []);
    const pushOn = !!s.profile.notificationsAllowed;
    return html`<${Screen} title="Notifications">
      <${Sections}>
        ${items.length
          ? html`<${Rows} rows=${items.map((n) => ({
              key: n.id,
              icon: n.kind === 'device' ? 'applewatch' : 'dumbbell',
              iconColor: 'ink',
              label: n.title,
              detail: n.body,
              onPress: () => A.push(n.screen, n.params)
            }))} />`
          : html`<${EmptyAnswer} icon="bell" title="You're all caught up"
              body="Suggestions to review and devices to reconnect show up here." />`}
        <section className="stack-sm">
          <${Rows} rows=${[{
            key: 'push',
            label: 'Push notifications',
            detail: pushOn ? 'We also send these to your phone.' : 'Off, so these show only here.',
            right: html`<${Switch} on=${pushOn} label="Push notifications"
              onChange=${(on) => { A.updateProfile({ notificationsAllowed: on }); A.toast('Saved'); }} />`
          }]} />
          <${Caption}>Notifications never include health values. In the prototype, nothing is sent to your phone.<//>
        </section>
      <//>
    <//>`;
  }

  /* ------------------------------------------------------------ register */
  C.registerScreen('history', History, {
    title: 'History', tab: 'history', presentation: 'tab', demoParams: {}
  });
  C.registerScreen('notifications', Notifications, {
    title: 'Notifications', tab: 'today', presentation: 'push', demoParams: {}
  });
})();
