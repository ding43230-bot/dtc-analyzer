import * as cheerio from 'cheerio';

export interface ScrapedData {
  url: string;
  title: string;
  description: string;
  keywords: string;
  metaTags: Record<string, string>;
  images: Array<{ src: string; alt: string; width?: number; height?: number }>;
  links: Array<{ href: string; text: string; isExternal: boolean }>;
  headings: Array<{ level: number; text: string }>;
  content: string;
  loadTime: number;
  screenshot: string; // base64
  mobileScreenshot: string; // base64
  viewport: { width: number; height: number };
  structuredData: any[];
  forms: Array<{ action: string; method: string; inputs: string[] }>;
  scripts: string[];
  stylesheets: string[];
}

export async function scrapeWebsite(url: string): Promise<ScrapedData> {
  const startTime = Date.now();

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const html = await response.text();
  const loadTime = Date.now() - startTime;
  const $ = cheerio.load(html);

  // Meta tags
  const metaTags: Record<string, string> = {};
  $('meta').each((_, el) => {
    const name = $(el).attr('name') || $(el).attr('property');
    const content = $(el).attr('content');
    if (name && content) {
      metaTags[name] = content;
    }
  });

  // Images (first 15)
  const images: Array<{ src: string; alt: string; width?: number; height?: number }> = [];
  $('img').slice(0, 15).each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || '';
    if (src) {
      images.push({
        src: resolveUrl(url, src),
        alt: $(el).attr('alt') || '',
        width: parseInt($(el).attr('width') || '') || undefined,
        height: parseInt($(el).attr('height') || '') || undefined,
      });
    }
  });

  // Links (first 30)
  const links: Array<{ href: string; text: string; isExternal: boolean }> = [];
  const origin = new URL(url).origin;
  $('a').slice(0, 30).each((_, el) => {
    const href = $(el).attr('href');
    if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
      const resolved = resolveUrl(url, href);
      links.push({
        href: resolved,
        text: $(el).text().trim().substring(0, 100),
        isExternal: !resolved.startsWith(origin),
      });
    }
  });

  // Headings
  const headings: Array<{ level: number; text: string }> = [];
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    const level = parseInt(el.tagName.charAt(1));
    const text = $(el).text().trim();
    if (text) {
      headings.push({ level, text });
    }
  });

  // Content (first 5000 chars)
  const content = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 5000);

  // Structured data
  const structuredData: any[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || '{}');
      structuredData.push(json);
    } catch {}
  });

  // Forms
  const forms: Array<{ action: string; method: string; inputs: string[] }> = [];
  $('form').each((_, form) => {
    const inputs: string[] = [];
    $(form).find('input, select, textarea').each((_, input) => {
      inputs.push($(input).attr('name') || $(input).attr('type') || '');
    });
    forms.push({
      action: $(form).attr('action') || '',
      method: $(form).attr('method') || 'GET',
      inputs,
    });
  });

  // Scripts (first 20)
  const scripts: string[] = [];
  $('script[src]').slice(0, 20).each((_, el) => {
    const src = $(el).attr('src');
    if (src) scripts.push(resolveUrl(url, src));
  });

  // Stylesheets (first 10)
  const stylesheets: string[] = [];
  $('link[rel="stylesheet"]').slice(0, 10).each((_, el) => {
    const href = $(el).attr('href');
    if (href) stylesheets.push(resolveUrl(url, href));
  });

  return {
    url,
    title: $('title').text().trim() || '',
    description: metaTags['description'] || '',
    keywords: metaTags['keywords'] || '',
    metaTags,
    images,
    links,
    headings,
    content,
    loadTime,
    screenshot: '',
    mobileScreenshot: '',
    viewport: { width: 1920, height: 1080 },
    structuredData,
    forms,
    scripts,
    stylesheets,
  };
}

function resolveUrl(base: string, relative: string): string {
  try {
    return new URL(relative, base).href;
  } catch {
    return relative;
  }
}

// Keep for backward compatibility but not used
export async function closeBrowser(): Promise<void> {}
