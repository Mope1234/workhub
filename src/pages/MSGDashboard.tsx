import { useState, useEffect } from 'react';
import * as store from '../utils/store';
import { MENTORSHIP_TOPICS } from '../utils/types';
import type { Student, Task, Donor } from '../utils/types';

export default function MSGDashboard({ onNav }: { onNav: (p: string) => void }) {
  const [sts, setSts] = useState<Student[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dns, setDns] = useState<Donor[]>([]);

  useEffect(() => { setSts(store.students.get()); setTasks(store.getTasks('msg')); setDns(store.donors.get()); }, []);

  const active = sts.filter(s => s.status === 'active');
  const unpaid = active.filter(s => s.feeStatus === 'unpaid');
  const partial = active.filter(s => s.feeStatus === 'partial');
  const followUpsDue = active.filter(s => s.nextFollowUp && (store.isToday(s.nextFollowUp) || store.isOverdue(s.nextFollowUp)));
  const pending = tasks.filter(t => t.status !== 'done');
  const overdueTasks = pending.filter(t => t.dueDate && store.isOverdue(t.dueDate));
  const todayTasks = pending.filter(t => t.dueDate && store.isToday(t.dueDate));
  const upcomingTasks = pending.filter(t => t.dueDate && store.isDueSoon(t.dueDate, 7) && !store.isToday(t.dueDate) && !store.isOverdue(t.dueDate));
  const urgentTasks = pending.filter(t => t.priority === 'urgent');
  const highTasks = pending.filter(t => t.priority === 'high');
  const donorFollowups = dns.filter(d => d.nextFollowUp && (store.isToday(d.nextFollowUp) || store.isOverdue(d.nextFollowUp)));
  const month = store.currentMonth();
  const topic = MENTORSHIP_TOPICS[month];
  const isFriday = new Date().getDay() === 5;
  const dayName = new Date().toLocaleDateString('en-NG', { weekday: 'long' });
  const noMentor = active.filter(s => s.level === 'university' && !s.mentorName);
  const settings = store.getSettings();

  // Build rich briefing
  const briefing: { text: string; type: 'alert' | 'warn' | 'info' | 'tip' }[] = [];

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  briefing.push({ text: `${greeting}, ${settings.programsManagerName.split(' ')[0]}! Here's your ${dayName} overview:`, type: 'info' });

  // Overdue — critical
  if (overdueTasks.length > 0) {
    briefing.push({ text: `🚨 ${overdueTasks.length} OVERDUE task(s) need immediate attention:`, type: 'alert' });
    overdueTasks.slice(0, 4).forEach(t => {
      briefing.push({ text: `   → ${t.title} (${Math.abs(store.daysUntil(t.dueDate))} days late)`, type: 'alert' });
    });
    if (overdueTasks.length > 4) briefing.push({ text: `   → ...and ${overdueTasks.length - 4} more overdue`, type: 'alert' });
  }

  // Today's tasks
  if (todayTasks.length > 0) {
    briefing.push({ text: `📋 ${todayTasks.length} task(s) due TODAY:`, type: 'warn' });
    todayTasks.slice(0, 4).forEach(t => {
      briefing.push({ text: `   → ${t.title}`, type: 'warn' });
    });
  }

  // Urgent tasks not yet mentioned
  const urgentNotShown = urgentTasks.filter(t => !store.isOverdue(t.dueDate) && !store.isToday(t.dueDate));
  if (urgentNotShown.length > 0) {
    briefing.push({ text: `🔴 ${urgentNotShown.length} urgent task(s) coming up:`, type: 'warn' });
    urgentNotShown.slice(0, 3).forEach(t => {
      briefing.push({ text: `   → ${t.title} — due ${store.formatDate(t.dueDate)}`, type: 'warn' });
    });
  }

  // Upcoming this week
  if (upcomingTasks.length > 0) {
    briefing.push({ text: `📅 ${upcomingTasks.length} task(s) coming up this week:`, type: 'info' });
    upcomingTasks.slice(0, 4).forEach(t => {
      briefing.push({ text: `   → ${t.title} — ${store.formatDate(t.dueDate)}`, type: 'info' });
    });
  }

  // Student follow-ups
  if (followUpsDue.length > 0) {
    briefing.push({ text: `🎓 ${followUpsDue.length} student follow-up(s) due: ${followUpsDue.slice(0, 4).map(s => s.name).join(', ')}`, type: 'warn' });
  }

  // Unpaid fees
  if (unpaid.length > 0 || partial.length > 0) {
    briefing.push({ text: `💰 Fee status: ${unpaid.length} unpaid, ${partial.length} partial — ${unpaid.length + partial.length} need attention`, type: 'warn' });
  }

  // Donor follow-ups
  if (donorFollowups.length > 0) {
    briefing.push({ text: `🤝 ${donorFollowups.length} donor/trustee follow-up(s) due: ${donorFollowups.slice(0, 3).map(d => d.name).join(', ')}`, type: 'warn' });
  }

  // Mentor gaps
  if (noMentor.length > 0) {
    briefing.push({ text: `⚠️ ${noMentor.length} university scholar(s) without mentors: ${noMentor.map(s => s.name).join(', ')}`, type: 'warn' });
  }

  // Friday report
  if (isFriday) {
    briefing.push({ text: `📝 It's FRIDAY — prepare your weekly report for ${settings.chairmanName}! Go to Reports tab.`, type: 'tip' });
  }

  // Mentorship topic
  if (topic) {
    briefing.push({ text: `📚 This month's mentorship topic: "${topic.title}"`, type: 'info' });
  }

  // Daily recurring reminders
  const dailyRecurring = pending.filter(t => t.recurring === 'daily');
  if (dailyRecurring.length > 0) {
    briefing.push({ text: `♻️ ${dailyRecurring.length} daily recurring task(s) to complete today`, type: 'info' });
  }

  // Summary
  briefing.push({ text: `📊 Total: ${pending.length} pending tasks | ${active.length} active scholars | ${dns.filter(d => d.status === 'active').length} donors`, type: 'info' });

  // If very light day
  if (overdueTasks.length === 0 && todayTasks.length === 0 && urgentNotShown.length === 0) {
    briefing.push({ text: `💡 Tip: Good day to focus on fundraising outreach, portal updates, or social media content.`, type: 'tip' });
  }

  const colorMap = { alert: 'text-red-400', warn: 'text-amber-300', info: 'text-slate-300', tip: 'text-blue-400' };

  // Priority list for display
  const priorityList = [...overdueTasks, ...todayTasks, ...urgentNotShown, ...highTasks.filter(t => !store.isOverdue(t.dueDate) && !store.isToday(t.dueDate))]
    .filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i)
    .slice(0, 8);

  return (
    <div className="space-y-4 animate-fadeIn">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">🎓 MSG Foundation</h1>
        <p className="text-slate-500 text-xs mt-0.5">Programs Department · {settings.programsManagerName}</p>
      </div>

      {/* AI Briefing */}
      <div className="bg-gradient-to-br from-blue-600/10 to-violet-600/5 border border-blue-500/20 rounded-2xl p-4">
        <p className="text-blue-400 text-xs font-bold mb-3">✨ AI DAILY BRIEFING — {new Date().toLocaleDateString('en-NG', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</p>
        <div className="space-y-1">
          {briefing.map((b, i) => (
            <p key={i} className={`text-sm leading-relaxed ${colorMap[b.type]}`}>{b.text}</p>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat emoji="🚨" val={overdueTasks.length} label="Overdue" onClick={() => onNav('tasks')} alert={overdueTasks.length > 0} />
        <Stat emoji="📋" val={todayTasks.length + dailyRecurring.length} label="Today's Tasks" onClick={() => onNav('tasks')} alert={todayTasks.length > 0} />
        <Stat emoji="🎓" val={active.length} label="Active Scholars" onClick={() => onNav('students')} />
        <Stat emoji="📅" val={upcomingTasks.length} label="This Week" onClick={() => onNav('tasks')} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <QA emoji="🎓" label="Students" onClick={() => onNav('students')} />
        <QA emoji="🤝" label="Donors" onClick={() => onNav('donors')} />
        <QA emoji="📝" label="Reports & Log" onClick={() => onNav('reports')} />
        <QA emoji="🤖" label="AI Assistant" onClick={() => onNav('ai')} />
      </div>

      {/* Priority Tasks with names */}
      {priorityList.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-800/30 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white font-semibold text-sm">⚡ Priority Tasks</p>
            <button onClick={() => onNav('tasks')} className="text-blue-400 text-xs">View all {pending.length} →</button>
          </div>
          <div className="space-y-2">
            {priorityList.map(t => (
              <div key={t.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/30">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold flex-shrink-0 ${t.priority === 'urgent' ? 'bg-red-500/20 text-red-400' : t.priority === 'high' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>{t.priority}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{t.title}</p>
                  <p className="text-slate-500 text-[10px]">{t.category}{t.recurring !== 'none' ? ` · ♻️ ${t.recurring}` : ''}</p>
                </div>
                <span className={`text-[10px] flex-shrink-0 ${store.isOverdue(t.dueDate) ? 'text-red-400 font-bold' : store.isToday(t.dueDate) ? 'text-amber-400' : 'text-slate-500'}`}>
                  {store.isOverdue(t.dueDate) ? `${Math.abs(store.daysUntil(t.dueDate))}d late` : store.isToday(t.dueDate) ? 'Today' : store.formatDate(t.dueDate)}
                </span>
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
          <div className="mt-2 space-y-1">
            {topic.focus.map((f, i) => <p key={i} className="text-slate-400 text-xs">• {f}</p>)}
          </div>
          <button onClick={() => onNav('students')} className="mt-3 text-blue-400 text-xs font-medium">Manage sessions →</button>
        </div>
      )}
    </div>
  );
}

function Stat({ emoji, val, label, onClick, alert }: { emoji: string; val: number; label: string; onClick: () => void; alert?: boolean }) {
  return (
    <button onClick={onClick} className={`bg-slate-900/50 border rounded-xl p-3 text-center transition-all active:scale-95 ${alert ? 'border-red-500/30 bg-red-500/5' : 'border-slate-800/30'}`}>
      <span className="text-lg">{emoji}</span>
      <p className={`text-xl font-bold ${alert ? 'text-red-400' : 'text-white'}`}>{val}</p>
      <p className="text-[10px] text-slate-500">{label}</p>
    </button>
  );
}

function QA({ emoji, label, onClick }: { emoji: string; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/30 border border-slate-800/30 hover:bg-slate-800/50 active:scale-95 transition-all text-left">
      <span>{emoji}</span>
      <span className="text-white text-sm font-medium">{label}</span>
    </button>
  );
}
