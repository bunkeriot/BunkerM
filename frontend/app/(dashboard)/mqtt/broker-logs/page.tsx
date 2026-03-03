'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { RefreshCw, Download, ArrowDown } from 'lucide-react'
import { toast } from 'sonner'
import { monitorApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

interface LogLine {
  raw: string
  timestamp?: string
  level?: string
  message?: string
}

function parseLine(line: string): LogLine {
  // Try to parse: "1234567890: Notice: message"
  const match = line.match(/^(\d+):\s+(Notice|Warning|Error|Info|Debug):\s+(.+)$/i)
  if (match) {
    const ts = new Date(parseInt(match[1]) * 1000).toLocaleTimeString()
    return { raw: line, timestamp: ts, level: match[2], message: match[3] }
  }
  return { raw: line }
}

function getLevelVariant(level?: string): 'default' | 'destructive' | 'warning' | 'secondary' {
  switch (level?.toLowerCase()) {
    case 'error': return 'destructive'
    case 'warning': return 'warning'
    case 'notice':
    case 'info': return 'secondary'
    default: return 'default'
  }
}

export default function BrokerLogsPage() {
  const [logs, setLogs] = useState<LogLine[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await monitorApi.getBrokerLogs()
      const lines = (data.logs || []).map(parseLine)
      setLogs(lines)
    } catch {
      toast.error('Failed to fetch broker logs')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    if (autoScroll) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs, autoScroll])

  const downloadLogs = () => {
    const content = logs.map((l) => l.raw).join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `broker-logs-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Broker Logs</h1>
          <p className="text-muted-foreground text-sm">Mosquitto broker log output</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setAutoScroll(!autoScroll)}>
            <ArrowDown className={`h-4 w-4 ${autoScroll ? 'text-primary' : ''}`} />
            Auto-scroll {autoScroll ? 'On' : 'Off'}
          </Button>
          <Button variant="outline" size="sm" onClick={downloadLogs} disabled={logs.length === 0}>
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            Log Output
            <Badge variant="secondary">{logs.length} lines</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-280px)] w-full">
            <div className="font-mono text-xs space-y-0.5 p-2 bg-muted/50 rounded-md min-h-[200px]">
              {logs.length === 0 ? (
                <div className="text-muted-foreground text-center py-8">
                  {isLoading ? 'Loading logs...' : 'No logs available'}
                </div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2 py-0.5 hover:bg-muted/80 px-1 rounded">
                    {log.timestamp && (
                      <span className="text-muted-foreground shrink-0">{log.timestamp}</span>
                    )}
                    {log.level && (
                      <Badge variant={getLevelVariant(log.level)} className="text-[10px] py-0 px-1 shrink-0">
                        {log.level}
                      </Badge>
                    )}
                    <span className="break-all">{log.message || log.raw}</span>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
