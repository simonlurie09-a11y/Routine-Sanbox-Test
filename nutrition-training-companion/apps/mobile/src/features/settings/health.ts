/* Connecting Apple Health after sign-up (from Settings or Finish setting up).
   It fills in only what the profile doesn't have yet, so nothing the person
   typed is replaced. A date of birth that says they're under 18 stops it, as
   at sign-up: reading stops at once and nothing from Health is kept. */
import { ADULT_AGE, ageOn } from '@/features/signup/fields';
import type { HealthProfile } from '@/services/health';
import { disconnectAppleHealth } from '@/services/healthSync';
import { A, getState, type Profile } from '@/store';

export function applyHealthProfile(h: HealthProfile | null): { minor: boolean; filled: string[] } {
  if (!h) return { minor: false, filled: [] };
  if (h.birthDate && ageOn(h.birthDate) < ADULT_AGE) {
    disconnectAppleHealth();
    return { minor: true, filled: [] };
  }
  const s = getState();
  const p = s.profile;
  const patch: Partial<Profile> = {};
  const filled: string[] = [];
  const healthYear = h.birthDate ? Number(h.birthDate.slice(0, 4)) : null;
  if (h.birthDate && !p.birthDate && (p.birthYear == null || p.birthYear === healthYear)) {
    patch.birthDate = h.birthDate;
    patch.birthYear = healthYear;
    filled.push('date of birth');
  }
  if (h.heightCm && p.heightCm == null) {
    patch.heightCm = Math.round(h.heightCm.value);
    filled.push('height');
  }
  /* Sex only while "Height and sex" hasn't been answered ("Prefer not to say" is an answer). */
  if (h.sex && p.sexForEquations === 'unspecified' && !s.setup.body) {
    patch.sexForEquations = h.sex;
    filled.push('sex');
  }
  if (h.weightKg && p.weightKg == null) {
    patch.weightKg = Math.round(h.weightKg.value * 10) / 10;
    filled.push('weight');
  }
  if (filled.length) A.updateProfile(patch);
  if (patch.heightCm) A.completeSetup('body');
  return { minor: false, filled };
}
