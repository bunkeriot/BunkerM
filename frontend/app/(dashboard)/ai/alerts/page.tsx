'use client'

import { useEffect, useState, useCallback } from 'react'
import { RefreshCw, BellRing, CheckCheck, AlertTriangle, Info, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { aiApi } from '@/lib/api'
import type { AiAlert, AlertSeverity } from '@/types'

const SEVERITY_CONFIG: Record<AlertSeverity, { label: string; className: string; icon: React.ElementType }> = {
  critical: { label: 'Critical', className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400', icon: Zap },
  high:     { label: 'High',     className: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400', icon: AlertTriangle },
  medium:   { label: 'Medium',   className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400', icon: AlertTriangle },
  low:      { label: 'Low',      className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400', icon: Info },
}

const ANOMALY_TYPE_LABELS: Record<string, string> = {
  z_score: 'Z-Score',
  ewma:    'EWMA',
  spike:   'Rate Spike',
  silence: 'Silence',
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AiAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('unacknowledged')
  const [acknowledging, setAcknowledging] = useState<Set<string>>(new Set())

  const fetchAlerts = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true)
    try {
      const params: Parameters<typeof aiApi.getAlerts>[0] = { limit: 100 }
      if (severityFilter !== 'all') params.severity = severityFilter
      if (statusFilter !== 'all') params.acknowledged = statusFilter === 'acknowledged'
      const res = await aiApi.getAlerts(params)
      setAlerts(res.alerts)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load alerts')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [severityFilter, statusFilter])

  useEffect(() => {
    fetchAlerts()
    const interval = setInterval(() => fetchAlerts(), 30_000)
    return () => clearInterval(interval)
  }, [fetchAlerts])

  const handleAcknowledge = async (alert: AiAlert) => {
    setAcknowledging((prev) => new Set(prev).add(alert.id))
    try {
      await aiApi.acknowledgeAlert(alert.id)
      toast.success(`Alert acknowledged`)
      fetchAlerts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to acknowledge alert')
    } finally {
      setAcknowledging((prev) => {
        const next = new Set(prev)
        next.delete(alert.id)
        return next
      })
    }
  }

  const unacknowledgedCount = alerts.filter((a) => !a.acknowledged).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <p className="text-sm">Loading alerts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BellRing className="h-6 w-6" />
            Alerts
            {unacknowledgedCount > 0 && (
              <Badge variant="destructive" className="ml-1">{unacknowledgedCount}</Badge>
            )}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Auto-detected anomaly alerts. Refreshes every 30s.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchAlerts(true)} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="unacknowledged">Unacknowledged</SelectItem>
            <SelectItem value="acknowledged">Acknowledged</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border rounded-lg">
          <BellRing className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm font-medium">No alerts found</p>
          <p className="text-xs mt-1">Alerts appear when anomalies exceed the detection threshold.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Severity</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead className="w-28">Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-28 text-right">Time</TableHead>
                <TableHead className="w-32 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert) => {
                const cfg = SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.low
                const SeverityIcon = cfg.icon
                return (
                  <TableRow key={alert.id} className={alert.acknowledged ? 'opacity-50' : ''}>
                    <TableCell>
                      <Badge className={`${cfg.className} border flex items-center gap-1 w-fit`}>
                        <SeverityIcon className="h-3 w-3" />
                        {cfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                        {alert.entity_id}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {ANOMALY_TYPE_LABELS[alert.anomaly_type] ?? alert.anomaly_type}
                    </TableCell>
                    <TableCell className="text-sm max-w-xs truncate" title={alert.description}>
                      {alert.description}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                      {formatRelativeTime(alert.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      {!alert.acknowledged && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          disabled={acknowledging.has(alert.id)}
                          onClick={() => handleAcknowledge(alert)}
                        >
                          <CheckCheck className="h-3 w-3 mr-1" />
                          {acknowledging.has(alert.id) ? 'Saving…' : 'Acknowledge'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
