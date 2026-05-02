import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

/** Safe count — returns 0 if the table doesn't exist yet (42P01 = undefined_table) */
async function safeCount(db: ReturnType<typeof sql>, query: () => Promise<any[]>): Promise<number> {
  try {
    const res = await query()
    return res[0]?.count || 0
  } catch (err: any) {
    if (err?.code === '42P01') return 0   // table not migrated yet
    throw err
  }
}

export async function GET() {
  const db = sql()

  try {
    const [
      marksheetsIssued,
      degreesIssued,
      coursesIssued,
      verifiedMarksheets,
      verifiedDegrees,
      verifiedCourses,
      adminUsers,
    ] = await Promise.all([
      safeCount(db, () => db`SELECT COUNT(*)::int as count FROM marksheets`),
      safeCount(db, () => db`SELECT COUNT(*)::int as count FROM degrees`),
      safeCount(db, () => db`SELECT COUNT(*)::int as count FROM courses`),
      safeCount(db, () => db`SELECT COUNT(*)::int as count FROM marksheets WHERE tx_hash_pdf IS NOT NULL OR tx_hash_data IS NOT NULL`),
      safeCount(db, () => db`SELECT COUNT(*)::int as count FROM degrees WHERE tx_hash_pdf IS NOT NULL OR tx_hash_data IS NOT NULL`),
      safeCount(db, () => db`SELECT COUNT(*)::int as count FROM courses WHERE tx_hash_pdf IS NOT NULL OR tx_hash_data IS NOT NULL`),
      safeCount(db, () => db`SELECT COUNT(*)::int as count FROM admin`),
    ])

    return NextResponse.json({
      success: true,
      stats: {
        certificatesIssued: marksheetsIssued + degreesIssued + coursesIssued,
        marksheetsIssued,
        degreesIssued,
        coursesIssued,
        verifiedOnChain: verifiedMarksheets + verifiedDegrees + verifiedCourses,
        adminUsers,
      }
    })
  } catch (err: any) {
    console.error('[dashboard-stats] Error:', err)
    return NextResponse.json({ error: 'Failed to fetch dashboard statistics' }, { status: 500 })
  }
}
