/* One training day of the current split: its exercises, prescriptions and the
   muscles each set counts for. Ported from SplitDay in prototype/src/70-training.js. Builder D. */
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { plural } from '@/features/shared';
import { creditLine, dayMinutes, exercise, prescription, weekdayName } from '@/features/training/helpers';
import { S, useApp } from '@/store';
import { spacing } from '@/theme';
import { Button, Caption, EmptyAnswer, Rows, Screen, Section, Stack, T } from '@/ui';

export default function SplitDayScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const s = useApp();
  const def = S.currentDefinition(s);
  const day = def ? def.days.find((d) => d.key === String(key)) : null;
  if (!def || !day) {
    return (
      <Screen title="Training day">
        <EmptyAnswer icon="dumbbell" title="This day isn’t in your split"
          body={s.split ? `Version ${s.split.current} of your split doesn’t have it.` : 'You haven’t chosen a split yet.'}>
          {!s.split ? <Button label="Choose a split" onPress={() => router.push('/setup/split')} /> : null}
        </EmptyAnswer>
      </Screen>
    );
  }
  const minutes = dayMinutes(day);
  const totalSets = day.items.reduce((acc, it) => acc + it.sets, 0);
  /* An empty day has only the warm-up, so no time is shown for it. */
  const subtitle = !day.items.length ? (day.weekday != null ? weekdayName(day.weekday) : null)
    : day.weekday != null ? `${weekdayName(day.weekday)}, about ${minutes} min` : `About ${minutes} min`;
  const edit = () => router.push({ pathname: '/training/edit', params: { dayKey: day.key } });
  return (
    <Screen title={day.label} subtitle={subtitle}>
      {day.items.length ? (
        <Section title="Exercises" caption={`${plural(day.items.length, 'exercise')} and ${plural(totalSets, 'hard set')}. Times include a warm-up, each set and its rest.`}>
          <Rows rows={day.items.map((it) => ({
            key: it.exercise,
            label: exercise(it.exercise).name,
            detail: (
              <View style={{ gap: spacing.xxs }}>
                <T size="caption" color="inkMuted80">{prescription(it)}</T>
                <T size="caption" color="inkMuted48">{creditLine(it.exercise)}</T>
              </View>
            )
          }))} />
        </Section>
      ) : (
        <EmptyAnswer icon="dumbbell" title="No exercises on this day yet" body="Add exercises from the catalogue in the editor." />
      )}
      <Stack gap="sm">
        {day.items.length ? <Button label="Start this workout" onPress={() => router.push(`/workout/${day.key}`)} /> : null}
        <Button variant={day.items.length ? 'outline' : 'primary'} label={day.items.length ? 'Edit this day' : 'Add exercises'} onPress={edit} />
      </Stack>
      {day.items.length ? null : <Caption>Your own edits save as a new version of your split.</Caption>}
    </Screen>
  );
}
