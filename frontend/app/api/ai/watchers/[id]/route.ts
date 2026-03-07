import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const AGENT_API = 'http://127.0.0.1:1006'
const API_KEY = process.env.API_KEY ?? 'default_api_key_replace_in_production'

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const resp = await fetch(`${AGENT_API}/watchers/${params.id}`, {
      method: 'DELETE',
      headers: { 'x-api-key': API_KEY },
    })
    const data = await resp.json()
    return NextResponse.json(data, { status: resp.status })
  } catch {
    return NextResponse.json({ error: 'Agent service unreachable' }, { status: 502 })
  }
}
