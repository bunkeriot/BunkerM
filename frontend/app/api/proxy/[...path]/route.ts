import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'

// Service registry: first path segment → Python backend base URL
const SERVICES: Record<string, string> = {
  dynsec:        'http://127.0.0.1:1000/api/v1',
  monitor:       'http://127.0.0.1:1001/api/v1',
  clientlogs:    'http://127.0.0.1:1002/api/v1',
  'aws-bridge':  'http://127.0.0.1:1003/api/v1',
  'azure-bridge':'http://127.0.0.1:1004/api/v1',
  config:        'http://127.0.0.1:1005/api/v1',
  // Smart Anomaly Detection service (runs inside the same container)
  ai:            process.env.AI_SERVICE_URL || 'http://127.0.0.1:8100',
}

const KEY_FILE = '/nextjs/data/.api_key'
const DEFAULT_KEY = 'default_api_key_replace_in_production'

function getApiKey(): string {
  const envKey = process.env.API_KEY
  if (envKey && envKey !== DEFAULT_KEY) return envKey
  try {
    return readFileSync(KEY_FILE, 'utf8').trim() || envKey || DEFAULT_KEY
  } catch {
    return envKey || DEFAULT_KEY
  }
}

async function handler(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const [service, ...rest] = params.path
  const base = SERVICES[service]

  if (!base) {
    return NextResponse.json({ error: `Unknown service: ${service}` }, { status: 404 })
  }

  // Build upstream URL, preserving all query params
  const upstreamUrl = new URL(`${base}/${rest.join('/')}`)
  req.nextUrl.searchParams.forEach((v, k) => upstreamUrl.searchParams.set(k, v))

  // Forward headers, injecting the API key server-side
  const forwardHeaders = new Headers()
  forwardHeaders.set('X-API-Key', getApiKey())
  const contentType = req.headers.get('content-type')
  if (contentType) forwardHeaders.set('content-type', contentType)

  // Forward body for non-GET/HEAD methods
  const body = ['GET', 'HEAD'].includes(req.method) ? undefined : await req.arrayBuffer()

  try {
    const upstream = await fetch(upstreamUrl.toString(), {
      method: req.method,
      headers: forwardHeaders,
      body: body ?? undefined,
    })

    const responseBody = await upstream.arrayBuffer()
    const responseHeaders = new Headers()
    upstream.headers.forEach((v, k) => {
      // Skip hop-by-hop headers that must not be forwarded
      if (!['content-encoding', 'transfer-encoding', 'connection'].includes(k.toLowerCase())) {
        responseHeaders.set(k, v)
      }
    })

    return new NextResponse(responseBody, {
      status: upstream.status,
      headers: responseHeaders,
    })
  } catch (err) {
    console.error(`[proxy] upstream error for ${service}:`, err)
    return NextResponse.json({ error: 'Upstream service unavailable' }, { status: 502 })
  }
}

export const GET     = handler
export const POST    = handler
export const PUT     = handler
export const DELETE  = handler
export const OPTIONS = handler
