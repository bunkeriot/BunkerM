'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  RefreshCw,
  Trash2,
  RotateCcw,
  Database,
  MessageSquare,
  Clock,
  Hash,
} from 'lucide-react'
import { toast } from 'sonner'
import { historyApi } from '@/lib/api'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { HistoryMessage, HistoryStats, HistoryTopic } from '@/types'

const PAGE_SIZE = 100

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatTs(ts: number): string {
  return new Date(ts).toLocaleString()
}

function truncate(str: string | null, len = 80): string {
  if (!str) return '—'
  return str.length > len ? str.slice(0, len) + '…' : str
}

export default function MessageHistoryPage() {
  const [stats, setStats]     = useState<HistoryStats | null>(null)
  const [topics, setTopics]   = useState<HistoryTopic[]>([])
  const [messages, setMessages] = useState<HistoryMessage[]>([])
  const [total, setTotal]     = useState(0)
  const [offset, setOffset]   = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  // Filters
  const [filterTopic, setFilterTopic] = useState<string>('__all__')
  const [search, setSearch]           = useState('')

  // Replay dialog
  const [replayMsg, setReplayMsg]   = useState<HistoryMessage | null>(null)
  const [replayPayload, setReplayPayload] = useState('')
  const [replayQos, setReplayQos]   = useState('0')
  const [replayRetain, setReplayRetain] = useState('false')
  const [replaying, setReplaying]   = useState(false)

  // Clear confirm
  const [clearOpen, setClearOpen] = useState(false)
  const [clearing, setClearing]   = useState(false)

  const fetchAll = useCallback(async (page = 0) => {
    setIsLoading(true)
    try {
      const [statsData, topicsData, msgsData] = await Promise.all([
        historyApi.getStats(),
        historyApi.getTopics(),
        historyApi.getMessages({
          topic:  filterTopic !== '__all__' ? filterTopic : undefined,
          search: search || undefined,
          limit:  PAGE_SIZE,
          offset: page * PAGE_SIZE,
        }),
      ])
      setStats(statsData)
      setTopics(topicsData.topics)
      setMessages(msgsData.messages)
      setTotal(msgsData.total)
      setOffset(page)
    } catch {
      toast.error('Failed to load message history')
    } finally {
      setIsLoading(false)
    }
  }, [filterTopic, search])

  useEffect(() => {
    fetchAll(0)
  }, [fetchAll])

  function openReplay(msg: HistoryMessage) {
    setReplayMsg(msg)
    setReplayPayload(msg.payload ?? '')
    setReplayQos('0')
    setReplayRetain('false')
  }

  async function doReplay() {
    if (!replayMsg) return
    setReplaying(true)
    try {
      await historyApi.replay({
        topic:   replayMsg.topic,
        payload: replayPayload,
        qos:     Number(replayQos),
        retain:  replayRetain === 'true',
      })
      toast.success(`Replayed to ${replayMsg.topic}`)
      setReplayMsg(null)
    } catch {
      toast.error('Replay failed')
    } finally {
      setReplaying(false)
    }
  }

  async function doClear() {
    setClearing(true)
    try {
      await historyApi.clearHistory()
      toast.success('History cleared')
      setClearOpen(false)
      fetchAll(0)
    } catch {
      toast.error('Failed to clear history')
    } finally {
      setClearing(false)
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Message History</h1>
          <p className="text-muted-foreground text-sm">
            All MQTT messages captured by the broker, searchable and replayable
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchAll(0)} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setClearOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear History
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <MessageSquare className="h-3.5 w-3.5" />
                Total Messages
              </div>
              <p className="text-xl font-bold">{stats.total.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">of {stats.max_messages.toLocaleString()} max</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Hash className="h-3.5 w-3.5" />
                Topics
              </div>
              <p className="text-xl font-bold">{topics.length.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">unique topics</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Database className="h-3.5 w-3.5" />
                DB Size
              </div>
              <p className="text-xl font-bold">{formatBytes(stats.db_size_bytes)}</p>
              <p className="text-xs text-muted-foreground">on disk</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Clock className="h-3.5 w-3.5" />
                Retention
              </div>
              <p className="text-xl font-bold">{stats.max_age_days}d</p>
              <p className="text-xs text-muted-foreground">
                {stats.oldest_ts ? `from ${new Date(stats.oldest_ts).toLocaleDateString()}` : 'no data yet'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filterTopic} onValueChange={(v) => { setFilterTopic(v); setOffset(0) }}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="All topics" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All topics</SelectItem>
            {topics.map((t) => (
              <SelectItem key={t.topic} value={t.topic}>
                {t.topic} <span className="text-muted-foreground ml-1">({t.count})</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Search topic or payload..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />

        {(filterTopic !== '__all__' || search) && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterTopic('__all__'); setSearch('') }}>
            Clear filters
          </Button>
        )}

        <Badge variant="secondary" className="ml-auto">
          {total.toLocaleString()} result{total !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-40">Timestamp</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead>Payload</TableHead>
                <TableHead className="w-16 text-center">QoS</TableHead>
                <TableHead className="w-16 text-center">Retain</TableHead>
                <TableHead className="w-20 text-right">Size</TableHead>
                <TableHead className="w-20 text-center">Replay</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    {isLoading ? 'Loading…' : 'No messages found. Messages will appear as the broker receives them.'}
                  </TableCell>
                </TableRow>
              ) : (
                messages.map((msg) => (
                  <TableRow key={msg.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTs(msg.ts)}
                    </TableCell>
                    <TableCell className="font-mono text-xs max-w-[200px] truncate" title={msg.topic}>
                      {msg.topic}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground max-w-[300px]" title={msg.payload ?? ''}>
                      {msg.enc === 'base64'
                        ? <span className="italic text-muted-foreground/60">[binary {formatBytes(msg.size)}]</span>
                        : truncate(msg.payload)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-xs">{msg.qos}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {msg.retain ? (
                        <Badge variant="secondary" className="text-xs">R</Badge>
                      ) : (
                        <span className="text-muted-foreground/40 text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {formatBytes(msg.size)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => openReplay(msg)}
                        title="Replay this message"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {offset * PAGE_SIZE + 1}–{Math.min((offset + 1) * PAGE_SIZE, total)} of {total.toLocaleString()}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm"
              disabled={offset === 0 || isLoading}
              onClick={() => fetchAll(offset - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline" size="sm"
              disabled={offset + 1 >= totalPages || isLoading}
              onClick={() => fetchAll(offset + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Replay dialog */}
      <Dialog open={!!replayMsg} onOpenChange={(o) => !o && setReplayMsg(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Replay Message</DialogTitle>
          </DialogHeader>
          {replayMsg && (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Topic</p>
                <p className="font-mono bg-muted px-2 py-1 rounded text-xs">{replayMsg.topic}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Payload</p>
                <textarea
                  className="w-full font-mono text-xs bg-muted border rounded px-2 py-1 min-h-[80px] resize-y focus:outline-none"
                  value={replayPayload}
                  onChange={(e) => setReplayPayload(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <p className="text-muted-foreground text-xs mb-1">QoS</p>
                  <Select value={replayQos} onValueChange={setReplayQos}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 — At most once</SelectItem>
                      <SelectItem value="1">1 — At least once</SelectItem>
                      <SelectItem value="2">2 — Exactly once</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <p className="text-muted-foreground text-xs mb-1">Retain</p>
                  <Select value={replayRetain} onValueChange={setReplayRetain}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">No</SelectItem>
                      <SelectItem value="true">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplayMsg(null)}>Cancel</Button>
            <Button onClick={doReplay} disabled={replaying}>
              {replaying ? 'Publishing…' : 'Publish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear confirm dialog */}
      <Dialog open={clearOpen} onOpenChange={setClearOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear all message history?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete all {stats?.total.toLocaleString()} stored messages. This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={doClear} disabled={clearing}>
              {clearing ? 'Clearing…' : 'Clear History'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
