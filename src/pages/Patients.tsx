import { useState, useEffect } from 'react';
import type { Patient } from '../utils/types';
import * as store from '../utils/store';
import * as helpers from '../utils/helpers';

export default function Patients() {
  const [pts, setPts] = useState<Patient[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const empty: Partial<Patient> = { name:'',phone:'',email:'',diagnosis:'',nextAppointment:'',lastVisit:'',prescriptions:'',prescriptionFollowUp:'',notes:'',status:'active' };
  const [form, setForm] = useState<Partial<Patient>>(empty);

  useEffect(() => { reload(); }, []);
  function reload() { setPts(store.patientsStore.get()); }
  function reset() { setForm(empty); setEditId(null); setShowForm(false); }
  function handleSave() {
    if (!form.name?.trim()) return;
    if (editId) { const ex = pts.find(p=>p.id===editId); if(ex) store.patientsStore.update({...ex,...form} as Patient); }
    else { store.patientsStore.add({...form, id:store.genId(), createdAt:new Date().toISOString()} as Patient); }
    reset(); reload();
  }
  function startEdit(p: Patient) { setForm(p); setEditId(p.id); setShowForm(true); setDetail(null); }
  function handleDelete(id: string) { if(confirm('Delete?')) { store.patientsStore.delete(id); reload(); setDetail(null); } }

  const active = pts.filter(p => p.status === 'active');
  const todayAppts = active.filter(p => p.nextAppointment && store.isToday(p.nextAppointment));
  const rxDue = active.filter(p => p.prescriptionFollowUp && (store.isToday(p.prescriptionFollowUp) || store.isOverdue(p.prescriptionFollowUp)));
  const filtered = pts.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.diagnosis||'').toLowerCase().includes(search.toLowerCase())).sort((a,b) => { if(a.status==='active'&&b.status!=='active') return -1; if(a.status!=='active'&&b.status==='active') return 1; return a.name.localeCompare(b.name); });
  const ds = detail ? pts.find(p => p.id === detail) : null;

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-white">🩺 Patient Management</h1><p className="text-slate-500 text-xs">Zerenity Wellness Clinic · Dr. Fowobi Gbadebo</p></div>
        <button onClick={() => { reset(); setShowForm(true); }} className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold active:scale-95">+ Add</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/50 border border-slate-800/30 rounded-xl p-3 text-center"><span className="text-lg">🩺</span><p className="text-xl font-bold text-emerald-400">{active.length}</p><p className="text-[10px] text-slate-500">Active</p></div>
        <div className="bg-slate-900/50 border border-slate-800/30 rounded-xl p-3 text-center"><span className="text-lg">📅</span><p className={`text-xl font-bold ${todayAppts.length?'text-blue-400':'text-slate-400'}`}>{todayAppts.length}</p><p className="text-[10px] text-slate-500">Today's Appts</p></div>
        <div className="bg-slate-900/50 border border-slate-800/30 rounded-xl p-3 text-center"><span className="text-lg">💊</span><p className={`text-xl font-bold ${rxDue.length?'text-red-400':'text-slate-400'}`}>{rxDue.length}</p><p className="text-[10px] text-slate-500">Rx Follow-ups</p></div>
        <div className="bg-slate-900/50 border border-slate-800/30 rounded-xl p-3 text-center"><span className="text-lg">📋</span><p className="text-xl font-bold text-white">{pts.length}</p><p className="text-[10px] text-slate-500">Total</p></div>
      </div>

      {/* Alerts */}
      {(todayAppts.length > 0 || rxDue.length > 0) && (
        <div className="bg-emerald-600/10 border border-emerald-500/20 rounded-xl p-3 space-y-1">
          {todayAppts.map(p => <p key={p.id} className="text-emerald-300 text-xs">📅 <strong>{p.name}</strong> — appointment today</p>)}
          {rxDue.map(p => <p key={p.id} className="text-amber-300 text-xs">💊 <strong>{p.name}</strong> — prescription follow-up due</p>)}
        </div>
      )}

      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search patients..." className="w-full px-4 py-3 bg-slate-900/50 border border-slate-800/50 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500/50" />

      {showForm && (
        <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-4 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between"><p className="text-white font-semibold text-sm">{editId ? 'Edit Patient' : 'Add Patient'}</p><button onClick={reset} className="text-slate-500 text-lg">✕</button></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <input value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Patient name *" className="inp" />
            <input value={form.phone||''} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="Phone (WhatsApp)" className="inp" />
            <input value={form.email||''} onChange={e=>setForm({...form,email:e.target.value})} placeholder="Email" className="inp" />
            <input value={form.diagnosis||''} onChange={e=>setForm({...form,diagnosis:e.target.value})} placeholder="Diagnosis / Presenting complaint" className="inp" />
            <div><label className="text-[10px] text-slate-500">Next Appointment</label><input type="date" value={form.nextAppointment||''} onChange={e=>setForm({...form,nextAppointment:e.target.value})} className="inp w-full" /></div>
            <div><label className="text-[10px] text-slate-500">Last Visit</label><input type="date" value={form.lastVisit||''} onChange={e=>setForm({...form,lastVisit:e.target.value})} className="inp w-full" /></div>
            <input value={form.prescriptions||''} onChange={e=>setForm({...form,prescriptions:e.target.value})} placeholder="Current prescriptions" className="inp" />
            <div><label className="text-[10px] text-slate-500">Rx Follow-up Date</label><input type="date" value={form.prescriptionFollowUp||''} onChange={e=>setForm({...form,prescriptionFollowUp:e.target.value})} className="inp w-full" /></div>
            <select value={form.status||'active'} onChange={e=>setForm({...form,status:e.target.value as Patient['status']})} className="inp"><option value="active">Active</option><option value="discharged">Discharged</option><option value="no-show">No-show</option></select>
          </div>
          <textarea value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Clinical notes..." rows={2} className="inp w-full resize-none" />
          <div className="flex gap-2 justify-end"><button onClick={reset} className="px-4 py-2 text-slate-400 text-sm">Cancel</button><button onClick={handleSave} className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold active:scale-95">{editId?'Update':'Save'}</button></div>
        </div>
      )}

      {ds && (
        <div className="bg-slate-900/80 border border-emerald-500/20 rounded-2xl p-4 animate-fadeIn">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white font-bold text-lg">{ds.name}</p>
            <div className="flex gap-2"><button onClick={()=>startEdit(ds)} className="text-emerald-400 text-sm">✏️</button><button onClick={()=>handleDelete(ds.id)} className="text-red-400 text-sm">🗑️</button><button onClick={()=>setDetail(null)} className="text-slate-500 text-lg">✕</button></div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <D l="Phone" v={ds.phone} /><D l="Email" v={ds.email} /><D l="Diagnosis" v={ds.diagnosis} /><D l="Status" v={ds.status} />
            <D l="Next Appointment" v={store.formatDate(ds.nextAppointment)} warn={store.isOverdue(ds.nextAppointment)} />
            <D l="Last Visit" v={store.formatDate(ds.lastVisit)} /><D l="Prescriptions" v={ds.prescriptions} />
            <D l="Rx Follow-up" v={store.formatDate(ds.prescriptionFollowUp)} warn={store.isOverdue(ds.prescriptionFollowUp)} />
          </div>
          {ds.notes && <p className="text-slate-400 text-xs mt-3 p-2 bg-slate-800/30 rounded-lg">{ds.notes}</p>}
          <div className="flex flex-wrap gap-2 mt-3">
            {ds.phone && <a href={helpers.waLink(ds.phone, helpers.patientReminderMsg(ds, ds.nextAppointment))} target="_blank" rel="noopener noreferrer" className="text-[11px] px-3 py-1.5 bg-green-600/20 text-green-400 rounded-lg font-medium active:scale-95">💬 Appt Reminder</a>}
            {ds.phone && <a href={helpers.waLink(ds.phone, helpers.patientRxFollowUp(ds))} target="_blank" rel="noopener noreferrer" className="text-[11px] px-3 py-1.5 bg-green-600/20 text-green-400 rounded-lg font-medium active:scale-95">💬 Rx Follow-up</a>}
            {ds.phone && <a href={`tel:${ds.phone}`} className="text-[11px] px-3 py-1.5 bg-blue-600/20 text-blue-400 rounded-lg font-medium active:scale-95">📞 Call</a>}
            {ds.phone && <a href={helpers.waLink(ds.phone, `Hello ${ds.name}, this is Zerenity Wellness Clinic. How are you doing today?`)} target="_blank" rel="noopener noreferrer" className="text-[11px] px-3 py-1.5 bg-green-600/20 text-green-400 rounded-lg font-medium active:scale-95">💬 Check-in</a>}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.length === 0 ? <p className="text-center py-8 text-slate-500 text-sm">No patients found. Tap + Add to get started.</p> :
          filtered.map(p => (
            <button key={p.id} onClick={()=>setDetail(p.id)} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left active:scale-[0.98] ${detail===p.id?'bg-emerald-600/10 border-emerald-500/30':'bg-slate-900/50 border-slate-800/30'} ${p.status!=='active'?'opacity-50':''}`}>
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm flex-shrink-0">{p.name.charAt(0)}</div>
              <div className="flex-1 min-w-0"><p className="text-white text-sm font-medium truncate">{p.name}</p><p className="text-[11px] text-slate-500 truncate">{p.diagnosis||'No diagnosis'}</p></div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                {p.nextAppointment && store.isToday(p.nextAppointment) && <span className="text-[9px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">📅 Today</span>}
                {p.prescriptionFollowUp && store.isOverdue(p.prescriptionFollowUp) && p.status==='active' && <span className="text-[9px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">💊 Rx due</span>}
              </div>
            </button>
          ))
        }
      </div>
      <style>{`.inp { padding: 10px 14px; background: rgba(30,41,59,0.5); border: 1px solid rgba(51,65,85,0.5); border-radius: 12px; color: white; font-size: 14px; } .inp::placeholder { color: #64748b; } .inp:focus { outline: none; border-color: rgba(16,185,129,0.5); }`}</style>
    </div>
  );
}
function D({ l, v, warn }: { l: string; v: string; warn?: boolean }) { return <div><p className="text-slate-500 text-[10px]">{l}</p><p className={`text-sm ${warn?'text-red-400':'text-white'}`}>{v||'—'}</p></div>; }
