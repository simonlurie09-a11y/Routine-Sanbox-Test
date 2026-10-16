/* The sign-up steps (prototype/src/40-onboarding.js), each on the sign-up
   page layout (FormPage). The step machine itself is in src/app/sign-up.tsx.
   v1 has no account: the consent step replaces "Create your account". */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import type { HealthProfile } from '@/services/health';
import { connectAppleHealth, disconnectAppleHealth, healthIsSimulated } from '@/services/healthSync';
import { data as D, domain as M } from '@/shared';
import { A, getState } from '@/store';
import { colors, curve, GUTTER, radius, spacing } from '@/theme';
import {
  Body, Button, Callout, Caption, Check, FormPage, FromHealth, Icon, LinkButton, overlay, Rows, Stack, T
} from '@/ui';
import {
  ADULT_AGE, AgeField, ageOn, checkAge, checkWeight, GoalOptions, HEALTH_READS, longBirth, shortDay, WeightField, type WeightUnit
} from './fields';

export type StepName = 'splash' | 'slides' | 'disclaimer' | 'consent' | 'health' | 'age' | 'under18' | 'weight' | 'goal';

export type Answers = {
  agreed: boolean;
  birthYear: string;
  birthDate: string | null;
  weight: string;
  weightUnit: WeightUnit;
  goal: string | null;
  /* What Apple Health returned (held in memory only), or null. */
  health: HealthProfile | null;
  healthSource: 'connected' | 'not_connected' | null;
};
export const emptyAnswers = (): Answers => ({
  agreed: false, birthYear: '', birthDate: null, weight: '', weightUnit: 'kg', goal: null, health: null, healthSource: null
});

export type StepProps = {
  ans: Answers;
  set: (patch: Partial<Answers>) => void;
  go: (next: StepName) => void;
  /* null on the first steps, which have no back chevron. */
  back: (() => void) | null;
  finish: () => void;
};

const SPLASH_MS = 1500;
const SLIDES = [
  { icon: 'barcode.viewfinder', title: 'Track food from a barcode or its label',
    body: "Scan a barcode or a pack's QR code, or type in the label when there isn't one. We show what's in it and how sure we are." },
  { icon: 'checkmark.seal.fill', title: 'Training changes backed by research',
    body: `We only suggest a change when ${M.REQUIRED_SOURCES} verified studies support it. Otherwise we say so and change nothing.` },
  { icon: 'waveform.path.ecg', title: 'Apple Health, compared with you',
    body: "Sleep, HRV and resting heart rate from Apple Health are read against your own baseline, not anyone else's." }
];

/* Health says the person is under 18: sign-up stops, whatever year is typed. */
export const healthMinor = (ans: Answers) => !!(ans.health && ans.health.birthDate && ageOn(ans.health.birthDate) < ADULT_AGE);
const healthWeightText = (h: HealthProfile | null) => (h && h.weightKg ? String(Math.round(h.weightKg.value * 10) / 10) : null);

/* Forget whatever Apple Health filled in earlier (going back and choosing again). */
const clearHealth = (ans: Answers): Partial<Answers> => (ans.health
  ? { health: null, healthSource: null, birthDate: null, birthYear: '', weight: '', weightUnit: 'kg' }
  : { health: null, healthSource: null });

/* The answers Apple Health fills in. Under 18: keep only the birth date, in
   memory, to explain the stop; nothing else from Health is used or kept. */
function fromHealth(p: HealthProfile | null): Partial<Answers> {
  if (!p) return { health: null };
  if (p.birthDate && ageOn(p.birthDate) < ADULT_AGE) {
    return { health: { birthDate: p.birthDate, sex: null, weightKg: null, heightCm: null }, birthYear: p.birthDate.slice(0, 4), birthDate: p.birthDate };
  }
  const patch: Partial<Answers> = { health: p };
  if (p.birthDate) {
    patch.birthYear = p.birthDate.slice(0, 4);
    patch.birthDate = p.birthDate;
  }
  const w = healthWeightText(p);
  if (w) {
    patch.weight = w;
    patch.weightUnit = 'kg';
  }
  return patch;
}

const Primary = ({ label, onPress, disabled, loading }: { label: string; onPress: () => void; disabled?: boolean; loading?: boolean }) =>
  <Button label={label} onPress={onPress} disabled={disabled} loading={loading} />;
const Skip = ({ label, onPress }: { label: string; onPress: () => void }) =>
  <LinkButton label={label} size="callout" color="inkMuted48" onPress={onPress} />;

/* --------------------------------------------------------------- steps */

/* 1. Splash: the wordmark, centred. Moves on after 1.5 s, or on a tap. */
export function Splash({ go }: StepProps) {
  useEffect(() => {
    const t = setTimeout(() => go('slides'), SPLASH_MS);
    return () => clearTimeout(t);
  }, [go]);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Companion. Tap to start." onPress={() => go('slides')}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas }}>
      <T size="title2" weight="bold">Companion</T>
    </Pressable>
  );
}

/* Pager dots: active 20 × 8 primary pill, others 8 × 8 hairline. */
function Dots({ count, active }: { count: number; active: number }) {
  return (
    <View accessible accessibilityLabel={`Slide ${active + 1} of ${count}`} style={{ flexDirection: 'row', gap: spacing.sm }}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={{ width: i === active ? spacing.lg : spacing.sm, height: spacing.sm, borderRadius: radius.pill, backgroundColor: i === active ? colors.primary : colors.hairline }} />
      ))}
    </View>
  );
}

/* 2. Three horizontally paged slides. */
export function Slides({ go }: StepProps) {
  const [idx, setIdx] = useState(0);
  const { width } = useWindowDimensions();
  const reduce = useReducedMotion();
  const pager = useRef<ScrollView>(null);
  const last = idx === SLIDES.length - 1;
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / Math.max(1, width));
    if (i !== idx && i >= 0 && i < SLIDES.length) setIdx(i);
  };
  const next = () => {
    if (last) return go('disclaimer');
    const i = idx + 1;
    setIdx(i);
    if (pager.current) pager.current.scrollTo({ x: i * width, animated: !reduce });
  };
  return (
    <FormPage onBack={null} topRight={<Skip label="Skip" onPress={() => go('disclaimer')} />}
      footer={<Primary label={last ? 'Get started' : 'Next'} onPress={next} />}>
      <ScrollView ref={pager} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={16}
        accessibilityLabel="What Companion does" style={{ marginHorizontal: -GUTTER, flexGrow: 0 }}>
        {SLIDES.map((sl, i) => (
          <View key={sl.title} accessibilityElementsHidden={i !== idx} importantForAccessibility={i === idx ? 'auto' : 'no-hide-descendants'}
            style={{ width, paddingHorizontal: GUTTER, gap: spacing.lg }}>
            <View style={{ aspectRatio: 4 / 3, backgroundColor: colors.canvasParchment, borderRadius: radius.lg, ...curve, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={sl.icon} size={56} color="inkMuted48" />
            </View>
            <Stack gap="sm">
              <T size="title2" weight="bold" accessibilityRole="header">{sl.title}</T>
              <T size="headline" weight="regular" color="inkMuted48">{sl.body}</T>
            </Stack>
          </View>
        ))}
      </ScrollView>
      <Dots count={SLIDES.length} active={idx} />
    </FormPage>
  );
}

/* 3. The medical disclaimer, acknowledged before anything else. */
export function Disclaimer({ go, back }: StepProps) {
  const accept = () => {
    A.acknowledgeDisclaimer();
    go('consent');
  };
  return (
    <FormPage title="This isn't medical advice" subtitle="Please read this before you start." onBack={back}
      footer={<Primary label="I understand" onPress={accept} />}>
      <Body>{D.DISCLAIMER.full}</Body>
      <Caption>You can read this again in Settings, under About.</Caption>
    </FormPage>
  );
}

/* 4. The one consent the app can't run without (there's no account in v1). */
export function Consent({ ans, set, go, back }: StepProps) {
  const [nudge, setNudge] = useState(false);
  const next = () => {
    if (!ans.agreed) return setNudge(true);
    A.agreeToHealthData();
    go('health');
  };
  return (
    <FormPage title="Your data stays on this iPhone" subtitle="There's no account. What you log is kept on this iPhone, not on a server."
      onBack={back} footer={<Primary label="Continue" onPress={next} />}>
      <Check checked={ans.agreed} onChange={(on) => { set({ agreed: on }); if (on) setNudge(false); }}
        label="I agree to Companion storing my food, training and health data on this iPhone to run the app"
        detail="That's the food you log, your training and workouts, your answers about your health and body, and your targets. It stays on this iPhone, encrypted by iOS, and nobody else sees it, not even us. Required. To withdraw, delete your data in Settings, or delete the app."
        error={nudge && !ans.agreed ? 'Tick this to continue.' : null} />
      <Caption>Companion never uploads your data and has no ads or analytics. You can export a copy any time in Settings.</Caption>
    </FormPage>
  );
}

/* 5. Apple Health (optional): Apple's permission sheet, then age and weight are filled in. */
export function Health({ ans, set, go, back }: StepProps) {
  const [busy, setBusy] = useState(false);
  const connect = async () => {
    setBusy(true);
    const res = await connectAppleHealth();
    setBusy(false);
    if (!res.ok) {
      set({ ...clearHealth(ans), healthSource: 'not_connected' });
      overlay.toast("Apple Health didn't connect. You can connect it later in Settings.", 'error');
      return go('age');
    }
    const patch = fromHealth(res.profile);
    /* Under 18 by Health's date of birth: stop reading at once, so nothing is kept. */
    if (patch.health && healthMinor({ ...ans, ...patch } as Answers)) disconnectAppleHealth();
    set({ ...clearHealth(ans), ...patch, healthSource: 'connected' });
    go('age');
  };
  const notNow = () => {
    if (getState().devices.apple_health.status !== 'revoked') disconnectAppleHealth();
    set({ ...clearHealth(ans), healthSource: 'not_connected' });
    go('age');
  };
  return (
    <FormPage title="Connect Apple Health" subtitle="We'll fill in your age and weight from it, so you don't have to type them." onBack={back}
      topRight={<Skip label="Not now" onPress={notNow} />}
      footer={<Primary label="Connect Apple Health" onPress={connect} loading={busy} />}>
      <Rows rows={HEALTH_READS.map((r) => ({ key: r.key, icon: r.icon, iconColor: 'ink' as const, label: r.label, detail: r.detail }))} />
      <Caption>{`Your iPhone asks which of these to share, and you can change it any time in the Health app. Companion only reads from Health; it never writes to it, and nothing is uploaded.${healthIsSimulated ? ' In this web preview, Apple Health is simulated.' : ''}`}</Caption>
    </FormPage>
  );
}

/* 6. Age gate. */
export function Age({ ans, set, go, back }: StepProps) {
  const year = ans.birthYear || '';
  const keepDate = ans.birthDate && ans.birthDate.slice(0, 4) === year ? ans.birthDate : null;
  const check = checkAge(year, keepDate);
  const minorByHealth = healthMinor(ans);
  const stop = () => {
    if (minorByHealth && getState().devices.apple_health.status !== 'revoked') disconnectAppleHealth();
    go('under18');
  };
  const next = () => {
    if (check.verdict === 'minor' || minorByHealth) return stop();
    if (check.verdict === 'adult') return go('weight');
    overlay.alert({
      title: `Have you turned ${ADULT_AGE} yet?`,
      message: `If you were born in ${check.year}, you turn ${ADULT_AGE} this year.`,
      buttons: [
        { label: 'Not yet', style: 'cancel', onPress: stop },
        { label: `Yes, I'm ${ADULT_AGE}`, onPress: () => go('weight') }
      ]
    });
  };
  const healthDate = keepDate || (minorByHealth && ans.health ? ans.health.birthDate : null);
  return (
    <FormPage title="What year were you born?" subtitle={`Companion is for adults, ${ADULT_AGE} and over.`} onBack={back}
      footer={<Primary label="Continue" onPress={next} disabled={!check.valid} />}>
      <AgeField value={year} error={check.error} onChange={(v) => set({ birthYear: v })} />
      {healthDate && ans.healthSource === 'connected' ? <FromHealth text={`Born ${longBirth(healthDate)}, from Apple Health.`} /> : null}
      <Caption>We use it to check your age and for energy estimates.</Caption>
    </FormPage>
  );
}

/* 6b. Under 18: sign-up stops here. */
export function Under18({ ans, back }: StepProps) {
  return (
    <FormPage title="Companion is for adults" subtitle={`You need to be ${ADULT_AGE} or over to use it.`} onBack={back}>
      <Body>{healthMinor(ans)
        ? `Its training and nutrition information is written for adults, and your Apple Health data says you're under ${ADULT_AGE}, so you can't continue. We haven't kept anything from Apple Health.`
        : "Its training and nutrition information is written for adults, so you can't continue. If you entered the wrong year, go back and change it."}</Body>
      <Callout>For advice about training or food, talk to a parent, a coach or your doctor.</Callout>
    </FormPage>
  );
}

/* 7. Weight. */
export function Weight({ ans, set, go, back }: StepProps) {
  const check = checkWeight(ans.weight || '', ans.weightUnit);
  const h = ans.health;
  const fromHealthLine = h && h.weightKg && ans.weightUnit === 'kg' && ans.weight === healthWeightText(h)
    ? `Weighed ${shortDay(h.weightKg.at)}, from Apple Health.` : null;
  return (
    <FormPage title="What do you weigh?" subtitle="We use it to work out protein and energy targets." onBack={back}
      footer={<Primary label="Continue" onPress={() => go('goal')} disabled={!check.valid} />}>
      <WeightField value={ans.weight || ''} unit={ans.weightUnit} error={check.error}
        onChange={(v) => set({ weight: v })} onUnit={(u) => set({ weightUnit: u })} />
      {fromHealthLine ? <FromHealth text={fromHealthLine} /> : null}
      <Caption>Only you see it. You can update it any time in Settings.</Caption>
    </FormPage>
  );
}

/* 8. What you want to work on: selectable cards. */
export function Goal({ ans, set, back, finish }: StepProps) {
  return (
    <FormPage title="What do you want to work on?" subtitle="Pick one. You can change it any time." onBack={back}
      footer={<Primary label="Finish" onPress={finish} disabled={!ans.goal} />}>
      <GoalOptions value={ans.goal} onChange={(g) => set({ goal: g })} />
    </FormPage>
  );
}

export const STEP_COMPONENTS: Record<StepName, (p: StepProps) => ReactNode> = {
  splash: Splash, slides: Slides, disclaimer: Disclaimer, consent: Consent, health: Health,
  age: Age, under18: Under18, weight: Weight, goal: Goal
};
