/* On the iPhone, the app's data is one JSON file in the app's Documents
   folder. iOS encrypts it with the device passcode (the Data Protection
   entitlement in app.json sets NSFileProtectionComplete). It never leaves the
   device unless the person exports it, and nothing read from Apple Health is
   saved here (see PERSISTED in ./index.ts): HealthKit stays the only copy.
   Writes go to a temporary file first, then replace the old one, so a crash
   mid-write can't corrupt it. */
import { File, Paths } from 'expo-file-system';

const NAME = 'companion-state.json';

export function loadSaved(): unknown | null {
  try {
    const f = new File(Paths.document, NAME);
    if (!f.exists) return null;
    return JSON.parse(f.textSync());
  } catch {
    return null;
  }
}

export function saveNow(json: string) {
  try {
    const tmp = new File(Paths.document, `${NAME}.tmp`);
    if (tmp.exists) tmp.delete();
    tmp.create();
    tmp.write(json);
    tmp.moveSync(new File(Paths.document, NAME), { overwrite: true });
  } catch {
    /* Storage failures must not crash the app; the next change retries. */
  }
}

export function eraseSaved() {
  try {
    const f = new File(Paths.document, NAME);
    if (f.exists) f.delete();
  } catch {
    /* nothing to erase */
  }
}
