import { NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'

const CONFIG_FILE = '/nextjs/data/bunkerai_config.json'

function readConfig(): Record<string, string> {
  try { return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8')) }
  catch { return {} }
}

export async function DELETE() {
  const config = readConfig()
  const { cloud_url, admin_secret, tenant_id } = config
  if (!cloud_url || !admin_secret || !tenant_id) {
    return NextResponse.json({ error: 'Incomplete cloud config' }, { status: 400 })
  }

  try {
    const res = await fetch(`${cloud_url}/admin/tenants/${tenant_id}/connectors/slack`, {
      method: 'DELETE',
      headers: { 'X-Admin-Secret': admin_secret },
    })
    if (!res.ok && res.status !== 404) {
      const text = await res.text()
      return NextResponse.json({ error: `Cloud API error (${res.status}): ${text}` }, { status: 502 })
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Could not reach bunkerai-cloud: ${msg}` }, { status: 502 })
  }

  delete config.slack_connected
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 })
  return NextResponse.json({ ok: true })
}
