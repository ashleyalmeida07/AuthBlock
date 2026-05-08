import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getBlockchainContract, getDegreeBlockchainContract, getCourseBlockchainContract } from '@/lib/blockchain'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { doc_type, student_name, serial_no, prn_no, course_name, examination } = body

    if (!student_name && !serial_no && !prn_no) {
      return NextResponse.json({ error: 'At least student_name, serial_no, or prn_no is required' }, { status: 400 })
    }

    console.log('[Verify Search] Searching by fields:', { doc_type, student_name, serial_no, prn_no })
    const db = sql()

    // ── Try degrees ──────────────────────────────────────────────
    if (!doc_type || doc_type === 'degree') {
      let records: any[] = []
      if (serial_no) {
        records = await db`
          SELECT d.*, a.name as issued_by_name
          FROM degrees d LEFT JOIN admin a ON d.issued_by = a.id
          WHERE d.serial_no = ${serial_no}
          LIMIT 1
        `
      }
      if (records.length === 0 && student_name) {
        records = await db`
          SELECT d.*, a.name as issued_by_name
          FROM degrees d LEFT JOIN admin a ON d.issued_by = a.id
          WHERE LOWER(d.student_name) = LOWER(${student_name})
          ORDER BY d.issued_at DESC LIMIT 1
        `
      }
      if (records.length > 0) {
        return await verifyRecord('degree', records[0], getDegreeBlockchainContract)
      }
    }

    // ── Try marksheets ───────────────────────────────────────────
    if (!doc_type || doc_type === 'marksheet') {
      let records: any[] = []
      if (serial_no) {
        records = await db`
          SELECT m.*, a.name as issued_by_name
          FROM marksheets m LEFT JOIN admin a ON m.issued_by = a.id
          WHERE m.serial_no = ${serial_no}
          ${examination ? sql()`AND m.examination = ${examination}` : sql()``}
          LIMIT 1
        `
      }
      if (records.length === 0 && student_name && prn_no) {
        records = await db`
          SELECT m.*, a.name as issued_by_name
          FROM marksheets m LEFT JOIN admin a ON m.issued_by = a.id
          WHERE LOWER(m.student_name) = LOWER(${student_name}) AND m.prn_no = ${prn_no}
          ORDER BY m.issued_at DESC LIMIT 1
        `
      }
      if (records.length > 0) {
        return await verifyRecord('marksheet', records[0], getBlockchainContract)
      }
    }

    // ── Try courses ──────────────────────────────────────────────
    if (!doc_type || doc_type === 'course') {
      let records: any[] = []
      if (student_name && course_name) {
        records = await db`
          SELECT c.*, a.name as issued_by_name
          FROM courses c LEFT JOIN admin a ON c.issued_by = a.id
          WHERE LOWER(c.student_name) = LOWER(${student_name})
            AND LOWER(c.course_name) = LOWER(${course_name})
          ORDER BY c.issued_at DESC LIMIT 1
        `
      }
      if (records.length === 0 && student_name) {
        records = await db`
          SELECT c.*, a.name as issued_by_name
          FROM courses c LEFT JOIN admin a ON c.issued_by = a.id
          WHERE LOWER(c.student_name) = LOWER(${student_name})
          ORDER BY c.issued_at DESC LIMIT 1
        `
      }
      if (records.length > 0) {
        return await verifyRecord('course', records[0], getCourseBlockchainContract)
      }
    }

    return NextResponse.json({
      verified: false,
      message: 'No matching certificate found in our records for the extracted data.'
    })

  } catch (err: any) {
    console.error('[verify-search] ERROR:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

async function verifyRecord(
  docType: string,
  record: any,
  getContract: () => Promise<any>
) {
  const hashToCheck = record.data_hash || record.pdf_hash
  if (!hashToCheck) {
    return NextResponse.json({
      verified: false,
      doc_type: docType,
      message: 'Record found but no hash stored.',
      record: buildRecordResponse(docType, record)
    })
  }

  // Verify on blockchain
  let onBlockchain = false
  let blockchainTimestamp: string | null = null
  try {
    const { contract } = await getContract()
    const [exists, timestamp] = await contract.verifyHash(hashToCheck)
    onBlockchain = exists && Number(timestamp) > 0
    blockchainTimestamp = onBlockchain ? new Date(Number(timestamp) * 1000).toISOString() : null
  } catch (e: any) {
    console.error('[Verify Search] Blockchain check error:', e.message)
  }

  const txHash = record.tx_hash_data || record.tx_hash_pdf

  return NextResponse.json({
    verified: onBlockchain,
    doc_type: docType,
    matchType: 'Text Extraction (Field Lookup)',
    onChainTimestamp: blockchainTimestamp ? new Date(blockchainTimestamp).getTime() : null,
    txHash,
    message: onBlockchain
      ? 'Certificate found and verified on blockchain via field matching.'
      : 'Certificate found in database but could not be verified on blockchain.',
    record: buildRecordResponse(docType, record)
  })
}

function buildRecordResponse(docType: string, record: any) {
  return {
    certificate_id: record.certificate_id,
    student_name: record.student_name,
    prn_no: record.prn_no,
    issued_at: record.issued_at,
    data_hash: record.data_hash,
    pdf_hash: record.pdf_hash,
    tx_hash_data: record.tx_hash_data,
    tx_hash_pdf: record.tx_hash_pdf,
    original_pdf_url: record.supabase_pdf_url || record.pdf_url,
    ...(docType === 'marksheet' && {
      serial_no: record.serial_no,
      examination: record.examination,
      branch: record.branch,
      session_name: record.session_name,
      sgpi: record.sgpi,
      cgpi: record.cgpi,
      remarks: record.remarks,
    }),
    ...(docType === 'degree' && {
      serial_no: record.serial_no,
      branch: record.branch,
      degree_title: record.degree_title,
      enrollment_year: record.enrollment_year,
      year_of_passing: record.year_of_passing,
      final_cgpi: record.final_cgpi,
      classification: record.classification,
    }),
    ...(docType === 'course' && {
      course_name: record.course_name,
      course_type: record.course_type,
      duration: record.duration,
      instructor_name: record.instructor_name,
      start_date: record.start_date,
      end_date: record.end_date,
      grade: record.grade,
    }),
  }
}
