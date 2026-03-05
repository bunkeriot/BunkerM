import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const AUTH_SECRET = process.env.AUTH_SECRET || 'fallback-secret-change-in-production'
const secret = new TextEncoder().encode(AUTH_SECRET)
const COOKIE_NAME = 'bunkerm_token'

const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/reset-password']
const API_PATHS = ['/api/auth', '/api/logs', '/api/proxy', '/api/settings', '/api/ai']

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
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  try {
    const { payload } = await jwtVerify(token, secret)

    if (isPublicPath) {
      const dashboardUrl = request.nextUrl.clone()
      dashboardUrl.pathname = '/dashboard'
      return NextResponse.redirect(dashboardUrl)
    }

    // Protect /admin/* routes — only admin role allowed
    if (pathname.startsWith('/admin')) {
      if (payload.role !== 'admin') {
        const dashboardUrl = request.nextUrl.clone()
        dashboardUrl.pathname = '/dashboard'
        return NextResponse.redirect(dashboardUrl)
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
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    const response = NextResponse.redirect(loginUrl)
    response.cookies.delete(COOKIE_NAME)
    return response
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
