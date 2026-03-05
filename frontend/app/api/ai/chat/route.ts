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

  if (!config.api_key || !config.cloud_url) {
    return NextResponse.json({ messages: [] })
  }

  try {
    const resp = await fetch(
      `${config.cloud_url}/chat/history`,
      { headers: { 'x-api-key': config.api_key } },
    )
    const data = await resp.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ messages: [] })
  }
}

export async function POST(request: Request) {
  const { message, user_id } = await request.json()
  const config = readConfig()

  if (!config.api_key || !config.cloud_url) {
    return NextResponse.json({ error: 'BunkerAI Cloud not configured' }, { status: 503 })
  }

  try {
    const resp = await fetch(`${config.cloud_url}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': config.api_key },
      body: JSON.stringify({ message, user_id }),
    })
    const data = await resp.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Cloud service unreachable' }, { status: 502 })
  }
}
