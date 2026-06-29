// AI Assistant — uses free DevToolBox API (no key) + optional Gemini (free key)

const DEVTOOLBOX_URL = 'https://devtoolbox-api.devtoolbox-api.workers.dev';

export interface AIChatMessage {
  role: 'user' | 'assistant';
  text: string;
  ts: string;
}

function getGeminiKey(): string {
  try {
    const s = localStorage.getItem('app_settings');
    if (s) { const p = JSON.parse(s); return p.geminiApiKey || ''; }
  } catch { /* */ }
  return '';
}

// Primary: try Gemini (better quality), fallback to DevToolBox (no key needed)
export async function askAI(prompt: string): Promise<string> {
  const geminiKey = getGeminiKey();
  
  // Try Gemini first if key is set
  if (geminiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 2048, temperature: 0.7 },
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      }
    } catch { /* fall through to DevToolBox */ }
  }

  // Fallback: DevToolBox (free, no key)
  try {
    const res = await fetch(`${DEVTOOLBOX_URL}/ai/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (res.ok) {
      const data = await res.json();
      return data?.response || data?.result || data?.text || data?.generated || JSON.stringify(data);
    }
  } catch { /* */ }

  return 'Sorry, AI is temporarily unavailable. Please try again in a moment.';
}

export async function grammarCheck(text: string): Promise<string> {
  return askAI(`You are a professional editor. Correct the grammar, spelling, and punctuation in the following text. Return ONLY the corrected text, nothing else:\n\n${text}`);
}

export async function composeMessage(context: string): Promise<string> {
  return askAI(`You are a professional assistant for a Nigerian nonprofit (MSG Foundation) and a mental health clinic (Zerenity Wellness Clinic). Compose a professional message based on this context. Be warm, clear, and professional:\n\n${context}`);
}

export async function improvePost(content: string, org: string): Promise<string> {
  return askAI(`You are a social media expert for ${org === 'msg' ? 'MSG Foundation, a Nigerian education nonprofit that gives scholarships to underprivileged children in Iperu, Ogun State' : 'Zerenity Wellness Clinic, a mental health clinic in Nigeria owned by Dr. Fowobi Gbadebo'}. Improve this social media post to be more engaging, emotional, and action-driving. Keep the same message but make it better. Add appropriate emojis. Return ONLY the improved post:\n\n${content}`);
}

export async function summarizeForReport(logs: string): Promise<string> {
  return askAI(`You are the Programs Manager of MSG Foundation. Summarize these daily log entries into a professional executive summary for a weekly report to the Chairman (Dr. Gbadebo). Be concise, professional, and highlight key achievements and issues. 2-3 paragraphs max:\n\n${logs}`);
}

// Chat history management
const CHAT_KEY = 'wh_ai_chat';

export function getChatHistory(): AIChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveChatHistory(msgs: AIChatMessage[]) {
  // Keep last 50 messages
  localStorage.setItem(CHAT_KEY, JSON.stringify(msgs.slice(-50)));
}

export function clearChatHistory() {
  localStorage.removeItem(CHAT_KEY);
}
