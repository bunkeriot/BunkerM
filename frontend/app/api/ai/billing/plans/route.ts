import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'

export const dynamic = 'force-dynamic'

const CONFIG_FILE = '/nextjs/data/bunkerai_config.json'

function readConfig() {
  try { return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8')) }
  catch { return {} }
}

export async function GET() {
  const config = readConfig()
  if (!config.cloud_url) {
    return NextResponse.json({ error: 'BunkerAI Cloud not configured' }, { status: 503 })
  }
  try {
    const resp = await fetch(`${config.cloud_url}/billing/plans`, { cache: 'no-store' })
    const data = await resp.json()
    return NextResponse.json(data, { status: resp.status })
  } catch {
    return NextResponse.json({ error: 'Cloud service unreachable' }, { status: 502 })
  }
}
