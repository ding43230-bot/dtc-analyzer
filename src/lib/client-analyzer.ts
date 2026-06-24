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

    // Extract system message and user messages (Anthropic format)
    const systemMsg = messages.find(m => m.role === 'system')?.content || '';
    const userMsgs = messages.filter(m => m.role !== 'system').map(m => ({
      role: m.role,
      content: m.content,
    }));

    const res = await fetch(`${apiBase}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 8000,
        system: systemMsg,
        messages: userMsgs,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('MiMo API error:', res.status, errText.substring(0, 200));
      return '';
    }

    const data = await res.json();
    // Anthropic format: content is an array of blocks
    const textBlock = data.content?.find((b: any) => b.type === 'text');
    return textBlock?.text || '';
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

  const JSON_FORMAT = `直接返回JSON，不要推理过程，不要代码块标记。格式: {"score":0-100,"summary":"综合评语(50-100字)","checks":[{"label":"","score":0-100,"feedback":"","suggestion":"","evidence":{"pageUrl":"","location":"","selector":""}}],"issues":[],"suggestions":[]}`;
  const ANALYSIS_RULES = `你正在分析的数据包含首页和多个子页面（产品页、集合页、关于页等），请综合所有页面给出分析，不要只看首页。根据网站实际情况如实评估，发现了几个问题就写几个checks，有几条建议就写几条suggestions，不要凑数也不要遗漏。`;

  const [uiux, seo, ads, email, tech, brand] = await Promise.all([
    analyzeCategory(
      `你是资深UI/UX设计总监。分析要深入、专业、可执行。${SCORING_RUBRIC}\n${EVIDENCE_INSTRUCTION}`,
      `${ANALYSIS_RULES}\n\n对以下DTC品牌网站进行UI/UX深度诊断：\n\n${summary}\n\n分析：首屏设计、视觉层级、导航体验、响应式设计、加载性能、CTA设计、表单体验、信任设计。${JSON_FORMAT}`
    ),
    analyzeCategory(
      `你是资深SEO总监。分析要基于数据，给出具体技术建议。${SCORING_RUBRIC}\n${EVIDENCE_INSTRUCTION}`,
      `${ANALYSIS_RULES}\n\n对以下DTC品牌网站进行SEO/GEO深度诊断：\n\n${summary}\n\n分析：Meta标签、标题层级、内容质量、结构化数据、图片SEO、内部链接、GEO优化、移动端SEO。${JSON_FORMAT}`
    ),
    analyzeCategory(
      `你是资深广告转化优化总监。分析要基于CRO最佳实践。${SCORING_RUBRIC}\n${EVIDENCE_INSTRUCTION}`,
      `${ANALYSIS_RULES}\n\n对以下DTC品牌网站进行广告转化深度诊断：\n\n${summary}\n\n分析：价值主张、CTA设计、信任元素、社会证明、产品展示、转化路径、定价策略、结账体验。${JSON_FORMAT}`
    ),
    analyzeCategory(
      `你是资深邮件营销总监。分析要基于DTC邮件营销最佳实践。${SCORING_RUBRIC}\n${EVIDENCE_INSTRUCTION}`,
      `${ANALYSIS_RULES}\n\n对以下DTC品牌网站进行邮件营销深度诊断：\n\n${summary}\n\n分析：邮箱捕获入口、订阅激励、线索捕获机制、邮件自动化、个性化能力、合规性、多渠道协同、生命周期营销。${JSON_FORMAT}`
    ),
    analyzeCategory(
      `你是资深前端性能工程师与安全审计专家。分析要基于Web Vitals最佳实践和安全标准。${SCORING_RUBRIC}\n${EVIDENCE_INSTRUCTION}`,
      `${ANALYSIS_RULES}\n\n对以下DTC品牌网站进行技术性能深度诊断：\n\n${summary}\n\n分析：页面加载速度与性能、移动端适配质量、HTTPS与安全配置、技术栈与框架分析、可访问性(WCAG)、Core Web Vitals指标、CDN与缓存策略、代码质量与压缩。${JSON_FORMAT}`
    ),
    analyzeCategory(
      `你是品牌战略总监与视觉叙事专家。分析要基于品牌建设和情感营销理论。${SCORING_RUBRIC}\n${EVIDENCE_INSTRUCTION}`,
      `${ANALYSIS_RULES}\n\n对以下DTC品牌网站进行品牌故事深度诊断：\n\n${summary}\n\n分析：About Us品牌故事质量、品牌调性与语言风格一致性、视觉设计层次与留白运用、信任背书元素(媒体/奖项/认证)、品牌情感连接度、品牌差异化定位清晰度、创始人故事与使命传达、用户社区与UGC展示。${JSON_FORMAT}`
    ),
  ]);

  return {
    uiux, seo, ads, email, tech, brand,
    scores: {
      uiux: uiux.score, seo: seo.score, ads: ads.score, email: email.score, tech: tech.score, brand: brand.score,
      overall: Math.round((uiux.score + seo.score + ads.score + email.score + tech.score + brand.score) / 6),
    },
  };
}
