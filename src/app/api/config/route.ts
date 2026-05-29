import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    apiBase: process.env.MIMO_API_BASE || '',
    apiKey: process.env.MIMO_API_KEY || '',
    model: process.env.MIMO_MODEL || 'mimo-v2.5-pro',
  });
}
