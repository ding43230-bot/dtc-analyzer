import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { messages, temperature = 0.2, max_tokens = 2500 } = await request.json();

    const apiBase = process.env.MIMO_API_BASE;
    const apiKey = process.env.MIMO_API_KEY;
    const model = process.env.MIMO_MODEL || 'mimo-v2.5-pro';

    if (!apiBase || !apiKey) {
      return NextResponse.json({ error: 'API not configured' }, { status: 500 });
    }

    const response = await fetch(`${apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens,
      }),
      signal: AbortSignal.timeout(9000),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      return NextResponse.json({ error: `MiMo API error: ${response.status}`, detail: text }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Proxy error' }, { status: 500 });
  }
}
