// ============================================================
// ADVANCED SCRAPER ENGINE v2.0
// Uses Readability + Turndown + JSON-LD
// ============================================================

// Global references (loaded from CDN)
let Readability = null;
let TurndownService = null;

// ============================================================
// Load Libraries (called from main init)
// ============================================================
export async function loadScraperLibraries() {
  const libs = {
    readability: 'https://cdnjs.cloudflare.com/ajax/libs/readability/0.4.4/Readability.min.js',
    turndown: 'https://cdnjs.cloudflare.com/ajax/libs/turndown/7.1.2/turndown.min.js'
  };

  await Promise.all([
    loadScript(libs.readability),
    loadScript(libs.turndown)
  ]);

  Readability = window.Readability;
  TurndownService = window.TurndownService;
  
  console.log('📚 Scraper libraries loaded');
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// ============================================================
// MAIN SCRAPER ENGINE
// ============================================================
export function scrapePageAdvanced() {
  console.log('🕷️ Advanced scraping started...');
  
  const data = {
    title: document.title,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    pageType: detectPageType(),
    readability: null,
    structuredData: [],
    markdown: '',
    summary: '',
    metadata: {}
  };

  // 1. Extract Readability Content (Clean main content)
  try {
    if (Readability) {
      const documentClone = document.cloneNode(true);
      const reader = new Readability(documentClone);
      const article = reader.parse();
      
      if (article) {
        data.readability = {
          title: article.title,
          byline: article.byline,
          excerpt: article.excerpt,
          content: article.content, // HTML string
          textContent: article.textContent
        };
        
        // Convert to Markdown
        if (TurndownService) {
          const turndown = new TurndownService({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced',
            emDelimiter: '*',
            bulletListMarker: '-'
          });
          
          // Custom rules for better markdown
          turndown.addRule('strikethrough', {
            filter: ['del', 's', 'strike'],
            replacement: function(content) {
              return '~~' + content + '~~';
            }
          });
          
          data.markdown = turndown.turndown(article.content);
        }
        
        data.summary = article.excerpt || article.textContent.substring(0, 300);
      }
    }
  } catch (error) {
    console.warn('Readability failed, falling back to basic scraper:', error);
    data.readability = null;
  }

  // 2. Extract Structured Data (JSON-LD)
  try {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    scripts.forEach(script => {
      try {
        const json = JSON.parse(script.textContent);
        data.structuredData.push(json);
      } catch (e) {}
    });
  } catch (error) {
    console.warn('JSON-LD extraction failed:', error);
  }

  // 3. Extract Meta & OG Tags
  data.metadata = extractMetadata();

  // 4. If Readability fails, use fallback
  if (!data.readability) {
    console.log('⚠️ Using fallback scraper');
    const fallbackData = scrapeFallback();
    data.markdown = fallbackData.content;
    data.summary = fallbackData.summary;
  }

  // 5. Enhanced summary with AI-friendly formatting
  data.aiContext = formatForAIAdvanced(data);

  console.log('✅ Advanced scraping complete');
  return data;
}

// ============================================================
// Detect Page Type
// ============================================================
function detectPageType() {
  const url = window.location.href;
  const title = document.title.toLowerCase();
  const meta = document.querySelector('meta[property="og:type"]');
  
  if (meta) {
    const type = meta.content;
    if (type.includes('article')) return 'article';
    if (type.includes('product')) return 'product';
    if (type.includes('website')) return 'website';
  }
  
  if (url.includes('/blog/') || url.includes('/post/') || title.includes('blog')) return 'blog';
  if (url.includes('/product/') || url.includes('/shop/')) return 'product';
  if (url.includes('/portfolio/') || url.includes('/project/')) return 'portfolio';
  if (url === window.location.origin + '/' || url === window.location.origin) return 'homepage';
  
  return 'general';
}

// ============================================================
// Extract Metadata
// ============================================================
function extractMetadata() {
  const meta = {};
  
  // Standard meta
  const desc = document.querySelector('meta[name="description"]');
  if (desc) meta.description = desc.content;
  
  const keywords = document.querySelector('meta[name="keywords"]');
  if (keywords) meta.keywords = keywords.content;
  
  // Open Graph
  const og = ['title', 'description', 'image', 'url', 'type', 'site_name'];
  og.forEach(key => {
    const el = document.querySelector(`meta[property="og:${key}"]`);
    if (el) meta[`og_${key}`] = el.content;
  });
  
  // Twitter Cards
  const tw = ['card', 'title', 'description', 'image'];
  tw.forEach(key => {
    const el = document.querySelector(`meta[name="twitter:${key}"]`);
    if (el) meta[`twitter_${key}`] = el.content;
  });
  
  // Canonical URL
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) meta.canonical = canonical.href;
  
  return meta;
}

// ============================================================
// FALLBACK SCRAPER (if Readability fails)
// ============================================================
function scrapeFallback() {
  const clone = document.body.cloneNode(true);
  
  // Remove junk
  const removeSelectors = [
    'nav', 'header', 'footer', 'aside', 
    '.sidebar', '.navigation', '.menu', '.ads',
    '.cookie-banner', '.popup', '.overlay',
    'script', 'style', 'noscript', 'iframe'
  ];
  removeSelectors.forEach(selector => {
    clone.querySelectorAll(selector).forEach(el => el.remove());
  });
  
  // Convert to text
  let content = clone.textContent || '';
  content = content.replace(/\s+/g, ' ').trim();
  
  // Generate summary
  const summary = content.substring(0, 500) + '...';
  
  return { content, summary };
}

// ============================================================
// FORMAT FOR AI (Advanced)
// ============================================================
export function formatForAIAdvanced(data) {
  let context = '';
  
  // 1. Page Header
  context += `# 📄 ${data.title}\n\n`;
  context += `**URL:** ${data.url}\n`;
  context += `**Type:** ${data.pageType}\n`;
  context += `**Scraped:** ${new Date(data.timestamp).toLocaleString()}\n\n`;
  
  // 2. Metadata
  if (Object.keys(data.metadata).length > 0) {
    context += `## 📋 Metadata\n`;
    for (const [key, value] of Object.entries(data.metadata)) {
      if (value && value.length > 0) {
        context += `- **${key}:** ${value}\n`;
      }
    }
    context += '\n';
  }
  
  // 3. Structured Data (Rich snippets)
  if (data.structuredData && data.structuredData.length > 0) {
    context += `## 📊 Structured Data (Schema.org)\n`;
    data.structuredData.forEach((item, index) => {
      context += `\n### Schema ${index + 1}\n`;
      context += `\`\`\`json\n${JSON.stringify(item, null, 2)}\n\`\`\`\n`;
    });
    context += '\n';
  }
  
  // 4. Main Content (Markdown)
  if (data.markdown) {
    context += `## 📝 Main Content\n\n`;
    // Limit to 4000 chars to save tokens
    const maxLength = 4000;
    const content = data.markdown.length > maxLength 
      ? data.markdown.substring(0, maxLength) + '... (truncated)'
      : data.markdown;
    context += content;
    context += '\n\n';
  }
  
  // 5. Summary
  if (data.summary) {
    context += `## 📌 Summary\n\n`;
    context += data.summary;
    context += '\n\n';
  }
  
  // 6. AI Instructions
  context += `---\n`;
  context += `*🤖 AI Instructions: Use this context to answer user questions about this page. Be precise, reference specific details from the content, and maintain a friendly professional tone.*\n`;
  
  return context;
}

// ============================================================
// DYNAMIC CONTENT WATCHER (For SPA)
// ============================================================
export function watchForChanges(callback) {
  let lastUrl = window.location.href;
  
  // Watch for URL changes (SPA navigation)
  const observer = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      console.log('🔄 Page navigation detected');
      callback();
    }
  });
  
  observer.observe(document, { subtree: true, childList: true });
  
  // Also watch for pushState/popState
  const originalPushState = history.pushState;
  history.pushState = function() {
    originalPushState.apply(this, arguments);
    setTimeout(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        callback();
      }
    }, 500);
  };
  
  return observer;
}

// ============================================================
// SMART EXTRACT - Get specific elements
// ============================================================
export function extractSpecificData() {
  const data = {
    headings: [],
    links: [],
    images: [],
    tables: []
  };
  
  // Headings with hierarchy
  document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
    data.headings.push({
      level: parseInt(h.tagName[1]),
      text: h.textContent.trim()
    });
  });
  
  // Links (with context)
  document.querySelectorAll('a[href]').forEach(a => {
    const href = a.href;
    if (href && !href.startsWith('javascript:') && !href.startsWith('#')) {
      data.links.push({
        text: a.textContent.trim(),
        href: href
      });
    }
  });
  
  // Images
  document.querySelectorAll('img[src]').forEach(img => {
    data.images.push({
      src: img.src,
      alt: img.alt || '',
      title: img.title || ''
    });
  });
  
  // Tables
  document.querySelectorAll('table').forEach(table => {
    const rows = [];
    table.querySelectorAll('tr').forEach(tr => {
      const cells = [];
      tr.querySelectorAll('td, th').forEach(td => {
        cells.push(td.textContent.trim());
      });
      rows.push(cells);
    });
    data.tables.push(rows);
  });
  
  return data;
}