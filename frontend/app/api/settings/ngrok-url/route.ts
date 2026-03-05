import { NextResponse } from 'next/server'
import http from 'http'

// Force dynamic — never cache this route (ngrok URL changes between runs)
export const dynamic = 'force-dynamic'

const NGROK_CANDIDATES = [
  'host.docker.internal',
  'localhost',
]

function fetchTunnels(host: string): Promise<string | null> {
  return new Promise((resolve) => {
    const req = http.get(
      { host, port: 4040, path: '/api/tunnels', timeout: 3000 },
      (res) => {
        let body = ''
        res.on('data', (chunk) => { body += chunk })
        res.on('end', () => {
          try {
            const data = JSON.parse(body)
            const tunnel = data.tunnels?.find((t: { proto: string }) => t.proto === 'https')
            resolve(tunnel?.public_url ?? null)
          } catch {
            resolve(null)
          }
        })
      }
    )
    req.on('error', () => resolve(null))
    req.on('timeout', () => { req.destroy(); resolve(null) })
  })
}

export async function GET() {
  for (const host of NGROK_CANDIDATES) {
    const url = await fetchTunnels(host)
    if (url) return NextResponse.json({ url })
  }
  return NextResponse.json({ error: 'No HTTPS ngrok tunnel found — is ngrok running?' }, { status: 404 })
}
