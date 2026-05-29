import OpenAI from 'openai';
import { AnalysisResult } from './analyzer';
import { ServiceRecommendation } from './service-matcher';

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.MIMO_API_KEY || process.env.OPENAI_API_KEY || 'dummy-key-for-build',
    baseURL: process.env.MIMO_API_BASE || 'https://api.openai.com/v1',
  });
}

export interface Report {
  id: string;
  url: string;
  timestamp: string;
  html: string;
  analysis: AnalysisResult;
  recommendations: ServiceRecommendation[];
}

export async function generateReport(
  analysis: AnalysisResult,
  recommendations: ServiceRecommendation[]
): Promise<Report> {
  const id = generateReportId();

  const prompt = buildPrompt(analysis, recommendations);

  const openai = getOpenAIClient();
  const completion = await openai.chat.completions.create({
    model: process.env.MIMO_MODEL || 'mimo-7b',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  const html = completion.choices[0]?.message?.content || '';

  return {
    id,
    url: analysis.url,
    timestamp: new Date().toISOString(),
    html,
    analysis,
    recommendations
  };
}

function buildPrompt(analysis: AnalysisResult, recommendations: ServiceRecommendation[]): string {
  return `你是一位专业的DTC品牌网站分析师，为简跃科技（NextLeap Business）工作。简跃科技是一家帮助中国DTC品牌出海的全案营销公司。

请根据以下分析数据，生成一份专业的HTML格式网站分析报告。

## 分析数据

**网站URL**: ${analysis.url}
**分析时间**: ${analysis.timestamp}

### 总体评分
- UI/UX评分: ${analysis.scores.uiux}/100
- SEO/GEO评分: ${analysis.scores.seo}/100
- 广告转化评分: ${analysis.scores.ads}/100
- 邮件营销评分: ${analysis.scores.email}/100
- 综合评分: ${analysis.scores.overall}/100

### UI/UX分析详情
${JSON.stringify(analysis.uiux.details, null, 2)}

### SEO/GEO分析详情
${JSON.stringify(analysis.seo.details, null, 2)}

### 广告转化分析详情
${JSON.stringify(analysis.ads.details, null, 2)}

### 邮件营销分析详情
${JSON.stringify(analysis.email.details, null, 2)}

### 问题列表
${analysis.recommendations.join('\n')}

### 服务推荐
${recommendations.map(r => `- ${r.serviceName} (${r.price}): ${r.reason}`).join('\n')}

## 要求

1. 生成一份美观、专业的HTML报告
2. 使用中文撰写报告内容
3. **语言风格：大白话为主 + 专业术语为辅**（这是最重要的要求！）
   - **写作对象**：完全不懂技术的传统行业老板，50岁左右，只关心"对我有什么影响"和"要花多少钱"
   - **核心原则**：先说人话，再补专业词。专业术语用括号跟在大白话后面，不要单独出现
   - **正确示范**：
     - "你的网站手机上看排版全乱了（专业术语：响应式设计 Responsive Design），现在70%的客户都是用手机浏览的，这意味着你正在丢掉大部分潜在客户"
     - "Google搜索结果里你的网站连个像样的描述都没有（专业术语：Meta Description缺失），用户搜到你也不想点"
     - "用户加了购物车但没付款就走了，你也没办法提醒他们（专业术语：弃购挽回 Abandoned Cart Recovery），这就像客人走到收银台又转身走了，你却不知道他是谁"
   - **禁止**：不要出现大段纯技术描述，不要堆砌英文缩写，不要用"该""此""上述"等书面语
   - **比喻**：多用生活中的比喻来解释技术问题，让老板秒懂
   - **数字**：用具体的数字说明影响，比如"每多等1秒，约7%的客户会离开"
4. 包含以下部分：
   - 报告标题和概览（一句话说清这个网站最大的问题）
   - 四个维度的详细分析（UI/UX、SEO/GEO、广告转化、邮件营销），每个维度要有：
     - 通俗总结（2-3句话，老板只看这段就能懂）
     - 具体问题列表（每个问题：大白话 + 专业术语 + 对生意的影响）
     - 评分可视化
   - 问题总结和改进建议（按优先级排序，最紧急的排前面）
   - 简跃科技服务推荐（根据分析结果推荐合适的服务包，要说清楚"买了这个服务能解决什么问题"）
   - 联系方式和下一步行动（给出明确的行动指引）
5. 使用现代CSS样式，确保报告美观易读
6. 添加简跃科技的品牌元素（公司名称、logo位置等）
7. 报告应该具有说服力，让客户意识到问题并愿意采取行动
8. 每个分析维度的通俗总结要放在最前面，用加粗和不同背景色突出显示

请直接输出完整的HTML代码，不要包含任何解释。`;
}

function generateReportId(): string {
  return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
