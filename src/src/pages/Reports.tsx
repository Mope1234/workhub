import { useState, useEffect } from 'react';
import type { DailyLog, Expense, Workspace } from '../utils/types';
import { MSG_LOG_CATEGORIES, ZWC_LOG_CATEGORIES } from '../utils/types';
import * as store from '../utils/store';
import { generateWeeklyReport, waCompose, gmailCompose } from '../utils/helpers';

const tabs = ['Daily Log', 'Expenses', 'Weekly Report'];

export default function Reports({ workspace }: { workspace: Workspace }) {
  const [tab, setTab] = useState(0);
  const [allLogs, setLogs] = useState<DailyLog[]>([]);
  const [allExp, setExp] = useState<Expense[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [report, setReport] = useState('');
  const [copied, setCopied] = useState(false);
  const cats = workspace === 'msg' ? MSG_LOG_CATEGORIES : ZWC_LOG_CATEGORIES;
  const accent = workspace === 'msg' ? 'blue' : 'emerald';

  const emptyLog: Partial<DailyLog> = { date: store.todayISO(), title: '', details: '', category: 'General', includeInReport: true, workspace };
  const [logForm, setLogForm] = useState<Partial<DailyLog>>(emptyLog);
  const emptyExp: Partial<Expense> = { date: store.todayISO(), description: '', amount: 0, category: 'Transportation', workspace };
  const [expForm, setExpForm] = useState<Partial<Expense>>(emptyExp);

  useEffect(() => { reload(); }, [workspace]);
  function reload() { setLogs(store.getLogs(workspace)); setExp(store.getExpenses(workspace)); setReport(generateWeeklyReport(workspace, store.getSettings())); }
  function resetLog() { setLogForm({ ...emptyLog, workspace }); setEditId(null); setShowForm(false); }
  function resetExp() { setExpForm({ ...emptyExp, workspace }); setShowForm(false); }

  function saveLog() {
    if (!logForm.title?.trim()) return;
    if (editId) { const ex = allLogs.find(l => l.id === editId); if (ex) store.updateLog(workspace, { ...ex, ...logForm } as DailyLog); }
    else { store.addLog(workspace, { ...logForm, workspace, id: store.genId(), createdAt: new Date().toISOString() } as DailyLog); }
    resetLog(); reload();
  }
  function saveExp() {
    if (!expForm.description?.trim()) return;
    store.addExpense(workspace, { ...expForm, workspace, id: store.genId(), createdAt: new Date().toISOString() } as Expense);
    resetExp(); reload();
  }
  function deleteLogItem(id: string) { if (confirm('Delete?')) { store.deleteLog(workspace, id); reload(); } }
  function deleteExpItem(id: string) { if (confirm('Delete?')) { store.deleteExpense(workspace, id); reload(); } }
  function editLog(l: DailyLog) { setLogForm(l); setEditId(l.id); setShowForm(true); }
  function copyReport() { navigator.clipboard.writeText(report).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); }

  const settings = store.getSettings();
  const weekLogs = allLogs.filter(l => l.date >= store.weekStart() && l.date <= store.weekEnd());
  const weekExp = allExp.filter(e => e.date >= store.weekStart() && e.date <= store.weekEnd());
  const label = workspace === 'msg' ? 'MSG Foundation' : 'Zerenity Wellness';
  const reportTo = workspace === 'msg' ? settings.chairmanName : settings.zerenityDoctor;

  return (
    <div className="space-y-4 animate-fadeIn">
      <div>
        <h1 className="text-xl font-bold text-white">📝 Reports & Daily Log</h1>
        <p className="text-slate-500 text-xs">{label} · Log activities → Auto-generate report for {reportTo}</p>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map((t, i) => (
          <button key={t} onClick={() => { setTab(i); setShowForm(false); }} className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${tab === i ? `bg-${accent}-600 text-white` : 'bg-slate-800/50 text-slate-400'}`}>{t}</button>
        ))}
      </div>

      {/* DAILY LOG */}
      {tab === 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-white font-semibold text-sm">📋 This Week ({weekLogs.length} entries)</p>
            <button onClick={() => { resetLog(); setShowForm(true); }} className={`px-4 py-2 bg-${accent}-600 text-white rounded-xl text-sm font-semibold active:scale-95`}>+ Add Entry</button>
          </div>
          <div className={`bg-${accent}-600/10 border border-${accent}-500/20 rounded-xl p-3`}>
            <p className={`text-${accent}-300 text-xs`}>💡 Add daily issues, updates, meetings, and decisions. Entries marked "Include in Report" appear automatically in your weekly report.</p>
          </div>

          {showForm && (
            <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-4 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between"><p className="text-white font-semibold text-sm">{editId ? 'Edit' : 'New'} Log Entry</p><button onClick={resetLog} className="text-slate-500 text-lg">✕</button></div>
              <input type="date" value={logForm.date || ''} onChange={e => setLogForm({ ...logForm, date: e.target.value })} className="inp w-full" />
              <input value={logForm.title || ''} onChange={e => setLogForm({ ...logForm, title: e.target.value })} placeholder="Title / Summary *" className="inp w-full" />
              <textarea value={logForm.details || ''} onChange={e => setLogForm({ ...logForm, details: e.target.value })} placeholder="Details..." rows={3} className="inp w-full resize-none" />
              <div className="flex flex-wrap gap-3 items-center">
                <select value={logForm.category || 'General'} onChange={e => setLogForm({ ...logForm, category: e.target.value })} className="inp">
                  {cats.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={logForm.includeInReport ?? true} onChange={e => setLogForm({ ...logForm, includeInReport: e.target.checked })} className="w-4 h-4 rounded" />
                  Include in report
                </label>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={resetLog} className="px-4 py-2 text-slate-400 text-sm">Cancel</button>
                <button onClick={saveLog} className={`px-5 py-2 bg-${accent}-600 text-white rounded-xl text-sm font-semibold active:scale-95`}>{editId ? 'Update' : 'Save'}</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {allLogs.length === 0 ? <p className="text-center py-8 text-slate-500 text-sm">No entries yet. Start logging!</p> :
              allLogs.slice(0, 30).map(l => (
                <div key={l.id} className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/30">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] text-slate-500">{store.formatDate(l.date)}</span>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">{l.category}</span>
                        {l.includeInReport && <span className={`text-[10px] bg-${accent}-500/20 text-${accent}-400 px-1.5 py-0.5 rounded`}>📝 Report</span>}
                      </div>
                      <p className="text-white text-sm font-medium">{l.title}</p>
                      {l.details && <p className="text-slate-400 text-xs mt-1 line-clamp-2">{l.details}</p>}
                    </div>
                    <div className="flex gap-1 flex-shrink-0 ml-2">
                      <button onClick={() => editLog(l)} className="text-xs p-1">✏️</button>
                      <button onClick={() => deleteLogItem(l.id)} className="text-xs p-1">🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* EXPENSES */}
      {tab === 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div><p className="text-white font-semibold text-sm">💰 This Week</p><p className="text-slate-500 text-xs">Total: ₦{weekExp.reduce((s, e) => s + e.amount, 0).toLocaleString()}</p></div>
            <button onClick={() => { resetExp(); setShowForm(true); }} className="px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-semibold active:scale-95">+ Add</button>
          </div>
          {showForm && (
            <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-4 space-y-3 animate-fadeIn">
              <p className="text-white font-semibold text-sm">New Expense</p>
              <input type="date" value={expForm.date || ''} onChange={e => setExpForm({ ...expForm, date: e.target.value })} className="inp w-full" />
              <input value={expForm.description || ''} onChange={e => setExpForm({ ...expForm, description: e.target.value })} placeholder="Description *" className="inp w-full" />
              <input type="number" value={expForm.amount || ''} onChange={e => setExpForm({ ...expForm, amount: +e.target.value })} placeholder="Amount (₦)" className="inp w-full" />
              <input value={expForm.category || ''} onChange={e => setExpForm({ ...expForm, category: e.target.value })} placeholder="Category" className="inp w-full" />
              <div className="flex gap-2 justify-end"><button onClick={resetExp} className="px-4 py-2 text-slate-400 text-sm">Cancel</button><button onClick={saveExp} className="px-5 py-2 bg-amber-600 text-white rounded-xl text-sm font-semibold active:scale-95">Save</button></div>
            </div>
          )}
          <div className="space-y-2">
            {allExp.length === 0 ? <p className="text-center py-8 text-slate-500 text-sm">No expenses yet.</p> :
              allExp.slice(0, 30).map(e => (
                <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800/30">
                  <div className="flex-1 min-w-0"><p className="text-white text-sm">{e.description}</p><p className="text-[10px] text-slate-500">{store.formatDate(e.date)} · {e.category}</p></div>
                  <p className="text-amber-400 font-bold text-sm">₦{e.amount.toLocaleString()}</p>
                  <button onClick={() => deleteExpItem(e.id)} className="text-xs p-1">🗑️</button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* WEEKLY REPORT */}
      {tab === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-white font-semibold text-sm">📄 AI-Generated Weekly Report</p>
            <div className="flex gap-2">
              <button onClick={() => setReport(generateWeeklyReport(workspace, store.getSettings()))} className="px-3 py-2 bg-slate-800 text-white rounded-xl text-xs font-medium border border-slate-700 active:scale-95">🔄 Refresh</button>
              <button onClick={copyReport} className={`px-3 py-2 bg-${accent}-600 text-white rounded-xl text-xs font-medium active:scale-95`}>{copied ? '✅ Copied!' : '📋 Copy'}</button>
            </div>
          </div>
          <div className={`bg-${accent}-600/10 border border-${accent}-500/20 rounded-xl p-3`}>
            <p className={`text-${accent}-300 text-xs`}>✨ <strong>AI-powered:</strong> This report is auto-generated from your Daily Log, expenses, {workspace === 'msg' ? 'student data, ' : 'patient data, '}and tasks. Log activities throughout the week for a comprehensive report.</p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800/50 rounded-2xl p-4 sm:p-6">
            <pre className="text-slate-300 text-xs sm:text-sm whitespace-pre-wrap font-mono leading-relaxed">{report}</pre>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <a href={waCompose(report)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-green-900/30 border border-green-800/30 rounded-xl active:scale-95 transition-transform"><span className="text-xl">💬</span><div><p className="text-white text-sm font-medium">Send via WhatsApp</p><p className="text-slate-500 text-[10px]">Opens WhatsApp with report</p></div></a>
            <a href={gmailCompose('', `${label} Weekly Report — ${store.formatDate(store.todayISO())}`, report)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-slate-900/50 border border-slate-800/30 rounded-xl active:scale-95 transition-transform"><span className="text-xl">📧</span><div><p className="text-white text-sm font-medium">Send via Gmail</p><p className="text-slate-500 text-[10px]">Opens Gmail compose</p></div></a>
            <a href={`mailto:?subject=${encodeURIComponent(label + ' Weekly Report — ' + store.formatDate(store.todayISO()))}&body=${encodeURIComponent(report)}`} className="flex items-center gap-3 p-4 bg-slate-900/50 border border-slate-800/30 rounded-xl active:scale-95 transition-transform"><span className="text-xl">✉️</span><div><p className="text-white text-sm font-medium">Send via Email App</p><p className="text-slate-500 text-[10px]">Opens default email client</p></div></a>
          </div>
        </div>
      )}
      <style>{`.inp { padding: 10px 14px; background: rgba(30,41,59,0.5); border: 1px solid rgba(51,65,85,0.5); border-radius: 12px; color: white; font-size: 16px; } .inp::placeholder { color: #64748b; } .inp:focus { outline: none; border-color: rgba(59,130,246,0.5); }`}</style>
    </div>
  );
}
