import { NextRequest, NextResponse } from 'next/server'
import { readFile, writeFile } from 'fs/promises'

const ANNOTATIONS_FILE = '/nextjs/data/topic_annotations.json'

export async function GET() {
  try {
    const raw = await readFile(ANNOTATIONS_FILE, 'utf-8')
    return NextResponse.json(JSON.parse(raw))
  } catch {
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  const annotations = await request.json()
  await writeFile(ANNOTATIONS_FILE, JSON.stringify(annotations, null, 2), 'utf-8')
  return NextResponse.json({ ok: true })
}
