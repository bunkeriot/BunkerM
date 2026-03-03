'use client'

import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { toast } from 'sonner'
import { clientlogsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { MQTTEvent } from '@/types'

export default function ClientLogsPage() {
  const [events, setEvents] = useState<MQTTEvent[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const fetchEvents = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await clientlogsApi.getEvents()
      setEvents((data.events ?? []) as MQTTEvent[])
    } catch {
      toast.error('Failed to fetch client events')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const filtered = events.filter((e) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      e.username?.toLowerCase().includes(q) ||
      e.client_id?.toLowerCase().includes(q) ||
      e.event_type?.toLowerCase().includes(q) ||
      e.ip_address?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Client Logs</h1>
          <p className="text-muted-foreground text-sm">MQTT client connection and disconnection events</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchEvents} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Filter by username, client ID, IP..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Badge variant="secondary">{filtered.length} event{filtered.length !== 1 ? 's' : ''}</Badge>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Connection Events</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md border-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Client ID</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Protocol</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {isLoading ? 'Loading events...' : 'No events found.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(event.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {event.event_type === 'Client Connection' ? (
                            <Wifi className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <WifiOff className="h-3.5 w-3.5 text-destructive" />
                          )}
                          <Badge
                            variant={event.event_type === 'Client Connection' ? 'success' : 'destructive'}
                            className="text-xs"
                          >
                            {event.event_type}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{event.username || '—'}</TableCell>
                      <TableCell className="font-mono text-xs">{event.client_id || '—'}</TableCell>
                      <TableCell className="text-xs">{event.ip_address}:{event.port}</TableCell>
                      <TableCell className="text-xs">{event.protocol_level}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{event.details}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
