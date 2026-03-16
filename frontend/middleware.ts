import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const AUTH_SECRET = process.env.AUTH_SECRET || 'fallback-secret-change-in-production'
const secret = new TextEncoder().encode(AUTH_SECRET)
const COOKIE_NAME = 'bunkerm_token'

const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/setup']
const API_PATHS = ['/api/auth', '/api/logs', '/api/proxy', '/api/settings', '/api/ai']

function publicUrl(request: NextRequest, pathname: string): URL {
  // request.nextUrl uses Next.js's internal port (3000). Reconstruct using
  // the Host header forwarded by nginx ($http_host) to get the public port.
  const host  = request.headers.get('host') ?? request.nextUrl.host
  const proto = request.headers.get('x-forwarded-proto') ?? 'http'
  return new URL(pathname, `${proto}://${host}`)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip auth API routes
  if (API_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const token = request.cookies.get(COOKIE_NAME)?.value
  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  if (!token) {
    if (isPublicPath) return NextResponse.next()
    return NextResponse.redirect(publicUrl(request, '/login'))
  }

  try {
    const { payload } = await jwtVerify(token, secret)

    if (isPublicPath) {
      return NextResponse.redirect(publicUrl(request, '/dashboard'))
    }

    // Protect /admin/* routes — only admin role allowed
    if (pathname.startsWith('/admin')) {
      if (payload.role !== 'admin') {
        return NextResponse.redirect(publicUrl(request, '/dashboard'))
      }
    }

    // Protect /api/admin/* routes — admin only
    if (pathname.startsWith('/api/admin')) {
      if (payload.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    return NextResponse.next()
  } catch {
    if (isPublicPath) return NextResponse.next()
    const response = NextResponse.redirect(publicUrl(request, '/login'))
    response.cookies.delete(COOKIE_NAME)
    return response
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
