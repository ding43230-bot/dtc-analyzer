import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

    let domain: string;
    try { domain = new URL(url).hostname.replace('www.', ''); } catch { return NextResponse.json({ error: 'Invalid URL' }, { status: 400 }); }

    // SimilarWeb 需要浏览器渲染，Vercel 环境 Chromium 不可用
    // 降级：返回 SimilarWeb 页面链接 + 提示
    return NextResponse.json({
      success: true,
      data: {
        url: `https://www.similarweb.com/website/${domain}/`,
        globalRank: '-',
        countryRank: '-',
        categoryRank: '-',
        totalVisits: '-',
        bounceRate: '-',
        pagesPerVisit: '-',
        avgVisitDuration: '-',
        trafficSources: [],
        topCountries: [],
        genderDistribution: { male: '-', female: '-' },
        ageDistribution: [],
        competitors: [],
        note: 'Vercel 环境暂不支持 SimilarWeb 抓取，请点击链接手动查看',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch SimilarWeb data: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
