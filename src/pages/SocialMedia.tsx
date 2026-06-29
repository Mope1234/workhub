import { useState, useEffect } from 'react';
import type { SocialPost, Workspace } from '../utils/types';
import { MSG_HASHTAGS, ZWC_HASHTAGS } from '../utils/types';
import * as store from '../utils/store';
import { enhancePost } from '../utils/helpers';
import { generatePost, getPostThemes, getTodayTheme } from '../utils/ai';

export default function SocialMedia({ workspace }: { workspace: Workspace }) {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [tips, setTips] = useState<string[]>([]);
  const hashtags = workspace === 'msg' ? MSG_HASHTAGS : ZWC_HASHTAGS;
  const accent = workspace === 'msg' ? 'blue' : 'emerald';
  const settings = store.getSettings();
  const todayTheme = getTodayTheme(workspace);
  const themes = getPostThemes(workspace);

  const empty: Partial<SocialPost> = { content: '', platform: 'all', status: 'draft', scheduledDate: '', hashtags: '', notes: '', workspace };
  const [form, setForm] = useState<Partial<SocialPost>>(empty);

  useEffect(() => { reload(); }, [workspace]);
  function reload() { setPosts(store.getPosts(workspace)); }
  function reset() { setForm({ ...empty, workspace }); setEditId(null); setShowForm(false); setTips([]); }

  function handleSave() {
    if (!form.content?.trim()) return;
    if (editId) { const ex = posts.find(p => p.id === editId); if (ex) store.updatePost(workspace, { ...ex, ...form } as SocialPost); }
    else { store.addPost(workspace, { ...form, id: store.genId(), workspace, createdAt: new Date().toISOString() } as SocialPost); }
    reset(); reload();
  }

  function handleDelete(id: string) { if (confirm('Delete?')) { store.deletePost(workspace, id); reload(); } }
  function startEdit(p: SocialPost) { setForm(p); setEditId(p.id); setShowForm(true); setTips([]); }
  function markPosted(id: string) { const p = posts.find(x => x.id === id); if (p) { store.updatePost(workspace, { ...p, status: 'posted' }); reload(); } }
  function addHashtag(h: string) { const c = form.hashtags || ''; if (!c.includes(h)) setForm({ ...form, hashtags: c ? c + ' ' + h : h }); }

  function aiGenerate(theme: string) {
    const content = generatePost(workspace, theme);
    setForm({ ...empty, workspace, content });
    setShowForm(true);
    setTips([]);
  }

  const socialLink = workspace === 'msg' ? settings.msgFacebook : settings.zerenityInstagram || settings.zerenityWebsite;
  const posted = posts.filter(p => p.status === 'posted').length;
  const drafts = posts.filter(p => p.status === 'draft').length;

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-white">📱 Social Media</h1><p className="text-slate-500 text-xs">{workspace === 'msg' ? 'MSG Foundation' : 'Zerenity Wellness'} · {posted} posted · {drafts} drafts</p></div>
        <button onClick={() => { reset(); setShowForm(true); }} className={`px-4 py-2.5 bg-${accent}-600 text-white rounded-xl text-sm font-semibold active:scale-95`}>+ New</button>
      </div>

      {socialLink && <a href={socialLink} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 p-3 rounded-xl bg-${accent}-600/10 border border-${accent}-500/20 active:scale-95`}><span>🔗</span><span className={`text-${accent}-400 text-sm font-medium`}>Open {workspace === 'msg' ? 'Facebook' : 'Website'} →</span></a>}

      {/* Today's Theme */}
      <div className="bg-violet-600/10 border border-violet-500/20 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-violet-400 text-xs font-bold">✨ TODAY'S CONTENT THEME</p>
          <span className="text-xl">{todayTheme.emoji}</span>
        </div>
        <p className="text-white font-bold">{todayTheme.label}</p>
        <button onClick={() => aiGenerate(todayTheme.theme)} className="mt-2 px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-semibold active:scale-95">✨ Generate Today's Post</button>
      </div>

      {/* AI Themes Grid */}
      <div>
        <p className="text-white font-semibold text-sm mb-2">✨ AI Post Generator — Pick a Theme</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {themes.map(t => (
            <button key={t.key} onClick={() => aiGenerate(t.key)} className="flex items-center gap-2 p-3 bg-slate-900/50 border border-slate-800/30 rounded-xl text-left hover:border-violet-500/30 active:scale-95 transition-all">
              <span className="text-lg">{t.emoji}</span>
              <span className="text-white text-xs font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Compose */}
      {showForm && (
        <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-4 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between"><p className="text-white font-semibold text-sm">{editId ? 'Edit Post' : '✏️ Compose'}</p><button onClick={reset} className="text-slate-500 text-lg">✕</button></div>
          <textarea value={form.content || ''} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Write your post..." rows={10} className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none resize-none" style={{ fontSize: '16px' }} />
          <div className="flex items-center justify-between">
            <p className="text-slate-500 text-[10px]">{(form.content || '').length} chars</p>
            <button onClick={() => setTips(enhancePost(form.content || '', workspace))} className="px-3 py-1.5 bg-violet-600/20 text-violet-400 rounded-lg text-[11px] font-semibold border border-violet-500/30 active:scale-95">✨ AI Tips</button>
          </div>
          {tips.length > 0 && (
            <div className="bg-violet-600/10 border border-violet-500/20 rounded-xl p-3 space-y-1">
              {tips.map((t, i) => <p key={i} className="text-violet-300 text-xs">{t}</p>)}
            </div>
          )}

          <div><p className="text-slate-400 text-xs mb-1">Hashtags:</p>
            <div className="flex flex-wrap gap-1">{hashtags.map(h => <button key={h} onClick={() => addHashtag(h)} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded-full active:scale-95">{h}</button>)}</div>
            <input value={form.hashtags || ''} onChange={e => setForm({ ...form, hashtags: e.target.value })} placeholder="Selected hashtags..." className="w-full mt-2 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-sm focus:outline-none" style={{ fontSize: '16px' }} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <select value={form.platform || 'all'} onChange={e => setForm({ ...form, platform: e.target.value as SocialPost['platform'] })} className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white"><option value="all">All Platforms</option><option value="instagram">Instagram</option><option value="facebook">Facebook</option><option value="twitter">Twitter/X</option><option value="linkedin">LinkedIn</option></select>
            <select value={form.status || 'draft'} onChange={e => setForm({ ...form, status: e.target.value as SocialPost['status'] })} className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white"><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="posted">Posted</option></select>
          </div>
          <div className="flex gap-2 justify-end flex-wrap">
            <button onClick={reset} className="px-4 py-2 text-slate-400 text-sm">Cancel</button>
            <button onClick={() => { if (form.content) navigator.clipboard.writeText((form.content || '') + '\n\n' + (form.hashtags || '')).then(() => alert('Copied! Paste it on your social media.')); }} className="px-4 py-2 bg-slate-700 text-white rounded-xl text-sm active:scale-95">📋 Copy</button>
            <button onClick={handleSave} className={`px-5 py-2 bg-${accent}-600 text-white rounded-xl text-sm font-semibold active:scale-95`}>{editId ? 'Update' : 'Save'}</button>
          </div>
        </div>
      )}

      {/* Posts */}
      <div className="space-y-3">
        {posts.length === 0 ? <p className="text-center py-8 text-slate-500 text-sm">No posts yet. Generate one with AI above!</p> :
          posts.map(p => (
            <div key={p.id} className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/30">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${p.status === 'posted' ? 'bg-emerald-500/20 text-emerald-400' : p.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'}`}>{p.status}</span>
                  <span className="text-[10px] text-slate-500">{p.platform}</span>
                  <span className="text-[10px] text-slate-600">{store.formatDate(p.createdAt.split('T')[0])}</span>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {p.status !== 'posted' && <button onClick={() => markPosted(p.id)} className="text-xs p-1">✅</button>}
                  <button onClick={() => startEdit(p)} className="text-xs p-1">✏️</button>
                  <button onClick={() => handleDelete(p.id)} className="text-xs p-1">🗑️</button>
                </div>
              </div>
              <p className="text-white text-sm whitespace-pre-wrap line-clamp-6">{p.content}</p>
              {p.hashtags && <p className="text-slate-500 text-[10px] mt-2">{p.hashtags}</p>}
              <button onClick={() => navigator.clipboard.writeText(p.content + '\n\n' + (p.hashtags || '')).then(() => alert('Copied!'))} className="mt-2 text-[11px] text-slate-400 active:scale-95">📋 Copy</button>
            </div>
          ))}
      </div>
    </div>
  );
}
