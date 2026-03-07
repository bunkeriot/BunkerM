'use client'

import { useEffect, useState } from 'react'
import { Eye, Plus, Trash2, Loader2, Info, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { watchersApi } from '@/lib/api'
import type { Watcher } from '@/types'

const OPERATORS = ['>', '<', '>=', '<=', '==', '!=', 'contains', 'starts_with', 'any_change']

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

function conditionLabel(w: Watcher): string {
  if (w.condition_operator === 'any_change') return 'any change'
  const field = w.condition_field ? `.${w.condition_field}` : ''
  return `payload${field} ${w.condition_operator} ${w.condition_value}`
}

export default function WatchersPage() {
  const [watchers, setWatchers] = useState<Watcher[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConfigured, setIsConfigured] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Create form state
  const [description, setDescription] = useState('')
  const [topic, setTopic] = useState('')
  const [conditionField, setConditionField] = useState('')
  const [conditionOperator, setConditionOperator] = useState('>')
  const [conditionValue, setConditionValue] = useState('')
  const [responseTemplate, setResponseTemplate] = useState('')
  const [oneShot, setOneShot] = useState(false)
  const [cooldown, setCooldown] = useState('10')
  const [isSaving, setIsSaving] = useState(false)

  async function load() {
    setIsLoading(true)
    try {
      const data = await watchersApi.list()
      if (data.error) {
        setIsConfigured(false)
      } else {
        setWatchers(data.watchers ?? [])
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
    if (!description || !topic || !responseTemplate) {
      toast.error('Description, topic, and notification text are required')
      return
    }
    if (conditionOperator !== 'any_change' && !conditionValue) {
      toast.error('Condition value is required')
      return
    }
    setIsSaving(true)
    try {
      const data = await watchersApi.create({
        description,
        topic,
        condition_field: conditionField || undefined,
        condition_operator: conditionOperator,
        condition_value: conditionOperator === 'any_change' ? 'any' : conditionValue,
        response_template: responseTemplate,
        one_shot: oneShot,
        cooldown_seconds: Number(cooldown) || 10,
      })
      if (data.error) throw new Error(data.error)
      setWatchers((prev) => [data.watcher!, ...prev])
      setShowCreate(false)
      setDescription(''); setTopic(''); setConditionField(''); setConditionValue('')
      setResponseTemplate(''); setOneShot(false); setCooldown('10')
      toast.success('Watcher activated')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to create watcher')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      const data = await watchersApi.delete(id)
      if (data.error) throw new Error(data.error)
      setWatchers((prev) => prev.filter((w) => w.id !== id))
      toast.success('Watcher removed')
    } catch {
      toast.error('Failed to remove watcher')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Eye className="h-6 w-6" />
            Topic Watchers
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Get notified when an MQTT topic meets a condition.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={load} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => setShowCreate(true)} disabled={!isConfigured}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Watcher
          </Button>
        </div>
      </div>

      {!isConfigured && (
        <div className="flex gap-3 rounded-md border bg-muted/50 p-4 text-sm text-muted-foreground">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            Set up BunkerAI Cloud in{' '}
            <a href="/settings/connectors" className="underline hover:text-foreground">Settings</a>{' '}
            to use Topic Watchers.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : watchers.length === 0 && isConfigured ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          <Eye className="h-10 w-10 mx-auto mb-2 opacity-20" />
          <p>No active watchers.</p>
          <p className="text-xs mt-1 opacity-70">
            Try asking BunkerAI: "Alert me when temperature exceeds 30°C"
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {watchers.map((w) => (
            <div key={w.id} className="flex items-start justify-between rounded-lg border p-4 gap-4">
              <div className="space-y-1.5 min-w-0">
                <p className="font-medium text-sm">{w.description}</p>
                <p className="text-xs font-mono text-muted-foreground truncate">{w.topic}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs font-mono">{conditionLabel(w)}</Badge>
                  {w.one_shot && <Badge variant="outline" className="text-xs">one-shot</Badge>}
                  {w.cooldown_seconds > 0 && (
                    <Badge variant="outline" className="text-xs">cooldown {w.cooldown_seconds}s</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground italic truncate">"{w.response_template}"</p>
                <p className="text-xs text-muted-foreground">
                  Last fired: {timeAgo(w.last_fired_at)} &middot; {w.fire_count}× total
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                disabled={deleting === w.id}
                onClick={() => handleDelete(w.id)}
              >
                {deleting === w.id
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
            <DialogTitle>New Topic Watcher</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input placeholder="High temperature alert" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>MQTT topic</Label>
              <Input placeholder="building/room1/temperature" value={topic} onChange={(e) => setTopic(e.target.value)} className="font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label>JSON field (optional)</Label>
              <Input placeholder="temperature  or  sensors.temp" value={conditionField} onChange={(e) => setConditionField(e.target.value)} className="font-mono" />
              <p className="text-xs text-muted-foreground">Leave empty to use the raw payload value</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Operator</Label>
                <select
                  value={conditionOperator}
                  onChange={(e) => setConditionOperator(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                >
                  {OPERATORS.map((op) => <option key={op} value={op}>{op}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Value</Label>
                <Input
                  placeholder="30"
                  value={conditionValue}
                  onChange={(e) => setConditionValue(e.target.value)}
                  disabled={conditionOperator === 'any_change'}
                  className="font-mono"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notification message</Label>
              <Input
                placeholder="Temperature is {{value}}°C — threshold exceeded"
                value={responseTemplate}
                onChange={(e) => setResponseTemplate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Use {`{{value}}`}, {`{{topic}}`}, {`{{timestamp}}`}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Cooldown (seconds)</Label>
                <Input type="number" min="0" value={cooldown} onChange={(e) => setCooldown(e.target.value)} />
              </div>
              <div className="flex items-end pb-1 gap-2">
                <input
                  type="checkbox"
                  id="one-shot"
                  checked={oneShot}
                  onChange={(e) => setOneShot(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="one-shot" className="cursor-pointer">One-shot (auto-delete after firing)</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Activate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
