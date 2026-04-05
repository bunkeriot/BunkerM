import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { readUsers, writeUsers, stripHash } from '@/lib/users'
import bcrypt from 'bcryptjs'

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  const user = await verifyToken(token)
  if (!user || user.role !== 'admin') return null
  return user
}

// PATCH /api/admin/users/[id] — update user (name, email, password, role)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await request.json()
  const users = readUsers()
  const idx = users.findIndex((u) => u.id === id)
  if (idx === -1) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const user = users[idx]

  // Guard: cannot downgrade the last admin
  if (body.role === 'user' && user.role === 'admin') {
    const adminCount = users.filter((u) => u.role === 'admin').length
    if (adminCount <= 1) {
      return NextResponse.json({ error: 'Cannot downgrade the last admin account' }, { status: 400 })
    }
  }

  if (body.firstName) user.firstName = body.firstName
  if (body.lastName)  user.lastName  = body.lastName
  if (body.email) {
    const conflict = users.find((u) => u.email.toLowerCase() === body.email.toLowerCase() && u.id !== id)
    if (conflict) return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    user.email = body.email
  }
  if (body.role === 'admin' || body.role === 'user') user.role = body.role
  if (body.password) {
    if (body.password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }
    user.passwordHash = await bcrypt.hash(body.password, 10)
  }

  users[idx] = user
  writeUsers(users)
  return NextResponse.json({ user: stripHash(user) })
}

// DELETE /api/admin/users/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params

  // Cannot delete yourself
  if (admin.id === id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  }

  const users = readUsers()
  const user = users.find((u) => u.id === id)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Cannot delete the last admin
  if (user.role === 'admin') {
    const adminCount = users.filter((u) => u.role === 'admin').length
    if (adminCount <= 1) {
      return NextResponse.json({ error: 'Cannot delete the last admin account' }, { status: 400 })
    }
  }

  writeUsers(users.filter((u) => u.id !== id))
  return NextResponse.json({ ok: true })
}
