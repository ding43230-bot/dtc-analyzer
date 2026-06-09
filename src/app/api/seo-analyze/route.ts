import { NextRequest, NextResponse } from 'next/server';
import { analyzeSEO, analyzeEEATDepth, analyzeGEODepth } from '@/lib/ai-analyzer';
import { ScrapedData } from '@/lib/scraper';

export async function POST(request: NextRequest) {
  try {
    const { url, scrapedData } = await request.json();

    if (!url || !scrapedData) {
      return NextResponse.json({ error: 'URL and scrapedData required' }, { status: 400 });
    }

    console.log('Running SEO-only analysis for:', url);
    const startTime = Date.now();

    // 只跑3个SEO相关的agent，大幅减少耗时
    const [seo, eeat, geo] = await Promise.all([
      analyzeSEO(scrapedData as ScrapedData),
      analyzeEEATDepth(scrapedData as ScrapedData),
      analyzeGEODepth(scrapedData as ScrapedData),
    ]);

    console.log(`SEO analysis completed in ${Date.now() - startTime}ms`);

    const scores = {
      seo: seo.score,
      eeat: eeat.score,
      geo: geo.score,
      overall: Math.round((seo.score + eeat.score + geo.score) / 3),
    };

    return NextResponse.json({
      success: true,
      analysis: { seo, eeat, geo },
      scores,
    });
  } catch (error) {
    console.error('SEO analysis error:', error);
    return NextResponse.json(
      { error: 'SEO analysis failed: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
