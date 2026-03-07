'use client'

import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, Wifi, WifiOff, Ban, Search, Power, PowerOff, Globe } from 'lucide-react'
import { toast } from 'sonner'
import { dynsecApi, clientlogsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
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
import type { MQTTEvent, MqttClient } from '@/types'

type ClientStatus = 'connected' | 'cloud' | 'disabled' | 'offline'

interface ClientRow {
  username: string
  status: ClientStatus
  ip_address?: string
  port?: number
  protocol_level?: string
  keep_alive?: number
  connectedAt?: string
}

export default function ConnectedClientsPage() {
  const [allUsernames, setAllUsernames] = useState<string[]>([])
  // username → MQTTEvent for currently connected clients (deduplicated by username)
  const [connectedMap, setConnectedMap] = useState<Map<string, MQTTEvent>>(new Map())
  // username → disabled status from API + local overrides
  const [disabledState, setDisabledState] = useState<Record<string, boolean>>({})
  const [cloudConnected, setCloudConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [actionUsername, setActionUsername] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // Full load: fetch all ACL clients + their disabled status
  const loadFull = useCallback(async () => {
    setIsLoading(true)
    try {
      const clientsRes = await dynsecApi.getClients()
      const usernames = (clientsRes as MqttClient[]).map((c) => c.username)
      setAllUsernames(usernames)

      // Fetch disabled status for each client in parallel
      const detailResults = await Promise.allSettled(
        usernames.map((u) => dynsecApi.getClient(u))
      )
      const disabled: Record<string, boolean> = {}
      usernames.forEach((username, i) => {
        const res = detailResults[i]
        if (res.status === 'fulfilled') {
          const d = res.value as { client?: { disabled?: boolean } }
          disabled[username] = d.client?.disabled ?? false
        }
      })
      setDisabledState(disabled)
    } catch {
      toast.error('Failed to load clients')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Light poll: update connected clients + cloud status together
  const fetchConnected = useCallback(async () => {
    try {
      const [data, cloudStatus] = await Promise.all([
        clientlogsApi.getConnectedClients(),
        fetch('/api/settings/cloud-status').then(r => r.json()).catch(() => ({ connected: false })),
      ])
      // Deduplicate by username — keep first entry per username
      const map = new Map<string, MQTTEvent>()
      for (const ev of (data.clients ?? []) as MQTTEvent[]) {
        if (ev.username && !map.has(ev.username)) {
          map.set(ev.username, ev)
        }
      }
      setConnectedMap(map)
      setCloudConnected(cloudStatus?.connected === true)
    } catch {
      // Silently fail on poll errors
    }
  }, [])

  // Initial load + start 5s poll
  useEffect(() => {
    const init = async () => {
      await loadFull()
      await fetchConnected()
    }
    init()
    const interval = setInterval(fetchConnected, 5000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRefresh = async () => {
    await loadFull()
    await fetchConnected()
  }

  const handleDisable = async (username: string) => {
    setActionUsername(username)
    try {
      await dynsecApi.disableClient(username)
      setDisabledState((prev) => ({ ...prev, [username]: true }))
      toast.success(`Client "${username}" disabled`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to disable "${username}"`)
    } finally {
      setActionUsername(null)
    }
  }

  const handleEnable = async (username: string) => {
    setActionUsername(username)
    try {
      await dynsecApi.enableClient(username)
      setDisabledState((prev) => ({ ...prev, [username]: false }))
      toast.success(`Client "${username}" enabled`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to enable "${username}"`)
    } finally {
      setActionUsername(null)
    }
  }

  // Compute display rows by merging ACL list + live connection data + disabled state
  const rows: ClientRow[] = allUsernames.map((username) => {
    const isDisabled = disabledState[username] ?? false
    const connInfo = connectedMap.get(username)
    const isBunkerAI = username === 'BunkerAI'

    let status: ClientStatus = 'offline'
    if (isDisabled) status = 'disabled'
    else if (connInfo) status = 'connected'
    // BunkerAI connects to the broker via cloud WebSocket, not a direct MQTT socket.
    // Reflect cloud connectivity as its true connection status.
    else if (isBunkerAI && cloudConnected) status = 'cloud'

    return {
      username,
      status,
      ip_address: connInfo?.ip_address,
      port: connInfo?.port,
      protocol_level: connInfo?.protocol_level,
      keep_alive: connInfo?.keep_alive,
      connectedAt: connInfo?.timestamp,
    }
  })

  const filtered = rows.filter(
    (r) => !search || r.username.toLowerCase().includes(search.toLowerCase())
  )

  const connectedCount = rows.filter((r) => r.status === 'connected' || r.status === 'cloud').length
  const disabledCount = rows.filter((r) => r.status === 'disabled').length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Connected Clients</h1>
          <p className="text-muted-foreground text-sm">
            All MQTT clients — live connection status updates every 5s
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="gap-1">
            <Wifi className="h-3 w-3" />
            {connectedCount} online
          </Badge>
          {disabledCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <Ban className="h-3 w-3" />
              {disabledCount} disabled
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Protocol</TableHead>
              <TableHead>Keep-Alive</TableHead>
              <TableHead>Connected At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {isLoading ? 'Loading...' : search ? 'No clients match your search.' : 'No clients found.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row.username}>
                  <TableCell className="font-medium">{row.username}</TableCell>

                  <TableCell>
                    {row.status === 'connected' && (
                      <Badge variant="success" className="gap-1">
                        <Wifi className="h-3 w-3" />
                        Connected
                      </Badge>
                    )}
                    {row.status === 'cloud' && (
                      <Badge variant="success" className="gap-1">
                        <Globe className="h-3 w-3" />
                        Cloud Active
                      </Badge>
                    )}
                    {row.status === 'disabled' && (
                      <Badge variant="destructive" className="gap-1">
                        <Ban className="h-3 w-3" />
                        Disabled
                      </Badge>
                    )}
                    {row.status === 'offline' && (
                      <Badge variant="secondary" className="gap-1">
                        <WifiOff className="h-3 w-3" />
                        Offline
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="text-sm text-muted-foreground">
                    {row.ip_address ? `${row.ip_address}:${row.port}` : '—'}
                  </TableCell>

                  <TableCell>
                    {row.protocol_level ? (
                      <Badge variant="outline" className="text-xs">{row.protocol_level}</Badge>
                    ) : '—'}
                  </TableCell>

                  <TableCell className="text-sm text-muted-foreground">
                    {row.keep_alive != null ? `${row.keep_alive}s` : '—'}
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">
                    {row.connectedAt ? new Date(row.connectedAt).toLocaleString() : '—'}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center justify-end">
                      {row.status === 'disabled' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEnable(row.username)}
                          disabled={actionUsername === row.username}
                          className="text-green-600 hover:text-green-600 hover:bg-green-50 gap-1"
                        >
                          <Power className="h-3.5 w-3.5" />
                          Enable
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDisable(row.username)}
                          disabled={actionUsername === row.username}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                        >
                          <PowerOff className="h-3.5 w-3.5" />
                          Disable
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} of {rows.length} client{rows.length !== 1 ? 's' : ''}
      </p>
    </div>
  )
}
