// AI Assistant — uses Google Gemini (free key) + DevToolBox fallback (no key)

const DEVTOOLBOX_URL = 'https://devtoolbox-api.devtoolbox-api.workers.dev';

export interface AIChatMessage {
  role: 'user' | 'assistant';
  text: string;
  ts: string;
}

function getGeminiKey(): string {
  try {
    const s = localStorage.getItem('app_settings');
    if (s) { const p = JSON.parse(s); return (p.geminiApiKey || '').trim(); }
  } catch { /* */ }
  return '';
}

export async function askAI(prompt: string): Promise<string> {
  // Try Gemini first
  const geminiResult = await tryGemini(prompt);
  if (geminiResult) return geminiResult;

  // Fallback to DevToolBox
  const devResult = await tryDevToolBox(prompt);
  if (devResult) return devResult;

  return 'AI is temporarily unavailable. Please check your Gemini API key in Integrations, or try again later.';
}

async function tryGemini(prompt: string): Promise<string | null> {
  const key = getGeminiKey();
  if (!key) return null;

  // Try multiple model names in order of preference
  const models = [
    'gemini-2.5-flash-preview',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
  ];

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 2048, temperature: 0.7 },
        }),
      });

      if (res.status === 404) continue; // Model not found, try next
      if (res.status === 400) continue; // Bad request, try next
      if (res.status === 403) return 'API key error: Please check your Gemini API key is correct and has the Generative Language API enabled.';
      if (res.status === 429) return 'Rate limit reached. Please wait a moment and try again (free tier: 15 requests/minute).';

      if (res.ok) {
        const data = await res.json();
        // Handle different response structures
        const candidates = data?.candidates;
        if (candidates && candidates.length > 0) {
          const parts = candidates[0]?.content?.parts;
          if (parts && parts.length > 0 && parts[0].text) {
            return parts[0].text;
          }
        }
        // If we got a response but couldn't parse it
        if (data?.error?.message) return `Gemini error: ${data.error.message}`;
      }
    } catch (e) {
      console.error(`Gemini ${model} failed:`, e);
      continue;
    }
  }
  return null;
}

async function tryDevToolBox(prompt: string): Promise<string | null> {
  try {
    const res = await fetch(`${DEVTOOLBOX_URL}/ai/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (res.ok) {
      const data = await res.json();
      // Try various response field names
      const text = data?.response || data?.result || data?.text || data?.generated || data?.output || data?.content;
      if (text && typeof text === 'string') return text;
      // If it's an object, try to extract text
      if (typeof data === 'string') return data;
      return JSON.stringify(data);
    }
  } catch (e) {
    console.error('DevToolBox failed:', e);
  }
  return null;
}

export async function grammarCheck(text: string): Promise<string> {
  return askAI(`You are a professional editor. Correct the grammar, spelling, and punctuation in the following text. Return ONLY the corrected text, nothing else:\n\n${text}`);
}

export async function composeMessage(context: string): Promise<string> {
  return askAI(`You are a professional assistant for a Nigerian nonprofit (MSG Foundation) and a mental health clinic (Zerenity Wellness Clinic). Compose a professional message based on this context. Be warm, clear, and professional:\n\n${context}`);
}

export async function improvePost(content: string, org: string): Promise<string> {
  const orgDesc = org === 'msg'
    ? 'MSG Foundation, a Nigerian education nonprofit that gives scholarships to underprivileged children in Iperu, Ogun State'
    : 'Zerenity Wellness Clinic, a mental health clinic in Nigeria owned by Dr. Fowobi Gbadebo';
  return askAI(`You are a social media expert for ${orgDesc}. Improve this social media post to be more engaging, emotional, and action-driving. Keep the same core message but make it better. Add appropriate emojis. Return ONLY the improved post, no explanations:\n\n${content}`);
}

export async function summarizeForReport(logs: string): Promise<string> {
  return askAI(`You are the Programs Manager of MSG Foundation. Summarize these daily log entries into a professional executive summary for a weekly report to the Chairman (Dr. Gbadebo). Be concise, professional, and highlight key achievements and issues. 2-3 paragraphs max:\n\n${logs}`);
}

// Chat history
const CHAT_KEY = 'wh_ai_chat';
export function getChatHistory(): AIChatMessage[] { try { const r = localStorage.getItem(CHAT_KEY); return r ? JSON.parse(r) : []; } catch { return []; } }
export function saveChatHistory(msgs: AIChatMessage[]) { localStorage.setItem(CHAT_KEY, JSON.stringify(msgs.slice(-50))); }
export function clearChatHistory() { localStorage.removeItem(CHAT_KEY); }
