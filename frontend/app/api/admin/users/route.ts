import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, signToken, COOKIE_NAME } from '@/lib/auth'
import { readUsers, writeUsers, findUserByEmail, stripHash } from '@/lib/users'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return null
  const user = await verifyToken(token)
  if (!user || user.role !== 'admin') return null
  return user
}

// GET /api/admin/users — list all users
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const users = readUsers().map(stripHash)
  return NextResponse.json({ users })
}

// POST /api/admin/users — create a new user
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { email, password, firstName, lastName, role } = await request.json()
  if (!email || !password || !firstName || !lastName) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
  }
  if (findUserByEmail(email)) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  }

  const users = readUsers()
  const newUser = {
    id: randomUUID(),
    email,
    passwordHash: await bcrypt.hash(password, 10),
    firstName,
    lastName,
    createdAt: new Date().toISOString(),
    role: role === 'admin' ? 'admin' : 'user',
  } as const
  users.push(newUser as any)
  writeUsers(users as any)

  return NextResponse.json({ user: stripHash(newUser as any) }, { status: 201 })
}
