'use client'

import { useEffect, useState, useCallback } from 'react'
import { RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { monitorApi } from '@/lib/api'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { BytesChart } from '@/components/dashboard/BytesChart'
import { MessagesChart } from '@/components/dashboard/MessagesChart'
import { Button } from '@/components/ui/button'
import type { MonitorStats, ChartDataPoint, MessageDataPoint } from '@/types'

export default function DashboardPage() {
  const [stats, setStats] = useState<MonitorStats | null>(null)
  const [bytesHistory, setBytesHistory] = useState<ChartDataPoint[]>([])
  const [messageHistory, setMessageHistory] = useState<MessageDataPoint[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await monitorApi.getStats() as MonitorStats
      setStats(data)
      setLastUpdated(new Date())

      // Build bytes chart — backend returns timestamps as "YYYY-MM-DD HH:MM" in server local time.
      // Parse with explicit components to avoid any UTC offset shift, then format with system locale.
      if (data.bytes_stats?.timestamps?.length) {
        const today = new Date()
        const points: ChartDataPoint[] = data.bytes_stats.timestamps.map((ts, i) => {
          const [datePart, timePart] = ts.split(' ')
          const [yr, mo, dy] = datePart.split('-').map(Number)
          const [hr, mn] = (timePart ?? '00:00').split(':').map(Number)
          const d = new Date(yr, mo - 1, dy, hr, mn)
          const isToday = d.getDate() === today.getDate() &&
            d.getMonth() === today.getMonth() &&
            d.getFullYear() === today.getFullYear()
          const label = isToday
            ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
          return {
            time: label,
            bytesSent: data.bytes_stats.bytes_sent[i] ?? 0,
            bytesReceived: data.bytes_stats.bytes_received[i] ?? 0,
          }
        })
        setBytesHistory(points)
      }

      // Build messages chart from published_history (15-point sliding window, one entry per minute).
      // daily_message_stats is empty until a full day of data accumulates, so use published_history instead.
      if (data.published_history?.length) {
        const now = new Date()
        const total = data.published_history.length
        const points: MessageDataPoint[] = (data.published_history as number[]).map((count, i) => {
          const minutesAgo = total - 1 - i
          const t = new Date(now.getTime() - minutesAgo * 60 * 1000)
          return {
            date: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            count,
          }
        })
        setMessageHistory(points)
      }
    } catch {
      // Backend may not be running — fail silently
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [fetchData])

  const brokerConnected = stats?.mqtt_connected ?? false

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">MQTT Broker Overview</p>
        </div>
        <div className="flex items-center gap-3">
          {stats && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {brokerConnected
                ? <Wifi className="h-3 w-3 text-green-500" />
                : <WifiOff className="h-3 w-3 text-destructive" />}
              {brokerConnected ? 'Broker connected' : 'Broker offline'}
            </div>
          )}
          {lastUpdated && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <StatsCards stats={stats} />

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <BytesChart data={bytesHistory} />
        <MessagesChart data={messageHistory} />
      </div>
    </div>
  )
}
