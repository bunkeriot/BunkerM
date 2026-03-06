import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'

export const dynamic = 'force-dynamic'

const CONFIG_FILE = '/nextjs/data/bunkerai_config.json'

function readConfig(): Record<string, string> {
  try { return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8')) }
  catch { return {} }
}

/**
 * GET /api/settings/slack-oauth-start
 *
 * Server-side proxy for the Slack OAuth flow. The browser calls this route,
 * which fetches the real Slack OAuth URL from bunkerai-cloud (using the internal
 * Docker URL) and redirects the browser to it. This ensures the user lands on
 * the correct public URL (ngrok / production), never the internal Docker URL.
 */
export async function GET(request: NextRequest) {
  const config = readConfig()
  const { cloud_url, tenant_id } = config

  if (!cloud_url || !tenant_id) {
    return NextResponse.json({ error: 'BunkerAI Cloud not configured' }, { status: 503 })
  }

  // Use return_to passed explicitly from the browser (window.location.origin),
  // which is always correct regardless of nginx header rewriting.
  const returnTo = request.nextUrl.searchParams.get('return_to') || 'http://localhost:2000'

  try {
    const res = await fetch(
      `${cloud_url}/oauth/slack/url?tenant_id=${tenant_id}&return_to=${encodeURIComponent(returnTo)}`
    )
    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json({ error: data.detail ?? 'Cloud error' }, { status: res.status })
    }
    return NextResponse.redirect(data.url)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Cloud unreachable: ${msg}` }, { status: 502 })
  }
}
