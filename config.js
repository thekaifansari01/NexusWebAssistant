// ============================================================
// CONFIGURATION
// ============================================================
export const CONFIG = {
  API_URL: 'https://api.groq.com/openai/v1/chat/completions',
  API_KEY: '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',
  MODEL: 'meta-llama/llama-4-scout-17b-16e-instruct',

  // ===== BRANDING =====
  BOT_NAME: "Nexus AI",
  GREETING: "Hey! I'm Nexus AI, your intelligent assistant. Ask me anything about Website!",

  // ===== SYSTEM PROMPT (Generic, context‑driven) =====
  SYSTEM_PROMPT: `
You are Nexus AI, a smart assistant. Use the page context provided in every response.

**Rules:**
- Always prioritize the given page context over general knowledge.
- Quote specific details (headings, tables, code, lists, etc.) from the context.
- Structure answers clearly with bullet points or headings where helpful.
- Be crisp, professional, and friendly. Use Markdown.
- If information is not in context, politely say so and offer to help with related topics.
- Keep responses concise (under 600 tokens).
  `,

  // ===== MONOCHROME PALETTE =====
  COLORS: {
    bg: '#0a0a0a',
    panelBg: 'rgba(12, 12, 12, 0.85)',
    border: '#2a2a2a',
    borderHover: '#444444',
    textPrimary: '#f5f5f5',
    textSecondary: '#a0a0a0',
    userBubble: '#1e1e1e',
    botBubble: 'transparent',
  }
};