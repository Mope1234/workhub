import { useState, useEffect, useRef } from 'react';
import { askAI, grammarCheck, composeMessage, getChatHistory, saveChatHistory, clearChatHistory } from '../utils/ai';
import type { AIChatMessage } from '../utils/ai';

const quickPrompts = [
  { emoji: '✍️', label: 'Fix grammar', prefix: 'grammar:' },
  { emoji: '📝', label: 'Compose message', prefix: 'compose:' },
  { emoji: '💡', label: 'Give me ideas', prefix: '' },
  { emoji: '📊', label: 'Help with report', prefix: '' },
];

export default function AIAssistant() {
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'chat' | 'grammar' | 'compose'>('chat');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMessages(getChatHistory()); }, []);
  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput('');

    const userMsg: AIChatMessage = { role: 'user', text: userText, ts: new Date().toISOString() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    saveChatHistory(updated);
    setLoading(true);

    let response: string;
    try {
      if (mode === 'grammar') {
        response = await grammarCheck(userText);
        setMode('chat');
      } else if (mode === 'compose') {
        response = await composeMessage(userText);
        setMode('chat');
      } else {
        // Build context-aware prompt
        const context = `You are WorkHub AI, a helpful assistant for Mopelola Kadiri who works as:
1. Programs Manager at MSG Foundation (msgbadebo.org) — a nonprofit giving scholarships to underprivileged children in Iperu, Ogun State, Nigeria. She reports to Dr. Gbadebo (Chairman).
2. Clinic Manager at Zerenity Wellness Clinic (zerenitywellness.org) — a mental health clinic owned by Dr. Fowobi Gbadebo.

She manages students, donors, trustees, patients, social media, fundraising, weekly reports, accounts, mentorship programs, and more — all without an assistant.

Be helpful, practical, concise, and professional. Answer in the context of her work. If she asks to compose something, write it professionally. If she asks about best practices, give practical Nigerian nonprofit/healthcare advice.

User's question: ${userText}`;
        response = await askAI(context);
      }
    } catch (e) {
      response = `Sorry, something went wrong: ${String(e)}. Please try again.`;
    }

    const aiMsg: AIChatMessage = { role: 'assistant', text: response, ts: new Date().toISOString() };
    const final = [...updated, aiMsg];
    setMessages(final);
    saveChatHistory(final);
    setLoading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function handleClear() {
    if (confirm('Clear all chat history?')) { clearChatHistory(); setMessages([]); }
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
  }

  function handleQuickPrompt(p: typeof quickPrompts[0]) {
    if (p.prefix === 'grammar:') {
      setMode('grammar');
      setInput('');
    } else if (p.prefix === 'compose:') {
      setMode('compose');
      setInput('');
    } else {
      setInput(p.label + ' for ');
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-5rem)] animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-bold text-white">🤖 AI Assistant</h1>
          <p className="text-slate-500 text-xs">Ask questions, compose messages, fix grammar, get ideas</p>
        </div>
        {messages.length > 0 && (
          <button onClick={handleClear} className="text-xs text-slate-500 hover:text-red-400 px-3 py-1.5 rounded-lg bg-slate-800/50 active:scale-95">🗑️ Clear</button>
        )}
      </div>

      {/* Mode indicator */}
      {mode !== 'chat' && (
        <div className="mb-2 p-2.5 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-between">
          <p className="text-violet-400 text-xs font-semibold">
            {mode === 'grammar' ? '✍️ Grammar mode — paste text to fix' : '📝 Compose mode — describe what you need'}
          </p>
          <button onClick={() => setMode('chat')} className="text-violet-400 text-xs active:scale-95">✕ Cancel</button>
        </div>
      )}

      {/* Quick prompts */}
      {messages.length === 0 && (
        <div className="mb-4">
          <p className="text-slate-500 text-xs mb-2">Quick actions:</p>
          <div className="grid grid-cols-2 gap-2">
            {quickPrompts.map((p, i) => (
              <button key={i} onClick={() => handleQuickPrompt(p)} className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/30 text-left active:scale-95 hover:border-slate-700">
                <span className="text-lg">{p.emoji}</span>
                <p className="text-white text-sm font-medium mt-1">{p.label}</p>
              </button>
            ))}
            <button onClick={() => setInput('Write a social media post for MSG Foundation about ')} className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/30 text-left active:scale-95 hover:border-slate-700">
              <span className="text-lg">📱</span>
              <p className="text-white text-sm font-medium mt-1">Social media post</p>
            </button>
            <button onClick={() => setInput('Write a professional email to ')} className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/30 text-left active:scale-95 hover:border-slate-700">
              <span className="text-lg">📧</span>
              <p className="text-white text-sm font-medium mt-1">Write email</p>
            </button>
            <button onClick={() => setInput('What are best practices for ')} className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/30 text-left active:scale-95 hover:border-slate-700">
              <span className="text-lg">🎯</span>
              <p className="text-white text-sm font-medium mt-1">Best practices</p>
            </button>
            <button onClick={() => setInput('Help me plan ')} className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/30 text-left active:scale-95 hover:border-slate-700">
              <span className="text-lg">📋</span>
              <p className="text-white text-sm font-medium mt-1">Plan something</p>
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 mb-3 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-800/80 text-slate-200 border border-slate-700/50'}`}>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] opacity-50">
                  {new Date(msg.ts).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                </span>
                {msg.role === 'assistant' && (
                  <button onClick={() => copyText(msg.text)} className="text-[10px] opacity-50 hover:opacity-100 active:scale-95">📋 Copy</button>
                )}
                {msg.role === 'assistant' && (
                  <a href={`https://wa.me/?text=${encodeURIComponent(msg.text)}`} target="_blank" rel="noopener noreferrer" className="text-[10px] opacity-50 hover:opacity-100 active:scale-95">💬 WhatsApp</a>
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2 items-end">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={mode === 'grammar' ? 'Paste text to fix grammar...' : mode === 'compose' ? 'Describe what to compose...' : 'Ask anything...'}
          rows={1}
          className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-800/50 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500/50 resize-none max-h-32"
          style={{ fontSize: '16px' }}
          onInput={(e) => {
            const t = e.target as HTMLTextAreaElement;
            t.style.height = 'auto';
            t.style.height = Math.min(t.scrollHeight, 128) + 'px';
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="px-4 py-3 bg-blue-600 text-white rounded-xl font-bold active:scale-95 disabled:opacity-40 flex-shrink-0"
        >
          {loading ? '⏳' : '➤'}
        </button>
      </div>
    </div>
  );
}
