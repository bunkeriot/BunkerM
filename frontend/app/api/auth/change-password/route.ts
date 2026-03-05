import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { readUsers, writeUsers, verifyPassword } from '@/lib/users'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const currentUser = await verifyToken(token)
  if (!currentUser) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const { currentPassword, newPassword } = await request.json()
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 })
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  }

  const users = readUsers()
  const user = users.find((u) => u.id === currentUser.id)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const valid = await verifyPassword(currentPassword, user.passwordHash)
  if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })

  user.passwordHash = await bcrypt.hash(newPassword, 10)
  writeUsers(users)

  return NextResponse.json({ message: 'Password changed successfully' }, { status: 200 })
}
