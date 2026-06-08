import OpenAI from 'openai';
import { ScrapedData } from './scraper';

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.MIMO_API_KEY,
      baseURL: process.env.MIMO_API_BASE,
    });
  }
  return _client;
}

const MODEL = process.env.MIMO_MODEL || 'mimo-v2.5-pro';

interface AICheckItem {
  label: string;
  score: number;
  feedback: string;
  suggestion: string;
}

interface AICategoryResult {
  score: number;
  summary: string;
  checks: AICheckItem[];
  issues: string[];
  suggestions: string[];
}

// 统一评分标准（所有板块共用）
const SCORING_RUBRIC = `
## 评分标准（必须严格遵守）

每个检查项和综合评分必须按照以下标准打分：

| 分数段 | 等级 | 含义 | 判断依据 |
|--------|------|------|----------|
| 0-20 | 极差 | 该能力几乎缺失 | 完全没有相关元素，或存在严重错误 |
| 21-40 | 较差 | 严重不足 | 有基本框架但存在大量问题，远低于行业标准 |
| 41-60 | 一般 | 基础水平 | 有基本功能但存在明显缺陷，需要改进 |
| 61-80 | 良好 | 达到行业标准 | 基本功能完善，有小幅优化空间 |
| 81-100 | 优秀 | 超越行业水平 | 表现突出，可作为行业标杆 |

### 各板块评分锚点（参考基准）

**UI/UX：**
- 0-20：无响应式、无CTA、加载>5s、无导航
- 21-40：有基本布局但移动端体验差、CTA不明显、加载3-5s
- 41-60：响应式基本可用、有CTA但不突出、加载2-3s
- 61-80：响应式良好、CTA清晰、加载<2s、导航合理
- 81-100：像素级完美、交互流畅、加载<1s、无障碍达标

**SEO/GEO：**
- 0-20：无Title/Description、无H1、无结构化数据
- 21-40：Title/Description不完整、H1缺失或多个、无Schema
- 41-60：Meta基本完整、H1唯一但内容一般、有基础Schema
- 61-80：Meta优化良好、标题层级清晰、有Schema、有内部链接
- 81-100：Meta精准优化、E-E-A-T信号强、Schema完整、GEO就绪

**广告转化：**
- 0-20：无价值主张、无CTA、无信任元素
- 21-40：价值主张模糊、CTA弱、缺少社会证明
- 41-60：有价值主张但不突出、CTA基本可用、有部分信任元素
- 61-80：价值主张清晰、CTA醒目、信任元素完整、转化路径顺畅
- 81-100：价值主张极具说服力、CTA转化率高、全链路信任闭环

**邮件营销：**
- 0-20：无订阅入口、无邮件捕获机制
- 21-40：有订阅框但位置隐蔽、无Lead Magnet
- 41-60：有订阅入口和基础激励、有表单但无自动化
- 61-80：订阅入口明显、有Lead Magnet、有基础自动化序列
- 81-100：多渠道捕获、个性化推荐、完整生命周期自动化
`;

function buildScrapedDataSummary(data: ScrapedData): string {
  const headings = data.headings || [];
  const images = data.images || [];
  const links = data.links || [];
  const forms = data.forms || [];
  const scripts = data.scripts || [];
  const structuredData = data.structuredData || [];
  const metaTags = data.metaTags || {};

  const h1s = headings.filter(h => h.level === 1).map(h => h.text);
  const h2s = headings.filter(h => h.level === 2).map(h => h.text).slice(0, 8);
  const h3s = headings.filter(h => h.level === 3).map(h => h.text).slice(0, 8);
  const imagesWithoutAlt = images.filter(i => !i.alt).length;
  const internalLinks = links.filter(l => !l.isExternal);
  const externalLinks = links.filter(l => l.isExternal);
  const emailInputs = forms.some(f => (f.inputs || []).some(i => (i || '').toLowerCase().includes('email')));
  const hasViewport = !!metaTags.viewport;
  const hasOg = !!metaTags.ogTitle;
  const hasSchema = structuredData.length > 0;

  return `
# 网站爬取数据

## 基本信息
- URL: ${data.url}
- 标题: ${data.title || '无'}
- Meta描述: ${data.description || '无'}
- 关键词: ${data.keywords || '无'}
- 加载时间: ${data.loadTime}ms

## Meta标签状态
- Viewport: ${hasViewport ? '✅ 已配置' : '❌ 缺失'}
- OG标签: ${hasOg ? '✅ 已配置' : '❌ 缺失'}
- 结构化数据: ${hasSchema ? '✅ 已配置（' + structuredData.length + '项）' : '❌ 缺失'}

## 页面结构
- H1标签（${h1s.length}个）: ${h1s.join(' | ') || '无'}
- H2标签（${h2s.length}个）: ${h2s.join(' | ') || '无'}
- H3标签（${h3s.length}个）: ${h3s.join(' | ') || '无'}
- 图片: ${images.length}张（有alt: ${images.filter(i => i.alt).length}张，无alt: ${imagesWithoutAlt}张）
- 内部链接: ${internalLinks.length}个
- 外部链接: ${externalLinks.length}个
- 表单: ${forms.length}个
- 邮箱输入框: ${emailInputs ? '有' : '无'}

## 页面内容（前1500字）
${data.content.substring(0, 1500)}

## 脚本引用（前10个）
${scripts.slice(0, 10).join('\n') || '无'}

## 表单详情
${forms.map((f, i) => `表单${i + 1}: inputs=[${(f.inputs || []).join(', ')}]`).join('\n') || '无表单'}
`.trim();
}

async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const maxRetries = 1;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await getClient().chat.completions.create({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 2500,
      });
      const content = response.choices[0]?.message?.content || '';
      console.log(`AI response (attempt ${attempt + 1}), length: ${content.length}`);

      if (content.length > 0) {
        return content;
      }

      if (attempt < maxRetries) {
        console.log('Empty response, retrying...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`AI call failed (attempt ${attempt + 1}):`, error);
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  return '';
}

function repairJSON(str: string): string {
  // Remove markdown code block markers if present
  const codeBlockMatch = str.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    str = codeBlockMatch[1].trim();
  }

  // Extract the JSON object
  const jsonMatch = str.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return str;

  let json = jsonMatch[0];

  // Fix truncated JSON - close open strings, arrays, and objects
  let inString = false;
  let escapeNext = false;
  let stack: string[] = [];

  for (let i = 0; i < json.length; i++) {
    const char = json[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\' && inString) {
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === '{' || char === '[') {
      stack.push(char);
    } else if (char === '}') {
      if (stack.length > 0 && stack[stack.length - 1] === '{') {
        stack.pop();
      }
    } else if (char === ']') {
      if (stack.length > 0 && stack[stack.length - 1] === '[') {
        stack.pop();
      }
    }
  }

  // If we're in a string at the end, close it
  if (inString) {
    json += '"';
  }

  // Close any remaining open brackets/braces
  while (stack.length > 0) {
    const last = stack.pop();
    if (last === '[') {
      json += ']';
    } else if (last === '{') {
      json += '}';
    }
  }

  // Fix trailing commas before closing brackets
  json = json.replace(/,\s*([\]}])/g, '$1');

  return json;
}

function parseAIResponse(raw: string): AICategoryResult {
  try {
    console.log('AI raw response (first 500 chars):', raw.substring(0, 500));

    // Try to repair and parse the JSON
    const repairedJson = repairJSON(raw);
    const parsed = JSON.parse(repairedJson);
    console.log('Parsed successfully:', JSON.stringify(parsed).substring(0, 300));
    const checks = (parsed.checks || []).map((c: any) => ({
      label: c.label || '',
      score: Math.min(100, Math.max(0, c.score || 0)),
      feedback: c.feedback || '',
      suggestion: c.suggestion || '',
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
  } catch (e) {
    console.error('Failed to parse AI response:', e);
  }
  return { score: 50, summary: '分析结果解析失败', checks: [], issues: ['无法解析AI分析结果'], suggestions: [] };
}

// ═══════════════════════════════════════════════════
// UI/UX 专家 Agent — 对标 UI Designer + UX Architect + UX Researcher
// ═══════════════════════════════════════════════════

export async function analyzeUIUX(data: ScrapedData): Promise<AICategoryResult> {
  const systemPrompt = `你是资深UI/UX设计总监（12年经验），精通：视觉层级（F型/Z型阅读）、响应式设计（mobile-first、触控44px+）、无障碍（WCAG 2.1 AA）、信息架构、交互设计、性能感知、用户行为分析（Nielsen启发式）。分析要深入、专业、可执行。
${SCORING_RUBRIC}`;

  const userPrompt = `请以 UI/UX 设计总监的视角，对以下 DTC 品牌网站进行深度诊断：

${buildScrapedDataSummary(data)}

分析维度（每个都要深入评估）：

1. **首屏设计（Above the Fold）**
   - 价值主张是否在3秒内传达清楚
   - 首屏CTA是否醒目、位置是否合理
   - 首屏信息密度是否合适

2. **视觉层级**
   - 标题/正文/辅助文字的字号层级是否清晰
   - 颜色对比度是否达到WCAG标准
   - 留白是否充足，内容是否拥挤

3. **导航体验**
   - 主导航结构是否清晰（不超过7±2项）
   - 移动端汉堡菜单是否易用
   - 用户能否在3次点击内找到目标

4. **响应式设计**
   - Viewport配置是否正确
   - 移动端触控目标是否≥44px
   - 文字在移动端是否≥16px

5. **加载性能**
   - 页面加载时间是否<3秒
   - 图片是否做了懒加载和格式优化
   - 是否有骨架屏或加载状态

6. **CTA设计**
   - CTA按钮颜色对比度是否足够
   - CTA文案是否有行动力
   - CTA位置是否符合F型阅读模式

7. **表单体验**
   - 表单字段是否精简
   - 错误提示是否清晰
   - 是否有自动填充支持

8. **信任设计**
   - 是否有社会证明（评价、案例、数字）
   - 安全标识是否可见
   - 品牌一致性是否贯穿全站

请以 JSON 格式返回（不要包含其他文字）：
{
  "score": 0-100综合评分,
  "summary": "一句话总结（20字内）",
  "checks": [
    {"label": "检查项", "score": 0-100, "feedback": "专业分析（通俗语言+专业术语，50-100字）", "suggestion": "具体可执行的改进建议（30-60字）"}
  ],
  "issues": ["问题1", "问题2", "问题3"],
  "suggestions": ["建议1", "建议2", "建议3", "建议4", "建议5"]
}

根据网站实际情况如实评估，发现了几个问题就写几个checks，有几条建议就写几条suggestions，不要凑数也不要遗漏。`;

  const raw = await callAI(systemPrompt, userPrompt);
  return parseAIResponse(raw);
}

// ═══════════════════════════════════════════════════
// SEO/GEO 专家 Agent — 对标 SEO Specialist
// ═══════════════════════════════════════════════════

export async function analyzeSEO(data: ScrapedData): Promise<AICategoryResult> {
  const systemPrompt = `你是资深SEO总监（10年经验），精通：技术SEO（Core Web Vitals、Schema.org、Canonical）、页面SEO（Title 50-60字符、Description 150-160字符、H1唯一）、内容SEO（E-E-A-T、关键词分布）、GEO优化（AI搜索引擎可见性、FAQ内容）、图片SEO、内部链接策略。分析要基于数据，给出具体技术建议。
${SCORING_RUBRIC}`;

  const userPrompt = `请以 SEO 总监的视角，对以下 DTC 品牌网站进行深度诊断：

${buildScrapedDataSummary(data)}

分析维度（每个都要深入评估）：

1. **Meta标签优化**
   - Title是否50-60字符、含品牌词+核心关键词
   - Description是否150-160字符、含CTA
   - Keywords是否相关（虽然权重低但仍需配置）

2. **标题层级结构**
   - H1是否唯一且包含核心关键词
   - H2-H6是否逻辑递进
   - 是否存在跳级（如H1直接到H3）

3. **内容质量**
   - 内容字数是否充足（>1500字为佳）
   - 关键词分布是否自然
   - 是否有E-E-A-T信号（作者、来源、更新日期）

4. **结构化数据**
   - 是否有Schema.org标记
   - 是否有产品/评价/FAQ等富媒体标记
   - JSON-LD格式是否正确

5. **图片SEO**
   - 图片alt文本覆盖率
   - 图片格式是否为WebP/AVIF
   - 图片尺寸是否优化

6. **内部链接**
   - 内部链接数量是否充足（>10个）
   - 锚文本是否描述性
   - 重要页面是否在3次点击内可达

7. **GEO优化**
   - 是否有FAQ/问答内容
   - 是否有结构化的产品信息
   - 品牌实体是否清晰

8. **移动端SEO**
   - Viewport配置是否正确
   - 移动端加载速度
   - 是否有独立移动站或响应式

请以 JSON 格式返回（不要包含其他文字）：
{
  "score": 0-100综合评分,
  "summary": "一句话总结（20字内）",
  "checks": [
    {"label": "检查项", "score": 0-100, "feedback": "专业分析（通俗语言+专业术语，50-100字）", "suggestion": "具体可执行的改进建议（30-60字）"}
  ],
  "issues": ["问题1", "问题2", "问题3"],
  "suggestions": ["建议1", "建议2", "建议3", "建议4", "建议5"]
}

根据网站实际情况如实评估，发现了几个问题就写几个checks，有几条建议就写几条suggestions，不要凑数也不要遗漏。`;

  const raw = await callAI(systemPrompt, userPrompt);
  return parseAIResponse(raw);
}

// ═══════════════════════════════════════════════════
// 广告转化专家 Agent — 对标 PPC Campaign Strategist + Paid Media Auditor
// ═══════════════════════════════════════════════════

export async function analyzeAdsConversion(data: ScrapedData): Promise<AICategoryResult> {
  const systemPrompt = `你是资深广告转化优化总监（8年经验），精通：PPC落地页优化（质量得分、CRO）、转化漏斗分析、信任信号评估、DTC品牌转化（3秒法则、价值主张、定价心理学、弃购挽回、结账优化）。分析要基于数据驱动的CRO最佳实践。
${SCORING_RUBRIC}`;

  const userPrompt = `请以广告转化优化总监的视角，对以下 DTC 品牌网站进行深度诊断：

${buildScrapedDataSummary(data)}

分析维度（每个都要深入评估）：

1. **价值主张（Value Proposition）**
   - 首屏是否清晰传达"我是谁、做什么、为什么选我"
   - USP（独特卖点）是否突出
   - 是否有数据支撑（如"10万+用户"）

2. **CTA设计**
   - CTA按钮是否醒目（颜色对比、大小）
   - CTA文案是否有行动力（"立即购买"vs"了解更多"）
   - CTA位置是否在视觉焦点

3. **信任元素**
   - 是否有客户评价/评分
   - 是否有安全认证/保障标识
   - 是否有退款/退货政策

4. **社会证明**
   - 是否有客户案例/成功故事
   - 是否有合作伙伴/媒体提及
   - 是否有用户数量/销量数据

5. **产品展示**
   - 产品图片质量如何
   - 是否有视频/360°视图
   - 产品描述是否详细且有说服力

6. **转化路径**
   - 从首页到购买的步骤是否简洁
   - 是否有不必要的摩擦点
   - 是否有弃购挽回机制

7. **定价策略**
   - 价格展示是否清晰
   - 是否有锚定价格（原价/折扣价）
   - 是否有分期付款选项

8. **结账体验**
   - 是否支持Guest checkout
   - 支付方式是否多样
   - 是否有进度指示

请以 JSON 格式返回（不要包含其他文字）：
{
  "score": 0-100综合评分,
  "summary": "一句话总结（20字内）",
  "checks": [
    {"label": "检查项", "score": 0-100, "feedback": "专业分析（通俗语言+专业术语，50-100字）", "suggestion": "具体可执行的改进建议（30-60字）"}
  ],
  "issues": ["问题1", "问题2", "问题3"],
  "suggestions": ["建议1", "建议2", "建议3", "建议4", "建议5"]
}

根据网站实际情况如实评估，发现了几个问题就写几个checks，有几条建议就写几条suggestions，不要凑数也不要遗漏。`;

  const raw = await callAI(systemPrompt, userPrompt);
  return parseAIResponse(raw);
}

// ═══════════════════════════════════════════════════
// 邮件营销专家 Agent — 对标 Email Intelligence Engineer
// ═══════════════════════════════════════════════════

export async function analyzeEmailMarketing(data: ScrapedData): Promise<AICategoryResult> {
  const systemPrompt = `你是资深邮件营销总监（8年经验），精通Klaviyo/Mailchimp/ActiveCampaign，擅长：邮箱捕获（弹窗、Lead Magnet）、订阅激励（折扣、免费shipping）、邮件自动化（弃购挽回、复购提醒）、分群策略、生命周期营销、邮件与SMS协同。分析要基于DTC邮件营销最佳实践。
${SCORING_RUBRIC}`;

  const userPrompt = `请以邮件营销总监的视角，对以下 DTC 品牌网站进行深度诊断：

${buildScrapedDataSummary(data)}

分析维度（每个都要深入评估）：

1. **邮箱捕获入口**
   - 是否有明显的订阅入口（弹窗、页脚、侧边栏）
   - 订阅框设计是否吸引人
   - 是否有Lead Magnet（免费指南、折扣码）

2. **订阅激励**
   - 是否提供首单折扣
   - 是否有免费shipping承诺
   - 是否有独家内容/早鸟优惠

3. **线索捕获机制**
   - 是否有退出意图弹窗
   - 是否有滚动触发表单
   - 表单字段是否精简（仅邮箱即可）

4. **邮件自动化工具**
   - 是否检测到Klaviyo/Mailchimp等工具
   - 是否有邮件自动化脚本
   - 是否有再营销像素

5. **个性化能力**
   - 是否有产品推荐功能
   - 是否有浏览历史追踪
   - 是否有用户分群标识

6. **合规性**
   - 是否有隐私政策链接
   - 订阅是否有双重确认选项
   - 是否有退订链接

7. **多渠道协同**
   - 是否有SMS订阅选项
   - 是否有WhatsApp/微信订阅
   - 是否有社交媒体引导

8. **生命周期营销**
   - 是否有VIP/会员体系
   - 是否有复购激励
   - 是否有流失预警机制

请以 JSON 格式返回（不要包含其他文字）：
{
  "score": 0-100综合评分,
  "summary": "一句话总结（20字内）",
  "checks": [
    {"label": "检查项", "score": 0-100, "feedback": "专业分析（通俗语言+专业术语，50-100字）", "suggestion": "具体可执行的改进建议（30-60字）"}
  ],
  "issues": ["问题1", "问题2", "问题3"],
  "suggestions": ["建议1", "建议2", "建议3", "建议4", "建议5"]
}

根据网站实际情况如实评估，发现了几个问题就写几个checks，有几条建议就写几条suggestions，不要凑数也不要遗漏。`;

  const raw = await callAI(systemPrompt, userPrompt);
  return parseAIResponse(raw);
}

// ═══════════════════════════════════════════════════
// 全量分析
// ═══════════════════════════════════════════════════

export interface FullAIAnalysis {
  uiux: AICategoryResult;
  seo: AICategoryResult;
  ads: AICategoryResult;
  email: AICategoryResult;
  tech: AICategoryResult;
  brand: AICategoryResult;
  techSeo: AICategoryResult;    // 新增：技术SEO深度分析
  eeat: AICategoryResult;       // 新增：E-E-A-T分析
  geo: AICategoryResult;        // 新增：GEO/AEO分析
  scores: {
    uiux: number;
    seo: number;
    ads: number;
    email: number;
    tech: number;
    brand: number;
    techSeo: number;
    eeat: number;
    geo: number;
    overall: number;
  };
}

async function analyzeTechPerformance(data: ScrapedData): Promise<AICategoryResult> {
  const systemPrompt = `你是资深前端性能工程师与安全审计专家（10年经验），精通：Core Web Vitals（LCP<2.5s、FID<100ms、CLS<0.1）、Web安全（HTTPS、CSP、HSTS）、WCAG 2.1可访问性、移动端性能优化、CDN与缓存策略、代码压缩与懒加载。分析要基于Web Vitals最佳实践和安全标准。
${SCORING_RUBRIC}`;

  const userPrompt = `请以技术性能工程师的视角，对以下 DTC 品牌网站进行深度诊断：

${buildScrapedDataSummary(data)}

分析维度（每个都要深入评估）：

1. **页面加载速度**
   - 加载时间是否<3秒
   - 图片是否做了懒加载和格式优化
   - 是否有骨架屏或加载状态

2. **移动端适配**
   - Viewport配置是否正确
   - 触控目标是否≥44px
   - 文字在移动端是否≥16px

3. **HTTPS与安全**
   - 是否全站HTTPS
   - 安全头部配置（HSTS、CSP等）
   - 混合内容检查

4. **技术栈分析**
   - 使用的框架和库
   - 是否有冗余脚本
   - 代码压缩和优化

5. **可访问性(WCAG)**
   - 图片alt标签完整度
   - 表单label关联
   - 键盘导航支持

6. **Core Web Vitals**
   - LCP（最大内容绘制）优化
   - FID（首次输入延迟）优化
   - CLS（累积布局偏移）优化

7. **CDN与缓存**
   - 静态资源缓存策略
   - CDN使用情况
   - 资源压缩（Gzip/Brotli）

8. **代码质量**
   - HTML语义化
   - CSS优化
   - JavaScript性能

请以 JSON 格式返回（不要包含其他文字）：
{
  "score": 0-100综合评分,
  "summary": "一句话总结（20字内）",
  "checks": [
    {"label": "检查项", "score": 0-100, "feedback": "专业分析（通俗语言+专业术语，50-100字）", "suggestion": "具体可执行的改进建议（30-60字）"}
  ],
  "issues": ["问题1", "问题2", "问题3"],
  "suggestions": ["建议1", "建议2", "建议3", "建议4", "建议5"]
}

根据网站实际情况如实评估，发现了几个问题就写几个checks，有几条建议就写几条suggestions，不要凑数也不要遗漏。`;

  const raw = await callAI(systemPrompt, userPrompt);
  return parseAIResponse(raw);
}

async function analyzeBrandStory(data: ScrapedData): Promise<AICategoryResult> {
  const systemPrompt = `你是品牌战略总监与视觉叙事专家（12年经验），精通：品牌定位理论（特劳特定位）、品牌故事框架（英雄之旅）、视觉叙事（色彩心理学、排版情绪）、信任背书体系（媒体/奖项/认证）、情感营销、用户社区运营、DTC品牌差异化。分析要基于品牌建设和情感营销理论。
${SCORING_RUBRIC}`;

  const userPrompt = `请以品牌战略总监的视角，对以下 DTC 品牌网站进行深度诊断：

${buildScrapedDataSummary(data)}

分析维度（每个都要深入评估）：

1. **品牌故事质量**
   - About Us页面是否有引人入胜的品牌故事
   - 是否有创始人故事和品牌起源
   - 使命/愿景/价值观是否清晰传达

2. **品牌调性一致性**
   - 语言风格是否贯穿全站
   - 品牌声音是否独特且一致
   - 文案是否有情感共鸣

3. **视觉设计层次**
   - 色彩搭配是否符合品牌调性
   - 排版层次是否清晰
   - 留白运用是否得当

4. **信任背书元素**
   - 媒体报道展示
   - 奖项和认证
   - 合作伙伴logo

5. **情感连接度**
   - 是否能引发用户情感共鸣
   - 用户故事和案例展示
   - 社区感和归属感

6. **品牌差异化**
   - 与竞品的差异化是否清晰
   - 独特卖点(USP)是否突出
   - 品牌记忆点是否足够

7. **创始人故事**
   - 创始人背景和动机
   - 个人故事与品牌连接
   - 真实性和可信度

8. **用户社区与UGC**
   - 用户评价和故事展示
   - 社交媒体整合
   - 用户参与感

请以 JSON 格式返回（不要包含其他文字）：
{
  "score": 0-100综合评分,
  "summary": "一句话总结（20字内）",
  "checks": [
    {"label": "检查项", "score": 0-100, "feedback": "专业分析（通俗语言+专业术语，50-100字）", "suggestion": "具体可执行的改进建议（30-60字）"}
  ],
  "issues": ["问题1", "问题2", "问题3"],
  "suggestions": ["建议1", "建议2", "建议3", "建议4", "建议5"]
}

根据网站实际情况如实评估，发现了几个问题就写几个checks，有几条建议就写几条suggestions，不要凑数也不要遗漏。`;

  const raw = await callAI(systemPrompt, userPrompt);
  return parseAIResponse(raw);
}

// ═══════════════════════════════════════════════════
// 技术SEO深度分析 Agent — 基于 claude-seo 方法论
// ═══════════════════════════════════════════════════

async function analyzeTechSEODepth(data: ScrapedData): Promise<AICategoryResult> {
  const systemPrompt = `你是资深技术SEO工程师（10年经验），精通：Core Web Vitals（LCP<2.5s、INP<200ms、CLS<0.1）、Schema.org结构化数据验证、Canonical标签、Robots Meta、Hreflang国际化、Open Graph/Twitter Card、移动端SEO、爬虫指令（robots.txt、sitemap）。分析要基于Google搜索文档和SEO最佳实践，给出具体可执行的技术建议。
${SCORING_RUBRIC}`;

  const userPrompt = `请以技术SEO工程师的视角，对以下 DTC 品牌网站进行深度技术诊断：

${buildScrapedDataSummary(data)}

分析维度（每个都要深入评估）：

1. **Core Web Vitals**
   - LCP（最大内容绘制）是否<2.5秒
   - INP（交互到下一次绘制）是否<200毫秒
   - CLS（累积布局偏移）是否<0.1
   - 是否有图片懒加载、代码分割等优化

2. **Schema结构化数据**
   - 是否有Product、Organization、BreadcrumbList等Schema
   - JSON-LD格式是否正确
   - Schema必填字段是否完整
   - 是否有废弃的Schema类型（HowTo、FAQ等）

3. **Canonical与重复内容**
   - 是否设置了canonical标签
   - 是否有重复内容问题
   - URL参数是否处理得当

4. **爬虫指令**
   - robots.txt是否配置正确
   - 是否有noindex页面
   - sitemap.xml是否完整

5. **国际化SEO**
   - 是否有多语言版本
   - hreflang标签是否正确配置
   - 是否有区域定向

6. **社交分享优化**
   - Open Graph标签是否完整
   - Twitter Card是否配置
   - 分享时是否显示正确的图片和描述

7. **移动端SEO**
   - 移动端是否友好
   - 触控目标是否≥44px
   - 是否有独立移动站或响应式

8. **安全与可访问性**
   - 是否全站HTTPS
   - 是否有安全头部（HSTS、CSP）
   - 图片alt标签完整度

请以 JSON 格式返回（不要包含其他文字）：
{
  "score": 0-100综合评分,
  "summary": "一句话总结（20字内）",
  "checks": [
    {"label": "检查项", "score": 0-100, "feedback": "专业分析（通俗语言+专业术语，50-100字）", "suggestion": "具体可执行的改进建议（30-60字）"}
  ],
  "issues": ["问题1", "问题2", "问题3"],
  "suggestions": ["建议1", "建议2", "建议3", "建议4", "建议5"]
}

根据网站实际情况如实评估，发现了几个问题就写几个checks，有几条建议就写几条suggestions，不要凑数也不要遗漏。`;

  const raw = await callAI(systemPrompt, userPrompt);
  return parseAIResponse(raw);
}

// ═══════════════════════════════════════════════════
// E-E-A-T分析 Agent — 基于 claude-seo 方法论
// ═══════════════════════════════════════════════════

async function analyzeEEATDepth(data: ScrapedData): Promise<AICategoryResult> {
  const systemPrompt = `你是资深内容质量评估专家，精通Google搜索质量评估指南（Search Quality Rater Guidelines），精通E-E-A-T框架（Experience经验、Expertise专业性、Authoritativeness权威性、Trustworthiness可信度）。分析要基于Google的YMYL标准和E-E-A-T评估框架，给出具体可执行的改进建议。
${SCORING_RUBRIC}`;

  const userPrompt = `请以内容质量评估专家的视角，对以下 DTC 品牌网站进行E-E-A-T深度诊断：

${buildScrapedDataSummary(data)}

分析维度（每个都要深入评估）：

1. **Experience（经验）**
   - 是否有原创内容（非AI生成）
   - 是否有第一手经验（用户评价、案例研究）
   - 是否有真实的产品使用照片
   - 内容是否有深度而非泛泛而谈

2. **Expertise（专业性）**
   - 作者是否有专业背景
   - 内容是否展示专业知识
   - 是否有行业认证或资质
   - 产品描述是否专业准确

3. **Authoritativeness（权威性）**
   - 是否有外部引用和来源
   - 是否有媒体报道或行业认可
   - 品牌在行业内的知名度
   - 是否有学术或专业机构背书

4. **Trustworthiness（可信度）**
   - 是否有隐私政策、服务条款
   - 联系信息是否完整
   - 是否有安全认证（SSL、支付安全）
   - 退款/退货政策是否清晰

5. **YMYL（Your Money Your Life）**
   - 涉及健康、财务、安全的内容是否有专业来源
   - 产品声明是否有科学依据
   - 是否有免责说明

6. **作者归属**
   - 内容是否有明确的作者
   - 作者页面是否链接到个人简介
   - 作者是否有专业背景

7. **内容新鲜度**
   - 内容是否有发布/更新日期
   - 是否定期更新
   - 过时内容是否标注或删除

8. **外部引用**
   - 是否引用权威来源
   - 引用链接是否可访问
   - 是否有学术或行业研究引用

请以 JSON 格式返回（不要包含其他文字）：
{
  "score": 0-100综合评分,
  "summary": "一句话总结（20字内）",
  "checks": [
    {"label": "检查项", "score": 0-100, "feedback": "专业分析（通俗语言+专业术语，50-100字）", "suggestion": "具体可执行的改进建议（30-60字）"}
  ],
  "issues": ["问题1", "问题2", "问题3"],
  "suggestions": ["建议1", "建议2", "建议3", "建议4", "建议5"]
}

根据网站实际情况如实评估，发现了几个问题就写几个checks，有几条建议就写几条suggestions，不要凑数也不要遗漏。`;

  const raw = await callAI(systemPrompt, userPrompt);
  return parseAIResponse(raw);
}

// ═══════════════════════════════════════════════════
// GEO/AEO分析 Agent — 基于 claude-seo 方法论
// ═══════════════════════════════════════════════════

async function analyzeGEODepth(data: ScrapedData): Promise<AICategoryResult> {
  const systemPrompt = `你是资深GEO（生成式引擎优化）专家，精通：AI搜索优化（ChatGPT、Perplexity、Google AI Overviews）、段落可引用性（134-167词独立答案块）、问题式标题层级、实体存在（Wikipedia、Reddit、YouTube、LinkedIn）、结构化数据对AI的影响、llms.txt优化。分析要基于Google AI优化指南和GEO最佳实践，给出具体可执行的优化建议。
${SCORING_RUBRIC}`;

  const userPrompt = `请以GEO优化专家的视角，对以下 DTC 品牌网站进行AI搜索优化诊断：

${buildScrapedDataSummary(data)}

分析维度（每个都要深入评估）：

1. **FAQ/问答内容**
   - 是否有FAQ页面
   - 问答内容是否覆盖用户常见问题
   - 问答格式是否结构化（Q&A格式）
   - 是否有Schema FAQPage标记

2. **段落可引用性（Passage Citability）**
   - 内容是否有独立的答案段落（134-167词）
   - 段落是否自包含（无需上下文即可理解）
   - 是否有清晰的定义和解释
   - AI能否直接提取引用

3. **实体存在（Entity Presence）**
   - 品牌在Wikipedia是否有页面
   - 品牌在Reddit、YouTube、LinkedIn是否有提及
   - 内容是否提及权威实体
   - 品牌实体是否清晰

4. **结构化答案**
   - 内容是否有列表、表格等结构化格式
   - 是否有步骤说明（Step-by-step）
   - 是否有定义和解释
   - AI能否提取结构化信息

5. **问题式标题**
   - 标题是否使用问句（How、What、Why）
   - 标题是否匹配用户搜索意图
   - 是否有How-to内容
   - 标题层级是否清晰

6. **引用密度**
   - 内容是否有外部引用
   - 引用来源是否权威
   - 是否有数据和研究支持
   - 是否有新闻报道引用

7. **AI友好内容**
   - 内容是否避免AI生成痕迹
   - 是否有原创观点和见解
   - 是否有第一手经验
   - 内容是否有深度而非泛泛而谈

8. **llms.txt配置**
   - 是否有llms.txt文件
   - llms.txt内容是否完整
   - 是否有llms-full.txt
   - 是否有AI爬虫指令

请以 JSON 格式返回（不要包含其他文字）：
{
  "score": 0-100综合评分,
  "summary": "一句话总结（20字内）",
  "checks": [
    {"label": "检查项", "score": 0-100, "feedback": "专业分析（通俗语言+专业术语，50-100字）", "suggestion": "具体可执行的改进建议（30-60字）"}
  ],
  "issues": ["问题1", "问题2", "问题3"],
  "suggestions": ["建议1", "建议2", "建议3", "建议4", "建议5"]
}

根据网站实际情况如实评估，发现了几个问题就写几个checks，有几条建议就写几条suggestions，不要凑数也不要遗漏。`;

  const raw = await callAI(systemPrompt, userPrompt);
  return parseAIResponse(raw);
}

export async function runFullAIAnalysis(data: ScrapedData): Promise<FullAIAnalysis> {
  const [uiux, seo, ads, email, tech, brand, techSeo, eeat, geo] = await Promise.all([
    analyzeUIUX(data),
    analyzeSEO(data),
    analyzeAdsConversion(data),
    analyzeEmailMarketing(data),
    analyzeTechPerformance(data),
    analyzeBrandStory(data),
    analyzeTechSEODepth(data),
    analyzeEEATDepth(data),
    analyzeGEODepth(data),
  ]);

  const scores = {
    uiux: uiux.score,
    seo: seo.score,
    ads: ads.score,
    email: email.score,
    tech: tech.score,
    brand: brand.score,
    techSeo: techSeo.score,
    eeat: eeat.score,
    geo: geo.score,
    overall: Math.round((uiux.score + seo.score + ads.score + email.score + tech.score + brand.score + techSeo.score + eeat.score + geo.score) / 9),
  };

  return { uiux, seo, ads, email, tech, brand, techSeo, eeat, geo, scores };
}
