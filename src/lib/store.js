// Local-only storage: profile, settings, exam history.
// Nothing here is sent anywhere — all keys live in the browser's localStorage.
const KEYS = {
  profile: 'sp-exam:profile:v1',
  settings: 'sp-exam:settings:v1',
  history: 'sp-exam:history:v1',
};

export const DEFAULT_SETTINGS = {
  negative: 0.25, // 0 | 0.25
  durationMin: 25,
  count: 10,
  theme: 'system', // light | dark | system
};

export const DEFAULT_PROFILE = { name: '', target: 'HSC', phone: '' };

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}
function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full / private mode — settings simply won't persist.
  }
}

export function loadSettings() {
  return readJSON(KEYS.settings, DEFAULT_SETTINGS);
}
export function saveSettings(s) {
  const next = { ...DEFAULT_SETTINGS, ...s };
  writeJSON(KEYS.settings, next);
  return next;
}

export function loadProfile() {
  return readJSON(KEYS.profile, DEFAULT_PROFILE);
}
export function saveProfile(p) {
  const next = { ...DEFAULT_PROFILE, ...p };
  writeJSON(KEYS.profile, next);
  return next;
}

export function loadHistory() {
  try {
    const raw = localStorage.getItem(KEYS.history);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
export function recordResult(entry) {
  const history = loadHistory();
  history.unshift({ ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` });
  writeJSON(KEYS.history, history.slice(0, 100));
  return history;
}
export function clearHistory() {
  try {
    localStorage.removeItem(KEYS.history);
  } catch {
    // ignore
  }
}

/** Apply the theme to <html>: 'light' | 'dark' | 'system'. */
export function applyTheme(theme) {
  const root = document.documentElement;
  const prefersDark =
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false;
  const dark = theme === 'dark' || (theme === 'system' && prefersDark);
  root.classList.toggle('dark', dark);
  root.style.colorScheme = dark ? 'dark' : 'light';
}
