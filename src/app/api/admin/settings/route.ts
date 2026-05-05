import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

// GET /api/admin/settings?id=xxx
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  try {
    const db = sql()
    const rows = await db`
      SELECT id, name, email, phone, position, admin_type, firebase_uid, firebase_photo_url, created_at
      FROM admin WHERE id = ${id} LIMIT 1
    `
    if (rows.length === 0) return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    return NextResponse.json({ admin: rows[0] })
  } catch (err) {
    console.error('[settings GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PATCH /api/admin/settings — update profile
export async function PATCH(req: NextRequest) {
  try {
    const { id, name, phone, position } = await req.json()
    if (!id || !name) return NextResponse.json({ error: 'ID and name are required' }, { status: 400 })

    const db = sql()
    const rows = await db`
      UPDATE admin
      SET name = ${name.trim()}, phone = ${phone?.trim() || null}, position = ${position?.trim() || null}
      WHERE id = ${id}
      RETURNING id, name, email, phone, position, admin_type, firebase_uid, firebase_photo_url, created_at
    `
    if (rows.length === 0) return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    return NextResponse.json({ success: true, admin: rows[0] })
  } catch (err) {
    console.error('[settings PATCH]', err)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
