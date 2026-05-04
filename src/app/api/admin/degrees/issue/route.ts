import { NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { uploadToS3 } from '@/lib/s3'
import { sql } from '@/lib/db'
import fs from 'fs'
import path from 'path'
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

    // ── PART 1: DEGREE PDF (Template Overlay) ─────────────────────
    const degreePdfDoc = await PDFDocument.create()
    const dw = 841.89
    const dh = 595.28
    const degreePage = degreePdfDoc.addPage([dw, dh])

    // Use Times Roman to match the template's serif font
    const fontBold = await degreePdfDoc.embedFont(StandardFonts.TimesRomanBold)
    const fontReg = await degreePdfDoc.embedFont(StandardFonts.TimesRoman)
    const fontItalic = await degreePdfDoc.embedFont(StandardFonts.TimesRomanItalic)
    const qrImageDeg = await degreePdfDoc.embedPng(qrBuffer)

    const s = (v: any): string => String(v ?? '')
    const BLACK = rgb(0, 0, 0)
    const DARK = rgb(0.15, 0.15, 0.15)

    // Load and draw template
    const templatePath = path.join(process.cwd(), 'public', 'FRCRCE_Degree_Template.png')
    const templateBytes = fs.readFileSync(templatePath)
    const templateImg = await degreePdfDoc.embedPng(templateBytes)
    degreePage.drawImage(templateImg, { x: 0, y: 0, width: dw, height: dh })

    // Student name - on blank line after "This is to certify that"
    const nameText = s(student_name).toUpperCase()
    const nameWidth = fontBold.widthOfTextAtSize(nameText, 15)
    degreePage.drawText(nameText, {
      x: (dw - nameWidth) / 2, y: 350, size: 15, font: fontBold, color: BLACK
    })

    // Degree title - on blank line after "has been awarded the Degree of"
    const degreeText = s(degree_title)
    const degreeWidth = fontBold.widthOfTextAtSize(degreeText, 14)
    degreePage.drawText(degreeText, {
      x: (dw - degreeWidth) / 2, y: 268, size: 14, font: fontBold, color: BLACK
    })

    // Branch - on blank line after "in the Faculty of"
    const branchText = s(branch)
    const branchWidth = fontBold.widthOfTextAtSize(branchText, 13)
    degreePage.drawText(branchText, {
      x: (dw - branchWidth) / 2, y: 218, size: 13, font: fontBold, color: BLACK
    })

    // Classification + CGPI - below "having successfully completed..."
    if (classification || final_cgpi) {
      const classText = `${s(classification)}${final_cgpi ? '  -  CGPI: ' + s(final_cgpi) : ''}`
      const classWidth = fontItalic.widthOfTextAtSize(classText, 10)
      degreePage.drawText(classText, {
        x: (dw - classWidth) / 2, y: 168, size: 10, font: fontItalic, color: DARK
      })
    }

    // Date (bottom-left)
    const dateText = s(convocation_date) || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    degreePage.drawText(dateText, { x: 110, y: 68, size: 9, font: fontBold, color: BLACK })

    // Sr. No. (bottom-right)
    degreePage.drawText(s(serial_no), { x: 665, y: 68, size: 9, font: fontBold, color: BLACK })

    // QR Code (small, bottom-right corner)
    degreePage.drawImage(qrImageDeg, { x: dw - 95, y: 42, width: 50, height: 50 })

    const degreePdfBytes = await degreePdfDoc.save()
    console.log('[Degree Issue] Degree PDF generated, size:', degreePdfBytes.length, 'bytes')

    // ============================================================
    // PAGE 2: BLOCKCHAIN VERIFICATION CERTIFICATE
    // ============================================================
    const certPage = pdfDoc.addPage([595.28, 841.89])
    const cw = 595.28
    const ch = 841.89

    const LGREY = rgb(0.4, 0.4, 0.4)
    const BLUE = rgb(0.09, 0.39, 0.93)
    const WHITE = rgb(1, 1, 1)

    certPage.drawRectangle({ x: 0, y: 0, width: cw, height: ch, color: WHITE })
    certPage.drawRectangle({ x: 0, y: ch - 8, width: cw, height: 8, color: BLUE })

    // Header
    certPage.drawText('AUTHBLOCK', { x: 40, y: ch - 50, size: 26, font: fontBold, color: BLUE })
    certPage.drawText('Blockchain Certification Authority · Fr. Conceicao Rodrigues College of Engineering', {
      x: 40, y: ch - 66, size: 8.5, font: fontReg, color: LGREY
    })
    certPage.drawRectangle({ x: 40, y: ch - 80, width: cw - 80, height: 1, color: rgb(0.85, 0.90, 1) })

    // Title
    certPage.drawText('BLOCKCHAIN VERIFICATION CERTIFICATE', { x: 40, y: ch - 104, size: 14, font: fontBold, color: BLACK })
    certPage.drawText('Degree — Cryptographically Secured on Ethereum (Sepolia)', {
      x: 40, y: ch - 120, size: 8.5, font: fontReg, color: LGREY
    })

    // Certificate ID band
    certPage.drawRectangle({ x: 40, y: ch - 148, width: cw - 80, height: 20, color: rgb(0.95, 0.97, 1) })
    certPage.drawRectangle({ x: 40, y: ch - 148, width: cw - 80, height: 20, borderColor: rgb(0.85, 0.90, 1), borderWidth: 0.8 })
    certPage.drawText('Certificate ID:', { x: 48, y: ch - 142, size: 8.5, font: fontBold, color: BLUE })
    certPage.drawText(certificateId, { x: 118, y: ch - 142, size: 8.5, font: fontBold, color: DARK })

    // Student Information
    let yPos = ch - 178
    certPage.drawText('STUDENT INFORMATION', { x: 40, y: yPos, size: 10, font: fontBold, color: BLUE })
    certPage.drawRectangle({ x: 40, y: yPos - 4, width: cw - 80, height: 0.6, color: rgb(0.85, 0.90, 1) })
    yPos -= 20

    certPage.drawText('Full Name', { x: 40, y: yPos, size: 7.5, font: fontReg, color: LGREY })
    certPage.drawText('Serial No.', { x: 320, y: yPos, size: 7.5, font: fontReg, color: LGREY })
    yPos -= 13
    certPage.drawText(s(student_name), { x: 40, y: yPos, size: 12, font: fontBold, color: BLACK })
    certPage.drawText(s(serial_no) || '—', { x: 320, y: yPos, size: 12, font: fontBold, color: BLACK })
    yPos -= 20

    certPage.drawText('PRN Number', { x: 40, y: yPos, size: 7.5, font: fontReg, color: LGREY })
    certPage.drawText('Branch / Programme', { x: 320, y: yPos, size: 7.5, font: fontReg, color: LGREY })
    yPos -= 13
    certPage.drawText(s(prn_no), { x: 40, y: yPos, size: 12, font: fontBold, color: BLACK })
    certPage.drawText(s(branch), { x: 320, y: yPos, size: 12, font: fontBold, color: BLACK })
    yPos -= 26

    // Degree Details
    certPage.drawText('DEGREE DETAILS', { x: 40, y: yPos, size: 10, font: fontBold, color: BLUE })
    certPage.drawRectangle({ x: 40, y: yPos - 4, width: cw - 80, height: 0.6, color: rgb(0.85, 0.90, 1) })
    yPos -= 20

    certPage.drawText('Degree Title', { x: 40, y: yPos, size: 7.5, font: fontReg, color: LGREY })
    yPos -= 13
    certPage.drawText(s(degree_title), { x: 40, y: yPos, size: 13, font: fontBold, color: BLACK })
    yPos -= 20

    certPage.drawText('Enrollment Year', { x: 40, y: yPos, size: 7.5, font: fontReg, color: LGREY })
    certPage.drawText('Year of Passing', { x: 170, y: yPos, size: 7.5, font: fontReg, color: LGREY })
    certPage.drawText('Convocation Date', { x: 320, y: yPos, size: 7.5, font: fontReg, color: LGREY })
    yPos -= 13
    certPage.drawText(s(enrollment_year), { x: 40, y: yPos, size: 11, font: fontBold, color: BLACK })
    certPage.drawText(s(year_of_passing), { x: 170, y: yPos, size: 11, font: fontBold, color: BLACK })
    certPage.drawText(s(convocation_date) || '—', { x: 320, y: yPos, size: 11, font: fontBold, color: BLACK })
    yPos -= 24

    certPage.drawText('Final CGPI', { x: 40, y: yPos, size: 8, font: fontBold, color: LGREY })
    certPage.drawText('Classification', { x: 170, y: yPos, size: 8, font: fontBold, color: LGREY })
    yPos -= 16
    certPage.drawText(s(final_cgpi) || '—', { x: 40, y: yPos, size: 20, font: fontBold, color: BLUE })
    certPage.drawText(s(classification), { x: 170, y: yPos, size: 14, font: fontBold, color: DARK })
    yPos -= 28

    // Blockchain Verification
    certPage.drawText('BLOCKCHAIN VERIFICATION', { x: 40, y: yPos, size: 10, font: fontBold, color: BLUE })
    certPage.drawRectangle({ x: 40, y: yPos - 4, width: cw - 80, height: 0.6, color: rgb(0.85, 0.90, 1) })
    yPos -= 20

    certPage.drawText('Issue Date', { x: 40, y: yPos, size: 7.5, font: fontReg, color: LGREY })
    yPos -= 13
    certPage.drawText(new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), {
      x: 40, y: yPos, size: 11, font: fontBold, color: BLACK
    })
    yPos -= 20

    certPage.drawText('Data Hash (SHA-256)', { x: 40, y: yPos, size: 7.5, font: fontReg, color: LGREY })
    yPos -= 12
    certPage.drawText(dataHash, { x: 40, y: yPos, size: 7, font: fontReg, color: DARK })
    yPos -= 16

    certPage.drawText('Transaction Hash (Sepolia)', { x: 40, y: yPos, size: 7.5, font: fontReg, color: LGREY })
    yPos -= 12
    certPage.drawText(tx_hash_data || 'N/A', { x: 40, y: yPos, size: 7, font: fontReg, color: DARK })
    yPos -= 18

    certPage.drawText('[OK] Degree Secured on Ethereum Blockchain (Sepolia)', {
      x: 40, y: yPos, size: 9, font: fontBold, color: BLUE
    })

    // QR Code on verification page
    const qrSize = 105
    const qrX = (cw - qrSize) / 2
    const qrY = 55
    certPage.drawRectangle({ x: 40, y: yPos - 8, width: cw - 80, height: 0.6, color: rgb(0.85, 0.90, 1) })
    certPage.drawText('SCAN TO VERIFY DEGREE AUTHENTICITY', {
      x: (cw - 170) / 2, y: qrY + qrSize + 10, size: 8.5, font: fontBold, color: BLUE
    })
    certPage.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize })
    certPage.drawText('Scan QR code to verify this degree on the blockchain', {
      x: (cw - 225) / 2, y: qrY - 12, size: 7.5, font: fontReg, color: LGREY
    })

    // Footer
    certPage.drawRectangle({ x: 40, y: 30, width: cw - 80, height: 0.6, color: rgb(0.85, 0.90, 1) })
    certPage.drawText('This is a digitally signed blockchain certificate issued by Authblock.', {
      x: 40, y: 18, size: 7, font: fontReg, color: LGREY
    })
    certPage.drawText(`Verify at: ${baseUrl}/verify`, {
      x: (cw - 100) / 2, y: 8, size: 7, font: fontReg, color: BLUE
    })
    certPage.drawRectangle({ x: 0, y: 0, width: cw, height: 5, color: BLUE })

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
