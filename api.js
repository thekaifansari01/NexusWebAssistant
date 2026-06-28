import { CONFIG } from './config.js';
import { state, updateState } from './state.js';
import { addMessage, showTyping } from './dom.js';
import { getCachedData, setCachedData } from './cache.js';
import { scrapePageAdvanced, formatForAIAdvanced } from './scraper.js';

const MAX_HISTORY = 10;

// Initialise conversation history with system prompt
state.conversationHistory = [
  { role: 'system', content: CONFIG.SYSTEM_PROMPT }
];

// ============================================================
// Get Page Context (with cache)
// ============================================================
function getPageContext() {
  // Check cache first
  const cached = getCachedData(); // Note: getCachedData is async, but we'll handle inside sendMessageToAI
  // Actually we need to handle async properly. We'll make getPageContext async.
  // But we'll rewrite as async function.
  // We'll change to async inside sendMessageToAI.
  // For simplicity, we'll create an async function.
}

// We'll implement refreshPageContext and getPageContext as async.

// ============================================================
// Get Page Context (async)
// ============================================================
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

// ============================================================
// Refresh Page Context (force fresh scrape)
// ============================================================
export async function refreshPageContext() {
  console.log('🔄 Forcing page context refresh...');
  const pageData = scrapePageAdvanced();
  const context = formatForAIAdvanced(pageData);
  await setCachedData(context);
  console.log('✅ Page context refreshed');
  return context;
}

// ============================================================
// Send Message to AI (with page context)
// ============================================================
export async function sendMessageToAI(container, userText, imageDataUrl = null) {
  if (state.isProcessing) return;
  updateState({ isProcessing: true });

  const sendBtn = document.getElementById('aiSendBtn');
  const input = document.getElementById('aiInput');
  if (sendBtn) sendBtn.disabled = true;
  if (input) input.disabled = true;

  showTyping(container, true);

  // Build user content
  const userContent = [];
  if (userText) userContent.push({ type: 'text', text: userText });
  if (imageDataUrl) {
    userContent.push({
      type: 'image_url',
      image_url: { url: imageDataUrl }
    });
  }

  // Update history (user message)
  state.conversationHistory.push({ role: 'user', content: userText || '(image)' });
  // Trim history
  if (state.conversationHistory.length > MAX_HISTORY + 1) {
    const system = state.conversationHistory[0];
    const recent = state.conversationHistory.slice(-MAX_HISTORY);
    state.conversationHistory = [system, ...recent];
  }

  try {
    // Get page context
    const pageContext = await getPageContextAsync();
    
    // Build messages for API
    const messages = [
      { 
        role: 'system', 
        content: `${CONFIG.SYSTEM_PROMPT}\n\n## Current Page Context\n${pageContext}`
      }
    ];
    
    // Add conversation history (excluding system)
    for (let i = 1; i < state.conversationHistory.length - 1; i++) {
      messages.push({
        role: state.conversationHistory[i].role,
        content: state.conversationHistory[i].content
      });
    }
    
    // Add current user message with multimodal content
    messages.push({ role: 'user', content: userContent });

    const response = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.API_KEY}`
      },
      body: JSON.stringify({
        model: CONFIG.MODEL,
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