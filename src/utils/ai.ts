// AI: Groq (primary, 30rpm/14400rpd free) → Gemini (backup) → DevToolBox (last resort)

export interface AIChatMessage { role: 'user' | 'assistant'; text: string; ts: string; }

function getSetting(key: string): string {
  try { const s = localStorage.getItem('app_settings'); if (s) { const p = JSON.parse(s); return (p[key] || '').trim(); } } catch {} return '';
}

// ── GROQ (best: fast, 30rpm, 14400rpd, free) ──
async function tryGroq(prompt: string): Promise<string | null> {
  const key = getSetting('groqApiKey');
  if (!key) return null;
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });
    if (res.status === 401) return '❌ Groq API key is invalid. Go to Integrations to fix it.';
    if (res.status === 429) return null; // rate limited, try next provider
    if (res.ok) {
      const data = await res.json();
      return data?.choices?.[0]?.message?.content || null;
    }
  } catch { /* fall through */ }
  return null;
}

// ── GEMINI (backup: 15rpm, 1500rpd free) ──
async function tryGemini(prompt: string): Promise<string | null> {
  const key = getSetting('geminiApiKey');
  if (!key) return null;
  const models = ['gemini-2.5-flash-preview', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  for (const model of models) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 2048, temperature: 0.7 } }),
      });
      if (res.status === 404 || res.status === 400) continue;
      if (res.status === 403) return '❌ Gemini API key error. Check your key in Integrations.';
      if (res.status === 429) return null;
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      }
    } catch { continue; }
  }
  return null;
}

// ── DEVTOOLBOX (last resort: no key, limited) ──
async function tryDevToolBox(prompt: string): Promise<string | null> {
  try {
    const res = await fetch('https://devtoolbox-api.devtoolbox-api.workers.dev/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (res.ok) {
      const data = await res.json();
      const text = data?.response || data?.result || data?.text || data?.generated || data?.output;
      if (text && typeof text === 'string') return text;
    }
  } catch { /* */ }
  return null;
}

// ── MAIN: try all providers ──
export async function askAI(prompt: string): Promise<string> {
  // 1. Groq (fastest, most generous)
  const groq = await tryGroq(prompt);
  if (groq) return groq;

  // 2. Gemini (good quality)
  const gemini = await tryGemini(prompt);
  if (gemini) return gemini;

  // 3. DevToolBox (no key needed)
  const dev = await tryDevToolBox(prompt);
  if (dev) return dev;

  // Nothing worked
  const hasAnyKey = getSetting('groqApiKey') || getSetting('geminiApiKey');
  if (!hasAnyKey) {
    return '⚠️ No AI key configured. Go to Integrations → AI Assistant Setup and add your free Groq API key (recommended) or Gemini key. It takes 1 minute and is completely free.';
  }
  return '⚠️ AI temporarily unavailable. All providers are rate-limited or down. Please try again in a moment.';
}

// ── Specialized functions ──
export async function grammarCheck(text: string): Promise<string> {
  return askAI(`Correct the grammar, spelling, and punctuation. Return ONLY the corrected text:\n\n${text}`);
}

export async function composeMessage(context: string): Promise<string> {
  return askAI(`You are a professional assistant for MSG Foundation (education nonprofit in Nigeria) and Zerenity Wellness Clinic (mental health clinic). Compose a professional, warm message for:\n\n${context}`);
}

export async function improvePost(content: string, org: string): Promise<string> {
  const desc = org === 'msg' ? 'MSG Foundation, a Nigerian education nonprofit giving scholarships in Iperu, Ogun State' : 'Zerenity Wellness Clinic, a mental health clinic in Nigeria';
  return askAI(`You are a social media expert for ${desc}. Improve this post to be more engaging and emotional. Add emojis. Return ONLY the improved post:\n\n${content}`);
}

// ── Chat history ──
const CHAT_KEY = 'wh_ai_chat';
export function getChatHistory(): AIChatMessage[] { try { const r = localStorage.getItem(CHAT_KEY); return r ? JSON.parse(r) : []; } catch { return []; } }
export function saveChatHistory(msgs: AIChatMessage[]) { localStorage.setItem(CHAT_KEY, JSON.stringify(msgs.slice(-50))); }
export function clearChatHistory() { localStorage.removeItem(CHAT_KEY); }
