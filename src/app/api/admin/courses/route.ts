import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(req: Request) {
  try {
    const _forceRead = req.url
    const db = sql()
    const courses = await db`
      SELECT
        c.id, c.student_name, c.prn_no, c.course_name, c.course_type, c.duration,
        c.instructor_name, c.start_date, c.end_date, c.grade, c.description,
        c.pdf_url, c.issued_at,
        c.pdf_hash, c.data_hash, c.tx_hash_pdf, c.tx_hash_data,
        c.certificate_id, c.verification_url,
        a.name as issued_by_name
      FROM courses c
      LEFT JOIN admin a ON c.issued_by = a.id
      ORDER BY c.issued_at DESC
    `
    return NextResponse.json({ courses }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    })
  } catch (err: any) {
    console.error('[fetch-courses]', err)
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
  }
}
