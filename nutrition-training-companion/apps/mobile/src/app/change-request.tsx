/* Ask for a change (modal). The request is read on the phone by simple rules
   (M.parseIntent), confirmed, then checked by the evidence gate. Ported from
   ChangeRequest in prototype/src/70-training.js, without the AI consent step
   (v1 has no AI). Builder D. */
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { NOT_UNDERSTOOD, quoted, verifiedStudies } from '@/features/training/helpers';
import { domain as M } from '@/shared';
import { A, getState } from '@/store';
import { Body, Button, Callout, Caption, Card, CardTitle, ChoiceChips, FormPage, goBack, Input, LinkButton, Stack } from '@/ui';

const EXAMPLES = ['A bigger back', 'Wider shoulders', 'Get stronger', 'More protein', 'Add running', 'Remove cable fly'];
type Intent = { type: string; summary: string | null; exercise?: string; [k: string]: unknown };

export default function ChangeRequestScreen() {
  const params = useLocalSearchParams<{ text?: string }>();
  const [text, setText] = useState(typeof params.text === 'string' ? params.text : '');
  const [error, setError] = useState<string | null>(null);
  const [intent, setIntent] = useState<Intent | null>(null);
  const [checking, setChecking] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const edit = (value: string) => {
    setText(value);
    setError(null);
  };
  const next = () => {
    if (!text.trim()) return;
    const parsed = M.parseIntent(text) as Intent;
    if (parsed.type === 'unknown') {
      setError(NOT_UNDERSTOOD);
      return;
    }
    setIntent(parsed);
  };
  const route = (current: Intent, requestText: string) => {
    const draft = M.evaluateChange(current, getState(), { requestText });
    if (draft.status === 'user_edit') {
      router.replace({ pathname: '/training/edit', params: { removeExercise: String(current.exercise) } });
      return;
    }
    if (draft.status === 'not_understood') {
      setChecking(false);
      setIntent(null);
      setError(NOT_UNDERSTOOD);
      return;
    }
    const id = A.createRecommendation(draft, { trigger: 'user_request', requestText });
    router.replace(`/recommendation/${id}`);
  };
  const confirm = () => {
    if (!intent || checking) return;
    const requestText = text.trim();
    /* Removing an exercise is the person's own edit: no evidence check. */
    if (intent.type === 'remove_exercise') {
      route(intent, requestText);
      return;
    }
    setChecking(true);
    const current = intent;
    timer.current = setTimeout(() => route(current, requestText), 800);
  };
  const cancel = <LinkButton label="Cancel" onPress={goBack} />;

  if (!intent) {
    return (
      <FormPage title="What would you like to change?" subtitle="Describe it in your own words." topLeft={cancel}
        footer={<Button label="Continue" disabled={!text.trim()} onPress={next} />}>
        <Input label="Your request" value={text} placeholder="For example, build my back" error={error}
          onChangeText={edit} onSubmitEditing={next} returnKeyType="done" autoCapitalize="sentences" />
        <Stack gap="sm">
          <Caption>Or start from an example</Caption>
          <ChoiceChips value={text} onChange={edit} options={EXAMPLES.map((x) => ({ value: x, label: x }))} />
        </Stack>
        <Caption>{`We only suggest a change when ${verifiedStudies(M.REQUIRED_SOURCES)} support it. If they don’t, we say so and your split stays as it is.`}</Caption>
      </FormPage>
    );
  }
  const removal = intent.type === 'remove_exercise';
  return (
    <FormPage title="What would you like to change?" subtitle="Check we understood you before we look at the evidence." topLeft={cancel}
      footer={(
        <>
          <Button label="That’s right" loading={checking} onPress={confirm} />
          <Button variant="ghost" label="Change my request" disabled={checking} onPress={() => setIntent(null)} />
        </>
      )}>
      <Card>
        <CardTitle>Here’s what we understood</CardTitle>
        <Body>{intent.summary || ''}</Body>
        <Caption>{`From ${quoted(text)}`}</Caption>
      </Card>
      <Caption>We read your request on your phone with simple rules.</Caption>
      {removal ? <Callout>Removing an exercise is your own edit, so it doesn’t need evidence. We’ll open the editor with it removed.</Callout> : null}
      <View accessibilityLiveRegion="polite">
        {checking ? <Callout>Checking the evidence</Callout> : null}
      </View>
    </FormPage>
  );
}
