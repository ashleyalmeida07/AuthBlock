import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  try {
    // @ts-ignore
    const db = sql()

    const [ms, deg, crs, msOnChain, degOnChain, crsOnChain, admins] = await Promise.all([
      db`SELECT COUNT(*)::int AS c FROM marksheets`.catch(() => [{ c: 0 }]),
      db`SELECT COUNT(*)::int AS c FROM degrees`.catch(() => [{ c: 0 }]),
      db`SELECT COUNT(*)::int AS c FROM courses`.catch(() => [{ c: 0 }]),
      db`SELECT COUNT(*)::int AS c FROM marksheets WHERE tx_hash_pdf IS NOT NULL OR tx_hash_data IS NOT NULL`.catch(() => [{ c: 0 }]),
      db`SELECT COUNT(*)::int AS c FROM degrees WHERE tx_hash_pdf IS NOT NULL OR tx_hash_data IS NOT NULL`.catch(() => [{ c: 0 }]),
      db`SELECT COUNT(*)::int AS c FROM courses WHERE tx_hash_pdf IS NOT NULL OR tx_hash_data IS NOT NULL`.catch(() => [{ c: 0 }]),
      db`SELECT COUNT(*)::int AS c FROM admin`.catch(() => [{ c: 0 }]),
    ])

    const marksheetsIssued  = Number(ms[0]?.c)       || 0
    const degreesIssued     = Number(deg[0]?.c)      || 0
    const coursesIssued     = Number(crs[0]?.c)      || 0
    const verifiedOnChain   = (Number(msOnChain[0]?.c) || 0)
                            + (Number(degOnChain[0]?.c) || 0)
                            + (Number(crsOnChain[0]?.c) || 0)
    const adminUsers        = Number(admins[0]?.c)   || 0

    console.log('[dashboard-stats] Counts:', { marksheetsIssued, degreesIssued, coursesIssued, verifiedOnChain, adminUsers })

    return NextResponse.json({
      success: true,
      stats: {
        certificatesIssued: marksheetsIssued + degreesIssued + coursesIssued,
        marksheetsIssued,
        degreesIssued,
        coursesIssued,
        verifiedOnChain,
        adminUsers,
      }
    })
  } catch (err: any) {
    console.error('[dashboard-stats] Error:', err)
    return NextResponse.json({ error: 'Failed to fetch dashboard statistics' }, { status: 500 })
  }
}

