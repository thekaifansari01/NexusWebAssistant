export const CONFIG = {
  API_URL: 'https://trynexusweb.vercel.app/api/chat',
  API_KEY: '',  
  
  MODEL: 'meta-llama/llama-4-scout-17b-16e-instruct',

  BOT_NAME: "Nexus AI",
  
  GREETING: `👋 Hey there! I'm **Nexus AI** – your smart assistant for this page.

I can help you understand and find information from the content you see here. Just ask me anything about this page and I'll assist you instantly! 🚀`,

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

  MAX_FILE_SIZE: 5 * 1024 * 1024, 
  ALLOWED_FILE_TYPES: ['image/*', 'application/pdf', 'text/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],

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