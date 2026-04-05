/**
 * Save a BunkerAI API key returned from login and restart the connector-agent.
 * Called after successful email+password login when a duplicate email is detected.
 */
import { NextRequest, NextResponse } from 'next/server'
import { mkdirSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'

export const dynamic = 'force-dynamic'

const CONFIG_FILE = '/nextjs/data/bunkerai_config.json'
const CLOUD_URL   = process.env.BUNKERAI_CLOUD_URL ?? 'https://api.bunkerai.dev'

export async function POST(request: NextRequest) {
  const { api_key, tenant_id } = await request.json()
  if (!api_key || !tenant_id) {
    return NextResponse.json({ error: 'api_key and tenant_id are required' }, { status: 400 })
  }

  const ws_url = CLOUD_URL.replace(/^http/, 'ws') + '/connect'
  const config = { cloud_url: CLOUD_URL, ws_url, api_key, tenant_id }

  try {
    mkdirSync('/nextjs/data', { recursive: true })
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 })
  } catch (e) {
    return NextResponse.json({ error: `Could not save config: ${e}` }, { status: 500 })
  }

  try {
    execSync('supervisorctl -c /etc/supervisor/conf.d/supervisord.conf restart connector-agent', { timeout: 5000 })
  } catch { /* non-fatal */ }

  return NextResponse.json({ ok: true })
}
