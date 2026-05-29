import { NextRequest, NextResponse } from 'next/server';
import { runFullAIAnalysis } from '@/lib/ai-analyzer';
import { matchServices } from '@/lib/service-matcher';
import { generateReport } from '@/lib/report-generator';
import { getCache, setCache } from '@/lib/cache';
import { saveReport } from '@/lib/report-store';

export async function POST(request: NextRequest) {
  try {
    const { url, scrapedData } = await request.json();

    if (!url || !scrapedData) {
      return NextResponse.json({ error: 'URL and scrapedData required' }, { status: 400 });
    }

    // 检查缓存
    const cacheKey = `analysis:${url}`;
    const cachedResult = getCache(cacheKey);

    if (cachedResult) {
      return NextResponse.json({ success: true, cached: true, ...cachedResult });
    }

    // AI 分析（四个专家 agent 并行）
    console.log('Running AI analysis for:', url);
    const startTime = Date.now();
    const aiAnalysis = await runFullAIAnalysis(scrapedData);
    console.log(`AI analysis completed in ${Date.now() - startTime}ms`);

    // Match services
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
    const report = await generateReport(analysisForMatching, recommendations);

    const result = {
      reportId: report.id,
      analysis: {
        scores: aiAnalysis.scores,
        uiux: { score: aiAnalysis.uiux.score, summary: aiAnalysis.uiux.summary, checks: aiAnalysis.uiux.checks, issues: aiAnalysis.uiux.issues, suggestions: aiAnalysis.uiux.suggestions },
        seo: { score: aiAnalysis.seo.score, summary: aiAnalysis.seo.summary, checks: aiAnalysis.seo.checks, issues: aiAnalysis.seo.issues, suggestions: aiAnalysis.seo.suggestions },
        ads: { score: aiAnalysis.ads.score, summary: aiAnalysis.ads.summary, checks: aiAnalysis.ads.checks, issues: aiAnalysis.ads.issues, suggestions: aiAnalysis.ads.suggestions },
        email: { score: aiAnalysis.email.score, summary: aiAnalysis.email.summary, checks: aiAnalysis.email.checks, issues: aiAnalysis.email.issues, suggestions: aiAnalysis.email.suggestions },
      },
      recommendations,
      reportUrl: `/report/${report.id}`,
    };

    saveReport(report.id, { id: report.id, url, timestamp: report.timestamp, scores: aiAnalysis.scores, recommendations, analysis: result.analysis });
    setCache(cacheKey, result);

    return NextResponse.json({ success: true, cached: false, ...result });
  } catch (error) {
    console.error('AI analysis error:', error);
    return NextResponse.json(
      { error: 'AI analysis failed: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
