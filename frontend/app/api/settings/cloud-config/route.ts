import { NextResponse } from 'next/server'
import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'

export const dynamic = 'force-dynamic'

const CONFIG_FILE = '/nextjs/data/bunkerai_config.json'

export async function GET() {
  try {
    const raw = readFileSync(CONFIG_FILE, 'utf-8')
    return NextResponse.json(JSON.parse(raw))
  } catch {
    return NextResponse.json({})
  }
}

export async function POST(request: Request) {
  const body = await request.json()
  const { _restart_agent, ...config } = body

  mkdirSync('/nextjs/data', { recursive: true })
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 })

  if (_restart_agent) {
    try {
      execSync('supervisorctl -c /etc/supervisor/conf.d/supervisord.conf restart connector-agent', { timeout: 5000 })
    } catch {
      // May fail outside container — non-fatal
    }
  }

  return NextResponse.json({ ok: true })
}
