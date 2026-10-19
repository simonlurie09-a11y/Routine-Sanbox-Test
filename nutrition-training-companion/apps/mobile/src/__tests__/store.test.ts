jest.mock('expo-file-system', () => ({ File: class { exists = false; textSync() { return ''; } create() {} write() {} delete() {} moveSync() {} }, Paths: { document: '/doc', cache: '/cache' } }));
import { domain as M } from '@/shared';
import { A, freshState, getState, useApp } from '@/store';

const intent = (text: string) => M.parseIntent(text);
beforeEach(() => useApp.setState(freshState(), true));

describe('store and evidence gate', () => {
  it('a new install has nothing logged, no split and no targets', () => {
    const s = getState();
    expect(s.onboarded).toBe(false);
    expect(s.split).toBeNull();
    expect(s.targets.energyKcal).toBeNull();
    expect(s.devices.apple_health.status).toBe('revoked');
  });
  it('nothing is suggested before the health questions are answered', () => {
    A.chooseSplit('sample');
    const draft = M.evaluateChange(intent('I want a bigger back'), getState(), { requestText: 'I want a bigger back' });
    expect(draft.status).toBe('blocked_constraints');
    expect(draft.needs).toBe('health');
  });
  it('without a split, a split change asks for one', () => {
    A.completeSetup('health');
    const draft = M.evaluateChange(intent('I want a bigger back'), getState(), {});
    expect(draft.needs).toBe('split');
  });
  it('a gated proposal is applied as a new split version, and re-checked on accept', () => {
    A.completeSetup('health');
    A.updateProfile({ goal: 'muscle_gain' });
    A.chooseSplit('sample');
    const draft = M.evaluateChange(intent('I want a bigger back'), getState(), { requestText: 'I want a bigger back' });
    expect(draft.status).toBe('proposed');
    const id = A.createRecommendation(draft, { requestText: 'I want a bigger back' });
    const res = A.acceptRecommendation(id);
    expect(res.ok).toBe(true);
    expect(getState().split!.current).toBe(2);
    expect(getState().split!.versions[1].origin).toBe('app_recommendation');
    expect(A.acceptRecommendation(id).ok).toBe(false);
  });
  it('a proposal made for an older split version is superseded', () => {
    A.completeSetup('health');
    A.updateProfile({ goal: 'muscle_gain' });
    A.chooseSplit('sample');
    const draft = M.evaluateChange(intent('I want a bigger back'), getState(), {});
    const id = A.createRecommendation(draft, {});
    A.saveSplitEdit(getState().split!.versions[0].definition, 'my edit');
    expect(A.acceptRecommendation(id)).toEqual({ ok: false, reason: 'superseded' });
  });
  it('saves why a suggestion was withdrawn at Apply', () => {
    A.completeSetup('health');
    A.updateProfile({ goal: 'muscle_gain' });
    A.chooseSplit('sample');
    const draft = M.evaluateChange(intent('I want a bigger back'), getState(), {});
    const id = A.createRecommendation(draft, {});
    useApp.setState((s) => ({ setup: { ...s.setup, health: false } }));
    expect(A.acceptRecommendation(id)).toEqual({ ok: false, reason: 'needs_health' });
    const rec = getState().recommendations.find((r) => r.id === id)!;
    expect(rec.status).toBe('withdrawn');
    expect(rec.withdrawnReason).toBe('needs_health');
  });
  it('pregnancy pauses training suggestions', () => {
    A.completeSetup('health');
    A.updateProfile({ goal: 'muscle_gain', safetyFlags: ['pregnancy'] });
    A.chooseSplit('sample');
    expect(M.evaluateChange(intent('I want a bigger back'), getState(), {}).status).toBe('blocked_safety');
  });
  it('logs food with nutrients scaled to the amount', () => {
    const oats = M.findFood('g-oats', []);
    A.logFood({ food: oats, grams: 60, meal: 'breakfast' });
    const e = getState().foodLog[0];
    expect(Math.round(e.nutrients.energyKcal!)).toBe(227);
    expect(e.meal).toBe('breakfast');
  });
  it('erases everything', () => {
    A.completeOnboarding({ goal: 'strength' });
    A.eraseAll();
    expect(getState().onboarded).toBe(false);
  });
});

describe('readiness from Apple Health series', () => {
  const series = (n: number, last: number, base = 60) => ({ unit: 'ms', label: 'HRV (SDNN)', points: Array.from({ length: n }, (_, i) => ({ daysAgo: n - 1 - i, value: i === n - 1 ? last : base + ((i % 3) - 1) * 4 })) });
  it('is unknown with fewer than 14 nights of baseline', () => {
    const s = { ...freshState(), devices: { apple_health: { status: 'active' as const, connectedAt: 1, lastSync: 1, dataTypes: { hrv: true, resting_hr: true, sleep: true } } }, wearableSeries: { apple_health: { hrv_sdnn_ms: series(10, 40) } } };
    expect(M.readiness(s).level).toBe('unknown');
  });
  it('reads a low HRV night against the person’s own baseline', () => {
    const s = { ...freshState(), devices: { apple_health: { status: 'active' as const, connectedAt: 1, lastSync: 1, dataTypes: { hrv: true, resting_hr: true, sleep: true } } }, wearableSeries: { apple_health: { hrv_sdnn_ms: series(30, 40) } } };
    const r = M.readiness(s);
    expect(r.provider).toBe('apple_health');
    expect(['reduced', 'low']).toContain(r.level);
  });
});
