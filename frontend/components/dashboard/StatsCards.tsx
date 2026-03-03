'use client'

import { Users, MessageSquare, Activity, Database, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { MonitorStats } from '@/types'

interface StatsCardsProps {
  stats: MonitorStats | null
}

export function StatsCards({ stats }: StatsCardsProps) {
  // Latest bytes values come from the last entry in the historical arrays
  const lastBytesSent = stats?.bytes_stats?.bytes_sent?.slice(-1)[0] ?? 0
  const lastBytesReceived = stats?.bytes_stats?.bytes_received?.slice(-1)[0] ?? 0

  const cards = [
    {
      title: 'Connected Clients',
      value: stats?.total_connected_clients ?? 0,
      icon: Users,
      description: stats?.mqtt_connected ? 'Broker connected' : 'Broker offline',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Messages',
      value: stats?.total_messages_received ?? '0',
      icon: MessageSquare,
      description: 'Last 7 days',
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      title: 'Subscriptions',
      value: stats?.total_subscriptions ?? 0,
      icon: Activity,
      description: 'Active subscriptions',
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      title: 'Bytes (15 min)',
      value: `↑${lastBytesSent.toFixed(1)} ↓${lastBytesReceived.toFixed(1)}`,
      icon: Database,
      description: 'Sent / Received (B/s)',
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
    {
      title: 'Retained Messages',
      value: stats?.retained_messages ?? 0,
      icon: TrendingUp,
      description: 'Currently retained',
      color: 'text-cyan-500',
      bg: 'bg-cyan-500/10',
    },
  ]

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
