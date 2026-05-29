import { ScrapedData } from './scraper';

export interface AnalysisResult {
  url: string;
  timestamp: string;
  scores: {
    uiux: number;
    seo: number;
    ads: number;
    email: number;
    overall: number;
  };
  uiux: UIUXAnalysis;
  seo: SEOAnalysis;
  ads: AdsAnalysis;
  email: EmailAnalysis;
  recommendations: string[];
}

export interface UIUXAnalysis {
  score: number;
  details: {
    layout: { score: number; feedback: string };
    responsive: { score: number; feedback: string };
    loadSpeed: { score: number; feedback: string };
    cta: { score: number; feedback: string };
    navigation: { score: number; feedback: string };
  };
  issues: string[];
}

export interface SEOAnalysis {
  score: number;
  details: {
    metaTags: { score: number; feedback: string };
    headings: { score: number; feedback: string };
    content: { score: number; feedback: string };
    structuredData: { score: number; feedback: string };
    internalLinks: { score: number; feedback: string };
    geo: { score: number; feedback: string };
  };
  issues: string[];
}

export interface AdsAnalysis {
  score: number;
  details: {
    landingPage: { score: number; feedback: string };
    ctaDesign: { score: number; feedback: string };
    conversionPath: { score: number; feedback: string };
    trustElements: { score: number; feedback: string };
    socialProof: { score: number; feedback: string };
  };
  issues: string[];
}

export interface EmailAnalysis {
  score: number;
  details: {
    subscriptionEntry: { score: number; feedback: string };
    captureMechanism: { score: number; feedback: string };
    automation: { score: number; feedback: string };
    exitIntent: { score: number; feedback: string };
  };
  issues: string[];
}

export function analyzeWebsite(data: ScrapedData): AnalysisResult {
  const uiux = analyzeUIUX(data);
  const seo = analyzeSEO(data);
  const ads = analyzeAds(data);
  const email = analyzeEmail(data);

  const scores = {
    uiux: uiux.score,
    seo: seo.score,
    ads: ads.score,
    email: email.score,
    overall: Math.round((uiux.score + seo.score + ads.score + email.score) / 4)
  };

  const recommendations = generateRecommendations(scores, uiux, seo, ads, email);

  return {
    url: data.url,
    timestamp: new Date().toISOString(),
    scores,
    uiux,
    seo,
    ads,
    email,
    recommendations
  };
}

function analyzeUIUX(data: ScrapedData): UIUXAnalysis {
  const issues: string[] = [];

  // Layout analysis
  const layoutScore = analyzeLayout(data);
  if (layoutScore.score < 70) issues.push(layoutScore.feedback);

  // Responsive analysis
  const responsiveScore = analyzeResponsive(data);
  if (responsiveScore.score < 70) issues.push(responsiveScore.feedback);

  // Load speed analysis
  const speedScore = analyzeLoadSpeed(data);
  if (speedScore.score < 70) issues.push(speedScore.feedback);

  // CTA analysis
  const ctaScore = analyzeCTA(data);
  if (ctaScore.score < 70) issues.push(ctaScore.feedback);

  // Navigation analysis
  const navScore = analyzeNavigation(data);
  if (navScore.score < 70) issues.push(navScore.feedback);

  const score = Math.round(
    (layoutScore.score + responsiveScore.score + speedScore.score + ctaScore.score + navScore.score) / 5
  );

  return {
    score,
    details: {
      layout: layoutScore,
      responsive: responsiveScore,
      loadSpeed: speedScore,
      cta: ctaScore,
      navigation: navScore
    },
    issues
  };
}

function analyzeLayout(data: ScrapedData): { score: number; feedback: string } {
  // Check for proper heading structure
  const h1Count = data.headings.filter(h => h.level === 1).length;
  const hasProperStructure = h1Count === 1;

  // Check for images with alt text
  const imagesWithAlt = data.images.filter(img => img.alt).length;
  const altTextRatio = data.images.length > 0 ? imagesWithAlt / data.images.length : 0;

  let score = 70;
  if (hasProperStructure) score += 15;
  if (altTextRatio > 0.8) score += 15;

  return {
    score: Math.min(score, 100),
    feedback: hasProperStructure
      ? '页面大标题设置正确，结构清晰（专业术语：H1层级结构 H1 Hierarchy）'
      : '页面没有明确的大标题，搜索引擎看不懂你这页在讲什么（专业术语：H1标签缺失 Missing H1 Tag）'
  };
}

function analyzeResponsive(data: ScrapedData): { score: number; feedback: string } {
  // Check viewport meta tag
  const hasViewport = 'viewport' in data.metaTags;
  const score = hasViewport ? 85 : 50;

  return {
    score,
    feedback: hasViewport
      ? '手机上浏览会自动适配屏幕大小（专业术语：响应式设计 Responsive Design）'
      : '手机上看排版会乱掉，文字太小、按钮太挤（专业术语：视口未配置 Missing Viewport Meta）'
  };
}

function analyzeLoadSpeed(data: ScrapedData): { score: number; feedback: string } {
  let score: number;
  if (data.loadTime < 2000) score = 90;
  else if (data.loadTime < 3000) score = 75;
  else if (data.loadTime < 5000) score = 60;
  else score = 40;

  let description: string;
  if (data.loadTime < 2000) description = '网页打开很快，用户体验好';
  else if (data.loadTime < 3000) description = '网页打开有点慢，部分用户可能等不及走了';
  else if (data.loadTime < 5000) description = '网页打开太慢了，很多用户会直接关掉';
  else description = '网页打开巨慢，超过一半的用户会流失';

  return {
    score,
    feedback: `${description}（专业术语：页面加载性能 Page Load Performance，当前加载时间 ${(data.loadTime / 1000).toFixed(1)}秒）`
  };
}

function analyzeCTA(data: ScrapedData): { score: number; feedback: string } {
  // Check for common CTA patterns
  const ctaKeywords = ['buy', 'shop', 'order', 'subscribe', 'sign up', 'get started', 'learn more',
    '购买', '立即购买', '加入购物车', '订阅', '注册', '了解更多'];
  const hasCTA = ctaKeywords.some(keyword =>
    data.content.toLowerCase().includes(keyword)
  );

  const score = hasCTA ? 80 : 50;
  return {
    score,
    feedback: hasCTA
      ? '页面有"立即购买""加入购物车"等引导按钮（专业术语：CTA行动号召 Call To Action）'
      : '页面缺少醒目的购买按钮，用户不知道下一步该干嘛（专业术语：CTA缺失 Missing CTA）'
  };
}

function analyzeNavigation(data: ScrapedData): { score: number; feedback: string } {
  // Check for navigation links
  const navLinks = data.links.filter(link =>
    link.text.toLowerCase().includes('menu') ||
    link.text.toLowerCase().includes('nav') ||
    link.href.includes('#')
  );

  const score = navLinks.length > 3 ? 80 : 60;
  return {
    score,
    feedback: navLinks.length > 3
      ? '网站菜单分类清楚，用户能快速找到想要的内容（专业术语：信息架构 Information Architecture）'
      : '网站导航太简单或太乱，用户找东西费劲（专业术语：导航结构优化 Navigation Optimization）'
  };
}

function analyzeSEO(data: ScrapedData): SEOAnalysis {
  const issues: string[] = [];

  // Meta tags analysis
  const metaScore = analyzeMetaTags(data);
  if (metaScore.score < 70) issues.push(metaScore.feedback);

  // Headings analysis
  const headingsScore = analyzeHeadings(data);
  if (headingsScore.score < 70) issues.push(headingsScore.feedback);

  // Content analysis
  const contentScore = analyzeContent(data);
  if (contentScore.score < 70) issues.push(contentScore.feedback);

  // Structured data analysis
  const structuredScore = analyzeStructuredData(data);
  if (structuredScore.score < 70) issues.push(structuredScore.feedback);

  // Internal links analysis
  const linksScore = analyzeInternalLinks(data);
  if (linksScore.score < 70) issues.push(linksScore.feedback);

  // GEO analysis
  const geoScore = analyzeGEO(data);
  if (geoScore.score < 70) issues.push(geoScore.feedback);

  const score = Math.round(
    (metaScore.score + headingsScore.score + contentScore.score +
     structuredScore.score + linksScore.score + geoScore.score) / 6
  );

  return {
    score,
    details: {
      metaTags: metaScore,
      headings: headingsScore,
      content: contentScore,
      structuredData: structuredScore,
      internalLinks: linksScore,
      geo: geoScore
    },
    issues
  };
}

function analyzeMetaTags(data: ScrapedData): { score: number; feedback: string } {
  const hasTitle = !!data.title;
  const hasDescription = !!data.description;
  const hasKeywords = !!data.keywords;

  let score = 0;
  if (hasTitle) score += 40;
  if (hasDescription) score += 40;
  if (hasKeywords) score += 20;

  return {
    score,
    feedback: hasTitle && hasDescription
      ? '网站标题和描述设置完整，搜索结果展示效果好（专业术语：Meta标签 Meta Tags）'
      : '网站缺少标题或描述，搜索结果里显示不完整，用户不想点（专业术语：Meta标签缺失 Missing Meta Tags）'
  };
}

function analyzeHeadings(data: ScrapedData): { score: number; feedback: string } {
  const h1Count = data.headings.filter(h => h.level === 1).length;
  const hasProperStructure = h1Count === 1;

  const score = hasProperStructure ? 85 : 50;
  return {
    score,
    feedback: hasProperStructure
      ? '页面标题层级分明，搜索引擎容易理解（专业术语：标题层级 Heading Structure）'
      : '页面标题层级混乱，搜索引擎分不清主次（专业术语：H1标签问题 H1 Tag Issue）'
  };
}

function analyzeContent(data: ScrapedData): { score: number; feedback: string } {
  const wordCount = data.content.split(/\s+/).length;
  let score: number;

  if (wordCount > 500) score = 85;
  else if (wordCount > 200) score = 70;
  else score = 50;

  let description: string;
  if (wordCount > 500) description = '网站内容丰富，搜索引擎喜欢';
  else if (wordCount > 200) description = '网站内容偏少，建议多写点产品介绍和用户关心的信息';
  else description = '网站内容太少了，搜索引擎觉得没什么价值';

  return {
    score,
    feedback: `${description}（专业术语：内容丰富度 Content Depth，当前约${wordCount}字）`
  };
}

function analyzeStructuredData(data: ScrapedData): { score: number; feedback: string } {
  const hasStructuredData = data.structuredData.length > 0;
  const score = hasStructuredData ? 85 : 40;

  return {
    score,
    feedback: hasStructuredData
      ? '网站有结构化数据，搜索结果可以展示价格、评分等额外信息（专业术语：Schema Markup）'
      : '网站缺少结构化数据，搜索结果只能显示标题和描述，不够吸引人（专业术语：Schema缺失 Missing Schema）'
  };
}

function analyzeInternalLinks(data: ScrapedData): { score: number; feedback: string } {
  const internalLinks = data.links.filter(link => !link.isExternal);
  const score = internalLinks.length > 5 ? 80 : 50;

  return {
    score,
    feedback: internalLinks.length > 5
      ? '页面之间互相链接，用户和搜索引擎都能顺畅浏览（专业术语：内部链接 Internal Links）'
      : '页面之间缺少链接，用户和搜索引擎都很难发现其他内容（专业术语：内部链接不足 Poor Internal Linking）'
  };
}

function analyzeGEO(data: ScrapedData): { score: number; feedback: string } {
  // Check for AI-friendly content patterns
  const hasFAQ = data.content.toLowerCase().includes('faq') || data.content.includes('常见问题');
  const hasQA = data.content.includes('?') && data.content.includes('答');
  const hasStructuredAnswers = hasFAQ || hasQA;

  const score = hasStructuredAnswers ? 75 : 45;
  return {
    score,
    feedback: hasStructuredAnswers
      ? '网站有FAQ等问答内容，AI搜索引擎（如ChatGPT）更容易推荐你（专业术语：GEO生成式引擎优化）'
      : '网站缺少问答类内容，AI搜索引擎不太会推荐你（专业术语：GEO优化不足 Missing GEO Optimization）'
  };
}

function analyzeAds(data: ScrapedData): AdsAnalysis {
  const issues: string[] = [];

  // Landing page analysis
  const landingScore = analyzeLandingPage(data);
  if (landingScore.score < 70) issues.push(landingScore.feedback);

  // CTA design analysis
  const ctaScore = analyzeCTADesign(data);
  if (ctaScore.score < 70) issues.push(ctaScore.feedback);

  // Conversion path analysis
  const conversionScore = analyzeConversionPath(data);
  if (conversionScore.score < 70) issues.push(conversionScore.feedback);

  // Trust elements analysis
  const trustScore = analyzeTrustElements(data);
  if (trustScore.score < 70) issues.push(trustScore.feedback);

  // Social proof analysis
  const socialScore = analyzeSocialProof(data);
  if (socialScore.score < 70) issues.push(socialScore.feedback);

  const score = Math.round(
    (landingScore.score + ctaScore.score + conversionScore.score +
     trustScore.score + socialScore.score) / 5
  );

  return {
    score,
    details: {
      landingPage: landingScore,
      ctaDesign: ctaScore,
      conversionPath: conversionScore,
      trustElements: trustScore,
      socialProof: socialScore
    },
    issues
  };
}

function analyzeLandingPage(data: ScrapedData): { score: number; feedback: string } {
  // Check for clear value proposition
  const hasValueProp = data.headings.some(h =>
    h.level === 1 && h.text.length > 10
  );

  const score = hasValueProp ? 80 : 50;
  return {
    score,
    feedback: hasValueProp
      ? '首页一眼就能看出你是干嘛的、为什么选你（专业术语：价值主张 Value Proposition）'
      : '首页看不出你的产品有什么特别的，用户3秒内就会离开（专业术语：价值主张缺失 Missing Value Prop）'
  };
}

function analyzeCTADesign(data: ScrapedData): { score: number; feedback: string } {
  // Check for CTA buttons
  const ctaKeywords = ['buy', 'shop', 'order', 'subscribe', 'sign up', 'get started',
    '购买', '立即购买', '加入购物车', '订阅', '注册'];
  const hasCTA = ctaKeywords.some(keyword =>
    data.content.toLowerCase().includes(keyword)
  );

  const score = hasCTA ? 80 : 50;
  return {
    score,
    feedback: hasCTA
      ? '购买按钮醒目，用户知道点哪里下单（专业术语：CTA设计 CTA Design）'
      : '购买按钮不够突出，用户找不到下单入口（专业术语：CTA设计优化 CTA Optimization）'
  };
}

function analyzeConversionPath(data: ScrapedData): { score: number; feedback: string } {
  // Check for clear conversion path
  const hasForm = data.forms.length > 0;
  const hasCTA = data.content.toLowerCase().includes('buy') ||
    data.content.toLowerCase().includes('购买');

  const score = hasForm && hasCTA ? 85 : 55;
  return {
    score,
    feedback: hasForm && hasCTA
      ? '从看到产品到下单的流程顺畅（专业术语：转化路径 Conversion Path）'
      : '用户想买但不知道怎么下单，中间断了（专业术语：转化路径断裂 Broken Conversion Path）'
  };
}

function analyzeTrustElements(data: ScrapedData): { score: number; feedback: string } {
  // Check for trust elements
  const trustKeywords = ['testimonial', 'review', 'guarantee', 'secure', 'trusted',
    '评价', '客户评价', '保障', '安全', '信任'];
  const hasTrust = trustKeywords.some(keyword =>
    data.content.toLowerCase().includes(keyword)
  );

  const score = hasTrust ? 80 : 50;
  return {
    score,
    feedback: hasTrust
      ? '网站有客户评价、安全保障等信息，用户敢下单（专业术语：信任元素 Trust Elements）'
      : '网站没有评价、保障等信息，用户不敢轻易掏钱（专业术语：信任元素缺失 Missing Trust Signals）'
  };
}

function analyzeSocialProof(data: ScrapedData): { score: number; feedback: string } {
  // Check for social proof
  const socialKeywords = ['customer', 'client', 'partner', 'award', 'certification',
    '客户', '合作伙伴', '奖项', '认证'];
  const hasSocial = socialKeywords.some(keyword =>
    data.content.toLowerCase().includes(keyword)
  );

  const score = hasSocial ? 80 : 50;
  return {
    score,
    feedback: hasSocial
      ? '网站展示了客户案例、合作伙伴等背书，增强可信度（专业术语：社会证明 Social Proof）'
      : '网站缺少客户案例或合作背书，用户不知道别人用过没（专业术语：社会证明缺失 Missing Social Proof）'
  };
}

function analyzeEmail(data: ScrapedData): EmailAnalysis {
  const issues: string[] = [];

  // Subscription entry analysis
  const subscriptionScore = analyzeSubscriptionEntry(data);
  if (subscriptionScore.score < 70) issues.push(subscriptionScore.feedback);

  // Capture mechanism analysis
  const captureScore = analyzeCaptureMechanism(data);
  if (captureScore.score < 70) issues.push(captureScore.feedback);

  // Automation analysis
  const automationScore = analyzeAutomation(data);
  if (automationScore.score < 70) issues.push(automationScore.feedback);

  // Exit intent analysis
  const exitScore = analyzeExitIntent(data);
  if (exitScore.score < 70) issues.push(exitScore.feedback);

  const score = Math.round(
    (subscriptionScore.score + captureScore.score + automationScore.score + exitScore.score) / 4
  );

  return {
    score,
    details: {
      subscriptionEntry: subscriptionScore,
      captureMechanism: captureScore,
      automation: automationScore,
      exitIntent: exitScore
    },
    issues
  };
}

function analyzeSubscriptionEntry(data: ScrapedData): { score: number; feedback: string } {
  // Check for email subscription forms
  const emailInputs = data.forms.some(form =>
    form.inputs.some(input =>
      input.toLowerCase().includes('email') || input.includes('邮箱')
    )
  );

  const score = emailInputs ? 80 : 40;
  return {
    score,
    feedback: emailInputs
      ? '网站有邮箱订阅框，能收集潜在客户信息（专业术语：邮件订阅入口 Email Subscription Entry）'
      : '网站没有邮箱订阅框，白白流失潜在客户（专业术语：订阅入口缺失 Missing Email Capture）'
  };
}

function analyzeCaptureMechanism(data: ScrapedData): { score: number; feedback: string } {
  // Check for email capture mechanisms
  const hasPopup = data.scripts.some(script =>
    script.toLowerCase().includes('popup') || script.toLowerCase().includes('modal')
  );
  const hasForm = data.forms.length > 0;

  const score = hasPopup || hasForm ? 75 : 45;
  return {
    score,
    feedback: hasPopup || hasForm
      ? '网站有弹窗或表单来收集用户邮箱（专业术语：线索捕获 Lead Capture）'
      : '网站没有主动收集用户邮箱的方式，错失营销机会（专业术语：线索捕获缺失 Missing Lead Capture）'
  };
}

function analyzeAutomation(data: ScrapedData): { score: number; feedback: string } {
  // Check for email automation indicators
  const automationKeywords = ['klaviyo', 'mailchimp', 'hubspot', 'activecampaign',
    'welcome', 'abandoned', 'automation'];
  const hasAutomation = automationKeywords.some(keyword =>
    data.content.toLowerCase().includes(keyword) ||
    data.scripts.some(script => script.toLowerCase().includes(keyword))
  );

  const score = hasAutomation ? 80 : 45;
  return {
    score,
    feedback: hasAutomation
      ? '网站接入了邮件自动营销系统，能自动给客户发欢迎邮件、促销信息（专业术语：邮件自动化 Email Automation）'
      : '网站没有邮件自动营销，每次都要手动发，效率低且容易遗漏（专业术语：邮件自动化缺失 No Email Automation）'
  };
}

function analyzeExitIntent(data: ScrapedData): { score: number; feedback: string } {
  // Check for exit intent popups
  const exitKeywords = ['exit', 'leave', 'before you go', 'special offer',
    '离开', '特价', '优惠'];
  const hasExitIntent = exitKeywords.some(keyword =>
    data.content.toLowerCase().includes(keyword) ||
    data.scripts.some(script => script.toLowerCase().includes(keyword))
  );

  const score = hasExitIntent ? 75 : 40;
  return {
    score,
    feedback: hasExitIntent
      ? '用户要离开时会弹出优惠信息，挽回流失客户（专业术语：退出意图弹窗 Exit Intent Popup）'
      : '用户想走就走了，没有任何挽留措施（专业术语：退出意图弹窗缺失 No Exit Intent）'
  };
}

function generateRecommendations(
  scores: AnalysisResult['scores'],
  uiux: UIUXAnalysis,
  seo: SEOAnalysis,
  ads: AdsAnalysis,
  email: EmailAnalysis
): string[] {
  const recommendations: string[] = [];

  if (scores.uiux < 70) {
    recommendations.push('网站体验需要改进：用户打开网站后找不到想要的东西、手机上看排版乱，建议重新优化页面布局和手机适配（专业术语：UI/UX优化）');
  }

  if (scores.seo < 70) {
    recommendations.push('搜索排名需要提升：Google搜索结果里你的网站信息不完整或排不到前面，建议优化标题、描述和内容结构（专业术语：SEO优化）');
  }

  if (scores.ads < 70) {
    recommendations.push('花钱打广告但转化不高：用户点进来后没有下单就走了，建议优化落地页和购买引导（专业术语：广告转化优化）');
  }

  if (scores.email < 70) {
    recommendations.push('没有收集客户邮箱：用户走了就联系不上了，建议搭建邮件营销系统，自动给客户发促销信息（专业术语：邮件营销搭建）');
  }

  if (scores.overall < 60) {
    recommendations.push('网站整体需要大改：从页面设计到营销推广都有提升空间，建议考虑全案服务一次性搞定');
  }

  return recommendations;
}
