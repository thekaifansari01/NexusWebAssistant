import { CONFIG } from '../core/config.js';

export function injectStyles() {
  const style = document.createElement('style');
  style.id = 'ai-chat-widget-styles';
  style.textContent = `
    @keyframes slideUpFade {
      0% { opacity: 0; transform: translateY(16px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulseDot {
      0%, 100% { transform: scale(0.8); opacity: 0.5; }
      50% { transform: scale(1.2); opacity: 1; }
    }
    @keyframes typing {
      0%, 80%, 100% { opacity: 0.3; }
      40% { opacity: 1; }
    }

    #ai-widget-root {
      all: initial;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      pointer-events: none;
    }
    #ai-widget-root * { box-sizing: border-box; pointer-events: auto; }

    /* ===== FIX: Font Awesome icons ===== */
    #ai-widget-root .fas,
    #ai-widget-root .far,
    #ai-widget-root .fab {
      font-family: 'Font Awesome 6 Free', 'Font Awesome 6 Brands' !important;
      font-weight: 900 !important; /* solid icons use 900 */
      font-style: normal;
      font-variant: normal;
      text-rendering: auto;
      -webkit-font-smoothing: antialiased;
    }
    #ai-widget-root .far {
      font-weight: 400 !important; /* regular */
    }
    #ai-widget-root .fab {
      font-family: 'Font Awesome 6 Brands' !important;
      font-weight: 400 !important;
    }

    /* ===== FLOATING ORB (FAB) ===== */
    .ai-fab {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #ffffff;
      border: 1px solid rgba(255,255,255,0.1);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #000000;
      transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1),
                  transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
                  box-shadow 0.25s ease;
      user-select: none;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
      position: relative;
      z-index: 10;
      will-change: transform, opacity;
    }
    .ai-fab:hover {
      transform: scale(1.05);
      box-shadow: 0 12px 32px rgba(0,0,0,0.5);
    }
    .ai-fab .bot-icon i {
      color: #000000 !important;
      font-size: 24px !important;
    }

    /* Hide FAB when panel is open – smooth fade + scale */
    .ai-panel.open ~ .ai-fab {
      opacity: 0;
      transform: scale(0.8);
      pointer-events: none;
    }

    /* ===== CHAT PANEL ===== */
    .ai-panel {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 400px;
      max-width: calc(100vw - 48px);
      height: 600px;
      max-height: calc(100vh - 48px);
      background: ${CONFIG.COLORS.panelBg};
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: 20px;
      box-shadow: 0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px ${CONFIG.COLORS.border};
      display: flex;
      flex-direction: column;
      overflow: hidden;
      opacity: 0;
      visibility: hidden;
      transform: translateY(20px);
      transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.3s;
    }
    .ai-panel.open {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    /* ===== HEADER ===== */
    .ai-header {
      padding: 20px 24px;
      border-bottom: 1px solid ${CONFIG.COLORS.border};
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
      background: transparent;
    }
    .ai-header-title {
      display: flex;
      align-items: center;
      gap: 12px;
      color: ${CONFIG.COLORS.textPrimary};
      font-weight: 600;
      font-size: 16px;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10B981;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
    }
    .ai-close-btn {
      background: transparent;
      border: none;
      color: ${CONFIG.COLORS.textSecondary};
      font-size: 20px;
      cursor: pointer;
      transition: color 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .ai-close-btn:hover {
      color: ${CONFIG.COLORS.textPrimary};
    }

    /* ===== MESSAGES ===== */
    .ai-messages {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 24px;
      scroll-behavior: smooth;
    }
    .ai-messages::-webkit-scrollbar { width: 6px; }
    .ai-messages::-webkit-scrollbar-track { background: transparent; }
    .ai-messages::-webkit-scrollbar-thumb {
      background: ${CONFIG.COLORS.border};
      border-radius: 10px;
    }

    /* ===== BUBBLES ===== */
    .msg {
      max-width: 85%;
      font-size: 14.5px;
      line-height: 1.6;
      word-break: break-word;
      animation: slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      color: ${CONFIG.COLORS.textPrimary};
    }
    .msg.user {
      align-self: flex-end;
      background: ${CONFIG.COLORS.userBubble};
      padding: 12px 18px;
      border-radius: 16px;
      border-bottom-right-radius: 4px;
      border: 1px solid ${CONFIG.COLORS.border};
    }
    .msg.bot {
      align-self: flex-start;
      background: ${CONFIG.COLORS.botBubble};
      max-width: 95%;
    }
    .msg.bot .bot-label {
      font-size: 12px;
      color: ${CONFIG.COLORS.textSecondary};
      margin-bottom: 6px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .msg .image-preview {
      max-width: 200px;
      border-radius: 12px;
      margin-top: 8px;
      border: 1px solid ${CONFIG.COLORS.border};
    }
    .msg.user .image-preview { max-width: 100%; }

    /* Markdown Cleanup */
    .msg.bot p { margin: 0 0 12px 0; }
    .msg.bot p:last-child { margin-bottom: 0; }
    .msg.bot code {
      background: #1e1e1e;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: ui-monospace, monospace;
      font-size: 0.9em;
      border: 1px solid ${CONFIG.COLORS.border};
    }
    .msg.bot pre {
      background: #111111;
      padding: 16px;
      border-radius: 12px;
      overflow-x: auto;
      margin: 12px 0;
      border: 1px solid ${CONFIG.COLORS.border};
    }
    .msg.bot pre code { background: transparent; padding: 0; border: none; }
    .msg.bot ul, .msg.bot ol { margin: 8px 0 12px 20px; padding-left: 0; }
    .msg.bot li { margin-bottom: 6px; }
    .msg.bot a { color: #fff; text-decoration: underline; text-underline-offset: 4px; }

    /* ===== INPUT AREA ===== */
    .ai-input-area {
      padding: 16px 24px 24px;
      background: transparent;
      flex-shrink: 0;
    }
    .ai-input-container {
      display: flex;
      align-items: center;
      background: #161616;
      border: 1px solid ${CONFIG.COLORS.border};
      border-radius: 24px;
      padding: 6px 6px 6px 16px;
      transition: border-color 0.2s, background 0.2s;
    }
    .ai-input-container:focus-within {
      border-color: #555;
      background: #1a1a1a;
    }
    .ai-input-container input {
      flex: 1;
      background: transparent;
      border: none;
      color: ${CONFIG.COLORS.textPrimary};
      font-size: 14px;
      outline: none;
      font-family: inherit;
      padding: 8px 0;
    }
    .ai-input-container input::placeholder {
      color: ${CONFIG.COLORS.textSecondary};
    }
    .icon-btn {
      background: transparent;
      border: none;
      color: ${CONFIG.COLORS.textSecondary};
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: color 0.2s, background 0.2s;
    }
    .icon-btn:hover {
      color: #fff;
      background: ${CONFIG.COLORS.borderHover};
    }
    .send-btn {
      background: #fff;
      color: #000;
      margin-left: 4px;
    }
    .send-btn:hover {
      background: #e0e0e0;
      color: #000;
    }
    .send-btn:disabled {
      background: #333;
      color: #666;
      cursor: not-allowed;
    }

    /* ===== PREVIEW PILL ===== */
    #aiPreviewContainer { margin-bottom: 12px; }
    .image-preview-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #1e1e1e;
      border: 1px solid ${CONFIG.COLORS.border};
      border-radius: 8px;
      padding: 6px 12px 6px 6px;
      animation: slideUpFade 0.3s ease forwards;
    }
    .image-preview-pill img {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      object-fit: cover;
    }
    .image-preview-pill .file-name {
      font-size: 12px;
      color: ${CONFIG.COLORS.textPrimary};
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .image-preview-pill .remove-file {
      background: none;
      border: none;
      color: ${CONFIG.COLORS.textSecondary};
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
    }
    .image-preview-pill .remove-file:hover { color: #fff; }

    /* ===== TYPING INDICATOR ===== */
    .typing-indicator {
      display: flex;
      gap: 4px;
      padding: 8px 0;
      align-self: flex-start;
    }
    .typing-indicator span {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: ${CONFIG.COLORS.textSecondary};
      animation: typing 1.4s infinite;
    }
    .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
    .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 480px) {
      .ai-panel {
        width: calc(100vw - 32px);
        right: 16px;
        height: 80vh;
        max-height: calc(100vh - 48px);
      }
      .ai-fab {
        width: 50px;
        height: 50px;
      }
      .ai-fab .bot-icon { font-size: 20px; }
    }
  `;
  document.head.appendChild(style);
}