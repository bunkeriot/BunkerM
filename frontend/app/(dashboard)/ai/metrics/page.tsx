'use client'

import { useEffect, useState, useCallback } from 'react'
import { RefreshCw, BarChart2, TrendingUp, Hash, Sigma } from 'lucide-react'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { aiApi } from '@/lib/api'
import type { AiMetrics } from '@/types'

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-bold font-mono">{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function MetricsPage() {
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
      if (res.entities.length > 0 && !selectedEntity) {
        setSelectedEntity(res.entities[0])
      }
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

  useEffect(() => {
    fetchEntities()
  }, [fetchEntities])

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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <p className="text-sm">Loading metrics...</p>
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
            <BarChart2 className="h-6 w-6" />
            Metrics
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Statistical baselines computed per topic. Updates every 60s.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchMetrics(true)} disabled={refreshing || !selectedEntity}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {entities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border rounded-lg">
          <BarChart2 className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm font-medium">No metrics available yet</p>
          <p className="text-xs mt-1">Metrics are computed after the first 60s metrics cycle runs.</p>
        </div>
      ) : (
        <>
          {/* Entity + Window selector */}
          <div className="flex gap-3 flex-wrap items-center">
            <Select value={selectedEntity} onValueChange={setSelectedEntity}>
              <SelectTrigger className="w-72">
                <SelectValue placeholder="Select topic" />
              </SelectTrigger>
              <SelectContent>
                {entities.map((e) => (
                  <SelectItem key={e} value={e}>
                    <span className="font-mono text-xs">{e}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex border rounded-md overflow-hidden">
              {(['1h', '24h'] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => setWindow(w)}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                    window === w
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>

            {currentMetrics && (
              <Badge variant="outline" className="text-xs">
                {selectedEntity}
              </Badge>
            )}
          </div>

          {/* Stats overview cards */}
          {currentMetrics && allFields.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {allFields.slice(0, 4).map((field) => {
                const f = currentMetrics.fields[field]
                return (
                  <Card key={field}>
                    <CardHeader className="pb-1 pt-4 px-4">
                      <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                        {field}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 space-y-1">
                      <p className="text-xl font-bold font-mono">
                        {f.mean !== null ? f.mean.toFixed(2) : '—'}
                      </p>
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

          {/* Detailed table — compare 1h vs 24h */}
          {metrics1h && metrics24h && allFields.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field</TableHead>
                    <TableHead className="text-center" colSpan={3}>
                      <span className="flex items-center justify-center gap-1">
                        <TrendingUp className="h-3 w-3" /> 1h Window
                      </span>
                    </TableHead>
                    <TableHead className="text-center" colSpan={3}>
                      <span className="flex items-center justify-center gap-1">
                        <TrendingUp className="h-3 w-3" /> 24h Window
                      </span>
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
                        <TableCell>
                          <span className="font-mono text-xs font-medium">{field}</span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {f1?.mean !== null && f1?.mean !== undefined ? f1.mean.toFixed(3) : '—'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-muted-foreground">
                          {f1?.std !== null && f1?.std !== undefined ? f1.std.toFixed(3) : '—'}
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {f1?.count ?? '—'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {f24?.mean !== null && f24?.mean !== undefined ? f24.mean.toFixed(3) : '—'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-muted-foreground">
                          {f24?.std !== null && f24?.std !== undefined ? f24.std.toFixed(3) : '—'}
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {f24?.count ?? '—'}
                        </TableCell>
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
