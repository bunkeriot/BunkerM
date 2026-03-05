import { NextRequest, NextResponse } from 'next/server'
import { findUserByEmail, generateRecoveryToken } from '@/lib/users'
import { readFileSync } from 'fs'

const CONFIG_FILE = '/nextjs/data/bunkerai_config.json'

function readConfig() {
  try { return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8')) }
  catch { return {} }
}

async function tryTelegramNotify(resetUrl: string): Promise<boolean> {
  const config = readConfig()
  if (!config.cloud_url || !config.admin_secret || !config.tenant_id) return false

  try {
    const resp = await fetch(
      `${config.cloud_url}/admin/tenants/${config.tenant_id}/notify`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': config.admin_secret,
        },
        body: JSON.stringify({
          text: `BunkerM password reset requested.\n\nClick the link below to set a new password (valid 15 minutes):\n${resetUrl}`,
        }),
      }
    )
    return resp.ok
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  const { email } = await request.json()
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const user = findUserByEmail(email)
  // Always respond with the same message to prevent user enumeration
  if (!user) {
    return NextResponse.json({ ok: true, method: 'none' })
  }

  const token = generateRecoveryToken(user.id)

  // Build the reset URL from the request origin
  const origin = request.headers.get('origin') || `http://${request.headers.get('host')}`
  const resetUrl = `${origin}/reset-password?token=${token}`

  // Try to deliver via Telegram/connector if configured
  const sentViaConnector = await tryTelegramNotify(resetUrl)

  return NextResponse.json({
    ok: true,
    method: sentViaConnector ? 'connector' : 'link',
    // Return the URL directly if no connector is configured — the person
    // is presumably at the server or being helped by an admin
    resetUrl: sentViaConnector ? undefined : resetUrl,
  })
}
