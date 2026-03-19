import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Cache EUR→USD rate for 6 hours
let _cachedRate: number | null = null
let _cacheExpiry = 0

async function fetchEurToUsdRate(): Promise<number> {
  const now = Date.now()
  if (_cachedRate && now < _cacheExpiry) return _cachedRate

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/EUR', { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      const rate = data?.rates?.USD as number | undefined
      if (rate && rate > 0) {
        _cachedRate = rate
        _cacheExpiry = now + 6 * 60 * 60 * 1000
        return rate
      }
    }
  } catch { /* ignore */ }

  return _cachedRate ?? 1.09
}

export async function GET() {
  const rate = await fetchEurToUsdRate()
  return NextResponse.json({ eur_to_usd: rate })
}
