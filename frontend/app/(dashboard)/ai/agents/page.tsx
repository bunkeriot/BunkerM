'use client'

import { useEffect, useState } from 'react'
import { Bot, Plus, Trash2, Loader2, Info, RefreshCw, Clock, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { schedulesApi, watchersApi } from '@/lib/api'
import type { ScheduledJob, Watcher } from '@/types'

// ─── helpers ──────────────────────────────────────────────────────────────────

const OPERATORS = ['>', '<', '>=', '<=', '==', '!=', 'contains', 'starts_with', 'any_change']

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
  const [min, hour, dom, month] = parts
  if (dom === '*' && month === '*') {
    if (min === '0' && hour !== '*') return `Daily at ${hour.padStart(2, '0')}:00`
    if (min !== '*' && hour !== '*' && !min.startsWith('*/') && !hour.startsWith('*/'))
      return `Daily at ${hour.padStart(2, '0')}:${min.padStart(2, '0')}`
  }
  return ''
}

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return 'Never'
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function conditionLabel(w: Watcher): string {
  if (w.condition_operator === 'any_change') return 'any change'
  const field = w.condition_field ? `.${w.condition_field}` : ''
  return `payload${field} ${w.condition_operator} ${w.condition_value}`
}

// ─── types ────────────────────────────────────────────────────────────────────

type AgentType = 'watcher' | 'scheduler'
type ModalStep = 'select-type' | 'create-form'

// ─── component ────────────────────────────────────────────────────────────────

export default function AgentsPage() {
  const [jobs, setJobs] = useState<ScheduledJob[]>([])
  const [watchers, setWatchers] = useState<Watcher[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConfigured, setIsConfigured] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalStep, setModalStep] = useState<ModalStep>('select-type')
  const [agentType, setAgentType] = useState<AgentType>('watcher')
  const [isSaving, setIsSaving] = useState(false)

  // Scheduler form
  const [sDesc, setSDesc] = useState('')
  const [sCron, setSCron] = useState('')
  const [sTopic, setSTopic] = useState('')
  const [sPayload, setSPayload] = useState('')
  const [sQos, setSQos] = useState('0')

  // Watcher form
  const [wDesc, setWDesc] = useState('')
  const [wTopic, setWTopic] = useState('')
  const [wField, setWField] = useState('')
  const [wOp, setWOp] = useState('>')
  const [wVal, setWVal] = useState('')
  const [wTemplate, setWTemplate] = useState('')
  const [wOneShot, setWOneShot] = useState(false)
  const [wCooldown, setWCooldown] = useState('10')

  async function load() {
    setIsLoading(true)
    try {
      const [jRes, wRes] = await Promise.all([schedulesApi.list(), watchersApi.list()])
      if (jRes.error || wRes.error) {
        setIsConfigured(false)
      } else {
        setJobs(jRes.jobs ?? [])
        setWatchers(wRes.watchers ?? [])
        setIsConfigured(true)
      }
    } catch {
      setIsConfigured(false)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // ── open/close modal ──────────────────────────────────────────────────────

  function openModal() {
    setModalStep('select-type')
    setAgentType('watcher')
    resetForms()
    setModalOpen(true)
  }

  function resetForms() {
    setSDesc(''); setSCron(''); setSTopic(''); setSPayload(''); setSQos('0')
    setWDesc(''); setWTopic(''); setWField(''); setWOp('>'); setWVal('')
    setWTemplate(''); setWOneShot(false); setWCooldown('10')
  }

  // ── create ────────────────────────────────────────────────────────────────

  async function handleCreateScheduler() {
    if (!sDesc || !sCron || !sTopic || !sPayload) {
      toast.error('All fields are required')
      return
    }
    setIsSaving(true)
    try {
      const data = await schedulesApi.create({ description: sDesc, cron: sCron, topic: sTopic, payload: sPayload, qos: Number(sQos) })
      const err = data.error ?? (data as Record<string, string>).detail
      if (err) throw new Error(err)
      if (!data.job) throw new Error('No job returned')
      setJobs((prev) => [data.job!, ...prev])
      setModalOpen(false)
      toast.success('Scheduler created')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to create scheduler')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleCreateWatcher() {
    if (!wDesc || !wTopic || !wTemplate) {
      toast.error('Description, topic, and notification text are required')
      return
    }
    if (wOp !== 'any_change' && !wVal) {
      toast.error('Condition value is required')
      return
    }
    setIsSaving(true)
    try {
      const data = await watchersApi.create({
        description: wDesc, topic: wTopic,
        condition_field: wField || undefined,
        condition_operator: wOp,
        condition_value: wOp === 'any_change' ? 'any' : wVal,
        response_template: wTemplate,
        one_shot: wOneShot,
        cooldown_seconds: Number(wCooldown) || 10,
      })
      if (data.error) throw new Error(data.error)
      setWatchers((prev) => [data.watcher!, ...prev])
      setModalOpen(false)
      toast.success('Watcher activated')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to create watcher')
    } finally {
      setIsSaving(false)
    }
  }

  // ── delete ────────────────────────────────────────────────────────────────

  async function handleDeleteJob(id: string) {
    setDeleting(id)
    try {
      await schedulesApi.delete(id)
      setJobs((prev) => prev.filter((j) => j.id !== id))
      toast.success('Scheduler removed')
    } catch { toast.error('Failed to remove scheduler') }
    finally { setDeleting(null) }
  }

  async function handleDeleteWatcher(id: string) {
    setDeleting(id)
    try {
      await watchersApi.delete(id)
      setWatchers((prev) => prev.filter((w) => w.id !== id))
      toast.success('Watcher removed')
    } catch { toast.error('Failed to remove watcher') }
    finally { setDeleting(null) }
  }

  // ── combined sorted list ──────────────────────────────────────────────────

  const allAgents = [
    ...jobs.map((j) => ({ kind: 'scheduler' as const, id: j.id, created_at: j.created_at, data: j })),
    ...watchers.map((w) => ({ kind: 'watcher' as const, id: w.id, created_at: w.created_at, data: w })),
  ].sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6" />
            Agents
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Automated actions: schedule MQTT publishes or watch for conditions.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={load} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={openModal} disabled={!isConfigured}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Agent
          </Button>
        </div>
      </div>

      {/* Not configured */}
      {!isConfigured && (
        <div className="flex gap-3 rounded-md border bg-muted/50 p-4 text-sm text-muted-foreground">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            Set up BunkerAI Cloud in{' '}
            <a href="/settings" className="underline hover:text-foreground">Settings</a>{' '}
            to use Agents.
          </p>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : allAgents.length === 0 && isConfigured ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          <Bot className="h-10 w-10 mx-auto mb-2 opacity-20" />
          <p>No active agents yet.</p>
          <p className="text-xs mt-1 opacity-70">
            Try asking BunkerAI: "Turn on pump every day at 6am" or "Alert me when temperature exceeds 30°C"
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {allAgents.map((agent) => {
            if (agent.kind === 'scheduler') {
              const j = agent.data as ScheduledJob
              return (
                <div key={`job-${j.id}`} className="flex items-start justify-between rounded-lg border p-4 gap-4">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{j.description}</p>
                      <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-0 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        Scheduler
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="font-mono">{j.cron}</Badge>
                      {cronHint(j.cron) && <span className="opacity-70">{cronHint(j.cron)}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {j.topic} = <span className="text-foreground">{j.payload}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last fired: {timeAgo(j.last_fired_at)} &middot; {j.fire_count}× total
                    </p>
                  </div>
                  <Button
                    variant="ghost" size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    disabled={deleting === j.id}
                    onClick={() => handleDeleteJob(j.id)}
                  >
                    {deleting === j.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </div>
              )
            }

            const w = agent.data as Watcher
            return (
              <div key={`watcher-${w.id}`} className="flex items-start justify-between rounded-lg border p-4 gap-4">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{w.description}</p>
                    <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-0 flex items-center gap-1">
                      <Eye className="h-2.5 w-2.5" />
                      Watcher
                    </Badge>
                  </div>
                  <p className="text-xs font-mono text-muted-foreground truncate">{w.topic}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs font-mono">{conditionLabel(w)}</Badge>
                    {w.one_shot && <Badge variant="outline" className="text-xs">one-shot</Badge>}
                    {w.cooldown_seconds > 0 && <Badge variant="outline" className="text-xs">cooldown {w.cooldown_seconds}s</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground italic truncate">"{w.response_template}"</p>
                  <p className="text-xs text-muted-foreground">
                    Last fired: {timeAgo(w.last_fired_at)} &middot; {w.fire_count}× total
                  </p>
                </div>
                <Button
                  variant="ghost" size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  disabled={deleting === w.id}
                  onClick={() => handleDeleteWatcher(w.id)}
                >
                  {deleting === w.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </div>
            )
          })}
        </div>
      )}

      {/* ── New Agent Modal ── */}
      <Dialog open={modalOpen} onOpenChange={(o) => { if (!o) setModalOpen(false) }}>
        <DialogContent className="max-w-md">
          {modalStep === 'select-type' ? (
            <>
              <DialogHeader>
                <DialogTitle>New Agent</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-3">
                <Label>Agent type</Label>
                <select
                  value={agentType}
                  onChange={(e) => setAgentType(e.target.value as AgentType)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  <option value="watcher">Watcher — trigger alert when a topic meets a condition</option>
                  <option value="scheduler">Scheduler — publish a message on a cron schedule</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  {agentType === 'watcher'
                    ? 'Monitors an MQTT topic and fires when a condition is met (e.g. temperature > 30).'
                    : 'Publishes an MQTT message on a recurring cron schedule (e.g. every day at 7am).'}
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button onClick={() => setModalStep('create-form')}>
                  Continue
                </Button>
              </DialogFooter>
            </>
          ) : agentType === 'scheduler' ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" /> New Scheduler Agent
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2 max-h-[65vh] overflow-y-auto pr-1">
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Input placeholder="Turn on lights every morning" value={sDesc} onChange={(e) => setSDesc(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Cron expression</Label>
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {CRON_PRESETS.map((p) => (
                      <button
                        key={p.value} type="button"
                        onClick={() => setSCron(p.value)}
                        className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                          sCron === p.value
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-muted text-muted-foreground border-border hover:text-foreground'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <Input placeholder="0 7 * * *" value={sCron} onChange={(e) => setSCron(e.target.value)} className="font-mono" />
                  <p className="text-xs text-muted-foreground">
                    Format: <span className="font-mono">minute hour day month weekday</span>
                    {cronHint(sCron) && <span className="ml-2 text-green-600 dark:text-green-400">→ {cronHint(sCron)}</span>}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label>MQTT topic</Label>
                  <Input placeholder="home/lights/cmd" value={sTopic} onChange={(e) => setSTopic(e.target.value)} className="font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label>Payload</Label>
                  <Input placeholder="ON" value={sPayload} onChange={(e) => setSPayload(e.target.value)} className="font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label>QoS</Label>
                  <select value={sQos} onChange={(e) => setSQos(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                    <option value="0">0 — At most once</option>
                    <option value="1">1 — At least once</option>
                    <option value="2">2 — Exactly once</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setModalStep('select-type')}>Back</Button>
                <Button onClick={handleCreateScheduler} disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="h-4 w-4" /> New Watcher Agent
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2 max-h-[65vh] overflow-y-auto pr-1">
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Input placeholder="High temperature alert" value={wDesc} onChange={(e) => setWDesc(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>MQTT topic</Label>
                  <Input placeholder="building/room1/temperature" value={wTopic} onChange={(e) => setWTopic(e.target.value)} className="font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label>JSON field (optional)</Label>
                  <Input placeholder="temperature  or  sensors.temp" value={wField} onChange={(e) => setWField(e.target.value)} className="font-mono" />
                  <p className="text-xs text-muted-foreground">Leave empty to use the raw payload value</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Operator</Label>
                    <select value={wOp} onChange={(e) => setWOp(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm">
                      {OPERATORS.map((op) => <option key={op} value={op}>{op}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Value</Label>
                    <Input placeholder="30" value={wVal} onChange={(e) => setWVal(e.target.value)}
                      disabled={wOp === 'any_change'} className="font-mono" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Notification message</Label>
                  <Input placeholder="Temperature is {{value}}°C — threshold exceeded"
                    value={wTemplate} onChange={(e) => setWTemplate(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Use {`{{value}}`}, {`{{topic}}`}, {`{{timestamp}}`}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Cooldown (seconds)</Label>
                    <Input type="number" min="0" value={wCooldown} onChange={(e) => setWCooldown(e.target.value)} />
                  </div>
                  <div className="flex items-end pb-1 gap-2">
                    <input type="checkbox" id="one-shot" checked={wOneShot}
                      onChange={(e) => setWOneShot(e.target.checked)} className="h-4 w-4" />
                    <Label htmlFor="one-shot" className="cursor-pointer text-xs">One-shot (auto-delete after firing)</Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setModalStep('select-type')}>Back</Button>
                <Button onClick={handleCreateWatcher} disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                  Activate
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
