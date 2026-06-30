let Readability = null;
let TurndownService = null;

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
          content: article.content,
          textContent: article.textContent
        };
        
        if (TurndownService) {
          const turndown = new TurndownService({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced',
            emDelimiter: '*',
            bulletListMarker: '-'
          });
          
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

  data.metadata = extractMetadata();

  if (!data.readability) {
    console.log('⚠️ Using fallback scraper');
    const fallbackData = scrapeFallback();
    data.markdown = fallbackData.content;
    data.summary = fallbackData.summary;
  }

  data.aiContext = formatForAIAdvanced(data);

  console.log('✅ Advanced scraping complete');
  return data;
}

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

function extractMetadata() {
  const meta = {};
  
  const desc = document.querySelector('meta[name="description"]');
  if (desc) meta.description = desc.content;
  
  const keywords = document.querySelector('meta[name="keywords"]');
  if (keywords) meta.keywords = keywords.content;
  
  const og = ['title', 'description', 'image', 'url', 'type', 'site_name'];
  og.forEach(key => {
    const el = document.querySelector(`meta[property="og:${key}"]`);
    if (el) meta[`og_${key}`] = el.content;
  });
  
  const tw = ['card', 'title', 'description', 'image'];
  tw.forEach(key => {
    const el = document.querySelector(`meta[name="twitter:${key}"]`);
    if (el) meta[`twitter_${key}`] = el.content;
  });
  
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) meta.canonical = canonical.href;
  
  return meta;
}

function scrapeFallback() {
  const clone = document.body.cloneNode(true);
  
  const removeSelectors = [
    'nav', 'header', 'footer', 'aside', 
    '.sidebar', '.navigation', '.menu', '.ads',
    '.cookie-banner', '.popup', '.overlay',
    'script', 'style', 'noscript', 'iframe'
  ];
  removeSelectors.forEach(selector => {
    clone.querySelectorAll(selector).forEach(el => el.remove());
  });
  
  let content = clone.textContent || '';
  content = content.replace(/\s+/g, ' ').trim();
  
  const summary = content.substring(0, 500) + '...';
  
  return { content, summary };
}

export function formatForAIAdvanced(data) {
  let context = '';
  
  context += `# 📄 ${data.title}\n\n`;
  context += `**URL:** ${data.url}\n`;
  context += `**Type:** ${data.pageType}\n`;
  context += `**Scraped:** ${new Date(data.timestamp).toLocaleString()}\n\n`;
  
  if (Object.keys(data.metadata).length > 0) {
    context += `## 📋 Metadata\n`;
    for (const [key, value] of Object.entries(data.metadata)) {
      if (value && value.length > 0) {
        context += `- **${key}:** ${value}\n`;
      }
    }
    context += '\n';
  }
  
  if (data.structuredData && data.structuredData.length > 0) {
    context += `## 📊 Structured Data (Schema.org)\n`;
    data.structuredData.forEach((item, index) => {
      context += `\n### Schema ${index + 1}\n`;
      context += `\`\`\`json\n${JSON.stringify(item, null, 2)}\n\`\`\`\n`;
    });
    context += '\n';
  }
  
  if (data.markdown) {
    context += `## 📝 Main Content\n\n`;
    const maxLength = 4000;
    const content = data.markdown.length > maxLength 
      ? data.markdown.substring(0, maxLength) + '... (truncated)'
      : data.markdown;
    context += content;
    context += '\n\n';
  }
  
  if (data.summary) {
    context += `## 📌 Summary\n\n`;
    context += data.summary;
    context += '\n\n';
  }
  
  context += `---\n`;
  context += `*🤖 AI Instructions: Use this context to answer user questions about this page. Be precise, reference specific details from the content, and maintain a friendly professional tone.*\n`;
  
  return context;
}

export function watchForChanges(callback) {
  let lastUrl = window.location.href;
  
  const observer = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      console.log('🔄 Page navigation detected');
      callback();
    }
  });
  
  observer.observe(document.body, { childList: true, subtree: false });
  
  window.addEventListener('popstate', () => {
    setTimeout(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        callback();
      }
    }, 100);
  });
  
  return observer;
}

export function extractSpecificData() {
  const data = {
    headings: [],
    links: [],
    images: [],
    tables: []
  };
  
  document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(h => {
    data.headings.push({
      level: parseInt(h.tagName[1]),
      text: h.textContent.trim()
    });
  });
  
  document.querySelectorAll('a[href]').forEach(a => {
    const href = a.href;
    if (href && !href.startsWith('javascript:') && !href.startsWith('#')) {
      data.links.push({
        text: a.textContent.trim(),
        href: href
      });
    }
  });
  
  document.querySelectorAll('img[src]').forEach(img => {
    data.images.push({
      src: img.src,
      alt: img.alt || '',
      title: img.title || ''
    });
  });
  
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