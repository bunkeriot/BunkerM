import { NextRequest, NextResponse } from 'next/server'
import { mkdirSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'

const CONFIG_FILE = '/nextjs/data/bunkerai_config.json'

export async function POST(request: NextRequest) {
  const { cloud_url, admin_secret } = await request.json()

  if (!cloud_url || !admin_secret) {
    return NextResponse.json({ error: 'cloud_url and admin_secret are required' }, { status: 400 })
  }

  // Create tenant in bunkerai-cloud
  let tenantData: { tenant_id: string; api_key: string }
  try {
    const res = await fetch(`${cloud_url}/admin/tenants`, {
      method: 'POST',
      headers: {
        'X-Admin-Secret': admin_secret,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'My BunkerM', tier: 'premium', credits_budget: 1000 }),
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { error: `Cloud API error (${res.status}): ${text}` },
        { status: 502 }
      )
    }

    tenantData = await res.json()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { error: `Could not reach bunkerai-cloud: ${msg}` },
      { status: 502 }
    )
  }

  // Derive WebSocket URL from HTTP URL
  const ws_url = cloud_url.replace(/^http/, 'ws') + '/connect'

  // Persist config
  const config = {
    cloud_url,
    admin_secret,
    ws_url,
    api_key: tenantData.api_key,
    tenant_id: tenantData.tenant_id,
  }
  mkdirSync('/nextjs/data', { recursive: true })
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 })

  // Restart connector-agent so it picks up the new key
  try {
    execSync('supervisorctl -c /etc/supervisor/conf.d/supervisord.conf restart connector-agent', { timeout: 5000 })
  } catch {
    // Non-fatal — agent will pick up config on next supervisorctl start
  }

  return NextResponse.json({ ok: true, api_key: tenantData.api_key, tenant_id: tenantData.tenant_id })
}
