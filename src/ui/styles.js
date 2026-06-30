import { CONFIG } from '../core/config.js';

export function injectStyles() {
  const style = document.createElement('style');
  style.id = 'ai-chat-widget-styles';
  style.textContent = `
    #ai-widget-root {
      --bg-panel: rgba(9, 9, 11, 0.92);
      --bg-input: rgba(24, 24, 27, 0.6);
      --border-color: rgba(39, 39, 42, 0.6);
      --text-primary: #fafafa;
      --text-secondary: #a1a1aa;
      --user-bubble-bg: #27272a;
      --bot-bubble-bg: rgba(24, 24, 27, 0.6);
      --shadow-color: rgba(0, 0, 0, 0.4);
      --fab-bg: rgba(24, 24, 27, 0.8);
      --accent: #a855f7;
      --send-bg: #a855f7;
      --send-color: #fff;
      --border-hover: rgba(168, 85, 247, 0.3);
    }

    #ai-widget-root[data-theme="light"] {
      --bg-panel: rgba(245, 245, 245, 0.92);
      --bg-input: rgba(0, 0, 0, 0.02);
      --border-color: rgba(0, 0, 0, 0.08);
      --text-primary: #111;
      --text-secondary: #555;
      --user-bubble-bg: #e0e0e0;
      --bot-bubble-bg: rgba(255, 255, 255, 0.5);
      --shadow-color: rgba(0, 0, 0, 0.05);
      --fab-bg: rgba(255, 255, 255, 0.6);
      --accent: #888;
      --send-bg: #222;
      --send-color: #fff;
      --border-hover: rgba(0, 0, 0, 0.15);
    }

    @keyframes slideUpFade {
      0% { opacity: 0; transform: translateY(30px) scale(0.95); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes pulseDot {
      0%, 100% { transform: scale(0.8); opacity: 0.4; }
      50% { transform: scale(1.2); opacity: 1; }
    }
    @keyframes typing {
      0%, 80%, 100% { opacity: 0.3; transform: translateY(2px); }
      40% { opacity: 1; transform: translateY(-2px); }
    }
    @keyframes previewPop {
      0% { opacity: 0; transform: scale(0.8) translateY(10px); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    @keyframes fabPulse {
      0% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.1); }
      70% { box-shadow: 0 0 0 16px rgba(168, 85, 247, 0); }
      100% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0); }
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
      color: var(--text-primary);
    }
    #ai-widget-root * { box-sizing: border-box; pointer-events: auto; }

    #ai-widget-root .fas,
    #ai-widget-root .far,
    #ai-widget-root .fab {
      font-family: 'Font Awesome 6 Free', 'Font Awesome 6 Brands' !important;
      font-weight: 900 !important;
      font-style: normal;
      font-variant: normal;
      text-rendering: auto;
      -webkit-font-smoothing: antialiased;
    }
    #ai-widget-root .far { font-weight: 400 !important; }
    #ai-widget-root .fab {
      font-family: 'Font Awesome 6 Brands' !important;
      font-weight: 400 !important;
    }

    .ai-fab {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: var(--fab-bg);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--border-color);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-primary);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      user-select: none;
      box-shadow: 0 4px 24px var(--shadow-color);
      position: relative;
      z-index: 10;
      will-change: transform, opacity;
      animation: fabPulse 3s infinite;
    }
    .ai-fab:hover {
      transform: scale(1.06);
      box-shadow: 0 6px 32px var(--shadow-color);
      border-color: var(--accent);
    }
    .ai-fab .bot-icon i {
      color: #fafafa !important;
      font-size: 26px !important;
      filter: none;
    }
    .ai-panel.open ~ .ai-fab {
      opacity: 0;
      transform: scale(0.8);
      pointer-events: none;
      animation: none;
    }

    .ai-panel {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 420px;
      max-width: calc(100vw - 48px);
      height: 620px;
      max-height: calc(100vh - 48px);
      background: var(--bg-panel);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border-radius: 28px;
      box-shadow: 0 16px 64px var(--shadow-color), 0 0 0 1px var(--border-color);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      opacity: 0;
      visibility: hidden;
      transform: translateY(20px) scale(0.96);
      transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      border: 1px solid var(--border-color);
    }
    .ai-panel.open {
      opacity: 1;
      visibility: visible;
      transform: translateY(0) scale(1);
    }

    .ai-header {
      padding: 20px 24px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    }
    .ai-header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ai-header-title {
      display: flex;
      align-items: center;
      gap: 12px;
      color: var(--text-primary);
      font-weight: 600;
      font-size: 16px;
      letter-spacing: -0.3px;
    }
    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #a855f7;
      animation: pulseDot 2s infinite;
      flex-shrink: 0;
    }
    .ai-theme-toggle,
    .ai-close-btn,
    .ai-clear-btn {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      width: 32px;
      height: 32px;
      border-radius: 50%;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .ai-theme-toggle:hover,
    .ai-close-btn:hover,
    .ai-clear-btn:hover {
      background: var(--border-color);
      color: var(--text-primary);
    }
    .ai-theme-toggle:hover {
      transform: rotate(180deg) !important;
    }
    .ai-close-btn:hover {
      transform: rotate(90deg);
    }

    .ai-messages {
      flex: 1;
      padding: 24px 24px 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
      scroll-behavior: smooth;
    }
    .ai-messages::-webkit-scrollbar { width: 4px; }
    .ai-messages::-webkit-scrollbar-track { background: transparent; }
    .ai-messages::-webkit-scrollbar-thumb {
      background: var(--border-color);
      border-radius: 10px;
    }

    .msg {
      max-width: 85%;
      font-size: 14.5px;
      line-height: 1.7;
      word-break: break-word;
      animation: slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      color: var(--text-primary);
      padding: 12px 18px;
      border-radius: 18px;
      position: relative;
      box-shadow: 0 1px 4px var(--shadow-color);
    }
    .msg.user {
      align-self: flex-end;
      background: var(--user-bubble-bg);
      border: 1px solid var(--border-color);
      border-bottom-right-radius: 4px;
    }
    .msg.bot {
      align-self: flex-start;
      background: var(--bot-bubble-bg);
      border: 1px solid var(--border-color);
      border-bottom-left-radius: 4px;
      max-width: 95%;
      padding-bottom: 32px;
    }

    .msg.user::after {
      content: '';
      position: absolute;
      bottom: 0;
      right: -6px;
      width: 12px;
      height: 12px;
      background: var(--user-bubble-bg);
      border-radius: 0 0 12px 0;
      clip-path: polygon(0 0, 100% 0, 100% 100%);
    }
    .msg.bot::before {
      content: '';
      position: absolute;
      bottom: 0;
      left: -6px;
      width: 12px;
      height: 12px;
      background: var(--bot-bubble-bg);
      border-radius: 0 0 0 12px;
      clip-path: polygon(0 0, 100% 100%, 100% 0);
    }

    .msg.bot p { margin: 0 0 12px 0; }
    .msg.bot p:last-child { margin-bottom: 0; }
    .msg.bot code {
      background: rgba(39, 39, 42, 0.6);
      padding: 2px 8px;
      border-radius: 6px;
      font-family: ui-monospace, monospace;
      font-size: 0.9em;
      border: 1px solid rgba(39, 39, 42, 0.4);
      color: #e4e4e7;
    }
    .msg.bot pre {
      background: rgba(9, 9, 11, 0.4);
      padding: 16px;
      border-radius: 14px;
      overflow-x: auto;
      margin: 12px 0;
      border: 1px solid rgba(39, 39, 42, 0.4);
    }
    .msg.bot pre code { background: transparent; padding: 0; border: none; }
    .msg.bot ul, .msg.bot ol { margin: 8px 0 12px 20px; padding-left: 0; }
    .msg.bot li { margin-bottom: 6px; }
    .msg.bot a { color: #a855f7; text-decoration: none; border-bottom: 1px dotted rgba(168, 85, 247, 0.2); }
    .msg .image-preview {
      max-width: 200px;
      border-radius: 14px;
      margin-top: 8px;
      border: 1px solid var(--border-color);
    }

    .msg-regen-btn,
    .msg-retry-btn {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      cursor: pointer;
      margin-top: 8px;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .msg-regen-btn:hover,
    .msg-retry-btn:hover {
      background: var(--border-color);
      color: var(--text-primary);
      border-color: var(--accent);
    }
    .msg.bot .msg-regen-btn {
      position: absolute;
      bottom: 8px;
      right: 8px;
      opacity: 0.6;
      font-size: 14px;
      padding: 4px 6px;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      justify-content: center;
      background: var(--bg-panel);
      margin-top: 0;
      border: 1px solid var(--border-color);
    }
    .msg.bot .msg-regen-btn:hover {
      opacity: 1;
    }
    .msg-retry-btn {
      background: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.3);
      color: #ef4444;
      margin-left: 4px;
    }
    .msg-retry-btn:hover {
      background: rgba(239, 68, 68, 0.2);
      border-color: #ef4444;
      color: #ef4444;
    }

    .ai-input-area {
      padding: 12px 20px 20px;
      background: transparent;
      flex-shrink: 0;
      border-top: 1px solid var(--border-color);
    }
    .ai-input-container {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      background: var(--bg-input);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 4px 4px 4px 16px;
      transition: all 0.25s ease;
      min-height: 48px;
    }
    .ai-input-container:focus-within {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.08);
    }
    .ai-input-container textarea {
      flex: 1;
      background: transparent;
      border: none;
      color: var(--text-primary);
      font-size: 14px;
      outline: none;
      font-family: inherit;
      padding: 10px 0;
      resize: none;
      max-height: 150px;
      line-height: 1.6;
      min-height: 28px;
      scrollbar-width: none;
    }
    .ai-input-container textarea::placeholder {
      color: var(--text-secondary);
      font-weight: 400;
    }

    .icon-btn {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      width: 38px;
      height: 38px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      flex-shrink: 0;
      align-self: flex-end;
      margin-bottom: 2px;
    }
    .icon-btn:hover {
      color: var(--text-primary);
      background: var(--border-color);
      transform: scale(1.05);
    }
    .icon-btn:active { transform: scale(0.92); }

    .send-btn {
      background: var(--send-bg);
      color: var(--send-color);
      width: 38px;
      height: 38px;
      align-self: flex-end;
      margin-bottom: 2px;
      box-shadow: 0 2px 8px var(--shadow-color);
      transition: all 0.25s ease;
      border: none;
    }
    .send-btn:hover {
      transform: scale(1.06);
      box-shadow: 0 4px 12px var(--shadow-color);
    }
    .send-btn:active { transform: scale(0.92); }
    .send-btn:disabled {
      background: rgba(39, 39, 42, 0.6);
      color: var(--text-secondary);
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .ai-input-footer {
      display: flex;
      justify-content: flex-end;
      padding: 4px 6px 0;
      min-height: 20px;
    }
    .ai-char-count {
      font-size: 11px;
      color: var(--text-secondary);
      font-weight: 500;
      transition: color 0.2s;
      opacity: 0.4;
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.3px;
    }

    #aiPreviewContainer {
      margin-bottom: 8px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .image-preview-pill {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: rgba(24, 24, 27, 0.8);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 6px 12px 6px 6px;
      animation: previewPop 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      box-shadow: 0 2px 12px var(--shadow-color);
      transition: all 0.2s;
      max-width: 100%;
    }
    .image-preview-pill:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px var(--shadow-color);
    }
    .image-preview-pill .preview-thumb {
      width: 32px;
      height: 32px;
      border-radius: 10px;
      object-fit: cover;
      border: 1px solid var(--border-color);
    }
    .image-preview-pill .file-name {
      font-size: 12px;
      color: var(--text-primary);
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: 500;
    }
    .image-preview-pill .file-size {
      font-size: 10px;
      color: var(--text-secondary);
      opacity: 0.6;
    }
    .image-preview-pill .remove-file {
      background: rgba(39, 39, 42, 0.6);
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      border-radius: 50%;
      transition: all 0.2s;
      margin-left: 2px;
      width: 26px;
      height: 26px;
    }
    .image-preview-pill .remove-file:hover {
      color: #ef4444;
      background: rgba(239,68,68,0.12);
      transform: scale(1.1);
    }

    .typing-indicator {
      display: flex;
      gap: 6px;
      padding: 12px 0;
      align-self: flex-start;
      background: rgba(24, 24, 27, 0.6);
      padding: 10px 16px;
      border-radius: 18px;
      border: 1px solid var(--border-color);
    }
    .typing-indicator span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #a855f7;
      animation: typing 1.4s infinite;
    }
    .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
    .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

    @media (max-width: 480px) {
      .ai-panel {
        width: calc(100vw - 32px);
        right: 16px;
        height: 80vh;
        max-height: calc(100vh - 48px);
        border-radius: 20px;
      }
      .ai-fab {
        width: 52px;
        height: 52px;
      }
      .ai-fab .bot-icon { font-size: 22px; }
      .ai-input-area {
        padding: 8px 14px 14px;
      }
      .ai-input-container {
        border-radius: 16px;
        padding: 2px 2px 2px 12px;
        min-height: 42px;
      }
      .ai-input-container textarea { font-size: 13px; padding: 8px 0; }
      .icon-btn { width: 32px; height: 32px; }
      .send-btn { width: 32px; height: 32px; }
      .image-preview-pill .file-name { max-width: 100px; }
      .msg.bot {
        padding-bottom: 28px;
      }
    }
  `;
  document.head.appendChild(style);
}