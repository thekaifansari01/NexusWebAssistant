import { CONFIG } from './config.js';
import { injectStyles } from './styles.js';
import { createWidget, getEl, togglePanel, addMessage, showTyping, showPreview } from './dom.js';
import { sendMessageToAI, refreshPageContext } from './api.js';
import { state, updateState } from './state.js';
import { getCacheInfo, clearAllCache } from './cache.js';
import { loadScraperLibraries, watchForChanges } from './scraper.js';

// ============================================================
// LOAD CDN RESOURCES (Including Scraper Libraries)
// ============================================================
async function loadCDN() {
  // Font Awesome
  const fa = document.createElement('link');
  fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
  fa.rel = 'stylesheet';
  document.head.appendChild(fa);

  // Font
  const gf = document.createElement('link');
  gf.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap';
  gf.rel = 'stylesheet';
  document.head.appendChild(gf);

  // Marked
  const markedScript = document.createElement('script');
  markedScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/marked/12.0.0/marked.min.js';
  markedScript.async = true;
  document.head.appendChild(markedScript);

  // Highlight.js
  const hljsCss = document.createElement('link');
  hljsCss.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css';
  hljsCss.rel = 'stylesheet';
  document.head.appendChild(hljsCss);

  const hljsScript = document.createElement('script');
  hljsScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js';
  hljsScript.async = true;
  document.head.appendChild(hljsScript);

  // Load advanced scraper libraries
  await loadScraperLibraries();
}

// ============================================================
// MAIN INIT
// ============================================================
async function init() {
  await loadCDN();
  injectStyles();
  createWidget();

  const panel = getEl('aiPanel');
  const messagesContainer = getEl('aiMessages');
  const fab = getEl('aiFab');
  const closeBtn = getEl('aiCloseBtn');
  const sendBtn = getEl('aiSendBtn');
  const input = getEl('aiInput');
  const attachBtn = getEl('aiAttachBtn');
  const previewContainer = getEl('aiPreviewContainer');

  // ===== Setup dynamic content watcher =====
  watchForChanges(() => {
    console.log('🔄 Page changed, refreshing context...');
    refreshPageContext();
    addMessage(messagesContainer, '🔄 Page context updated!', 'bot');
  });

  // ===== File input logic (same as before) =====
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

  // ===== Toggle panel =====
  fab?.addEventListener('click', () => {
    const isOpen = togglePanel(panel, true);
    updateState({ isOpen });
  });

  closeBtn?.addEventListener('click', () => {
    const isOpen = togglePanel(panel, false);
    updateState({ isOpen });
  });

  document.addEventListener('click', (e) => {
    const root = document.getElementById('ai-widget-root');
    if (root && state.isOpen && !root.contains(e.target)) {
      const isOpen = togglePanel(panel, false);
      updateState({ isOpen });
    }
  });

  // ===== Send message =====
  const handleSend = () => {
    const text = input?.value.trim();
    if (!text && !state.attachedFile) return;
    if (state.isProcessing) return;

    const image = state.attachedFile?.dataUrl || null;
    addMessage(messagesContainer, text, 'user', image);

    input.value = '';
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

  // ===== Cache info in console =====
  const info = await getCacheInfo();
  console.log('📊 Cache Stats:', info || 'No cache yet');

  console.log('✨ Nexus AI v2.0 initialized with advanced scraper!');
}

// ===== Boot =====
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}