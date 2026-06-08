import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer-core';

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

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function getBrowser() {
  const isVercel = process.env.VERCEL === '1';
  if (isVercel) {
    const chromium = await import('@sparticuz/chromium');
    const execPath = await chromium.default.executablePath();
    if (!execPath) throw new Error('chromium executablePath returned null');
    return puppeteer.launch({
      args: chromium.default.args,
      defaultViewport: { width: 1920, height: 1080 },
      executablePath: execPath,
      headless: true,
    });
  }
  return puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });
}

function resolveUrl(base: string, relative: string): string {
  try { return new URL(relative, base).href; } catch { return relative; }
}

// ─── Puppeteer 爬取（带截图） ───
async function scrapeWithPuppeteer(url: string): Promise<ScrapedData> {
  const startTime = Date.now();
  const browser = await getBrowser();
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    const loadTime = Date.now() - startTime;
    const html = await page.content();

    // 截图
    await page.setViewport({ width: 1920, height: 1080 });
    const screenshot = await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 80 }) as string;
    await page.setViewport({ width: 390, height: 844 });
    const mobileScreenshot = await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 80 }) as string;

    const data = parseHtml(url, html);
    data.loadTime = loadTime;
    data.screenshot = `data:image/jpeg;base64,${screenshot}`;
    data.mobileScreenshot = `data:image/jpeg;base64,${mobileScreenshot}`;
    return data;
  } finally {
    await browser.close();
  }
}

// ─── 纯 HTTP 降级爬取（无截图） ───
async function scrapeWithFetch(url: string): Promise<ScrapedData> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  return parseHtml(url, html);
}

// ─── HTML 解析（共用） ───
function parseHtml(url: string, html: string): ScrapedData {
  const $ = cheerio.load(html);
  const metaTags: Record<string, string> = {};
  $('meta').each((_, el) => {
    const name = $(el).attr('name') || $(el).attr('property');
    const content = $(el).attr('content');
    if (name && content) metaTags[name] = content;
  });

  const images: Array<{ src: string; alt: string; width?: number; height?: number }> = [];
  $('img').slice(0, 15).each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || '';
    if (src) images.push({ src: resolveUrl(url, src), alt: $(el).attr('alt') || '' });
  });

  const links: Array<{ href: string; text: string; isExternal: boolean }> = [];
  const origin = new URL(url).origin;
  $('a').slice(0, 60).each((_, el) => {
    const href = $(el).attr('href');
    if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
      const resolved = resolveUrl(url, href);
      links.push({ href: resolved, text: $(el).text().trim().substring(0, 100), isExternal: !resolved.startsWith(origin) });
    }
  });

  const headings: Array<{ level: number; text: string }> = [];
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    const text = $(el).text().trim();
    if (text) headings.push({ level: parseInt(el.tagName.charAt(1)), text });
  });

  const content = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 5000);
  const structuredData: any[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try { structuredData.push(JSON.parse($(el).html() || '{}')); } catch {}
  });

  const forms: Array<{ action: string; method: string; inputs: string[] }> = [];
  $('form').each((_, form) => {
    const inputs: string[] = [];
    $(form).find('input, select, textarea').each((_, input) => {
      inputs.push($(input).attr('name') || $(input).attr('type') || '');
    });
    forms.push({ action: $(form).attr('action') || '', method: $(form).attr('method') || 'GET', inputs });
  });

  const scripts: string[] = [];
  $('script[src]').slice(0, 20).each((_, el) => { const s = $(el).attr('src'); if (s) scripts.push(resolveUrl(url, s)); });
  const stylesheets: string[] = [];
  $('link[rel="stylesheet"]').slice(0, 10).each((_, el) => { const h = $(el).attr('href'); if (h) stylesheets.push(resolveUrl(url, h)); });

  return {
    url, title: $('title').text().trim() || '', description: metaTags['description'] || '',
    keywords: metaTags['keywords'] || '', metaTags, images, links, headings, content,
    loadTime: 0, screenshot: '', mobileScreenshot: '', viewport: { width: 1920, height: 1080 },
    structuredData, forms, scripts, stylesheets,
  };
}

// ─── 主入口：Puppeteer 优先，失败自动降级 HTTP ───
export async function scrapeWebsite(url: string): Promise<ScrapedData> {
  try {
    return await scrapeWithPuppeteer(url);
  } catch (puppeteerErr) {
    console.warn('Puppeteer failed, falling back to fetch:', (puppeteerErr as Error).message);
    return await scrapeWithFetch(url);
  }
}

// ─── 多页爬取 ───
export interface PageSummary {
  url: string; title: string; h1: string; headings: string;
  content: string; images: Array<{ src: string; alt: string }>;
  forms: Array<{ action: string; method: string; inputs: string[] }>;
}

export interface MultiPageData { homepage: ScrapedData; pages: PageSummary[]; }

function categorizeLink(href: string, text: string): string | null {
  const h = href.toLowerCase();
  const t = text.toLowerCase();
  if (/\/product[s]?\/|\/item[s]?\/|\/p\//.test(h) || /product|item|商品/.test(t)) return 'product';
  if (/\/collection[s]?\/|\/categor|\/c\/|\/shop\/|\/品类/.test(h) || /collection|categor|shop|品类/.test(t)) return 'collection';
  if (/\/about|\/关于|\/who-we-are/.test(h) || /about|关于|who we are/.test(t)) return 'about';
  if (/\/contact|\/联系/.test(h) || /contact|联系/.test(t)) return 'contact';
  if (/\/blog|\/post|\/article|\/news|\/博客/.test(h) || /blog|post|article|news|博客/.test(t)) return 'blog';
  return null;
}

function pickRepresentativePages(links: ScrapedData['links']): string[] {
  const origin = new URL(links[0]?.href || 'https://example.com').origin;
  const internalLinks = links.filter(l => l.href.startsWith(origin) && !l.href.includes('#'));
  const picked: Record<string, string> = {};
  const priority = ['product', 'collection', 'about', 'contact', 'blog'];
  for (const link of internalLinks) {
    const cat = categorizeLink(link.href, link.text);
    if (cat && !picked[cat]) picked[cat] = link.href;
  }
  return priority.map(c => picked[c]).filter(Boolean).slice(0, 5);
}

async function scrapePageSummary(url: string): Promise<PageSummary | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);
    const h1 = $('h1').first().text().trim();
    const hs: string[] = [];
    $('h2, h3').slice(0, 6).each((_, el) => { hs.push($(el).text().trim()); });
    const imgs: Array<{ src: string; alt: string }> = [];
    $('img').slice(0, 5).each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || '';
      if (src) imgs.push({ src: resolveUrl(url, src), alt: $(el).attr('alt') || '' });
    });
    const forms: Array<{ action: string; method: string; inputs: string[] }> = [];
    $('form').each((_, form) => {
      const inputs: string[] = [];
      $(form).find('input, select, textarea').each((_, input) => {
        inputs.push($(input).attr('name') || $(input).attr('type') || '');
      });
      forms.push({ action: $(form).attr('action') || '', method: $(form).attr('method') || 'GET', inputs });
    });
    return {
      url, title: $('title').text().trim() || '', h1,
      headings: hs.join(' | '),
      content: $('body').text().replace(/\s+/g, ' ').trim().substring(0, 1000),
      images: imgs, forms,
    };
  } catch {
    return null;
  }
}

export async function scrapeMultiplePages(baseUrl: string): Promise<MultiPageData> {
  const homepage = await scrapeWebsite(baseUrl);
  const pageUrls = pickRepresentativePages(homepage.links);
  const pages = (await Promise.all(pageUrls.map(u => scrapePageSummary(u)))).filter(Boolean) as PageSummary[];
  return { homepage, pages };
}

export async function closeBrowser(): Promise<void> {}
