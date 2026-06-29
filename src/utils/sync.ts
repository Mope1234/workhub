// Firebase Realtime Database REST sync — no SDK needed, works everywhere
import { DEFAULT_SETTINGS } from './types';

// Read config from localStorage
function getConfig(): { url: string; enabled: boolean } {
  try {
    const s = localStorage.getItem('app_settings');
    if (s) {
      const p = JSON.parse(s);
      return { url: (p.firebaseUrl || '').trim(), enabled: !!p.syncEnabled && !!(p.firebaseUrl || '').trim() };
    }
  } catch { /* */ }
  return { url: '', enabled: false };
}

function buildUrl(baseUrl: string, path: string): string | null {
  if (!baseUrl) return null;
  const base = baseUrl.trim().replace(/\/+$/, '');
  return `${base}/workhub/${path}.json`;
}

export async function pushToCloud(collection: string, data: unknown): Promise<boolean> {
  const { enabled, url } = getConfig();
  if (!enabled || !url) return false;
  const endpoint = buildUrl(url, collection);
  if (!endpoint) return false;
  try {
    const res = await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, updatedAt: new Date().toISOString() }),
    });
    return res.ok;
  } catch { return false; }
}

export async function pullFromCloud<T>(baseUrl: string, collection: string): Promise<{ data: T; updatedAt: string } | null> {
  const endpoint = buildUrl(baseUrl, collection);
  if (!endpoint) return null;
  try {
    const res = await fetch(endpoint);
    if (!res.ok) return null;
    const json = await res.json();
    if (!json || !json.data) return null;
    return { data: json.data as T, updatedAt: json.updatedAt || '' };
  } catch { return null; }
}

// Test with explicit URL — does NOT require settings to be saved first
export async function testConnection(explicitUrl?: string): Promise<{ ok: boolean; error?: string }> {
  const url = explicitUrl?.trim() || getConfig().url;
  if (!url) return { ok: false, error: 'Please enter your Firebase Database URL above first.' };

  const endpoint = buildUrl(url, '_test');
  if (!endpoint) return { ok: false, error: 'Invalid URL format.' };

  try {
    const res = await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true, at: new Date().toISOString() }),
    });
    if (res.ok) return { ok: true };
    if (res.status === 401) return { ok: false, error: 'Permission denied. Make sure your database rules allow read/write.' };
    if (res.status === 404) return { ok: false, error: 'Database not found. Check your URL.' };
    return { ok: false, error: `Server returned HTTP ${res.status}. Check your URL and database rules.` };
  } catch (e) {
    const msg = String(e);
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
      return { ok: false, error: 'Network error. Check your internet connection and that the URL is correct (should start with https://).' };
    }
    return { ok: false, error: `Connection failed: ${msg}` };
  }
}

// Full sync with explicit URL support
export async function fullSync(explicitUrl?: string): Promise<{ synced: boolean; collections: number; errors: string[] }> {
  const url = explicitUrl?.trim() || getConfig().url;
  const enabled = explicitUrl ? true : getConfig().enabled;
  if (!enabled || !url) return { synced: false, collections: 0, errors: ['Sync not configured'] };

  const collections = [
    'msg_students', 'msg_mentorship', 'msg_donors', 'msg_logs', 'msg_expenses',
    'msg_tasks', 'msg_posts', 'zwc_patients', 'zwc_tasks', 'zwc_posts',
    'zwc_logs', 'zwc_expenses', 'app_settings',
  ];
  let count = 0;
  const errors: string[] = [];

  for (const col of collections) {
    try {
      const localRaw = localStorage.getItem(col);
      const localData = localRaw ? JSON.parse(localRaw) : (col === 'app_settings' ? DEFAULT_SETTINGS : []);
      const localTs = localStorage.getItem(`${col}_ts`) || '';

      const cloud = await pullFromCloud(url, col);
      if (cloud && cloud.updatedAt > localTs) {
        // Cloud is newer — use cloud data
        localStorage.setItem(col, JSON.stringify(cloud.data));
        localStorage.setItem(`${col}_ts`, cloud.updatedAt);
        count++;
      } else {
        // Local is newer or same — push to cloud
        const endpoint = buildUrl(url, col);
        if (endpoint) {
          const res = await fetch(endpoint, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: localData, updatedAt: new Date().toISOString() }),
          });
          if (res.ok) {
            localStorage.setItem(`${col}_ts`, new Date().toISOString());
            count++;
          } else {
            errors.push(`${col}: HTTP ${res.status}`);
          }
        }
      }
    } catch (e) {
      errors.push(`${col}: ${String(e)}`);
    }
  }

  // Update last sync time
  try {
    const s = localStorage.getItem('app_settings');
    if (s) {
      const settings = JSON.parse(s);
      settings.lastSyncAt = new Date().toISOString();
      localStorage.setItem('app_settings', JSON.stringify(settings));
    }
  } catch { /* */ }

  return { synced: count > 0, collections: count, errors };
}
