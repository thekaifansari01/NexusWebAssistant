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

export async function sendMessageToAI(container, userText, imageDataUrl = null, options = {}) {
  if (state.isProcessing) return;
  const { skipUserAdd = false, onError = null } = options;
  updateState({ isProcessing: true });

  const sendBtn = document.getElementById('aiSendBtn');
  const input = document.getElementById('aiInput');
  if (sendBtn) sendBtn.disabled = true;
  if (input) input.disabled = true;

  if (!skipUserAdd) {
    state.lastUserMessage = { text: userText, image: imageDataUrl };
    addMessage(container, userText, 'user', imageDataUrl);
  }

  showTyping(container, true);

  const userContent = [];
  if (userText) userContent.push({ type: 'text', text: userText });
  if (imageDataUrl) {
    userContent.push({
      type: 'image_url',
      image_url: { url: imageDataUrl }
    });
  }

  if (!skipUserAdd) {
    state.conversationHistory.push({ role: 'user', content: userText || '(image)' });
    if (state.conversationHistory.length > MAX_HISTORY + 1) {
      const system = state.conversationHistory[0];
      const recent = state.conversationHistory.slice(-MAX_HISTORY);
      state.conversationHistory = [system, ...recent];
    }
    saveHistoryToLocal();
  }

  const controller = new AbortController();
  updateState({ abortController: controller });

  let errorOccurred = false;
  let errorMessage = '';

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
        'Origin': window.location.origin
      },
      signal: controller.signal,
      body: JSON.stringify({
        nexusKey: config.API_KEY,
        messages: messages,
        model: config.MODEL
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(`Proxy error ${response.status}: ${errData.error || response.statusText}`);
    }

    const data = await response.json();
    const botReply = data.choices?.[0]?.message?.content || "Sorry, I didn't understand that.";
    state.conversationHistory.push({ role: 'assistant', content: botReply });
    saveHistoryToLocal();

    showTyping(container, false);
    const botEl = addMessage(container, botReply, 'bot', null, { withRegenerate: true });
    if (botEl) {
      updateState({ lastBotMessageEl: botEl });
    }

    state.lastErrorMessageEl = null;

  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Request aborted by user');
      return;
    }
    console.error('Nexus Proxy Error:', error);
    errorOccurred = true;
    errorMessage = error.message || 'Something went wrong.';
    showTyping(container, false);
    const errorText = `⚠️ Oops! ${errorMessage} Please try again.`;
    const errorEl = addMessage(container, errorText, 'bot', null, {
      isError: true,
      errorCallback: () => {
        if (state.lastErrorMessageEl) {
          state.lastErrorMessageEl.remove();
          state.lastErrorMessageEl = null;
        }
        const lastUser = state.lastUserMessage;
        if (lastUser) {
          sendMessageToAI(container, lastUser.text, lastUser.image, { skipUserAdd: true });
        }
      }
    });
    if (errorEl) {
      updateState({ lastErrorMessageEl: errorEl });
    }
    if (onError) onError(error);
  } finally {
    updateState({ isProcessing: false, abortController: null });
    if (sendBtn) sendBtn.disabled = false;
    if (input) {
      input.disabled = false;
      if (!errorOccurred) {
        input.value = '';
        input.style.height = 'auto';
        const count = document.getElementById('aiCharCount');
        if (count) {
          count.textContent = '0';
          count.style.color = '#a0a0a0';
        }
      }
      input.focus();
    }
  }
}

function saveHistoryToLocal() {
  try {
    const toSave = state.conversationHistory.slice(1);
    localStorage.setItem('nexus-chat-history', JSON.stringify(toSave));
  } catch (e) {}
}

export function loadHistoryFromLocal() {
  try {
    const raw = localStorage.getItem('nexus-chat-history');
    if (!raw) return null;
    const history = JSON.parse(raw);
    return history;
  } catch { return null; }
}

export function clearHistoryLocal() {
  try {
    localStorage.removeItem('nexus-chat-history');
  } catch {}
}