# Nexus Web Assistant

[![Version](https://img.shields.io/npm/v/nexus-web-assistant)](https://www.npmjs.com/package/nexus-web-assistant)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CDN](https://img.shields.io/badge/CDN-jsDelivr-blue)](https://cdn.jsdelivr.net/npm/nexus-web-assistant@1.2.0/dist/nexus-assistant.min.js)

**Nexus Web Assistant** is a lightweight, embeddable AI chat widget that turns any webpage into a conversational knowledge base. It automatically scrapes the page content (including metadata, structured data, and clean main text) and lets users ask questions directly to an AI assistant powered by [Groq](https://groq.com/).

- **Zero‑dependency** – works on any static or dynamic website.
- **Instant context** – the AI answers based on the current page, not just general knowledge.
- **Beautiful dark/light themes** – auto‑detects your site’s theme and adapts.
- **CDN‑ready** – drop in a single `<script>` and you're live.

➡️ [Live Demo](https://trynexusweb.vercel.app/demo) · [GitHub](https://github.com/thekaifansari01/nexusWebAssistant/)

---

## Features

- **Page‑aware AI** – scrapes headings, paragraphs, metadata, JSON‑LD, and more to build a rich context for each query.
- **Smart Caching** – stores scraped data in IndexedDB (24‑hour TTL) for faster repeat interactions.
- **File Attachments** – users can attach images (vision‑capable models supported).
- **Markdown & Syntax Highlighting** – responses are rendered in clean Markdown with code highlighting.
- **Theme Switching** – automatically follows your website’s theme; users can toggle manually.
- **SPA‑ready** – detects navigation changes (pushState/popState) and refreshes context.
- **Fully Customizable** – override API key, model, greeting, system prompt, and UI colours.

---

## Installation

### CDN (recommended)

Add the following script to your HTML – it loads the widget and all its dependencies (Font Awesome, Marked, Highlight.js, and scrapers).

```html
<script defer src="https://cdn.jsdelivr.net/npm/nexus-web-assistant@1.2.0/dist/nexus-assistant.min.js"></script>
```

> **Note:** The script is loaded asynchronously; it won’t block your page rendering.

---

## Quick Start

1. **Include the script** (as above) on your page.
2. **Configure your Groq API key** (and optional settings) via `window.NexusConfig`:

```html
<script>
  window.NexusConfig = {
    apiKey: 'YOUR_GROQ_API_KEY',          // Required
    model: 'meta-llama/llama-4-scout-17b-16e-instruct', // optional
    botName: 'My Assistant',              // optional
    greeting: 'Hello! How can I help?',   // optional
    systemPrompt: 'You are a helpful assistant...', // optional
    theme: 'dark'                         // 'dark' | 'light' | auto-detect
  };
</script>
```

3. **That's it!** A floating chat button will appear in the bottom‑right corner of your page.

---

## Configuration Options

All settings are optional except `apiKey`. Set them in `window.NexusConfig` before the widget script loads.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | `''` | **Required** – Your Groq API key. |
| `model` | `string` | `'meta-llama/llama-4-scout-17b-16e-instruct'` | Groq model to use. |
| `botName` | `string` | `'Nexus AI'` | Display name in the header. |
| `greeting` | `string` | (default message) | Initial bot message shown when panel opens. |
| `systemPrompt` | `string` | (default prompt) | System instructions for the AI (contextualises page data). |
| `theme` | `'dark' \| 'light'` | auto‑detected | Force a theme; otherwise detects from body classes, meta tags, or system preference. |

---

## Customisation

### Theming

The widget automatically adapts to your site’s theme by checking:
- `body` classes (`.dark`, `.dark-theme`, `.dark-mode`, etc.)
- `data-theme` attribute on `<html>`
- `<meta name="theme-color">` brightness
- System preference (`prefers-color-scheme`)

You can force a theme by setting `theme` in `NexusConfig`.

Users can toggle the theme manually using the moon/sun icon in the header.

### CSS Variables

All UI colours are controlled by CSS variables inside the widget’s shadow‑like scope. To override, simply set these variables in your own stylesheet (with higher specificity).

Example (dark theme override):
```css
#ai-widget-root {
  --bg-panel: rgba(20, 20, 20, 0.95);
  --text-primary: #ffffff;
  --user-bubble-bg: #333333;
  /* ... see styles.js for full list */
}
```

---

## How It Works

1. **Page Scraping** – uses [Readability](https://github.com/mozilla/readability) and [Turndown](https://github.com/mixmark-io/turndown) to extract clean HTML, convert to Markdown, and capture JSON‑LD structured data.
2. **Caching** – the scraped content is stored in IndexedDB for 24 hours, reducing redundant scraping on subsequent visits.
3. **Conversation** – user messages, together with the page context, are sent to the Groq API. The response is streamed (or not) and rendered with Markdown.
4. **SPA Support** – a `MutationObserver` watches for URL changes and re‑scrapes when navigation occurs.

---

## API Key & Security

- You **must** provide a valid [Groq API key](https://console.groq.com/keys) to use the assistant.
- The key is sent directly from the client to Groq. **Do not expose** your key in public repositories. We recommend:
  - Using environment variables if you build the widget yourself.
  - Treating the key as a user‑supplied value (e.g., from a backend proxy).

For production, consider proxying requests through your own backend to keep the key secret.

---

## Development

### Build from Source

Clone the repository and install dependencies:

```bash
git clone https://github.com/thekaifansari01/nexusWebAssistant.git
cd nexusWebAssistant
npm install
```

Build the minified bundle:

```bash
npm run build
```

### File Structure

- `src/` – source code
  - `core/` – config and state
  - `ui/` – DOM manipulation and styles
  - `api/` – Groq communication
  - `scraper/` – advanced scraping engine
  - `utils/` – caching helpers
- `dist/` – output bundle
- `index.js` – entry point

---

## Contributing

Contributions are welcome! Please read the [Contributing Guidelines](CONTRIBUTING.md) before submitting a PR.

- **Report bugs** via [Issues](https://github.com/thekaifansari01/nexusWebAssistant/issues)
- **Request features** – we’re always open to suggestions.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Acknowledgements

- [Groq](https://groq.com/) for the lightning‑fast inference.
- [Readability](https://github.com/mozilla/readability) & [Turndown](https://github.com/mixmark-io/turndown) for content extraction.
- [Font Awesome](https://fontawesome.com/) & [Highlight.js](https://highlightjs.org/) for UI enhancements.

---

**Nexus Web Assistant** – making every webpage intelligent. 🚀