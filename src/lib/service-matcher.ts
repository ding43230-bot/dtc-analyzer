import { AnalysisResult } from './types';
import servicesData from '@/data/services.json';

export interface ServiceRecommendation {
  serviceId: string;
  serviceName: string;
  category: string;
  price: string;
  priceCNY: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  matchScore: number;
}

export function matchServices(analysis: AnalysisResult): ServiceRecommendation[] {
  const recommendations: ServiceRecommendation[] = [];

  // Analyze each dimension and recommend services
  if (analysis.scores.uiux < 70) {
    recommendations.push({
      serviceId: 'website-basic',
      serviceName: '网站建设基础版',
      category: 'A类全案服务包',
      price: '$2,200 USD',
      priceCNY: '约¥15,000',
      priority: 'high',
      reason: `UI/UX评分较低(${analysis.scores.uiux}分)，网站需要重新设计以提升用户体验`,
      matchScore: 100 - analysis.scores.uiux
    });
  }

  if (analysis.scores.seo < 70) {
    recommendations.push({
      serviceId: 'seo-geo',
      serviceName: 'SEO/GEO基础服务包',
      category: 'A类全案服务包',
      price: '$2,500/月',
      priceCNY: '约¥18,000/月',
      priority: 'high',
      reason: `SEO评分较低(${analysis.scores.seo}分)，需要优化搜索引擎可见性和AI搜索布局`,
      matchScore: 100 - analysis.scores.seo
    });
  }

  if (analysis.scores.ads < 70) {
    recommendations.push({
      serviceId: 'ads-startup',
      serviceName: '广告投放启动',
      category: 'A类全案服务包',
      price: '服务费：广告消耗×5-12%',
      priceCNY: '广告预算建议¥10,000/月起',
      priority: 'high',
      reason: `广告转化评分较低(${analysis.scores.ads}分)，需要专业广告投放提升流量和转化`,
      matchScore: 100 - analysis.scores.ads
    });
  }

  if (analysis.scores.email < 70) {
    recommendations.push({
      serviceId: 'email-setup',
      serviceName: '邮件营销搭建',
      category: 'A类全案服务包',
      price: '一次性+持续优化',
      priceCNY: '',
      priority: 'medium',
      reason: `邮件营销评分较低(${analysis.scores.email}分)，需要搭建邮件自动化系统`,
      matchScore: 100 - analysis.scores.email
    });
  }

  if (analysis.scores.tech < 70) {
    recommendations.push({
      serviceId: 'website-basic',
      serviceName: '网站技术优化',
      category: 'A类全案服务包',
      price: '$2,200 USD',
      priceCNY: '约¥15,000',
      priority: 'medium',
      reason: `技术性能评分较低(${analysis.scores.tech}分)，需要优化页面速度、安全性和可访问性`,
      matchScore: 100 - analysis.scores.tech
    });
  }

  if (analysis.scores.brand < 70) {
    recommendations.push({
      serviceId: 'website-basic',
      serviceName: '品牌故事优化',
      category: 'A类全案服务包',
      price: '$2,200 USD',
      priceCNY: '约¥15,000',
      priority: 'medium',
      reason: `品牌故事评分较低(${analysis.scores.brand}分)，需要优化品牌叙事和视觉传达`,
      matchScore: 100 - analysis.scores.brand
    });
  }

  // If multiple issues, recommend full package
  const lowScores = [
    analysis.scores.uiux < 70,
    analysis.scores.seo < 70,
    analysis.scores.ads < 70,
    analysis.scores.email < 70,
    analysis.scores.tech < 70,
    analysis.scores.brand < 70
  ].filter(Boolean).length;

  if (lowScores >= 3) {
    recommendations.unshift({
      serviceId: 'full-package',
      serviceName: 'A类全案服务包',
      category: '全案服务',
      price: '根据需求定制',
      priceCNY: '',
      priority: 'high',
      reason: `多个维度需要优化(${lowScores}个维度评分低于70)，建议采用全案服务包`,
      matchScore: 90
    });
  }

  // Sort by priority and match score
  recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.matchScore - a.matchScore;
  });

  return recommendations;
}

export function getServiceDetails(serviceId: string) {
  for (const category of servicesData.categories) {
    const service = category.services.find(s => s.id === serviceId);
    if (service) {
      return { ...service, category: category.name };
    }
  }
  return null;
}
