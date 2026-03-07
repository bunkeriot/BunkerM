'use client'

import { useState, useEffect, useCallback } from 'react'
import { creditsApi } from '@/lib/api'
import type { CreditsData } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Coins,
  Zap,
  TrendingDown,
  CheckCircle,
  XCircle,
  RefreshCw,
  Bot,
  ExternalLink,
} from 'lucide-react'

function CreditsPageInner() {
  const [credits, setCredits] = useState<CreditsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notConfigured, setNotConfigured] = useState(false)
  const [billingUrl, setBillingUrl] = useState('https://bunkerai.dev/billing')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const creditsRes = await creditsApi.getCredits()
      if (creditsRes.error) {
        setNotConfigured(true)
      } else {
        setCredits(creditsRes)
        setNotConfigured(false)
      }
    } catch {
      setNotConfigured(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    // Derive billing URL from cloud config
    fetch('/api/settings/cloud-config')
      .then(r => r.json())
      .then(cfg => {
        if (cfg.cloud_url) {
          // Strip API path suffix and replace with billing portal
          const base = cfg.cloud_url.replace(/\/api$/, '').replace(/:8200$/, '')
          setBillingUrl(`${base}/billing`)
        }
      })
      .catch(() => {})
  }, [load])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        <RefreshCw className="h-5 w-5 animate-spin mr-2" />
        Loading credits...
      </div>
    )
  }

  if (notConfigured) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <Bot className="h-12 w-12 mx-auto text-muted-foreground" />
        <h2 className="text-xl font-semibold">BunkerAI Cloud not configured</h2>
        <p className="text-muted-foreground">
          Connect BunkerM to BunkerAI Cloud in{' '}
          <a href="/settings/connectors" className="underline text-primary">
            Settings → Connectors & APIs
          </a>{' '}
          to view your credits.
        </p>
      </div>
    )
  }

  const balance = credits?.balance ?? 0
  const balanceUsd = credits?.balance_usd ?? 0
  const history = credits?.history ?? []
  const dailyUsage = credits?.daily_usage ?? []
  const tier = credits?.tier ?? 'premium'

  const last7 = dailyUsage.slice(-7)
  const weeklyUsed = last7.reduce((s, d) => s + d.credits_used, 0)

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Credits</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Credits power AI features — natural language queries, device control via chat, and anomaly alert forwarding.
            Local agents (schedulers &amp; watchers) always run free.
          </p>
        </div>
        <a href={billingUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="shrink-0 gap-2">
            <ExternalLink className="h-4 w-4" />
            Manage Billing
          </Button>
        </a>
      </div>

      {/* Balance + quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1 bg-primary text-primary-foreground">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-3 mb-2">
              <Coins className="h-5 w-5 opacity-80" />
              <span className="text-sm font-medium opacity-80">Available Balance</span>
            </div>
            <p className="text-4xl font-bold">{balance.toLocaleString()}</p>
            <p className="text-sm opacity-70 mt-1">${balanceUsd.toFixed(2)} equivalent</p>
            <Badge variant="outline" className="mt-3 border-primary-foreground/30 text-primary-foreground text-xs capitalize">
              {tier}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingDown className="h-5 w-5 text-orange-500" />
              <span className="text-sm font-medium text-muted-foreground">Last 7 Days Used</span>
            </div>
            <p className="text-3xl font-bold">{weeklyUsed.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-1">credits consumed</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-medium text-muted-foreground">Rate</span>
            </div>
            <p className="text-3xl font-bold">$0.001</p>
            <p className="text-sm text-muted-foreground mt-1">per credit · 1 AI call ≈ 10–20 credits</p>
          </CardContent>
        </Card>
      </div>

      {balance === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Your credit balance is empty. Top up at bunkerai.dev to continue using AI features.
          </p>
          <a href={billingUrl} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="shrink-0 gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" />
              Top Up
            </Button>
          </a>
        </div>
      )}

      <Separator />

      {/* Usage history */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No transactions yet.</p>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-2 px-4 font-medium text-muted-foreground">Date</th>
                  <th className="text-left py-2 px-4 font-medium text-muted-foreground">Type</th>
                  <th className="text-right py-2 px-4 font-medium text-muted-foreground">Credits</th>
                  <th className="text-right py-2 px-4 font-medium text-muted-foreground hidden md:table-cell">Tokens</th>
                  <th className="text-right py-2 px-4 font-medium text-muted-foreground hidden md:table-cell">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {history.map((entry) => (
                  <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2 px-4 text-muted-foreground text-xs">
                      {new Date(entry.created_at).toLocaleString()}
                    </td>
                    <td className="py-2 px-4">
                      {entry.source === 'stripe' ? (
                        <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Purchase{entry.bundle ? ` · ${entry.bundle}` : ''}
                        </span>
                      ) : entry.source === 'admin' ? (
                        <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Admin top-up
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <XCircle className="h-3.5 w-3.5" />
                          AI {entry.model ? `· ${entry.model.split('-').slice(0, 2).join('-')}` : 'usage'}
                        </span>
                      )}
                    </td>
                    <td className={`py-2 px-4 text-right font-mono font-medium ${entry.delta > 0 ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
                      {entry.delta > 0 ? '+' : ''}{entry.delta.toLocaleString()}
                    </td>
                    <td className="py-2 px-4 text-right text-muted-foreground text-xs hidden md:table-cell">
                      {entry.input_tokens != null
                        ? `${entry.input_tokens.toLocaleString()} in / ${entry.output_tokens?.toLocaleString() ?? 0} out`
                        : '—'}
                    </td>
                    <td className="py-2 px-4 text-right text-muted-foreground text-xs hidden md:table-cell">
                      {entry.cost_usd != null ? `$${entry.cost_usd.toFixed(5)}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Daily usage chart (simple ASCII-style bar representation as text) */}
      {dailyUsage.length > 0 && (
        <>
          <Separator />
          <div>
            <h2 className="text-lg font-semibold mb-3">Daily Usage (Last 30 Days)</h2>
            <div className="flex items-end gap-1 h-20 bg-muted/30 rounded-lg p-3">
              {dailyUsage.slice(-30).map((d) => {
                const max = Math.max(...dailyUsage.map((x) => x.credits_used), 1)
                const pct = Math.max(4, Math.round((d.credits_used / max) * 100))
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
                    <div
                      className="w-full bg-primary/70 rounded-sm group-hover:bg-primary transition-colors"
                      style={{ height: `${pct}%` }}
                      title={`${d.date}: ${d.credits_used.toLocaleString()} credits`}
                    />
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Hover bars for daily totals. Each bar = 1 day.
            </p>
          </div>
        </>
      )}
    </div>
  )
}

export default function CreditsPage() {
  return <CreditsPageInner />
}
