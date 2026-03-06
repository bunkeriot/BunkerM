'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Eye, EyeOff, Copy, RefreshCw, KeyRound, Check,
  Globe, Loader2, Wifi, WifiOff, Bot,
  Cable, ShieldOff, Hash,
} from 'lucide-react'
import { toast } from 'sonner'
import { adminApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// ─── Types ────────────────────────────────────────────────────────────────────

type KeySource = 'env' | 'file' | 'default'

interface ApiKeyInfo {
  key: string
  source: KeySource
}

interface CloudConfig {
  cloud_url?: string
  admin_secret?: string
  ws_url?: string
  api_key?: string
  tenant_id?: string
  telegram_connected?: string
  telegram_bot_token?: string
  slack_connected?: string
}

interface CloudStatus {
  configured: boolean
  connected: boolean
  tier?: string
  tenant_id?: string
}

const SOURCE_LABEL: Record<KeySource, { label: string; variant: 'secondary' | 'outline' | 'destructive' }> = {
  env:     { label: 'Environment variable', variant: 'secondary' },
  file:    { label: 'Auto-generated',       variant: 'secondary' },
  default: { label: 'Insecure default',     variant: 'destructive' },
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ConnectorsPage() {
  // API Key state
  const [info, setInfo]               = useState<ApiKeyInfo | null>(null)
  const [revealed, setRevealed]       = useState(false)
  const [copied, setCopied]           = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)

  // Cloud state
  const [cloudConfig, setCloudConfig] = useState<CloudConfig | null>(null)
  const [cloudStatus, setCloudStatus] = useState<CloudStatus | null>(null)
  const [cloudUrl, setCloudUrl]       = useState('http://host.docker.internal:8200')
  const [adminSecret, setAdminSecret] = useState('')
  const [isCreating, setIsCreating]   = useState(false)
  const [botToken, setBotToken]       = useState('')
  const [ngrokUrl, setNgrokUrl]       = useState('')
  const [isDetecting, setIsDetecting] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [webhookUrl, setWebhookUrl]   = useState('')

  // Cloud Integration state
  const [cloudKeyRevealed, setCloudKeyRevealed] = useState(false)
  const [cloudKeyCopied, setCloudKeyCopied]     = useState(false)
  const [revokingTelegram, setRevokingTelegram] = useState(false)

  // Slack state
  const [slackStartUrl, setSlackStartUrl] = useState('/api/settings/slack-oauth-start')
  const [revokingSlack, setRevokingSlack] = useState(false)

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchApiKey = useCallback(async () => {
    try {
      const data = await fetch('/api/settings/apikey').then(r => r.json())
      setInfo(data)
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
    if (config.cloud_url) setCloudUrl(config.cloud_url)
  }, [])

  useEffect(() => {
    fetchApiKey()
    fetchCloudState()
    setSlackStartUrl(
      `/api/settings/slack-oauth-start?return_to=${encodeURIComponent(window.location.origin)}`
    )
  }, [fetchApiKey, fetchCloudState])

  // Detect Slack OAuth redirect result
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const slack = params.get('slack')
    if (!slack) return
    window.history.replaceState({}, '', '/settings/connectors')
    if (slack === 'connected') {
      fetch('/api/settings/slack-sync', { method: 'POST' })
        .then(() => fetchCloudState())
        .catch(() => {})
      toast.success('Slack bot connected!')
    } else if (slack === 'error') {
      const reason = params.get('reason') ?? 'unknown'
      toast.error(`Slack connection failed: ${reason}`)
    }
  }, [fetchCloudState])

  // Poll connection status while configured but not yet connected
  useEffect(() => {
    if (!cloudConfig?.api_key || cloudStatus?.connected) return
    const id = setInterval(() => {
      fetch('/api/settings/cloud-status').then(r => r.json()).then(setCloudStatus).catch(() => {})
    }, 5000)
    return () => clearInterval(id)
  }, [cloudConfig?.api_key, cloudStatus?.connected])

  // ── API Key handlers ───────────────────────────────────────────────────────

  async function copyToClipboard() {
    if (!info) return
    await navigator.clipboard.writeText(info.key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function regenerate() {
    if (!confirm('Regenerate the API key? All backend services will restart with the new key.')) return
    setIsRegenerating(true)
    try {
      const res = await fetch('/api/settings/apikey', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to regenerate')
      await fetchApiKey()
      toast.success('API key regenerated')
    } catch {
      toast.error('Failed to regenerate API key')
    } finally {
      setIsRegenerating(false)
    }
  }

  // ── Cloud setup handlers ───────────────────────────────────────────────────

  async function createTenant() {
    if (!cloudUrl || !adminSecret) { toast.error('Enter Cloud URL and Admin Secret'); return }
    setIsCreating(true)
    try {
      const res = await fetch('/api/settings/cloud-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cloud_url: cloudUrl, admin_secret: adminSecret }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Tenant created! Connector agent is connecting…')
      await fetchCloudState()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Setup failed')
    } finally {
      setIsCreating(false)
    }
  }

  async function detectNgrok() {
    setIsDetecting(true)
    try {
      const res = await fetch('/api/settings/ngrok-url')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'No HTTPS tunnel found — is ngrok running?')
      setNgrokUrl(data.url)
      toast.success('ngrok URL detected')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Could not detect ngrok URL')
    } finally {
      setIsDetecting(false)
    }
  }

  async function connectTelegram() {
    if (!botToken) { toast.error('Enter your Telegram bot token'); return }
    setIsConnecting(true)
    try {
      const res = await fetch('/api/settings/telegram-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot_token: botToken, public_url: ngrokUrl || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setWebhookUrl(data.webhook_url ?? '')
      toast.success('Telegram bot connected!')
      await fetchCloudState()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to connect bot')
    } finally {
      setIsConnecting(false)
    }
  }

  async function resetCloud() {
    if (!confirm('Remove cloud configuration? The connector agent will disconnect.')) return
    await fetch('/api/settings/cloud-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _restart_agent: true }),
    })
    setCloudConfig({})
    setCloudStatus({ configured: false, connected: false })
    setWebhookUrl('')
    toast.success('Cloud configuration cleared')
  }

  // ── Cloud Integration handlers ─────────────────────────────────────────────

  async function copyCloudKey() {
    if (!cloudConfig?.api_key) return
    await navigator.clipboard.writeText(cloudConfig.api_key)
    setCloudKeyCopied(true)
    setTimeout(() => setCloudKeyCopied(false), 2000)
  }

  async function handleRevokeTelegram() {
    setRevokingTelegram(true)
    try {
      const res = await adminApi.revokeTelegramConnector()
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Telegram connector revoked')
        await fetchCloudState()
      }
    } catch {
      toast.error('Failed to revoke connector')
    } finally {
      setRevokingTelegram(false)
    }
  }

  async function handleRevokeSlack() {
    setRevokingSlack(true)
    try {
      const res = await adminApi.revokeSlackConnector()
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Slack connector revoked')
        await fetchCloudState()
      }
    } catch {
      toast.error('Failed to revoke Slack connector')
    } finally {
      setRevokingSlack(false)
    }
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const maskedKey    = info ? `${info.key.slice(0, 6)}${'•'.repeat(20)}${info.key.slice(-4)}` : ''
  const displayKey   = info ? (revealed ? info.key : maskedKey) : '...'
  const sourceInfo   = info ? SOURCE_LABEL[info.source] : null
  const hasCloudKey  = !!cloudConfig?.api_key
  const hasTelegram  = cloudConfig?.telegram_connected === 'true'
  const hasSlack     = cloudConfig?.slack_connected === 'true'
  const maskedCloudKey = cloudConfig?.api_key
    ? `${cloudConfig.api_key.slice(0, 8)}${'•'.repeat(16)}${cloudConfig.api_key.slice(-4)}`
    : ''

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Cable className="h-6 w-6" />
          Connectors & APIs
        </h1>
        <p className="text-muted-foreground text-sm">API keys, BunkerAI Cloud setup, and active connector tokens</p>
      </div>

      {/* ── BunkerM API Key ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            BunkerM API Key
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Authenticates the web interface with the MQTT broker services. Never exposed to the browser — all API calls are proxied server-side.
          </p>

          <div className="flex items-center gap-2">
            <code className="flex-1 font-mono text-sm bg-muted rounded-md px-3 py-2 overflow-hidden text-ellipsis whitespace-nowrap">
              {displayKey}
            </code>
            <Button variant="ghost" size="icon" onClick={() => setRevealed(r => !r)}>
              {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={copyToClipboard}>
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          {sourceInfo && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Source: <Badge variant={sourceInfo.variant}>{sourceInfo.label}</Badge>
              {info?.source === 'env' && (
                <span className="text-xs">(set via <code>API_KEY</code> env var)</span>
              )}
            </div>
          )}

          <div className="pt-2 border-t">
            <Button variant="outline" onClick={regenerate} disabled={isRegenerating || info?.source === 'env'}>
              <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
              Regenerate Key
            </Button>
            {info?.source === 'env' && (
              <p className="text-xs text-muted-foreground mt-2">
                Controlled by the <code>API_KEY</code> environment variable.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── BunkerAI Cloud ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            BunkerAI Cloud
            {hasCloudKey && (
              <Badge
                variant={cloudStatus?.connected ? 'default' : 'outline'}
                className="ml-auto gap-1.5 font-normal"
              >
                {cloudStatus?.connected
                  ? <><Wifi className="h-3 w-3" /> Connected · {cloudStatus.tier ?? 'premium'}</>
                  : <><WifiOff className="h-3 w-3" /> Connecting…</>
                }
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* Step 1: not yet configured */}
          {!hasCloudKey && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect to a running <code className="text-xs">bunkerai-cloud</code> instance to enable AI features and Telegram integration.
              </p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cloud-url">Cloud API URL</Label>
                  <Input id="cloud-url" placeholder="http://host.docker.internal:8200" value={cloudUrl} onChange={e => setCloudUrl(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Use <code>host.docker.internal:8200</code> when bunkerai-cloud runs on the same machine.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="admin-secret">Admin Secret</Label>
                  <Input id="admin-secret" type="password" placeholder="The ADMIN_SECRET from bunkerai-cloud .env" value={adminSecret} onChange={e => setAdminSecret(e.target.value)} />
                </div>
              </div>
              <Button onClick={createTenant} disabled={isCreating} className="w-full">
                {isCreating ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating tenant…</> : 'Connect to BunkerAI Cloud'}
              </Button>
            </div>
          )}

          {/* Step 2: configured, no Telegram yet */}
          {hasCloudKey && !hasTelegram && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                {cloudStatus?.connected
                  ? <><span className="h-2 w-2 rounded-full bg-green-500" /> Agent connected</>
                  : <><span className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" /> Waiting for agent…</>
                }
              </div>

              <div className="rounded-md bg-muted/50 border p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Tenant created</p>
                <p>API Key: <code className="select-all">{cloudConfig?.api_key}</code></p>
              </div>

              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Bot className="h-4 w-4" /> Connect Telegram Bot
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="bot-token">Bot Token</Label>
                  <Input id="bot-token" type="password" placeholder="1234567890:AAF..." value={botToken} onChange={e => setBotToken(e.target.value)} />
                  <p className="text-xs text-muted-foreground">
                    Get it from{' '}
                    <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="underline">@BotFather</a>
                    {' '}→ /newbot
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ngrok-url">Public URL <span className="text-muted-foreground font-normal">(for Telegram webhook)</span></Label>
                  <div className="flex gap-2">
                    <Input id="ngrok-url" placeholder="https://xxxx.ngrok-free.app" value={ngrokUrl} onChange={e => setNgrokUrl(e.target.value)} />
                    <Button variant="outline" onClick={detectNgrok} disabled={isDetecting} className="shrink-0">
                      {isDetecting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Auto-detect'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Leave blank to auto-detect from ngrok inside bunkerai-cloud.</p>
                </div>
                <Button onClick={connectTelegram} disabled={isConnecting} className="w-full">
                  {isConnecting
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Registering webhook…</>
                    : <><Bot className="h-4 w-4" /> Connect Telegram Bot</>
                  }
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: fully connected */}
          {hasCloudKey && hasTelegram && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                {cloudStatus?.connected
                  ? <><span className="h-2.5 w-2.5 rounded-full bg-green-500" /><span className="font-medium">Agent connected</span></>
                  : <><span className="h-2.5 w-2.5 rounded-full bg-yellow-400 animate-pulse" /><span>Reconnecting…</span></>
                }
              </div>
              <div className="rounded-md bg-muted/50 border p-3 text-sm space-y-1.5">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Telegram bot active</span>
                  <Check className="h-4 w-4 text-green-500 ml-auto" />
                </div>
                {webhookUrl && (
                  <p className="text-xs text-muted-foreground break-all">Webhook: {webhookUrl}</p>
                )}
              </div>
              <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Ready to use</p>
                <p>DM your Telegram bot and ask about your broker. Try: <em>"What topics are active?"</em></p>
              </div>
              <Button variant="outline" size="sm" onClick={resetCloud} className="text-destructive hover:text-destructive">
                Reset Cloud Configuration
              </Button>
            </div>
          )}

        </CardContent>
      </Card>

      {/* ── Slack Connector ── */}
      {hasCloudKey && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Slack Bot
              {hasSlack && (
                <Badge variant="default" className="ml-auto gap-1.5 font-normal">
                  <Check className="h-3 w-3" /> Connected
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Allow users to chat with BunkerM AI from Slack.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasSlack ? (
              <div className="space-y-3">
                <div className="rounded-md bg-muted/50 border p-3 text-sm space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Slack bot active</span>
                    <Check className="h-4 w-4 text-green-500 ml-auto" />
                  </div>
                </div>
                <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">Ready to use</p>
                  <p>DM your Slack bot and ask about your broker. Try: <em>&quot;What topics are active?&quot;</em></p>
                </div>
                <Button variant="destructive" size="sm" onClick={handleRevokeSlack} disabled={revokingSlack}>
                  {revokingSlack ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldOff className="h-4 w-4" />}
                  Revoke
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Authorize BunkerAI in your Slack workspace with one click. No app creation or token copy-paste required.
                </p>
                <a href={slackStartUrl}>
                  <Button className="w-full gap-2">
                    <Hash className="h-4 w-4" />
                    Add to Slack
                  </Button>
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Cloud Integration (active tokens) ── */}
      {hasCloudKey && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cloud Integration</CardTitle>
            <CardDescription>Active API key and connector tokens</CardDescription>
          </CardHeader>
          <CardContent className="divide-y">

            {/* BunkerAI API Key */}
            <div className="py-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium">BunkerAI API Key</p>
                  <p className="text-xs text-muted-foreground">Used by the connector agent</p>
                </div>
                <Badge variant="default" className="text-xs">Active</Badge>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-xs bg-muted rounded px-3 py-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
                  {cloudKeyRevealed ? cloudConfig?.api_key : maskedCloudKey}
                </code>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCloudKeyRevealed(r => !r)}>
                  {cloudKeyRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyCloudKey}>
                  {cloudKeyCopied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>

            {/* Telegram */}
            <div className="flex items-center justify-between py-4">
              <div>
                <p className="text-sm font-medium">Telegram Bot</p>
                <p className="text-xs text-muted-foreground">
                  {hasTelegram ? 'Connected — webhook is active' : 'Not connected'}
                </p>
              </div>
              {hasTelegram ? (
                <Button size="sm" variant="destructive" disabled={revokingTelegram} onClick={handleRevokeTelegram}>
                  {revokingTelegram ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldOff className="h-4 w-4" />}
                  Revoke
                </Button>
              ) : (
                <Badge variant="outline">Not connected</Badge>
              )}
            </div>

            {/* Slack */}
            <div className="flex items-center justify-between py-4">
              <div>
                <p className="text-sm font-medium">Slack Bot</p>
                <p className="text-xs text-muted-foreground">
                  {hasSlack ? 'Connected — events webhook active' : 'Not connected'}
                </p>
              </div>
              {hasSlack ? (
                <Button size="sm" variant="destructive" disabled={revokingSlack} onClick={handleRevokeSlack}>
                  {revokingSlack ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldOff className="h-4 w-4" />}
                  Revoke
                </Button>
              ) : (
                <Badge variant="outline">Not connected</Badge>
              )}
            </div>

          </CardContent>
        </Card>
      )}

    </div>
  )
}
