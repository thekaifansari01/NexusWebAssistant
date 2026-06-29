import { CONFIG } from './src/core/config.js';
import { injectStyles } from './src/ui/styles.js';         
import { createWidget, getEl, togglePanel, addMessage, showTyping, showPreview } from './src/ui/dom.js';  
import { sendMessageToAI, refreshPageContext } from './src/api/api.js';
import { state, updateState } from './src/core/state.js';
import { getCacheInfo, clearAllCache } from './src/utils/cache.js';
import { loadScraperLibraries, watchForChanges } from './src/scraper/scraper.js';

// ============================================================
// DETECT WEBSITE THEME
// ============================================================
function detectWebsiteTheme() {
  // 1. Check user config override
  const userConfig = window.NexusConfig || {};
  if (userConfig.theme) {
    return userConfig.theme; // 'dark' or 'light'
  }

  // 2. Check localStorage (user preference)
  const saved = localStorage.getItem('nexus-theme');
  if (saved) {
    return saved;
  }

  // 3. Check body class
  const body = document.body;
  if (body.classList.contains('dark') || body.classList.contains('dark-theme') || body.classList.contains('dark-mode')) {
    return 'dark';
  }
  if (body.classList.contains('light') || body.classList.contains('light-theme') || body.classList.contains('light-mode')) {
    return 'light';
  }

  // 4. Check data-theme attribute
  const html = document.documentElement;
  const dataTheme = html.getAttribute('data-theme');
  if (dataTheme === 'dark' || dataTheme === 'light') {
    return dataTheme;
  }

  // 5. Check meta theme-color
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    const color = metaTheme.content;
    // Simple heuristic: dark colors = '#000', '#1a1a1a', etc.
    if (color.startsWith('#') && parseInt(color.slice(1, 3), 16) < 100) {
      return 'dark';
    }
  }

  // 6. Check system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  // 7. Default: dark
  return 'dark';
}

// ============================================================
// MERGE USER CONFIG WITH DEFAULT
// ============================================================
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
    THEME: detectedTheme, // Auto-detected or user override
    COLORS: CONFIG.COLORS
  };
}

// ============================================================
// TOGGLE THEME
// ============================================================
export function toggleTheme() {
  const root = document.getElementById('ai-widget-root');
  if (!root) return;

  const current = root.dataset.theme || 'dark';
  const newTheme = current === 'dark' ? 'light' : 'dark';
  
  root.dataset.theme = newTheme;
  localStorage.setItem('nexus-theme', newTheme);
  
  // Update global config
  if (window.__NEXUS_CONFIG) {
    window.__NEXUS_CONFIG.THEME = newTheme;
  }

  // Update theme button icon
  const themeBtn = document.getElementById('aiThemeToggle');
  if (themeBtn) {
    themeBtn.innerHTML = newTheme === 'dark' 
      ? '<i class="fas fa-moon"></i>' 
      : '<i class="fas fa-sun"></i>';
    themeBtn.title = newTheme === 'dark' ? 'Switch to Light' : 'Switch to Dark';
  }

  console.log(`🌓 Theme switched to: ${newTheme}`);
}

// ============================================================
// LOAD CDN RESOURCES
// ============================================================
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

// ============================================================
// MAIN INIT
// ============================================================
async function init() {
  const config = getMergedConfig();
  window.__NEXUS_CONFIG = config;

  await loadCDN();
  injectStyles();
  createWidget();

  // Apply theme
  const root = document.getElementById('ai-widget-root');
  if (root) {
    root.dataset.theme = config.THEME || 'dark';
  }

  // Theme toggle button
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

  watchForChanges(() => {
    console.log('🔄 Page changed, refreshing context...');
    refreshPageContext();
    addMessage(messagesContainer, '🔄 Page context updated!', 'bot');
  });

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.style.display = 'none';
  fileInput.id = 'aiFileInput';
  document.body.appendChild(fileInput);

  attachBtn?.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const attachedFile = {
        dataUrl: ev.target.result,
        name: file.name,
        type: file.type
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

  closeBtn?.addEventListener('click', () => {
    const isOpen = togglePanel(panel, false);
    updateState({ isOpen });
  });

  document.addEventListener('click', (e) => {
    const rootEl = document.getElementById('ai-widget-root');
    if (rootEl && state.isOpen && !rootEl.contains(e.target)) {
      const isOpen = togglePanel(panel, false);
      updateState({ isOpen });
    }
  });

  const handleSend = () => {
    const text = input?.value.trim();
    if (!text && !state.attachedFile) return;
    if (state.isProcessing) return;

    const image = state.attachedFile?.dataUrl || null;
    addMessage(messagesContainer, text, 'user', image);

    input.value = '';
    input.style.height = 'auto';
    showPreview(previewContainer, null);
    const fileData = state.attachedFile?.dataUrl || null;
    updateState({ attachedFile: null });

    sendMessageToAI(messagesContainer, text, fileData);
  };

  sendBtn?.addEventListener('click', handleSend);
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  const info = await getCacheInfo();
  console.log('📊 Cache Stats:', info || 'No cache yet');
  console.log('✨ Nexus AI v2.0 initialized with theme:', config.THEME);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}