import { CONFIG } from '../core/config.js';

// ------------------- Helpers -------------------
export const getEl = (id) => document.getElementById(id);

// ------------------- Helper to get dynamic config ---------
function getBotName() {
  return window.__NEXUS_CONFIG?.BOT_NAME || CONFIG.BOT_NAME;
}
function getGreeting() {
  return window.__NEXUS_CONFIG?.GREETING || CONFIG.GREETING;
}

// ------------------- Widget HTML -------------------
export function createWidget() {
  const botName = getBotName();
  const greeting = getGreeting();

  const root = document.createElement('div');
  root.id = 'ai-widget-root';
  root.innerHTML = `
    <div class="ai-panel" id="aiPanel">
      <div class="ai-header">
        <div class="ai-header-title">
          <span class="status-dot"></span>
          ${botName}
        </div>
        <button class="ai-close-btn" id="aiCloseBtn" aria-label="Close chat">
          <i class="fas fa-xmark"></i>
        </button>
      </div>
      <div class="ai-messages" id="aiMessages">
        <div class="msg bot">
          ${greeting}
        </div>
      </div>
      <div class="ai-input-area" id="aiInputArea">
        <div id="aiPreviewContainer"></div>
        <div class="ai-input-container">
          <button class="icon-btn" id="aiAttachBtn" aria-label="Attach image">
            <i class="fas fa-paperclip"></i>
          </button>
          <input type="text" id="aiInput" placeholder="Message..." autocomplete="off">
          <button class="icon-btn send-btn" id="aiSendBtn">
            <i class="fas fa-arrow-up"></i>
          </button>
        </div>
      </div>
    </div>
    <button class="ai-fab" id="aiFab" aria-label="Open AI Chat">
      <span class="bot-icon">
        <i class="fas fa-robot" style="color: #000000 !important; font-size: 22px;"></i>
      </span>
    </button>
  `;
  document.body.appendChild(root);
  return root;
}

// ------------------- Panel toggle -------------------
export function togglePanel(panel, open) {
  if (!panel) return false;
  const isOpen = (open !== undefined) ? open : !panel.classList.contains('open');
  panel.classList.toggle('open', isOpen);
  if (isOpen) {
    setTimeout(() => getEl('aiInput')?.focus(), 100);
  }
  return isOpen;
}

// ------------------- Render Markdown -------------------
function renderMarkdown(text) {
  if (typeof marked !== 'undefined' && marked.parse) {
    return marked.parse(text, { breaks: true, gfm: true });
  }
  return text.replace(/\n/g, '<br>');
}

// ------------------- Add message bubble -------------------
export function addMessage(container, text, sender = 'bot', imageDataUrl = null) {
  if (!container) return null;

  const div = document.createElement('div');
  div.className = `msg ${sender}`;

  if (sender === 'bot') {
    const rendered = renderMarkdown(text);
    div.innerHTML = rendered;
    if (typeof hljs !== 'undefined') {
      div.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
      });
    }
  } else {
    let content = text || '';
    if (imageDataUrl) {
      content += `<br><img src="${imageDataUrl}" class="image-preview" alt="attached">`;
    }
    div.innerHTML = content;
  }

  container.appendChild(div);
  container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  return div;
}

// ------------------- Typing indicator -------------------
let typingEl = null;

export function showTyping(container, show) {
  if (!container) return;

  if (typingEl) {
    typingEl.remove();
    typingEl = null;
  }

  if (show) {
    typingEl = document.createElement('div');
    typingEl.className = 'typing-indicator';
    typingEl.innerHTML = '<span></span><span></span><span></span>';
    container.appendChild(typingEl);
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  }
}

// ------------------- Image preview pill -------------------
export function showPreview(container, file) {
  if (!container) return;
  container.innerHTML = '';
  if (!file) return;

  const pill = document.createElement('div');
  pill.className = 'image-preview-pill';
  pill.innerHTML = `
    <img src="${file.dataUrl}" alt="preview">
    <span class="file-name">${file.name}</span>
    <button class="remove-file" id="aiRemoveFile"><i class="fas fa-times"></i></button>
  `;
  container.appendChild(pill);

  document.getElementById('aiRemoveFile')?.addEventListener('click', () => {
    // handled externally
  });
}