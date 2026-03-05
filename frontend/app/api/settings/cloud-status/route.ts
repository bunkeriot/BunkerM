import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'

export const dynamic = 'force-dynamic'

const STATUS_FILE = '/nextjs/data/.bunkerai_status.json'
const CONFIG_FILE = '/nextjs/data/bunkerai_config.json'

export async function GET() {
  // configured = env var OR config file written by the Settings UI
  let configured = !!process.env.BUNKERAI_API_KEY
  if (!configured) {
    try {
      const cfg = JSON.parse(await readFile(CONFIG_FILE, 'utf-8'))
      configured = !!cfg?.api_key
    } catch {
      // no config file — not configured
    }
  }

  if (!configured) {
    return NextResponse.json({ configured: false, connected: false })
  }

  try {
    const raw = await readFile(STATUS_FILE, 'utf-8')
    const status = JSON.parse(raw)
    return NextResponse.json({ configured: true, ...status })
  } catch {
    // File not yet written by connector agent
    return NextResponse.json({ configured: true, connected: false })
  }
}
