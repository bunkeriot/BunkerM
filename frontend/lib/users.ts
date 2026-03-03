import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import type { UserWithHash } from '@/types'

const DATA_DIR = path.join(process.cwd(), 'data')
const USERS_FILE = path.join(DATA_DIR, 'users.json')

const DEFAULT_ADMIN: UserWithHash = {
  id: 'admin-default',
  email: 'admin@bunker.local',
  passwordHash: bcrypt.hashSync('admin123', 10),
  firstName: 'Admin',
  lastName: 'User',
  createdAt: new Date().toISOString(),
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
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
    return JSON.parse(content) as UserWithHash[]
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

export async function createUser(data: {
  email: string
  password: string
  firstName: string
  lastName: string
}): Promise<UserWithHash> {
  const users = readUsers()
  const passwordHash = await bcrypt.hash(data.password, 10)
  const newUser: UserWithHash = {
    id: randomUUID(),
    email: data.email,
    passwordHash,
    firstName: data.firstName,
    lastName: data.lastName,
    createdAt: new Date().toISOString(),
  }
  users.push(newUser)
  writeUsers(users)
  return newUser
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

export function stripHash(user: UserWithHash): Omit<UserWithHash, 'passwordHash'> {
  const { passwordHash: _, ...rest } = user
  return rest
}
