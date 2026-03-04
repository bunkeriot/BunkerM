import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const AUTH_SECRET = process.env.AUTH_SECRET || 'fallback-secret-change-in-production'
const secret = new TextEncoder().encode(AUTH_SECRET)
const COOKIE_NAME = 'bunkerm_token'

const PUBLIC_PATHS = ['/login', '/register']
const API_PATHS = ['/api/auth', '/api/logs', '/api/proxy', '/api/settings']

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
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    await jwtVerify(token, secret)
    // Valid token
    if (isPublicPath) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  } catch {
    // Invalid token - clear cookie and redirect to login
    if (isPublicPath) return NextResponse.next()
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete(COOKIE_NAME)
    return response
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
