import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { randomBytes } from 'crypto'

const KEY_FILE = '/nextjs/data/.api_key'
const DEFAULT_KEY = 'default_api_key_replace_in_production'

function getCurrentKey(): { key: string; source: 'env' | 'file' | 'default' } {
  const envKey = process.env.API_KEY
  if (envKey && envKey !== DEFAULT_KEY) {
    return { key: envKey, source: 'env' }
  }
  try {
    const fileKey = readFileSync(KEY_FILE, 'utf8').trim()
    if (fileKey) return { key: fileKey, source: 'file' }
  } catch {
    // file not found or unreadable
  }
  return { key: envKey || DEFAULT_KEY, source: envKey ? 'env' : 'default' }
}

export async function GET() {
  const { key, source } = getCurrentKey()
  return NextResponse.json({ key, source })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  if (body.action !== 'regenerate') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }
  const newKey = randomBytes(32).toString('hex')
  try {
    mkdirSync('/nextjs/data', { recursive: true })
    writeFileSync(KEY_FILE, newKey, { mode: 0o600 })
  } catch (err) {
    console.error('[settings] Failed to write API key file:', err)
    return NextResponse.json({ error: 'Failed to persist new key' }, { status: 500 })
  }
  return NextResponse.json({
    key: newKey,
    source: 'file',
    message: 'API key regenerated. All services will use the new key within seconds.',
  })
}
