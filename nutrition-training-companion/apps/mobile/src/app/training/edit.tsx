/* Edit your split (modal). The person's own edit is never gated (docs/06 §6.1):
   it saves as a new version labelled "Your edit". Add, rename, move and remove
   days; add exercises from the catalogue; set sets, rep range, reps in reserve
   and rest; reorder or remove them. ?dayKey= opens a day; ?removeExercise=
   (from a change request) starts with that exercise taken out.
   Ported from SplitEdit in prototype/src/70-training.js. Builder D. */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { plural } from '@/features/shared';
import { editOps, summarizeEdit } from '@/features/training/diff';
import { AddDayForm, Catalogue, EditItems, WEEKDAY_OPTIONS } from '@/features/training/editor';
import { DiffCard, VolumeCard } from '@/features/training/evidence';
import {
  EXERCISES, NEW_ITEM, dayMinutes, dayTitle, exercise, minuteChanges, nextVersionNumber, sessionLimit, sortedDays
} from '@/features/training/helpers';
import { data as D, domain as M } from '@/shared';
import { A, getState, S, useApp, type SplitDay, type SplitDefinition, type SplitItem } from '@/store';
import {
  Button, Callout, Caption, Chip, ChoiceChips, EmptyAnswer, FormPage, goBack, Input, LinkButton, overlay, Row, Section, Stack, T
} from '@/ui';

const slug = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'day';

export default function SplitEditScreen() {
  const params = useLocalSearchParams<{ dayKey?: string; removeExercise?: string }>();
  const [base] = useState(() => S.currentDefinition(getState()));
  const [baseNumber] = useState(() => (getState().split ? getState().split!.current : 0));
  if (!base) {
    return (
      <FormPage title="Edit your split" topLeft={<LinkButton label="Cancel" onPress={goBack} />}>
        <EmptyAnswer icon="list.bullet" title="Choose a split first" body="Start from a template, or build your own. Then you can edit it here.">
          <Button label="Choose a split" onPress={() => router.replace('/setup/split')} />
        </EmptyAnswer>
      </FormPage>
    );
  }
  return (
    <Editor base={base} baseNumber={baseNumber}
      dayKeyParam={typeof params.dayKey === 'string' ? params.dayKey : null}
      removeId={typeof params.removeExercise === 'string' && params.removeExercise ? params.removeExercise : null} />
  );
}

function Editor({ base, baseNumber, dayKeyParam, removeId }: { base: SplitDefinition; baseNumber: number; dayKeyParam: string | null; removeId: string | null }) {
  const s = useApp();
  const removedFrom = removeId ? base.days.filter((d) => d.items.some((it) => it.exercise === removeId)) : [];
  const [draft, setDraft] = useState<SplitDefinition>(() => {
    const d = D.clone(base) as SplitDefinition;
    if (removeId) d.days.forEach((day) => { day.items = day.items.filter((it) => it.exercise !== removeId); });
    return d;
  });
  const [dayKey, setDayKey] = useState<string | null>(() => {
    if (dayKeyParam && base.days.some((d) => d.key === dayKeyParam)) return dayKeyParam;
    if (removedFrom.length) return removedFrom[0].key;
    return base.days.length ? sortedDays(base)[0].key : null;
  });
  const [adding, setAdding] = useState(() => !base.days.length);
  const [showAdd, setShowAdd] = useState(false);
  const [note, setNote] = useState('');

  const day = dayKey ? draft.days.find((d) => d.key === dayKey) || null : null;
  const baseDay = dayKey ? base.days.find((d) => d.key === dayKey) || null : null;
  const limit = sessionLimit(s);
  const equipment: string[] = s.profile && s.profile.equipment ? s.profile.equipment : D.EQUIPMENT;

  /* ---------------------------------------------------------- changes */
  const updateDay = (fn: (d: SplitDay) => void) => setDraft((prev) => {
    const next = D.clone(prev) as SplitDefinition;
    const d = next.days.find((x) => x.key === dayKey);
    if (d) fn(d);
    return next;
  });
  const setItem = (exId: string, patch: Partial<SplitItem>) => updateDay((d) => {
    const it = d.items.find((x) => x.exercise === exId);
    if (it) Object.assign(it, patch);
  });
  const moveItem = (exId: string, by: -1 | 1) => updateDay((d) => {
    const i = d.items.findIndex((x) => x.exercise === exId);
    const j = i + by;
    if (i < 0 || j < 0 || j >= d.items.length) return;
    [d.items[i], d.items[j]] = [d.items[j], d.items[i]];
  });
  const removeItem = (exId: string) => updateDay((d) => { d.items = d.items.filter((x) => x.exercise !== exId); });
  const addItem = (exId: string) => {
    updateDay((d) => {
      const original = baseDay ? baseDay.items.find((it) => it.exercise === exId) : null;
      d.items.push(original ? (D.clone(original) as SplitItem) : { exercise: exId, ...NEW_ITEM });
    });
    setShowAdd(false);
    overlay.toast(`Added ${M.exerciseWords(exercise(exId).name)}`);
  };
  const pickDay = (key: string) => {
    setDayKey(key);
    setAdding(false);
    setShowAdd(false);
  };
  const addDay = (label: string, weekday: number | null) => {
    const used = new Set([...base.days, ...draft.days].map((d) => d.key));
    let key = slug(label);
    for (let n = 2; used.has(key); n++) key = `${slug(label)}_${n}`;
    setDraft((prev) => ({ ...prev, days: [...prev.days, { key, label, weekday, items: [] }] }));
    setDayKey(key);
    setAdding(false);
    setShowAdd(true);
  };
  const removeDay = () => {
    if (!day) return;
    const gone = day;
    overlay.alert({
      title: `Remove ${gone.label || 'this day'}?`,
      message: `${gone.items.length ? `Its ${plural(gone.items.length, 'exercise')} go with it. ` : ''}Nothing is saved until you save the new version.`,
      buttons: [{ label: 'Cancel', style: 'cancel' }, {
        label: 'Remove', style: 'destructive',
        onPress: () => {
          const rest = sortedDays(draft).filter((d) => d.key !== gone.key);
          setDraft((prev) => ({ ...prev, days: prev.days.filter((d) => d.key !== gone.key) }));
          setDayKey(rest.length ? rest[0].key : null);
          setAdding(!rest.length);
          setShowAdd(false);
        }
      }]
    });
  };

  /* ------------------------------------------------------- validation */
  const cleaned: SplitDefinition = { ...draft, days: draft.days.map((d) => ({ ...d, label: d.label.trim() })) };
  const names = cleaned.days.map((d) => d.label.toLowerCase());
  const unnamed = cleaned.days.some((d) => !d.label);
  const duplicate = names.some((n, i) => n && names.indexOf(n) !== i);
  const dayName = day ? day.label.trim() : '';
  const dayNameError = !day ? null
    : !dayName ? 'Give this day a name.'
    : cleaned.days.some((d) => d.key !== day.key && d.label.toLowerCase() === dayName.toLowerCase()) ? `You already have a day called ${dayName}.`
    : null;

  const ops = editOps(base, cleaned);
  const deltas = M.volumeDeltas(base, cleaned);
  const minutes = minuteChanges(base, cleaned, limit);
  const next = nextVersionNumber(s);
  const summary = summarizeEdit(ops);
  const canSave = ops.length > 0 && !unnamed && !duplicate;

  const save = () => {
    if (!canSave) return;
    const n = A.saveSplitEdit(cleaned, note.trim() || summary);
    overlay.toast(`Saved version ${n}`, 'success');
    goBack();
  };
  const cancel = () => {
    if (!ops.length) {
      goBack();
      return;
    }
    overlay.alert({
      title: 'Discard your changes?',
      message: `Your split stays at version ${baseNumber}.`,
      buttons: [{ label: 'Keep editing', style: 'cancel' }, { label: 'Discard', style: 'destructive', onPress: goBack }]
    });
  };

  const removedName = removeId && exercise(removeId) ? exercise(removeId).name : null;
  const usableCount = day ? EXERCISES.filter((ex) => ex.equipment.every((e) => equipment.includes(e)) && !day.items.some((it) => it.exercise === ex.id)).length : 0;
  const days = sortedDays(draft);

  return (
    <FormPage title="Edit your split" subtitle={`Changes save as a new version. Version ${baseNumber} stays in your history.`}
      topLeft={<LinkButton label="Cancel" onPress={cancel} />}
      footer={(
        <>
          <Caption>This is your own edit, so it doesn’t need evidence. We’ll label it “Your edit” in History.</Caption>
          <Button label={`Save as version ${next}`} disabled={!canSave} onPress={save} />
        </>
      )}>
      {removedName ? (
        <Callout>{removedFrom.length
          ? `We removed ${M.exerciseWords(removedName)} from ${M.listJoin(removedFrom.map((d) => d.label))}. Check the change below, then save.`
          : `${removedName} isn’t in your split, so there’s nothing to remove.`}</Callout>
      ) : null}

      {days.length ? (
        <Stack gap="sm">
          <Row wrap>
            {days.map((d) => <Chip key={d.key} label={d.label.trim() || 'Unnamed day'} active={!adding && d.key === dayKey} onPress={() => pickDay(d.key)} />)}
            <Chip label="Add a day" active={adding} onPress={() => { setAdding(true); setShowAdd(false); }} />
          </Row>
          {!adding && day
            ? <Caption>{`${dayTitle(day)}, about ${dayMinutes(day)} min. Your limit is ${limit}.`}</Caption>
            : null}
        </Stack>
      ) : null}

      {adding || !day ? (
        <Section title="Add a day" caption={days.length ? 'A name and the day of the week you train it.' : 'Your split has no days yet. Start with your first training day.'}>
          <AddDayForm key={days.length} taken={draft.days.map((d) => d.label.trim())}
            takenWeekdays={draft.days.map((d) => d.weekday).filter((w): w is number => w != null)}
            onAdd={addDay} onCancel={days.length ? () => setAdding(false) : undefined} />
        </Section>
      ) : (
        <>
          <Section title="Exercises">
            <EditItems key={day.key} day={day} onChange={setItem} onMove={moveItem} onRemove={removeItem} />
          </Section>

          <Section title="Add an exercise" caption="From the catalogue, for your equipment. Grouped by the muscle each one mainly works.">
            {!usableCount
              ? (
                <Stack gap="xs">
                  <Caption>{equipment.length ? 'Every exercise that fits your equipment is already on this day.' : 'Nothing in the catalogue fits your equipment yet.'}</Caption>
                  <LinkButton size="callout" label="Change your equipment" onPress={() => router.push('/setup/training')} />
                </Stack>
              )
              : !showAdd
                ? <LinkButton icon="plus" label={`Choose from ${plural(usableCount, 'exercise')}`} onPress={() => setShowAdd(true)} />
                : <Catalogue key={day.key} day={day} baseDay={baseDay} equipment={equipment} onAdd={addItem} onHide={() => setShowAdd(false)} />}
          </Section>

          <Section title="This day">
            <Input label="Day name" value={day.label} onChangeText={(v) => updateDay((d) => { d.label = v; })}
              error={dayNameError} autoCapitalize="words" returnKeyType="done" />
            <Stack gap="xs">
              <T size="callout" weight="semiBold">Day of the week</T>
              <ChoiceChips value={day.weekday == null ? -1 : day.weekday} options={WEEKDAY_OPTIONS}
                onChange={(w) => updateDay((d) => { d.weekday = w === -1 ? null : w; })} />
            </Stack>
            <LinkButton color="danger" icon="trash" label="Remove this day" onPress={removeDay} />
          </Section>
        </>
      )}

      <Section title="What changes" caption={ops.length ? `Compared with version ${baseNumber}.` : null}>
        {ops.length ? (
          <>
            <DiffCard ops={ops} />
            {deltas.length || minutes.length ? <VolumeCard deltas={deltas} minutes={minutes} /> : null}
          </>
        ) : <Caption>Nothing has changed yet.</Caption>}
        {unnamed || duplicate ? <T size="caption" color="danger">Give every day its own name before you save.</T> : null}
      </Section>

      {/* The prototype shows the summary as the placeholder; a long one would be cut off in the field, so it's the hint. */}
      <Input label="Note (optional)" value={note} placeholder="What changed and why" onChangeText={setNote}
        hint={ops.length && !note.trim() ? `If you leave it empty, the note says: ${summary}` : null} />
    </FormPage>
  );
}
