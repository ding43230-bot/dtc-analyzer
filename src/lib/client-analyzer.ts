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
  scores: { uiux: number; seo: number; ads: number; email: number; overall: number };
}

const SCORING_RUBRIC = `
## 评分标准（必须严格遵守）
每个检查项和综合评分必须按照以下标准打分：
| 分数段 | 等级 | 含义 |
|--------|------|------|
| 0-20 | 极差 | 该能力几乎缺失 |
| 21-40 | 较差 | 严重不足 |
| 41-60 | 一般 | 基础水平 |
| 61-80 | 良好 | 达到行业标准 |
| 81-100 | 优秀 | 超越行业水平 |
`;

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
加载时间: ${data.loadTime}ms
Viewport: ${metaTags.viewport ? '已配置' : '缺失'}
OG标签: ${metaTags.ogTitle ? '已配置' : '缺失'}
结构化数据: ${structuredData.length > 0 ? '已配置(' + structuredData.length + '项)' : '缺失'}
H1(${h1s.length}): ${h1s.join(' | ') || '无'}
H2(${h2s.length}): ${h2s.join(' | ') || '无'}
图片: ${images.length}张(无alt: ${imagesWithoutAlt}张)
内部链接: ${internalLinks.length}个, 外部链接: ${externalLinks.length}个
表单: ${forms.length}个, 邮箱输入: ${emailInputs ? '有' : '无'}
主要链接(前15): ${links.slice(0, 15).map(l => `${l.text || '(无文字)'} -> ${l.href}`).join('\n  ')}
主要图片(前5): ${images.slice(0, 5).map(i => `src=${i.src}, alt=${i.alt || '(无alt)'}`).join('\n  ')}
内容(前1500字): ${data.content.substring(0, 1500)}`;

  if (pages && pages.length > 0) {
    for (const p of pages) {
      const emailInPage = p.forms.some(f => f.inputs.some(i => i.toLowerCase().includes('email')));
      summary += `

=== 子页面: ${p.url === data.url ? '首页' : new URL(p.url).pathname} ===
URL: ${p.url}
标题: ${p.title || '无'}
H1: ${p.h1 || '无'}
H2/H3: ${p.headings || '无'}
图片: ${p.images.length}张, 表单: ${p.forms.length}个, 邮箱输入: ${emailInPage ? '有' : '无'}
内容(前500字): ${p.content.substring(0, 500)}`;
    }
  }

  return summary.trim();
}

async function callProxy(messages: Array<{role: string; content: string}>): Promise<string> {
  try {
    const apiBase = process.env.NEXT_PUBLIC_MIMO_API_BASE;
    const apiKey = process.env.NEXT_PUBLIC_MIMO_API_KEY;
    const model = process.env.NEXT_PUBLIC_MIMO_MODEL || 'mimo-v2.5-pro';

    const res = await fetch(`${apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
        max_tokens: 8000,
      }),
    });
    if (!res.ok) {
      console.error('MiMo API error:', res.status);
      return '';
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
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
  try {
    const repaired = repairJSON(raw);
    const parsed = JSON.parse(repaired);
    return {
      score: Math.min(100, Math.max(0, parsed.score || 0)),
      summary: parsed.summary || '',
      checks: (parsed.checks || []).map((c: any) => ({
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
      })),
      issues: parsed.issues || [],
      suggestions: parsed.suggestions || [],
    };
  } catch (e) {
    console.error('AI response parse failed. Raw (first 500):', raw.substring(0, 500));
    // Fallback: try to extract score from raw text
    const scoreMatch = raw.match(/"score"\s*:\s*(\d+)/);
    const summaryMatch = raw.match(/"summary"\s*:\s*"([^"]*)"/);
    return {
      score: scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[1]))) : 50,
      summary: summaryMatch ? summaryMatch[1] : '分析结果解析失败，请重试',
      checks: [],
      issues: ['无法解析AI分析结果'],
      suggestions: [],
    };
  }
}

const EVIDENCE_INSTRUCTION = `证据要求（必须严格遵守）：
- pageUrl：必须使用"主要链接"中列出的具体内链URL，禁止全部使用首页URL。例如：产品相关问题→用产品详情页链接，导航问题→用首页，表单/订阅问题→用包含表单的页面链接。不同检查项应指向不同页面，体现问题的具体位置。
- location：中文描述问题位置，如"产品详情页-购买按钮"、"页脚Newsletter表单"、"集合页-筛选器"。
- selector：CSS选择器，用于在页面上高亮问题元素。例如"nav .menu-toggle"、"footer input[type='email']"、".product-card .add-to-cart"、"#hero .cta-button"。选择器要具体到能定位到唯一元素。
- 禁止所有checks的pageUrl都相同。每个check必须指向最相关的具体页面。`;

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

  const [uiux, seo, ads, email] = await Promise.all([
    analyzeCategory(
      `你是资深UI/UX设计总监。分析要深入、专业、可执行。${SCORING_RUBRIC}\n${EVIDENCE_INSTRUCTION}`,
      `对以下DTC品牌网站进行UI/UX深度诊断：\n\n${summary}\n\n分析：首屏设计、视觉层级、导航体验、响应式设计、加载性能、CTA设计、表单体验、信任设计。返回JSON: {"score":0-100,"summary":"一句话","checks":[{"label":"","score":0-100,"feedback":"","suggestion":"","evidence":{"pageUrl":"","location":"","selector":""}}],"issues":[],"suggestions":[]}。checks必须8项。`
    ),
    analyzeCategory(
      `你是资深SEO总监。分析要基于数据，给出具体技术建议。${SCORING_RUBRIC}\n${EVIDENCE_INSTRUCTION}`,
      `对以下DTC品牌网站进行SEO/GEO深度诊断：\n\n${summary}\n\n分析：Meta标签、标题层级、内容质量、结构化数据、图片SEO、内部链接、GEO优化、移动端SEO。返回JSON: {"score":0-100,"summary":"一句话","checks":[{"label":"","score":0-100,"feedback":"","suggestion":"","evidence":{"pageUrl":"","location":"","selector":""}}],"issues":[],"suggestions":[]}。checks必须8项。`
    ),
    analyzeCategory(
      `你是资深广告转化优化总监。分析要基于CRO最佳实践。${SCORING_RUBRIC}\n${EVIDENCE_INSTRUCTION}`,
      `对以下DTC品牌网站进行广告转化深度诊断：\n\n${summary}\n\n分析：价值主张、CTA设计、信任元素、社会证明、产品展示、转化路径、定价策略、结账体验。返回JSON: {"score":0-100,"summary":"一句话","checks":[{"label":"","score":0-100,"feedback":"","suggestion":"","evidence":{"pageUrl":"","location":"","selector":""}}],"issues":[],"suggestions":[]}。checks必须8项。`
    ),
    analyzeCategory(
      `你是资深邮件营销总监。分析要基于DTC邮件营销最佳实践。${SCORING_RUBRIC}\n${EVIDENCE_INSTRUCTION}`,
      `对以下DTC品牌网站进行邮件营销深度诊断：\n\n${summary}\n\n分析：邮箱捕获入口、订阅激励、线索捕获机制、邮件自动化、个性化能力、合规性、多渠道协同、生命周期营销。返回JSON: {"score":0-100,"summary":"一句话","checks":[{"label":"","score":0-100,"feedback":"","suggestion":"","evidence":{"pageUrl":"","location":"","selector":""}}],"issues":[],"suggestions":[]}。checks必须6-8项。`
    ),
  ]);

  return {
    uiux, seo, ads, email,
    scores: {
      uiux: uiux.score, seo: seo.score, ads: ads.score, email: email.score,
      overall: Math.round((uiux.score + seo.score + ads.score + email.score) / 4),
    },
  };
}
