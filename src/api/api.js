import { CONFIG } from '../core/config.js';
import { state, updateState } from '../core/state.js';
import { addMessage, showTyping } from '../ui/dom.js';        
import { getCachedData, setCachedData } from '../utils/cache.js';
import { scrapePageAdvanced, formatForAIAdvanced } from '../scraper/scraper.js';

const MAX_HISTORY = 10;

state.conversationHistory = [
  { role: 'system', content: CONFIG.SYSTEM_PROMPT }
];

async function getPageContextAsync() {
  let cached = await getCachedData();
  if (cached) {
    console.log('📦 Using cached page data');
    return cached;
  }

  console.log('🔍 Scraping page data...');
  const pageData = scrapePageAdvanced();
  const context = formatForAIAdvanced(pageData);
  await setCachedData(context);
  console.log('💾 Page data cached');
  return context;
}

export async function refreshPageContext() {
  console.log('🔄 Forcing page context refresh...');
  const pageData = scrapePageAdvanced();
  const context = formatForAIAdvanced(pageData);
  await setCachedData(context);
  console.log('✅ Page context refreshed');
  return context;
}

export async function sendMessageToAI(container, userText, imageDataUrl = null) {
  if (state.isProcessing) return;
  updateState({ isProcessing: true });

  const sendBtn = document.getElementById('aiSendBtn');
  const input = document.getElementById('aiInput');
  if (sendBtn) sendBtn.disabled = true;
  if (input) input.disabled = true;

  showTyping(container, true);

  const userContent = [];
  if (userText) userContent.push({ type: 'text', text: userText });
  if (imageDataUrl) {
    userContent.push({
      type: 'image_url',
      image_url: { url: imageDataUrl }
    });
  }

  state.conversationHistory.push({ role: 'user', content: userText || '(image)' });
  if (state.conversationHistory.length > MAX_HISTORY + 1) {
    const system = state.conversationHistory[0];
    const recent = state.conversationHistory.slice(-MAX_HISTORY);
    state.conversationHistory = [system, ...recent];
  }

  try {
    const pageContext = await getPageContextAsync();
    
    const config = window.__NEXUS_CONFIG || CONFIG;

    const messages = [
      { 
        role: 'system', 
        content: `${config.SYSTEM_PROMPT}\n\n## Current Page Context\n${pageContext}`
      }
    ];
  
    for (let i = 1; i < state.conversationHistory.length - 1; i++) {
      messages.push({
        role: state.conversationHistory[i].role,
        content: state.conversationHistory[i].content
      });
    }
   
    messages.push({ role: 'user', content: userContent });

    const response = await fetch(config.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.API_KEY}`
      },
      body: JSON.stringify({
        model: config.MODEL,
        messages: messages,
        temperature: 0.7,
        max_tokens: 600,
        stream: false
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`API error ${response.status}: ${errData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const botReply = data.choices?.[0]?.message?.content || "Sorry, I didn't understand that.";
    state.conversationHistory.push({ role: 'assistant', content: botReply });

    showTyping(container, false);
    addMessage(container, botReply, 'bot');

  } catch (error) {
    console.error('Groq API Error:', error);
    showTyping(container, false);
    addMessage(container, `⚠️ Oops! ${error.message || 'Something went wrong.'} Please try again.`, 'bot');
  } finally {
    updateState({ isProcessing: false });
    if (sendBtn) sendBtn.disabled = false;
    if (input) {
      input.disabled = false;
      input.value = '';
      input.focus();
    }
  }
}