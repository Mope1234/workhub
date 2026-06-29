// AI Assistant — Groq (primary, free, fast) + Gemini (fallback) + DevToolBox (last resort)

export interface AIChatMessage {
  role: 'user' | 'assistant';
  text: string;
  ts: string;
}

function getKeys(): { groq: string; gemini: string } {
  try {
    const s = localStorage.getItem('app_settings');
    if (s) {
      const p = JSON.parse(s);
      return { groq: (p.groqApiKey || '').trim(), gemini: (p.geminiApiKey || '').trim() };
    }
  } catch { /* */ }
  return { groq: '', gemini: '' };
}

// ═══════════════════════════════════════
// MAIN AI FUNCTION
// ═══════════════════════════════════════
export async function askAI(prompt: string): Promise<string> {
  const keys = getKeys();

  // 1. Try Groq (primary — fastest, free)
  if (keys.groq) {
    const result = await tryGroq(keys.groq, prompt);
    if (result) return result;
  }

  // 2. Try Gemini (secondary)
  if (keys.gemini) {
    const result = await tryGemini(keys.gemini, prompt);
    if (result) return result;
  }

  // 3. No keys configured
  if (!keys.groq && !keys.gemini) {
    return '⚠️ No AI key configured yet.\n\nTo enable AI:\n1. Go to Integrations → AI Assistant Setup\n2. Get a FREE Groq key at console.groq.com (no credit card needed)\n3. Paste it and try again!\n\nGroq is free, fast, and takes 2 minutes to set up.';
  }

  return 'AI is temporarily unavailable. Please try again in a moment.';
}

// ═══════════════════════════════════════
// GROQ — Primary (OpenAI-compatible REST)
// ═══════════════════════════════════════
async function tryGroq(apiKey: string, prompt: string): Promise<string | null> {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are WorkHub AI, a helpful, professional assistant. Be concise, practical, and warm. Format responses clearly.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (res.status === 401) return '❌ Groq API key is invalid. Please check it in Integrations.';
    if (res.status === 429) return '⏳ Rate limit reached. Free tier: 30 requests/minute. Wait a moment and try again.';
    if (res.status === 413) return '⚠️ Message too long. Try a shorter prompt.';

    if (res.ok) {
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (text) return text;
    }

    // Try fallback model
    const res2 = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'You are WorkHub AI, a helpful assistant. Be concise and practical.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (res2.ok) {
      const data2 = await res2.json();
      return data2?.choices?.[0]?.message?.content || null;
    }
  } catch (e) {
    console.error('Groq error:', e);
  }
  return null;
}

// ═══════════════════════════════════════
// GEMINI — Secondary
// ═══════════════════════════════════════
async function tryGemini(apiKey: string, prompt: string): Promise<string | null> {
  const models = ['gemini-2.5-flash-preview', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 2048, temperature: 0.7 },
          }),
        }
      );
      if (res.status === 404 || res.status === 400) continue;
      if (res.status === 403) return '❌ Gemini key error. Check your key in Integrations.';
      if (res.status === 429) return '⏳ Gemini rate limit reached. Wait and try again.';
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      }
    } catch { continue; }
  }
  return null;
}

// ═══════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════
export async function grammarCheck(text: string): Promise<string> {
  return askAI(`Correct the grammar, spelling, and punctuation in this text. Return ONLY the corrected text:\n\n${text}`);
}

export async function composeMessage(context: string): Promise<string> {
  return askAI(`You are a professional assistant for Mopelola Kadiri who manages MSG Foundation (education nonprofit in Nigeria) and Zerenity Wellness Clinic (mental health clinic). Compose a professional, warm message based on this:\n\n${context}`);
}

export async function improvePost(content: string, org: string): Promise<string> {
  const desc = org === 'msg'
    ? 'MSG Foundation — a Nigerian education nonprofit giving scholarships to underprivileged children in Iperu, Ogun State. Donation: Providus Bank, 1309432392, Mary Sunlola Gbadebo Foundation'
    : 'Zerenity Wellness Clinic — a mental health clinic in Nigeria by Dr. Fowobi Gbadebo (zerenitywellness.org)';
  return askAI(`You are a social media expert for ${desc}. Rewrite this post to be more engaging, emotional, and action-driving. Add emojis. Return ONLY the improved post:\n\n${content}`);
}

export async function summarizeForReport(logs: string): Promise<string> {
  return askAI(`Summarize these daily log entries into a professional executive summary (2-3 paragraphs) for a weekly report from Programs Manager to the Chairman:\n\n${logs}`);
}

// Chat history
const CHAT_KEY = 'wh_ai_chat';
export function getChatHistory(): AIChatMessage[] { try { const r = localStorage.getItem(CHAT_KEY); return r ? JSON.parse(r) : []; } catch { return []; } }
export function saveChatHistory(msgs: AIChatMessage[]) { localStorage.setItem(CHAT_KEY, JSON.stringify(msgs.slice(-50))); }
export function clearChatHistory() { localStorage.removeItem(CHAT_KEY); }
