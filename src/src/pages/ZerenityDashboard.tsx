import { useState, useEffect } from 'react';
import * as store from '../utils/store';
import type { Patient, Task } from '../utils/types';

export default function ZerenityDashboard({ onNav }: { onNav: (p: string) => void }) {
  const [pts, setPts] = useState<Patient[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => { setPts(store.patientsStore.get()); setTasks(store.getTasks('zerenity')); }, []);

  const active = pts.filter(p => p.status === 'active');
  const todayAppts = active.filter(p => p.nextAppointment && store.isToday(p.nextAppointment));
  const rxDue = active.filter(p => p.prescriptionFollowUp && (store.isToday(p.prescriptionFollowUp) || store.isOverdue(p.prescriptionFollowUp)));
  const noShows = pts.filter(p => p.status === 'no-show');
  const pending = tasks.filter(t => t.status !== 'done');
  const overdue = pending.filter(t => t.dueDate && store.isOverdue(t.dueDate));
  const todayTasks = pending.filter(t => t.dueDate && store.isToday(t.dueDate));
  const upcomingTasks = pending.filter(t => t.dueDate && store.isDueSoon(t.dueDate, 7) && !store.isToday(t.dueDate) && !store.isOverdue(t.dueDate));
  const urgentTasks = pending.filter(t => t.priority === 'urgent');
  const dailyRecurring = pending.filter(t => t.recurring === 'daily');
  const settings = store.getSettings();
  const dayName = new Date().toLocaleDateString('en-NG', { weekday: 'long' });
  const isFriday = new Date().getDay() === 5;

  // Build rich briefing
  const briefing: { text: string; type: 'alert' | 'warn' | 'info' | 'tip' }[] = [];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  briefing.push({ text: `${greeting}! Here's your ${dayName} clinic overview:`, type: 'info' });

  // Appointments today
  if (todayAppts.length > 0) {
    briefing.push({ text: `📅 ${todayAppts.length} patient appointment(s) TODAY:`, type: 'warn' });
    todayAppts.forEach(p => { briefing.push({ text: `   → ${p.name} — ${p.diagnosis || 'Session'}`, type: 'warn' }); });
  }

  // Prescription follow-ups
  if (rxDue.length > 0) {
    briefing.push({ text: `💊 ${rxDue.length} prescription follow-up(s) due:`, type: 'alert' });
    rxDue.forEach(p => { briefing.push({ text: `   → ${p.name} — ${p.prescriptions || 'Check medications'}`, type: 'alert' }); });
  }

  // Overdue tasks
  if (overdue.length > 0) {
    briefing.push({ text: `🚨 ${overdue.length} OVERDUE task(s):`, type: 'alert' });
    overdue.slice(0, 4).forEach(t => { briefing.push({ text: `   → ${t.title} (${Math.abs(store.daysUntil(t.dueDate))} days late)`, type: 'alert' }); });
  }

  // Today's tasks
  if (todayTasks.length > 0) {
    briefing.push({ text: `📋 ${todayTasks.length} task(s) due today:`, type: 'warn' });
    todayTasks.slice(0, 4).forEach(t => { briefing.push({ text: `   → ${t.title}`, type: 'warn' }); });
  }

  // Urgent
  const urgentNotShown = urgentTasks.filter(t => !store.isOverdue(t.dueDate) && !store.isToday(t.dueDate));
  if (urgentNotShown.length > 0) {
    briefing.push({ text: `🔴 ${urgentNotShown.length} urgent task(s) coming up:`, type: 'warn' });
    urgentNotShown.slice(0, 3).forEach(t => { briefing.push({ text: `   → ${t.title} — ${store.formatDate(t.dueDate)}`, type: 'warn' }); });
  }

  // Upcoming
  if (upcomingTasks.length > 0) {
    briefing.push({ text: `📅 ${upcomingTasks.length} task(s) this week`, type: 'info' });
  }

  // No-shows
  if (noShows.length > 0) {
    briefing.push({ text: `⚠️ ${noShows.length} no-show patient(s) — consider follow-up`, type: 'warn' });
  }

  // Friday
  if (isFriday) {
    briefing.push({ text: `📝 It's FRIDAY — prepare your weekly clinic report for ${settings.zerenityDoctor}!`, type: 'tip' });
  }

  // Daily tasks
  if (dailyRecurring.length > 0) {
    briefing.push({ text: `♻️ ${dailyRecurring.length} daily recurring task(s) to complete`, type: 'info' });
  }

  // Summary
  briefing.push({ text: `📊 Total: ${pending.length} pending tasks | ${active.length} active patients | ${pts.length} total on record`, type: 'info' });

  if (overdue.length === 0 && todayTasks.length === 0 && rxDue.length === 0 && todayAppts.length === 0) {
    briefing.push({ text: `💡 Tip: Good day to focus on marketing, patient acquisition, or updating the EMR.`, type: 'tip' });
  }

  const colorMap = { alert: 'text-red-400', warn: 'text-amber-300', info: 'text-slate-300', tip: 'text-emerald-400' };

  const priorityList = [...overdue, ...todayTasks, ...urgentNotShown]
    .filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i)
    .slice(0, 8);

  return (
    <div className="space-y-4 animate-fadeIn">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">🧠 Zerenity Wellness Clinic</h1>
        <p className="text-slate-500 text-xs">Mental Health · {settings.zerenityDoctor}</p>
      </div>

      {/* AI Briefing */}
      <div className="bg-gradient-to-br from-emerald-600/10 to-blue-600/5 border border-emerald-500/20 rounded-2xl p-4">
        <p className="text-emerald-400 text-xs font-bold mb-3">✨ AI DAILY BRIEFING — {new Date().toLocaleDateString('en-NG', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</p>
        <div className="space-y-1">
          {briefing.map((b, i) => (
            <p key={i} className={`text-sm leading-relaxed ${colorMap[b.type]}`}>{b.text}</p>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat emoji="🚨" val={overdue.length} label="Overdue" onClick={() => onNav('tasks')} alert={overdue.length > 0} />
        <Stat emoji="📅" val={todayAppts.length} label="Appts Today" onClick={() => onNav('patients')} hl={todayAppts.length > 0} />
        <Stat emoji="💊" val={rxDue.length} label="Rx Follow-ups" onClick={() => onNav('patients')} alert={rxDue.length > 0} />
        <Stat emoji="🩺" val={active.length} label="Active Patients" onClick={() => onNav('patients')} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <QA emoji="🩺" label="Patients" onClick={() => onNav('patients')} />
        <QA emoji="✅" label="Tasks" onClick={() => onNav('tasks')} />
        <QA emoji="📝" label="Reports & Log" onClick={() => onNav('reports')} />
        <QA emoji="🤖" label="AI Assistant" onClick={() => onNav('ai')} />
      </div>

      {/* Priority Tasks */}
      {priorityList.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-800/30 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white font-semibold text-sm">⚡ Priority Tasks</p>
            <button onClick={() => onNav('tasks')} className="text-emerald-400 text-xs">View all {pending.length} →</button>
          </div>
          <div className="space-y-2">
            {priorityList.map(t => (
              <div key={t.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800/30">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold flex-shrink-0 ${t.priority === 'urgent' ? 'bg-red-500/20 text-red-400' : t.priority === 'high' ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{t.priority}</span>
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

      {/* Clinic Info */}
      <div className="bg-slate-900/50 border border-emerald-500/20 rounded-xl p-3">
        <p className="text-emerald-400 text-xs font-bold mb-1">🏥 CLINIC INFO</p>
        <p className="text-white text-sm">{settings.zerenityDoctor} — Owner & Lead Clinician</p>
        <p className="text-slate-400 text-xs mt-1">Website: <a href={settings.zerenityWebsite} target="_blank" className="text-emerald-400 underline">{settings.zerenityWebsite.replace('https://', '')}</a></p>
      </div>
    </div>
  );
}

function Stat({ emoji, val, label, onClick, alert, hl }: { emoji: string; val: number; label: string; onClick: () => void; alert?: boolean; hl?: boolean }) {
  return <button onClick={onClick} className={`bg-slate-900/50 border rounded-xl p-3 text-center active:scale-95 transition-all ${alert ? 'border-red-500/30 bg-red-500/5' : hl ? 'border-blue-500/30 bg-blue-500/5' : 'border-slate-800/30'}`}><span className="text-lg">{emoji}</span><p className={`text-xl font-bold ${alert ? 'text-red-400' : hl ? 'text-blue-400' : 'text-white'}`}>{val}</p><p className="text-[10px] text-slate-500">{label}</p></button>;
}

function QA({ emoji, label, onClick }: { emoji: string; label: string; onClick: () => void }) {
  return <button onClick={onClick} className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/30 border border-slate-800/30 hover:bg-slate-800/50 active:scale-95 transition-all text-left"><span>{emoji}</span><span className="text-white text-sm font-medium">{label}</span></button>;
}
