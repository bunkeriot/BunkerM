import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const CLOUD_URL = process.env.BUNKERAI_CLOUD_URL || 'https://api.bunkerai.dev'

export async function POST(request: NextRequest) {
  const body = await request.json()
  try {
    const resp = await fetch(`${CLOUD_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    })
    const data = await resp.json()
    return NextResponse.json(data, { status: resp.status })
  } catch {
    return NextResponse.json({ error: 'Cloud service unreachable' }, { status: 502 })
  }
}
