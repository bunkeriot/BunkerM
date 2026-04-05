import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'

export const dynamic = 'force-dynamic'

const AGENT_API = 'http://127.0.0.1:1006'
const API_KEY = process.env.API_KEY ?? 'default_api_key_replace_in_production'
const CONFIG_FILE = '/nextjs/data/bunkerai_config.json'

function readCloudConfig() {
  try { return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8')) }
  catch { return {} }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const config = readCloudConfig()
  try {
    if (config.api_key && config.cloud_url) {
      const resp = await fetch(`${config.cloud_url}/schedules/${params.id}`, { cache: 'no-store',
        method: 'DELETE',
        headers: { 'x-api-key': config.api_key },
      })
      const data = await resp.json()
      return NextResponse.json(data, { status: resp.status })
    }
    const resp = await fetch(`${AGENT_API}/schedules/${params.id}`, {
      method: 'DELETE',
      headers: { 'x-api-key': API_KEY },
    })
    const data = await resp.json()
    return NextResponse.json(data, { status: resp.status })
  } catch {
    return NextResponse.json({ error: 'Agent service unreachable' }, { status: 502 })
  }
}
