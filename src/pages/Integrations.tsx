import { useState, useEffect, useCallback } from 'react';
import type { AppSettings } from '../utils/types';
import { DEFAULT_SETTINGS } from '../utils/types';
import * as store from '../utils/store';
import { fullSync, testConnection } from '../utils/sync';
import { changePin } from '../utils/auth';

export default function Integrations() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState('');

  useEffect(() => { setSettings(store.getSettings()); }, []);

  // Auto-save whenever settings change (debounced)
  const autoSave = useCallback((s: AppSettings) => {
    store.saveSettings(s);
  }, []);

  function updateSettings(partial: Partial<AppSettings>) {
    const next = { ...settings, ...partial };
    setSettings(next);
    autoSave(next);
  }

  function handleSave() {
    store.saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleTest() {
    // Always save current settings FIRST, then test
    store.saveSettings(settings);
    setTesting(true);
    setTestResult('');
    setSyncResult('');
    try {
      // Pass the URL directly so it doesn't depend on localStorage race conditions
      const r = await testConnection(settings.firebaseUrl);
      setTestResult(r.ok ? '✅ Connected successfully! You can now sync.' : `❌ ${r.error}`);
    } catch (e) { setTestResult(`❌ ${String(e)}`); }
    setTesting(false);
  }

  async function handleSync() {
    // Save settings first
    store.saveSettings(settings);
    if (!settings.firebaseUrl?.trim()) {
      setSyncResult('❌ Please enter your Firebase Database URL first.');
      return;
    }
    if (!settings.syncEnabled) {
      setSyncResult('❌ Please check "Enable cloud sync" first.');
      return;
    }
    setSyncing(true);
    setSyncResult('');
    setTestResult('');
    try {
      const r = await fullSync(settings.firebaseUrl);
      if (r.synced) {
        setSyncResult(`✅ Synced ${r.collections} collections!${r.errors.length > 0 ? ` (${r.errors.length} warnings)` : ''}`);
        // Reload settings in case cloud had newer version
        setSettings(store.getSettings());
      } else {
        setSyncResult(`❌ Sync failed. ${r.errors.join(', ')}`);
      }
    } catch (e) { setSyncResult(`❌ ${String(e)}`); }
    setSyncing(false);
  }

  function exportData() {
    const data = {
      msg_students: store.students.get(), msg_mentorship: store.mentorship.get(), msg_donors: store.donors.get(),
      msg_logs: store.getLogs('msg'), msg_expenses: store.getExpenses('msg'), msg_tasks: store.getTasks('msg'), msg_posts: store.getPosts('msg'),
      zwc_patients: store.patientsStore.get(), zwc_tasks: store.getTasks('zerenity'), zwc_posts: store.getPosts('zerenity'),
      zwc_logs: store.getLogs('zerenity'), zwc_expenses: store.getExpenses('zerenity'),
      settings: store.getSettings(), exportedAt: new Date().toISOString(),
    };
    const jsonStr = JSON.stringify(data, null, 2);
    try {
      // Method 1: Blob download
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workhub-backup-${store.todayISO()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      // Method 2: Copy to clipboard as fallback
      navigator.clipboard.writeText(jsonStr).then(() => {
        alert('Download blocked by browser. Data has been COPIED to your clipboard instead.\n\nPaste it into a text file and save as .json');
      }).catch(() => {
        // Method 3: Show in new window
        const win = window.open('', '_blank');
        if (win) {
          win.document.write('<pre>' + jsonStr.replace(/</g, '&lt;') + '</pre>');
          win.document.title = 'WorkHub Backup — Copy this text and save as .json';
        } else {
          alert('Please allow popups to export data, or use Firebase sync instead.');
        }
      });
    }
  }

  function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const d = JSON.parse(ev.target?.result as string);
          if (d.msg_students) store.students.save(d.msg_students);
          if (d.msg_mentorship) store.mentorship.save(d.msg_mentorship);
          if (d.msg_donors) store.donors.save(d.msg_donors);
          if (d.msg_logs) store.saveLogs('msg', d.msg_logs);
          if (d.msg_expenses) store.saveExpenses('msg', d.msg_expenses);
          if (d.msg_tasks) store.saveTasks('msg', d.msg_tasks);
          if (d.msg_posts) store.savePosts('msg', d.msg_posts);
          if (d.zwc_patients) store.patientsStore.save(d.zwc_patients);
          if (d.zwc_tasks) store.saveTasks('zerenity', d.zwc_tasks);
          if (d.zwc_posts) store.savePosts('zerenity', d.zwc_posts);
          if (d.zwc_logs) store.saveLogs('zerenity', d.zwc_logs);
          if (d.zwc_expenses) store.saveExpenses('zerenity', d.zwc_expenses);
          if (d.settings) { store.saveSettings(d.settings); setSettings(d.settings); }
          alert('✅ Imported! Refresh the page to see all changes.');
        } catch { alert('❌ Invalid file. Please select a WorkHub backup JSON file.'); }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  const syncConfigured = !!(settings.syncEnabled && settings.firebaseUrl?.trim());

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-xl font-bold text-white">🔗 Integrations & Settings</h1>
        <p className="text-slate-500 text-xs">Sync across devices, configure connections</p>
      </div>

      {/* ═══ SYNC ═══ */}
      <Sec title="☁️ Cross-Device Sync" desc="Access your data on any device — phone, tablet, or computer.">
        <div className="space-y-4">
          {/* Current Status */}
          <div className={`p-4 rounded-xl border ${syncConfigured ? 'bg-emerald-600/10 border-emerald-500/20' : 'bg-slate-800/50 border-slate-700/30'}`}>
            <div className="flex items-center gap-3 mb-2">
              <span className={`w-3 h-3 rounded-full ${syncConfigured ? 'bg-emerald-400' : 'bg-slate-600'}`} />
              <p className={`text-sm font-bold ${syncConfigured ? 'text-emerald-400' : 'text-slate-400'}`}>
                {syncConfigured ? '🟢 Sync Enabled' : 'Sync Not Set Up'}
              </p>
            </div>
            {settings.lastSyncAt && (
              <p className="text-slate-500 text-[10px] ml-6">Last synced: {new Date(settings.lastSyncAt).toLocaleString()}</p>
            )}
            {!syncConfigured && (
              <p className="text-slate-400 text-xs mt-2">Follow the 3 steps below to sync across all your devices.</p>
            )}
          </div>

          {/* Step 1 */}
          <div className="bg-slate-800/30 rounded-xl p-4">
            <p className="text-white text-sm font-bold mb-2">Step 1️⃣ — Create Free Firebase Database</p>
            <ol className="space-y-2 text-xs text-slate-400">
              <li className="flex gap-2">
                <span className="text-blue-400 font-bold flex-shrink-0">a.</span>
                Open <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline font-medium">console.firebase.google.com</a> (sign in with Google)
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400 font-bold flex-shrink-0">b.</span>
                Click <strong className="text-white">"Add project"</strong> → Name it anything (e.g. "workhub") → Create project
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400 font-bold flex-shrink-0">c.</span>
                In the left menu, click <strong className="text-white">"Build" → "Realtime Database"</strong>
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400 font-bold flex-shrink-0">d.</span>
                Click <strong className="text-white">"Create Database"</strong> → Pick any location → Select <strong className="text-amber-400">"Start in test mode"</strong> → Enable
              </li>
              <li className="flex gap-2">
                <span className="text-blue-400 font-bold flex-shrink-0">e.</span>
                <span>You'll see a URL at the top like: <code className="text-emerald-400 bg-slate-800 px-1.5 py-0.5 rounded text-[11px]">https://workhub-xxxxx-default-rtdb.firebaseio.com</code> — copy it!</span>
              </li>
            </ol>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-800/30 rounded-xl p-4">
            <p className="text-white text-sm font-bold mb-3">Step 2️⃣ — Paste Your URL Here</p>
            <input
              value={settings.firebaseUrl}
              onChange={e => updateSettings({ firebaseUrl: e.target.value })}
              placeholder="https://your-project-default-rtdb.firebaseio.com"
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500/50 mb-3"
              style={{ fontSize: '16px' }}
            />
            {settings.firebaseUrl?.trim() && !settings.firebaseUrl.includes('firebaseio.com') && (
              <p className="text-amber-400 text-xs">⚠️ URL should contain "firebaseio.com". Double-check you copied the right URL.</p>
            )}
            {settings.firebaseUrl?.trim() && settings.firebaseUrl.includes('firebaseio.com') && (
              <p className="text-emerald-400 text-xs">✅ URL looks correct!</p>
            )}
          </div>

          {/* Step 3 */}
          <div className="bg-slate-800/30 rounded-xl p-4">
            <p className="text-white text-sm font-bold mb-3">Step 3️⃣ — Enable & Test</p>
            <label className="flex items-center gap-3 cursor-pointer mb-4 p-3 rounded-xl bg-slate-900/30 border border-slate-700/30 active:bg-slate-800/50">
              <input
                type="checkbox"
                checked={settings.syncEnabled}
                onChange={e => updateSettings({ syncEnabled: e.target.checked })}
                className="w-5 h-5 rounded accent-emerald-500"
              />
              <div>
                <span className="text-white text-sm font-semibold">Enable cloud sync</span>
                <p className="text-slate-500 text-[10px]">Data will sync automatically every 60 seconds</p>
              </div>
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleTest}
                disabled={testing || !settings.firebaseUrl?.trim()}
                className="px-5 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold active:scale-95 disabled:opacity-40 disabled:active:scale-100 transition-all"
              >
                {testing ? '⏳ Testing...' : '🔌 Test Connection'}
              </button>
              <button
                onClick={handleSync}
                disabled={syncing || !settings.firebaseUrl?.trim() || !settings.syncEnabled}
                className="px-5 py-3 bg-emerald-600 text-white rounded-xl text-sm font-semibold active:scale-95 disabled:opacity-40 disabled:active:scale-100 transition-all"
              >
                {syncing ? '⏳ Syncing...' : '🔄 Sync Now'}
              </button>
            </div>

            {/* Results */}
            {testResult && (
              <div className={`mt-3 p-3 rounded-xl text-sm font-medium ${testResult.startsWith('✅') ? 'bg-emerald-600/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-600/10 border border-red-500/20 text-red-400'}`}>
                {testResult}
              </div>
            )}
            {syncResult && (
              <div className={`mt-3 p-3 rounded-xl text-sm font-medium ${syncResult.startsWith('✅') ? 'bg-emerald-600/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-600/10 border border-red-500/20 text-red-400'}`}>
                {syncResult}
              </div>
            )}
          </div>

          {/* Multi-device instructions */}
          <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-4">
            <p className="text-blue-400 text-xs font-bold mb-2">📱 How to access on other devices</p>
            <ol className="space-y-1.5 text-xs text-slate-300">
              <li>1. Open this same app URL on your other device (phone, tablet, computer)</li>
              <li>2. Go to Integrations → Paste the <strong>same Firebase URL</strong></li>
              <li>3. Enable sync → Click "Sync Now"</li>
              <li>4. All your data will appear! Auto-syncs every 60 seconds after that.</li>
            </ol>
          </div>
        </div>
      </Sec>

      {/* ═══ AI ═══ */}
      <AiSetup settings={settings} updateSettings={updateSettings} />

      {/* ═══ SETTINGS ═══ */}
      <Sec title="⚙️ App Settings" desc="Details used across both workspaces. Changes save automatically.">
        <div className="grid sm:grid-cols-2 gap-3">
          <Inp label="Your Name (Programs Manager)" value={settings.programsManagerName} onChange={v => updateSettings({ programsManagerName: v })} />
          <Inp label="Chairman (MSG)" value={settings.chairmanName} onChange={v => updateSettings({ chairmanName: v })} />
          <Inp label="Doctor (Zerenity)" value={settings.zerenityDoctor} onChange={v => updateSettings({ zerenityDoctor: v })} />
          <Inp label="Calendly Link (for mentors)" value={settings.calendlyLink} onChange={v => updateSettings({ calendlyLink: v })} placeholder="https://calendly.com/your-link" />
          <Inp label="MSG Facebook" value={settings.msgFacebook} onChange={v => updateSettings({ msgFacebook: v })} />
          <Inp label="MSG Website" value={settings.msgWebsite} onChange={v => updateSettings({ msgWebsite: v })} />
          <Inp label="Zerenity Website" value={settings.zerenityWebsite} onChange={v => updateSettings({ zerenityWebsite: v })} />
          <Inp label="Zerenity Instagram" value={settings.zerenityInstagram} onChange={v => updateSettings({ zerenityInstagram: v })} placeholder="https://instagram.com/..." />
        </div>
        <p className="text-white font-semibold text-sm mt-4 mb-2">🏦 MSG Donation Account</p>
        <div className="grid sm:grid-cols-3 gap-3">
          <Inp label="Account Name" value={settings.bankAccountName} onChange={v => updateSettings({ bankAccountName: v })} />
          <Inp label="Bank" value={settings.bankName} onChange={v => updateSettings({ bankName: v })} />
          <Inp label="Account No." value={settings.bankAccount} onChange={v => updateSettings({ bankAccount: v })} />
        </div>
        <button onClick={handleSave} className="mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold active:scale-95">
          {saved ? '✅ Saved!' : '💾 Save Settings'}
        </button>
      </Sec>

      {/* ═══ BACKUP ═══ */}
      <Sec title="💾 Manual Backup & Transfer" desc="Export all data to a file. Import on another device or as backup.">
        <div className="flex flex-wrap gap-3">
          <button onClick={exportData} className="px-5 py-3 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-sm font-semibold active:scale-95">📥 Export All Data</button>
          <button onClick={importData} className="px-5 py-3 bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded-xl text-sm font-semibold active:scale-95">📤 Import Data</button>
        </div>
        <p className="text-slate-500 text-xs mt-2">💡 Works without cloud sync! Export on one device → send the file → import on another device.</p>
      </Sec>

      {/* ═══ SECURITY ═══ */}
      <PinManager />

      {/* ═══ INTEGRATIONS ═══ */}
      <Sec title="🔌 Active Integrations" desc="Current connections and automation status.">
        <div className="space-y-2">
          <IntR emoji="☁️" name="Cloud Sync" status={syncConfigured ? 'active' : 'setup'} desc={syncConfigured ? `Firebase connected · ${settings.lastSyncAt ? 'Last: ' + new Date(settings.lastSyncAt).toLocaleString() : 'Ready'}` : 'Set up above to sync across devices'} />
          <IntR emoji="💬" name="WhatsApp" status="active" desc="One-tap messaging for students, mentors, patients, donors" />
          <IntR emoji="📅" name="Calendly" status={settings.calendlyLink ? 'active' : 'setup'} desc={settings.calendlyLink ? 'Connected for mentor scheduling' : 'Add Calendly link in settings above'} />
          <IntR emoji="📱" name="Social Media" status="active" desc="AI post generator + compose & copy for all platforms" />
          <IntR emoji="📧" name="Email" status="active" desc="One-tap email for reports and communication" />
          <IntR emoji="✨" name="AI Assistant" status="active" desc="Daily briefings, weekly reports, social posts, engagement tips" />
        </div>
      </Sec>
    </div>
  );
}

function Sec({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return <div className="bg-slate-900/50 border border-slate-800/30 rounded-2xl p-4 sm:p-5"><h2 className="text-white font-bold text-sm mb-1">{title}</h2><p className="text-slate-500 text-xs mb-4">{desc}</p>{children}</div>;
}

function Inp({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-[10px] text-slate-500 mb-1 block">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || label} className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500/50" style={{ fontSize: '16px' }} />
    </div>
  );
}

function IntR({ emoji, name, status, desc }: { emoji: string; name: string; status: 'active' | 'setup'; desc: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30">
      <span className="text-lg">{emoji}</span>
      <div className="flex-1 min-w-0"><p className="text-white text-sm font-medium">{name}</p><p className="text-slate-500 text-[10px]">{desc}</p></div>
      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>{status === 'active' ? '✅ Active' : '⚙️ Setup'}</span>
    </div>
  );
}

function AiSetup({ settings, updateSettings }: { settings: AppSettings; updateSettings: (p: Partial<AppSettings>) => void }) {
  const [keySaved, setKeySaved] = useState(false);
  const [testingAi, setTestingAi] = useState(false);
  const [aiResult, setAiResult] = useState('');

  function handleKeyChange(v: string) {
    updateSettings({ geminiApiKey: v });
    setKeySaved(true);
    setAiResult('');
    setTimeout(() => setKeySaved(false), 2000);
  }

  async function testAiKey() {
    // Save first
    store.saveSettings(settings);
    setTestingAi(true);
    setAiResult('');
    const key = settings.geminiApiKey?.trim();
    if (!key) {
      setAiResult('❌ No API key entered. Paste your Gemini key above first.');
      setTestingAi(false);
      return;
    }
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: 'Say "WorkHub AI is connected!" and nothing else.' }] }] }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Connected!';
        setAiResult(`✅ ${text.trim()}`);
      } else if (res.status === 400) {
        setAiResult('❌ Invalid API key. Please check and paste the correct key.');
      } else if (res.status === 403) {
        setAiResult('❌ API key not authorized. Make sure Generative Language API is enabled.');
      } else {
        setAiResult(`❌ Error: HTTP ${res.status}. Check your key.`);
      }
    } catch (e) {
      setAiResult(`❌ Connection failed: ${String(e)}`);
    }
    setTestingAi(false);
  }

  return (
    <Sec title="🤖 AI Assistant Setup" desc="AI works out of the box. Add a Gemini key for better quality (optional).">
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-600/10 border border-emerald-500/20">
          <span className="text-lg">✅</span>
          <div className="flex-1">
            <p className="text-emerald-400 text-sm font-semibold">
              {settings.geminiApiKey?.trim() ? '🟢 Gemini AI Active' : 'AI Active — Free tier (no key needed)'}
            </p>
            <p className="text-slate-500 text-[10px]">
              {settings.geminiApiKey?.trim() ? 'Using Google Gemini for high-quality responses' : 'Using DevToolBox AI. Add Gemini key below for better quality.'}
            </p>
          </div>
        </div>

        <div className="bg-slate-800/30 rounded-xl p-4 space-y-3">
          <p className="text-white text-sm font-bold">Google Gemini API Key (free, optional)</p>
          <ol className="space-y-1.5 text-xs text-slate-400">
            <li className="flex gap-2"><span className="text-blue-400 font-bold">1.</span>Go to <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline font-medium">aistudio.google.com/apikey</a></li>
            <li className="flex gap-2"><span className="text-blue-400 font-bold">2.</span>Sign in with Google → Click <strong className="text-white">"Create API Key"</strong></li>
            <li className="flex gap-2"><span className="text-blue-400 font-bold">3.</span>Copy the key (starts with <code className="text-emerald-400 bg-slate-800 px-1 rounded">AIza...</code>) and paste below</li>
          </ol>

          <div>
            <label className="text-[10px] text-slate-500 mb-1 block">Gemini API Key</label>
            <input
              value={settings.geminiApiKey || ''}
              onChange={e => handleKeyChange(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
              style={{ fontSize: '16px' }}
            />
            {keySaved && <p className="text-emerald-400 text-xs mt-1">✅ Key saved automatically!</p>}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={testAiKey}
              disabled={testingAi}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold active:scale-95 disabled:opacity-50"
            >
              {testingAi ? '⏳ Testing...' : '🔌 Test AI Connection'}
            </button>
          </div>

          {aiResult && (
            <div className={`p-3 rounded-xl text-sm font-medium ${aiResult.startsWith('✅') ? 'bg-emerald-600/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-600/10 border border-red-500/20 text-red-400'}`}>
              {aiResult}
            </div>
          )}

          <p className="text-slate-500 text-[10px]">Free: 500 requests/day. Powers AI chat, grammar check, social media rewrite, message compose, and more.</p>
        </div>
      </div>
    </Sec>
  );
}

function PinManager() {
  const [showChange, setShowChange] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNew, setConfirmNew] = useState('');
   const [result, setResult] = useState('');

  function handleChange() {
    setResult('');
    if (newPin.length < 4) { setResult('❌ New PIN must be at least 4 characters'); return; }
    if (newPin !== confirmNew) { setResult('❌ New PINs do not match'); return; }
    const r = changePin(currentPin, newPin);
    if (r.ok) {
      setResult('✅ PIN changed successfully!');
      setCurrentPin(''); setNewPin(''); setConfirmNew('');
      setTimeout(() => { setShowChange(false); setResult(''); }, 1500);
    } else {
      setResult(`❌ ${r.error}`);
    }
  }

  return (
    <Sec title="🔐 Security" desc="Your app is protected with a PIN. It syncs to Firebase so it works on all devices.">
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-600/10 border border-emerald-500/20">
          <span className="text-lg">🔒</span>
          <div className="flex-1"><p className="text-emerald-400 text-sm font-semibold">PIN Protection Active</p><p className="text-slate-500 text-[10px]">Auto-locks after 15 minutes of inactivity</p></div>
        </div>

        {!showChange ? (
          <button onClick={() => setShowChange(true)} className="px-4 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-medium border border-slate-700 active:scale-95">🔑 Change PIN</button>
        ) : (
          <div className="bg-slate-800/30 rounded-xl p-4 space-y-3 animate-fadeIn">
            <p className="text-white text-sm font-bold">Change PIN</p>
            <input type="password" inputMode="numeric" value={currentPin} onChange={e => setCurrentPin(e.target.value)} placeholder="Current PIN" className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500/50" style={{ fontSize: '16px' }} />
            <input type="password" inputMode="numeric" value={newPin} onChange={e => setNewPin(e.target.value)} placeholder="New PIN (min 4 chars)" className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500/50" style={{ fontSize: '16px' }} />
            <input type="password" inputMode="numeric" value={confirmNew} onChange={e => setConfirmNew(e.target.value)} placeholder="Confirm new PIN" className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500/50" style={{ fontSize: '16px' }} />
            {result && <p className={`text-sm ${result.startsWith('✅') ? 'text-emerald-400' : 'text-red-400'}`}>{result}</p>}
            <div className="flex gap-2">
              <button onClick={() => { setShowChange(false); setResult(''); setCurrentPin(''); setNewPin(''); setConfirmNew(''); }} className="flex-1 py-2.5 bg-slate-700 text-white rounded-xl text-sm font-semibold active:scale-95">Cancel</button>
              <button onClick={handleChange} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold active:scale-95">✅ Change PIN</button>
            </div>
          </div>
        )}
      </div>
    </Sec>
  );
}
