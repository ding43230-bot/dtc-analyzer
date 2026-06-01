import { NextRequest, NextResponse } from 'next/server';
import { scrapeMultiplePages } from '@/lib/scraper';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    console.log('Scraping website (multi-page):', url);
    const startTime = Date.now();
    const data = await scrapeMultiplePages(url);
    console.log(`Scraping completed in ${Date.now() - startTime}ms (${data.pages.length} sub-pages)`);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Scrape error:', error);
    return NextResponse.json(
      { error: 'Scrape failed: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}
