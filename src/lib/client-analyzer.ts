// Client-side AI analyzer - calls proxy endpoint, runs analysis logic in browser

interface PageSummary {
  url: string;
  title: string;
  h1: string;
  headings: string;
  content: string;
  images: Array<{ src: string; alt: string }>;
  forms: Array<{ action: string; method: string; inputs: string[] }>;
}

interface ScrapedData {
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
  structuredData: any[];
  forms: Array<{ action: string; method: string; inputs: string[] }>;
  scripts: string[];
}

interface AICheckItem {
  label: string;
  score: number;
  feedback: string;
  suggestion: string;
  evidence?: {
    pageUrl: string;
    location: string;
    selector?: string;
  };
}

export interface AICategoryResult {
  score: number;
  summary: string;
  checks: AICheckItem[];
  issues: string[];
  suggestions: string[];
}

export interface FullAIAnalysis {
  uiux: AICategoryResult;
  seo: AICategoryResult;
  ads: AICategoryResult;
  email: AICategoryResult;
  tech: AICategoryResult;
  brand: AICategoryResult;
  scores: { uiux: number; seo: number; ads: number; email: number; tech: number; brand: number; overall: number };
}

const SCORING_RUBRIC = `评分: 0-20极差, 21-40较差, 41-60一般, 61-80良好, 81-100优秀。`;

function buildScrapedDataSummary(data: ScrapedData, pages?: PageSummary[]): string {
  const headings = data.headings || [];
  const images = data.images || [];
  const links = data.links || [];
  const forms = data.forms || [];
  const scripts = data.scripts || [];
  const structuredData = data.structuredData || [];
  const metaTags = data.metaTags || {};

  const h1s = headings.filter(h => h.level === 1).map(h => h.text);
  const h2s = headings.filter(h => h.level === 2).map(h => h.text).slice(0, 8);
  const imagesWithoutAlt = images.filter(i => !i.alt).length;
  const internalLinks = links.filter(l => !l.isExternal);
  const externalLinks = links.filter(l => l.isExternal);
  const emailInputs = forms.some(f => (f.inputs || []).some(i => (i || '').toLowerCase().includes('email')));

  let summary = `
=== 首页 ===
URL: ${data.url}
标题: ${data.title || '无'}
Meta描述: ${data.description || '无'}
H1(${h1s.length}): ${h1s.join(' | ') || '无'}
H2(${h2s.length}): ${h2s.join(' | ') || '无'}
图片: ${images.length}张(无alt: ${imagesWithoutAlt}张)
内部链接: ${internalLinks.length}个, 外部链接: ${externalLinks.length}个
表单: ${forms.length}个, 邮箱输入: ${emailInputs ? '有' : '无'}
主要链接(前10): ${links.slice(0, 10).map(l => `${l.text || '(无文字)'} -> ${l.href}`).join('\n  ')}
内容(前800字): ${data.content.substring(0, 800)}`;

  if (pages && pages.length > 0) {
    for (const p of pages) {
      const emailInPage = p.forms.some(f => f.inputs.some(i => i.toLowerCase().includes('email')));
      summary += `

=== 子页面: ${p.url === data.url ? '首页' : new URL(p.url).pathname} ===
URL: ${p.url}
标题: ${p.title || '无'}
H1: ${p.h1 || '无'}
图片: ${p.images.length}张, 表单: ${p.forms.length}个
内容(前300字): ${p.content.substring(0, 300)}`;
    }
  }

  return summary.trim();
}

async function callProxy(messages: Array<{role: string; content: string}>): Promise<string> {
  try {
    // 走服务端代理，避免 CORS 问题
    const res = await fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, max_tokens: 8000 }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('Proxy error:', res.status, errText.substring(0, 300));
      return '';
    }

    const data = await res.json();

    // 代理返回 OpenAI 兼容格式
    if (data.choices?.[0]?.message?.content) {
      return data.choices[0].message.content;
    }

    // 兼容 Anthropic 原始格式
    if (data.content) {
      const textBlock = data.content.find((b: any) => b.type === 'text');
      return textBlock?.text || '';
    }

    console.error('Unexpected response format:', JSON.stringify(data).substring(0, 300));
    return '';
  } catch (e: any) {
    console.error('API call failed:', e?.message);
    return '';
  }
}

function repairJSON(str: string): string {
  const codeBlockMatch = str.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) str = codeBlockMatch[1].trim();
  const jsonMatch = str.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return str;
  let json = jsonMatch[0];
  let inString = false, escapeNext = false, stack: string[] = [];
  for (let i = 0; i < json.length; i++) {
    const c = json[i];
    if (escapeNext) { escapeNext = false; continue; }
    if (c === '\\' && inString) { escapeNext = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (c === '{' || c === '[') stack.push(c);
    else if (c === '}') { if (stack[stack.length-1] === '{') stack.pop(); }
    else if (c === ']') { if (stack[stack.length-1] === '[') stack.pop(); }
  }
  // Handle truncation: close unclosed strings, arrays, objects
  if (inString) {
    // Check if we're mid-value after a colon — likely truncated
    const lastColon = json.lastIndexOf(':');
    const lastQuote = json.lastIndexOf('"');
    if (lastColon > lastQuote) {
      // We're in a value string that was truncated — close it
      json += '"';
    }
  }
  while (stack.length > 0) { const l = stack.pop(); json += l === '[' ? ']' : '}'; }
  json = json.replace(/,\s*([\]}])/g, '$1');
  // Also handle trailing comma + truncated value
  json = json.replace(/:\s*"([^"]*)$/, ':"$1"');
  return json;
}

function parseAIResponse(raw: string): AICategoryResult {
  if (!raw || raw.trim().length === 0) {
    console.error('AI returned empty response');
    return { score: 50, summary: 'AI返回空响应', checks: [], issues: ['AI未返回有效内容'], suggestions: [] };
  }

  // 多次尝试解析
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const repaired = attempt === 0 ? repairJSON(raw) : repairJSON(raw.replace(/,\s*$/, ''));
      const parsed = JSON.parse(repaired);
      if (typeof parsed.score === 'number') {
        const checks = (parsed.checks || []).map((c: any) => ({
          label: c.label || '',
          score: Math.min(100, Math.max(0, c.score || 0)),
          feedback: c.feedback || '',
          suggestion: c.suggestion || '',
          ...(c.evidence ? {
            evidence: {
              pageUrl: c.evidence.pageUrl || '',
              location: c.evidence.location || '',
              selector: c.evidence.selector || '',
            }
          } : {}),
        }));
        let suggestions = parsed.suggestions || [];
        // 如果suggestions为空，从checks的suggestion字段提取
        if (suggestions.length === 0) {
          suggestions = checks.filter((c: any) => c.suggestion).map((c: any) => c.suggestion);
        }
        return {
          score: Math.min(100, Math.max(0, parsed.score || 0)),
          summary: parsed.summary || '',
          checks,
          issues: parsed.issues || [],
          suggestions,
        };
      }
    } catch (e) {
      if (attempt === 2) {
        console.error('AI response parse failed after 3 attempts. Raw (first 500):', raw.substring(0, 500));
      }
    }
  }

  // Fallback: try to extract data from raw text
  const scoreMatch = raw.match(/"score"\s*:\s*(\d+)/);
  const summaryMatch = raw.match(/"summary"\s*:\s*"([^"]*)"/);

  // Try to extract checks from raw text
  const checkMatches = [...raw.matchAll(/"label"\s*:\s*"([^"]*)"[^}]*?"score"\s*:\s*(\d+)[^}]*?"feedback"\s*:\s*"([^"]*)"/g)];
  const checks = checkMatches.map(m => ({
    label: m[1] || '',
    score: Math.min(100, Math.max(0, parseInt(m[2]) || 0)),
    feedback: m[3] || '',
    suggestion: '',
  }));

  // Try to extract issues
  const issueMatches = [...raw.matchAll(/"issues"\s*:\s*\[([^\]]*)\]/g)];
  const issues: string[] = [];
  if (issueMatches.length > 0) {
    const issueStr = issueMatches[0][1];
    const issueItems = issueStr.match(/"([^"]*)"/g);
    if (issueItems) issues.push(...issueItems.map(s => s.replace(/"/g, '')));
  }

  return {
    score: scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[1]))) : 50,
    summary: summaryMatch ? summaryMatch[1] : '分析结果解析失败，请重试',
    checks: checks.length > 0 ? checks : [],
    issues: issues.length > 0 ? issues : ['无法解析AI分析结果'],
    suggestions: [],
  };
}

const EVIDENCE_INSTRUCTION = `evidence要求: pageUrl用具体内链(非首页), location用中文描述位置, selector用CSS选择器。`;

async function analyzeCategory(systemPrompt: string, userPrompt: string): Promise<AICategoryResult> {
  try {
    const raw = await callProxy([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);
    return parseAIResponse(raw);
  } catch (e: any) {
    console.error('analyzeCategory failed:', e?.message);
    return { score: 50, summary: '分析失败: ' + (e?.message || '未知错误'), checks: [], issues: ['API调用失败'], suggestions: [] };
  }
}

export async function runClientAnalysis(data: ScrapedData, pages?: PageSummary[]): Promise<FullAIAnalysis> {
  const summary = buildScrapedDataSummary(data, pages);

  const JSON_FORMAT = `【重要】不要thinking，直接输出JSON。格式: {"score":0-100,"summary":"评语","checks":[{"label":"","score":0-100,"feedback":"","suggestion":"","evidence":{"pageUrl":"","location":"","selector":""}}],"issues":[],"suggestions":[]}`;
  const ANALYSIS_RULES = `综合所有页面分析，如实评估，发现问题就写checks，有建议就写suggestions。`;

  const uiux = await analyzeCategory(
    `你是UI/UX设计总监。${SCORING_RUBRIC} ${EVIDENCE_INSTRUCTION}`,
    `${ANALYSIS_RULES}\n\nDTC品牌网站UI/UX诊断：\n\n${summary}\n\n分析：首屏设计、视觉层级、导航、响应式、加载、CTA、表单、信任。${JSON_FORMAT}`
  );
  const seo = await analyzeCategory(
    `你是SEO总监。${SCORING_RUBRIC} ${EVIDENCE_INSTRUCTION}`,
    `${ANALYSIS_RULES}\n\nDTC品牌网站SEO诊断：\n\n${summary}\n\n分析：Meta标签、标题层级、内容、结构化数据、图片SEO、内部链接、GEO、移动端SEO。${JSON_FORMAT}`
  );
  const ads = await analyzeCategory(
    `你是广告转化优化总监。${SCORING_RUBRIC} ${EVIDENCE_INSTRUCTION}`,
    `${ANALYSIS_RULES}\n\nDTC品牌网站广告转化诊断：\n\n${summary}\n\n分析：价值主张、CTA、信任元素、社会证明、产品展示、转化路径、定价、结账。${JSON_FORMAT}`
  );
  const email = await analyzeCategory(
    `你是邮件营销总监。${SCORING_RUBRIC} ${EVIDENCE_INSTRUCTION}`,
    `${ANALYSIS_RULES}\n\nDTC品牌网站邮件营销诊断：\n\n${summary}\n\n分析：邮箱捕获、订阅激励、线索机制、自动化、个性化、合规性、多渠道、生命周期。${JSON_FORMAT}`
  );
  const tech = await analyzeCategory(
    `你是前端性能工程师。${SCORING_RUBRIC} ${EVIDENCE_INSTRUCTION}`,
    `${ANALYSIS_RULES}\n\nDTC品牌网站技术性能诊断：\n\n${summary}\n\n分析：加载速度、移动端、HTTPS安全、技术栈、可访问性、Core Web Vitals、CDN缓存、代码质量。${JSON_FORMAT}`
  );
  const brand = await analyzeCategory(
    `你是品牌战略总监。${SCORING_RUBRIC} ${EVIDENCE_INSTRUCTION}`,
    `${ANALYSIS_RULES}\n\nDTC品牌网站品牌故事诊断：\n\n${summary}\n\n分析：品牌故事、调性一致性、视觉留白、信任背书、情感连接、差异化定位、创始人使命、UGC。${JSON_FORMAT}`
  );

  return {
    uiux, seo, ads, email, tech, brand,
    scores: {
      uiux: uiux.score, seo: seo.score, ads: ads.score, email: email.score, tech: tech.score, brand: brand.score,
      overall: Math.round((uiux.score + seo.score + ads.score + email.score + tech.score + brand.score) / 6),
    },
  };
}
