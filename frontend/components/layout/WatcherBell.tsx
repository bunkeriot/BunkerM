'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface WatcherEvent {
  id: string
  watcher_id: string
  watcher_description: string
  message: string
  fired_at: string
}

const STORAGE_KEY = 'bunkerm_watcher_bell_last_read'
const MAX_EVENTS = 50

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function getLastRead(): string | null {
  try { return localStorage.getItem(STORAGE_KEY) } catch { return null }
}

function setLastRead(iso: string) {
  try { localStorage.setItem(STORAGE_KEY, iso) } catch {}
}

function countUnread(events: WatcherEvent[], lastRead: string | null): number {
  if (!lastRead) return events.length
  const lrDate = new Date(lastRead).getTime()
  return events.filter((e) => new Date(e.fired_at).getTime() > lrDate).length
}

export function WatcherBell() {
  const [events, setEvents] = useState<WatcherEvent[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const esRef = useRef<EventSource | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function connect() {
    if (esRef.current) {
      esRef.current.close()
      esRef.current = null
    }

    const es = new EventSource('/api/ai/watcher-events/stream')
    esRef.current = es

    es.onmessage = (event) => {
      try {
        const data: { events: WatcherEvent[]; initial: boolean } = JSON.parse(event.data)
        const incoming = data.events ?? []
        if (incoming.length === 0) return

        if (data.initial) {
          // Replace full list on initial load
          setEvents(incoming)
          setUnread(countUnread(incoming, getLastRead()))
        } else {
          // Prepend new events and trim to MAX_EVENTS
          setEvents((prev) => {
            const merged = [...incoming, ...prev].slice(0, MAX_EVENTS)
            setUnread(countUnread(merged, getLastRead()))
            return merged
          })
        }
      } catch {}
    }

    es.onerror = () => {
      es.close()
      esRef.current = null
      // Reconnect after 5 s
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      reconnectTimer.current = setTimeout(connect, 5000)
    }
  }

  useEffect(() => {
    connect()
    return () => {
      esRef.current?.close()
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
    }
  }, [])

  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen)
    if (isOpen && events.length > 0) {
      setLastRead(events[0].fired_at)
      setUnread(0)
    }
  }

  if (events.length === 0 && unread === 0) return null

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
          <span className="sr-only">Watcher notifications</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Watcher Alerts</span>
          <span className="text-xs font-normal text-muted-foreground">{events.length} recent</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {events.length === 0 ? (
          <div className="px-3 py-4 text-center text-sm text-muted-foreground">No recent alerts</div>
        ) : (
          <div className="max-h-72 overflow-y-auto">
            {events.map((e) => (
              <DropdownMenuItem key={e.id} className="flex flex-col items-start gap-0.5 py-2.5 cursor-default">
                <div className="flex items-center justify-between w-full gap-2">
                  <span className="text-xs font-medium truncate">{e.watcher_description}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(e.fired_at)}</span>
                </div>
                <span className="text-xs text-muted-foreground line-clamp-2">{e.message}</span>
              </DropdownMenuItem>
            ))}
          </div>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="justify-center text-xs text-muted-foreground">
          <a href="/ai/agents">Manage agents</a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
