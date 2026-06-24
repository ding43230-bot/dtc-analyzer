import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { messages, temperature = 0.2, max_tokens = 2500 } = await request.json();

    const apiBase = process.env.NEXT_PUBLIC_MIMO_API_BASE;
    const apiKey = process.env.NEXT_PUBLIC_MIMO_API_KEY;
    const model = process.env.NEXT_PUBLIC_MIMO_MODEL || 'mimo-v2.5-pro';

    if (!apiBase || !apiKey) {
      return NextResponse.json({ error: 'API not configured', hasBase: !!apiBase, hasKey: !!apiKey }, { status: 500 });
    }

    // Extract system message (Anthropic format)
    const systemMsg = messages.find((m: any) => m.role === 'system')?.content || '';
    const userMsgs = messages.filter((m: any) => m.role !== 'system').map((m: any) => ({
      role: m.role,
      content: m.content,
    }));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    let response: Response;
    try {
      response = await fetch(`${apiBase}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens,
          system: systemMsg,
          messages: userMsgs,
        }),
        signal: controller.signal,
      });
    } catch (fetchErr: any) {
      clearTimeout(timeout);
      return NextResponse.json({ error: `Fetch failed: ${fetchErr?.message}`, code: fetchErr?.code }, { status: 502 });
    }
    clearTimeout(timeout);

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      return NextResponse.json({ error: `MiMo API ${response.status}`, body: text.substring(0, 500) }, { status: 502 });
    }

    const data = await response.json();
    // Convert Anthropic response to OpenAI-compatible format for backward compatibility
    const textBlock = data.content?.find((b: any) => b.type === 'text');
    const content = textBlock?.text || '';
    return NextResponse.json({
      choices: [{ message: { content } }],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message, stack: error?.stack?.substring(0, 200) }, { status: 500 });
  }
}
