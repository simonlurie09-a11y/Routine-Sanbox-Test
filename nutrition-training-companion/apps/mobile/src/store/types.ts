import type { Food, Nutrients } from '@/shared';

export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type SetupKey = 'health' | 'training' | 'split' | 'targets' | 'body' | 'devices';
export type TargetKey = 'energyKcal' | 'proteinG' | 'carbohydrateG' | 'fatG' | 'fiberG';
export type TargetValues = Record<TargetKey, number | null>;

export type Profile = {
  goal: string | null; heightCm: number | null; weightKg: number | null; weightUnit: 'kg' | 'lb';
  birthYear: number | null; birthDate: string | null; sexForEquations: 'female' | 'male' | 'unspecified';
  experience: 'novice' | 'intermediate' | 'advanced'; daysPerWeek: number; sessionMinutes: number; equipment: string[];
  safetyFlags: string[]; injuryRegions: string[]; healthNotes: string; splitSource: 'sample' | 'own' | null;
};
export type LogEntry = {
  id: string; at: number; meal: Meal; foodId: string; name: string; brand: string | null; grams: number;
  isBeverage: boolean; nutrients: Nutrients & { saltG?: number | null }; confidence: string; source: string;
};
export type SplitItem = { exercise: string; sets: number; repMin: number; repMax: number; rir: number; restS: number };
export type SplitDay = { key: string; label: string; weekday: number | null; items: SplitItem[] };
export type SplitDefinition = { style: string; days: SplitDay[] };
export type SplitVersion = { number: number; createdAt: number; origin: 'template' | 'user_edit' | 'app_recommendation' | 'import'; note: string; definition: SplitDefinition; recommendationId?: string };
export type Split = { name: string; current: number; versions: SplitVersion[] };
export type Session = { id: string; at: number; dayKey: string; version: number; sets: { exercise: string; setsDone: number }[]; rpe?: number | null; soreness?: number | null };
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
export type Recommendation = { id: string; createdAt: number; status: string; kind?: string; [k: string]: any };
export type DeviceStatus = 'active' | 'revoked' | 'pending' | 'paused' | 'needs_reauth' | 'error';
export type Device = { status: DeviceStatus; connectedAt: number | null; lastSync: number | null; dataTypes: Record<string, boolean> };
export type SeriesPoint = { daysAgo: number; value: number };
export type Series = { unit: string; label: string; points: SeriesPoint[] };

export type AppState = {
  version: 1;
  onboarded: boolean;
  profile: Profile;
  setup: Record<SetupKey, boolean>;
  consents: { health_data_processing: boolean };
  disclaimerAcknowledgedAt: number | null;
  targets: TargetValues & { history: { at: number; origin: string; values: TargetValues; recommendationId?: string }[] };
  customFoods: Food[];
  foodLog: LogEntry[];
  split: Split | null;
  recommendations: Recommendation[];
  sessions: Session[];
  devices: { apple_health: Device };
  /* Nightly series read from HealthKit, in the shape the readiness model expects. */
  wearableSeries: { apple_health?: Record<string, Series> };
  notificationsReadAt: number;
};
