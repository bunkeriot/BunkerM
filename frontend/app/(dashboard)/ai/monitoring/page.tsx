'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  RefreshCw, BellRing, CheckCheck, AlertTriangle, Info, Zap,
  ScanLine, ChevronDown, ChevronRight, BarChart2, TrendingUp,
  Activity,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { aiApi } from '@/lib/api'
import type { AiAlert, AiAnomaly, AiMetrics, AlertSeverity, AnomalyType } from '@/types'

// ─── shared helpers ───────────────────────────────────────────────────────────

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

const ANOMALY_TYPE_LABELS: Record<string, string> = {
  z_score: 'Z-Score', ewma: 'EWMA', spike: 'Rate Spike', silence: 'Silence',
}

// ─── Alerts tab ───────────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<AlertSeverity, { label: string; className: string; icon: React.ElementType }> = {
  critical: { label: 'Critical', className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400',       icon: Zap },
  high:     { label: 'High',     className: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400', icon: AlertTriangle },
  medium:   { label: 'Medium',   className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400', icon: AlertTriangle },
  low:      { label: 'Low',      className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',   icon: Info },
}

function AlertsTab() {
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
      toast.success('Alert acknowledged')
      fetchAlerts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to acknowledge alert')
    } finally {
      setAcknowledging((prev) => { const n = new Set(prev); n.delete(alert.id); return n })
    }
  }

  const unacknowledgedCount = alerts.filter((a) => !a.acknowledged).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-3 flex-wrap">
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Severity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="unacknowledged">Unacknowledged</SelectItem>
              <SelectItem value="acknowledged">Acknowledged</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchAlerts(true)} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : alerts.length === 0 ? (
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
                        <SeverityIcon className="h-3 w-3" />{cfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{alert.entity_id}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {ANOMALY_TYPE_LABELS[alert.anomaly_type] ?? alert.anomaly_type}
                    </TableCell>
                    <TableCell className="text-sm max-w-xs truncate" title={alert.description}>{alert.description}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                      {formatRelativeTime(alert.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      {!alert.acknowledged && (
                        <Button size="sm" variant="ghost" className="h-7 text-xs"
                          disabled={acknowledging.has(alert.id)} onClick={() => handleAcknowledge(alert)}>
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

      {unacknowledgedCount > 0 && (
        <p className="text-xs text-muted-foreground">{unacknowledgedCount} unacknowledged alert{unacknowledgedCount !== 1 ? 's' : ''}</p>
      )}
    </div>
  )
}

// ─── Anomalies tab ────────────────────────────────────────────────────────────

const ANOMALY_TYPE_CONFIG: Record<AnomalyType, { label: string; className: string }> = {
  z_score: { label: 'Z-Score',    className: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400' },
  ewma:    { label: 'EWMA',       className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400' },
  spike:   { label: 'Rate Spike', className: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400' },
  silence: { label: 'Silence',    className: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300' },
}

function DetailsRow({ details }: { details: Record<string, unknown> }) {
  const entries = Object.entries(details).filter(([k]) => k !== 'method')
  if (!entries.length) return null
  return (
    <div className="flex flex-wrap gap-3 mt-1">
      {entries.map(([k, v]) => (
        <span key={k} className="text-xs text-muted-foreground">
          <span className="font-medium">{k}:</span>{' '}
          {typeof v === 'number' ? v.toFixed(3) : String(v)}
        </span>
      ))}
    </div>
  )
}

function AnomaliesTab() {
  const [anomalies, setAnomalies] = useState<AiAnomaly[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [entityFilter, setEntityFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const fetchAnomalies = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true)
    try {
      const params: Parameters<typeof aiApi.getAnomalies>[0] = { limit: 100 }
      if (entityFilter.trim()) params.entity_id = entityFilter.trim()
      if (typeFilter !== 'all') params.anomaly_type = typeFilter
      const res = await aiApi.getAnomalies(params)
      setAnomalies(res.anomalies)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load anomalies')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [entityFilter, typeFilter])

  useEffect(() => {
    fetchAnomalies()
    const interval = setInterval(() => fetchAnomalies(), 30_000)
    return () => clearInterval(interval)
  }, [fetchAnomalies])

  const toggleExpand = (id: string) =>
    setExpanded((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-3 flex-wrap">
          <Input placeholder="Filter by entity…" value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)} className="w-64" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="z_score">Z-Score</SelectItem>
              <SelectItem value="ewma">EWMA</SelectItem>
              <SelectItem value="spike">Rate Spike</SelectItem>
              <SelectItem value="silence">Silence</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchAnomalies(true)} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : anomalies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border rounded-lg">
          <ScanLine className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm font-medium">No anomalies detected</p>
          <p className="text-xs mt-1">Anomalies appear once the metrics engine has built a baseline.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Entity</TableHead>
                <TableHead className="w-32">Type</TableHead>
                <TableHead className="w-24">Score</TableHead>
                <TableHead className="w-28 text-right">Detected</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {anomalies.map((anomaly) => {
                const cfg = ANOMALY_TYPE_CONFIG[anomaly.anomaly_type] ?? ANOMALY_TYPE_CONFIG.z_score
                const isExpanded = expanded.has(anomaly.id)
                return (
                  <>
                    <TableRow key={anomaly.id} className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleExpand(anomaly.id)}>
                      <TableCell className="text-muted-foreground">
                        {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{anomaly.entity_id}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${cfg.className} border text-xs`}>{cfg.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`font-mono text-sm font-semibold ${anomaly.score > 5 ? 'text-red-600' : anomaly.score > 3 ? 'text-orange-500' : 'text-yellow-600'}`}>
                          {anomaly.score.toFixed(2)}σ
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                        {formatRelativeTime(anomaly.detected_at)}
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow key={`${anomaly.id}-details`} className="bg-muted/30">
                        <TableCell /><TableCell colSpan={4} className="py-3">
                          <DetailsRow details={anomaly.details} />
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

// ─── Metrics tab ──────────────────────────────────────────────────────────────

function MetricsTab() {
  const [entities, setEntities] = useState<string[]>([])
  const [selectedEntity, setSelectedEntity] = useState<string>('')
  const [window, setWindow] = useState<'1h' | '24h'>('1h')
  const [metrics1h, setMetrics1h] = useState<AiMetrics | null>(null)
  const [metrics24h, setMetrics24h] = useState<AiMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchEntities = useCallback(async () => {
    try {
      const res = await aiApi.getEntities('topic')
      setEntities(res.entities)
      if (res.entities.length > 0 && !selectedEntity) setSelectedEntity(res.entities[0])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load entities')
    }
  }, [selectedEntity])

  const fetchMetrics = useCallback(async (showRefreshIndicator = false) => {
    if (!selectedEntity) return
    if (showRefreshIndicator) setRefreshing(true)
    try {
      const [res1h, res24h] = await Promise.all([
        aiApi.getMetrics(selectedEntity, '1h'),
        aiApi.getMetrics(selectedEntity, '24h'),
      ])
      setMetrics1h(res1h)
      setMetrics24h(res24h)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load metrics')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [selectedEntity])

  useEffect(() => { fetchEntities() }, [fetchEntities])
  useEffect(() => {
    if (selectedEntity) {
      setLoading(true)
      fetchMetrics()
      const interval = setInterval(() => fetchMetrics(), 60_000)
      return () => clearInterval(interval)
    }
  }, [selectedEntity, fetchMetrics])

  const currentMetrics = window === '1h' ? metrics1h : metrics24h
  const allFields = currentMetrics ? Object.keys(currentMetrics.fields) : []

  if (loading && entities.length === 0) {
    return <div className="flex justify-center py-12"><RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-4">
      {entities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border rounded-lg">
          <BarChart2 className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm font-medium">No metrics available yet</p>
          <p className="text-xs mt-1">Metrics are computed after the first 60s cycle runs.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex gap-3 flex-wrap items-center">
              <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                <SelectTrigger className="w-72">
                  <SelectValue placeholder="Select topic" />
                </SelectTrigger>
                <SelectContent>
                  {entities.map((e) => (
                    <SelectItem key={e} value={e}><span className="font-mono text-xs">{e}</span></SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex border rounded-md overflow-hidden">
                {(['1h', '24h'] as const).map((w) => (
                  <button key={w} onClick={() => setWindow(w)}
                    className={`px-4 py-1.5 text-sm font-medium transition-colors ${window === w ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
                    {w}
                  </button>
                ))}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => fetchMetrics(true)} disabled={refreshing || !selectedEntity}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {currentMetrics && allFields.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {allFields.slice(0, 4).map((field) => {
                const f = currentMetrics.fields[field]
                return (
                  <Card key={field}>
                    <CardHeader className="pb-1 pt-4 px-4">
                      <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{field}</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 space-y-1">
                      <p className="text-xl font-bold font-mono">{f.mean !== null ? f.mean.toFixed(2) : '—'}</p>
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span>σ {f.std !== null ? f.std.toFixed(2) : '—'}</span>
                        <span>n={f.count}</span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {metrics1h && metrics24h && allFields.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field</TableHead>
                    <TableHead className="text-center" colSpan={3}>
                      <span className="flex items-center justify-center gap-1"><TrendingUp className="h-3 w-3" /> 1h Window</span>
                    </TableHead>
                    <TableHead className="text-center" colSpan={3}>
                      <span className="flex items-center justify-center gap-1"><TrendingUp className="h-3 w-3" /> 24h Window</span>
                    </TableHead>
                  </TableRow>
                  <TableRow>
                    <TableHead />
                    <TableHead className="text-right text-xs">Mean</TableHead>
                    <TableHead className="text-right text-xs">Std Dev</TableHead>
                    <TableHead className="text-right text-xs">Count</TableHead>
                    <TableHead className="text-right text-xs">Mean</TableHead>
                    <TableHead className="text-right text-xs">Std Dev</TableHead>
                    <TableHead className="text-right text-xs">Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allFields.map((field) => {
                    const f1 = metrics1h.fields[field]
                    const f24 = metrics24h.fields[field]
                    return (
                      <TableRow key={field}>
                        <TableCell><span className="font-mono text-xs font-medium">{field}</span></TableCell>
                        <TableCell className="text-right font-mono text-sm">{f1?.mean != null ? f1.mean.toFixed(3) : '—'}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-muted-foreground">{f1?.std != null ? f1.std.toFixed(3) : '—'}</TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">{f1?.count ?? '—'}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{f24?.mean != null ? f24.mean.toFixed(3) : '—'}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-muted-foreground">{f24?.std != null ? f24.std.toFixed(3) : '—'}</TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">{f24?.count ?? '—'}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'anomalies' | 'alerts' | 'metrics'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'anomalies', label: 'Anomalies', icon: ScanLine },
  { id: 'alerts',    label: 'Alerts',    icon: BellRing },
  { id: 'metrics',   label: 'Metrics',   icon: BarChart2 },
]

export default function MonitoringPage() {
  const [activeTab, setActiveTab] = useState<Tab>('anomalies')

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Activity className="h-6 w-6" />
          Anomalies
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Statistical detection, alerts, and topic baselines.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-0 -mb-px">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'anomalies' && <AnomaliesTab />}
      {activeTab === 'alerts'    && <AlertsTab />}
      {activeTab === 'metrics'   && <MetricsTab />}
    </div>
  )
}
