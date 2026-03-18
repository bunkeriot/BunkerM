'use client'

import { useEffect, useState } from 'react'
import { X, WifiOff } from 'lucide-react'

export function ActivationBanner() {
  // Only show when we've confirmed the container has no internet access.
  // If internet is available, activation is fully automatic and silent.
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    fetch('/api/settings/activation-status')
      .then((r) => r.json())
      .then((data) => {
        // activated: true  → nothing to show
        // activated: false, instance_id present → internet was reachable but cloud
        //   activation is still in progress (auto-retry on next restart) — stay silent
        // activated: false, instance_id null → container couldn't reach internet at all
        if (!data.activated && !data.instance_id) {
          setShow(true)
        }
      })
      .catch(() => {})
  }, [])

  if (!show || dismissed) return null

  return (
    <div className="w-full bg-muted/60 border-b border-border px-4 py-2 flex items-center gap-2 text-sm text-muted-foreground">
      <WifiOff className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1">
        BunkerAI features require internet access. Grant the container outbound access and restart it to enable them.
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="hover:text-foreground transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
