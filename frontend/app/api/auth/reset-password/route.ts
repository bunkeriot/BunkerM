import { NextRequest, NextResponse } from 'next/server'
import { consumeRecoveryToken, readUsers, writeUsers } from '@/lib/users'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  const { token, password } = await request.json()

  if (!token || !password) {
    return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  }

  const user = consumeRecoveryToken(token)
  if (!user) {
    return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
  }

  // Set new password
  const users = readUsers()
  const idx = users.findIndex((u) => u.id === user.id)
  if (idx === -1) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  users[idx].passwordHash = await bcrypt.hash(password, 10)
  writeUsers(users)

  return NextResponse.json({ ok: true })
}
