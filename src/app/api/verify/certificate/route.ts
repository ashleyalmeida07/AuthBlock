import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getBlockchainContract, getDegreeBlockchainContract, getCourseBlockchainContract } from '@/lib/blockchain'

export const dynamic = 'force-dynamic'

// Map of doc type → contract getter
const contractGetters = {
  marksheet: getBlockchainContract,
  degree: getDegreeBlockchainContract,
  course: getCourseBlockchainContract,
}

export async function GET(request: NextRequest) {
  let certId: string | null = null

  try {
    const searchParams = request.nextUrl.searchParams
    certId             = searchParams.get('cert')
    const expectedHash = searchParams.get('hash')
    const expectedTx   = searchParams.get('tx')
    const docTypeParam = searchParams.get('type') // 'marksheet' | 'degree' | 'course'

    if (!certId && !expectedHash) {
      return NextResponse.json({ error: 'Certificate ID or hash required' }, { status: 400 })
    }

    console.log('[Verify] Verification request:', { certId, expectedHash, expectedTx, docType: docTypeParam })

    // @ts-ignore
    const db = sql()

    // ── Determine document type from certId prefix or explicit param ──
    let detectedType: 'marksheet' | 'degree' | 'course' = 'marksheet'
    if (docTypeParam && ['marksheet', 'degree', 'course'].includes(docTypeParam)) {
      detectedType = docTypeParam as typeof detectedType
    } else if (certId) {
      if (certId.startsWith('DEG-')) detectedType = 'degree'
      else if (certId.startsWith('CRS-')) detectedType = 'course'
      else detectedType = 'marksheet' // ABC- prefix or default
    }

    console.log('[Verify] Detected document type:', detectedType)

    // ── Fetch record from the correct table ──────────────────────
    let record: any = null

    if (detectedType === 'marksheet') {
      const result = certId
        ? await db`
            SELECT
              m.certificate_id, m.student_name, m.prn_no, m.serial_no, m.examination, m.branch,
              m.session_name, m.sgpi, m.cgpi, m.remarks,
              m.data_hash, m.pdf_hash, m.tx_hash_data, m.tx_hash_pdf,
              m.verification_url, m.supabase_pdf_url, m.certificate_url,
              m.issued_at, m.certificate_data,
              a.name as issued_by_name
            FROM marksheets m
            LEFT JOIN admin a ON m.issued_by = a.id
            WHERE m.certificate_id = ${certId}
            LIMIT 1
          `
        : await db`
            SELECT
              m.certificate_id, m.student_name, m.prn_no, m.serial_no, m.examination, m.branch,
              m.session_name, m.sgpi, m.cgpi, m.remarks,
              m.data_hash, m.pdf_hash, m.tx_hash_data, m.tx_hash_pdf,
              m.verification_url, m.supabase_pdf_url, m.certificate_url,
              m.issued_at, m.certificate_data,
              a.name as issued_by_name
            FROM marksheets m
            LEFT JOIN admin a ON m.issued_by = a.id
            WHERE m.data_hash = ${expectedHash} OR m.pdf_hash = ${expectedHash}
            LIMIT 1
          `
      record = result?.[0] || null
    } else if (detectedType === 'degree') {
      const result = certId
        ? await db`
            SELECT
              d.certificate_id, d.student_name, d.prn_no, d.serial_no, d.branch,
              d.degree_title, d.enrollment_year, d.year_of_passing, d.final_cgpi,
              d.classification, d.convocation_date,
              d.data_hash, d.pdf_hash, d.tx_hash_data, d.tx_hash_pdf,
              d.verification_url, d.pdf_url,
              d.issued_at, d.certificate_data,
              a.name as issued_by_name
            FROM degrees d
            LEFT JOIN admin a ON d.issued_by = a.id
            WHERE d.certificate_id = ${certId}
            LIMIT 1
          `
        : await db`
            SELECT
              d.certificate_id, d.student_name, d.prn_no, d.serial_no, d.branch,
              d.degree_title, d.enrollment_year, d.year_of_passing, d.final_cgpi,
              d.classification, d.convocation_date,
              d.data_hash, d.pdf_hash, d.tx_hash_data, d.tx_hash_pdf,
              d.verification_url, d.pdf_url,
              d.issued_at, d.certificate_data,
              a.name as issued_by_name
            FROM degrees d
            LEFT JOIN admin a ON d.issued_by = a.id
            WHERE d.data_hash = ${expectedHash} OR d.pdf_hash = ${expectedHash}
            LIMIT 1
          `
      record = result?.[0] || null
    } else if (detectedType === 'course') {
      const result = certId
        ? await db`
            SELECT
              c.certificate_id, c.student_name, c.prn_no,
              c.course_name, c.course_type, c.duration, c.instructor_name,
              c.start_date, c.end_date, c.grade, c.description,
              c.data_hash, c.pdf_hash, c.tx_hash_data, c.tx_hash_pdf,
              c.verification_url, c.pdf_url,
              c.issued_at, c.certificate_data,
              a.name as issued_by_name
            FROM courses c
            LEFT JOIN admin a ON c.issued_by = a.id
            WHERE c.certificate_id = ${certId}
            LIMIT 1
          `
        : await db`
            SELECT
              c.certificate_id, c.student_name, c.prn_no,
              c.course_name, c.course_type, c.duration, c.instructor_name,
              c.start_date, c.end_date, c.grade, c.description,
              c.data_hash, c.pdf_hash, c.tx_hash_data, c.tx_hash_pdf,
              c.verification_url, c.pdf_url,
              c.issued_at, c.certificate_data,
              a.name as issued_by_name
            FROM courses c
            LEFT JOIN admin a ON c.issued_by = a.id
            WHERE c.data_hash = ${expectedHash} OR c.pdf_hash = ${expectedHash}
            LIMIT 1
          `
      record = result?.[0] || null
    }

    // ── If not found in auto-detected table, try others ──────────
    if (!record && certId) {
      // Fallback: search all tables
      const markResult = await db`SELECT certificate_id FROM marksheets WHERE certificate_id = ${certId} LIMIT 1`
      if (markResult.length > 0) {
        detectedType = 'marksheet'
        // Re-fetch to avoid code duplication — redirect to self with type
        return NextResponse.redirect(
          new URL(`/api/verify/certificate?cert=${certId}&type=marksheet${expectedHash ? '&hash=' + expectedHash : ''}${expectedTx ? '&tx=' + expectedTx : ''}`, request.url)
        )
      }
      const degResult = await db`SELECT certificate_id FROM degrees WHERE certificate_id = ${certId} LIMIT 1`
      if (degResult.length > 0) {
        return NextResponse.redirect(
          new URL(`/api/verify/certificate?cert=${certId}&type=degree${expectedHash ? '&hash=' + expectedHash : ''}${expectedTx ? '&tx=' + expectedTx : ''}`, request.url)
        )
      }
      const crsResult = await db`SELECT certificate_id FROM courses WHERE certificate_id = ${certId} LIMIT 1`
      if (crsResult.length > 0) {
        return NextResponse.redirect(
          new URL(`/api/verify/certificate?cert=${certId}&type=course${expectedHash ? '&hash=' + expectedHash : ''}${expectedTx ? '&tx=' + expectedTx : ''}`, request.url)
        )
      }
    }

    if (!record) {
      return NextResponse.json({
        verified: false,
        error: 'Document record not found',
        certificate_id: certId,
        doc_type: detectedType
      }, { status: 404 })
    }

    certId = record.certificate_id

    // Stored hashes
    const storedDataHash   = record.data_hash
    const storedPdfHash    = record.pdf_hash
    const storedTxHashData = record.tx_hash_data
    const storedTxHashPdf  = record.tx_hash_pdf

    console.log('[Verify] Found record:', {
      type: detectedType,
      id: record.certificate_id,
      student: record.student_name,
      storedDataHash: storedDataHash?.substring(0, 20) + '...',
    })

    // ── 1. Hash match ────────────────────────────────────────────
    let hashVerified = true
    if (expectedHash && (storedDataHash || storedPdfHash)) {
      const expected = expectedHash.toLowerCase()
      hashVerified =
        (storedDataHash && expected === storedDataHash.toLowerCase()) ||
        (storedPdfHash  && expected === storedPdfHash.toLowerCase())
    }

    // ── 2. Transaction match ─────────────────────────────────────
    let txVerified = true
    if (expectedTx && (storedTxHashData || storedTxHashPdf)) {
      const expected = expectedTx.toLowerCase()
      txVerified =
        (storedTxHashData && expected === storedTxHashData.toLowerCase()) ||
        (storedTxHashPdf  && expected === storedTxHashPdf.toLowerCase())
    }

    // ── 3. Blockchain presence check ─────────────────────────────
    let onBlockchain = false
    let blockchainTimestamp: string | null = null

    try {
      const getContract = contractGetters[detectedType]
      const { contract } = await getContract()
      const hashToCheck = storedDataHash || storedPdfHash
      const [exists, timestamp] = await contract.verifyHash(hashToCheck)
      onBlockchain = exists && Number(timestamp) > 0
      blockchainTimestamp = onBlockchain
        ? new Date(Number(timestamp) * 1000).toISOString()
        : null
    } catch (e: any) {
      console.error('[Verify] Blockchain verification error:', e)
      return NextResponse.json({
        verified: false,
        error: 'Unable to verify on blockchain: ' + e.message,
        certificate_id: certId,
        doc_type: detectedType
      }, { status: 500 })
    }

    const verified = hashVerified && txVerified && onBlockchain

    // Parse certificate_data
    let parsedCertData: any = {}
    let ocrCoordinateMap: any[] = []
    try {
      parsedCertData = typeof record.certificate_data === 'string'
        ? JSON.parse(record.certificate_data)
        : (record.certificate_data || {})
      ocrCoordinateMap = parsedCertData.ocr_coordinate_map || []
    } catch { /* ignore */ }

    // ── Build response based on document type ────────────────────
    const baseResponse = {
      verified,
      doc_type: detectedType,
      certificate_id: certId,
      verification: {
        hash_valid: hashVerified,
        transaction_valid: txVerified,
        on_blockchain: onBlockchain,
        blockchain_timestamp: blockchainTimestamp,
        expected_hash: expectedHash,
        stored_data_hash: storedDataHash,
        expected_tx: expectedTx,
        stored_tx: storedTxHashData
      },
      blockchain: {
        data_hash: storedDataHash,
        pdf_hash: storedPdfHash,
        tx_hash_data: storedTxHashData,
        tx_hash_pdf: storedTxHashPdf,
        etherscan_data_url: storedTxHashData ? `https://sepolia.etherscan.io/tx/${storedTxHashData}` : null,
        etherscan_pdf_url: storedTxHashPdf ? `https://sepolia.etherscan.io/tx/${storedTxHashPdf}` : null,
        etherscan_url: storedTxHashData ? `https://sepolia.etherscan.io/tx/${storedTxHashData}` : null
      }
    }

    if (detectedType === 'marksheet') {
      return NextResponse.json({
        ...baseResponse,
        certificate: {
          id: record.certificate_id,
          student_name: record.student_name,
          prn_no: record.prn_no,
          serial_no: record.serial_no,
          examination: record.examination,
          branch: record.branch,
          session: record.session_name,
          sgpi: record.sgpi,
          cgpi: record.cgpi,
          remarks: record.remarks,
          issued_at: record.issued_at,
          issued_by: record.issued_by_name,
          verification_url: record.verification_url,
          marksheet_url: record.supabase_pdf_url,
          certificate_url: record.certificate_url,
          certificate_data: parsedCertData,
          ocr_coordinate_map: ocrCoordinateMap
        }
      })
    } else if (detectedType === 'degree') {
      return NextResponse.json({
        ...baseResponse,
        certificate: {
          id: record.certificate_id,
          student_name: record.student_name,
          prn_no: record.prn_no,
          serial_no: record.serial_no,
          branch: record.branch,
          degree_title: record.degree_title,
          enrollment_year: record.enrollment_year,
          year_of_passing: record.year_of_passing,
          final_cgpi: record.final_cgpi,
          classification: record.classification,
          convocation_date: record.convocation_date,
          issued_at: record.issued_at,
          issued_by: record.issued_by_name,
          verification_url: record.verification_url,
          pdf_url: record.pdf_url,
          certificate_data: parsedCertData
        }
      })
    } else {
      // course
      return NextResponse.json({
        ...baseResponse,
        certificate: {
          id: record.certificate_id,
          student_name: record.student_name,
          prn_no: record.prn_no,
          course_name: record.course_name,
          course_type: record.course_type,
          duration: record.duration,
          instructor_name: record.instructor_name,
          start_date: record.start_date,
          end_date: record.end_date,
          grade: record.grade,
          description: record.description,
          issued_at: record.issued_at,
          issued_by: record.issued_by_name,
          verification_url: record.verification_url,
          pdf_url: record.pdf_url,
          certificate_data: parsedCertData
        }
      })
    }

  } catch (err: any) {
    console.error('[verify-certificate] ERROR:', err)
    return NextResponse.json({
      verified: false,
      error: 'Internal server error: ' + err.message,
      certificate_id: certId || 'unknown'
    }, { status: 500 })
  }
}
