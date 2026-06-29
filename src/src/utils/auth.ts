// PIN-based authentication with fallback hash for non-HTTPS environments

const AUTH_KEY = 'wh_auth';
const SESSION_KEY = 'wh_session';
const LOCK_KEY = 'wh_lock_ts';
const LOCK_TIMEOUT = 15 * 60 * 1000; // 15 min auto-lock

// Hash function with fallback for environments without crypto.subtle
function hashPin(pin: string): string {
  const salt = 'workhub_2026_secure';
  const str = pin + salt;
  // djb2 + fnv1a combined hash — deterministic, works everywhere
  let h1 = 5381;
  let h2 = 2166136261;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h1 = ((h1 << 5) + h1 + c) >>> 0;
    h2 = ((h2 ^ c) * 16777619) >>> 0;
  }
  // Do multiple rounds for extra security
  for (let round = 0; round < 1000; round++) {
    h1 = ((h1 << 5) + h1 + h2 + round) >>> 0;
    h2 = ((h2 ^ h1) * 16777619) >>> 0;
  }
  return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0') + 
         (h1 ^ h2).toString(16).padStart(8, '0') + ((h1 + h2) >>> 0).toString(16).padStart(8, '0');
}

export function isSetUp(): boolean {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return false;
    const auth = JSON.parse(raw);
    return !!auth.pinHash;
  } catch { return false; }
}

export function setupPin(pin: string): boolean {
  if (pin.length < 4) return false;
  const pinHash = hashPin(pin);
  const auth = { pinHash, createdAt: new Date().toISOString() };
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  syncAuthToCloud(auth);
  createSession();
  return true;
}

export function verifyPin(pin: string): boolean {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return false;
    const auth = JSON.parse(raw);
    const inputHash = hashPin(pin);
    if (inputHash === auth.pinHash) {
      createSession();
      return true;
    }
    return false;
  } catch { return false; }
}

export function isAuthenticated(): boolean {
  const session = sessionStorage.getItem(SESSION_KEY);
  if (!session) return false;
  const lastActivity = localStorage.getItem(LOCK_KEY);
  if (lastActivity) {
    const elapsed = Date.now() - parseInt(lastActivity, 10);
    if (elapsed > LOCK_TIMEOUT) {
      logout();
      return false;
    }
  }
  return true;
}

export function recordActivity() {
  localStorage.setItem(LOCK_KEY, Date.now().toString());
}

function createSession() {
  const token = Date.now().toString(36) + Math.random().toString(36).slice(2);
  sessionStorage.setItem(SESSION_KEY, token);
  recordActivity();
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function changePin(currentPin: string, newPin: string): { ok: boolean; error?: string } {
  if (newPin.length < 4) return { ok: false, error: 'PIN must be at least 4 characters' };
  const verified = verifyPin(currentPin);
  if (!verified) return { ok: false, error: 'Current PIN is incorrect' };
  const pinHash = hashPin(newPin);
  const auth = { pinHash, createdAt: new Date().toISOString() };
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  syncAuthToCloud(auth);
  createSession();
  return { ok: true };
}

export function resetAuth() {
  localStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

function syncAuthToCloud(auth: { pinHash: string; createdAt: string }) {
  try {
    const settingsRaw = localStorage.getItem('app_settings');
    if (!settingsRaw) return;
    const settings = JSON.parse(settingsRaw);
    if (!settings.syncEnabled || !settings.firebaseUrl?.trim()) return;
    const url = settings.firebaseUrl.trim().replace(/\/+$/, '');
    fetch(`${url}/workhub/auth.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: auth, updatedAt: new Date().toISOString() }),
    }).catch(() => {});
  } catch { /* silent */ }
}

export async function pullAuthFromCloud(): Promise<boolean> {
  try {
    const settingsRaw = localStorage.getItem('app_settings');
    if (!settingsRaw) return false;
    const settings = JSON.parse(settingsRaw);
    if (!settings.firebaseUrl?.trim()) return false;
    const url = settings.firebaseUrl.trim().replace(/\/+$/, '');
    const res = await fetch(`${url}/workhub/auth.json`);
    if (!res.ok) return false;
    const json = await res.json();
    if (json?.data?.pinHash) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(json.data));
      return true;
    }
    return false;
  } catch { return false; }
}
