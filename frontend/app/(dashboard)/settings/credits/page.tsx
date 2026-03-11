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
  AlertTriangle, Sparkles, ArrowRight, Check, Globe, WifiOff,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Plan definitions (must match bunkerai-cloud/app/config.py PLAN_CONFIG) ──

interface PlanDef {
  id: string
  label: string
  price: number | null
  interactions: number | null
  agents: number | null
  connectors: string[]
  instances: number | null
  popular?: boolean
}

const PLANS: PlanDef[] = [
  {
    id: 'starter',
    label: 'Starter',
    price: 5,
    interactions: 300,
    agents: 2,
    connectors: ['webchat'],
    instances: 1,
  },
  {
    id: 'pro',
    label: 'Pro',
    price: 15,
    interactions: 1500,
    agents: null,
    connectors: ['webchat', 'telegram', 'slack'],
    instances: 1,
    popular: true,
  },
  {
    id: 'team',
    label: 'Team',
    price: 49,
    interactions: 1500,
    agents: null,
    connectors: ['webchat', 'telegram', 'slack'],
    instances: 5,
  },
  {
    id: 'business',
    label: 'Business',
    price: null,
    interactions: null,
    agents: null,
    connectors: ['webchat', 'telegram', 'slack'],
    instances: null,
  },
]

// ─── Plan card ────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  isCurrent,
  isConnected,
  onSelect,
  loading,
}: {
  plan: PlanDef
  isCurrent: boolean
  isConnected: boolean
  onSelect: (planId: string) => void
  loading: boolean
}) {
  const isBusiness = plan.id === 'business'

  return (
    <div
      className={`relative rounded-xl border p-5 flex flex-col gap-4 transition-colors ${
        isCurrent
          ? 'border-primary bg-primary/5'
          : plan.popular
          ? 'border-primary/40'
          : 'border-border'
      }`}
    >
      {plan.popular && !isCurrent && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-wider bg-primary text-primary-foreground px-3 py-0.5 rounded-full">
          Most popular
        </span>
      )}

      <div>
        <p className="font-semibold text-base">{plan.label}</p>
        <p className="mt-1">
          {plan.price != null ? (
            <>
              <span className="text-2xl font-bold">${plan.price}</span>
              <span className="text-muted-foreground text-sm">/month</span>
            </>
          ) : (
            <span className="text-lg font-medium text-muted-foreground">Contact us</span>
          )}
        </p>
      </div>

      <ul className="space-y-1.5 text-sm flex-1">
        <li className="flex items-start gap-2">
          <Zap className="h-3.5 w-3.5 text-yellow-500 shrink-0 mt-0.5" />
          <span>
            {plan.interactions != null
              ? `${plan.interactions.toLocaleString()} interactions/month`
              : 'Unlimited interactions'}
          </span>
        </li>
        <li className="flex items-start gap-2">
          <Check className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
          <span>Web Chat</span>
        </li>
        {plan.connectors.includes('telegram') ? (
          <li className="flex items-start gap-2">
            <Check className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
            <span>Telegram + Slack</span>
          </li>
        ) : (
          <li className="flex items-start gap-2">
            <XCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <span className="text-muted-foreground">No Telegram / Slack</span>
          </li>
        )}
        <li className="flex items-start gap-2">
          <Check className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
          <span>
            {plan.agents != null ? `Up to ${plan.agents} agents` : 'Unlimited agents'}
          </span>
        </li>
        <li className="flex items-start gap-2">
          <Check className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
          <span>
            {plan.instances != null
              ? plan.instances === 1
                ? '1 BunkerM instance'
                : `Up to ${plan.instances} instances`
              : 'Unlimited instances'}
          </span>
        </li>
      </ul>

      {isCurrent ? (
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <CheckCircle className="h-4 w-4" />
          Current plan
        </div>
      ) : isBusiness ? (
        <a href="mailto:hello@bunkerai.dev" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="w-full gap-1.5">
            Contact sales
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </a>
      ) : (
        <Button
          className="w-full gap-1.5"
          variant={plan.popular ? 'default' : 'outline'}
          disabled={loading || !isConnected}
          onClick={() => onSelect(plan.id)}
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Get {plan.label}
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </Button>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function SubscriptionPage() {
  const searchParams = useSearchParams()
  const [data, setData] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [activating, setActivating] = useState(false)

  const fetchSubscription = useCallback(async (): Promise<SubscriptionData | null> => {
    try {
      const res = await subscriptionApi.getSubscription()
      if (!res.error) return res
    } catch { /* ignore */ }
    return null
  }, [])

  // Auto-connect to BunkerAI Cloud on mount, then load subscription data
  const init = useCallback(async () => {
    setLoading(true)
    setConnectError(null)
    try {
      const config = await fetch('/api/settings/cloud-config').then(r => r.json()).catch(() => ({}))
      if (!config.api_key) {
        const setupRes = await fetch('/api/settings/cloud-setup', { method: 'POST' })
        const setupData = await setupRes.json()
        if (!setupRes.ok) {
          setConnectError(setupData.error ?? 'Could not connect to BunkerAI Cloud.')
          setLoading(false)
          return
        }
      }
      const res = await fetchSubscription()
      if (res) { setData(res); setIsConnected(true) }
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

  async function handleUpgrade(planId: string) {
    setUpgrading(planId)
    try {
      const res = await subscriptionApi.subscribe(planId, window.location.href)
      if (res.checkout_url) {
        window.location.href = res.checkout_url
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
        <p className="text-sm">Connecting to BunkerAI Cloud…</p>
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

  // Connection failed (no activation key yet, or network error)
  if (connectError) {
    return (
      <div className="space-y-6 max-w-xl">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            Subscription
          </h1>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-5 space-y-3">
          <div className="flex items-start gap-3">
            <WifiOff className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-sm text-amber-800 dark:text-amber-200">
                Could not connect to BunkerAI Cloud
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">{connectError}</p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Make sure your BunkerM container has internet access and restart it, then try again.
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={init} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

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
                {data?.price_usd != null && (
                  <p className="text-sm opacity-70 mt-1">${data.price_usd}/month · cancel anytime</p>
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

      {/* ── Community state ── */}
      {!hasSubscription && !activating && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              BunkerM Community
              <Badge variant="secondary" className="ml-1 font-normal">Free forever</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              { label: 'MQTT broker management', ok: true },
              { label: 'Dashboard & monitoring', ok: true },
              { label: 'ACL management (clients, roles, groups)', ok: true },
              { label: 'AI Chat assistant', ok: false },
              { label: 'Telegram / Slack connectors', ok: false },
              { label: 'Schedulers & Watchers (agents)', ok: false },
            ].map(({ label, ok }) => (
              <div key={label} className="flex items-center gap-2.5">
                {ok
                  ? <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  : <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />}
                <span className={ok ? '' : 'text-muted-foreground'}>{label}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Plan grid ── */}
      <div>
        <h2 className="text-base font-semibold mb-4">
          {hasSubscription ? 'Switch Plan' : 'Choose a Plan'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {PLANS.map((p) => (
            <PlanCard
              key={p.id}
              plan={p}
              isCurrent={plan === p.id}
              isConnected={isConnected}
              onSelect={handleUpgrade}
              loading={upgrading === p.id}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          All plans billed monthly · cancel anytime · powered by Stripe
        </p>
      </div>

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
