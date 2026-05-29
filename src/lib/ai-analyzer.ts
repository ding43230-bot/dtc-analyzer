import OpenAI from 'openai';
import { ScrapedData } from './scraper';

const client = new OpenAI({
  apiKey: process.env.MIMO_API_KEY,
  baseURL: process.env.MIMO_API_BASE,
});

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
  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.chat.completions.create({
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
    return {
      score: Math.min(100, Math.max(0, parsed.score || 0)),
      summary: parsed.summary || '',
      checks: (parsed.checks || []).map((c: any) => ({
        label: c.label || '',
        score: Math.min(100, Math.max(0, c.score || 0)),
        feedback: c.feedback || '',
        suggestion: c.suggestion || '',
      })),
      issues: parsed.issues || [],
      suggestions: parsed.suggestions || [],
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

checks 必须包含 8 个检查项，每个都要有深度分析。`;

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

checks 必须包含 8 个检查项。`;

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

checks 必须包含 8 个检查项。`;

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

checks 必须包含 6-8 个检查项。`;

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
  scores: {
    uiux: number;
    seo: number;
    ads: number;
    email: number;
    overall: number;
  };
}

export async function runFullAIAnalysis(data: ScrapedData): Promise<FullAIAnalysis> {
  const [uiux, seo, ads, email] = await Promise.all([
    analyzeUIUX(data),
    analyzeSEO(data),
    analyzeAdsConversion(data),
    analyzeEmailMarketing(data),
  ]);

  const scores = {
    uiux: uiux.score,
    seo: seo.score,
    ads: ads.score,
    email: email.score,
    overall: Math.round((uiux.score + seo.score + ads.score + email.score) / 4),
  };

  return { uiux, seo, ads, email, scores };
}
