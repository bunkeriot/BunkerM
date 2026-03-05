import { NextRequest, NextResponse } from 'next/server'
import { findUserByEmail, createUser, stripHash } from '@/lib/users'
import { signToken, cookieOptions, COOKIE_NAME } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName } = await request.json()

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
    const newUser = await createUser({ email, password, firstName, lastName })
    const userWithoutHash = stripHash(newUser)
    const token = await signToken(userWithoutHash)

    const response = NextResponse.json({ user: userWithoutHash }, { status: 201 })
    response.cookies.set(COOKIE_NAME, token, cookieOptions())

    return response
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
