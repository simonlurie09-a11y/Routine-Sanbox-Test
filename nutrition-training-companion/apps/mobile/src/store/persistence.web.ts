/* Web builds (previews, screenshots and tests) keep state in localStorage. */
const KEY = 'companion-app-state';

export function loadSaved(): unknown | null {
  try {
    const raw = globalThis.localStorage && globalThis.localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
export function saveNow(json: string) {
  try {
    if (globalThis.localStorage) globalThis.localStorage.setItem(KEY, json);
  } catch {
    /* private window or blocked storage: the app still works */
  }
}
export function eraseSaved() {
  try {
    if (globalThis.localStorage) globalThis.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
