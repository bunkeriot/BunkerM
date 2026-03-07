'use client'

import { useEffect, useState } from 'react'
import { X, Sparkles, ExternalLink, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export function ActivationBanner() {
  const [show, setShow] = useState(false)
  const [instanceId, setInstanceId] = useState<string | null>(null)
  const [cloudUnreachable, setCloudUnreachable] = useState(false)
  const [manualKey, setManualKey] = useState('')
  const [applying, setApplying] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/settings/activation-status')
      .then((r) => r.json())
      .then((data) => {
        if (!data.activated) {
          setInstanceId(data.instance_id)
          setShow(true)
          // If instance_id exists but not activated, cloud was unreachable during startup
          if (data.instance_id) setCloudUnreachable(true)
        }
      })
      .catch(() => {})
  }, [])

  async function handleApplyKey() {
    if (!manualKey.trim()) return
    setApplying(true)
    try {
      const resp = await fetch('/api/settings/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: manualKey.trim() }),
      })
      const data = await resp.json()
      if (resp.ok && data.activated) {
        toast.success('BunkerM activated successfully!')
        setShow(false)
      } else {
        toast.error(data.detail || data.error || 'Invalid key — please check and try again.')
      }
    } catch {
      toast.error('Could not reach the agent service.')
    } finally {
      setApplying(false)
    }
  }

  function copyInstanceId() {
    if (!instanceId) return
    navigator.clipboard.writeText(instanceId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!show || dismissed) return null

  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 px-4 py-2.5 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-sm">
      <div className="flex items-start gap-2 flex-1 min-w-0">
        <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        {cloudUnreachable ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0">
            <span className="text-amber-800 dark:text-amber-200 shrink-0">
              Activate your BunkerM to unlock all features.{' '}
              <a
                href="https://bunkerai.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="underline inline-flex items-center gap-0.5 hover:opacity-80"
              >
                Get your free key at bunkerai.dev
                <ExternalLink className="h-3 w-3" />
              </a>
            </span>
            {instanceId && (
              <span className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300 font-mono bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded shrink-0">
                ID: {instanceId}
                <button onClick={copyInstanceId} className="ml-1 hover:opacity-70 transition-opacity">
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </button>
              </span>
            )}
            <div className="flex items-center gap-1.5 w-full sm:w-auto max-w-xs">
              <Input
                placeholder="Paste key here…"
                value={manualKey}
                onChange={(e) => setManualKey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyKey()}
                className="h-7 text-xs font-mono"
              />
              <Button
                size="sm"
                className="h-7 text-xs shrink-0"
                onClick={handleApplyKey}
                disabled={applying || !manualKey.trim()}
              >
                {applying ? 'Applying…' : 'Apply'}
              </Button>
            </div>
          </div>
        ) : (
          <span className="text-amber-800 dark:text-amber-200">
            Activate your BunkerM to unlock all features.{' '}
            <a
              href="https://bunkerai.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="underline inline-flex items-center gap-0.5 hover:opacity-80"
            >
              Create a free account
              <ExternalLink className="h-3 w-3" />
            </a>
          </span>
        )}
      </div>

      <button
        onClick={() => setDismissed(true)}
        className="self-start sm:self-center text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
