import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getBlockchainContract, getDegreeBlockchainContract, getCourseBlockchainContract } from '@/lib/blockchain'

export async function POST(req: Request) {
  try {
    const { hash } = await req.json()

    if (!hash) {
      return NextResponse.json({ error: 'Hash is required for verification' }, { status: 400 })
    }

    console.log('[Verify Debug] Received hash for verification:', hash)
    const formattedHash = hash.startsWith('0x') ? hash : '0x' + hash

    // ── Search across all 3 tables for the hash ──────────────────
    const db = sql()

    // Try marksheets first
    let marksheets = await db`
      SELECT
        serial_no, student_name, prn_no, examination, branch, session_name,
        sgpi, cgpi, remarks, supabase_pdf_url, issued_at, tx_hash_pdf, tx_hash_data,
        pdf_hash, data_hash, certificate_id
      FROM marksheets
      WHERE pdf_hash = ${formattedHash} OR data_hash = ${formattedHash}
      LIMIT 1
    `

    if (marksheets.length > 0) {
      return await verifyAndRespond('marksheet', marksheets[0], formattedHash, getBlockchainContract)
    }

    // Try degrees
    let degrees = await db`
      SELECT
        serial_no, student_name, prn_no, branch, degree_title,
        enrollment_year, year_of_passing, final_cgpi, classification,
        pdf_url, issued_at, tx_hash_pdf, tx_hash_data,
        pdf_hash, data_hash, certificate_id
      FROM degrees
      WHERE pdf_hash = ${formattedHash} OR data_hash = ${formattedHash}
      LIMIT 1
    `

    if (degrees.length > 0) {
      return await verifyAndRespond('degree', degrees[0], formattedHash, getDegreeBlockchainContract)
    }

    // Try courses
    let courses = await db`
      SELECT
        student_name, prn_no, course_name, course_type, duration,
        instructor_name, start_date, end_date, grade,
        pdf_url, issued_at, tx_hash_pdf, tx_hash_data,
        pdf_hash, data_hash, certificate_id
      FROM courses
      WHERE pdf_hash = ${formattedHash} OR data_hash = ${formattedHash}
      LIMIT 1
    `

    if (courses.length > 0) {
      return await verifyAndRespond('course', courses[0], formattedHash, getCourseBlockchainContract)
    }

    // ── Not found in any table — try blockchain directly ─────────
    // Check marksheet contract as fallback
    try {
      const { contract } = await getBlockchainContract()
      const [isValid] = await contract.verifyHash(formattedHash)
      if (isValid) {
        return NextResponse.json({
          verified: true,
          doc_type: 'unknown',
          message: 'Hash verified on blockchain but no matching database record found.',
          record: null
        })
      }
    } catch { /* ignore */ }

    return NextResponse.json({
      verified: false,
      message: 'This document hash was not found on the blockchain or in our records.'
    })

  } catch (err: any) {
    console.error('[verify-api]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

async function verifyAndRespond(
  docType: string,
  record: any,
  formattedHash: string,
  getContract: () => Promise<any>
) {
  // Check blockchain
  const { contract } = await getContract()
  const [isValid, timestamp] = await contract.verifyHash(formattedHash)

  if (!isValid) {
    return NextResponse.json({
      verified: false,
      doc_type: docType,
      message: 'This document hash was not found on the blockchain.'
    })
  }

  const matchType = record.pdf_hash === formattedHash ? 'Digital PDF' : 'Scanned Document (Data)'
  const txHash = record.pdf_hash === formattedHash ? record.tx_hash_pdf : record.tx_hash_data

  return NextResponse.json({
    verified: true,
    doc_type: docType,
    onChainTimestamp: Number(timestamp) * 1000,
    matchType,
    txHash,
    record: {
      certificate_id: record.certificate_id,
      student_name: record.student_name,
      prn_no: record.prn_no,
      issued_at: record.issued_at,
      data_hash: record.data_hash,
      pdf_hash: record.pdf_hash,
      tx_hash_data: record.tx_hash_data,
      tx_hash_pdf: record.tx_hash_pdf,
      original_pdf_url: record.supabase_pdf_url || record.pdf_url,
      // Type-specific fields
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
  })
}
