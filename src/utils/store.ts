import type { Student, MentorshipSession, Donor, DailyLog, Expense, Task, Patient, SocialPost, AppSettings, Workspace } from './types';
import { DEFAULT_SETTINGS } from './types';
import { pushToCloud } from './sync';

function load<T>(key: string): T[] { try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : []; } catch { return []; } }
function save<T>(key: string, d: T[]) { localStorage.setItem(key, JSON.stringify(d)); localStorage.setItem(`${key}_ts`, new Date().toISOString()); pushToCloud(key, d).catch(() => {}); }

export function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
export function todayISO() { return new Date().toISOString().split('T')[0]; }
export function formatDate(iso: string) { if (!iso) return '—'; try { return new Date(iso + 'T00:00:00').toLocaleDateString('en-NG', { day:'numeric', month:'short', year:'numeric' }); } catch { return iso; } }
export function daysUntil(iso: string) { if (!iso) return Infinity; return Math.ceil((new Date(iso+'T00:00:00').getTime() - new Date(todayISO()+'T00:00:00').getTime()) / 864e5); }
export function isOverdue(iso: string) { return !!iso && daysUntil(iso) < 0; }
export function isToday(iso: string) { return iso === todayISO(); }
export function isDueSoon(iso: string, n = 3) { const d = daysUntil(iso); return d >= 0 && d <= n; }
export function weekStart() { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d.toISOString().split('T')[0]; }
export function weekEnd() { const d = new Date(); d.setDate(d.getDate() + (6 - d.getDay())); return d.toISOString().split('T')[0]; }
export function currentMonth() { return String(new Date().getMonth() + 1).padStart(2, '0'); }

const K = { students: 'msg_students', mentorship: 'msg_mentorship', donors: 'msg_donors', logs: 'msg_logs', expenses: 'msg_expenses', msgTasks: 'msg_tasks', patients: 'zwc_patients', zwcTasks: 'zwc_tasks', msgPosts: 'msg_posts', zwcPosts: 'zwc_posts', zwcLogs: 'zwc_logs', zwcExpenses: 'zwc_expenses', settings: 'app_settings' };

function crud<T extends { id: string }>(key: string) {
  return {
    get: () => load<T>(key),
    save: (d: T[]) => save(key, d),
    add: (item: T) => { const a = load<T>(key); a.push(item); save(key, a); },
    update: (item: T) => save(key, load<T>(key).map(x => x.id === item.id ? item : x)),
    delete: (id: string) => save(key, load<T>(key).filter(x => x.id !== id)),
  };
}

export const students = crud<Student>(K.students);
export const mentorship = crud<MentorshipSession>(K.mentorship);
export const donors = crud<Donor>(K.donors);
export const patientsStore = crud<Patient>(K.patients);

// Workspace-scoped stores
export function getLogs(ws: Workspace): DailyLog[] { return load<DailyLog>(ws === 'msg' ? K.logs : K.zwcLogs); }
export function saveLogs(ws: Workspace, d: DailyLog[]) { save(ws === 'msg' ? K.logs : K.zwcLogs, d); }
export function addLog(ws: Workspace, l: DailyLog) { const a = getLogs(ws); a.unshift(l); saveLogs(ws, a); }
export function updateLog(ws: Workspace, l: DailyLog) { saveLogs(ws, getLogs(ws).map(x => x.id === l.id ? l : x)); }
export function deleteLog(ws: Workspace, id: string) { saveLogs(ws, getLogs(ws).filter(x => x.id !== id)); }

export function getExpenses(ws: Workspace): Expense[] { return load<Expense>(ws === 'msg' ? K.expenses : K.zwcExpenses); }
export function saveExpenses(ws: Workspace, d: Expense[]) { save(ws === 'msg' ? K.expenses : K.zwcExpenses, d); }
export function addExpense(ws: Workspace, e: Expense) { const a = getExpenses(ws); a.push(e); saveExpenses(ws, a); }
export function deleteExpense(ws: Workspace, id: string) { saveExpenses(ws, getExpenses(ws).filter(x => x.id !== id)); }

export function getTasks(ws: Workspace): Task[] { return load<Task>(ws === 'msg' ? K.msgTasks : K.zwcTasks); }
export function saveTasks(ws: Workspace, d: Task[]) { save(ws === 'msg' ? K.msgTasks : K.zwcTasks, d); }
export function addTask(ws: Workspace, t: Task) { const a = getTasks(ws); a.push(t); saveTasks(ws, a); }
export function updateTask(ws: Workspace, t: Task) { saveTasks(ws, getTasks(ws).map(x => x.id === t.id ? t : x)); }
export function deleteTask(ws: Workspace, id: string) { saveTasks(ws, getTasks(ws).filter(x => x.id !== id)); }

export function getPosts(ws: Workspace): SocialPost[] { return load<SocialPost>(ws === 'msg' ? K.msgPosts : K.zwcPosts); }
export function savePosts(ws: Workspace, d: SocialPost[]) { save(ws === 'msg' ? K.msgPosts : K.zwcPosts, d); }
export function addPost(ws: Workspace, p: SocialPost) { const a = getPosts(ws); a.unshift(p); savePosts(ws, a); }
export function updatePost(ws: Workspace, p: SocialPost) { savePosts(ws, getPosts(ws).map(x => x.id === p.id ? p : x)); }
export function deletePost(ws: Workspace, id: string) { savePosts(ws, getPosts(ws).filter(x => x.id !== id)); }

export function getSettings(): AppSettings { try { const d = localStorage.getItem(K.settings); return d ? { ...DEFAULT_SETTINGS, ...JSON.parse(d) } : DEFAULT_SETTINGS; } catch { return DEFAULT_SETTINGS; } }
export function saveSettings(s: AppSettings) { localStorage.setItem(K.settings, JSON.stringify(s)); localStorage.setItem(`${K.settings}_ts`, new Date().toISOString()); pushToCloud(K.settings, s as unknown as never).catch(() => {}); }
