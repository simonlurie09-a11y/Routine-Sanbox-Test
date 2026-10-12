/* Companion prototype — Training tab (builder D).
   The split and its weekly volume, the descriptive split review (docs/07 §7.5),
   change requests through the evidence gate (docs/06), the recommendation
   detail (docs/08 §8.6 "Suggested change" and "Not enough evidence"), split
   versions, the split editor (a user edit, never gated: docs/06 §6.1) and
   workout logging with the pain follow-up question (docs/07 §7.7). */
(function () {
  'use strict';

  const C = window.Companion;
  const React = window.React;
  const { useState, useEffect, useRef } = React;
  const { html, T, Card, CardFooter, Button, Input, Screen, PlainScreen, Section, Sections, Facts, Rows,
          Badge, Caption, Callout, Body, CardTitle, LinkButton, IconButton, Glyph, EmptyAnswer, DisclaimerBand,
          Actions, CitationCard, ClaimCard, DiffCard, VolumeCard, DriversList, ChoiceChips, Stepper, useScreen } = C.ui;
  const M = C.domain, D = C.data, A = C.actions, S = C.selectors;

  /* ------------------------------------------------------------ helpers */
  const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday first
  const REGION_WORDS = { upper: 'upper body', lower: 'lower body', core: 'core' };
  const NEW_ITEM = { sets: 3, repMin: 8, repMax: 12, rir: 2, restS: 90 }; // "3 sets of 8–12"
  const NOT_UNDERSTOOD = 'We couldn’t tell what to change. Try “build my back” or “get stronger”.';

  const plural = (n, one, many) => `${n} ${n === 1 ? one : (many || `${one}s`)}`;
  const uniq = (list) => [...new Set(list)];
  const lower = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
  const nextVersionNumber = (s) => Math.max(...s.split.versions.map((v) => v.number)) + 1;
  const versionByNumber = (s, n) => s.split.versions.find((v) => v.number === n) || null;
  const longDate = (ts) => new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const sessionLimit = (s) => (s.profile && s.profile.sessionMinutes) || 60;
  const muscleName = (id) => M.muscleById(id).name;
  const weekdayIndex = (day) => (day.weekday == null ? 99 : WEEK_ORDER.indexOf(day.weekday));
  const sortedDays = (def) => def.days.slice().sort((a, b) => weekdayIndex(a) - weekdayIndex(b));

  function restText(sec) {
    const m = Math.floor(sec / 60);
    const r = sec % 60;
    if (!m) return `${r} s rest`;
    return r ? `${m} min ${r} s rest` : `${m} min rest`;
  }
  /* "3 sets of 8–12, 2 reps in reserve, 2 min rest" */
  const prescription = (it) => `${plural(it.sets, 'set')} of ${it.repMin}–${it.repMax}, ${plural(it.rir, 'rep')} in reserve, ${restText(it.restS)}`;
  const repsLine = (it) => `${it.repMin}–${it.repMax} reps, ${plural(it.rir, 'rep')} in reserve`;

  /* Which muscles one hard set is credited to (1 for the main muscle, half for helpers). */
  function creditLine(exerciseId) {
    const credit = Object.entries(M.exerciseById(exerciseId).credit);
    const main = credit.filter(([, c]) => c >= 1).map(([m]) => muscleName(m).toLowerCase());
    const help = credit.filter(([, c]) => c < 1).map(([m]) => muscleName(m).toLowerCase());
    return `Counts for ${M.listJoin(main)}${help.length ? `, and half for ${M.listJoin(help)}` : ''}.`;
  }

  const dayRegions = (day) => uniq(day.items.map((it) => M.exerciseById(it.exercise).region));
  /* The body region a session mostly loads (core work rides along with either). */
  function mainRegion(day) {
    const sets = {};
    day.items.forEach((it) => {
      const r = M.exerciseById(it.exercise).region;
      if (r !== 'core') sets[r] = (sets[r] || 0) + it.sets;
    });
    return Object.keys(sets).sort((a, b) => sets[b] - sets[a])[0] || 'core';
  }

  /* Minutes per day that change between two definitions, for VolumeCard. */
  function minuteChanges(before, after, limit) {
    return after.days.map((d) => {
      const prev = before.days.find((x) => x.key === d.key);
      return { dayKey: d.key, label: d.label, before: prev ? M.dayMinutes(prev) : 0, after: M.dayMinutes(d), limit };
    }).filter((m) => m.before !== m.after);
  }

  /* ---------------------------------------------------- recommendations */
  const EXTRA_LABELS = { blocked_constraints: 'Didn’t fit', not_understood: 'Not understood', user_edit: 'Your edit' };
  function RecBadge({ status }) {
    const known = C.palettes.recommendation[status];
    return html`<${Badge} palette="recommendation" status=${status} label=${known ? undefined : (EXTRA_LABELS[status] || status)} />`;
  }

  const isFromReview = (rec) => rec.trigger === 'split_review' || !!(rec.intent && rec.intent.source === 'split_review');
  function quoted(text) {
    const t = String(text).trim();
    return `“${/[.?!]$/.test(t) ? t : `${t}.`}”`;
  }
  function originLine(rec) {
    if (isFromReview(rec)) return 'From your split review';
    if (rec.requestText) return `From your request: ${quoted(rec.requestText)}`;
    return rec.intent && rec.intent.summary ? `From your request: ${rec.intent.summary}` : 'From your request';
  }
  /* Only sources the gate still accepts are ever shown (docs/06 §6.6). */
  const shownSources = (rec) => (rec.sourceIds || []).map(M.sourceById).filter(Boolean).filter(M.isVerified);
  const verifiedStudies = (n) => `${n} verified ${n === 1 ? 'study' : 'studies'}`;

  /* The split review's "Ask for more <muscle> work": straight through the gate. */
  function reviewIntent(muscle) {
    return { type: 'develop_muscle', muscle, source: 'split_review', summary: `Build your ${muscleName(muscle).toLowerCase()}.` };
  }
  function askFromReview(muscle, how) {
    const draft = M.evaluateChange(reviewIntent(muscle), C.getState());
    const id = A.createRecommendation(draft, { trigger: 'split_review' });
    (how === 'replace' ? A.replace : A.push)('recommendation', { id });
  }
  /* Run the same request again against the current split. */
  function askAgain(rec, ctx) {
    if (isFromReview(rec) && rec.intent && rec.intent.muscle) {
      askFromReview(rec.intent.muscle, 'replace');
      return;
    }
    const params = { text: rec.requestText || '' };
    if (ctx.inModal) A.replace('change-request', params);
    else A.present('change-request', params, 'sheet');
  }
  function editMyself(ctx) {
    if (ctx.inModal) A.replace('split-edit', {});
    else A.present('split-edit', {}, 'sheet');
  }

  /* Debug and smoke-test samples (CompanionDebug.show only): each one runs the
     real gate. "safety" and "constraints" evaluate against a sample profile
     without changing the stored one. */
  function makeDemo(kind) {
    const st = C.getState();
    const ask = (text, stateForGate) => {
      const draft = M.evaluateChange(M.parseIntent(text), stateForGate || C.getState(), { requestText: text });
      return A.createRecommendation(draft, { trigger: 'user_request', requestText: text });
    };
    switch (kind) {
      case 'proposed': return ask('I want a bigger back');
      case 'review': {
        const id = A.createRecommendation(M.evaluateChange(reviewIntent('side_delts'), st), { trigger: 'split_review' });
        return id;
      }
      case 'accepted': {
        const id = ask('Wider shoulders');
        A.acceptRecommendation(id);
        return id;
      }
      case 'declined': {
        const id = ask('Bigger arms');
        A.rejectRecommendation(id);
        return id;
      }
      case 'chest': return ask('A bigger chest');
      case 'strength': return ask('Make me stronger');
      case 'safety': return ask('I want a bigger back', { ...st, profile: { ...st.profile, safetyFlags: ['injury_reported'], injuryRegions: ['upper'] } });
      case 'constraints': return ask('I want a bigger back', { ...st, profile: { ...st.profile, sessionMinutes: 40 } });
      default: return null;
    }
  }

  /* "You asked" card with the status word and date (mockup: Not enough evidence). */
  function YouAsked({ rec }) {
    const text = rec.requestText || (rec.intent && rec.intent.summary) || rec.title || 'A change to your split';
    return html`<${Card}>
      <${Caption}>${isFromReview(rec) ? 'You asked, from your split review' : 'You asked'}<//>
      <${T} size="body" as="p">${text}<//>
      <${CardFooter}>
        <${RecBadge} status=${rec.status} />
        <${Caption}>${M.fmt.relativeDay(rec.createdAt)}<//>
      <//>
    <//>`;
  }

  function ChangesSection({ title, proposal }) {
    if (!proposal || !proposal.ops) return null;
    const hasVolume = (proposal.deltas && proposal.deltas.length) || (proposal.minutes && proposal.minutes.length);
    return html`<${Section} title=${title}>
      <${DiffCard} ops=${proposal.ops} />
      ${hasVolume ? html`<${VolumeCard} deltas=${proposal.deltas || []} minutes=${proposal.minutes} />` : null}
    <//>`;
  }

  function EvidenceSection({ rec, caption }) {
    const claim = M.claimByKey(rec.claimKey);
    const sources = shownSources(rec);
    if (!claim && !sources.length) return null;
    return html`<${Section} title="Evidence" caption=${caption}>
      ${claim ? html`<${ClaimCard} claim=${claim} verifiedCount=${rec.verifiedCount} required=${rec.required || M.REQUIRED_SOURCES} />` : null}
      ${sources.map((src) => html`<${CitationCard} key=${src.id} source=${src} />`)}
    <//>`;
  }

  /* What the library holds for a blocked request. Unverified sources are never listed. */
  function EvidenceStatus({ rec }) {
    const claim = rec.claimKey ? M.claimByKey(rec.claimKey) : null;
    if (!claim) return null;
    const required = rec.required || M.REQUIRED_SOURCES;
    const verified = M.verifiedSourcesFor(claim);
    if (claim.status !== 'active') {
      return html`<${Card}>
        <${Caption}>What we’d need evidence for<//>
        <${T} size="callout" as="p">${claim.statement}<//>
        <div className="row hairline-top">
          <${Glyph} name="checkmark.seal.fill" size=${18} color="inkMuted48" />
          <${T} size="caption" color="inkMuted80">${`Evidence status: ${claim.status}. ${verified.length} of ${required} studies verified.`}<//>
        </div>
      <//>`;
    }
    const scope = claim.appliesTo && claim.appliesTo.maxStartingSets
      ? ` It covers muscles starting under about ${claim.appliesTo.maxStartingSets} weekly sets.` : '';
    return html`<${Section} title="What the evidence covers" caption=${`This is the closest claim we have verified studies for.${scope}`}>
      <${ClaimCard} claim=${claim} verifiedCount=${verified.length} required=${required} />
      ${verified.map((src) => html`<${CitationCard} key=${src.id} source=${src} />`)}
    <//>`;
  }

  function ProposedView({ s, rec, ctx }) {
    const next = nextVersionNumber(s);
    const stale = rec.fromVersion != null && rec.fromVersion !== s.split.current;
    const apply = () => {
      const res = A.acceptRecommendation(rec.id);
      if (res.ok) {
        A.toast(`Your split is now version ${res.version}`, 'success');
        A.dismissAll();
        A.openIn('training', 'training');
        return;
      }
      if (res.reason === 'superseded') {
        A.alert({
          title: 'Your split has changed',
          message: `You saved version ${C.getState().split.current} after we made this suggestion, so it no longer fits and nothing changed. Ask again and we’ll check your current split.`,
          buttons: [{ label: 'Not now', style: 'cancel' }, { label: 'Ask again', onPress: () => askAgain(rec, ctx) }]
        });
      } else if (res.reason === 'gate_failed') {
        A.alert({
          title: 'We withdrew this suggestion',
          message: `It no longer has ${verifiedStudies(M.REQUIRED_SOURCES)} behind it, so we haven’t changed your plan.`,
          buttons: [{ label: 'Close', style: 'cancel' }]
        });
      } else {
        A.toast('This suggestion was already decided');
      }
    };
    const confirm = () => A.alert({
      title: 'Apply this change?',
      message: `Your split moves to version ${next}. You can go back to version ${s.split.current} from History.`,
      buttons: [{ label: 'Cancel', style: 'cancel' }, { label: 'Apply', onPress: apply }]
    });
    const decline = () => {
      A.rejectRecommendation(rec.id);
      A.toast('Suggestion declined');
      A.pop();
    };
    const subtitle = stale ? `${s.split.name}, made for version ${rec.fromVersion}` : `${s.split.name}, version ${s.split.current} to ${next}`;
    return html`<${Screen} title="Suggested change" subtitle=${subtitle}>
      <${Sections}>
        <div className="stack-sm">
          <div className="row"><${RecBadge} status="proposed" /></div>
          <${Callout}>${originLine(rec)}<//>
          ${stale ? html`<${Caption}>${`You saved version ${s.split.current} after we made this, so it may no longer fit. Applying it checks again.`}<//>` : null}
        </div>
        <${ChangesSection} title="What changes" proposal=${rec.proposal} />
        <${Section} title="Why we suggest it"><${DriversList} drivers=${rec.drivers || []} /><//>
        <${EvidenceSection} rec=${rec} caption=${`We only suggest a change when at least ${verifiedStudies(M.REQUIRED_SOURCES)} support it.`} />
        <div className="stack">
          <${DisclaimerBand} />
          <${Actions}>
            <${Button} fullWidth=${true} label="Apply change" onPress=${confirm} />
            <${Button} fullWidth=${true} variant="ghost" label="Decline" onPress=${decline} />
          <//>
        </div>
      <//>
    <//>`;
  }

  function AcceptedView({ s, rec }) {
    const to = rec.toVersion;
    const when = rec.decidedAt ? longDate(rec.decidedAt) : 'an earlier date';
    const line = to === s.split.current ? `Applied on ${when}. Your split is now version ${to}.` : `Applied on ${when}. It became version ${to}; your split is now version ${s.split.current}.`;
    return html`<${Screen} title="Applied change" subtitle=${`${s.split.name}, version ${rec.fromVersion} to ${to}`}>
      <${Sections}>
        <div className="stack-sm">
          <div className="row"><${RecBadge} status="accepted" /></div>
          <${Callout}>${line}<//>
          <${Caption}>${originLine(rec)}<//>
          ${to != null ? html`<${LinkButton} align="flex-start" label=${`See version ${to}`} onPress=${() => A.push('split-version', { number: to })} />` : null}
        </div>
        <${ChangesSection} title="What changed" proposal=${rec.proposal} />
        <${Section} title="Why we suggested it"><${DriversList} drivers=${rec.drivers || []} /><//>
        <${EvidenceSection} rec=${rec} caption="The claim and studies as we showed them when you applied this." />
        <${DisclaimerBand} />
      <//>
    <//>`;
  }

  /* Blocked answers: the EmptyState layout, never an error (docs/08 §8.11). */
  function BlockedView({ s, rec, ctx }) {
    const keep = html`<${Button} fullWidth=${true} variant="outline" label="Keep my current split" onPress=${() => A.pop()} />`;
    const own = 'Your own edits are always yours to make. We’ll label them “Your edit” in History.';
    let answer;
    let actions;
    let caption = own;
    let evidence = null;
    if (rec.status === 'blocked_safety') {
      answer = html`<${EmptyAnswer} icon="exclamationmark.triangle" title="Paused for your safety" body=${rec.reason} />`;
      actions = html`<${Button} fullWidth=${true} label="Update your health details" onPress=${() => A.push('profile')} />${keep}`;
      caption = 'If something hurts, or you have a medical condition, a qualified professional such as a doctor or physiotherapist can tell you what’s safe to train.';
    } else if (rec.status === 'blocked_constraints') {
      answer = html`<${EmptyAnswer} icon="info.circle" title="No room in your sessions" body=${rec.reason} />`;
      actions = html`
        <${Button} fullWidth=${true} label="Edit my split myself" onPress=${() => editMyself(ctx)} />
        <${Button} fullWidth=${true} variant="outline" label="Change your session length" onPress=${() => A.push('profile')} />`;
      caption = `Your sessions are set to ${sessionLimit(s)} minutes. ${own}`;
    } else {
      answer = html`<${EmptyAnswer} icon="magnifyingglass" title="Not enough evidence yet" body=${rec.reason || 'We couldn’t verify enough studies for this change, so we haven’t changed your plan.'} />`;
      actions = html`<${Button} fullWidth=${true} label="Edit my split myself" onPress=${() => editMyself(ctx)} />${keep}`;
      evidence = html`<${EvidenceStatus} rec=${rec} />`;
    }
    return html`<${Screen} title="Your request" subtitle="Your split is unchanged">
      <div className="stack">
        <${YouAsked} rec=${rec} />
        ${answer}
        <div className="stack-sm">${actions}</div>
        <${Caption}>${caption}<//>
        ${evidence ? html`<div className="actions">${evidence}</div>` : null}
        <${DisclaimerBand} />
      </div>
    <//>`;
  }

  /* Declined, replaced and withdrawn suggestions: what happened and what next. */
  function ClosedView({ s, rec, ctx }) {
    const when = rec.decidedAt ? longDate(rec.decidedAt) : null;
    let line;
    let primary;
    let showEvidence = true;
    if (rec.status === 'rejected') {
      line = `You declined this${when ? ` on ${when}` : ''}. Nothing in your split changed.`;
      primary = html`<${Button} fullWidth=${true} label="Ask again" onPress=${() => askAgain(rec, ctx)} />`;
    } else if (rec.status === 'superseded') {
      line = 'Your split changed after we made this suggestion, so we didn’t apply it. Nothing changed. Ask again and we’ll check your current split.';
      primary = html`<${Button} fullWidth=${true} label="Ask again" onPress=${() => askAgain(rec, ctx)} />`;
    } else if (rec.status === 'withdrawn') {
      line = `It no longer had ${verifiedStudies(M.REQUIRED_SOURCES)} behind it, so we withdrew it. Nothing in your split changed.`;
      primary = html`<${Button} fullWidth=${true} label="Edit my split myself" onPress=${() => editMyself(ctx)} />`;
      showEvidence = false;
    } else {
      line = rec.reason || 'Nothing in your split changed.';
      primary = html`<${Button} fullWidth=${true} label="Ask for a change" onPress=${() => askAgain(rec, ctx)} />`;
    }
    return html`<${Screen} title="Suggested change" subtitle="Your split is unchanged">
      <${Sections}>
        <div className="stack-sm">
          <div className="row"><${RecBadge} status=${rec.status} /></div>
          <${Callout}>${line}<//>
          <${Caption}>${originLine(rec)}<//>
        </div>
        <${ChangesSection} title="What it would have changed" proposal=${rec.proposal} />
        ${rec.drivers ? html`<${Section} title="Why we suggested it"><${DriversList} drivers=${rec.drivers} /><//>` : null}
        ${showEvidence ? html`<${EvidenceSection} rec=${rec} caption="The claim and studies as we showed them." />` : null}
        <div className="stack">
          <${Actions}>${primary}<//>
          <${DisclaimerBand} />
        </div>
      <//>
    <//>`;
  }

  function Recommendation({ params }) {
    const s = C.useApp();
    const ctx = useScreen();
    const rec = params.id ? S.recommendation(s, params.id) : null;
    useEffect(() => {
      if (!rec && params.demo) {
        const id = makeDemo(params.demo);
        if (id) A.replace('recommendation', { id });
      }
    }, []);
    if (!rec) {
      return html`<${Screen} title="Suggestion">
        <${EmptyAnswer} icon="magnifyingglass" title=${params.demo ? 'Preparing the sample' : 'We couldn’t find this suggestion'}
          body=${params.demo ? null : 'It may have been cleared when the sample data was reset.'} />
      <//>`;
    }
    if (rec.status === 'proposed') return html`<${ProposedView} s=${s} rec=${rec} ctx=${ctx} />`;
    if (rec.status === 'accepted') return html`<${AcceptedView} s=${s} rec=${rec} />`;
    if (/^blocked_/.test(rec.status)) return html`<${BlockedView} s=${s} rec=${rec} ctx=${ctx} />`;
    return html`<${ClosedView} s=${s} rec=${rec} ctx=${ctx} />`;
  }

  /* ------------------------------------------------------ training root */
  function SuggestionCard({ s, rec }) {
    const n = shownSources(rec).length;
    const stale = rec.fromVersion != null && rec.fromVersion !== s.split.current;
    return html`<${Card} onPress=${() => A.push('recommendation', { id: rec.id })}>
      <div className="row"><${RecBadge} status="proposed" /></div>
      <${CardTitle}>${rec.title}<//>
      <${Callout}>${`${isFromReview(rec) ? 'From your split review' : 'From your request'}, backed by ${verifiedStudies(n)}.`}<//>
      <${CardFooter}>
        <${Caption}>${stale ? `Made for version ${rec.fromVersion}` : `Version ${s.split.current} to ${nextVersionNumber(s)}`}<//>
        <${Glyph} name="chevron.right" size=${18} color="inkMuted48" />
      <//>
    <//>`;
  }

  function Training() {
    const s = C.useApp();
    const def = S.currentDefinition(s);
    const days = sortedDays(def);
    const vol = M.weeklyVolume(def);
    const review = M.reviewSplit(def, s.profile);
    const pending = s.recommendations.filter((r) => r.status === 'proposed');
    const trainingDays = new Set(def.days.map((d) => d.weekday).filter((w) => w != null));
    const rest = WEEK_ORDER.filter((w) => !trainingDays.has(w)).map((w) => M.fmt.weekday(w));
    const groups = uniq(D.MUSCLES.map((m) => m.group));
    const muscles = D.MUSCLES.slice().sort((a, b) => groups.indexOf(a.group) - groups.indexOf(b.group));
    const findings = review.findings.length;
    const startWorkout = () => A.sheet({
      title: 'Which workout are you starting?',
      options: days.map((d) => ({ label: M.dayLabelWithWeekday(d), onPress: () => A.present('workout', { dayKey: d.key }, 'sheet') }))
    });
    return html`<${Screen} title="Training" subtitle=${`${s.split.name}, version ${s.split.current}`}>
      <${Sections}>
        ${pending.length ? html`<${Section} title="Suggested changes">
          <div className="stack-sm">${pending.map((rec) => html`<${SuggestionCard} key=${rec.id} s=${s} rec=${rec} />`)}</div>
        <//>` : null}

        <${Section} title="Your split">
          <${Rows} rows=${days.map((d) => ({
            key: d.key,
            label: M.dayLabelWithWeekday(d),
            detail: `${plural(d.items.length, 'exercise')}, about ${M.dayMinutes(d)} min`,
            onPress: () => A.push('split-day', { dayKey: d.key })
          }))} />
          <${Caption}>${rest.length ? `Rest days: ${M.listJoin(rest)}.` : 'No rest days in this split.'}<//>
          <${LinkButton} align="flex-start" label=${`What changed in version ${s.split.current}`}
            onPress=${() => A.push('split-version', { number: s.split.current })} />
        <//>

        <${Section} title="Weekly sets per muscle" caption="Hard sets per week. A set counts fully for its main muscle and half for muscles that help.">
          <${Card}>
            <${Facts} rows=${muscles.map((m) => [m.name, M.fmt.sets(vol[m.id])])} />
          <//>
        <//>

        <${Section} title="Review">
          <${Card} onPress=${() => A.push('split-review')}>
            <${CardTitle}>${findings ? `${plural(findings, 'finding')} about your plan` : 'Nothing stands out in your plan'}<//>
            ${findings ? html`<${Callout}>${`${review.findings.map((f) => f.title).join('. ')}.`}<//>` : null}
            <${CardFooter}>
              <${Caption}>Facts about your plan, not instructions<//>
              <${Glyph} name="chevron.right" size=${18} color="inkMuted48" />
            <//>
          <//>
        <//>

        <${Actions}>
          <${Button} fullWidth=${true} label="Ask for a change" onPress=${() => A.present('change-request', {}, 'sheet')} />
          <${Button} fullWidth=${true} variant="outline" label="Edit split" onPress=${() => A.present('split-edit', {}, 'sheet')} />
          <${Button} fullWidth=${true} variant="outline" label="Start a workout" onPress=${startWorkout} />
        <//>
      <//>
    <//>`;
  }

  /* ------------------------------------------------------------ split day */
  function ExerciseList({ items }) {
    return html`<div className="ads-group" role="list">
      ${items.map((it) => html`<div key=${it.exercise} role="listitem" className="ads-group__row">
        <div className="grow stack-xxs">
          <${T} size="body">${M.exerciseById(it.exercise).name}<//>
          <${T} size="caption" color="inkMuted80">${prescription(it)}<//>
          <${T} size="caption" color="inkMuted48">${creditLine(it.exercise)}<//>
        </div>
      </div>`)}
    </div>`;
  }

  function SplitDay({ params }) {
    const s = C.useApp();
    const def = S.currentDefinition(s);
    const day = def.days.find((d) => d.key === params.dayKey);
    if (!day) {
      return html`<${Screen} title="Training day">
        <${EmptyAnswer} icon="dumbbell" title="This day isn’t in your split" body=${`Version ${s.split.current} of your split doesn’t have it.`} />
      <//>`;
    }
    const minutes = M.dayMinutes(day);
    const totalSets = day.items.reduce((acc, it) => acc + it.sets, 0);
    const subtitle = day.weekday != null ? `${M.fmt.weekday(day.weekday)}, about ${minutes} min` : `About ${minutes} min`;
    return html`<${Screen} title=${day.label} subtitle=${subtitle}>
      <${Sections}>
        <${Section} title="Exercises" caption=${`${plural(day.items.length, 'exercise')} and ${plural(totalSets, 'hard set')}. Times include a warm-up, each set and its rest.`}>
          <${ExerciseList} items=${day.items} />
        <//>
        <${Actions}>
          <${Button} fullWidth=${true} label="Start this workout" onPress=${() => A.present('workout', { dayKey: day.key }, 'sheet')} />
          <${Button} fullWidth=${true} variant="outline" label="Edit this day" onPress=${() => A.present('split-edit', { dayKey: day.key }, 'sheet')} />
        <//>
      <//>
    <//>`;
  }

  /* --------------------------------------------------------- split review */
  function FindingCard({ f, vol }) {
    return html`<${Card}>
      <${CardTitle}>${f.title}<//>
      <${Callout}>${f.detail}<//>
      ${f.code === 'low_volume' ? html`<div className="stack-sm hairline-top">
        <${Caption}>Ask for more work on one of these and we’ll check the evidence before suggesting anything.<//>
        ${f.muscles.map((m, i) => html`<div key=${m} className=${'stack-xxs' + (i ? ' hairline-top' : '')}>
          <${T} size="callout" className="tabular">${`${muscleName(m)}, ${M.fmt.sets(vol[m])} weekly sets`}<//>
          <${LinkButton} align="flex-start" label=${`Ask for more ${muscleName(m).toLowerCase()} work`} onPress=${() => askFromReview(m)} />
        </div>`)}
      </div>` : null}
    <//>`;
  }

  function SplitReview() {
    const s = C.useApp();
    const def = S.currentDefinition(s);
    const review = M.reviewSplit(def, s.profile);
    return html`<${Screen} title="Split review" subtitle="Facts about your plan">
      <${Sections}>
        <div className="stack-sm">
          <${Callout}>${`These findings describe version ${s.split.current} of your split as it is. They aren’t instructions.`}<//>
          <${Caption}>${`A suggestion only appears when ${verifiedStudies(M.REQUIRED_SOURCES)} support it.`}<//>
        </div>
        <div className="stack">
          ${review.findings.length
            ? review.findings.map((f, i) => html`<${FindingCard} key=${f.code + i} f=${f} vol=${review.volume} />`)
            : html`<${Card}>
                <${CardTitle}>Nothing stands out<//>
                <${Callout}>Every muscle gets some work, and each session fits your time limit.<//>
              <//>`}
        </div>
        <${Section} title="Session length" caption=${`Your limit is ${sessionLimit(s)} minutes. Times include a warm-up, each set and its rest.`}>
          <${Card}>
            <${Facts} rows=${sortedDays(def).map((d) => [M.dayLabelWithWeekday(d), `${review.minutes[d.key]} min`])} />
          <//>
        <//>
      <//>
    <//>`;
  }

  /* ------------------------------------------------------- change request */
  const EXAMPLES = ['A bigger back', 'Wider shoulders', 'Get stronger', 'Add running', 'Remove cable fly'];

  function ChangeRequest({ params }) {
    const [text, setText] = useState(params.text || '');
    const [error, setError] = useState(null);
    const [intent, setIntent] = useState(null);
    const [checking, setChecking] = useState(false);
    const timer = useRef(null);
    useEffect(() => () => clearTimeout(timer.current), []);

    const edit = (value) => {
      setText(value);
      setError(null);
    };
    const next = () => {
      const parsed = M.parseIntent(text);
      if (parsed.type === 'unknown') {
        setError(NOT_UNDERSTOOD);
        return;
      }
      setIntent(parsed);
    };
    const route = (draft, requestText) => {
      if (draft.status === 'user_edit') {
        A.replace('split-edit', { removeExercise: intent.exercise });
        return;
      }
      if (draft.status === 'not_understood') {
        setChecking(false);
        setIntent(null);
        setError(NOT_UNDERSTOOD);
        return;
      }
      const id = A.createRecommendation(draft, { trigger: 'user_request', requestText });
      A.replace('recommendation', { id });
    };
    const confirm = () => {
      const requestText = text.trim();
      /* Removing an exercise is the person's own edit: no evidence check. */
      if (intent.type === 'remove_exercise') {
        route(M.evaluateChange(intent, C.getState(), { requestText }), requestText);
        return;
      }
      setChecking(true);
      timer.current = setTimeout(() => route(M.evaluateChange(intent, C.getState(), { requestText }), requestText), 800);
    };
    const cancel = html`<${LinkButton} label="Cancel" onPress=${A.dismiss} />`;

    if (!intent) {
      return html`<${PlainScreen} title="What would you like to change?" subtitle="Describe it in your own words." topLeft=${cancel}
        footer=${html`<${Button} fullWidth=${true} label="Continue" disabled=${!text.trim()} onPress=${next} />`}>
        <${Input} label="Your request" value=${text} placeholder="For example, build my back" error=${error}
          onChange=${(e) => edit(e.target.value)} />
        <div className="stack-sm">
          <${Caption}>Or start from an example<//>
          <${ChoiceChips} label="Examples" value=${text} onChange=${edit}
            options=${EXAMPLES.map((x) => ({ value: x, label: x }))} />
        </div>
        <${Caption}>${`We only suggest a change when ${verifiedStudies(M.REQUIRED_SOURCES)} support it. If they don’t, we say so and your split stays as it is.`}<//>
      <//>`;
    }
    const removal = intent.type === 'remove_exercise';
    return html`<${PlainScreen} title="What would you like to change?" subtitle="Check we understood you before we look at the evidence." topLeft=${cancel}
      footer=${html`
        <${Button} fullWidth=${true} label="That’s right" loading=${checking} onPress=${confirm} />
        <${Button} fullWidth=${true} variant="ghost" label="Change my request" disabled=${checking} onPress=${() => setIntent(null)} />`}>
      <${Card}>
        <${CardTitle}>Here’s what we understood<//>
        <${Body}>${intent.summary}<//>
        <${Caption}>${`From ${quoted(text)}`}<//>
      <//>
      <${Caption}>In the app, Claude reads your request. Here, a simpler parser stands in.<//>
      ${removal ? html`<${Callout}>Removing an exercise is your own edit, so it doesn’t need evidence. We’ll open the editor with it removed.<//>` : null}
      <div aria-live="polite">${checking ? html`<${Callout}>Checking the evidence<//>` : null}</div>
    <//>`;
  }

  /* ----------------------------------------------------------- split edit */
  function EditItems({ day, onSets, onRemove }) {
    if (!day.items.length) return html`<${Caption}>No exercises on this day yet. Add one below.<//>`;
    return html`<div className="ads-group" role="list">
      ${day.items.map((it) => {
        const name = M.exerciseById(it.exercise).name;
        return html`<div key=${it.exercise} role="listitem" className="ads-group__row row--stacked">
          <div className="row row--between row--top">
            <div className="grow stack-xxs">
              <${T} size="body">${name}<//>
              <${T} size="caption" color="inkMuted80">${repsLine(it)}<//>
            </div>
            <${IconButton} name="trash" label=${`Remove ${name}`} onPress=${() => onRemove(it.exercise)} />
          </div>
          <div className="row row--between">
            <${T} size="callout" color="inkMuted80">Sets<//>
            <${Stepper} label=${`sets for ${name}`} value=${it.sets} min=${1} max=${10} onChange=${(v) => onSets(it.exercise, v)} />
          </div>
        </div>`;
      })}
    </div>`;
  }

  function SplitEdit({ params }) {
    const s = C.useApp();
    const [base] = useState(() => S.currentDefinition(C.getState()));
    const [baseNumber] = useState(() => C.getState().split.current);
    const removeId = params.removeExercise || null;
    const removedFrom = removeId ? base.days.filter((d) => d.items.some((it) => it.exercise === removeId)) : [];
    const [draft, setDraft] = useState(() => {
      const d = D.clone(base);
      if (removeId) d.days.forEach((day) => { day.items = day.items.filter((it) => it.exercise !== removeId); });
      return d;
    });
    const [dayKey, setDayKey] = useState(() => {
      if (params.dayKey && base.days.some((d) => d.key === params.dayKey)) return params.dayKey;
      if (removedFrom.length) return removedFrom[0].key;
      return sortedDays(base)[0].key;
    });
    const [note, setNote] = useState('');
    const [showAdd, setShowAdd] = useState(false);

    const day = draft.days.find((d) => d.key === dayKey);
    const baseDay = base.days.find((d) => d.key === dayKey);
    const update = (fn) => setDraft((prev) => {
      const next = D.clone(prev);
      fn(next.days.find((d) => d.key === dayKey));
      return next;
    });
    const setSets = (exId, sets) => update((d) => { d.items.find((it) => it.exercise === exId).sets = sets; });
    const remove = (exId) => update((d) => { d.items = d.items.filter((it) => it.exercise !== exId); });
    const add = (exId) => {
      update((d) => {
        const original = baseDay.items.find((it) => it.exercise === exId);
        d.items.push(original ? D.clone(original) : { exercise: exId, ...NEW_ITEM });
      });
      setShowAdd(false);
    };
    const pickDay = (key) => {
      setDayKey(key);
      setShowAdd(false);
    };

    const equipment = (s.profile && s.profile.equipment) || D.EQUIPMENT;
    const regions = uniq([...dayRegions(baseDay), ...dayRegions(day)]);
    const candidates = D.EXERCISES.filter((ex) => regions.includes(ex.region)
      && ex.equipment.every((e) => equipment.includes(e))
      && !day.items.some((it) => it.exercise === ex.id));

    const ops = M.diffDefinitions(base, draft);
    const deltas = M.volumeDeltas(base, draft);
    const minutes = minuteChanges(base, draft, sessionLimit(s));
    const next = nextVersionNumber(s);
    const summary = M.summarizeOps(ops);

    const save = () => {
      const n = A.saveSplitEdit(draft, note.trim() || summary);
      A.toast(`Saved version ${n}`, 'success');
      A.dismiss();
    };
    const cancel = () => {
      if (!ops.length) {
        A.dismiss();
        return;
      }
      A.alert({
        title: 'Discard your changes?',
        message: `Your split stays at version ${baseNumber}.`,
        buttons: [{ label: 'Keep editing', style: 'cancel' }, { label: 'Discard', style: 'destructive', onPress: A.dismiss }]
      });
    };

    const removedName = removeId && M.exerciseById(removeId) ? M.exerciseById(removeId).name : null;
    return html`<${PlainScreen} title="Edit your split" subtitle=${`Changes save as a new version. Version ${baseNumber} stays in your history.`}
      topLeft=${html`<${LinkButton} label="Cancel" onPress=${cancel} />`}
      footer=${html`
        <${Caption}>This is your own edit, so it doesn’t need evidence. We’ll label it “Your edit” in History.<//>
        <${Button} fullWidth=${true} label=${`Save as version ${next}`} disabled=${!ops.length} onPress=${save} />`}>
      ${removedName ? html`<${Callout}>${removedFrom.length
        ? `We removed ${removedName.toLowerCase()} from ${M.listJoin(removedFrom.map((d) => d.label))}. Check the change below, then save.`
        : `${removedName} isn’t in your split, so there’s nothing to remove.`}<//>` : null}
      <div className="stack-sm">
        <${ChoiceChips} label="Day" value=${dayKey} onChange=${pickDay}
          options=${sortedDays(base).map((d) => ({ value: d.key, label: d.label }))} />
        <${Caption}>${`${M.dayLabelWithWeekday(day)}, about ${M.dayMinutes(day)} min. Your limit is ${sessionLimit(s)}.`}<//>
      </div>
      <${EditItems} day=${day} onSets=${setSets} onRemove=${remove} />

      <${Section} title="Add an exercise" caption="From the catalogue, for this day’s body area and your equipment.">
        ${!candidates.length
          ? html`<${Caption}>Every exercise that fits this day and your equipment is already in it.<//>`
          : !showAdd
            ? html`<${LinkButton} align="flex-start" icon="plus" label=${`Choose from ${plural(candidates.length, 'exercise')}`} onPress=${() => setShowAdd(true)} />`
            : html`<${Rows} rows=${candidates.map((ex) => {
              const original = baseDay.items.find((it) => it.exercise === ex.id);
              return {
                key: ex.id, label: ex.name, icon: 'plus', chevron: false,
                detail: original ? `Put back: ${plural(original.sets, 'set')} of ${original.repMin}–${original.repMax}` : `Adds ${plural(NEW_ITEM.sets, 'set')} of ${NEW_ITEM.repMin}–${NEW_ITEM.repMax}. ${creditLine(ex.id)}`,
                onPress: () => add(ex.id)
              };
            })} />
            <${LinkButton} align="flex-start" label="Hide the list" onPress=${() => setShowAdd(false)} />`}
      <//>

      <${Section} title="What changes" caption=${ops.length ? `Compared with version ${baseNumber}.` : null}>
        ${ops.length
          ? html`<${DiffCard} ops=${ops} />
              ${deltas.length || minutes.length ? html`<${VolumeCard} deltas=${deltas} minutes=${minutes} />` : null}`
          : html`<${Caption}>Nothing has changed yet.<//>`}
      <//>

      <${Input} label="Note (optional)" value=${note} placeholder=${ops.length ? summary : 'What changed and why'}
        onChange=${(e) => setNote(e.target.value)} />
    <//>`;
  }

  /* -------------------------------------------------------- split version */
  function SplitVersion({ params }) {
    const s = C.useApp();
    const n = Number(params.number);
    const v = versionByNumber(s, n);
    if (!v) {
      return html`<${Screen} title="Split version">
        <${EmptyAnswer} icon="clock.arrow.circlepath" title="We couldn’t find this version" body=${`Your split has versions 1 to ${nextVersionNumber(s) - 1}.`} />
      <//>`;
    }
    const prev = s.split.versions.filter((x) => x.number < n).sort((a, b) => b.number - a.number)[0] || null;
    const ops = prev ? M.diffDefinitions(prev.definition, v.definition) : [];
    const deltas = prev ? M.volumeDeltas(prev.definition, v.definition) : [];
    const minutes = prev ? minuteChanges(prev.definition, v.definition, sessionLimit(s)) : [];
    const isCurrent = s.split.current === n;
    const goBack = () => A.alert({
      title: `Go back to version ${n}?`,
      message: `We’ll save a copy of it as version ${nextVersionNumber(s)}. Version ${s.split.current} stays in your history.`,
      buttons: [{ label: 'Cancel', style: 'cancel' }, {
        label: 'Go back',
        onPress: () => {
          const num = A.revertToVersion(n);
          if (num == null) return;
          A.toast(`Went back to version ${n}`, 'success');
          A.replace('split-version', { number: num });
        }
      }]
    });
    return html`<${Screen} title=${`Version ${n}`} subtitle=${longDate(v.createdAt)}>
      <${Sections}>
        <div className="stack-sm">
          <div className="row"><${Badge} palette="splitOrigin" status=${v.origin} /></div>
          <${Body}>${v.note}<//>
          <${Caption}>${isCurrent ? 'This is your current version.' : `Your current version is ${s.split.current}.`}<//>
          ${v.origin === 'app_recommendation' && v.recommendationId
            ? html`<${LinkButton} align="flex-start" label="See the suggestion and its evidence" onPress=${() => A.push('recommendation', { id: v.recommendationId })} />`
            : null}
        </div>

        <${Section} title="What changed" caption=${prev ? `Compared with version ${prev.number}.` : null}
          action=${prev ? html`<${LinkButton} size="caption" label=${`See version ${prev.number}`} onPress=${() => A.push('split-version', { number: prev.number })} />` : null}>
          ${!prev
            ? html`<${Callout}>This is where your history starts.<//>`
            : ops.length
              ? html`<${DiffCard} ops=${ops} />
                  ${deltas.length || minutes.length ? html`<${VolumeCard} deltas=${deltas} minutes=${minutes} />` : null}`
              : html`<${Callout}>${`Same exercises and sets as version ${prev.number}.`}<//>`}
        <//>

        <${Section} title="The split">
          <${Rows} rows=${sortedDays(v.definition).map((d) => ({
            key: d.key,
            label: M.dayLabelWithWeekday(d),
            detail: `${M.capitalise(M.listJoin(d.items.map((it) => M.exerciseById(it.exercise).name.toLowerCase())))}. About ${M.dayMinutes(d)} min.`
          }))} />
        <//>

        ${isCurrent ? null : html`<${Actions}>
          <${Button} fullWidth=${true} variant="outline" label="Go back to this version" onPress=${goBack} />
        <//>`}
      <//>
    <//>`;
  }

  /* -------------------------------------------------------------- workout */
  function Workout({ params }) {
    const [def] = useState(() => S.currentDefinition(C.getState()));
    const [version] = useState(() => C.getState().split.current);
    const day = def.days.find((d) => d.key === params.dayKey) || null;
    const [done, setDone] = useState(() => Object.fromEntries((day ? day.items : []).map((it) => [it.exercise, it.sets])));
    const [rpe, setRpe] = useState(8);
    const [soreness, setSoreness] = useState(0);
    const cancel = html`<${LinkButton} label="Cancel" onPress=${A.dismiss} />`;

    if (!day) {
      return html`<${PlainScreen} title="Workout" topLeft=${cancel}>
        <${EmptyAnswer} icon="dumbbell" title="This day isn’t in your split" body="Pick a workout from the Training tab." />
      <//>`;
    }
    const planned = day.items.reduce((acc, it) => acc + it.sets, 0);
    const total = day.items.reduce((acc, it) => acc + (done[it.exercise] || 0), 0);
    const region = mainRegion(day);

    const finish = () => {
      A.logSession({
        dayKey: day.key, version,
        sets: day.items.map((it) => ({ exercise: it.exercise, setsDone: done[it.exercise] || 0 })),
        rpe, soreness
      });
      A.dismiss();
      if (soreness < 7) {
        A.toast('Workout saved', 'success');
        return;
      }
      /* docs/07 §7.7: new pain sets injury_reported and pauses suggestions for that region. */
      A.alert({
        title: 'Is anything painful, not just sore?',
        message: `Your workout is saved. If something hurts, we’ll pause suggestions that load your ${REGION_WORDS[region]} and suggest checking with a professional.`,
        buttons: [
          { label: 'Just sore', onPress: () => A.toast('Workout saved', 'success') },
          {
            label: 'It’s painful',
            onPress: () => {
              const p = C.getState().profile;
              A.updateProfile({
                safetyFlags: uniq([...(p.safetyFlags || []), 'injury_reported']),
                injuryRegions: uniq([...(p.injuryRegions || []), region])
              });
              A.toast('We’ll pause suggestions for that area');
            }
          }
        ]
      });
    };

    return html`<${PlainScreen} title=${day.label} subtitle="Log what you did. Sets start at your plan." topLeft=${cancel}
      footer=${html`<${Button} fullWidth=${true} label="Finish workout" onPress=${finish} />`}>
      <${Section} title="Sets done" caption=${`${total} of ${plural(planned, 'planned set')}.`}>
        <div className="ads-group" role="list">
          ${day.items.map((it) => {
            const name = M.exerciseById(it.exercise).name;
            return html`<div key=${it.exercise} role="listitem" className="ads-group__row row--stacked">
              <div className="stack-xxs">
                <${T} size="body">${name}<//>
                <${T} size="caption" color="inkMuted80">${`Planned: ${plural(it.sets, 'set')} of ${it.repMin}–${it.repMax}, ${plural(it.rir, 'rep')} in reserve`}<//>
              </div>
              <div className="row row--between">
                <${T} size="callout" color="inkMuted80">Sets done<//>
                <${Stepper} label=${`sets done for ${name}`} value=${done[it.exercise]} min=${0} max=${it.sets + 5}
                  onChange=${(val) => setDone((prev) => ({ ...prev, [it.exercise]: val }))} />
              </div>
            </div>`;
          })}
        </div>
      <//>
      <${Section} title="How hard was it?" caption="Rate of perceived effort, from 6 (easy) to 10 (as hard as you can go). 8 is about 2 reps in reserve.">
        <${ChoiceChips} label="Session effort" value=${rpe} onChange=${setRpe}
          options=${[6, 7, 8, 9, 10].map((x) => ({ value: x, label: String(x) }))} />
      <//>
      <${Section} title="How sore are you?" caption="0 is not at all, 10 is the most sore you’ve been.">
        <div className="row row--between">
          <${T} size="callout" color="inkMuted80">Soreness<//>
          <${Stepper} label="soreness" value=${soreness} min=${0} max=${10} onChange=${setSoreness} />
        </div>
      <//>
    <//>`;
  }

  /* ------------------------------------------------------------ register */
  C.registerScreen('training', Training, {
    title: 'Training', tab: 'training', presentation: 'tab', demoParams: {}
  });
  C.registerScreen('split-day', SplitDay, {
    title: 'Split day', tab: 'training', presentation: 'push',
    demoParams: { dayKey: 'upper_a' },
    demoParamsList: [{ dayKey: 'upper_a' }, { dayKey: 'upper_b' }, { dayKey: 'lower_b' }]
  });
  C.registerScreen('split-review', SplitReview, {
    title: 'Split review', tab: 'training', presentation: 'push', demoParams: {}
  });
  C.registerScreen('split-edit', SplitEdit, {
    title: 'Edit your split', tab: 'training', presentation: 'sheet',
    demoParams: {},
    demoParamsList: [{}, { dayKey: 'lower_a' }, { removeExercise: 'cable-fly' }]
  });
  C.registerScreen('change-request', ChangeRequest, {
    title: 'Ask for a change', tab: 'training', presentation: 'sheet',
    demoParams: {},
    demoParamsList: [{}, { text: 'I want a bigger back' }]
  });
  C.registerScreen('recommendation', Recommendation, {
    title: 'Suggested change', tab: 'training', presentation: 'push',
    demoParams: { id: 'rec-seed-five-day' },
    demoParamsList: [
      { id: 'rec-seed-five-day' }, { demo: 'proposed' }, { demo: 'review' }, { demo: 'chest' }, { demo: 'strength' },
      { demo: 'safety' }, { demo: 'declined' }, { demo: 'accepted' }, { demo: 'constraints' }
    ]
  });
  C.registerScreen('split-version', SplitVersion, {
    title: 'Split version', tab: 'training', presentation: 'push',
    demoParams: { number: 3 },
    demoParamsList: [{ number: 1 }, { number: 2 }, { number: 3 }]
  });
  C.registerScreen('workout', Workout, {
    title: 'Workout', tab: 'training', presentation: 'sheet',
    demoParams: { dayKey: 'upper_a' },
    demoParamsList: [{ dayKey: 'upper_a' }, { dayKey: 'lower_a' }]
  });
})();
