import { SignJWT, jwtVerify } from 'jose'
import type { User } from '@/types'

const AUTH_SECRET = process.env.AUTH_SECRET || 'fallback-secret-change-in-production'
const secret = new TextEncoder().encode(AUTH_SECRET)
const TOKEN_EXPIRY = '24h'
export const COOKIE_NAME = 'bunkerm_token'

export async function signToken(user: User): Promise<string> {
  return new SignJWT({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(secret)
}

export async function verifyToken(token: string): Promise<User | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return {
      id: payload.id as string,
      email: payload.email as string,
      firstName: payload.firstName as string,
      lastName: payload.lastName as string,
      createdAt: payload.createdAt as string || new Date().toISOString(),
    }
  } catch {
    return null
  }
}

export function cookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: maxAge ?? 60 * 60 * 24, // 24h
  }
}
