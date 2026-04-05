'use client'

import { useEffect, useState, useCallback } from 'react'
import { RefreshCw, ScanLine, ChevronDown, ChevronRight } from 'lucide-react'
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
import { aiApi } from '@/lib/api'
import type { AiAnomaly, AnomalyType } from '@/types'

const ANOMALY_TYPE_CONFIG: Record<AnomalyType, { label: string; className: string }> = {
  z_score: { label: 'Z-Score',    className: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400' },
  ewma:    { label: 'EWMA',       className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400' },
  spike:   { label: 'Rate Spike', className: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400' },
  silence: { label: 'Silence',    className: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300' },
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

function DetailsRow({ details }: { details: Record<string, unknown> }) {
  const interesting = Object.entries(details).filter(
    ([k]) => !['method'].includes(k)
  )
  if (interesting.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {interesting.map(([k, v]) => (
        <span key={k} className="text-xs text-muted-foreground">
          <span className="font-medium">{k}:</span>{' '}
          {typeof v === 'number' ? v.toFixed(3) : String(v)}
        </span>
      ))}
    </div>
  )
}

export default function AnomaliesPage() {
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

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <p className="text-sm">Loading anomalies...</p>
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
            <ScanLine className="h-6 w-6" />
            Anomalies
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Statistical deviations detected across MQTT topics. Refreshes every 30s.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchAnomalies(true)} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Filter by entity (e.g. factory/sensor1)"
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="w-72"
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Anomaly type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="z_score">Z-Score</SelectItem>
            <SelectItem value="ewma">EWMA</SelectItem>
            <SelectItem value="spike">Rate Spike</SelectItem>
            <SelectItem value="silence">Silence</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {anomalies.length === 0 ? (
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
                    <TableRow
                      key={anomaly.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleExpand(anomaly.id)}
                    >
                      <TableCell className="text-muted-foreground">
                        {isExpanded
                          ? <ChevronDown className="h-3 w-3" />
                          : <ChevronRight className="h-3 w-3" />}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                          {anomaly.entity_id}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${cfg.className} border text-xs`}>
                          {cfg.label}
                        </Badge>
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
                        <TableCell />
                        <TableCell colSpan={4} className="py-3">
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
