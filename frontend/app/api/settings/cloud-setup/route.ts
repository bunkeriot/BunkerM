import { NextRequest, NextResponse } from 'next/server'
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs'
import { execSync } from 'child_process'

const CONFIG_FILE    = '/nextjs/data/bunkerai_config.json'
const ACTIVATION_FILE = '/nextjs/data/activation.json'
const INSTANCE_FILE  = '/nextjs/data/instance_id'
const CLOUD_URL      = process.env.BUNKERAI_CLOUD_URL ?? 'https://api.bunkerai.dev'

const USERS_FILE = '/nextjs/data/users.json'

function readAdminProfile(): { email: string | null; country: string | null } {
  try {
    if (existsSync(USERS_FILE)) {
      const users = JSON.parse(readFileSync(USERS_FILE, 'utf-8'))
      const admin = Array.isArray(users) ? users.find((u: { role?: string }) => u.role === 'admin') : null
      return { email: admin?.email ?? null, country: admin?.country ?? null }
    }
  } catch { /* ignore */ }
  return { email: null, country: null }
}

export async function POST(_request: NextRequest) {
  // Read locally-stored activation key (written by agent-api on auto-activation)
  let activationKey = ''
  let instanceId    = ''
  try {
    if (existsSync(ACTIVATION_FILE)) {
      const data = JSON.parse(readFileSync(ACTIVATION_FILE, 'utf-8'))
      activationKey = data.key ?? ''
    }
    if (existsSync(INSTANCE_FILE)) {
      instanceId = readFileSync(INSTANCE_FILE, 'utf-8').trim()
    }
  } catch {
    // files may not exist yet
  }

  if (!activationKey || !instanceId) {
    return NextResponse.json(
      { error: 'Instance is not activated yet. Ensure the BunkerM container has internet access and restart it.' },
      { status: 503 }
    )
  }

  const { email: adminEmail, country: adminCountry } = readAdminProfile()

  // Register tenant on the cloud using the signed activation key (no admin secret needed)
  let tenantData: { tenant_id: string; api_key: string }
  try {
    const res = await fetch(`${CLOUD_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activation_key: activationKey, instance_id: instanceId, email: adminEmail, country: adminCountry }),
    })

    if (res.status === 409) {
      // Duplicate verified email — invite the user to log in instead
      return NextResponse.json(
        { error: 'EMAIL_ALREADY_REGISTERED', email: adminEmail },
        { status: 409 }
      )
    }
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { error: `Cloud registration failed (${res.status}): ${text}` },
        { status: 502 }
      )
    }

    tenantData = await res.json()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Could not reach BunkerAI Cloud: ${msg}` }, { status: 502 })
  }

  const ws_url = CLOUD_URL.replace(/^http/, 'ws') + '/connect'

  const config = {
    cloud_url: CLOUD_URL,
    ws_url,
    api_key:   tenantData.api_key,
    tenant_id: tenantData.tenant_id,
  }
  mkdirSync('/nextjs/data', { recursive: true })
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 })

  // Restart connector-agent so it picks up the new key immediately
  try {
    execSync('supervisorctl -c /etc/supervisor/conf.d/supervisord.conf restart connector-agent', { timeout: 5000 })
  } catch {
    // Non-fatal
  }

  return NextResponse.json({ ok: true, api_key: tenantData.api_key, tenant_id: tenantData.tenant_id })
}
