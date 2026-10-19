/* "Export your data": everything the app holds, as one JSON file, through the
   iOS share sheet (save to Files, AirDrop, mail). Nothing is uploaded by us. */
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { data as D } from '@/shared';
import { getState } from '@/store';

export function exportPayload() {
  const s = getState();
  return {
    exportedAt: new Date().toISOString(),
    app: 'Companion',
    disclaimer: { version: D.DISCLAIMER.version, text: D.DISCLAIMER.full, acknowledgedAt: s.disclaimerAcknowledgedAt },
    profile: s.profile, consents: s.consents, setup: s.setup, targets: s.targets,
    foodLog: s.foodLog, customFoods: s.customFoods, split: s.split, sessions: s.sessions,
    recommendations: s.recommendations, appleHealth: s.devices.apple_health,
    note: 'Data read from Apple Health is not stored by Companion and is not in this file; it stays in the Health app.'
  };
}

export async function shareExport(): Promise<'shared' | 'unavailable'> {
  const json = JSON.stringify(exportPayload(), null, 2);
  if (Platform.OS === 'web') return 'unavailable';
  const day = new Date().toISOString().slice(0, 10);
  const file = new File(Paths.cache, `companion-export-${day}.json`);
  if (file.exists) file.delete();
  file.create();
  file.write(json);
  if (!(await Sharing.isAvailableAsync())) return 'unavailable';
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Export your data', UTI: 'public.json' });
  return 'shared';
}
