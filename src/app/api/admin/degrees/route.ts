import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(req: Request) {
  try {
    const _forceRead = req.url
    const db = sql()
    const degrees = await db`
      SELECT
        d.id, d.serial_no, d.student_name, d.prn_no, d.branch, d.degree_title,
        d.enrollment_year, d.year_of_passing, d.final_cgpi, d.classification, d.convocation_date,
        d.pdf_url, d.issued_at,
        d.pdf_hash, d.data_hash, d.tx_hash_pdf, d.tx_hash_data,
        d.certificate_id, d.verification_url,
        a.name as issued_by_name
      FROM degrees d
      LEFT JOIN admin a ON d.issued_by = a.id
      ORDER BY d.issued_at DESC
    `
    return NextResponse.json({ degrees }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    })
  } catch (err: any) {
    console.error('[fetch-degrees]', err)
    return NextResponse.json({ error: 'Failed to fetch degrees' }, { status: 500 })
  }
}
