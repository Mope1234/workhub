import { useState, useEffect } from 'react';
import * as store from '../utils/store';
import { MENTORSHIP_TOPICS } from '../utils/types';
import type { Student, Task, Donor } from '../utils/types';
import { getWorkflowSuggestions, getTodayTheme, gmailComposeUrl, getMsgEmailTemplates } from '../utils/ai';

export default function MSGDashboard({ onNav }: { onNav: (p: string) => void }) {
  const [sts, setSts] = useState<Student[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dns, setDns] = useState<Donor[]>([]);
  const [showEmail, setShowEmail] = useState(false);

  useEffect(() => { setSts(store.students.get()); setTasks(store.getTasks('msg')); setDns(store.donors.get()); }, []);

  const active = sts.filter(s => s.status === 'active');
  const unpaid = active.filter(s => s.feeStatus === 'unpaid');
  const followUpsDue = active.filter(s => s.nextFollowUp && (store.isToday(s.nextFollowUp) || store.isOverdue(s.nextFollowUp)));
  const overdueTasks = tasks.filter(t => t.status !== 'done' && store.isOverdue(t.dueDate));
  const todayTasks = tasks.filter(t => t.status !== 'done' && store.isToday(t.dueDate));
  const pending = tasks.filter(t => t.status !== 'done');
  const donorFollowups = dns.filter(d => d.nextFollowUp && (store.isToday(d.nextFollowUp) || store.isOverdue(d.nextFollowUp)));
  const month = store.currentMonth();
  const topic = MENTORSHIP_TOPICS[month];
  const todayTheme = getTodayTheme('msg');
  const wfSuggestions = getWorkflowSuggestions('msg');
  const emailTemplates = getMsgEmailTemplates();
  const isFriday = new Date().getDay() === 5;

  const briefing: string[] = [];
  if (overdueTasks.length) briefing.push(`⚠️ ${overdueTasks.length} overdue task(s) — handle first!`);
  if (todayTasks.length) briefing.push(`📋 ${todayTasks.length} task(s) due today`);
  if (followUpsDue.length) briefing.push(`🎓 ${followUpsDue.length} student follow-up(s) due: ${followUpsDue.slice(0, 3).map(s => s.name).join(', ')}`);
  if (unpaid.length) briefing.push(`💰 ${unpaid.length} student(s) with unpaid fees`);
  if (donorFollowups.length) briefing.push(`🤝 ${donorFollowups.length} donor/trustee follow-up(s) due`);
  if (isFriday) briefing.push(`📝 It's Friday — generate your weekly report in Reports tab!`);
  if (topic) briefing.push(`🗓️ This month's mentorship topic: ${topic.title}`);
  if (!briefing.length) briefing.push(`✅ All clear! Great time to plan ahead.`);

  return (
    <div className="space-y-4 animate-fadeIn">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">🎓 MSG Foundation</h1>
        <p className="text-slate-500 text-xs mt-0.5">Programs Department · {store.getSettings().programsManagerName}</p>
      </div>

      {/* AI Briefing */}
      <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-4">
        <p className="text-blue-400 text-xs font-bold mb-2">✨ AI DAILY BRIEFING</p>
        {briefing.map((b, i) => <p key={i} className="text-slate-300 text-sm leading-relaxed">{b}</p>)}
      </div>

      {/* Workflow Suggestions */}
      {wfSuggestions.length > 0 && (
        <div className="bg-violet-600/10 border border-violet-500/20 rounded-xl p-3">
          <p className="text-violet-400 text-xs font-bold mb-1">🧠 AI SUGGESTIONS</p>
          {wfSuggestions.map((s, i) => <p key={i} className="text-slate-300 text-xs leading-relaxed">{s}</p>)}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat emoji="🎓" val={active.length} label="Active Scholars" onClick={() => onNav('students')} />
        <Stat emoji="⚠️" val={overdueTasks.length} label="Overdue Tasks" onClick={() => onNav('tasks')} alert={overdueTasks.length > 0} />
        <Stat emoji="💰" val={unpaid.length} label="Unpaid Fees" onClick={() => onNav('students')} alert={unpaid.length > 0} />
        <Stat emoji="🤝" val={dns.filter(d => d.status === 'active').length} label="Active Donors" onClick={() => onNav('donors')} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <QA emoji="🎓" label="Students" onClick={() => onNav('students')} />
        <QA emoji="🤝" label="Donors" onClick={() => onNav('donors')} />
        <QA emoji="📝" label="Weekly Report" onClick={() => onNav('reports')} />
        <QA emoji={todayTheme.emoji} label={`Post: ${todayTheme.label.split(' ').slice(0, 2).join(' ')}`} onClick={() => onNav('social')} />
      </div>

      {/* Gmail Quick Compose */}
      <div className="bg-slate-900/50 border border-slate-800/30 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white font-semibold text-sm">📧 Quick Email</p>
          <button onClick={() => setShowEmail(!showEmail)} className="text-blue-400 text-xs">{showEmail ? 'Hide' : 'Show all'}</button>
        </div>
        <div className={`grid ${showEmail ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
          {(showEmail ? emailTemplates : emailTemplates.slice(0, 2)).map((t, i) => (
            <a key={i} href={gmailComposeUrl(t.to, t.subject, t.body)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 active:scale-95 transition-all text-left">
              <span className="text-sm">{t.label.split(' ')[0]}</span>
              <span className="text-white text-xs font-medium flex-1 truncate">{t.label.slice(t.label.indexOf(' ') + 1)}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Priority Tasks */}
      {pending.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-800/30 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white font-semibold text-sm">⚡ Priority Tasks</p>
            <button onClick={() => onNav('tasks')} className="text-blue-400 text-xs">View all ({pending.length}) →</button>
          </div>
          <div className="space-y-2">
            {[...overdueTasks, ...todayTasks].slice(0, 6).map(t => (
              <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/30">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${t.priority === 'urgent' ? 'bg-red-500/20 text-red-400' : t.priority === 'high' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>{t.priority}</span>
                <p className="text-white text-sm flex-1 truncate">{t.title}</p>
                <span className={`text-[10px] ${store.isOverdue(t.dueDate) ? 'text-red-400' : 'text-amber-400'}`}>{store.isOverdue(t.dueDate) ? `${Math.abs(store.daysUntil(t.dueDate))}d late` : 'Today'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mentorship */}
      {topic && (
        <div className="bg-slate-900/50 border border-blue-500/20 rounded-2xl p-4">
          <p className="text-white font-semibold text-sm mb-2">📚 This Month's Mentorship</p>
          <p className="text-blue-400 font-bold">{topic.title}</p>
          <div className="mt-2 space-y-1">{topic.focus.map((f, i) => <p key={i} className="text-slate-400 text-xs">• {f}</p>)}</div>
          <button onClick={() => onNav('students')} className="mt-3 text-blue-400 text-xs font-medium">Manage sessions →</button>
        </div>
      )}
    </div>
  );
}

function Stat({ emoji, val, label, onClick, alert }: { emoji: string; val: number; label: string; onClick: () => void; alert?: boolean }) {
  return <button onClick={onClick} className={`bg-slate-900/50 border rounded-xl p-3 text-center active:scale-95 transition-all ${alert ? 'border-red-500/30' : 'border-slate-800/30'}`}><span className="text-lg">{emoji}</span><p className={`text-xl font-bold ${alert ? 'text-red-400' : 'text-white'}`}>{val}</p><p className="text-[10px] text-slate-500">{label}</p></button>;
}

function QA({ emoji, label, onClick }: { emoji: string; label: string; onClick: () => void }) {
  return <button onClick={onClick} className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/30 border border-slate-800/30 hover:bg-slate-800/50 active:scale-95 transition-all text-left"><span>{emoji}</span><span className="text-white text-xs font-medium">{label}</span></button>;
}
