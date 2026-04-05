import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'

export const dynamic = 'force-dynamic'

const AGENT_API = 'http://127.0.0.1:1006'
const API_KEY = process.env.API_KEY ?? 'default_api_key_replace_in_production'
const CONFIG_FILE = '/nextjs/data/bunkerai_config.json'

function readCloudConfig() {
  try { return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8')) }
  catch { return {} }
}

export async function GET() {
  // BunkerAI Cloud connection = activated. No need for the local agent-api check.
  const config = readCloudConfig()
  if (config.api_key) {
    return NextResponse.json({ activated: true, instance_id: null })
  }

  try {
    const resp = await fetch(`${AGENT_API}/activation-status`, {
      headers: { 'x-api-key': API_KEY },
    })
    const data = await resp.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ activated: false, instance_id: null })
  }
}
