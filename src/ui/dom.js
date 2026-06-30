import { CONFIG } from '../core/config.js';
import { state } from '../core/state.js';

export const getEl = (id) => document.getElementById(id);

function getBotName() {
  return window.__NEXUS_CONFIG?.BOT_NAME || CONFIG.BOT_NAME;
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

function autoResize(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
}

function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function createWidget() {
  const botName = getBotName();
  const greeting = getGreeting();
  const greetingHtml = renderMarkdown(greeting);

  const root = document.createElement('div');
  root.id = 'ai-widget-root';
  root.innerHTML = `
    <div class="ai-panel" id="aiPanel">
      <div class="ai-header">
        <div class="ai-header-title">
          <span class="status-dot"></span>
          ${botName}
        </div>
        <div class="ai-header-actions">
          <button class="ai-theme-toggle" id="aiThemeToggle" aria-label="Toggle theme">
            <i class="fas fa-moon"></i>
          </button>
          <button class="ai-clear-btn" id="aiClearBtn" aria-label="Clear chat">
            <i class="fas fa-trash"></i>
          </button>
          <button class="ai-close-btn" id="aiCloseBtn" aria-label="Close chat">
            <i class="fas fa-xmark"></i>
          </button>
        </div>
      </div>
      <div class="ai-messages" id="aiMessages">
        <div class="msg bot">
          ${greetingHtml}
        </div>
      </div>
      <div class="ai-input-area" id="aiInputArea">
        <div id="aiPreviewContainer"></div>
        <div class="ai-input-container">
          <button class="icon-btn" id="aiAttachBtn" aria-label="Attach image or file">
            <i class="fas fa-paperclip"></i>
          </button>
          <textarea 
            id="aiInput" 
            placeholder="Message..." 
            rows="1"
            autocomplete="off"
            spellcheck="true"
          ></textarea>
          <button class="icon-btn send-btn" id="aiSendBtn">
            <i class="fas fa-arrow-up"></i>
          </button>
        </div>
        <div class="ai-input-footer">
          <span class="ai-char-count" id="aiCharCount">0</span>
        </div>
      </div>
    </div>
    <button class="ai-fab" id="aiFab" aria-label="Open AI Chat">
      <span class="bot-icon">
        <i class="fas fa-robot" style="color: #ffffff !important; font-size: 22px;"></i>
      </span>
    </button>
  `;
  document.body.appendChild(root);
  
  const textarea = getEl('aiInput');
  if (textarea) {
    textarea.addEventListener('input', () => {
      autoResize(textarea);
      updateCharCount(textarea);
    });
  }
  
  return root;
}

function updateCharCount(textarea) {
  const count = getEl('aiCharCount');
  if (count) {
    const len = textarea.value.length;
    count.textContent = len > 0 ? `${len}` : '0';
    count.style.color = len > 500 ? '#ef4444' : '#a0a0a0';
  }
}

export function togglePanel(panel, open) {
  if (!panel) return false;
  const isOpen = (open !== undefined) ? open : !panel.classList.contains('open');
  panel.classList.toggle('open', isOpen);
  if (isOpen) {
    setTimeout(() => {
      const input = getEl('aiInput');
      if (input) input.focus();
    }, 100);
  }
  return isOpen;
}

export function addMessage(container, text, sender = 'bot', imageDataUrl = null, options = {}) {
  if (!container) return null;
  const { withRegenerate = false, isError = false, errorCallback = null } = options;

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
    if (withRegenerate) {
      const regenBtn = document.createElement('button');
      regenBtn.className = 'msg-regen-btn';
      regenBtn.innerHTML = '<i class="fas fa-rotate-right"></i>';
      regenBtn.title = 'Regenerate response';
      regenBtn.setAttribute('aria-label', 'Regenerate');
      regenBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const event = new CustomEvent('regenerate-request', { detail: { messageEl: div } });
        document.dispatchEvent(event);
      });
      div.appendChild(regenBtn);
    }
  } else {
    const safeText = escapeHtml(text);
    let content = safeText;
    if (imageDataUrl) {
      content += `<br><img src="${imageDataUrl}" class="image-preview" alt="attached">`;
    }
    div.innerHTML = content;
  }

  if (isError && errorCallback) {
    const retryBtn = document.createElement('button');
    retryBtn.className = 'msg-retry-btn';
    retryBtn.innerHTML = '<i class="fas fa-redo"></i> Retry';
    retryBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      errorCallback();
    });
    div.appendChild(retryBtn);
  }

  container.appendChild(div);
  container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  return div;
}

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

export function showPreview(container, file) {
  if (!container) return;
  container.innerHTML = '';
  if (!file) return;

  const isImage = file.type?.startsWith('image/') || file.dataUrl?.startsWith('data:image');
  const isPDF = file.type === 'application/pdf' || file.name?.endsWith('.pdf');
  const isDoc = file.type?.includes('document') || file.name?.endsWith('.docx') || file.name?.endsWith('.txt');

  const pill = document.createElement('div');
  pill.className = 'image-preview-pill';

  let icon = 'fa-file';
  let bgColor = 'rgba(255,255,255,0.04)';
  
  if (isImage) {
    icon = 'fa-image';
    bgColor = 'rgba(255,255,255,0.04)';
  } else if (isPDF) {
    icon = 'fa-file-pdf';
    bgColor = 'rgba(255,255,255,0.04)';
  } else if (isDoc) {
    icon = 'fa-file-lines';
    bgColor = 'rgba(255,255,255,0.04)';
  }

  pill.innerHTML = `
    ${isImage ? `<img src="${file.dataUrl}" alt="preview" class="preview-thumb">` : `<i class="fas ${icon}" style="font-size: 20px; color: #888;"></i>`}
    <span class="file-name">${file.name || 'file'}</span>
    <span class="file-size">${formatFileSize(file.size || 0)}</span>
    <button class="remove-file" id="aiRemoveFile" aria-label="Remove file">
      <i class="fas fa-times"></i>
    </button>
  `;
  pill.style.background = bgColor;
  container.appendChild(pill);

  document.getElementById('aiRemoveFile')?.addEventListener('click', () => {
    container.innerHTML = '';
    const event = new CustomEvent('file-removed');
    document.dispatchEvent(event);
  });
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}