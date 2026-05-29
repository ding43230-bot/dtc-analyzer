import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    apiBase: process.env.MIMO_API_BASE || '',
    model: process.env.MIMO_MODEL || 'mimo-v2.5-pro',
    // Don't expose API key - client will use a proxy endpoint
  });
}
