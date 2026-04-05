import { NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'

const CONFIG_FILE = '/nextjs/data/bunkerai_config.json'

function readConfig(): Record<string, string> {
  try { return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8')) }
  catch { return {} }
}

/** Called by the UI after a successful Slack OAuth redirect to persist the connected status. */
export async function POST() {
  const config = readConfig()
  config.slack_connected = 'true'
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 })
  return NextResponse.json({ ok: true })
}
