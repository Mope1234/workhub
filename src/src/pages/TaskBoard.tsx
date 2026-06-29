import { useState, useEffect } from 'react';
import type { Task, Workspace } from '../utils/types';
import { MSG_CATEGORIES, ZWC_CATEGORIES } from '../utils/types';
import * as store from '../utils/store';

export default function TaskBoard({ workspace }: { workspace: Workspace }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all'|'todo'|'in-progress'|'done'>('all');
  const cats = workspace === 'msg' ? MSG_CATEGORIES : ZWC_CATEGORIES;
  const accent = workspace === 'msg' ? 'blue' : 'emerald';

  const empty: Partial<Task> = { title:'',description:'',priority:'medium',status:'todo',category:'General',dueDate:store.todayISO(),recurring:'none',workspace };
  const [form, setForm] = useState<Partial<Task>>(empty);

  useEffect(() => { reload(); }, [workspace]);
  function reload() { setTasks(store.getTasks(workspace)); }
  function reset() { setForm({...empty,workspace}); setEditId(null); setShowForm(false); }

  function handleSave() {
    if (!form.title?.trim()) return;
    if (editId) { const ex = tasks.find(t=>t.id===editId); if(ex) store.updateTask(workspace,{...ex,...form} as Task); }
    else { store.addTask(workspace,{...form,id:store.genId(),workspace,createdAt:new Date().toISOString()} as Task); }
    reset(); reload();
  }

  function toggleStatus(t: Task) {
    const next = t.status==='todo'?'in-progress':t.status==='in-progress'?'done':'todo';
    store.updateTask(workspace,{...t,status:next,completedAt:next==='done'?new Date().toISOString():undefined});
    reload();
  }

  function handleDelete(id: string) { if(confirm('Delete?')) { store.deleteTask(workspace,id); reload(); } }
  function startEdit(t: Task) { setForm(t); setEditId(t.id); setShowForm(true); }

  const filtered = tasks
    .filter(t => filterStatus==='all' || t.status===filterStatus)
    .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b) => {
      if(a.status==='done'&&b.status!=='done') return 1;
      if(a.status!=='done'&&b.status==='done') return -1;
      const p = {urgent:0,high:1,medium:2,low:3};
      if(p[a.priority]!==p[b.priority]) return p[a.priority]-p[b.priority];
      return new Date(a.dueDate).getTime()-new Date(b.dueDate).getTime();
    });

  const overdue = tasks.filter(t=>t.status!=='done'&&store.isOverdue(t.dueDate)).length;
  const done = tasks.filter(t=>t.status==='done').length;
  const pending = tasks.filter(t=>t.status!=='done').length;

  const pColor = { urgent:'bg-red-500/20 text-red-400', high:'bg-orange-500/20 text-orange-400', medium:`bg-${accent}-500/20 text-${accent}-400`, low:'bg-slate-500/20 text-slate-400' };
  const sIcon = { todo:'⬜', 'in-progress':'🔄', done:'✅' };

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-white">✅ Tasks</h1><p className="text-slate-500 text-xs">{pending} pending · {done} done · {overdue} overdue</p></div>
        <button onClick={()=>{reset();setShowForm(true);}} className={`px-4 py-2.5 bg-${accent}-600 text-white rounded-xl text-sm font-semibold active:scale-95`}>+ New</button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['all','todo','in-progress','done'] as const).map(s => (
          <button key={s} onClick={()=>setFilterStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${filterStatus===s?`bg-${accent}-600 text-white`:'bg-slate-800/50 text-slate-400'}`}>{s==='all'?'All':s==='todo'?'To Do':s==='in-progress'?'In Progress':'Done'}</button>
        ))}
      </div>

      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search tasks..." className={`w-full px-4 py-3 bg-slate-900/50 border border-slate-800/50 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-${accent}-500/50`} />

      {showForm && (
        <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-4 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between"><p className="text-white font-semibold text-sm">{editId?'Edit':'New'} Task</p><button onClick={reset} className="text-slate-500 text-lg">✕</button></div>
          <input value={form.title||''} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Task title *" className="inp w-full" />
          <textarea value={form.description||''} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Description..." rows={2} className="inp w-full resize-none" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <select value={form.category||'General'} onChange={e=>setForm({...form,category:e.target.value})} className="inp">{cats.map(c=><option key={c} value={c}>{c}</option>)}</select>
            <select value={form.priority||'medium'} onChange={e=>setForm({...form,priority:e.target.value as Task['priority']})} className="inp"><option value="urgent">🔴 Urgent</option><option value="high">🟠 High</option><option value="medium">🔵 Medium</option><option value="low">⚪ Low</option></select>
            <select value={form.recurring||'none'} onChange={e=>setForm({...form,recurring:e.target.value as Task['recurring']})} className="inp"><option value="none">One-time</option><option value="daily">♻️ Daily</option><option value="weekly">♻️ Weekly</option><option value="monthly">♻️ Monthly</option></select>
            <input type="date" value={form.dueDate||''} onChange={e=>setForm({...form,dueDate:e.target.value})} className="inp" />
          </div>
          <div className="flex gap-2 justify-end"><button onClick={reset} className="px-4 py-2 text-slate-400 text-sm">Cancel</button><button onClick={handleSave} className={`px-5 py-2 bg-${accent}-600 text-white rounded-xl text-sm font-semibold active:scale-95`}>{editId?'Update':'Add'}</button></div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.length===0 ? <p className="text-center py-8 text-slate-500 text-sm">No tasks found.</p> :
          filtered.map(t => (
            <div key={t.id} className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${t.status==='done'?'bg-slate-900/20 border-slate-800/20 opacity-50':'bg-slate-900/50 border-slate-800/30'}`}>
              <button onClick={()=>toggleStatus(t)} className="text-lg mt-0.5 active:scale-90 flex-shrink-0">{sIcon[t.status]}</button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${t.status==='done'?'text-slate-500 line-through':'text-white'}`}>{t.title}</p>
                {t.description && <p className="text-[11px] text-slate-500 truncate">{t.description}</p>}
                <div className="flex flex-wrap items-center gap-1 mt-1">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${pColor[t.priority]}`}>{t.priority}</span>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">{t.category}</span>
                  {t.recurring!=='none' && <span className="text-[10px] bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded">♻️ {t.recurring}</span>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className={`text-[10px] ${store.isOverdue(t.dueDate)&&t.status!=='done'?'text-red-400':store.isToday(t.dueDate)?'text-amber-400':'text-slate-500'}`}>
                  {store.isOverdue(t.dueDate)&&t.status!=='done'?`${Math.abs(store.daysUntil(t.dueDate))}d late`:store.isToday(t.dueDate)?'Today':store.formatDate(t.dueDate)}
                </span>
                <div className="flex gap-1">
                  <button onClick={()=>startEdit(t)} className="text-xs text-slate-600 hover:text-blue-400 p-1">✏️</button>
                  <button onClick={()=>handleDelete(t.id)} className="text-xs text-slate-600 hover:text-red-400 p-1">🗑️</button>
                </div>
              </div>
            </div>
          ))
        }
      </div>
      <style>{`.inp { padding: 10px 14px; background: rgba(30,41,59,0.5); border: 1px solid rgba(51,65,85,0.5); border-radius: 12px; color: white; font-size: 14px; } .inp::placeholder { color: #64748b; } .inp:focus { outline: none; border-color: rgba(59,130,246,0.5); }`}</style>
    </div>
  );
}
