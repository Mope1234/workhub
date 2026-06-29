import { useState, useEffect } from 'react';
import type { Donor } from '../utils/types';
import * as store from '../utils/store';
import * as helpers from '../utils/helpers';

export default function Donors() {
  const [dns, setDns] = useState<Donor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all'|'donor'|'trustee'>('all');
  const empty: Partial<Donor> = { name:'',type:'donor',email:'',phone:'',totalDonated:0,lastDonation:'',lastContact:'',nextFollowUp:'',notes:'',status:'active' };
  const [form, setForm] = useState<Partial<Donor>>(empty);

  useEffect(() => { reload(); }, []);
  function reload() { setDns(store.donors.get()); }
  function reset() { setForm(empty); setEditId(null); setShowForm(false); }
  function handleSave() {
    if (!form.name?.trim()) return;
    if (editId) { const ex = dns.find(d=>d.id===editId); if(ex) store.donors.update({...ex,...form} as Donor); }
    else { store.donors.add({...form, id:store.genId(), createdAt:new Date().toISOString()} as Donor); }
    reset(); reload();
  }
  function startEdit(d: Donor) { setForm(d); setEditId(d.id); setShowForm(true); setDetail(null); }
  function handleDelete(id: string) { if(confirm('Delete?')) { store.donors.delete(id); reload(); setDetail(null); } }

  const filtered = dns.filter(d => filterType === 'all' || d.type === filterType).filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase())).sort((a,b) => a.name.localeCompare(b.name));
  const total = dns.reduce((s,d) => s+(d.totalDonated||0), 0);
  const followUpsDue = dns.filter(d => d.nextFollowUp && (store.isToday(d.nextFollowUp) || store.isOverdue(d.nextFollowUp)));
  const ds = detail ? dns.find(d => d.id === detail) : null;
  const settings = store.getSettings();

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-white">🤝 Donors & Trustees</h1><p className="text-slate-500 text-xs">{dns.filter(d=>d.type==='donor').length} donors · {dns.filter(d=>d.type==='trustee').length} trustees</p></div>
        <button onClick={() => { reset(); setShowForm(true); }} className="px-4 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-semibold active:scale-95">+ Add</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/50 border border-slate-800/30 rounded-xl p-3 text-center"><span className="text-lg">💰</span><p className="text-xl font-bold text-amber-400">₦{total.toLocaleString()}</p><p className="text-[10px] text-slate-500">Total Received</p></div>
        <div className="bg-slate-900/50 border border-slate-800/30 rounded-xl p-3 text-center"><span className="text-lg">👥</span><p className="text-xl font-bold text-white">{dns.filter(d=>d.status==='active').length}</p><p className="text-[10px] text-slate-500">Active</p></div>
        <div className="bg-slate-900/50 border border-slate-800/30 rounded-xl p-3 text-center"><span className="text-lg">🌱</span><p className="text-xl font-bold text-emerald-400">{dns.filter(d=>d.status==='prospect').length}</p><p className="text-[10px] text-slate-500">Prospects</p></div>
        <div className="bg-slate-900/50 border border-slate-800/30 rounded-xl p-3 text-center"><span className="text-lg">📞</span><p className={`text-xl font-bold ${followUpsDue.length?'text-red-400':'text-slate-400'}`}>{followUpsDue.length}</p><p className="text-[10px] text-slate-500">Follow-ups Due</p></div>
      </div>

      {/* Bank Details */}
      <div className="bg-slate-900/50 border border-amber-500/20 rounded-xl p-3">
        <p className="text-amber-400 text-xs font-bold mb-1">🏦 DONATION ACCOUNT</p>
        <p className="text-white text-sm font-medium">{settings.bankAccountName}</p>
        <p className="text-slate-300 text-xs">{settings.bankName} · {settings.bankAccount}</p>
      </div>

      {followUpsDue.length > 0 && (
        <div className="bg-amber-600/10 border border-amber-500/20 rounded-xl p-3 space-y-1">
          {followUpsDue.map(d => <p key={d.id} className="text-amber-300 text-xs">📞 Follow up with <strong>{d.name}</strong> ({d.type})</p>)}
        </div>
      )}

      <div className="flex gap-2">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-800/50 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none" />
        <select value={filterType} onChange={e=>setFilterType(e.target.value as typeof filterType)} className="px-3 py-2 bg-slate-900/50 border border-slate-800/50 rounded-xl text-sm text-white"><option value="all">All</option><option value="donor">Donors</option><option value="trustee">Trustees</option></select>
      </div>

      {showForm && (
        <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-4 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between"><p className="text-white font-semibold text-sm">{editId ? 'Edit' : 'Add Contact'}</p><button onClick={reset} className="text-slate-500 text-lg">✕</button></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <input value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Full name *" className="inp" />
            <select value={form.type||'donor'} onChange={e=>setForm({...form,type:e.target.value as Donor['type']})} className="inp"><option value="donor">Donor</option><option value="trustee">Trustee</option></select>
            <input value={form.email||''} onChange={e=>setForm({...form,email:e.target.value})} placeholder="Email" className="inp" />
            <input value={form.phone||''} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="Phone (WhatsApp)" className="inp" />
            <input type="number" value={form.totalDonated||''} onChange={e=>setForm({...form,totalDonated:+e.target.value})} placeholder="Total donated (₦)" className="inp" />
            <select value={form.status||'active'} onChange={e=>setForm({...form,status:e.target.value as Donor['status']})} className="inp"><option value="active">Active</option><option value="prospect">Prospect</option><option value="lapsed">Lapsed</option></select>
            <div><label className="text-[10px] text-slate-500">Last Donation</label><input type="date" value={form.lastDonation||''} onChange={e=>setForm({...form,lastDonation:e.target.value})} className="inp w-full" /></div>
            <div><label className="text-[10px] text-slate-500">Next Follow-up</label><input type="date" value={form.nextFollowUp||''} onChange={e=>setForm({...form,nextFollowUp:e.target.value})} className="inp w-full" /></div>
          </div>
          <textarea value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Notes..." rows={2} className="inp w-full resize-none" />
          <div className="flex gap-2 justify-end"><button onClick={reset} className="px-4 py-2 text-slate-400 text-sm">Cancel</button><button onClick={handleSave} className="px-5 py-2 bg-amber-600 text-white rounded-xl text-sm font-semibold active:scale-95">{editId?'Update':'Save'}</button></div>
        </div>
      )}

      {ds && (
        <div className="bg-slate-900/80 border border-amber-500/20 rounded-2xl p-4 animate-fadeIn">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white font-bold text-lg">{ds.name}</p>
            <div className="flex gap-2"><button onClick={()=>startEdit(ds)} className="text-amber-400 text-sm">✏️</button><button onClick={()=>handleDelete(ds.id)} className="text-red-400 text-sm">🗑️</button><button onClick={()=>setDetail(null)} className="text-slate-500 text-lg">✕</button></div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <D l="Type" v={ds.type==='trustee'?'🏛️ Trustee':'💝 Donor'} /><D l="Status" v={ds.status} />
            <D l="Total Donated" v={`₦${(ds.totalDonated||0).toLocaleString()}`} /><D l="Last Donation" v={store.formatDate(ds.lastDonation)} />
            <D l="Phone" v={ds.phone} /><D l="Email" v={ds.email} />
            <D l="Last Contact" v={store.formatDate(ds.lastContact)} /><D l="Next Follow-up" v={store.formatDate(ds.nextFollowUp)} warn={store.isOverdue(ds.nextFollowUp)} />
          </div>
          {ds.notes && <p className="text-slate-400 text-xs mt-3 p-2 bg-slate-800/30 rounded-lg">{ds.notes}</p>}
          <div className="flex flex-wrap gap-2 mt-3">
            {ds.phone && <a href={helpers.waLink(ds.phone, helpers.donorThankYouMsg(ds))} target="_blank" rel="noopener noreferrer" className="text-[11px] px-3 py-1.5 bg-green-600/20 text-green-400 rounded-lg font-medium active:scale-95">💬 WhatsApp Thank You</a>}
            {ds.phone && <a href={`tel:${ds.phone}`} className="text-[11px] px-3 py-1.5 bg-blue-600/20 text-blue-400 rounded-lg font-medium active:scale-95">📞 Call</a>}
            {ds.email && <a href={`mailto:${ds.email}`} className="text-[11px] px-3 py-1.5 bg-violet-600/20 text-violet-400 rounded-lg font-medium active:scale-95">📧 Email</a>}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filtered.length === 0 ? <p className="text-center py-8 text-slate-500 text-sm">No contacts found.</p> :
          filtered.map(d => (
            <button key={d.id} onClick={()=>setDetail(d.id)} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left active:scale-[0.98] ${detail===d.id?'bg-amber-600/10 border-amber-500/30':'bg-slate-900/50 border-slate-800/30'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${d.type==='trustee'?'bg-violet-500/20 text-violet-400':'bg-amber-500/20 text-amber-400'}`}>{d.name.charAt(0)}</div>
              <div className="flex-1 min-w-0"><p className="text-white text-sm font-medium truncate">{d.name}</p><p className="text-[11px] text-slate-500">{d.type} · ₦{(d.totalDonated||0).toLocaleString()}</p></div>
              {d.nextFollowUp && (store.isToday(d.nextFollowUp)||store.isOverdue(d.nextFollowUp)) && <span className="text-[9px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded flex-shrink-0">due</span>}
            </button>
          ))
        }
      </div>
      <style>{`.inp { padding: 10px 14px; background: rgba(30,41,59,0.5); border: 1px solid rgba(51,65,85,0.5); border-radius: 12px; color: white; font-size: 14px; } .inp::placeholder { color: #64748b; } .inp:focus { outline: none; border-color: rgba(59,130,246,0.5); }`}</style>
    </div>
  );
}
function D({ l, v, warn }: { l: string; v: string; warn?: boolean }) { return <div><p className="text-slate-500 text-[10px]">{l}</p><p className={`text-sm ${warn?'text-red-400':'text-white'}`}>{v||'—'}</p></div>; }
