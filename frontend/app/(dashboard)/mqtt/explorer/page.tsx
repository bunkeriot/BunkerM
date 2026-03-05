'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ChevronRight,
  ChevronDown,
  Radio,
  RefreshCw,
  Search,
  Send,
} from 'lucide-react'
import { toast } from 'sonner'
import { monitorApi, dynsecApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { MqttTopic, MqttClient } from '@/types'

// ── Tree types ────────────────────────────────────────────────────────────────

interface TreeNode {
  name: string
  fullPath: string
  children: Map<string, TreeNode>
  leaf?: MqttTopic
}

function buildTree(topics: MqttTopic[]): TreeNode {
  const root: TreeNode = { name: '', fullPath: '', children: new Map() }
  for (const t of topics) {
    const parts = t.topic.split('/')
    let node = root
    let path = ''
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      path = path ? `${path}/${part}` : part
      if (!node.children.has(part)) {
        node.children.set(part, { name: part, fullPath: path, children: new Map() })
      }
      node = node.children.get(part)!
      if (i === parts.length - 1) {
        node.leaf = t
      }
    }
  }
  return root
}

function countLeaves(node: TreeNode): number {
  if (node.children.size === 0) return node.leaf ? 1 : 0
  return Array.from(node.children.values()).reduce(
    (sum, child) => sum + countLeaves(child),
    0
  )
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const secs = Math.floor(diffMs / 1000)
  if (secs < 5) return 'just now'
  if (secs < 60) return `${secs}s ago`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}

// ── Tree node component ───────────────────────────────────────────────────────

interface TreeNodeProps {
  node: TreeNode
  depth: number
  defaultOpen?: boolean
}

function TreeNodeView({ node, depth, defaultOpen = false }: TreeNodeProps) {
  const [open, setOpen] = useState(defaultOpen || depth < 1)
  const hasChildren = node.children.size > 0
  const isLeaf = !hasChildren && !!node.leaf
  const indent = depth * 16

  if (isLeaf && node.leaf) {
    const t = node.leaf
    return (
      <div
        className="flex items-start gap-2 py-1.5 px-3 rounded-md hover:bg-muted/50 text-sm"
        style={{ paddingLeft: `${indent + 12}px` }}
      >
        <span className="mt-0.5 h-2 w-2 rounded-full bg-green-500 shrink-0 self-center" />
        <span className="font-mono font-medium min-w-0 shrink-0">{node.name}</span>
        <span className="text-muted-foreground font-mono truncate max-w-xs">
          {t.value || <em className="not-italic opacity-50">empty</em>}
        </span>
        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          {t.retained && (
            <Badge variant="outline" className="text-xs border-orange-400 text-orange-500 py-0 px-1.5">
              retained
            </Badge>
          )}
          <Badge variant="secondary" className="text-xs py-0 px-1.5">
            QoS {t.qos}
          </Badge>
          <Badge variant="secondary" className="text-xs py-0 px-1.5">
            ×{t.count}
          </Badge>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {relativeTime(t.timestamp)}
          </span>
        </div>
      </div>
    )
  }

  const leafCount = countLeaves(node)
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 w-full py-1.5 px-3 rounded-md hover:bg-muted/50 text-sm text-left"
        style={{ paddingLeft: `${indent + 4}px` }}
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        )}
        <span className="font-mono font-semibold">{node.name}</span>
        <Badge variant="outline" className="text-xs py-0 px-1.5 ml-1">
          {leafCount}
        </Badge>
      </button>
      {open && (
        <div>
          {Array.from(node.children.values()).map((child) => (
            <TreeNodeView key={child.fullPath} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Payload validation ────────────────────────────────────────────────────────

type PayloadType = 'RAW' | 'JSON' | 'XML'

function validatePayload(payload: string, type: PayloadType): string | null {
  if (!payload.trim()) return null
  if (type === 'JSON') {
    try { JSON.parse(payload) } catch { return 'Payload is not valid JSON' }
  } else if (type === 'XML') {
    const doc = new DOMParser().parseFromString(payload, 'text/xml')
    if (doc.querySelector('parsererror')) return 'Payload is not valid XML'
  }
  return null
}

// ── Publish Panel ─────────────────────────────────────────────────────────────

interface PublishPanelProps {
  clients: MqttClient[]
}

function PublishPanel({ clients }: PublishPanelProps) {
  const [open, setOpen] = useState(true)
  const [selectedClient, setSelectedClient] = useState('')
  const [topic, setTopic] = useState('')
  const [payload, setPayload] = useState('')
  const [payloadType, setPayloadType] = useState<PayloadType>('RAW')
  const [qos, setQos] = useState<string>('0')
  const [retain, setRetain] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  async function handlePublish() {
    if (!topic.trim()) {
      toast.error('Topic is required')
      return
    }
    const validationError = validatePayload(payload, payloadType)
    if (validationError) {
      toast.error(validationError)
      return
    }
    setIsPublishing(true)
    try {
      await monitorApi.publishMessage({
        topic: topic.trim(),
        payload,
        qos: parseInt(qos) as 0 | 1 | 2,
        retain,
      })
      toast.success(`Published to "${topic.trim()}"`)
    } catch {
      toast.error('Failed to publish message')
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <Card>
      {/* Accordion header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full px-6 py-4 text-left"
      >
        <div className="flex items-center gap-2">
          <Send className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-sm">Publish Message</span>
        </div>
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <CardContent className="pt-0 pb-5 space-y-4">
          {/* Row 1: Client + Topic */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="pub-client">Client</Label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger id="pub-client">
                  <SelectValue placeholder="Select a client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.username} value={c.username}>
                      {c.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pub-topic">Topic</Label>
              <Input
                id="pub-topic"
                placeholder="e.g. sensors/temperature"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
          </div>

          {/* Row 2: Payload type + QoS + Retain */}
          <div className="flex items-end gap-4">
            {/* Payload type toggle */}
            <div className="space-y-1.5">
              <Label>Payload Type</Label>
              <div className="flex rounded-md border overflow-hidden">
                {(['RAW', 'JSON', 'XML'] as PayloadType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setPayloadType(t)}
                    className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                      payloadType === t
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* QoS */}
            <div className="space-y-1.5">
              <Label htmlFor="pub-qos">QoS</Label>
              <Select value={qos} onValueChange={setQos}>
                <SelectTrigger id="pub-qos" className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 — At most once</SelectItem>
                  <SelectItem value="1">1 — At least once</SelectItem>
                  <SelectItem value="2">2 — Exactly once</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Retain */}
            <div className="space-y-1.5">
              <Label htmlFor="pub-retain">Retain</Label>
              <div className="flex items-center h-9">
                <Switch
                  id="pub-retain"
                  checked={retain}
                  onCheckedChange={setRetain}
                />
              </div>
            </div>
          </div>

          {/* Row 3: Payload textarea */}
          <div className="space-y-1.5">
            <Label htmlFor="pub-payload">Payload</Label>
            <Textarea
              id="pub-payload"
              placeholder={
                payloadType === 'JSON'
                  ? '{"key": "value"}'
                  : payloadType === 'XML'
                  ? '<root><key>value</key></root>'
                  : 'Enter payload...'
              }
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              className="font-mono text-sm min-h-[80px]"
            />
          </div>

          {/* Row 4: Publish button */}
          <div className="flex justify-end">
            <Button onClick={handlePublish} disabled={isPublishing}>
              <Send className="h-4 w-4 mr-2" />
              {isPublishing ? 'Publishing...' : 'Publish'}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MqttExplorerPage() {
  const [topics, setTopics] = useState<MqttTopic[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [clients, setClients] = useState<MqttClient[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchTopics = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true)
    try {
      const data = await monitorApi.getTopics()
      setTopics(data.topics ?? [])
    } catch {
      toast.error('Failed to fetch MQTT topics')
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTopics(true)
    intervalRef.current = setInterval(() => fetchTopics(false), 3000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchTopics])

  useEffect(() => {
    dynsecApi.getClients().then(setClients).catch(() => {})
  }, [])

  const filtered = search
    ? topics.filter((t) => t.topic.toLowerCase().includes(search.toLowerCase()))
    : topics

  const tree = buildTree(filtered)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Radio className="h-6 w-6" />
            MQTT Browser
          </h1>
          <p className="text-muted-foreground text-sm">
            Live topic tree with values and metadata
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchTopics(true)}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Publish panel (accordion) */}
      <PublishPanel clients={clients} />

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Badge variant="secondary">
          {filtered.length} topic{filtered.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Topic tree */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Topic Tree</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          {filtered.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">
              {isLoading
                ? 'Loading topics...'
                : topics.length === 0
                ? 'No topics received yet. Publish a message to see it here.'
                : 'No topics match the filter.'}
            </p>
          ) : (
            <div className="space-y-0.5">
              {Array.from(tree.children.values()).map((child) => (
                <TreeNodeView key={child.fullPath} node={child} depth={0} defaultOpen />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
