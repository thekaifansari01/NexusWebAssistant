import { CONFIG } from './src/core/config.js';
import { injectStyles } from './src/ui/styles.js';
import { createWidget, getEl, togglePanel, addMessage, showTyping, showPreview } from './src/ui/dom.js';
import { sendMessageToAI, refreshPageContext, loadHistoryFromLocal, clearHistoryLocal } from './src/api/api.js';
import { state, updateState } from './src/core/state.js';
import { getCacheInfo } from './src/utils/cache.js';
import { loadScraperLibraries, watchForChanges } from './src/scraper/scraper.js';

function detectWebsiteTheme() {
  const userConfig = window.NexusConfig || {};
  if (userConfig.theme) {
    return userConfig.theme;
  }

  const saved = localStorage.getItem('nexus-theme');
  if (saved) {
    return saved;
  }

  const body = document.body;
  if (body.classList.contains('dark') || body.classList.contains('dark-theme') || body.classList.contains('dark-mode')) {
    return 'dark';
  }
  if (body.classList.contains('light') || body.classList.contains('light-theme') || body.classList.contains('light-mode')) {
    return 'light';
  }

  const html = document.documentElement;
  const dataTheme = html.getAttribute('data-theme');
  if (dataTheme === 'dark' || dataTheme === 'light') {
    return dataTheme;
  }

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    const color = metaTheme.content;
    if (color.startsWith('#') && parseInt(color.slice(1, 3), 16) < 100) {
      return 'dark';
    }
  }

  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'dark';
}

function getMergedConfig() {
  const userConfig = window.NexusConfig || {};
  const detectedTheme = detectWebsiteTheme();
  
  return {
    API_URL: CONFIG.API_URL,
    API_KEY: userConfig.apiKey || CONFIG.API_KEY,
    MODEL: userConfig.model || CONFIG.MODEL,
    BOT_NAME: userConfig.botName || CONFIG.BOT_NAME,
    GREETING: userConfig.greeting || CONFIG.GREETING,
    SYSTEM_PROMPT: userConfig.systemPrompt || CONFIG.SYSTEM_PROMPT,
    THEME: detectedTheme,
    COLORS: CONFIG.COLORS
  };
}

export function toggleTheme() {
  const root = document.getElementById('ai-widget-root');
  if (!root) return;

  const current = root.dataset.theme || 'dark';
  const newTheme = current === 'dark' ? 'light' : 'dark';
  
  root.dataset.theme = newTheme;
  localStorage.setItem('nexus-theme', newTheme);
  
  if (window.__NEXUS_CONFIG) {
    window.__NEXUS_CONFIG.THEME = newTheme;
  }

  const themeBtn = document.getElementById('aiThemeToggle');
  if (themeBtn) {
    themeBtn.innerHTML = newTheme === 'dark' 
      ? '<i class="fas fa-moon"></i>' 
      : '<i class="fas fa-sun"></i>';
    themeBtn.title = newTheme === 'dark' ? 'Switch to Light' : 'Switch to Dark';
  }

  console.log(`🌓 Theme switched to: ${newTheme}`);
}

async function loadCDN() {
  const fa = document.createElement('link');
  fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
  fa.rel = 'stylesheet';
  document.head.appendChild(fa);

  const gf = document.createElement('link');
  gf.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap';
  gf.rel = 'stylesheet';
  document.head.appendChild(gf);

  const markedScript = document.createElement('script');
  markedScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/marked/12.0.0/marked.min.js';
  markedScript.async = true;
  document.head.appendChild(markedScript);

  const hljsCss = document.createElement('link');
  hljsCss.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css';
  hljsCss.rel = 'stylesheet';
  document.head.appendChild(hljsCss);

  const hljsScript = document.createElement('script');
  hljsScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js';
  hljsScript.async = true;
  document.head.appendChild(hljsScript);

  await loadScraperLibraries();
}

function abortOngoingRequest() {
  if (state.abortController) {
    state.abortController.abort();
    updateState({ abortController: null });
  }
}

async function init() {
  const config = getMergedConfig();
  window.__NEXUS_CONFIG = config;

  await loadCDN();
  injectStyles();
  createWidget();

  const root = document.getElementById('ai-widget-root');
  if (root) {
    root.dataset.theme = config.THEME || 'dark';
  }

  const themeBtn = document.getElementById('aiThemeToggle');
  if (themeBtn) {
    const isDark = config.THEME === 'dark';
    themeBtn.innerHTML = isDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    themeBtn.title = isDark ? 'Switch to Light' : 'Switch to Dark';
    themeBtn.addEventListener('click', toggleTheme);
  }

  const panel = getEl('aiPanel');
  const messagesContainer = getEl('aiMessages');
  const fab = getEl('aiFab');
  const closeBtn = getEl('aiCloseBtn');
  const sendBtn = getEl('aiSendBtn');
  const input = getEl('aiInput');
  const attachBtn = getEl('aiAttachBtn');
  const previewContainer = getEl('aiPreviewContainer');

  const clearBtn = getEl('aiClearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Clear all chat messages?')) {
        messagesContainer.innerHTML = '';
        const greeting = getGreeting();
        const greetingHtml = renderMarkdown(greeting);
        const greetDiv = document.createElement('div');
        greetDiv.className = 'msg bot';
        greetDiv.innerHTML = greetingHtml;
        messagesContainer.appendChild(greetDiv);
        state.conversationHistory = [{ role: 'system', content: config.SYSTEM_PROMPT }];
        clearHistoryLocal();
        updateState({ lastUserMessage: null, lastBotMessageEl: null, lastErrorMessageEl: null });
      }
    });
  }

  watchForChanges(() => {
    console.log('🔄 Page changed, refreshing context...');
    refreshPageContext();
    addMessage(messagesContainer, '🔄 Page context updated!', 'bot');
  });

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  const allowedTypes = CONFIG.ALLOWED_FILE_TYPES || ['image/*'];
  fileInput.accept = allowedTypes.join(',');
  fileInput.style.display = 'none';
  fileInput.id = 'aiFileInput';
  document.body.appendChild(fileInput);

  attachBtn?.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isValidType = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        const prefix = type.slice(0, -2);
        return file.type.startsWith(prefix);
      }
      return file.type === type || file.name.endsWith(type.slice(1));
    });

    if (!isValidType) {
      alert('Please select a valid file type.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const attachedFile = {
        dataUrl: ev.target.result,
        name: file.name,
        type: file.type,
        size: file.size
      };
      updateState({ attachedFile });
      showPreview(previewContainer, attachedFile);
      const removeBtn = document.getElementById('aiRemoveFile');
      if (removeBtn) {
        removeBtn.addEventListener('click', () => {
          updateState({ attachedFile: null });
          showPreview(previewContainer, null);
          input?.focus();
        });
      }
      input?.focus();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  });

  fab?.addEventListener('click', () => {
    const isOpen = togglePanel(panel, true);
    updateState({ isOpen });
  });

  function closePanel() {
    abortOngoingRequest();
    const isOpen = togglePanel(panel, false);
    updateState({ isOpen });
  }

  closeBtn?.addEventListener('click', closePanel);

  document.addEventListener('click', (e) => {
    const rootEl = document.getElementById('ai-widget-root');
    if (rootEl && state.isOpen && !rootEl.contains(e.target)) {
      closePanel();
    }
  });

  const handleSend = () => {
    const text = input?.value.trim();
    if (!text && !state.attachedFile) return;
    if (state.isProcessing) return;

    const image = state.attachedFile?.dataUrl || null;
    const fileData = state.attachedFile?.dataUrl || null;
    updateState({ attachedFile: null, lastUserMessage: { text, image: fileData } });
    input.value = '';
    input.style.height = 'auto';
    showPreview(previewContainer, null);

    sendMessageToAI(messagesContainer, text, fileData);
  };

  sendBtn?.addEventListener('click', handleSend);
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  document.addEventListener('regenerate-request', (e) => {
    const { messageEl } = e.detail;
    if (!messageEl) return;
    if (state.isProcessing) return;

    const history = state.conversationHistory;
    const lastBotIndex = history.length - 1;
    if (lastBotIndex < 0 || history[lastBotIndex].role !== 'assistant') return;
    const lastUserIndex = lastBotIndex - 1;
    if (lastUserIndex < 0 || history[lastUserIndex].role !== 'user') return;

    const userMsg = history[lastUserIndex];
    const userText = userMsg.content;

    history.pop();
    messageEl.remove();
    if (state.lastBotMessageEl === messageEl) {
      updateState({ lastBotMessageEl: null });
    }

    sendMessageToAI(messagesContainer, userText, null, { skipUserAdd: true });
  });

  // ---- Load saved history WITHOUT removing the greeting ----
  const savedHistory = loadHistoryFromLocal();
  if (savedHistory && savedHistory.length > 0) {
    // Greeting already exists in the container, we keep it.
    // Reset conversation history (keep system prompt)
    state.conversationHistory = [{ role: 'system', content: config.SYSTEM_PROMPT }];
    // Add saved messages after the greeting
    savedHistory.forEach(entry => {
      if (entry.role === 'user') {
        addMessage(messagesContainer, entry.content, 'user');
      } else if (entry.role === 'assistant') {
        const el = addMessage(messagesContainer, entry.content, 'bot', null, { withRegenerate: true });
        if (el && entry === savedHistory[savedHistory.length - 1]) {
          updateState({ lastBotMessageEl: el });
        }
      }
      state.conversationHistory.push(entry);
    });
  }

  const info = await getCacheInfo();
  console.log('📊 Cache Stats:', info || 'No cache yet');
  console.log('✨ Nexus AI v2.0 initialized with theme:', config.THEME);
}

function getGreeting() {
  return window.__NEXUS_CONFIG?.GREETING || CONFIG.GREETING;
}

function renderMarkdown(text) {
  if (!text) return '';
  try {
    if (typeof marked !== 'undefined' && marked.parse) {
      return marked.parse(text, { breaks: true, gfm: true });
    }
  } catch (e) {
    console.warn('Markdown parse failed:', e);
  }
  return text.replace(/\n/g, '<br>');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}