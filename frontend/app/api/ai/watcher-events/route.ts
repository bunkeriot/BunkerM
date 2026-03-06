import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'

export const dynamic = 'force-dynamic'

const CONFIG_FILE = '/nextjs/data/bunkerai_config.json'

function readConfig() {
  try { return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8')) }
  catch { return {} }
}

export async function GET(request: NextRequest) {
  const config = readConfig()
  if (!config.api_key || !config.cloud_url) {
    return NextResponse.json({ events: [] })
  }
  const since = request.nextUrl.searchParams.get('since')
  const url = `${config.cloud_url}/watchers/events${since ? `?since=${encodeURIComponent(since)}` : ''}`
  try {
    const resp = await fetch(url, { headers: { 'x-api-key': config.api_key } })
    const data = await resp.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ events: [] })
  }
}
