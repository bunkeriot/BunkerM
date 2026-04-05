import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

const AGENT_API = 'http://127.0.0.1:1006'
const API_KEY = process.env.API_KEY ?? 'default_api_key_replace_in_production'

export async function GET(request: NextRequest) {
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
        const resp = await fetch(`${AGENT_API}/watcher-events?limit=50`, {
          headers: { 'x-api-key': API_KEY },
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

        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'))
        } catch { break }

        try {
          const url = lastFiredAt
            ? `${AGENT_API}/watcher-events?since=${encodeURIComponent(lastFiredAt)}&limit=20`
            : `${AGENT_API}/watcher-events?limit=20`
          const resp = await fetch(url, { headers: { 'x-api-key': API_KEY } })
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
