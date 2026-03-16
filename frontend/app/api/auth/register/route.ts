import { NextRequest, NextResponse } from 'next/server'
import { findUserByEmail, createUser, stripHash, readUsers } from '@/lib/users'
import { signToken, cookieOptions, COOKIE_NAME } from '@/lib/auth'
import { readFileSync } from 'fs'

const CONFIG_FILE = '/nextjs/data/bunkerai_config.json'

function readConfig() {
  try { return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8')) }
  catch { return {} }
}

async function syncProfileToCloud(profile: { email: string; country?: string }): Promise<void> {
  const config = readConfig()
  if (!config.cloud_url || !config.api_key) return
  try {
    await fetch(`${config.cloud_url}/tenant/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-api-key': config.api_key },
      body: JSON.stringify(profile),
    })
  } catch {
    // Non-fatal — profile sync is best-effort
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, country } = await request.json()

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const existing = findUserByEmail(email)
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    // createUser automatically assigns role:'admin' to the first user, 'user' to all subsequent
    const newUser = await createUser({ email, password, firstName, lastName, country })
    const userWithoutHash = stripHash(newUser)
    const token = await signToken(userWithoutHash)

    // Sync admin profile to BunkerAI Cloud (first user only — they become the account owner)
    const allUsers = readUsers()
    if (allUsers.length === 1) {
      void syncProfileToCloud({ email, ...(country ? { country } : {}) })
    }

    const response = NextResponse.json({ user: userWithoutHash }, { status: 201 })
    response.cookies.set(COOKIE_NAME, token, cookieOptions())

    return response
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
