import { useState, useEffect } from 'react';
import type { Student, MentorshipSession } from '../utils/types';
import { MENTORSHIP_TOPICS } from '../utils/types';
import * as store from '../utils/store';
import * as helpers from '../utils/helpers';

const tabs = ['All Students', 'University', 'Secondary', 'Mentorship'];

export default function Students() {
  const [sts, setSts] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<MentorshipSession[]>([]);
  const [tab, setTab] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const empty: Partial<Student> = { name:'',level:'secondary',school:'',classYear:'',mentorName:'',mentorPhone:'',mentorEmail:'',feeStatus:'unpaid',totalFee:0,feePaid:0,phone:'',guardianName:'',guardianPhone:'',lastResult:'',lastFollowUp:'',nextFollowUp:'',notes:'',status:'active' };
  const [form, setForm] = useState<Partial<Student>>(empty);

  useEffect(() => { reload(); }, []);
  function reload() { setSts(store.students.get()); setSessions(store.mentorship.get()); }
  function reset() { setForm(empty); setEditId(null); setShowForm(false); }

  function handleSave() {
    if (!form.name?.trim()) return;
    const now = new Date().toISOString();
    if (editId) { const ex = sts.find(s => s.id === editId); if (ex) store.students.update({ ...ex, ...form, updatedAt: now } as Student); }
    else { store.students.add({ ...form, id: store.genId(), createdAt: now, updatedAt: now } as Student); }
    reset(); reload();
  }

  function startEdit(s: Student) { setForm(s); setEditId(s.id); setShowForm(true); setDetail(null); }
  function handleDelete(id: string) { if (confirm('Delete?')) { store.students.delete(id); reload(); setDetail(null); } }

  const month = store.currentMonth();
  const topic = MENTORSHIP_TOPICS[month];
  const settings = store.getSettings();

  const filtered = sts
    .filter(s => tab === 0 ? true : tab === 1 ? s.level === 'university' : tab === 2 ? s.level === 'secondary' : s.level === 'university')
    .filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const uniStudents = sts.filter(s => s.level === 'university' && s.status === 'active');
  const secStudents = sts.filter(s => s.level === 'secondary' && s.status === 'active');

  const ds = detail ? sts.find(s => s.id === detail) : null;

  function getSessionStatus(studentId: string) {
    return sessions.find(s => s.studentId === studentId && s.month === `${new Date().getFullYear()}-${month}`);
  }

  function createSession(student: Student) {
    store.mentorship.add({ id: store.genId(), month: `${new Date().getFullYear()}-${month}`, studentId: student.id, mentorName: student.mentorName, scheduledDate: '', status: 'pending', notes: '', createdAt: new Date().toISOString() });
    reload();
  }

  function updateSession(id: string, updates: Partial<MentorshipSession>) {
    const s = sessions.find(x => x.id === id);
    if (s) { store.mentorship.update({ ...s, ...updates }); reload(); }
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">🎓 Scholarship Students</h1>
          <p className="text-slate-500 text-xs">{sts.filter(s => s.status === 'active').length} active scholars</p>
        </div>
        <button onClick={() => { reset(); setShowForm(true); }} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold active:scale-95 transition-transform">+ Add</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
        {tabs.map((t, i) => (
          <button key={t} onClick={() => { setTab(i); setDetail(null); }} className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${tab === i ? 'bg-blue-600 text-white' : 'bg-slate-800/50 text-slate-400'}`}>{t}</button>
        ))}
      </div>

      {/* Mentorship Tab */}
      {tab === 3 ? (
        <div className="space-y-4">
          {/* Current topic */}
          {topic && (
            <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-4">
              <p className="text-blue-400 text-xs font-bold mb-1">📚 THIS MONTH'S TOPIC</p>
              <p className="text-white font-bold text-lg">{topic.title}</p>
              <div className="mt-2 space-y-1">{topic.focus.map((f, i) => <p key={i} className="text-slate-300 text-xs">• {f}</p>)}</div>
            </div>
          )}

          {/* University - Individual Sessions */}
          <div className="bg-slate-900/50 border border-slate-800/30 rounded-2xl p-4">
            <p className="text-white font-semibold text-sm mb-3">🎓 University Scholars — Individual Mentorship</p>
            {uniStudents.length === 0 ? <p className="text-slate-500 text-xs">No university students yet.</p> : (
              <div className="space-y-3">
                {uniStudents.map(s => {
                  const session = getSessionStatus(s.id);
                  return (
                    <div key={s.id} className="p-3 bg-slate-800/30 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-white text-sm font-medium">{s.name}</p>
                          <p className="text-slate-500 text-[11px]">{s.classYear} · Mentor: {s.mentorName || 'Not assigned'}</p>
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${!session ? 'bg-slate-700 text-slate-400' : session.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : session.status === 'scheduled' || session.status === 'reminder-sent' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          {!session ? 'Not started' : session.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {!session && s.mentorName && (
                          <button onClick={() => createSession(s)} className="text-[11px] px-3 py-1.5 bg-blue-600/20 text-blue-400 rounded-lg font-medium active:scale-95">Start Session</button>
                        )}
                        {session && session.status === 'pending' && s.mentorPhone && topic && (
                          <a href={helpers.waLink(s.mentorPhone, helpers.mentorNotifyMsg(s.mentorName, s.name, topic, settings.calendlyLink))} target="_blank" rel="noopener noreferrer" className="text-[11px] px-3 py-1.5 bg-green-600/20 text-green-400 rounded-lg font-medium active:scale-95 flex items-center gap-1">💬 WhatsApp Mentor</a>
                        )}
                        {session && session.status === 'pending' && (
                          <button onClick={() => { const d = prompt('Enter scheduled date (YYYY-MM-DD):'); if (d) updateSession(session.id, { scheduledDate: d, status: 'scheduled' }); }} className="text-[11px] px-3 py-1.5 bg-violet-600/20 text-violet-400 rounded-lg font-medium active:scale-95">📅 Set Date</button>
                        )}
                        {session && session.status === 'scheduled' && s.phone && (
                          <a href={helpers.waLink(s.phone, helpers.menteeSessionMsg(s.name, s.mentorName, session.scheduledDate, topic!))} target="_blank" rel="noopener noreferrer" className="text-[11px] px-3 py-1.5 bg-green-600/20 text-green-400 rounded-lg font-medium active:scale-95 flex items-center gap-1">💬 Notify Student</a>
                        )}
                        {session && (session.status === 'scheduled' || session.status === 'reminder-sent') && s.phone && (
                          <a href={helpers.waLink(s.phone, helpers.menteeReminderMsg(s.name, s.mentorName, session.scheduledDate))} target="_blank" rel="noopener noreferrer" className="text-[11px] px-3 py-1.5 bg-amber-600/20 text-amber-400 rounded-lg font-medium active:scale-95">🔔 Remind Student</a>
                        )}
                        {session && session.status !== 'completed' && session.status !== 'missed' && (
                          <button onClick={() => updateSession(session.id, { status: 'completed' })} className="text-[11px] px-3 py-1.5 bg-emerald-600/20 text-emerald-400 rounded-lg font-medium active:scale-95">✅ Done</button>
                        )}
                      </div>
                      {session?.scheduledDate && <p className="text-slate-500 text-[10px] mt-2">📅 Scheduled: {store.formatDate(session.scheduledDate)}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Secondary - Group */}
          <div className="bg-slate-900/50 border border-slate-800/30 rounded-2xl p-4">
            <p className="text-white font-semibold text-sm mb-2">🏫 Secondary Scholars — Group Mentorship</p>
            <p className="text-slate-400 text-xs mb-3">Monthly group session at the Iperu Office. {secStudents.length} scholars.</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {secStudents.map(s => <span key={s.id} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded-full">{s.name}</span>)}
            </div>
            {secStudents.length === 0 && <p className="text-slate-500 text-xs">No secondary students yet.</p>}
          </div>

          {/* Calendly */}
          {!settings.calendlyLink && (
            <div className="bg-amber-600/10 border border-amber-500/20 rounded-xl p-3">
              <p className="text-amber-300 text-xs">⚠️ Calendly link not set. Go to <strong>Integrations</strong> to add it for mentor scheduling.</p>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Search */}
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..." className="w-full px-4 py-3 bg-slate-900/50 border border-slate-800/50 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500/50" />

          {/* Form */}
          {showForm && (
            <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-4 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <p className="text-white font-semibold text-sm">{editId ? 'Edit Student' : 'Add Student'}</p>
                <button onClick={reset} className="text-slate-500 text-lg">✕</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} placeholder="Full name *" className="inp" />
                <select value={form.level || 'secondary'} onChange={e => setForm({...form, level: e.target.value as Student['level']})} className="inp"><option value="secondary">Secondary</option><option value="university">University</option><option value="awaiting">Awaiting Admission</option></select>
                <input value={form.school || ''} onChange={e => setForm({...form, school: e.target.value})} placeholder="School" className="inp" />
                <input value={form.classYear || ''} onChange={e => setForm({...form, classYear: e.target.value})} placeholder="Class/Level (e.g. JSS 1, 200 Level)" className="inp" />
                <input value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Student phone" className="inp" />
                <input value={form.guardianPhone || ''} onChange={e => setForm({...form, guardianPhone: e.target.value})} placeholder="Guardian phone" className="inp" />
                <input value={form.guardianName || ''} onChange={e => setForm({...form, guardianName: e.target.value})} placeholder="Guardian name" className="inp" />
                <select value={form.feeStatus || 'unpaid'} onChange={e => setForm({...form, feeStatus: e.target.value as Student['feeStatus']})} className="inp">
                  <option value="paid">✅ Paid</option><option value="partial">⏳ Partial</option><option value="unpaid">❌ Unpaid</option><option value="na">N/A</option>
                </select>
                <input type="number" value={form.totalFee || ''} onChange={e => setForm({...form, totalFee: +e.target.value})} placeholder="Total fee (₦)" className="inp" />
                <input type="number" value={form.feePaid || ''} onChange={e => setForm({...form, feePaid: +e.target.value})} placeholder="Amount paid (₦)" className="inp" />
                {(form.level === 'university' || form.level === 'awaiting') && <>
                  <input value={form.mentorName || ''} onChange={e => setForm({...form, mentorName: e.target.value})} placeholder="Mentor name" className="inp" />
                  <input value={form.mentorPhone || ''} onChange={e => setForm({...form, mentorPhone: e.target.value})} placeholder="Mentor phone (WhatsApp)" className="inp" />
                  <input value={form.mentorEmail || ''} onChange={e => setForm({...form, mentorEmail: e.target.value})} placeholder="Mentor email" className="inp" />
                </>}
                <input value={form.lastResult || ''} onChange={e => setForm({...form, lastResult: e.target.value})} placeholder="Last result summary" className="inp" />
                <select value={form.status || 'active'} onChange={e => setForm({...form, status: e.target.value as Student['status']})} className="inp">
                  <option value="active">Active</option><option value="graduated">Graduated</option><option value="suspended">Suspended</option><option value="awaiting">Awaiting</option>
                </select>
                <div><label className="text-[10px] text-slate-500">Next Follow-up</label><input type="date" value={form.nextFollowUp || ''} onChange={e => setForm({...form, nextFollowUp: e.target.value})} className="inp w-full" /></div>
              </div>
              <textarea value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Notes..." rows={2} className="inp w-full resize-none" />
              <div className="flex gap-2 justify-end">
                <button onClick={reset} className="px-4 py-2 text-slate-400 text-sm">Cancel</button>
                <button onClick={handleSave} className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold active:scale-95">{editId ? 'Update' : 'Save'}</button>
                {!editId && <button onClick={() => { handleSave(); setShowForm(true); setForm(empty); }} className="px-5 py-2 bg-blue-600/50 text-white rounded-xl text-sm font-semibold active:scale-95">Save & Add More</button>}
              </div>
            </div>
          )}

          {/* Detail */}
          {ds && (
            <div className="bg-slate-900/80 border border-blue-500/20 rounded-2xl p-4 animate-fadeIn">
              <div className="flex items-center justify-between mb-3">
                <p className="text-white font-bold text-lg">{ds.name}</p>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(ds)} className="text-blue-400 text-sm">✏️</button>
                  <button onClick={() => handleDelete(ds.id)} className="text-red-400 text-sm">🗑️</button>
                  <button onClick={() => setDetail(null)} className="text-slate-500 text-lg">✕</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <D l="Level" v={ds.level} /><D l="Class/Year" v={ds.classYear} /><D l="School" v={ds.school} /><D l="Status" v={ds.status} />
                <D l="Fee Status" v={ds.feeStatus} warn={ds.feeStatus === 'unpaid'} /><D l="Fee" v={`₦${(ds.feePaid||0).toLocaleString()} / ₦${(ds.totalFee||0).toLocaleString()}`} />
                <D l="Phone" v={ds.phone} /><D l="Guardian" v={`${ds.guardianName || ''} ${ds.guardianPhone || ''}`} />
                {ds.level === 'university' && <><D l="Mentor" v={ds.mentorName} /><D l="Mentor Phone" v={ds.mentorPhone} /></>}
                <D l="Last Result" v={ds.lastResult} /><D l="Next Follow-up" v={store.formatDate(ds.nextFollowUp)} warn={store.isOverdue(ds.nextFollowUp)} />
              </div>
              {ds.notes && <p className="text-slate-400 text-xs mt-3 p-2 bg-slate-800/30 rounded-lg">{ds.notes}</p>}
              {/* WhatsApp Actions */}
              <div className="flex flex-wrap gap-2 mt-3">
                {ds.phone && <a href={helpers.waLink(ds.phone, helpers.studentFollowUpMsg(ds))} target="_blank" rel="noopener noreferrer" className="text-[11px] px-3 py-1.5 bg-green-600/20 text-green-400 rounded-lg font-medium active:scale-95">💬 WhatsApp Student</a>}
                {ds.guardianPhone && <a href={helpers.waLink(ds.guardianPhone, `Hello, this is MSG Foundation. We'd like to check in regarding ${ds.name}'s progress.`)} target="_blank" rel="noopener noreferrer" className="text-[11px] px-3 py-1.5 bg-green-600/20 text-green-400 rounded-lg font-medium active:scale-95">💬 WhatsApp Guardian</a>}
                {ds.mentorPhone && <a href={helpers.waLink(ds.mentorPhone, `Hello ${ds.mentorName}, this is MSG Foundation regarding your mentee ${ds.name}.`)} target="_blank" rel="noopener noreferrer" className="text-[11px] px-3 py-1.5 bg-green-600/20 text-green-400 rounded-lg font-medium active:scale-95">💬 WhatsApp Mentor</a>}
                {ds.phone && <a href={`tel:${ds.phone}`} className="text-[11px] px-3 py-1.5 bg-blue-600/20 text-blue-400 rounded-lg font-medium active:scale-95">📞 Call Student</a>}
              </div>
            </div>
          )}

          {/* List */}
          <div className="space-y-2">
            {filtered.length === 0 ? <p className="text-center py-8 text-slate-500 text-sm">No students found. Tap + Add to get started.</p> :
              filtered.map(s => (
                <button key={s.id} onClick={() => setDetail(s.id)} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left active:scale-[0.98] ${detail === s.id ? 'bg-blue-600/10 border-blue-500/30' : 'bg-slate-900/50 border-slate-800/30'} ${s.status !== 'active' ? 'opacity-50' : ''}`}>
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm flex-shrink-0">{s.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{s.name}</p>
                    <p className="text-[11px] text-slate-500">{s.level === 'university' ? '🎓' : s.level === 'secondary' ? '🏫' : '⏳'} {s.classYear || s.level} · {s.school || '—'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${s.feeStatus === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : s.feeStatus === 'partial' ? 'bg-amber-500/20 text-amber-400' : s.feeStatus === 'unpaid' ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-400'}`}>{s.feeStatus}</span>
                    {s.nextFollowUp && store.isOverdue(s.nextFollowUp) && s.status === 'active' && <span className="text-[9px] text-red-400">follow-up due</span>}
                    {s.mentorName && <span className="text-[9px] text-slate-600">{s.mentorName}</span>}
                  </div>
                </button>
              ))
            }
          </div>
        </>
      )}

      <style>{`.inp { padding: 10px 14px; background: rgba(30,41,59,0.5); border: 1px solid rgba(51,65,85,0.5); border-radius: 12px; color: white; font-size: 14px; } .inp::placeholder { color: #64748b; } .inp:focus { outline: none; border-color: rgba(59,130,246,0.5); }`}</style>
    </div>
  );
}

function D({ l, v, warn }: { l: string; v: string; warn?: boolean }) {
  return <div><p className="text-slate-500 text-[10px]">{l}</p><p className={`text-sm ${warn ? 'text-red-400' : 'text-white'}`}>{v || '—'}</p></div>;
}
