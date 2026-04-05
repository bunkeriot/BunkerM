import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const AGENT_API = 'http://127.0.0.1:1006'
const API_KEY = process.env.API_KEY ?? 'default_api_key_replace_in_production'

export async function GET(request: NextRequest) {
  const since = request.nextUrl.searchParams.get('since')
  const url = `${AGENT_API}/watcher-events${since ? `?since=${encodeURIComponent(since)}` : ''}`
  try {
    const resp = await fetch(url, { headers: { 'x-api-key': API_KEY } })
    const data = await resp.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ events: [] })
  }
}
