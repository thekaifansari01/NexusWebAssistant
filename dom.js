import { CONFIG } from './config.js';

// ------------------- Helpers -------------------
export const getEl = (id) => document.getElementById(id);

// ------------------- Widget HTML -------------------
export function createWidget() {
  const root = document.createElement('div');
  root.id = 'ai-widget-root';
  root.innerHTML = `
    <div class="ai-panel" id="aiPanel">
      <div class="ai-header">
        <div class="ai-header-title">
          <span class="status-dot"></span>
          ${CONFIG.BOT_NAME}
        </div>
        <button class="ai-close-btn" id="aiCloseBtn" aria-label="Close chat">
          <i class="fas fa-xmark"></i>
        </button>
      </div>
      <div class="ai-messages" id="aiMessages">
        <div class="msg bot">
          ${CONFIG.GREETING}
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
    // The removal logic will be handled in the main module (index.js)
    // We dispatch a custom event or just let the caller handle it.
    // For simplicity, we'll just call a cleanup function passed as a callback.
    // But to keep it decoupled, we'll return the pill element so the caller can attach events.
  });
}