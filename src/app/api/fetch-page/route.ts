import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'url param required' }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `HTTP ${res.status}` }, { status: 502 });
    }

    const contentType = res.headers.get('content-type') || '';
    const html = await res.text();

    // Validate it's actually HTML, not an error page or empty
    if (!html || html.trim().length < 50) {
      return NextResponse.json({ error: 'Empty or too short response' }, { status: 502 });
    }

    // If content-type suggests JSON (error response), reject
    if (contentType.includes('application/json') && !html.trim().startsWith('<')) {
      return NextResponse.json({ error: 'Got JSON instead of HTML' }, { status: 502 });
    }

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'fetch failed' }, { status: 502 });
  }
}
