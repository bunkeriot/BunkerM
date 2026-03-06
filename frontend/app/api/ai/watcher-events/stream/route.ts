import { NextRequest } from 'next/server'
import { readFileSync } from 'fs'

export const dynamic = 'force-dynamic'

const CONFIG_FILE = '/nextjs/data/bunkerai_config.json'

function readConfig() {
  try { return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8')) }
  catch { return {} }
}

export async function GET(request: NextRequest) {
  const config = readConfig()

  if (!config.api_key || !config.cloud_url) {
    // Return a valid SSE stream that immediately closes — no cloud configured
    return new Response('data: {"events":[],"initial":true}\n\n', {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
      },
    })
  }

  const encoder = new TextEncoder()
  let lastFiredAt: string | null = null
  let closed = false

  request.signal.addEventListener('abort', () => { closed = true })

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch {}
      }

      // --- Initial load: fetch last 50 events ---
      try {
        const resp = await fetch(`${config.cloud_url}/watchers/events?limit=50`, {
          headers: { 'x-api-key': config.api_key },
        })
        if (resp.ok) {
          const data = await resp.json()
          const events: { fired_at: string }[] = data.events ?? []
          if (events.length > 0) lastFiredAt = events[0].fired_at
          send({ events, initial: true })
        }
      } catch {}

      // --- Poll every 2 s for new events ---
      while (!closed) {
        await new Promise((r) => setTimeout(r, 2000))
        if (closed) break

        // Heartbeat comment every ~30s is handled implicitly since we poll every 2s
        // but send an explicit SSE comment so nginx doesn't time out
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'))
        } catch { break }

        try {
          const url = lastFiredAt
            ? `${config.cloud_url}/watchers/events?since=${encodeURIComponent(lastFiredAt)}&limit=20`
            : `${config.cloud_url}/watchers/events?limit=20`
          const resp = await fetch(url, { headers: { 'x-api-key': config.api_key } })
          if (resp.ok) {
            const data = await resp.json()
            const newEvents: { fired_at: string }[] = data.events ?? []
            if (newEvents.length > 0) {
              lastFiredAt = newEvents[0].fired_at
              send({ events: newEvents, initial: false })
            }
          }
        } catch {}
      }

      try { controller.close() } catch {}
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
