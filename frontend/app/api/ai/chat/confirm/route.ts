import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'

export const dynamic = 'force-dynamic'

const CONFIG_FILE = '/nextjs/data/bunkerai_config.json'
const AGENT_API = 'http://127.0.0.1:1006'
const API_KEY = process.env.API_KEY ?? 'default_api_key_replace_in_production'

function readConfig() {
  try { return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8')) }
  catch { return {} }
}

export async function POST(request: Request) {
  const { pending_id, user_id } = await request.json()
  const config = readConfig()

  if (!config.api_key || !config.cloud_url) {
    return NextResponse.json({ error: 'BunkerAI Cloud not configured' }, { status: 503 })
  }

  try {
    const resp = await fetch(`${config.cloud_url}/chat/confirm`, { cache: 'no-store',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': config.api_key },
      body: JSON.stringify({ pending_id, user_id }),
    })
    const data = await resp.json()
    if (!resp.ok) return NextResponse.json(data, { status: resp.status })

    // Mirror schedule/watcher creation to local agent-api so the Agents page shows them.
    // The cloud creates the record for APScheduler execution; local agent-api is the UI source of truth.
    if (data.action_type === 'schedule' && data.job) {
      fetch(`${AGENT_API}/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
        body: JSON.stringify(data.job),
      }).catch(() => {}) // fire-and-forget; non-critical
    }

    if (data.action_type === 'watcher' && data.watcher) {
      fetch(`${AGENT_API}/watchers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
        body: JSON.stringify(data.watcher),
      }).catch(() => {}) // fire-and-forget; non-critical
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Cloud service unreachable' }, { status: 502 })
  }
}
