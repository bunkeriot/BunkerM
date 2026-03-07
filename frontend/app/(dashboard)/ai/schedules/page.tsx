'use client'

import { useEffect, useState } from 'react'
import { Clock, Plus, Trash2, Loader2, Info, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { schedulesApi } from '@/lib/api'
import type { ScheduledJob } from '@/types'

const CRON_PRESETS = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every 5 min', value: '*/5 * * * *' },
  { label: 'Every 15 min', value: '*/15 * * * *' },
  { label: 'Every 30 min', value: '*/30 * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Daily at 6am', value: '0 6 * * *' },
  { label: 'Daily at midnight', value: '0 0 * * *' },
  { label: 'Every Mon 8am', value: '0 8 * * 1' },
]

function cronHint(cron: string): string {
  const preset = CRON_PRESETS.find((p) => p.value === cron.trim())
  if (preset) return preset.label
  const parts = cron.trim().split(/\s+/)
  if (parts.length !== 5) return ''
  const [min, hour, dom, month, dow] = parts
  if (dom === '*' && month === '*' && dow === '*') {
    if (min === '0' && hour !== '*') return `Daily at ${hour.padStart(2, '0')}:00`
    if (min !== '*' && hour !== '*' && !min.startsWith('*/') && !hour.startsWith('*/'))
      return `Daily at ${hour.padStart(2, '0')}:${min.padStart(2, '0')}`
  }
  return ''
}

function timeAgo(iso: string | null): string {
  if (!iso) return 'Never'
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function SchedulesPage() {
  const [jobs, setJobs] = useState<ScheduledJob[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConfigured, setIsConfigured] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Create form state
  const [description, setDescription] = useState('')
  const [cron, setCron] = useState('')
  const [topic, setTopic] = useState('')
  const [payload, setPayload] = useState('')
  const [qos, setQos] = useState('0')
  const [isSaving, setIsSaving] = useState(false)

  async function load() {
    setIsLoading(true)
    try {
      const data = await schedulesApi.list()
      if (data.error) {
        setIsConfigured(false)
      } else {
        setJobs(data.jobs ?? [])
        setIsConfigured(true)
      }
    } catch {
      setIsConfigured(false)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleCreate() {
    if (!description || !cron || !topic || !payload) {
      toast.error('All fields are required')
      return
    }
    setIsSaving(true)
    try {
      const data = await schedulesApi.create({ description, cron, topic, payload, qos: Number(qos) })
      const errMsg = data.error ?? (data as Record<string, string>).detail
      if (errMsg) throw new Error(errMsg)
      if (!data.job) throw new Error('No job returned from server')
      setJobs((prev) => [data.job!, ...prev])
      setShowCreate(false)
      setDescription(''); setCron(''); setTopic(''); setPayload(''); setQos('0')
      toast.success('Schedule created')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to create schedule')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      const data = await schedulesApi.delete(id)
      if (data.error) throw new Error(data.error)
      setJobs((prev) => prev.filter((j) => j.id !== id))
      toast.success('Schedule deleted')
    } catch {
      toast.error('Failed to delete schedule')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6" />
            Scheduled Actions
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Recurring MQTT publishes on a cron schedule.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={load} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => setShowCreate(true)} disabled={!isConfigured}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Schedule
          </Button>
        </div>
      </div>

      {!isConfigured && (
        <div className="flex gap-3 rounded-md border bg-muted/50 p-4 text-sm text-muted-foreground">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            Set up BunkerAI Cloud in{' '}
            <a href="/settings/connectors" className="underline hover:text-foreground">Settings</a>{' '}
            to use Scheduled Actions.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : jobs.length === 0 && isConfigured ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          <Clock className="h-10 w-10 mx-auto mb-2 opacity-20" />
          <p>No scheduled actions yet.</p>
          <p className="text-xs mt-1 opacity-70">
            Try asking BunkerAI: "Turn on pump every day at 6am"
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="flex items-start justify-between rounded-lg border p-4 gap-4">
              <div className="space-y-1 min-w-0">
                <p className="font-medium text-sm">{job.description}</p>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="font-mono">{job.cron}</Badge>
                  <span className="opacity-70">{cronHint(job.cron)}</span>
                </div>
                <p className="text-xs text-muted-foreground font-mono truncate">
                  {job.topic} = <span className="text-foreground">{job.payload}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Last fired: {timeAgo(job.last_fired_at)} &middot; {job.fire_count}× total
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                disabled={deleting === job.id}
                onClick={() => handleDelete(job.id)}
              >
                {deleting === job.id
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Trash2 className="h-4 w-4" />}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Scheduled Action</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input placeholder="Turn on lights every morning" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Cron expression</Label>
              <div className="flex flex-wrap gap-1 mb-1.5">
                {CRON_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setCron(p.value)}
                    className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                      cron === p.value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted text-muted-foreground border-border hover:text-foreground'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <Input placeholder="0 7 * * *" value={cron} onChange={(e) => setCron(e.target.value)} className="font-mono" />
              <p className="text-xs text-muted-foreground">
                Format: <span className="font-mono">minute hour day month weekday</span>
                {cronHint(cron) && <span className="ml-2 text-green-600 dark:text-green-400">→ {cronHint(cron)}</span>}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>MQTT topic</Label>
              <Input placeholder="home/lights/cmd" value={topic} onChange={(e) => setTopic(e.target.value)} className="font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label>Payload</Label>
              <Input placeholder="ON" value={payload} onChange={(e) => setPayload(e.target.value)} className="font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label>QoS</Label>
              <select
                value={qos}
                onChange={(e) => setQos(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                <option value="0">0 — At most once</option>
                <option value="1">1 — At least once</option>
                <option value="2">2 — Exactly once</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
