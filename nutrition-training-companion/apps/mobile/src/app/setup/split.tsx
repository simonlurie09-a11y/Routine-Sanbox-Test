/* Your split (prototype SplitPage): start from the four-day upper/lower
   template, with its weekly-sets review, or build your own in the editor.
   Choosing again when a split exists replaces it, so that asks first. */
import { router } from 'expo-router';
import { useState } from 'react';

import { saved } from '@/features/settings/common';
import { plural } from '@/features/shared';
import { data as D, domain as M } from '@/shared';
import { A, useApp, type SplitDefinition } from '@/store';
import { Button, Caption, Card, CardTitle, Facts, FormPage, OptionCard, overlay, Stack } from '@/ui';

const TEMPLATE_NAME = 'Upper / Lower, 4 days';
const REVIEW_MUSCLES = ['chest', 'lats', 'quads', 'hamstrings'];
type Kind = 'sample' | 'own';

export default function SplitPage() {
  const s = useApp();
  const p = s.profile;
  const current: Kind | null = s.split ? p.splitSource : null;
  const [choice, setChoice] = useState<Kind | null>(() => current);

  const def = D.SPLIT_V3 as SplitDefinition;
  const review = M.reviewSplit(def, p) as { volume: Record<string, number>; minutes: Record<string, number> };
  const minutes = Object.values(review.minutes);
  const lo = Math.min(...minutes);
  const hi = Math.max(...minutes);
  const restDays = 7 - new Set(def.days.map((d) => d.weekday).filter((w) => w != null)).size;

  const apply = (kind: Kind) => {
    A.chooseSplit(kind);
    if (kind === 'own') {
      A.completeSetup('split');
      router.replace('/training/edit');
      return;
    }
    saved('split');
  };
  const save = () => {
    if (!choice) return;
    if (s.split && choice === current) return saved('split');
    if (s.split) {
      return overlay.alert({
        title: 'Replace your split?',
        message: `${s.split.name} and its ${plural(s.split.versions.length, 'version')} will be replaced by ${choice === 'sample' ? 'the template' : 'an empty week'}. This can't be undone.`,
        buttons: [
          { label: 'Cancel', style: 'cancel' },
          { label: 'Replace', style: 'destructive', onPress: () => apply(choice) }
        ]
      });
    }
    apply(choice);
  };
  const label = !choice || (s.split && choice === current) ? 'Save' : choice === 'sample' ? 'Use this template' : 'Build my split';

  return (
    <FormPage title="Your split" subtitle="Start from a template, or build your own."
      footer={<Button label={label} onPress={save} disabled={!choice} />}>
      <Stack gap="base">
        <OptionCard icon="list.bullet" title="Start from a template" body={`${TEMPLATE_NAME}: two upper and two lower sessions a week, ready to use and change.`}
          selected={choice === 'sample'} onPress={() => setChoice('sample')} />
        <OptionCard icon="pencil" title="Build my own" body="Start from an empty week and add your days and exercises."
          selected={choice === 'own'} onPress={() => setChoice('own')} />
      </Stack>
      {choice === 'sample' ? (
        <Card>
          <Stack gap="xs">
            <CardTitle>{TEMPLATE_NAME}</CardTitle>
            <Caption>Weekly sets per muscle</Caption>
          </Stack>
          <Facts rows={[
            ...REVIEW_MUSCLES.map((id): [string, string] => [M.muscleById(id).name, `${M.fmt.sets(review.volume[id])} sets`]),
            ['Sessions a week', String(def.days.length)],
            ['Session length', lo === hi ? `About ${lo} min` : `${lo}–${hi} min`],
            ['Rest days', String(restDays)]
          ]} />
          <Caption>This describes the template; it isn't advice. A set counts once for its main muscle and half for helpers. The full review is in Training.</Caption>
        </Card>
      ) : null}
      {choice === 'own' && current !== 'own' ? (
        <Caption>We'll open the split editor. Add your training days, then the exercises on each.</Caption>
      ) : null}
    </FormPage>
  );
}
