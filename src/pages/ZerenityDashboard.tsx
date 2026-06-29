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
  const overdue = tasks.filter(t => t.status !== 'done' && store.isOverdue(t.dueDate));
  const todayTasks = tasks.filter(t => t.status !== 'done' && store.isToday(t.dueDate));
  const pending = tasks.filter(t => t.status !== 'done');
  const settings = store.getSettings();

  const briefing: string[] = [];
  if (todayAppts.length) briefing.push(`📅 ${todayAppts.length} appointment(s) today: ${todayAppts.map(p => p.name).join(', ')}`);
  if (rxDue.length) briefing.push(`💊 ${rxDue.length} prescription follow-up(s) due: ${rxDue.map(p => p.name).join(', ')}`);
  if (overdue.length) briefing.push(`⚠️ ${overdue.length} overdue task(s)`);
  if (todayTasks.length) briefing.push(`📋 ${todayTasks.length} task(s) due today`);
  if (!briefing.length) briefing.push(`✅ All clear! Great time to focus on marketing & patient acquisition.`);

  return (
    <div className="space-y-4 animate-fadeIn">
      <div><h1 className="text-xl sm:text-2xl font-bold text-white">🧠 Zerenity Wellness Clinic</h1><p className="text-slate-500 text-xs">Mental Health · {settings.zerenityDoctor}</p></div>

      <div className="bg-emerald-600/10 border border-emerald-500/20 rounded-2xl p-4">
        <p className="text-emerald-400 text-xs font-bold mb-2">✨ DAILY BRIEFING</p>
        {briefing.map((b, i) => <p key={i} className="text-slate-300 text-sm leading-relaxed">{b}</p>)}
      </div>

      {todayAppts.length > 0 && (
        <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-3 space-y-1">
          <p className="text-blue-400 text-xs font-bold">📅 TODAY'S APPOINTMENTS</p>
          {todayAppts.map(p => <p key={p.id} className="text-white text-sm">• <strong>{p.name}</strong> — {p.diagnosis || 'Session'}</p>)}
        </div>
      )}

      {rxDue.length > 0 && (
        <div className="bg-amber-600/10 border border-amber-500/20 rounded-xl p-3 space-y-1">
          <p className="text-amber-400 text-xs font-bold">💊 PRESCRIPTION FOLLOW-UPS DUE</p>
          {rxDue.map(p => <p key={p.id} className="text-amber-300 text-sm">• <strong>{p.name}</strong> — {p.prescriptions || 'Check medications'}</p>)}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat emoji="🩺" val={active.length} label="Active Patients" onClick={() => onNav('patients')} />
        <Stat emoji="📅" val={todayAppts.length} label="Today's Appts" onClick={() => onNav('patients')} hl={todayAppts.length > 0} />
        <Stat emoji="💊" val={rxDue.length} label="Rx Follow-ups" onClick={() => onNav('patients')} alert={rxDue.length > 0} />
        <Stat emoji="⚠️" val={overdue.length} label="Overdue Tasks" onClick={() => onNav('tasks')} alert={overdue.length > 0} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <QA emoji="🩺" label="Patients" onClick={() => onNav('patients')} />
        <QA emoji="✅" label="Tasks" onClick={() => onNav('tasks')} />
        <QA emoji="📝" label="Reports & Log" onClick={() => onNav('reports')} />
        <QA emoji="📱" label="Social Media" onClick={() => onNav('social')} />
      </div>

      {pending.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-800/30 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3"><p className="text-white font-semibold text-sm">⚡ Priority Tasks</p><button onClick={() => onNav('tasks')} className="text-emerald-400 text-xs">View all →</button></div>
          <div className="space-y-2">
            {[...overdue, ...todayTasks].slice(0, 5).map(t => (
              <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/30">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${t.priority === 'urgent' ? 'bg-red-500/20 text-red-400' : t.priority === 'high' ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{t.priority}</span>
                <p className="text-white text-sm flex-1 truncate">{t.title}</p>
                <span className={`text-[10px] ${store.isOverdue(t.dueDate) ? 'text-red-400' : 'text-amber-400'}`}>{store.isOverdue(t.dueDate) ? 'overdue' : 'Today'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-slate-900/50 border border-emerald-500/20 rounded-xl p-3">
        <p className="text-emerald-400 text-xs font-bold mb-1">🏥 CLINIC INFO</p>
        <p className="text-white text-sm">{settings.zerenityDoctor} — Owner & Lead Clinician</p>
        <p className="text-slate-400 text-xs mt-1">Website: <a href={settings.zerenityWebsite} target="_blank" className="text-emerald-400 underline">{settings.zerenityWebsite.replace('https://', '')}</a></p>
      </div>
    </div>
  );
}

function Stat({ emoji, val, label, onClick, alert, hl }: { emoji: string; val: number; label: string; onClick: () => void; alert?: boolean; hl?: boolean }) {
  return <button onClick={onClick} className={`bg-slate-900/50 border rounded-xl p-3 text-center active:scale-95 transition-all ${alert ? 'border-red-500/30' : hl ? 'border-blue-500/30' : 'border-slate-800/30'}`}><span className="text-lg">{emoji}</span><p className={`text-xl font-bold ${alert ? 'text-red-400' : hl ? 'text-blue-400' : 'text-white'}`}>{val}</p><p className="text-[10px] text-slate-500">{label}</p></button>;
}

function QA({ emoji, label, onClick }: { emoji: string; label: string; onClick: () => void }) {
  return <button onClick={onClick} className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/30 border border-slate-800/30 hover:bg-slate-800/50 active:scale-95 transition-all text-left"><span>{emoji}</span><span className="text-white text-sm font-medium">{label}</span></button>;
}
