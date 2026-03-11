'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Eye, EyeOff, Copy, RefreshCw, KeyRound, Check,
  Globe, Loader2, Wifi, Bot,
  ShieldOff, Hash, BellRing, Lock, ChevronDown, ChevronUp, ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { adminApi, subscriptionApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { SubscriptionData } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type KeySource = 'env' | 'file' | 'default'
interface ApiKeyInfo { key: string; source: KeySource }
interface CloudConfig {
  cloud_url?: string; admin_secret?: string; api_key?: string; tenant_id?: string
  telegram_connected?: string; telegram_bot_token?: string
  slack_connected?: string; forward_alerts?: boolean
}
interface CloudStatus { configured: boolean; connected: boolean; tier?: string; tenant_id?: string }

const SOURCE_LABEL: Record<KeySource, { label: string; variant: 'secondary' | 'outline' | 'destructive' }> = {
  env:     { label: 'Environment variable', variant: 'secondary' },
  file:    { label: 'Auto-generated',       variant: 'secondary' },
  default: { label: 'Insecure default',     variant: 'destructive' },
}

// ─── Connector lock badge (for plan-gated connectors) ─────────────────────────

function PlanLockBadge() {
  return (
    <Badge variant="outline" className="ml-auto gap-1.5 text-xs font-normal">
      <Lock className="h-3 w-3" /> Pro plan required
    </Badge>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  // Local BunkerM API Key
  const [keyInfo, setKeyInfo]       = useState<ApiKeyInfo | null>(null)
  const [keyRevealed, setKeyRevealed] = useState(false)
  const [keyCopied, setKeyCopied]   = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)

  // Cloud
  const [cloudConfig, setCloudConfig] = useState<CloudConfig | null>(null)
  const [cloudStatus, setCloudStatus] = useState<CloudStatus | null>(null)

  // Telegram
  const [botToken, setBotToken]         = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [revokingTelegram, setRevokingTelegram] = useState(false)

  // Slack
  const [slackStartUrl, setSlackStartUrl] = useState('/api/settings/slack-oauth-start')
  const [revokingSlack, setRevokingSlack] = useState(false)

  // Cloud API key display
  const [cloudKeyRevealed, setCloudKeyRevealed] = useState(false)
  const [cloudKeyCopied, setCloudKeyCopied]     = useState(false)

  // Alert forwarding
  const [forwardAlerts, setForwardAlerts] = useState(false)
  const [savingForward, setSavingForward] = useState(false)

  // Developer section collapse
  const [devExpanded, setDevExpanded] = useState(false)

  // Subscription data (for plan-gating)
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchApiKey = useCallback(async () => {
    try {
      const data = await fetch('/api/settings/apikey').then(r => r.json())
      setKeyInfo(data)
    } catch {
      toast.error('Failed to load API key info')
    }
  }, [])

  const fetchCloudState = useCallback(async () => {
    const [config, status] = await Promise.all([
      fetch('/api/settings/cloud-config').then(r => r.json()).catch(() => ({})),
      fetch('/api/settings/cloud-status').then(r => r.json()).catch(() => ({ configured: false, connected: false })),
    ])
    setCloudConfig(config)
    setCloudStatus(status)
    setForwardAlerts(config.forward_alerts ?? false)
  }, [])

  const fetchSubscription = useCallback(async () => {
    try {
      const res = await subscriptionApi.getSubscription()
      if (!res.error) setSubscription(res)
    } catch {
      // no plan data — Community
    }
  }, [])

  useEffect(() => {
    fetchApiKey()
    fetchCloudState()
    fetchSubscription()
    setSlackStartUrl(
      `/api/settings/slack-oauth-start?return_to=${encodeURIComponent(window.location.origin)}`
    )
  }, [fetchApiKey, fetchCloudState, fetchSubscription])

  // Slack OAuth redirect detection
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const slack = params.get('slack')
    if (!slack) return
    window.history.replaceState({}, '', '/settings/connectors')
    if (slack === 'connected') {
      fetch('/api/settings/slack-sync', { method: 'POST' }).then(() => fetchCloudState()).catch(() => {})
      toast.success('Slack bot connected!')
    } else if (slack === 'error') {
      toast.error(`Slack connection failed: ${params.get('reason') ?? 'unknown'}`)
    }
  }, [fetchCloudState])

  // Poll for WS connection while configured but disconnected
  useEffect(() => {
    if (!cloudConfig?.api_key || cloudStatus?.connected) return
    const id = setInterval(() => {
      fetch('/api/settings/cloud-status').then(r => r.json()).then(setCloudStatus).catch(() => {})
    }, 5000)
    return () => clearInterval(id)
  }, [cloudConfig?.api_key, cloudStatus?.connected])

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function copyKey() {
    if (!keyInfo) return
    await navigator.clipboard.writeText(keyInfo.key)
    setKeyCopied(true); setTimeout(() => setKeyCopied(false), 2000)
  }

  async function regenerateKey() {
    if (!confirm('Regenerate the API key? All backend services will restart with the new key.')) return
    setIsRegenerating(true)
    try {
      const res = await fetch('/api/settings/apikey', { method: 'POST' })
      if (!res.ok) throw new Error('Failed')
      await fetchApiKey(); toast.success('API key regenerated')
    } catch { toast.error('Failed to regenerate API key') }
    finally { setIsRegenerating(false) }
  }

  async function connectTelegram() {
    if (!botToken) { toast.error('Enter your Telegram bot token'); return }
    setIsConnecting(true)
    try {
      const res = await fetch('/api/settings/telegram-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot_token: botToken }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Telegram bot connected!')
      await fetchCloudState()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to connect bot')
    } finally { setIsConnecting(false) }
  }

  async function resetCloud() {
    if (!confirm('Remove cloud configuration? The connector agent will disconnect.')) return
    await fetch('/api/settings/cloud-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _restart_agent: true }),
    })
    setCloudConfig({}); setCloudStatus({ configured: false, connected: false })
    setSubscription(null); toast.success('Cloud configuration cleared')
  }

  async function copyCloudKey() {
    if (!cloudConfig?.api_key) return
    await navigator.clipboard.writeText(cloudConfig.api_key)
    setCloudKeyCopied(true); setTimeout(() => setCloudKeyCopied(false), 2000)
  }

  async function handleRevokeTelegram() {
    setRevokingTelegram(true)
    try {
      const res = await adminApi.revokeTelegramConnector()
      if (res.error) toast.error(res.error)
      else { toast.success('Telegram connector revoked'); await fetchCloudState() }
    } catch { toast.error('Failed to revoke connector') }
    finally { setRevokingTelegram(false) }
  }

  async function handleRevokeSlack() {
    setRevokingSlack(true)
    try {
      const res = await adminApi.revokeSlackConnector()
      if (res.error) toast.error(res.error)
      else { toast.success('Slack connector revoked'); await fetchCloudState() }
    } catch { toast.error('Failed to revoke Slack connector') }
    finally { setRevokingSlack(false) }
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const hasCloud      = !!cloudConfig?.api_key
  const hasTelegram   = cloudConfig?.telegram_connected === 'true'
  const hasSlack      = cloudConfig?.slack_connected === 'true'
  const currentPlan   = subscription?.plan ?? null
  const canUseTelegram = currentPlan && ['pro', 'team', 'business'].includes(currentPlan)

  const maskedKey = keyInfo
    ? `${keyInfo.key.slice(0, 6)}${'•'.repeat(20)}${keyInfo.key.slice(-4)}`
    : ''
  const maskedCloudKey = cloudConfig?.api_key
    ? `${cloudConfig.api_key.slice(0, 8)}${'•'.repeat(16)}${cloudConfig.api_key.slice(-4)}`
    : ''

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Connect BunkerAI Cloud, manage messaging bots, and configure alert forwarding.
        </p>
      </div>

      {/* ── BunkerAI Cloud status (read-only) ── */}
      {hasCloud && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3 text-sm">
          <div className="flex items-center gap-2.5">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">BunkerAI Cloud</span>
            <span className={`h-2 w-2 rounded-full shrink-0 ${cloudStatus?.connected ? 'bg-green-500' : 'bg-yellow-400 animate-pulse'}`} />
            <span className="text-muted-foreground">
              {subscription
                ? `${subscription.plan_label} · ${subscription.interactions_used} / ${subscription.interactions_limit ?? '∞'} interactions`
                : cloudStatus?.connected ? 'Connected' : 'Connecting…'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a href="/settings/credits">
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground h-7">
                <Wifi className="h-3.5 w-3.5" />
                Subscription
              </Button>
            </a>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetCloud}
              className="text-muted-foreground hover:text-destructive h-7"
            >
              Disconnect
            </Button>
          </div>
        </div>
      )}

      {!hasCloud && (
        <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-3 flex items-center justify-between text-sm">
          <p className="text-muted-foreground">BunkerAI Cloud not connected — messaging bots unavailable.</p>
          <a href="/settings/credits">
            <Button size="sm" variant="outline" className="shrink-0 gap-1.5">
              Set up in Subscription
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </a>
        </div>
      )}

      {/* ── Messaging Connectors ── */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
          Messaging Connectors
        </h2>

        {/* Telegram */}
        <Card className={!hasCloud || (!canUseTelegram && !hasTelegram) ? 'opacity-70' : ''}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Telegram Bot
              {hasTelegram && (
                <Badge variant="default" className="ml-auto gap-1.5 font-normal">
                  <Check className="h-3 w-3" /> Connected
                </Badge>
              )}
              {!hasTelegram && hasCloud && !canUseTelegram && (
                <PlanLockBadge />
              )}
              {!hasCloud && (
                <Badge variant="outline" className="ml-auto gap-1.5 text-xs font-normal">
                  <Lock className="h-3 w-3" /> Requires cloud
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Chat with your broker from Telegram in natural language.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!hasCloud ? (
              <div className="rounded-md border border-dashed p-3 text-center text-sm text-muted-foreground">
                Connect BunkerAI Cloud above to enable this integration.
              </div>
            ) : !canUseTelegram && !hasTelegram ? (
              <div className="rounded-md border border-dashed p-4 text-sm space-y-3">
                <p className="text-muted-foreground">
                  Telegram is available on the <strong>Pro</strong> plan and above.
                </p>
                <a href="/settings/credits">
                  <Button size="sm" className="gap-1.5">
                    Upgrade to Pro
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </a>
              </div>
            ) : hasTelegram ? (
              <div className="space-y-3">
                <div className="rounded-md bg-muted/50 border p-3 text-sm space-y-1">
                  <p className="font-medium">Bot active</p>
                  <p className="text-xs text-muted-foreground">
                    DM your bot and ask about your broker. Try: <em>"What topics are active?"</em>
                  </p>
                </div>
                <Button variant="destructive" size="sm" disabled={revokingTelegram} onClick={handleRevokeTelegram} className="gap-1.5">
                  {revokingTelegram ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldOff className="h-4 w-4" />}
                  Revoke
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="bot-token">Bot Token</Label>
                  <Input
                    id="bot-token"
                    type="password"
                    placeholder="1234567890:AAF..."
                    value={botToken}
                    onChange={e => setBotToken(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Get it from{' '}
                    <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="underline">
                      @BotFather
                    </a>
                    {' '}→ /newbot
                  </p>
                </div>
                <Button onClick={connectTelegram} disabled={isConnecting} className="w-full gap-1.5">
                  {isConnecting
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Registering webhook…</>
                    : <><Bot className="h-4 w-4" /> Connect Telegram Bot</>}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Slack */}
        <Card className={`mt-4 ${!hasCloud || (!canUseTelegram && !hasSlack) ? 'opacity-70' : ''}`}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Slack Bot
              {hasSlack && (
                <Badge variant="default" className="ml-auto gap-1.5 font-normal">
                  <Check className="h-3 w-3" /> Connected
                </Badge>
              )}
              {!hasSlack && hasCloud && !canUseTelegram && (
                <PlanLockBadge />
              )}
              {!hasCloud && (
                <Badge variant="outline" className="ml-auto gap-1.5 text-xs font-normal">
                  <Lock className="h-3 w-3" /> Requires cloud
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Chat with BunkerM AI from any Slack channel or DM.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!hasCloud ? (
              <div className="rounded-md border border-dashed p-3 text-center text-sm text-muted-foreground">
                Connect BunkerAI Cloud above to enable this integration.
              </div>
            ) : !canUseTelegram && !hasSlack ? (
              <div className="rounded-md border border-dashed p-4 text-sm space-y-3">
                <p className="text-muted-foreground">
                  Slack is available on the <strong>Pro</strong> plan and above.
                </p>
                <a href="/settings/credits">
                  <Button size="sm" className="gap-1.5">
                    Upgrade to Pro
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </a>
              </div>
            ) : hasSlack ? (
              <div className="space-y-3">
                <div className="rounded-md bg-muted/50 border p-3 text-sm space-y-1">
                  <p className="font-medium">Bot active</p>
                  <p className="text-xs text-muted-foreground">
                    DM your Slack bot and ask about your broker.
                  </p>
                </div>
                <Button variant="destructive" size="sm" disabled={revokingSlack} onClick={handleRevokeSlack} className="gap-1.5">
                  {revokingSlack ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldOff className="h-4 w-4" />}
                  Revoke
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Authorize BunkerAI in your Slack workspace with one click.
                </p>
                <a href={slackStartUrl}>
                  <Button className="w-full gap-1.5">
                    <Hash className="h-4 w-4" />
                    Add to Slack
                  </Button>
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Alert Forwarding ── */}
      {hasCloud && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BellRing className="h-4 w-4" />
              Anomaly Alert Forwarding
            </CardTitle>
            <CardDescription>
              Push high and critical anomaly alerts to your connected bots in real time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                New <span className="text-orange-600 dark:text-orange-400 font-medium">high</span> and{' '}
                <span className="text-red-600 dark:text-red-400 font-medium">critical</span> alerts are forwarded to Telegram and Slack.
              </p>
              <button
                type="button"
                role="switch"
                aria-checked={forwardAlerts}
                disabled={savingForward}
                onClick={async () => {
                  const next = !forwardAlerts
                  setForwardAlerts(next)
                  setSavingForward(true)
                  try {
                    await fetch('/api/settings/cloud-config', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ forward_alerts: next }),
                    })
                    toast.success(next ? 'Alert forwarding enabled' : 'Alert forwarding disabled')
                  } catch {
                    toast.error('Failed to save setting')
                    setForwardAlerts(!next)
                  } finally { setSavingForward(false) }
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${forwardAlerts ? 'bg-primary' : 'bg-input'}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${forwardAlerts ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Developer (collapsible) ── */}
      <div>
        <button
          type="button"
          onClick={() => setDevExpanded(x => !x)}
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1 hover:text-foreground transition-colors"
        >
          {devExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          Developer
        </button>

        {devExpanded && (
          <div className="mt-3 space-y-4">
            {/* BunkerM API Key */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <KeyRound className="h-4 w-4" />
                  BunkerM API Key
                </CardTitle>
                <CardDescription>
                  Authenticates the dashboard with MQTT backend services. Never exposed to the browser.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <code className="flex-1 font-mono text-sm bg-muted rounded-md px-3 py-2 overflow-hidden text-ellipsis whitespace-nowrap">
                    {keyInfo ? (keyRevealed ? keyInfo.key : maskedKey) : '…'}
                  </code>
                  <Button variant="ghost" size="icon" onClick={() => setKeyRevealed(r => !r)}>
                    {keyRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={copyKey}>
                    {keyCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                {keyInfo && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    Source: <Badge variant={SOURCE_LABEL[keyInfo.source].variant}>{SOURCE_LABEL[keyInfo.source].label}</Badge>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={regenerateKey}
                  disabled={isRegenerating || keyInfo?.source === 'env'}
                >
                  <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                  Regenerate
                </Button>
              </CardContent>
            </Card>

            {/* BunkerAI Cloud API Key */}
            {hasCloud && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    BunkerAI API Key
                  </CardTitle>
                  <CardDescription>
                    Your tenant key — used by the connector agent to authenticate with BunkerAI Cloud.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <code className="flex-1 font-mono text-xs bg-muted rounded-md px-3 py-2 overflow-hidden text-ellipsis whitespace-nowrap">
                      {cloudKeyRevealed ? cloudConfig?.api_key : maskedCloudKey}
                    </code>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCloudKeyRevealed(r => !r)}>
                      {cloudKeyRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyCloudKey}>
                      {cloudKeyCopied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

    </div>
  )
}
