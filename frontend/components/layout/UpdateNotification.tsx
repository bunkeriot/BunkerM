'use client'

import { Bell, CheckCircle, CloudDownload, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react'
import { useVersionCheck } from '@/hooks/useVersionCheck'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function UpdateNotification() {
  const {
    versionInfo,
    loading,
    error,
    checkForUpdates,
    dismiss,
    clearCacheAndCheck,
    currentVersion,
  } = useVersionCheck()

  const hasUpdate = versionInfo?.updateAvailable ?? false

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {hasUpdate && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              1
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {hasUpdate && (
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={dismiss}>
              Dismiss
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="max-h-64 overflow-y-auto">
          {hasUpdate && versionInfo ? (
            <div className="p-3 space-y-2">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-500/15">
                  <CloudDownload className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">New Version Available!</p>
                  <p className="text-xs text-muted-foreground">
                    BunkerM <Badge variant="warning" className="mx-0.5">{versionInfo.latestVersion}</Badge> is
                    available. You are running {versionInfo.currentVersion}.
                  </p>
                  {versionInfo.lastChecked && (
                    <p className="text-xs text-muted-foreground/60">
                      Checked: {new Date(versionInfo.lastChecked).toLocaleString()}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-1 h-7 text-xs"
                    onClick={() => window.open(versionInfo.dockerHubUrl, '_blank')}
                  >
                    <ExternalLink className="mr-1.5 h-3 w-3" />
                    View on Docker Hub
                  </Button>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="p-3">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/15">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Update Check Failed</p>
                  <p className="text-xs text-muted-foreground">
                    Could not reach Docker Hub. Try again later.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/15">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">No Updates Available</p>
                  <p className="text-xs text-muted-foreground">
                    You are running the latest version ({currentVersion}).
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DropdownMenuSeparator />
        <div className="p-2 flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={checkForUpdates}
            disabled={loading}
          >
            <RefreshCw className={`mr-1.5 h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Check for Updates
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={clearCacheAndCheck}
            disabled={loading}
          >
            Clear Cache
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
