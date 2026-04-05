import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'

export const dynamic = 'force-dynamic'

const CONFIG_FILE = '/nextjs/data/bunkerai_config.json'

function readConfig() {
  try { return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8')) }
  catch { return {} }
}

export async function POST(request: NextRequest) {
  const { topics, payloads } = await request.json()

  if (!Array.isArray(topics) || topics.length === 0) {
    return NextResponse.json({ error: 'topics array is required' }, { status: 400 })
  }

  const config = readConfig()
  if (!config.api_key || !config.cloud_url) {
    return NextResponse.json({ error: 'BunkerAI Cloud not configured' }, { status: 503 })
  }

  try {
    const resp = await fetch(`${config.cloud_url}/ai/annotate`, { cache: 'no-store',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': config.api_key },
      body: JSON.stringify({ topics, payloads: payloads ?? {} }),
    })
    const data = await resp.json()
    if (!resp.ok) {
      return NextResponse.json({ error: data.detail ?? 'Cloud error' }, { status: 502 })
    }
    return NextResponse.json(data)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Cloud unreachable: ${msg}` }, { status: 502 })
  }
}
