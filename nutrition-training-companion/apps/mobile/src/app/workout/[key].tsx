/* Log a workout (modal): sets done per exercise, starting at the plan, then
   effort and soreness. Saving with high soreness asks whether anything is
   painful, not just sore: pain sets injury_reported and pauses suggestions
   that load that body region (docs/07 §7.7).
   Ported from Workout in prototype/src/70-training.js. Builder D. */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { plural } from '@/features/shared';
import { REGION_WORDS, exercise, mainRegion, uniq } from '@/features/training/helpers';
import { A, getState, S } from '@/store';
import { colors, curve, radius, spacing } from '@/theme';
import { Button, ChoiceChips, EmptyAnswer, FormPage, goBack, LinkButton, overlay, Row, Section, Stepper, T } from '@/ui';

const RPE_OPTIONS = [6, 7, 8, 9, 10].map((x) => ({ value: x, label: String(x) }));

export default function WorkoutScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  /* The plan as it was when the workout started, even if the split changes meanwhile. */
  const [def] = useState(() => S.currentDefinition(getState()));
  const [version] = useState(() => { const sp = getState().split; return sp ? sp.current : 0; });
  const day = def ? def.days.find((d) => d.key === String(key)) || null : null;
  const [done, setDone] = useState<Record<string, number>>(() => Object.fromEntries((day ? day.items : []).map((it) => [it.exercise, it.sets])));
  const [rpe, setRpe] = useState(8);
  const [soreness, setSoreness] = useState(0);
  const cancel = <LinkButton label="Cancel" onPress={goBack} />;

  if (!def) {
    return (
      <FormPage title="Workout" topLeft={cancel}>
        <EmptyAnswer icon="dumbbell" title="Choose a split first" body="Start from a template, or build your own. Then you can log its workouts here.">
          <Button label="Choose a split" onPress={() => router.replace('/setup/split')} />
        </EmptyAnswer>
      </FormPage>
    );
  }
  if (!day) {
    return (
      <FormPage title="Workout" topLeft={cancel}>
        <EmptyAnswer icon="dumbbell" title="This day isn’t in your split" body="Pick a workout from the Training tab." />
      </FormPage>
    );
  }
  if (!day.items.length) {
    return (
      <FormPage title={day.label} topLeft={cancel}>
        <EmptyAnswer icon="dumbbell" title="No exercises on this day yet" body="Add exercises in the editor, then log the workout here.">
          <Button label="Add exercises" onPress={() => router.replace({ pathname: '/training/edit', params: { dayKey: day.key } })} />
        </EmptyAnswer>
      </FormPage>
    );
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
    goBack();
    if (soreness < 7) {
      overlay.toast('Workout saved', 'success');
      return;
    }
    /* docs/07 §7.7: new pain sets injury_reported and pauses suggestions for that region. */
    overlay.alert({
      title: 'Is anything painful, not just sore?',
      message: `Your workout is saved. If something hurts, we’ll pause suggestions that load your ${REGION_WORDS[region]} and suggest checking with a professional.`,
      buttons: [
        { label: 'Just sore', onPress: () => overlay.toast('Workout saved', 'success') },
        {
          label: 'It’s painful',
          onPress: () => {
            const p = getState().profile;
            A.updateProfile({
              safetyFlags: uniq([...(p.safetyFlags || []), 'injury_reported']),
              injuryRegions: uniq([...(p.injuryRegions || []), region])
            });
            overlay.toast('We’ll pause suggestions for that area');
          }
        }
      ]
    });
  };

  return (
    <FormPage title={day.label} subtitle="Log what you did. Sets start at your plan." topLeft={cancel}
      footer={<Button label="Finish workout" onPress={finish} />}>
      <Section title="Sets done" caption={`${total} of ${plural(planned, 'planned set')}.`}>
        <View style={{ backgroundColor: colors.surfacePearl, borderRadius: radius.lg, ...curve, overflow: 'hidden' }}>
          {day.items.map((it, i) => {
            const name = exercise(it.exercise).name;
            return (
              <View key={it.exercise} style={{ paddingVertical: spacing.base, paddingHorizontal: spacing.lg, gap: spacing.sm, borderTopWidth: i ? 1 : 0, borderTopColor: colors.dividerSoft }}>
                <View style={{ gap: spacing.xxs }}>
                  <T size="body">{name}</T>
                  <T size="caption" color="inkMuted80">{`Planned: ${plural(it.sets, 'set')} of ${it.repMin}–${it.repMax}, ${plural(it.rir, 'rep')} in reserve`}</T>
                </View>
                <Row between style={{ minHeight: 44 }}>
                  <T size="callout" color="inkMuted80">Sets done</T>
                  <Stepper label={`sets done for ${name}`} value={done[it.exercise] || 0} min={0} max={it.sets + 5}
                    onChange={(val) => setDone((prev) => ({ ...prev, [it.exercise]: val }))} />
                </Row>
              </View>
            );
          })}
        </View>
      </Section>
      <Section title="How hard was it?" caption="Rate of perceived effort, from 6 (easy) to 10 (as hard as you can go). 8 is about 2 reps in reserve.">
        <ChoiceChips value={rpe} onChange={setRpe} options={RPE_OPTIONS} />
      </Section>
      <Section title="How sore are you?" caption="0 is not at all, 10 is the most sore you’ve been.">
        <Row between style={{ minHeight: 44 }}>
          <T size="callout" color="inkMuted80">Soreness</T>
          <Stepper label="soreness" value={soreness} min={0} max={10} onChange={setSoreness} />
        </Row>
      </Section>
    </FormPage>
  );
}
