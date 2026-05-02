import { NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { uploadToS3 } from '@/lib/s3'
import { sql } from '@/lib/db'
import crypto from 'crypto'
import QRCode from 'qrcode'
import { getDegreeBlockchainContract } from '@/lib/blockchain'
import { publishIssuanceNotification } from '@/lib/notifications'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      student_name, student_email, prn_no, serial_no,
      branch, degree_title, enrollment_year, year_of_passing,
      final_cgpi, classification, convocation_date, issued_by
    } = body

    if (!student_name || !prn_no || !degree_title) {
      return NextResponse.json({ error: 'Missing required degree data (student_name, prn_no, degree_title)' }, { status: 400 })
    }

    console.log('[Degree Issue] === STARTING DEGREE ISSUANCE ===')
    console.log('[Degree Issue] Student:', student_name, 'PRN:', prn_no)

    // ── Generate unique certificate ID ───────────────────────────
    const timestamp = Date.now()
    const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase()
    const prnPart = prn_no.substring(prn_no.length - 4)
    const yearPart = String(year_of_passing ?? '').replace(/[^0-9]/g, '').substring(0, 4)
    const certificateId = `DEG-${yearPart}-${prnPart}-${randomPart}-${timestamp.toString(36).toUpperCase()}`

    // ── Create data payload and hash ─────────────────────────────
    const degreeData = {
      student_name: String(student_name || ''),
      prn_no: String(prn_no || ''),
      serial_no: String(serial_no || ''),
      branch: String(branch || ''),
      degree_title: String(degree_title || ''),
      enrollment_year: String(enrollment_year || ''),
      year_of_passing: String(year_of_passing || ''),
      final_cgpi: String(final_cgpi || ''),
      classification: String(classification || ''),
      convocation_date: String(convocation_date || ''),
      certificate_id: certificateId
    }

    const sortedJson = JSON.stringify(degreeData, Object.keys(degreeData).sort())
    const dataHash = '0x' + crypto.createHash('sha256').update(sortedJson).digest('hex')
    console.log('[Degree Issue] Data Hash:', dataHash.substring(0, 20) + '...')

    // ── Register data hash on blockchain ─────────────────────────
    let tx_hash_data: string | null = null
    try {
      const { contract } = await getDegreeBlockchainContract()
      console.log('[Blockchain] Registering degree data hash on DegreeRegistry...')
      const tx = await contract.registerHash(dataHash)
      const receipt = await tx.wait()
      tx_hash_data = receipt.hash
      console.log('[Blockchain] ✓ Degree data hash stored! TX:', tx_hash_data)
    } catch (e: any) {
      console.error('[Blockchain] Failed to store degree data hash:', e)
      throw new Error('Failed to register degree data hash: ' + e.message)
    }

    // ── Verification URL & QR Code ───────────────────────────────
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const verificationUrl = `${baseUrl}/verify?cert=${certificateId}&hash=${dataHash}&tx=${tx_hash_data}&type=degree`
    const qrScanUrl = `${baseUrl}/verify?cert=${certificateId}&type=degree`

    const qrBuffer = await QRCode.toBuffer(qrScanUrl, {
      errorCorrectionLevel: 'L',
      type: 'png',
      width: 300,
      margin: 2
    })

    // ── Generate Degree Certificate PDF ──────────────────────────
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595.28, 841.89])
    const cw = 595.28
    const ch = 841.89

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const qrImage = await pdfDoc.embedPng(qrBuffer)

    const s = (v: any): string => String(v ?? '')
    const BLACK = rgb(0, 0, 0)
    const DARK = rgb(0.13, 0.13, 0.13)
    const LGREY = rgb(0.35, 0.35, 0.35)
    const BLUE = rgb(0.11, 0.30, 0.87)
    const WHITE = rgb(1, 1, 1)
    const GREEN = rgb(0.05, 0.50, 0.15)
    const GOLD = rgb(0.72, 0.53, 0.04)

    // White background + top accent
    page.drawRectangle({ x: 0, y: 0, width: cw, height: ch, color: WHITE })
    page.drawRectangle({ x: 0, y: ch - 10, width: cw, height: 10, color: GOLD })

    // Header
    const headerY = ch - 55
    page.drawText('AUTHBLOCK', { x: 40, y: headerY + 12, size: 28, font: fontBold, color: GOLD })
    page.drawText('Blockchain Certification Authority · Fr. Conceicao Rodrigues College of Engineering', {
      x: 40, y: headerY - 6, size: 9, font: fontReg, color: LGREY
    })
    page.drawRectangle({ x: 40, y: ch - 80, width: cw - 80, height: 1.5, color: GOLD })

    // Title
    page.drawText('FINAL DEGREE CERTIFICATE', { x: 40, y: ch - 102, size: 15, font: fontBold, color: BLACK })
    page.drawText('Degree — Cryptographically Secured on Ethereum (Sepolia)', {
      x: 40, y: ch - 120, size: 9, font: fontReg, color: LGREY
    })

    // Certificate ID band
    page.drawRectangle({ x: 40, y: ch - 152, width: cw - 80, height: 22, color: rgb(0.98, 0.96, 0.90) })
    page.drawRectangle({ x: 40, y: ch - 152, width: cw - 80, height: 22, borderColor: rgb(0.88, 0.80, 0.60), borderWidth: 0.8 })
    page.drawText('Certificate ID:', { x: 48, y: ch - 145, size: 9, font: fontBold, color: GOLD })
    page.drawText(certificateId, { x: 118, y: ch - 145, size: 9, font: fontBold, color: BLACK })

    // Student Information
    let yPos = ch - 183
    page.drawText('STUDENT INFORMATION', { x: 40, y: yPos, size: 11, font: fontBold, color: GOLD })
    page.drawRectangle({ x: 40, y: yPos - 4, width: cw - 80, height: 0.8, color: rgb(0.88, 0.80, 0.60) })
    yPos -= 22

    page.drawText('Full Name', { x: 40, y: yPos, size: 8, font: fontReg, color: LGREY })
    page.drawText('Serial No.', { x: 310, y: yPos, size: 8, font: fontReg, color: LGREY })
    yPos -= 13
    page.drawText(s(student_name), { x: 40, y: yPos, size: 13, font: fontBold, color: BLACK })
    page.drawText(s(serial_no) || '—', { x: 310, y: yPos, size: 13, font: fontBold, color: BLACK })
    yPos -= 22

    page.drawText('PRN Number', { x: 40, y: yPos, size: 8, font: fontReg, color: LGREY })
    page.drawText('Branch / Programme', { x: 310, y: yPos, size: 8, font: fontReg, color: LGREY })
    yPos -= 13
    page.drawText(s(prn_no), { x: 40, y: yPos, size: 13, font: fontBold, color: BLACK })
    page.drawText(s(branch), { x: 310, y: yPos, size: 13, font: fontBold, color: BLACK })
    yPos -= 28

    // Degree Details
    page.drawText('DEGREE DETAILS', { x: 40, y: yPos, size: 11, font: fontBold, color: GOLD })
    page.drawRectangle({ x: 40, y: yPos - 4, width: cw - 80, height: 0.8, color: rgb(0.88, 0.80, 0.60) })
    yPos -= 22

    page.drawText('Degree Title', { x: 40, y: yPos, size: 8, font: fontReg, color: LGREY })
    yPos -= 13
    page.drawText(s(degree_title), { x: 40, y: yPos, size: 14, font: fontBold, color: BLACK })
    yPos -= 22

    page.drawText('Enrollment Year', { x: 40, y: yPos, size: 8, font: fontReg, color: LGREY })
    page.drawText('Year of Passing', { x: 160, y: yPos, size: 8, font: fontReg, color: LGREY })
    page.drawText('Convocation Date', { x: 310, y: yPos, size: 8, font: fontReg, color: LGREY })
    yPos -= 13
    page.drawText(s(enrollment_year), { x: 40, y: yPos, size: 12, font: fontBold, color: BLACK })
    page.drawText(s(year_of_passing), { x: 160, y: yPos, size: 12, font: fontBold, color: BLACK })
    page.drawText(s(convocation_date) || '—', { x: 310, y: yPos, size: 12, font: fontBold, color: BLACK })
    yPos -= 28

    page.drawText('Final CGPI', { x: 40, y: yPos, size: 9, font: fontBold, color: LGREY })
    page.drawText('Classification', { x: 160, y: yPos, size: 9, font: fontBold, color: LGREY })
    yPos -= 18
    page.drawText(s(final_cgpi) || '—', { x: 40, y: yPos, size: 22, font: fontBold, color: GOLD })
    page.drawText(s(classification), { x: 160, y: yPos, size: 16, font: fontBold, color: GREEN })
    yPos -= 30

    // Blockchain Verification
    page.drawText('BLOCKCHAIN VERIFICATION', { x: 40, y: yPos, size: 11, font: fontBold, color: GOLD })
    page.drawRectangle({ x: 40, y: yPos - 4, width: cw - 80, height: 0.8, color: rgb(0.88, 0.80, 0.60) })
    yPos -= 22

    page.drawText('Issue Date', { x: 40, y: yPos, size: 8, font: fontReg, color: LGREY })
    yPos -= 13
    page.drawText(new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), {
      x: 40, y: yPos, size: 12, font: fontBold, color: BLACK
    })
    yPos -= 22

    page.drawText('Data Hash (SHA-256)', { x: 40, y: yPos, size: 8, font: fontReg, color: LGREY })
    yPos -= 13
    page.drawText(dataHash, { x: 40, y: yPos, size: 7.5, font: fontReg, color: DARK })
    yPos -= 18

    page.drawText('Transaction Hash (Sepolia)', { x: 40, y: yPos, size: 8, font: fontReg, color: LGREY })
    yPos -= 13
    page.drawText(tx_hash_data || 'N/A', { x: 40, y: yPos, size: 7.5, font: fontReg, color: DARK })
    yPos -= 20

    page.drawText('[OK] Degree Secured on Ethereum Blockchain (Sepolia)', {
      x: 40, y: yPos, size: 10, font: fontBold, color: GREEN
    })

    // QR Code
    const qrSize = 110
    const qrX = (cw - qrSize) / 2
    const qrY = 58
    page.drawRectangle({ x: 40, y: yPos - 8, width: cw - 80, height: 0.8, color: rgb(0.88, 0.80, 0.60) })
    page.drawText('SCAN TO VERIFY DEGREE AUTHENTICITY', {
      x: (cw - 170) / 2, y: qrY + qrSize + 10, size: 9, font: fontBold, color: GOLD
    })
    page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize })
    page.drawText('Scan QR code to verify this degree on the blockchain', {
      x: (cw - 230) / 2, y: qrY - 12, size: 8, font: fontReg, color: LGREY
    })

    // Footer
    page.drawRectangle({ x: 40, y: 30, width: cw - 80, height: 0.8, color: rgb(0.88, 0.80, 0.60) })
    page.drawText('This is a digitally signed blockchain certificate issued by Authblock.', {
      x: 40, y: 18, size: 7, font: fontReg, color: LGREY
    })
    page.drawText(`Verify at: ${baseUrl}/verify`, {
      x: (cw - 100) / 2, y: 8, size: 7, font: fontReg, color: GOLD
    })
    page.drawRectangle({ x: 0, y: 0, width: cw, height: 6, color: GOLD })

    const pdfBytes = await pdfDoc.save()
    console.log('[Degree Issue] PDF generated, size:', pdfBytes.length, 'bytes')

    // ── Generate PDF hash ────────────────────────────────────────
    const pdfHash = '0x' + crypto.createHash('sha256').update(pdfBytes).digest('hex')

    // ── Register PDF hash on blockchain ──────────────────────────
    let tx_hash_pdf: string | null = null
    try {
      const { contract } = await getDegreeBlockchainContract()
      console.log('[Blockchain] Registering degree PDF hash...')
      const tx = await contract.registerHash(pdfHash)
      const receipt = await tx.wait()
      tx_hash_pdf = receipt.hash
      console.log('[Blockchain] ✓ Degree PDF hash stored! TX:', tx_hash_pdf)
    } catch (e: any) {
      console.error('[Blockchain] Failed to store degree PDF hash:', e)
      throw new Error('Failed to register degree PDF hash: ' + e.message)
    }

    // ── Upload to S3 ─────────────────────────────────────────────
    const s3Key = `degrees/${certificateId}.pdf`
    const pdfUrl = await uploadToS3(s3Key, pdfBytes, 'application/pdf')
    console.log('[S3] ✓ Degree certificate uploaded:', pdfUrl)

    // ── Save to database ─────────────────────────────────────────
    // @ts-ignore
    const db = sql()

    // Auto-register student
    await db`
      INSERT INTO users (prn_no, full_name, student_email)
      VALUES (${prn_no}, ${student_name}, ${student_email || null})
      ON CONFLICT (prn_no) DO UPDATE 
      SET student_email = COALESCE(users.student_email, EXCLUDED.student_email)
    `

    const result = await db`
      INSERT INTO degrees (
        serial_no, student_name, prn_no, branch, degree_title,
        enrollment_year, year_of_passing, final_cgpi, classification, convocation_date,
        pdf_url, issued_by,
        pdf_hash, data_hash, tx_hash_pdf, tx_hash_data,
        certificate_id, verification_url, certificate_data
      ) VALUES (
        ${serial_no || null}, ${student_name}, ${prn_no}, ${branch || null}, ${degree_title},
        ${enrollment_year || null}, ${year_of_passing || null}, ${final_cgpi || null}, ${classification || null}, ${convocation_date || null},
        ${pdfUrl}, ${issued_by || null},
        ${pdfHash}, ${dataHash}, ${tx_hash_pdf}, ${tx_hash_data},
        ${certificateId}, ${verificationUrl}, ${JSON.stringify(degreeData)}
      )
      RETURNING id
    `

    const newId = result && result[0] ? result[0].id : null
    console.log('[Database] ✓ Saved to degrees table with ID:', newId)

    // Fire-and-forget email notification
    if (student_email) {
      publishIssuanceNotification({
        studentName: String(student_name),
        studentEmail: String(student_email),
        prnNo: String(prn_no),
        serialNo: String(serial_no || ''),
        examination: `Final Degree — ${degree_title}`,
        branch: String(branch || ''),
        session: String(year_of_passing || ''),
        sgpi: '',
        cgpi: String(final_cgpi || ''),
        remarks: String(classification || ''),
        marksheetUrl: pdfUrl,
        certificateUrl: pdfUrl,
        certificateId,
        verificationUrl,
        issueDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      }).catch(e => console.error('[Notify] Email notification failed:', e))
    }

    console.log('[Degree Issue] === DEGREE ISSUANCE COMPLETE ===\n')

    return NextResponse.json({
      success: true,
      id: newId,
      certificate: {
        id: certificateId,
        url: pdfUrl,
        data_hash: dataHash,
        pdf_hash: pdfHash,
        tx_data: tx_hash_data,
        tx_pdf: tx_hash_pdf,
        verification_url: verificationUrl
      }
    })

  } catch (err: any) {
    console.error('[degree-issue] ERROR:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
