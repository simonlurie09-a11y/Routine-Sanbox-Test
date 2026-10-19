jest.mock('@kingstinct/react-native-healthkit', () => ({
  CategoryValueSleepAnalysis: { inBed: 0, asleepUnspecified: 1, asleep: 1, awake: 2, asleepCore: 3, asleepDeep: 4, asleepREM: 5 }
}));
import { nightlySleep } from '@/services/health';

const at = (d: string) => new Date(d);
describe('nightly sleep from HealthKit samples', () => {
  const now = at('2026-10-15T12:00:00').getTime();
  it('merges overlapping samples from two sources and ignores awake and in-bed time', () => {
    const samples = [
      { startDate: at('2026-10-14T23:00:00'), endDate: at('2026-10-15T03:00:00'), value: 3 },
      { startDate: at('2026-10-15T02:00:00'), endDate: at('2026-10-15T06:30:00'), value: 4 },
      { startDate: at('2026-10-15T06:30:00'), endDate: at('2026-10-15T07:00:00'), value: 2 },
      { startDate: at('2026-10-14T22:30:00'), endDate: at('2026-10-15T07:00:00'), value: 0 },
      /* the watch and the phone record the same stretch */
      { startDate: at('2026-10-14T23:00:00'), endDate: at('2026-10-15T06:30:00'), value: 1 }
    ];
    expect(nightlySleep(samples, now)).toEqual([{ daysAgo: 0, value: 450 }]);
  });
  it('drops naps under an hour and orders nights oldest first', () => {
    const samples = [
      { startDate: at('2026-10-13T23:00:00'), endDate: at('2026-10-14T06:00:00'), value: 3 },
      { startDate: at('2026-10-15T13:00:00'), endDate: at('2026-10-15T13:20:00'), value: 3 },
      { startDate: at('2026-10-14T23:30:00'), endDate: at('2026-10-15T07:00:00'), value: 5 }
    ];
    expect(nightlySleep(samples, now).map((p) => p.daysAgo)).toEqual([1, 0]);
  });
});
