import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync } from 'fs'

const CONFIG_FILE = '/nextjs/data/bunkerai_config.json'

export async function POST(request: NextRequest) {
  const { bot_token, public_url } = await request.json()

  if (!bot_token) {
    return NextResponse.json({ error: 'bot_token is required' }, { status: 400 })
  }

  // Load existing config
  let config: Record<string, string>
  try {
    config = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'))
  } catch {
    return NextResponse.json({ error: 'Set up BunkerAI Cloud first' }, { status: 400 })
  }

  const { cloud_url, api_key } = config
  if (!cloud_url || !api_key) {
    return NextResponse.json({ error: 'Incomplete cloud config — set up BunkerAI Cloud first' }, { status: 400 })
  }

  // Register Telegram connector in bunkerai-cloud
  // (bunkerai-cloud will auto-detect the ngrok URL internally)
  let webhookUrl: string
  try {
    const res = await fetch(`${cloud_url}/connectors/telegram`, {
      method: 'POST',
      headers: {
        'x-api-key': api_key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bot_token }),
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json(
        { error: `Cloud API error (${res.status}): ${text}` },
        { status: 502 }
      )
    }

    const data = await res.json()
    webhookUrl = data.webhook_url
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { error: `Could not reach bunkerai-cloud: ${msg}` },
      { status: 502 }
    )
  }

  // Update config
  config.telegram_bot_token = bot_token
  config.telegram_connected = 'true'
  if (public_url) config.public_url = public_url
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 })

  return NextResponse.json({ ok: true, webhook_url: webhookUrl })
}

export async function DELETE() {
  let config: Record<string, string>
  try {
    config = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'))
  } catch {
    return NextResponse.json({ error: 'Config not found' }, { status: 404 })
  }

  const { cloud_url, api_key } = config
  if (!cloud_url || !api_key) {
    return NextResponse.json({ error: 'Incomplete cloud config' }, { status: 400 })
  }

  // Revoke connector in bunkerai-cloud
  try {
    const res = await fetch(`${cloud_url}/connectors/telegram`, {
      method: 'DELETE',
      headers: { 'x-api-key': api_key },
    })
    if (!res.ok && res.status !== 404) {
      const text = await res.text()
      return NextResponse.json(
        { error: `Cloud API error (${res.status}): ${text}` },
        { status: 502 }
      )
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { error: `Could not reach bunkerai-cloud: ${msg}` },
      { status: 502 }
    )
  }

  // Clear telegram fields from config
  delete config.telegram_bot_token
  delete config.telegram_connected
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 })

  return NextResponse.json({ ok: true })
}
