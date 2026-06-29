import { useState, useEffect, useCallback } from 'react';
import type { Workspace } from './utils/types';
import { seedStudentsIfNeeded } from './utils/seed';
import { fullSync } from './utils/sync';
import { isAuthenticated, recordActivity, logout, isSetUp } from './utils/auth';
import * as store from './utils/store';
import Login from './pages/Login';
import MSGDashboard from './pages/MSGDashboard';
import Students from './pages/Students';
import Donors from './pages/Donors';
import Reports from './pages/Reports';
import ZerenityDashboard from './pages/ZerenityDashboard';
import Patients from './pages/Patients';
import TaskBoard from './pages/TaskBoard';
import SocialMedia from './pages/SocialMedia';
import Integrations from './pages/Integrations';
import AIAssistant from './pages/AIAssistant';

type Page = string;

const msgBottom = [
  { page: 'dashboard', label: 'Home', emoji: '🏠' },
  { page: 'students', label: 'Students', emoji: '🎓' },
  { page: 'ai', label: 'AI', emoji: '🤖' },
  { page: 'tasks', label: 'Tasks', emoji: '✅' },
  { page: 'more', label: 'More', emoji: '☰' },
];
const zwcBottom = [
  { page: 'dashboard', label: 'Home', emoji: '🏠' },
  { page: 'patients', label: 'Patients', emoji: '🩺' },
  { page: 'ai', label: 'AI', emoji: '🤖' },
  { page: 'tasks', label: 'Tasks', emoji: '✅' },
  { page: 'more', label: 'More', emoji: '☰' },
];
const msgSidebar = [
  { s: 'OVERVIEW' }, { page: 'dashboard', label: 'Dashboard', emoji: '🏠' },
  { s: 'MANAGEMENT' }, { page: 'students', label: 'Students & Mentorship', emoji: '🎓' },
  { page: 'donors', label: 'Donors & Trustees', emoji: '🤝' },
  { page: 'tasks', label: 'Tasks', emoji: '✅' },
  { s: 'REPORTING' }, { page: 'reports', label: 'Reports & Daily Log', emoji: '📝' },
  { page: 'social', label: 'Social Media', emoji: '📱' },
  { s: 'AI & SYSTEM' }, { page: 'ai', label: 'AI Assistant', emoji: '🤖' },
  { page: 'integrations', label: 'Integrations & Sync', emoji: '🔗' },
];
const zwcSidebar = [
  { s: 'OVERVIEW' }, { page: 'dashboard', label: 'Dashboard', emoji: '🏠' },
  { s: 'MANAGEMENT' }, { page: 'patients', label: 'Patients', emoji: '🩺' },
  { page: 'tasks', label: 'Tasks', emoji: '✅' },
  { s: 'REPORTING' }, { page: 'reports', label: 'Reports & Daily Log', emoji: '📝' },
  { page: 'social', label: 'Social Media', emoji: '📱' },
  { s: 'AI & SYSTEM' }, { page: 'ai', label: 'AI Assistant', emoji: '🤖' },
  { page: 'integrations', label: 'Integrations & Sync', emoji: '🔗' },
];

export default function App() {
  // Auth state
  const [authed, setAuthed] = useState<boolean | null>(null); // null = checking

  // Check auth on mount
  useEffect(() => {
    // If PIN not set up yet, go to setup. If set up, check session.
    if (!isSetUp()) {
      setAuthed(false);
    } else {
      setAuthed(isAuthenticated());
    }
  }, []);

  // Track activity for auto-lock
  useEffect(() => {
    if (!authed) return;
    const handleActivity = () => recordActivity();
    const events = ['click', 'touchstart', 'keydown', 'scroll'];
    events.forEach(e => window.addEventListener(e, handleActivity, { passive: true }));

    // Check every minute if session expired
    const interval = setInterval(() => {
      if (!isAuthenticated()) {
        setAuthed(false);
      }
    }, 60000);

    return () => {
      events.forEach(e => window.removeEventListener(e, handleActivity));
      clearInterval(interval);
    };
  }, [authed]);

  function handleLoginSuccess() {
    setAuthed(true);
  }

  // Show loading
  if (authed === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⚡</div>
          <p className="text-white font-bold text-lg">WorkHub</p>
          <p className="text-slate-500 text-sm mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!authed) {
    return <Login onSuccess={handleLoginSuccess} />;
  }

  // Authenticated — show main app
  return <MainApp />;
}

// ═══════════════════════════════════════
// Main App (only rendered when authed)
// ═══════════════════════════════════════
function MainApp() {
  const [ws, setWs] = useState<Workspace>(() => (localStorage.getItem('wh_ws') as Workspace) || 'msg');
  const [page, setPage] = useState<Page>('dashboard');
  const [sidebar, setSidebar] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'done' | 'off'>('idle');
  const [showLockConfirm, setShowLockConfirm] = useState(false);

  useEffect(() => { localStorage.setItem('wh_ws', ws); }, [ws]);

  // Seed + initial sync
  useEffect(() => {
    seedStudentsIfNeeded();
    const s = store.getSettings();
    if (s.syncEnabled && s.firebaseUrl?.trim()) {
      setSyncStatus('syncing');
      fullSync(s.firebaseUrl).then((r) => {
        setSyncStatus(r.synced ? 'done' : 'idle');
      }).catch(() => setSyncStatus('idle'));
    } else {
      setSyncStatus('off');
    }
    const interval = setInterval(() => {
      const ss = store.getSettings();
      if (ss.syncEnabled && ss.firebaseUrl?.trim()) {
        fullSync(ss.firebaseUrl).then((r) => {
          if (r.synced) setSyncStatus('done');
        }).catch(() => {});
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const switchWs = useCallback((w: Workspace) => { setWs(w); setPage('dashboard'); setSidebar(false); setMoreOpen(false); }, []);
  const nav = useCallback((p: Page) => { setPage(p); setSidebar(false); setMoreOpen(false); }, []);

  function handleLock() {
    logout();
    window.location.reload();
  }

  const bottomNav = ws === 'msg' ? msgBottom : zwcBottom;
  const sidebarItems = ws === 'msg' ? msgSidebar : zwcSidebar;
  const moreItems = ws === 'msg'
    ? [{ page: 'donors', label: 'Donors & Trustees', emoji: '🤝' }, { page: 'reports', label: 'Reports', emoji: '📝' }, { page: 'social', label: 'Social Media', emoji: '📱' }, { page: 'integrations', label: 'Integrations', emoji: '🔗' }]
    : [{ page: 'reports', label: 'Reports', emoji: '📝' }, { page: 'social', label: 'Social Media', emoji: '📱' }, { page: 'integrations', label: 'Integrations', emoji: '🔗' }];

  const accent = ws === 'msg' ? 'blue' : 'emerald';

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {sidebar && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebar(false)} />}

      {/* Lock confirmation */}
      {showLockConfirm && (
        <>
          <div className="fixed inset-0 bg-black/70 z-[60]" onClick={() => setShowLockConfirm(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[61] bg-slate-800 rounded-2xl p-6 w-[90vw] max-w-xs shadow-2xl border border-slate-700 animate-fadeIn">
            <p className="text-white font-bold text-center mb-2">🔒 Lock App?</p>
            <p className="text-slate-400 text-sm text-center mb-5">You'll need your PIN to unlock again.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLockConfirm(false)} className="flex-1 py-2.5 bg-slate-700 text-white rounded-xl text-sm font-semibold active:scale-95">Cancel</button>
              <button onClick={handleLock} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold active:scale-95">Lock</button>
            </div>
          </div>
        </>
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800/50 flex flex-col transition-transform duration-300 ${sidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-4 border-b border-slate-800/50 flex items-center justify-between">
          <div><p className="text-white font-bold">⚡ WorkHub</p><p className="text-[10px] text-slate-500">Workflow & Automation</p></div>
          <button onClick={() => setSidebar(false)} className="lg:hidden text-slate-500 text-lg">✕</button>
        </div>
        <div className="p-3 border-b border-slate-800/50">
          <div className="flex gap-1 bg-slate-800 rounded-xl p-1">
            <button onClick={() => switchWs('msg')} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${ws === 'msg' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>🎓 MSG</button>
            <button onClick={() => switchWs('zerenity')} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${ws === 'zerenity' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>🧠 Zerenity</button>
          </div>
        </div>
        <nav className="flex-1 p-3 overflow-y-auto space-y-0.5">
          {sidebarItems.map((item, i) => 's' in item ? (
            <p key={i} className="text-[10px] font-bold text-slate-600 tracking-wider uppercase mt-4 mb-1.5 px-3">{item.s}</p>
          ) : (
            <button key={item.page} onClick={() => nav(item.page!)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${page === item.page ? `bg-${accent}-600/20 text-white` : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
              <span>{item.emoji}</span> {item.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-800/50 space-y-2">
          <div className="flex items-center gap-2 text-[10px] text-slate-600">
            <span className={`w-2 h-2 rounded-full ${syncStatus === 'done' || syncStatus === 'syncing' ? 'bg-emerald-400' : syncStatus === 'off' ? 'bg-slate-600' : 'bg-amber-400'}`} />
            {syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'done' ? 'Cloud synced' : syncStatus === 'off' ? 'Local only' : 'Ready'}
          </div>
          <button onClick={() => setShowLockConfirm(true)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
            🔒 Lock App
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/50">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebar(true)} className="lg:hidden text-slate-400 hover:text-white text-xl p-1">☰</button>
              <div className="lg:hidden flex gap-1 bg-slate-800/80 rounded-lg p-0.5">
                <button onClick={() => switchWs('msg')} className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${ws === 'msg' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>🎓 MSG</button>
                <button onClick={() => switchWs('zerenity')} className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${ws === 'zerenity' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>🧠 ZWC</button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 hidden sm:block">{new Date().toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
              <span className={`w-2 h-2 rounded-full ${syncStatus === 'done' ? 'bg-emerald-400' : syncStatus === 'syncing' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} title={syncStatus === 'done' ? 'Synced' : syncStatus === 'off' ? 'Local only' : 'Syncing'} />
              <button onClick={() => setShowLockConfirm(true)} className="text-slate-500 hover:text-red-400 p-1 transition-colors" title="Lock app">🔒</button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pb-20 lg:pb-4">
          <div className="p-4 sm:p-6 max-w-5xl mx-auto">
            {ws === 'msg' && page === 'dashboard' && <MSGDashboard onNav={nav} />}
            {ws === 'msg' && page === 'students' && <Students />}
            {ws === 'msg' && page === 'donors' && <Donors />}
            {ws === 'msg' && page === 'tasks' && <TaskBoard workspace="msg" />}
            {ws === 'msg' && page === 'reports' && <Reports workspace="msg" />}
            {ws === 'msg' && page === 'social' && <SocialMedia workspace="msg" />}
            {ws === 'zerenity' && page === 'dashboard' && <ZerenityDashboard onNav={nav} />}
            {ws === 'zerenity' && page === 'patients' && <Patients />}
            {ws === 'zerenity' && page === 'tasks' && <TaskBoard workspace="zerenity" />}
            {ws === 'zerenity' && page === 'reports' && <Reports workspace="zerenity" />}
            {ws === 'zerenity' && page === 'social' && <SocialMedia workspace="zerenity" />}
            {page === 'ai' && <AIAssistant />}
            {page === 'integrations' && <Integrations />}
          </div>
        </div>

        {/* Bottom Nav */}
        <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/50 z-30 safe-area-pb">
          <div className="flex items-center justify-around py-1 px-1 max-w-lg mx-auto">
            {bottomNav.map(item => (
              <button key={item.page} onClick={() => { if (item.page === 'more') setMoreOpen(!moreOpen); else { nav(item.page); setMoreOpen(false); } }}
                className={`flex flex-col items-center gap-0.5 py-2 px-2 rounded-xl min-w-[52px] transition-all active:scale-90 ${page === item.page && item.page !== 'more' ? `text-${accent}-400` : 'text-slate-500'}`}>
                <span className="text-lg leading-none">{item.emoji}</span>
                <span className="text-[9px] font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {moreOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />
            <div className="fixed bottom-16 right-4 z-50 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-2 min-w-[200px] animate-slideUp">
              {moreItems.map(item => (
                <button key={item.page} onClick={() => nav(item.page)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all text-left active:scale-95">
                  <span>{item.emoji}</span> {item.label}
                </button>
              ))}
              {/* Lock in more menu too */}
              <button onClick={() => { setMoreOpen(false); setShowLockConfirm(true); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-all text-left active:scale-95">
                <span>🔒</span> Lock App
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
