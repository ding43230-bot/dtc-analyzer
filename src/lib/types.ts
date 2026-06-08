export interface AnalysisResult {
  url: string;
  timestamp: string;
  scores: {
    uiux: number;
    seo: number;
    ads: number;
    email: number;
    tech: number;
    brand: number;
    overall: number;
  };
  uiux: UIUXAnalysis;
  seo: SEOAnalysis;
  ads: AdsAnalysis;
  email: EmailAnalysis;
  tech: TechAnalysis;
  brand: BrandAnalysis;
  recommendations: string[];
}

export interface TechAnalysis {
  score: number;
  details: {
    performance: { score: number; feedback: string };
    security: { score: number; feedback: string };
    accessibility: { score: number; feedback: string };
    mobile: { score: number; feedback: string };
  };
  issues: string[];
}

export interface BrandAnalysis {
  score: number;
  details: {
    storytelling: { score: number; feedback: string };
    visualIdentity: { score: number; feedback: string };
    trustSignals: { score: number; feedback: string };
    emotionalConnection: { score: number; feedback: string };
  };
  issues: string[];
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
    trustSignals: { score: number; feedback: string };
  };
  issues: string[];
}

export interface EmailAnalysis {
  score: number;
  details: {
    signupForm: { score: number; feedback: string };
    incentives: { score: number; feedback: string };
    emailCapture: { score: number; feedback: string };
    tools: { score: number; feedback: string };
  };
  issues: string[];
}
