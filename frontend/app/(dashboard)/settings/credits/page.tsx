'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { subscriptionApi } from '@/lib/api'
import type { SubscriptionData } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Zap, CheckCircle, XCircle, RefreshCw, ExternalLink,
  AlertTriangle, Sparkles, ArrowRight, Check, Globe, WifiOff, Mail, Key, Cpu, Plus,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Plan definitions (fetched from cloud at runtime) ─────────────────────────

interface PlanDef {
  id: string
  label: string
  description: string
  price: number | null
  interactions: number | null
  agents: number | null
  connectors: string[]
  instances: number | null
  popular?: boolean
}

const PLAN_DESCRIPTIONS: Record<string, string> = {
  starter:  'Perfect for hobbyists and IoT tinkerers exploring AI-assisted broker control for the first time.',
  pro:      'Built for power users and home lab enthusiasts who demand full AI control from any channel, anytime.',
  team:     'Made for small teams and growing businesses managing multiple deployments with serious AI usage.',
  business: 'Enterprise-grade for large-scale, regulated, or air-gapped environments. Fully custom — let\'s talk.',
}

// Fallback shown while loading or if cloud is unreachable
const PLANS_FALLBACK: PlanDef[] = [
  { id: 'starter',  label: 'Starter',  description: PLAN_DESCRIPTIONS.starter,  price: 5,    interactions: 100,  agents: 2,    connectors: ['webchat'], instances: 1 },
  { id: 'pro',      label: 'Pro',      description: PLAN_DESCRIPTIONS.pro,       price: 15,   interactions: 500,  agents: null, connectors: ['webchat', 'telegram', 'slack'], instances: 1, popular: true },
  { id: 'team',     label: 'Team',     description: PLAN_DESCRIPTIONS.team,      price: 49,   interactions: 2000, agents: null, connectors: ['webchat', 'telegram', 'slack'], instances: 1 },
  { id: 'business', label: 'Business', description: PLAN_DESCRIPTIONS.business,  price: null, interactions: null, agents: null, connectors: ['webchat', 'telegram', 'slack'], instances: null },
]

function normalizePlans(raw: Record<string, unknown>[]): PlanDef[] {
  return raw.map(p => ({
    id:           String(p.id ?? ''),
    label:        String(p.label ?? p.id ?? ''),
    description:  PLAN_DESCRIPTIONS[String(p.id ?? '')] ?? '',
    price:        p.price_eur != null ? Number(p.price_eur) : null,
    interactions: p.interactions_limit != null ? Number(p.interactions_limit) : null,
    agents:       p.agents_limit != null ? Number(p.agents_limit) : null,
    connectors:   Array.isArray(p.connectors) ? p.connectors as string[] : ['webchat'],
    instances:    p.instances != null ? Number(p.instances) : null,
    popular:      p.id === 'pro',
  }))
}

// ─── Feature row helpers ──────────────────────────────────────────────────────

function FRow({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <li className={`flex items-center gap-2 text-sm ${muted ? 'text-muted-foreground' : ''}`}>
      {muted
        ? <XCircle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
        : <Check className="h-3.5 w-3.5 shrink-0 text-green-500" />}
      {children}
    </li>
  )
}

function FRowBase({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 text-sm text-muted-foreground italic">
      <ArrowRight className="h-3 w-3 shrink-0" />
      {children}
    </li>
  )
}

// ─── Community (free) card ────────────────────────────────────────────────────

function CommunityCard() {
  return (
    <div className="relative rounded-xl border-2 border-dashed border-border bg-muted/20 p-5 flex flex-col gap-3">
      <div>
        <div className="flex items-center gap-2">
          <p className="font-semibold text-base">Community</p>
          <span className="text-[10px] font-semibold uppercase tracking-wider bg-green-500/15 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">Free</span>
        </div>
        <p className="mt-2">
          <span className="text-2xl font-bold">€0</span>
          <span className="text-muted-foreground text-sm">/mo</span>
        </p>
      </div>
      <ul className="space-y-1.5 flex-1">
        <FRow>Full MQTT management</FRow>
        <FRow>Local LLM <span className="ml-1 text-xs text-muted-foreground">(requires LM Studio + your hardware)</span></FRow>
        <FRow>2 agents</FRow>
        <FRow muted>No Cloud AI — bring your own model</FRow>
        <FRow muted>No Telegram / Slack</FRow>
      </ul>
      <div className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400 mt-1">
        <CheckCircle className="h-3.5 w-3.5" />
        Your current plan
      </div>
    </div>
  )
}

// ─── Paid plan cards ──────────────────────────────────────────────────────────

const PLAN_FEATURES: Record<string, React.ReactNode[]> = {
  starter: [
    <FRowBase key="base">Everything in Community</FRowBase>,
    <FRow key="cloud"><Zap className="h-3 w-3 text-yellow-500 shrink-0" /> <span>BunkerAI Cloud AI <span className="text-xs text-muted-foreground font-normal">— no hardware, zero setup</span></span></FRow>,
    <FRow key="ai">100 Cloud AI interactions / mo</FRow>,
    <FRow key="bots" muted>No Telegram / Slack</FRow>,
  ],
  pro: [
    <FRowBase key="base">Everything in Starter</FRowBase>,
    <FRow key="ai"><Zap className="h-3 w-3 text-yellow-500 shrink-0" /> 500 Cloud AI interactions / mo</FRow>,
    <FRow key="bots">Telegram + Slack bots</FRow>,
    <FRow key="agents">Unlimited agents</FRow>,
  ],
  team: [
    <FRowBase key="base">Everything in Pro</FRowBase>,
    <FRow key="ai"><Zap className="h-3 w-3 text-yellow-500 shrink-0" /> 2 000 Cloud AI interactions / mo</FRow>,
  ],
  business: [
    <FRowBase key="base">Everything in Team</FRowBase>,
    <FRow key="ai"><Zap className="h-3 w-3 text-yellow-500 shrink-0" /> Unlimited Cloud AI interactions</FRow>,
    <FRow key="sla">Dedicated support + SLA</FRow>,
    <FRow key="sec">Enterprise-grade security &amp; compliance</FRow>,
  ],
}

function PlanCard({
  plan,
  isCurrent,
  isConnected,
  emailVerified,
  onSelect,
  loading,
  onContactSales,
}: {
  plan: PlanDef
  isCurrent: boolean
  isConnected: boolean
  emailVerified: boolean
  onSelect: (planId: string) => void
  loading: boolean
  onContactSales: () => void
}) {
  const isBusiness = plan.id === 'business'
  const displayPrice = plan.price != null ? `€${plan.price}` : null
  const features = PLAN_FEATURES[plan.id] ?? []

  return (
    <div
      className={`relative rounded-xl border p-5 flex flex-col gap-3 transition-colors ${
        isCurrent ? 'border-primary bg-primary/5' : plan.popular ? 'border-primary/40' : 'border-border'
      }`}
    >
      {plan.popular && !isCurrent && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-wider bg-primary text-primary-foreground px-3 py-0.5 rounded-full">
          Most popular
        </span>
      )}

      <div>
        <p className="font-semibold text-base">{plan.label}</p>
        <p className="mt-2">
          {displayPrice != null ? (
            <>
              <span className="text-2xl font-bold">{displayPrice}</span>
              <span className="text-muted-foreground text-sm">/mo</span>
            </>
          ) : (
            <span className="text-lg font-medium text-muted-foreground">Custom</span>
          )}
        </p>
      </div>

      <ul className="space-y-1.5 flex-1">{features}</ul>

      {isCurrent ? (
        <div className="flex items-center gap-1.5 text-xs font-medium text-primary mt-1">
          <CheckCircle className="h-3.5 w-3.5" />
          Current plan
        </div>
      ) : isBusiness ? (
        <Button variant="outline" size="sm" className="w-full gap-1.5 mt-1" onClick={onContactSales}>
          Contact sales <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      ) : (
        <Button
          size="sm"
          className="w-full gap-1.5 mt-1"
          variant={plan.popular ? 'default' : 'outline'}
          disabled={loading || !isConnected || !emailVerified}
          title={!emailVerified ? 'Verify your email first' : undefined}
          onClick={() => onSelect(plan.id)}
        >
          {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <>Get {plan.label} <ArrowRight className="h-3.5 w-3.5" /></>}
        </Button>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function SubscriptionPage() {
  const searchParams = useSearchParams()
  const [data, setData] = useState<SubscriptionData | null>(null)
  const [plans, setPlans] = useState<PlanDef[]>(PLANS_FALLBACK)
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [activating, setActivating] = useState(false)
  const [salesModalOpen, setSalesModalOpen] = useState(false)
  const [emailCopied, setEmailCopied] = useState(false)
  const [resendingVerification, setResendingVerification] = useState(false)
  const [recoverModalOpen, setRecoverModalOpen] = useState(false)
  const [recoverEmail, setRecoverEmail] = useState('')
  const [recoverSent, setRecoverSent] = useState(false)
  const [recoverLoading, setRecoverLoading] = useState(false)
  // Duplicate email login flow
  const [cloudLoginEmail, setCloudLoginEmail] = useState('')
  const [cloudLoginModalOpen, setCloudLoginModalOpen] = useState(false)
  const [cloudLoginPassword, setCloudLoginPassword] = useState('')
  const [cloudLoginError, setCloudLoginError] = useState('')
  const [cloudLoginLoading, setCloudLoginLoading] = useState(false)
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false)

  function copySalesEmail() {
    navigator.clipboard.writeText('sales@bunkerai.dev').then(() => {
      setEmailCopied(true)
      toast.success('Email copied to clipboard!')
      setTimeout(() => setEmailCopied(false), 2500)
    })
  }

  const fetchSubscription = useCallback(async (): Promise<SubscriptionData | null> => {
    try {
      const res = await subscriptionApi.getSubscription()
      if (!res.error) return res
    } catch { /* ignore */ }
    return null
  }, [])

  // Auto-connect to BunkerAI Cloud on mount, then load subscription data + plans
  const init = useCallback(async () => {
    setLoading(true)
    setConnectError(null)
    try {
      const config = await fetch('/api/settings/cloud-config').then(r => r.json()).catch(() => ({}))
      if (!config.api_key) {
        const setupRes = await fetch('/api/settings/cloud-setup', { method: 'POST' })
        const setupData = await setupRes.json()
        if (setupRes.status === 409 && setupData.error === 'EMAIL_ALREADY_REGISTERED') {
          setCloudLoginEmail(setupData.email ?? '')
          setCloudLoginModalOpen(true)
          setLoading(false)
          return
        }
        if (!setupRes.ok) {
          setConnectError(setupData.error ?? 'Could not connect to BunkerAI Cloud.')
          setLoading(false)
          return
        }
      }
      // Fetch plans and subscription in parallel
      const [plansRes, subRes] = await Promise.allSettled([
        fetch('/api/ai/billing/plans').then(r => r.json()),
        fetchSubscription(),
      ])
      if (plansRes.status === 'fulfilled' && Array.isArray(plansRes.value?.plans)) {
        setPlans(normalizePlans(plansRes.value.plans))
      }
      const subData = subRes.status === 'fulfilled' ? subRes.value : null
      if (subData) {
        setData(subData)
        setIsConnected(true)
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [fetchSubscription])

  // After Stripe checkout: poll every 2s until the plan changes, up to 20s
  const pollAfterCheckout = useCallback(async (prevPlan: string | null) => {
    setActivating(true)
    try {
      for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 2000))
        const res = await fetchSubscription()
        if (res && res.plan !== prevPlan) {
          setData(res)
          setIsConnected(true)
          toast.success(`${res.plan_label} plan activated!`)
          return
        }
      }
      // Timed out — do one final forced refresh
      const res = await fetchSubscription()
      if (res) { setData(res); setIsConnected(true) }
      toast.success("Payment confirmed — your plan has been updated.")
    } finally {
      setActivating(false)
    }
  }, [fetchSubscription])

  useEffect(() => {
    const checkout = searchParams.get('checkout')
    if (checkout === 'cancelled') {
      toast.info('Checkout cancelled. No changes were made.')
      window.history.replaceState({}, '', '/settings/credits')
      init()
      return
    }

    if (checkout === 'success') {
      window.history.replaceState({}, '', '/settings/credits')
      // Fetch current state, capture the plan, then poll for the change
      setLoading(true)
      fetchSubscription().then(res => {
        const prevPlan = res?.plan ?? null
        if (res) { setData(res); setIsConnected(true) }
        setLoading(false)
        pollAfterCheckout(prevPlan)
      }).catch(() => {
        setLoading(false)
        pollAfterCheckout(null)
      })
      return
    }

    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleCloudLogin() {
    if (!cloudLoginPassword) return
    setCloudLoginLoading(true)
    setCloudLoginError('')
    try {
      const res = await subscriptionApi.cloudLogin(cloudLoginEmail, cloudLoginPassword)
      if (res.api_key && res.tenant_id) {
        // Save the recovered API key and restart connector-agent
        await fetch('/api/settings/cloud-connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ api_key: res.api_key, tenant_id: res.tenant_id }),
        })
        setCloudLoginModalOpen(false)
        toast.success('Subscription recovered! Reconnecting…')
        setTimeout(() => init(), 1500)
      } else {
        setCloudLoginError(res.detail ?? res.error ?? 'Invalid email or password.')
      }
    } catch {
      setCloudLoginError('Could not reach BunkerAI Cloud.')
    } finally {
      setCloudLoginLoading(false)
    }
  }

  async function handleForgotPassword() {
    if (!cloudLoginEmail) return
    setCloudLoginLoading(true)
    try {
      await subscriptionApi.forgotPassword(cloudLoginEmail)
      setForgotPasswordSent(true)
    } catch { /* ignore */ }
    finally { setCloudLoginLoading(false) }
  }

  async function handleResendVerification() {
    setResendingVerification(true)
    try {
      const res = await subscriptionApi.resendVerification()
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success('Verification email sent! Check your inbox.')
      }
    } catch {
      toast.error('Failed to send verification email.')
    } finally {
      setResendingVerification(false)
    }
  }

  async function handleRecoverApiKey() {
    if (!recoverEmail.trim()) return
    setRecoverLoading(true)
    try {
      await subscriptionApi.recoverApiKey(recoverEmail.trim())
      setRecoverSent(true)
    } catch {
      toast.error('Failed to reach BunkerAI Cloud.')
    } finally {
      setRecoverLoading(false)
    }
  }

  async function handleUpgrade(planId: string) {
    setUpgrading(planId)
    try {
      const res = await subscriptionApi.subscribe(planId, window.location.href)
      if (res.checkout_url) {
        window.location.href = res.checkout_url
      } else if ((res as { detail?: string }).detail === 'EMAIL_NOT_VERIFIED') {
        toast.error('Please verify your email before subscribing. Check your inbox or click Resend.')
      } else {
        toast.error(res.error ?? 'Could not create checkout session. Try again.')
      }
    } catch {
      toast.error('Failed to start checkout. Check your connection.')
    } finally {
      setUpgrading(null)
    }
  }

  async function openPortal() {
    setPortalLoading(true)
    try {
      const res = await subscriptionApi.getPortalUrl(window.location.href)
      if (res.portal_url) {
        window.open(res.portal_url, '_blank')
      } else {
        toast.error(res.error ?? 'Could not open billing portal.')
      }
    } catch {
      toast.error('Failed to open billing portal.')
    } finally {
      setPortalLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
        <Globe className="h-6 w-6 animate-pulse" />
        <p className="text-sm">Connecting to BunkerAI…</p>
      </div>
    )
  }

  // Activating banner — shown while waiting for Stripe webhook to process
  const activatingBanner = activating ? (
    <div className="rounded-lg border bg-primary/5 border-primary/20 px-4 py-3 flex items-center gap-3 text-sm">
      <RefreshCw className="h-4 w-4 animate-spin text-primary shrink-0" />
      <span>Activating your plan — this takes a few seconds…</span>
    </div>
  ) : null

  // connectError is rendered as a non-blocking banner below — plans still render

  const plan = data?.plan ?? null
  const planLabel = data?.plan_label ?? null
  const used = data?.interactions_used ?? 0
  const limit = data?.interactions_limit ?? null
  const resetAt = data?.interactions_reset_at ? new Date(data.interactions_reset_at) : null
  const subStatus = data?.subscription_status ?? 'active'
  const tenantStatus = (data as Record<string, unknown> | null)?.tenant_status as string | undefined
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0
  const hasSubscription = !!data?.plan
  const isSuspended = tenantStatus === 'suspended'
  const emailVerified = data?.email_verified !== false  // treat null/undefined as true for existing tenants

  return (
    <div className="space-y-8 max-w-4xl">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            Subscription
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your BunkerAI plan and monthly AI usage.
          </p>
        </div>
        {hasSubscription && (
          <Button
            variant="outline"
            className="shrink-0 gap-2"
            onClick={openPortal}
            disabled={portalLoading}
          >
            {portalLoading
              ? <RefreshCw className="h-4 w-4 animate-spin" />
              : <ExternalLink className="h-4 w-4" />}
            Manage Billing
          </Button>
        )}
      </div>

      {activatingBanner}

      {/* ── Email not verified ── */}
      {isConnected && !emailVerified && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Mail className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Verify your email to subscribe</p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Check the inbox you used when setting up BunkerM for a verification link. You must verify before subscribing.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleResendVerification}
            disabled={resendingVerification}
            className="shrink-0 gap-1.5 border-amber-300 dark:border-amber-700"
          >
            {resendingVerification ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
            Resend
          </Button>
        </div>
      )}

      {/* ── BunkerAI not yet connected (non-blocking) ── */}
      {connectError && (
        <div className="rounded-lg border border-muted bg-muted/40 p-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <WifiOff className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-sm font-medium">BunkerAI not connected yet</p>
              <p className="text-xs text-muted-foreground">
                Automatic connection is in progress. Make sure the container has internet access and restart it if this persists.
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={init} className="shrink-0 gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      )}

      {/* ── Suspended warning ── */}
      {isSuspended && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
            <p className="text-sm text-red-800 dark:text-red-200">
              Your account is suspended. Renew your subscription to restore AI features.
            </p>
          </div>
          <Button size="sm" onClick={openPortal} disabled={portalLoading} className="shrink-0 gap-1.5">
            <ExternalLink className="h-3.5 w-3.5" />
            Manage Billing
          </Button>
        </div>
      )}

      {/* ── Current plan summary (hidden while activating to avoid showing stale plan) ── */}
      {hasSubscription && !activating && (
        <div className="space-y-4">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="pt-5 pb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium opacity-80 mb-0.5">Current Plan</p>
                <p className="text-3xl font-bold">{planLabel}</p>
                {data?.price_eur != null && (
                  <p className="text-sm opacity-70 mt-1">
                    €{data.price_eur}/month · cancel anytime
                  </p>
                )}
              </div>
              <Badge
                className="capitalize text-sm px-3 py-1 shrink-0"
                variant={subStatus === 'active' ? 'secondary' : 'destructive'}
              >
                {subStatus.replace('_', ' ')}
              </Badge>
            </CardContent>
          </Card>

          {subStatus === 'past_due' && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Your last payment failed. Update your payment method to keep AI features active.
                </p>
              </div>
              <Button size="sm" onClick={openPortal} disabled={portalLoading} className="shrink-0 gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" />
                Fix Payment
              </Button>
            </div>
          )}

          {limit != null ? (
            <Card>
              <CardContent className="pt-5 pb-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium text-sm">Monthly AI Interactions</span>
                  </div>
                  <span className="text-sm text-muted-foreground font-mono">
                    {used.toLocaleString()} / {limit.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      pct >= 90 ? 'bg-destructive' : pct >= 70 ? 'bg-amber-500' : 'bg-primary'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{pct}% used</span>
                  {resetAt && <span>Resets {resetAt.toLocaleDateString()}</span>}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-5 pb-5 flex items-center gap-3">
                <Zap className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="font-medium text-sm">Unlimited AI Interactions</p>
                  <p className="text-xs text-muted-foreground">{used.toLocaleString()} used this month</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Plan grid ── */}
      <div>
        <h2 className="text-base font-semibold mb-4">
          {hasSubscription ? 'Switch Plan' : 'Choose a Plan'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {/* Community free card — always first */}
          <CommunityCard />
          {plans.map((p) => (
            <PlanCard
              key={p.id}
              plan={p}
              isCurrent={plan === p.id}
              isConnected={isConnected}
              emailVerified={emailVerified}
              onSelect={handleUpgrade}
              loading={upgrading === p.id}
              onContactSales={() => setSalesModalOpen(true)}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Paid plans billed monthly · cancel anytime · powered by Stripe
        </p>
      </div>

      {/* ── Cloud login modal (duplicate email) ── */}
      {cloudLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-2">
              <Mail className="h-5 w-5 text-amber-500 shrink-0" />
              <h3 className="font-semibold text-base">Email already registered</h3>
            </div>
            {forgotPasswordSent ? (
              <div className="space-y-3 text-center py-2">
                <p className="text-sm text-muted-foreground">
                  A password reset link has been sent to <strong>{cloudLoginEmail}</strong>. Check your inbox, then come back here to log in.
                </p>
                <Button variant="outline" className="w-full" onClick={() => setForgotPasswordSent(false)}>Back to login</Button>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                  <strong>{cloudLoginEmail}</strong> is already associated with a BunkerAI subscription.
                  Enter your BunkerAI password to restore it on this instance.<br/>
                  <span className="text-amber-600 dark:text-amber-400">We&apos;ve also emailed your API key to that address as a backup.</span>
                </p>
                <input
                  type="password"
                  placeholder="BunkerAI password"
                  value={cloudLoginPassword}
                  onChange={(e) => { setCloudLoginPassword(e.target.value); setCloudLoginError('') }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCloudLogin() }}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary mb-2"
                  autoFocus
                />
                {cloudLoginError && <p className="text-xs text-destructive mb-2">{cloudLoginError}</p>}
                <Button className="w-full mb-2" onClick={handleCloudLogin} disabled={cloudLoginLoading || !cloudLoginPassword}>
                  {cloudLoginLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Log in & restore subscription'}
                </Button>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <button onClick={handleForgotPassword} disabled={cloudLoginLoading}
                    className="hover:text-foreground transition-colors underline underline-offset-2">
                    Forgot password?
                  </button>
                  <button onClick={() => setCloudLoginModalOpen(false)}
                    className="hover:text-foreground transition-colors">
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Recover existing subscription ── */}
      {!hasSubscription && isConnected && (
        <div className="text-center pt-2">
          <button
            onClick={() => { setRecoverModalOpen(true); setRecoverSent(false); setRecoverEmail('') }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
          >
            <Key className="h-3 w-3" />
            Already have a BunkerAI subscription? Recover it here
          </button>
        </div>
      )}

      {/* Recover API key modal */}
      {recoverModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setRecoverModalOpen(false) }}
        >
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <Key className="h-4 w-4" />
                Recover Subscription
              </h3>
              <button onClick={() => setRecoverModalOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none">&times;</button>
            </div>
            {recoverSent ? (
              <div className="text-center py-4 space-y-3">
                <Mail className="h-8 w-8 mx-auto text-primary" />
                <p className="text-sm font-medium">Check your inbox</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  If <strong>{recoverEmail}</strong> is registered with BunkerAI, your API key has been sent to it.
                  Paste it in <strong>Settings → BunkerM Cloud</strong> to restore your subscription.
                </p>
                <Button size="sm" variant="outline" className="w-full" onClick={() => setRecoverModalOpen(false)}>Close</Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  Enter the email you used when first setting up BunkerM. We&apos;ll send your API key to that address.
                </p>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={recoverEmail}
                  onChange={(e) => setRecoverEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRecoverApiKey() }}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary mb-3"
                />
                <Button
                  className="w-full"
                  onClick={handleRecoverApiKey}
                  disabled={recoverLoading || !recoverEmail.trim()}
                >
                  {recoverLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Send recovery email'}
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Sales modal */}
      {salesModalOpen && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={(e) => { if (e.target === e.currentTarget) setSalesModalOpen(false) }}
      >
        <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-base">Contact Sales</h3>
            <button
              onClick={() => setSalesModalOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none"
            >
              &times;
            </button>
          </div>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            Interested in a Business or custom deployment? Click the email below to copy it to your clipboard and reach out.
          </p>
          <button
            onClick={copySalesEmail}
            className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-border bg-muted/40 hover:border-primary transition-colors font-mono text-sm"
          >
            <span>sales@bunkerai.dev</span>
            <span className="text-muted-foreground text-xs">
              {emailCopied ? '✓ Copied!' : '📋 Copy'}
            </span>
          </button>
          {emailCopied && (
            <p className="text-xs text-primary font-medium text-center mt-2">
              Email address copied to clipboard!
            </p>
          )}
        </div>
      </div>
    )}

    </div>
  )
}

export default function SubscriptionPageWrapper() {
  return (
    <Suspense>
      <SubscriptionPage />
    </Suspense>
  )
}
