import { NextRequest, NextResponse } from 'next/server';
import { scrapeWebsite } from '@/lib/scraper';
import { runFullAIAnalysis } from '@/lib/ai-analyzer';
import { matchServices } from '@/lib/service-matcher';
import { generateReport } from '@/lib/report-generator';
import { getCache, setCache } from '@/lib/cache';
import { saveReport } from '@/lib/report-store';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // 检查缓存
    const cacheKey = `analysis:${url}`;
    const cachedResult = getCache(cacheKey);

    if (cachedResult) {
      console.log('Returning cached result for:', url);

      // 确保报告已保存
      if (cachedResult.reportId) {
        const { getReport } = await import('@/lib/report-store');
        const existingReport = getReport(cachedResult.reportId);
        if (!existingReport) {
          const { saveReport } = await import('@/lib/report-store');
          saveReport(cachedResult.reportId, {
            id: cachedResult.reportId,
            url: url,
            timestamp: new Date().toISOString(),
            scores: cachedResult.analysis?.scores || {},
            recommendations: cachedResult.recommendations || [],
            analysis: cachedResult.analysis || {}
          });
        }
      }

      return NextResponse.json({
        success: true,
        cached: true,
        ...cachedResult
      });
    }

    // Step 1: Scrape the website
    console.log('Scraping website:', url);
    const startTime = Date.now();
    const scrapedData = await scrapeWebsite(url);
    console.log(`Scraping completed in ${Date.now() - startTime}ms`);

    // Step 2: AI 深度分析（四个专家 agent 并行）
    console.log('Running AI analysis with domain experts...');
    const aiAnalysis = await runFullAIAnalysis(scrapedData);
    console.log(`AI analysis completed in ${Date.now() - startTime}ms`);

    // Step 3: Match services
    console.log('Matching services...');
    const analysisForMatching = {
      url,
      timestamp: new Date().toISOString(),
      scores: aiAnalysis.scores,
      uiux: { score: aiAnalysis.uiux.score, issues: aiAnalysis.uiux.issues } as any,
      seo: { score: aiAnalysis.seo.score, issues: aiAnalysis.seo.issues } as any,
      ads: { score: aiAnalysis.ads.score, issues: aiAnalysis.ads.issues } as any,
      email: { score: aiAnalysis.email.score, issues: aiAnalysis.email.issues } as any,
      recommendations: [] as string[],
    };
    const recommendations = matchServices(analysisForMatching);

    // Step 4: Generate report
    console.log('Generating report...');
    const report = await generateReport(analysisForMatching, recommendations);

    const result = {
      reportId: report.id,
      analysis: {
        scores: aiAnalysis.scores,
        uiux: {
          score: aiAnalysis.uiux.score,
          summary: aiAnalysis.uiux.summary,
          checks: aiAnalysis.uiux.checks,
          issues: aiAnalysis.uiux.issues,
          suggestions: aiAnalysis.uiux.suggestions,
        },
        seo: {
          score: aiAnalysis.seo.score,
          summary: aiAnalysis.seo.summary,
          checks: aiAnalysis.seo.checks,
          issues: aiAnalysis.seo.issues,
          suggestions: aiAnalysis.seo.suggestions,
        },
        ads: {
          score: aiAnalysis.ads.score,
          summary: aiAnalysis.ads.summary,
          checks: aiAnalysis.ads.checks,
          issues: aiAnalysis.ads.issues,
          suggestions: aiAnalysis.ads.suggestions,
        },
        email: {
          score: aiAnalysis.email.score,
          summary: aiAnalysis.email.summary,
          checks: aiAnalysis.email.checks,
          issues: aiAnalysis.email.issues,
          suggestions: aiAnalysis.email.suggestions,
        },
      },
      recommendations,
      reportUrl: `/report/${report.id}`
    };

    // 保存报告
    saveReport(report.id, {
      id: report.id,
      url: url,
      timestamp: report.timestamp,
      scores: aiAnalysis.scores,
      recommendations,
      analysis: result.analysis
    });

    // 缓存结果
    setCache(cacheKey, result);

    console.log(`Full analysis completed in ${Date.now() - startTime}ms`);

    return NextResponse.json({
      success: true,
      cached: false,
      ...result
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
