'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'
import { ArrowRight, Check, ChevronDown, ChevronLeft, Eye, EyeOff, Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// ─── Countries ────────────────────────────────────────────────────────────────

const COUNTRIES = [
  // Common first
  'United States', 'United Kingdom', 'Canada', 'Australia', 'France',
  'Germany', 'Spain', 'Italy', 'Netherlands', 'Belgium',
  // Rest alphabetically
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola',
  'Antigua and Barbuda', 'Argentina', 'Armenia', 'Austria', 'Azerbaijan',
  'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus',
  'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina',
  'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso',
  'Burundi', 'Cabo Verde', 'Cambodia', 'Cameroon', 'Central African Republic',
  'Chad', 'Chile', 'China', 'Colombia', 'Comoros',
  'Congo (Brazzaville)', 'Congo (Kinshasa)', 'Costa Rica', 'Croatia', 'Cuba',
  'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica',
  'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea',
  'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji',
  'Finland', 'Gabon', 'Gambia', 'Georgia', 'Ghana',
  'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau',
  'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland',
  'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
  'Israel', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan',
  'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos',
  'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya',
  'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi',
  'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands',
  'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova',
  'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique',
  'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'New Zealand',
  'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia',
  'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine',
  'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines',
  'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia',
  'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines',
  'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal',
  'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia',
  'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea',
  'South Sudan', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden',
  'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania',
  'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago',
  'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda',
  'Ukraine', 'United Arab Emirates', 'Uruguay', 'Uzbekistan', 'Vanuatu',
  'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe',
]

// ─── Country selector component ───────────────────────────────────────────────

function CountrySelect({
  value,
  onChange,
  disabled,
  hasError,
}: {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  hasError?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const filtered = search
    ? COUNTRIES.filter((c) => c.toLowerCase().includes(search.toLowerCase()))
    : COUNTRIES

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Focus search when opened
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50)
  }, [open])

  return (
    <div ref={containerRef} className="relative mt-6">
      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Country</p>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between h-12 px-4 rounded-lg border-2 bg-background text-sm transition-colors
          ${open ? 'border-primary' : hasError ? 'border-destructive' : 'border-input hover:border-muted-foreground'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
          {value || 'Select your country…'}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search countries…"
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground text-xs">
                ✕
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No countries found</p>
            ) : (
              filtered.map((country) => (
                <button
                  key={country}
                  type="button"
                  onClick={() => { onChange(country); setOpen(false); setSearch('') }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground
                    ${value === country ? 'bg-accent/50 font-medium' : ''}`}
                >
                  {country}
                  {value === country && <Check className="inline w-3.5 h-3.5 ml-2 text-primary" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Step definitions ─────────────────────────────────────────────────────────

type StepId = 'fullName' | 'email' | 'password' | 'confirmPassword'

interface Step {
  id: StepId
  question: (data: Partial<FormData>) => string
  subtext?: (data: Partial<FormData>) => React.ReactNode
  inputType: 'text' | 'email' | 'password'
  placeholder: string
  validate: (value: string, data: Partial<FormData>) => string | null
}

interface FormData {
  fullName: string
  country: string
  email: string
  password: string
  confirmPassword: string
}

function parseName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/)
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

const STEPS: Step[] = [
  {
    id: 'fullName',
    question: () => 'Please enter your full name.',
    subtext: () => null,
    inputType: 'text',
    placeholder: 'e.g. Alex Johnson',
    validate: (v) => {
      if (v.trim().length < 2) return 'Please enter your full name.'
      if (!v.trim().includes(' ')) return 'Please include both your first and last name.'
      return null
    },
  },
  {
    id: 'email',
    question: (d) => {
      const { firstName } = parseName(d.fullName ?? '')
      return `What's your email address, ${firstName}?`
    },
    subtext: () => (
      <>
        This email will be used <strong>exclusively for password recovery</strong>. We may also send you important product updates.
      </>
    ),
    inputType: 'email',
    placeholder: 'you@example.com',
    validate: (v) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'Please enter a valid email address.',
  },
  {
    id: 'password',
    question: () => 'Create a strong password for your account.',
    subtext: () => 'At least 6 characters.',
    inputType: 'password',
    placeholder: '••••••••',
    validate: (v) => v.length < 6 ? 'Password must be at least 6 characters.' : null,
  },
  {
    id: 'confirmPassword',
    question: () => 'Confirm your password.',
    subtext: () => null,
    inputType: 'password',
    placeholder: '••••••••',
    validate: (v, d) => v !== d.password ? "Passwords don't match." : null,
  },
]

// ─── Main component ───────────────────────────────────────────────────────────

export default function SetupPage() {
  const router = useRouter()
  const { register: registerUser } = useAuth()

  const [stepIndex, setStepIndex] = useState(0)
  const [formData, setFormData] = useState<Partial<FormData>>({})
  const [currentValue, setCurrentValue] = useState('')
  const [country, setCountry] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [countryError, setCountryError] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [termsError, setTermsError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [animDir, setAnimDir] = useState<'in' | 'out-left' | 'out-right'>('in')

  const inputRef = useRef<HTMLInputElement>(null)

  const step = STEPS[stepIndex]
  const isFirstStep = stepIndex === 0
  const isLastStep = stepIndex === STEPS.length - 1
  const progress = (stepIndex / STEPS.length) * 100

  useEffect(() => {
    fetch('/api/auth/setup-status')
      .then((r) => r.json())
      .then(({ needsSetup }) => { if (!needsSetup) router.replace('/login') })
      .catch(() => {})
  }, [router])

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 320)
    return () => clearTimeout(timer)
  }, [stepIndex])

  const advance = async () => {
    const err = step.validate(currentValue, formData)
    if (err) { setError(err); return }

    // Step 0 also requires country
    if (isFirstStep && !country) {
      setCountryError(true)
      return
    }

    setError(null)
    setCountryError(false)

    const updated: Partial<FormData> = {
      ...formData,
      [step.id]: currentValue,
      ...(isFirstStep ? { country } : {}),
    }
    setFormData(updated)

    if (!isLastStep) {
      setAnimDir('out-left')
      setTimeout(() => {
        setStepIndex((i) => i + 1)
        setCurrentValue('')
        setShowPassword(false)
        setAnimDir('in')
      }, 220)
      return
    }

    // Last step — enforce terms
    if (!termsAccepted) { setTermsError(true); return }

    setIsSubmitting(true)
    const { firstName, lastName } = parseName(updated.fullName!)
    try {
      await registerUser({
        firstName,
        lastName: lastName || firstName,
        email: updated.email!,
        password: updated.password!,
        country: updated.country,
      })
      setIsDone(true)
      setTimeout(() => router.push('/dashboard'), 1800)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
      setIsSubmitting(false)
    }
  }

  const goBack = () => {
    if (stepIndex === 0) return
    setError(null)
    setTermsError(false)
    setCountryError(false)
    setAnimDir('out-right')
    setTimeout(() => {
      setStepIndex((i) => i - 1)
      setCurrentValue(String(formData[STEPS[stepIndex - 1].id] ?? ''))
      setShowPassword(false)
      setAnimDir('in')
    }, 220)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLastStep && !isFirstStep) advance()
    if (e.key === 'Enter' && isFirstStep && currentValue.trim() && country) advance()
  }

  // ── Done ──────────────────────────────────────────────────────────────────────
  if (isDone) {
    const { firstName } = parseName(formData.fullName ?? '')
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center animate-scale-in">
            <Check className="w-8 h-8 text-primary-foreground" />
          </div>
          <p className="text-xl font-semibold">You&apos;re all set, {firstName}!</p>
          <p className="text-muted-foreground text-sm">Taking you to your dashboard…</p>
        </div>
      </div>
    )
  }

  // ── Form ──────────────────────────────────────────────────────────────────────
  const animClass =
    animDir === 'in' ? 'opacity-100 translate-x-0'
    : animDir === 'out-left' ? 'opacity-0 -translate-x-8'
    : 'opacity-0 translate-x-8'

  const subtext = step.subtext?.(formData)

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted">

      {/* Progress bar */}
      <div className="h-1 bg-muted-foreground/20 w-full">
        <div className="h-1 bg-primary transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <Image src="/BunkerM_Logo.png" alt="BunkerM" width={28} height={28} className="rounded-lg" />
          <span className="font-semibold text-sm">BunkerM</span>
        </div>
        <span className="text-xs text-muted-foreground">{stepIndex + 1} / {STEPS.length}</span>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-lg">

          {/* Welcome banner — step 0 only */}
          {isFirstStep && (
            <div className="mb-8 text-center">
              <Image src="/BunkerM_Logo.png" alt="BunkerM" width={96} height={96} className="mx-auto mb-5" />
              <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">Welcome to BunkerM</p>
              <p className="text-muted-foreground text-base">Please create your first BunkerM Admin account.</p>
            </div>
          )}

          <div
            className={`transition-all duration-200 ease-out ${animClass}`}
            style={{ willChange: 'transform, opacity' }}
          >
            <h2 className="text-2xl sm:text-3xl font-bold leading-snug mb-2">
              {step.question(formData)}
            </h2>

            {subtext && (
              <p className="text-muted-foreground mb-8 text-sm leading-relaxed">{subtext}</p>
            )}
            {!subtext && <div className="mb-8" />}

            {/* Text / email / password input */}
            <div className="relative">
              <Input
                ref={inputRef}
                type={step.inputType === 'password' ? (showPassword ? 'text' : 'password') : step.inputType}
                placeholder={step.placeholder}
                value={currentValue}
                onChange={(e) => { setCurrentValue(e.target.value); setError(null) }}
                onKeyDown={onKeyDown}
                className="h-14 text-lg pr-12 border-b-2 border-x-0 border-t-0 rounded-none bg-transparent focus-visible:ring-0 focus-visible:border-primary shadow-none px-0"
                autoComplete={step.inputType === 'email' ? 'email' : step.inputType === 'password' ? 'new-password' : 'name'}
                disabled={isSubmitting}
              />
              {step.inputType === 'password' && (
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              )}
            </div>

            {error && <p className="mt-2 text-sm text-destructive animate-fade-in">{error}</p>}

            {/* Country selector — step 0 only */}
            {isFirstStep && (
              <>
                <CountrySelect
                  value={country}
                  onChange={(v) => { setCountry(v); setCountryError(false) }}
                  disabled={isSubmitting}
                  hasError={countryError}
                />
                {countryError && (
                  <p className="mt-2 text-sm text-destructive animate-fade-in">Please select your country.</p>
                )}
              </>
            )}

            {/* Terms checkbox — last step only */}
            {isLastStep && (
              <div className="mt-6">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5 flex-shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={termsAccepted}
                      onChange={(e) => { setTermsAccepted(e.target.checked); if (e.target.checked) setTermsError(false) }}
                    />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                      ${termsAccepted ? 'bg-primary border-primary'
                        : termsError ? 'border-destructive bg-destructive/5'
                        : 'border-muted-foreground group-hover:border-primary'}`}>
                      {termsAccepted && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground leading-relaxed">
                    I have read and agree to BunkerM&apos;s{' '}
                    <a
                      href="https://bunkerai.dev/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline underline-offset-2 hover:text-primary/80"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Terms &amp; Conditions
                    </a>
                    . Your email will be stored securely and used only for account recovery and product updates.
                  </span>
                </label>
                {termsError && (
                  <p className="mt-2 text-sm text-destructive animate-fade-in">
                    You must accept the Terms &amp; Conditions to create your account.
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 mt-8">
              {stepIndex > 0 && (
                <Button variant="ghost" size="sm" onClick={goBack} disabled={isSubmitting} className="gap-1 text-muted-foreground">
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>
              )}

              <Button
                onClick={advance}
                disabled={isSubmitting || currentValue.trim() === ''}
                className="gap-2 ml-auto"
                size="lg"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Creating account…</>
                ) : isLastStep ? (
                  <><Check className="w-4 h-4" />Create my account</>
                ) : (
                  <>OK<ArrowRight className="w-4 h-4" /></>
                )}
              </Button>
            </div>

            {isFirstStep && (
              <p className="text-xs text-muted-foreground mt-10 text-center">
                Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">Enter ↵</kbd> to continue
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
