import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import type { UserWithHash } from '@/types'

const DATA_DIR = path.join(process.cwd(), 'data')
const USERS_FILE = path.join(DATA_DIR, 'users.json')

// Recovery tokens expire after 15 minutes
const RECOVERY_TTL_MS = 15 * 60 * 1000

const DEFAULT_ADMIN: UserWithHash = {
  id: 'admin-default',
  email: 'admin@bunker.local',
  passwordHash: bcrypt.hashSync('admin123', 10),
  firstName: 'Admin',
  lastName: 'User',
  createdAt: new Date().toISOString(),
  role: 'admin',
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

/** Normalize legacy records that pre-date the role field. */
function normalize(users: UserWithHash[]): UserWithHash[] {
  return users.map((u, i) => {
    if (u.role) return u
    // First user in the file (or the hardcoded admin id) becomes admin
    const isDefaultAdmin = u.id === 'admin-default' || u.email === 'admin@bunker.local'
    return { ...u, role: (i === 0 || isDefaultAdmin) ? 'admin' : 'user' }
  })
}

export function readUsers(): UserWithHash[] {
  ensureDataDir()
  if (!fs.existsSync(USERS_FILE)) {
    const users = [DEFAULT_ADMIN]
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
    return users
  }
  try {
    const content = fs.readFileSync(USERS_FILE, 'utf-8')
    const users = JSON.parse(content) as UserWithHash[]
    return normalize(users)
  } catch {
    return [DEFAULT_ADMIN]
  }
}

export function writeUsers(users: UserWithHash[]): void {
  ensureDataDir()
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
}

export function findUserByEmail(email: string): UserWithHash | undefined {
  const users = readUsers()
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase())
}

export function findUserById(id: string): UserWithHash | undefined {
  return readUsers().find((u) => u.id === id)
}

/** Returns true if at least one admin account exists in the file. */
export function hasAdmin(): boolean {
  return readUsers().some((u) => u.role === 'admin')
}

export async function createUser(data: {
  email: string
  password: string
  firstName: string
  lastName: string
}): Promise<UserWithHash> {
  const users = readUsers()
  // First user ever becomes admin; all subsequent are regular users
  const role = users.length === 0 ? 'admin' : 'user'
  const passwordHash = await bcrypt.hash(data.password, 10)
  const newUser: UserWithHash = {
    id: randomUUID(),
    email: data.email,
    passwordHash,
    firstName: data.firstName,
    lastName: data.lastName,
    createdAt: new Date().toISOString(),
    role,
  }
  users.push(newUser)
  writeUsers(users)
  return newUser
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

export function stripHash(user: UserWithHash): Omit<UserWithHash, 'passwordHash' | 'recoveryToken' | 'recoveryExpiry'> {
  const { passwordHash: _, recoveryToken: __, recoveryExpiry: ___, ...rest } = user
  return rest
}

// ── Recovery token helpers ────────────────────────────────────────────────────

export function generateRecoveryToken(userId: string): string {
  const users = readUsers()
  const user = users.find((u) => u.id === userId)
  if (!user) throw new Error('User not found')

  const token = randomUUID()
  user.recoveryToken = token
  user.recoveryExpiry = new Date(Date.now() + RECOVERY_TTL_MS).toISOString()
  writeUsers(users)
  return token
}

export function consumeRecoveryToken(token: string): UserWithHash | null {
  const users = readUsers()
  const user = users.find((u) => u.recoveryToken === token)
  if (!user || !user.recoveryExpiry) return null
  if (new Date(user.recoveryExpiry) < new Date()) return null  // expired

  delete user.recoveryToken
  delete user.recoveryExpiry
  writeUsers(users)
  return user
}
