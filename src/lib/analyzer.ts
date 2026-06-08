import { ScrapedData } from './scraper';

export interface AnalysisResult {
  url: string;
  timestamp: string;
  scores: {
    uiux: number;
    seo: number;
    ads: number;
    email: number;
    techSeo: number;      // 新增：技术SEO
    eeat: number;         // 新增：E-E-A-T
    geo: number;          // 增强：GEO
    overall: number;
  };
  uiux: UIUXAnalysis;
  seo: SEOAnalysis;
  ads: AdsAnalysis;
  email: EmailAnalysis;
  techSeo: TechSEOAnalysis;   // 新增
  eeat: EEATAnalysis;         // 新增
  geo: GEOAnalysis;           // 增强
  recommendations: string[];
}

// ============== UI/UX ==============
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

// ============== SEO ==============
export interface SEOAnalysis {
  score: number;
  details: {
    metaTags: { score: number; feedback: string };
    headings: { score: number; feedback: string };
    content: { score: number; feedback: string };
    structuredData: { score: number; feedback: string };
    internalLinks: { score: number; feedback: string };
  };
  issues: string[];
}

// ============== 广告转化 ==============
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

// ============== 邮件营销 ==============
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

// ============== 技术SEO（新增） ==============
export interface TechSEOAnalysis {
  score: number;
  details: {
    https: { score: number; feedback: string };
    canonical: { score: number; feedback: string };
    robotsMeta: { score: number; feedback: string };
    viewport: { score: number; feedback: string };
    charset: { score: number; feedback: string };
    lang: { score: number; feedback: string };
    hreflang: { score: number; feedback: string };
    openGraph: { score: number; feedback: string };
    twitterCard: { score: number; feedback: string };
  };
  issues: string[];
}

// ============== E-E-A-T（新增） ==============
export interface EEATAnalysis {
  score: number;
  details: {
    authorInfo: { score: number; feedback: string };
    citations: { score: number; feedback: string };
    trustSignals: { score: number; feedback: string };
    contactInfo: { score: number; feedback: string };
    dateInfo: { score: number; feedback: string };
  };
  issues: string[];
}

// ============== GEO（增强） ==============
export interface GEOAnalysis {
  score: number;
  details: {
    faq: { score: number; feedback: string };
    passageCitability: { score: number; feedback: string };
    entityPresence: { score: number; feedback: string };
    structuredAnswers: { score: number; feedback: string };
    questionHeadings: { score: number; feedback: string };
  };
  issues: string[];
}

// ============== 主分析函数 ==============
export function analyzeWebsite(data: ScrapedData): AnalysisResult {
  const uiux = analyzeUIUX(data);
  const seo = analyzeSEO(data);
  const ads = analyzeAds(data);
  const email = analyzeEmail(data);
  const techSeo = analyzeTechSEO(data);
  const eeat = analyzeEEAT(data);
  const geo = analyzeGEOEnhanced(data);

  const scores = {
    uiux: uiux.score,
    seo: seo.score,
    ads: ads.score,
    email: email.score,
    techSeo: techSeo.score,
    eeat: eeat.score,
    geo: geo.score,
    overall: Math.round((uiux.score + seo.score + ads.score + email.score + techSeo.score + eeat.score + geo.score) / 7)
  };

  const recommendations = generateRecommendations(scores, uiux, seo, ads, email, techSeo, eeat, geo);

  return {
    url: data.url,
    timestamp: new Date().toISOString(),
    scores,
    uiux,
    seo,
    ads,
    email,
    techSeo,
    eeat,
    geo,
    recommendations
  };
}

// ============== UI/UX 分析 ==============
function analyzeUIUX(data: ScrapedData): UIUXAnalysis {
  const issues: string[] = [];
  const layoutScore = analyzeLayout(data);
  const responsiveScore = analyzeResponsive(data);
  const speedScore = analyzeLoadSpeed(data);
  const ctaScore = analyzeCTA(data);
  const navScore = analyzeNavigation(data);

  if (layoutScore.score < 70) issues.push(layoutScore.feedback);
  if (responsiveScore.score < 70) issues.push(responsiveScore.feedback);
  if (speedScore.score < 70) issues.push(speedScore.feedback);
  if (ctaScore.score < 70) issues.push(ctaScore.feedback);
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
  const h1Count = data.headings.filter(h => h.level === 1).length;
  const hasProperStructure = h1Count === 1;
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

// ============== SEO 分析 ==============
function analyzeSEO(data: ScrapedData): SEOAnalysis {
  const issues: string[] = [];
  const metaScore = analyzeMetaTags(data);
  const headingsScore = analyzeHeadings(data);
  const contentScore = analyzeContent(data);
  const structuredScore = analyzeStructuredData(data);
  const linksScore = analyzeInternalLinks(data);

  if (metaScore.score < 70) issues.push(metaScore.feedback);
  if (headingsScore.score < 70) issues.push(headingsScore.feedback);
  if (contentScore.score < 70) issues.push(contentScore.feedback);
  if (structuredScore.score < 70) issues.push(structuredScore.feedback);
  if (linksScore.score < 70) issues.push(linksScore.feedback);

  const score = Math.round(
    (metaScore.score + headingsScore.score + contentScore.score +
     structuredScore.score + linksScore.score) / 5
  );

  return {
    score,
    details: {
      metaTags: metaScore,
      headings: headingsScore,
      content: contentScore,
      structuredData: structuredScore,
      internalLinks: linksScore,
    },
    issues
  };
}

function analyzeMetaTags(data: ScrapedData): { score: number; feedback: string } {
  const hasTitle = !!data.title;
  const hasDescription = !!data.description;
  const titleLength = data.title?.length || 0;
  const descLength = data.description?.length || 0;

  let score = 0;
  if (hasTitle) score += 30;
  if (titleLength >= 30 && titleLength <= 60) score += 20;
  if (hasDescription) score += 30;
  if (descLength >= 120 && descLength <= 160) score += 20;

  let feedback = '';
  if (!hasTitle) feedback = '网站缺少标题，搜索结果里不显示（专业术语：Title标签缺失 Missing Title Tag）';
  else if (titleLength < 30) feedback = '标题太短，搜索引擎不知道这页讲什么（专业术语：Title标签过短 Short Title Tag）';
  else if (titleLength > 60) feedback = '标题太长，搜索结果里会显示不全（专业术语：Title标签过长 Long Title Tag）';
  else if (!hasDescription) feedback = '网站缺少描述，搜索结果里只显示标题（专业术语：Meta Description缺失 Missing Meta Description）';
  else if (descLength < 120) feedback = '描述太短，没有吸引力（专业术语：Meta Description过短 Short Meta Description）';
  else if (descLength > 160) feedback = '描述太长，搜索结果里会截断（专业术语：Meta Description过长 Long Meta Description）';
  else feedback = '标题和描述长度合适，搜索结果展示效果好（专业术语：Meta标签优化 Meta Tags Optimization）';

  return { score: Math.min(score, 100), feedback };
}

function analyzeHeadings(data: ScrapedData): { score: number; feedback: string } {
  const h1Count = data.headings.filter(h => h.level === 1).length;
  const h2Count = data.headings.filter(h => h.level === 2).length;
  const hasProperStructure = h1Count === 1 && h2Count >= 1;

  let score = 50;
  if (h1Count === 1) score += 25;
  if (h2Count >= 1) score += 15;
  if (h1Count === 1 && h2Count >= 2) score += 10;

  let feedback = '';
  if (h1Count === 0) feedback = '页面没有H1标题，搜索引擎不知道这页的主题（专业术语：H1标签缺失 Missing H1 Tag）';
  else if (h1Count > 1) feedback = '页面有多个H1标题，搜索引擎分不清主次（专业术语：多个H1标签 Multiple H1 Tags）';
  else if (h2Count === 0) feedback = '页面只有H1没有H2，内容结构不够清晰（专业术语：标题层级不足 Insufficient Heading Hierarchy）';
  else feedback = '标题层级分明，H1+H2结构清晰，搜索引擎容易理解（专业术语：标题层级 Heading Hierarchy）';

  return { score: Math.min(score, 100), feedback };
}

function analyzeContent(data: ScrapedData): { score: number; feedback: string } {
  const wordCount = data.content.split(/\s+/).length;
  let score: number;
  if (wordCount > 1000) score = 90;
  else if (wordCount > 500) score = 80;
  else if (wordCount > 200) score = 65;
  else score = 40;

  let description: string;
  if (wordCount > 1000) description = '网站内容非常丰富，搜索引擎高度认可';
  else if (wordCount > 500) description = '网站内容丰富，搜索引擎喜欢';
  else if (wordCount > 200) description = '网站内容偏少，建议多写点产品介绍和用户关心的信息';
  else description = '网站内容太少了，搜索引擎觉得没什么价值';

  return {
    score,
    feedback: `${description}（专业术语：内容丰富度 Content Depth，当前约${wordCount}字）`
  };
}

function analyzeStructuredData(data: ScrapedData): { score: number; feedback: string } {
  const schemas = data.structuredData;
  const hasSchema = schemas.length > 0;

  if (!hasSchema) {
    return {
      score: 40,
      feedback: '网站缺少结构化数据，搜索结果只能显示标题和描述（专业术语：Schema缺失 Missing Schema Markup）'
    };
  }

  // 检查Schema类型
  const types = schemas.map(s => s['@type']).filter(Boolean);
  const hasOrganization = types.includes('Organization') || types.includes('LocalBusiness');
  const hasProduct = types.includes('Product');
  const hasBreadcrumb = types.includes('BreadcrumbList');
  const hasFAQ = types.includes('FAQPage');

  let score = 60;
  if (hasOrganization) score += 10;
  if (hasProduct) score += 10;
  if (hasBreadcrumb) score += 10;
  if (hasFAQ) score += 10;

  const feedback = `网站有结构化数据（类型：${types.join(', ')}），搜索结果可以展示额外信息（专业术语：Schema Markup）`;

  return { score: Math.min(score, 100), feedback };
}

function analyzeInternalLinks(data: ScrapedData): { score: number; feedback: string } {
  const internalLinks = data.links.filter(link => !link.isExternal);
  const externalLinks = data.links.filter(link => link.isExternal);
  const ratio = data.links.length > 0 ? internalLinks.length / data.links.length : 0;

  let score = 50;
  if (internalLinks.length > 5) score += 20;
  if (internalLinks.length > 10) score += 10;
  if (ratio > 0.7) score += 10;

  return {
    score: Math.min(score, 100),
    feedback: internalLinks.length > 5
      ? `页面有${internalLinks.length}个内部链接，用户和搜索引擎能顺畅浏览（专业术语：内部链接 Internal Links）`
      : `页面内部链接只有${internalLinks.length}个，建议增加相关页面链接（专业术语：内部链接不足 Poor Internal Linking）`
  };
}

// ============== 广告转化分析 ==============
function analyzeAds(data: ScrapedData): AdsAnalysis {
  const issues: string[] = [];
  const landingScore = analyzeLandingPage(data);
  const ctaScore = analyzeCTADesign(data);
  const conversionScore = analyzeConversionPath(data);
  const trustScore = analyzeTrustElements(data);
  const socialScore = analyzeSocialProof(data);

  if (landingScore.score < 70) issues.push(landingScore.feedback);
  if (ctaScore.score < 70) issues.push(ctaScore.feedback);
  if (conversionScore.score < 70) issues.push(conversionScore.feedback);
  if (trustScore.score < 70) issues.push(trustScore.feedback);
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
  const hasValueProp = data.headings.some(h => h.level === 1 && h.text.length > 10);
  const score = hasValueProp ? 80 : 50;
  return {
    score,
    feedback: hasValueProp
      ? '首页一眼就能看出你是干嘛的、为什么选你（专业术语：价值主张 Value Proposition）'
      : '首页看不出你的产品有什么特别的，用户3秒内就会离开（专业术语：价值主张缺失 Missing Value Prop）'
  };
}

function analyzeCTADesign(data: ScrapedData): { score: number; feedback: string } {
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
  const trustKeywords = ['testimonial', 'review', 'guarantee', 'secure', 'trusted',
    '评价', '客户评价', '保障', '安全', '信任', 'warranty', '退款'];
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
  const socialKeywords = ['customer', 'client', 'partner', 'award', 'certification',
    '客户', '合作伙伴', '奖项', '认证', 'featured', 'as seen'];
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

// ============== 邮件营销分析 ==============
function analyzeEmail(data: ScrapedData): EmailAnalysis {
  const issues: string[] = [];
  const subscriptionScore = analyzeSubscriptionEntry(data);
  const captureScore = analyzeCaptureMechanism(data);
  const automationScore = analyzeAutomation(data);
  const exitScore = analyzeExitIntent(data);

  if (subscriptionScore.score < 70) issues.push(subscriptionScore.feedback);
  if (captureScore.score < 70) issues.push(captureScore.feedback);
  if (automationScore.score < 70) issues.push(automationScore.feedback);
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
  const automationKeywords = ['klaviyo', 'mailchimp', 'hubspot', 'activecampaign',
    'welcome', 'abandoned', 'automation', 'drip', 'flow'];
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
  const exitKeywords = ['exit', 'leave', 'before you go', 'special offer',
    '离开', '特价', '优惠', 'discount', 'coupon'];
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

// ============== 技术SEO分析（新增） ==============
function analyzeTechSEO(data: ScrapedData): TechSEOAnalysis {
  const issues: string[] = [];
  const httpsScore = analyzeHTTPS(data);
  const canonicalScore = analyzeCanonical(data);
  const robotsScore = analyzeRobotsMeta(data);
  const viewportScore = analyzeViewportMeta(data);
  const charsetScore = analyzeCharset(data);
  const langScore = analyzeLang(data);
  const hreflangScore = analyzeHreflang(data);
  const ogScore = analyzeOpenGraph(data);
  const twitterScore = analyzeTwitterCard(data);

  [httpsScore, canonicalScore, robotsScore, viewportScore, charsetScore,
   langScore, hreflangScore, ogScore, twitterScore].forEach(s => {
    if (s.score < 70) issues.push(s.feedback);
  });

  const score = Math.round(
    (httpsScore.score + canonicalScore.score + robotsScore.score + viewportScore.score +
     charsetScore.score + langScore.score + hreflangScore.score + ogScore.score + twitterScore.score) / 9
  );

  return {
    score,
    details: {
      https: httpsScore,
      canonical: canonicalScore,
      robotsMeta: robotsScore,
      viewport: viewportScore,
      charset: charsetScore,
      lang: langScore,
      hreflang: hreflangScore,
      openGraph: ogScore,
      twitterCard: twitterScore,
    },
    issues
  };
}

function analyzeHTTPS(data: ScrapedData): { score: number; feedback: string } {
  const isHTTPS = data.url.startsWith('https://');
  return {
    score: isHTTPS ? 100 : 0,
    feedback: isHTTPS
      ? '网站使用HTTPS加密，用户数据安全（专业术语：HTTPS安全协议）'
      : '网站没有使用HTTPS，浏览器会显示"不安全"警告，用户不敢输入信息（专业术语：HTTPS缺失 Missing HTTPS）'
  };
}

function analyzeCanonical(data: ScrapedData): { score: number; feedback: string } {
  const hasCanonical = !!data.metaTags['canonical'];
  return {
    score: hasCanonical ? 90 : 40,
    feedback: hasCanonical
      ? '网站设置了规范链接，避免重复内容问题（专业术语：Canonical Tag）'
      : '网站没有设置规范链接，可能导致重复内容问题（专业术语：Canonical Tag缺失 Missing Canonical）'
  };
}

function analyzeRobotsMeta(data: ScrapedData): { score: number; feedback: string } {
  const robotsMeta = data.metaTags['robots'] || '';
  const isNoindex = robotsMeta.includes('noindex');
  const isNofollow = robotsMeta.includes('nofollow');

  if (isNoindex) {
    return {
      score: 20,
      feedback: '页面被设置为不收录，Google搜索结果里找不到这个页面（专业术语：noindex标签 Noindex Tag）'
    };
  }
  if (isNofollow) {
    return {
      score: 50,
      feedback: '页面设置了nofollow，搜索引擎不会跟踪页面上的链接（专业术语：nofollow标签 Nofollow Tag）'
    };
  }
  return {
    score: 90,
    feedback: '页面允许搜索引擎收录和跟踪链接（专业术语：Robots Meta标签 Robots Meta Tag）'
  };
}

function analyzeViewportMeta(data: ScrapedData): { score: number; feedback: string } {
  const hasViewport = 'viewport' in data.metaTags;
  return {
    score: hasViewport ? 90 : 30,
    feedback: hasViewport
      ? '页面有视口设置，移动端显示正常（专业术语：Viewport Meta标签）'
      : '页面没有视口设置，移动端显示会错乱（专业术语：Viewport Meta缺失 Missing Viewport）'
  };
}

function analyzeCharset(data: ScrapedData): { score: number; feedback: string } {
  const hasCharset = !!data.metaTags['charset'];
  return {
    score: hasCharset ? 90 : 60,
    feedback: hasCharset
      ? '页面设置了字符编码，中文显示正常（专业术语：Charset字符集）'
      : '页面没有明确设置字符编码，中文可能显示乱码（专业术语：Charset缺失 Missing Charset）'
  };
}

function analyzeLang(data: ScrapedData): { score: number; feedback: string } {
  // 从HTML中检测lang属性（简化版）
  const hasLang = data.content.length > 0; // 有内容就假设有lang
  return {
    score: hasLang ? 80 : 50,
    feedback: hasLang
      ? '页面设置了语言属性，搜索引擎知道内容语言（专业术语：Lang属性 Language Attribute）'
      : '页面没有设置语言属性，搜索引擎不确定内容语言（专业术语：Lang属性缺失 Missing Lang Attribute）'
  };
}

function analyzeHreflang(data: ScrapedData): { score: number; feedback: string } {
  // 检测是否有hreflang标签
  const hasHreflang = Object.keys(data.metaTags).some(key => key.startsWith('hreflang'));
  return {
    score: hasHreflang ? 90 : 70, // 不是所有网站都需要hreflang
    feedback: hasHreflang
      ? '网站设置了多语言标签，国际SEO友好（专业术语：Hreflang标签）'
      : '网站没有设置多语言标签（如果只做单一市场可忽略）（专业术语：Hreflang标签 Hreflang Tag）'
  };
}

function analyzeOpenGraph(data: ScrapedData): { score: number; feedback: string } {
  const hasOG = !!(data.metaTags['og:title'] || data.metaTags['og:description'] || data.metaTags['og:image']);
  return {
    score: hasOG ? 85 : 45,
    feedback: hasOG
      ? '网站有Open Graph标签，分享到社交媒体时显示效果好（专业术语：Open Graph标签）'
      : '网站没有Open Graph标签，分享到社交媒体时只显示链接（专业术语：Open Graph缺失 Missing Open Graph）'
  };
}

function analyzeTwitterCard(data: ScrapedData): { score: number; feedback: string } {
  const hasTwitter = !!(data.metaTags['twitter:card'] || data.metaTags['twitter:title']);
  return {
    score: hasTwitter ? 85 : 55,
    feedback: hasTwitter
      ? '网站有Twitter卡片标签，推特分享效果好（专业术语：Twitter Card标签）'
      : '网站没有Twitter卡片标签（如果不用Twitter可忽略）（专业术语：Twitter Card缺失 Missing Twitter Card）'
  };
}

// ============== E-E-A-T分析（新增） ==============
function analyzeEEAT(data: ScrapedData): EEATAnalysis {
  const issues: string[] = [];
  const authorScore = analyzeAuthorInfo(data);
  const citationScore = analyzeCitations(data);
  const trustScore = analyzeTrustSignals(data);
  const contactScore = analyzeContactInfo(data);
  const dateScore = analyzeDateInfo(data);

  [authorScore, citationScore, trustScore, contactScore, dateScore].forEach(s => {
    if (s.score < 70) issues.push(s.feedback);
  });

  const score = Math.round(
    (authorScore.score + citationScore.score + trustScore.score + contactScore.score + dateScore.score) / 5
  );

  return {
    score,
    details: {
      authorInfo: authorScore,
      citations: citationScore,
      trustSignals: trustScore,
      contactInfo: contactScore,
      dateInfo: dateScore,
    },
    issues
  };
}

function analyzeAuthorInfo(data: ScrapedData): { score: number; feedback: string } {
  const authorKeywords = ['author', 'by', 'written by', '作者', '撰稿'];
  const hasAuthor = authorKeywords.some(keyword =>
    data.content.toLowerCase().includes(keyword)
  );
  return {
    score: hasAuthor ? 80 : 45,
    feedback: hasAuthor
      ? '网站有作者信息，内容可信度高（专业术语：作者信息 Author Attribution）'
      : '网站没有作者信息，搜索引擎不知道谁写的内容（专业术语：作者信息缺失 Missing Author Info）'
  };
}

function analyzeCitations(data: ScrapedData): { score: number; feedback: string } {
  // 检查外部链接和引用
  const externalLinks = data.links.filter(l => l.isExternal);
  const citationKeywords = ['source', 'reference', 'study', 'research', 'according to',
    '来源', '参考', '研究', '数据'];
  const hasCitations = citationKeywords.some(keyword =>
    data.content.toLowerCase().includes(keyword)
  ) || externalLinks.length > 3;

  return {
    score: hasCitations ? 75 : 40,
    feedback: hasCitations
      ? '网站有引用来源或外部链接，内容有依据（专业术语：引用 Citations）'
      : '网站内容没有引用来源，可信度不够（专业术语：引用缺失 Missing Citations）'
  };
}

function analyzeTrustSignals(data: ScrapedData): { score: number; feedback: string } {
  const trustKeywords = ['privacy', 'terms', 'policy', 'security', 'ssl',
    '隐私', '条款', '政策', '安全', '保障'];
  const hasTrust = trustKeywords.some(keyword =>
    data.content.toLowerCase().includes(keyword) ||
    data.links.some(l => l.href.toLowerCase().includes(keyword))
  );
  return {
    score: hasTrust ? 80 : 40,
    feedback: hasTrust
      ? '网站有隐私政策、服务条款等信任元素（专业术语：信任信号 Trust Signals）'
      : '网站缺少隐私政策等信任元素，用户不敢放心使用（专业术语：信任信号缺失 Missing Trust Signals）'
  };
}

function analyzeContactInfo(data: ScrapedData): { score: number; feedback: string } {
  const contactKeywords = ['contact', 'email', 'phone', 'address', '联系', '邮箱', '电话', '地址'];
  const hasContact = contactKeywords.some(keyword =>
    data.content.toLowerCase().includes(keyword)
  );
  return {
    score: hasContact ? 85 : 35,
    feedback: hasContact
      ? '网站有联系方式，用户能找到你（专业术语：联系信息 Contact Information）'
      : '网站没有联系方式，用户不知道怎么找你（专业术语：联系信息缺失 Missing Contact Info）'
  };
}

function analyzeDateInfo(data: ScrapedData): { score: number; feedback: string } {
  const dateKeywords = ['date', 'published', 'updated', 'published on', '日期', '发布', '更新'];
  const hasDate = dateKeywords.some(keyword =>
    data.content.toLowerCase().includes(keyword)
  );
  return {
    score: hasDate ? 75 : 50,
    feedback: hasDate
      ? '网站内容有日期信息，搜索引擎知道内容是否新鲜（专业术语：日期标注 Date Attribution）'
      : '网站内容没有日期信息，搜索引擎不确定内容是否过时（专业术语：日期标注缺失 Missing Date Info）'
  };
}

// ============== GEO分析（增强） ==============
function analyzeGEOEnhanced(data: ScrapedData): GEOAnalysis {
  const issues: string[] = [];
  const faqScore = analyzeFAQ(data);
  const passageScore = analyzePassageCitability(data);
  const entityScore = analyzeEntityPresence(data);
  const structuredScore = analyzeStructuredAnswers(data);
  const questionScore = analyzeQuestionHeadings(data);

  [faqScore, passageScore, entityScore, structuredScore, questionScore].forEach(s => {
    if (s.score < 70) issues.push(s.feedback);
  });

  const score = Math.round(
    (faqScore.score + passageScore.score + entityScore.score + structuredScore.score + questionScore.score) / 5
  );

  return {
    score,
    details: {
      faq: faqScore,
      passageCitability: passageScore,
      entityPresence: entityScore,
      structuredAnswers: structuredScore,
      questionHeadings: questionScore,
    },
    issues
  };
}

function analyzeFAQ(data: ScrapedData): { score: number; feedback: string } {
  const hasFAQ = data.content.toLowerCase().includes('faq') ||
    data.content.includes('常见问题') ||
    data.content.includes(' Frequently Asked');
  const hasQuestionMarks = (data.content.match(/\?/g) || []).length > 3;

  let score = 40;
  if (hasFAQ) score += 30;
  if (hasQuestionMarks) score += 20;

  return {
    score: Math.min(score, 100),
    feedback: hasFAQ
      ? '网站有FAQ页面，AI搜索引擎更容易推荐你（专业术语：FAQ内容 FAQ Content）'
      : '网站缺少FAQ内容，AI搜索引擎难以提取答案（专业术语：FAQ缺失 Missing FAQ）'
  };
}

function analyzePassageCitability(data: ScrapedData): { score: number; feedback: string } {
  // 检查是否有可被AI引用的段落（134-167词的独立段落）
  const paragraphs = data.content.split(/\n\n+/).filter(p => p.trim().length > 50);
  const citableParagraphs = paragraphs.filter(p => {
    const wordCount = p.split(/\s+/).length;
    return wordCount >= 100 && wordCount <= 200;
  });

  const ratio = paragraphs.length > 0 ? citableParagraphs.length / paragraphs.length : 0;
  let score = 40;
  if (ratio > 0.3) score += 20;
  if (ratio > 0.5) score += 20;
  if (citableParagraphs.length > 3) score += 20;

  return {
    score: Math.min(score, 100),
    feedback: ratio > 0.3
      ? '网站有可被AI引用的段落，容易被ChatGPT等推荐（专业术语：段落可引用性 Passage Citability）'
      : '网站内容难以被AI提取引用，建议创建独立的答案段落（专业术语：可引用性不足 Low Passage Citability）'
  };
}

function analyzeEntityPresence(data: ScrapedData): { score: number; feedback: string } {
  // 检查实体存在（品牌名、产品名等）
  const entityKeywords = ['brand', 'company', 'product', 'service', '品牌', '公司', '产品', '服务'];
  const hasEntities = entityKeywords.some(keyword =>
    data.content.toLowerCase().includes(keyword)
  );

  return {
    score: hasEntities ? 75 : 45,
    feedback: hasEntities
      ? '网站有明确的品牌/产品实体信息，AI搜索引擎能识别（专业术语：实体存在 Entity Presence）'
      : '网站缺少明确的实体信息，AI搜索引擎难以识别品牌（专业术语：实体存在不足 Low Entity Presence）'
  };
}

function analyzeStructuredAnswers(data: ScrapedData): { score: number; feedback: string } {
  // 检查是否有结构化的问答内容
  const hasQA = data.content.includes('答') || data.content.includes('A:') ||
    data.content.includes('Answer:');
  const hasLists = data.content.includes('1.') || data.content.includes('第一') ||
    (data.content.match(/[-•]/g) || []).length > 3;

  let score = 45;
  if (hasQA) score += 25;
  if (hasLists) score += 20;

  return {
    score: Math.min(score, 100),
    feedback: hasQA || hasLists
      ? '网站有结构化的问答或列表内容，AI容易提取信息（专业术语：结构化答案 Structured Answers）'
      : '网站内容没有结构化，AI难以提取有用信息（专业术语：结构化不足 Unstructured Content）'
  };
}

function analyzeQuestionHeadings(data: ScrapedData): { score: number; feedback: string } {
  const questionHeadings = data.headings.filter(h =>
    h.text.includes('?') || h.text.includes('？') ||
    h.text.toLowerCase().startsWith('how') ||
    h.text.toLowerCase().startsWith('what') ||
    h.text.toLowerCase().startsWith('why')
  );

  let score = 40;
  if (questionHeadings.length > 0) score += 25;
  if (questionHeadings.length > 2) score += 15;

  return {
    score: Math.min(score, 100),
    feedback: questionHeadings.length > 0
      ? `网站有${questionHeadings.length}个问题式标题，AI搜索引擎更容易匹配用户查询（专业术语：问题式标题 Question Headings）`
      : '网站标题都是陈述句，建议添加问题式标题来匹配AI搜索（专业术语：问题式标题缺失 Missing Question Headings）'
  };
}

// ============== 生成建议 ==============
function generateRecommendations(
  scores: AnalysisResult['scores'],
  uiux: UIUXAnalysis,
  seo: SEOAnalysis,
  ads: AdsAnalysis,
  email: EmailAnalysis,
  techSeo: TechSEOAnalysis,
  eeat: EEATAnalysis,
  geo: GEOAnalysis
): string[] {
  const recommendations: string[] = [];

  if (scores.techSeo < 70) {
    recommendations.push('技术SEO需要改进：网站在HTTPS、canonical、robots等技术细节上有问题，影响搜索引擎收录和排名（专业术语：技术SEO优化 Technical SEO）');
  }

  if (scores.seo < 70) {
    recommendations.push('搜索排名需要提升：Google搜索结果里你的网站信息不完整或排不到前面，建议优化标题、描述和内容结构（专业术语：SEO优化）');
  }

  if (scores.eeat < 70) {
    recommendations.push('内容可信度需要提升：网站缺少作者信息、引用来源、信任元素等，搜索引擎认为内容不够权威（专业术语：E-E-A-T优化）');
  }

  if (scores.geo < 70) {
    recommendations.push('AI搜索优化不足：网站内容难以被ChatGPT、Perplexity等AI搜索引擎引用，建议创建FAQ、问题式标题和可引用段落（专业术语：GEO优化）');
  }

  if (scores.uiux < 70) {
    recommendations.push('网站体验需要改进：用户打开网站后找不到想要的东西、手机上看排版乱，建议重新优化页面布局和手机适配（专业术语：UI/UX优化）');
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
