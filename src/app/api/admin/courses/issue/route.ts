import { NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { uploadToS3 } from '@/lib/s3'
import { sql } from '@/lib/db'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import QRCode from 'qrcode'
import { getCourseBlockchainContract } from '@/lib/blockchain'
import { publishIssuanceNotification } from '@/lib/notifications'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      student_name, student_email, prn_no,
      course_name, course_type, duration, instructor_name,
      start_date, end_date, grade, description, issued_by
    } = body

    if (!student_name || !prn_no || !course_name) {
      return NextResponse.json({ error: 'Missing required course data (student_name, prn_no, course_name)' }, { status: 400 })
    }

    console.log('[Course Issue] === STARTING COURSE CERTIFICATE ISSUANCE ===')
    console.log('[Course Issue] Student:', student_name, 'Course:', course_name)

    // ── Generate unique certificate ID ───────────────────────────
    const timestamp = Date.now()
    const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase()
    const prnPart = prn_no.substring(prn_no.length - 4)
    const certificateId = `CRS-${prnPart}-${randomPart}-${timestamp.toString(36).toUpperCase()}`

    // ── Create data payload and hash ─────────────────────────────
    const courseData = {
      student_name: String(student_name || ''),
      prn_no: String(prn_no || ''),
      course_name: String(course_name || ''),
      course_type: String(course_type || ''),
      duration: String(duration || ''),
      instructor_name: String(instructor_name || ''),
      start_date: String(start_date || ''),
      end_date: String(end_date || ''),
      grade: String(grade || ''),
      certificate_id: certificateId
    }

    const sortedJson = JSON.stringify(courseData, Object.keys(courseData).sort())
    const dataHash = '0x' + crypto.createHash('sha256').update(sortedJson).digest('hex')
    console.log('[Course Issue] Data Hash:', dataHash.substring(0, 20) + '...')

    // ── Register data hash on blockchain ─────────────────────────
    let tx_hash_data: string | null = null
    try {
      const { contract } = await getCourseBlockchainContract()
      console.log('[Blockchain] Registering course data hash on CourseRegistry...')
      const tx = await contract.registerHash(dataHash)
      const receipt = await tx.wait()
      tx_hash_data = receipt.hash
      console.log('[Blockchain] ✓ Course data hash stored! TX:', tx_hash_data)
    } catch (e: any) {
      console.error('[Blockchain] Failed to store course data hash:', e)
      throw new Error('Failed to register course data hash: ' + e.message)
    }

    // ── Verification URL & QR Code ───────────────────────────────
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const verificationUrl = `${baseUrl}/verify?cert=${certificateId}&hash=${dataHash}&tx=${tx_hash_data}&type=course`
    const qrScanUrl = `${baseUrl}/verify?cert=${certificateId}&type=course`

    const qrBuffer = await QRCode.toBuffer(qrScanUrl, {
      errorCorrectionLevel: 'L',
      type: 'png',
      width: 300,
      margin: 2
    })

    // ── PART 1: FRCRCE CERTIFICATE (Template Overlay) ──────────────
    const templatePdfDoc = await PDFDocument.create()
    // Certificate template is landscape
    const tw = 841.89
    const th = 595.28
    const templatePage = templatePdfDoc.addPage([tw, th])

    const fontBoldT = await templatePdfDoc.embedFont(StandardFonts.TimesRomanBold)
    const fontRegT = await templatePdfDoc.embedFont(StandardFonts.TimesRoman)
    const fontItalicT = await templatePdfDoc.embedFont(StandardFonts.TimesRomanItalic)
    const qrImageTemplate = await templatePdfDoc.embedPng(qrBuffer)

    const s = (v: any): string => String(v ?? '')
    const BLACK = rgb(0, 0, 0)
    const DARK = rgb(0.15, 0.15, 0.15)

    // Load and draw FRCRCE_Certificate_Template.png
    const certTemplatePath = path.join(process.cwd(), 'public', 'FRCRCE_Certificate_Template.png')
    const certTemplateBytes = fs.readFileSync(certTemplatePath)
    const certTemplateImg = await templatePdfDoc.embedPng(certTemplateBytes)
    templatePage.drawImage(certTemplateImg, { x: 0, y: 0, width: tw, height: th })

    // ── Course template text overlay (canvas editor coordinates) ──────────

    // Student Name — centered, y=283, size=18
    const nameTextT = s(student_name)
    const nameWidthT = fontBoldT.widthOfTextAtSize(nameTextT, 18)
    templatePage.drawText(nameTextT, {
      x: (tw - nameWidthT) / 2, y: 283, size: 18, font: fontBoldT, color: BLACK
    })

    // Course Name — centered, y=244, size=14
    const courseText = s(course_name)
    const courseWidthT = fontBoldT.widthOfTextAtSize(courseText, 14)
    templatePage.drawText(courseText, {
      x: (tw - courseWidthT) / 2, y: 244, size: 14, font: fontBoldT, color: BLACK
    })

    // Date Range — "conducted from ___ to ___" — x=307, y=216, size=10
    if (start_date || end_date) {
      const dateRangeText = `${s(start_date) || '—'}  to  ${s(end_date) || '—'}`
      templatePage.drawText(dateRangeText, { x: 307, y: 216, size: 10, font: fontBoldT, color: BLACK })
    }

    // Duration — "with a total duration of ___" — x=415, y=194, size=10
    if (duration) {
      templatePage.drawText(s(duration) + ' Hours', { x: 415, y: 194, size: 10, font: fontBoldT, color: BLACK })
    }

    // Department — "The program was organized by ___" — x=385, y=172, size=9
    const deptText = s(instructor_name) || 'Department of Computer Engineering, FRCRCE'
    templatePage.drawText(deptText, { x: 385, y: 172, size: 9, font: fontBoldT, color: BLACK })

    // Grade — x=412, y=149, size=13
    if (grade) {
      templatePage.drawText(s(grade), { x: 412, y: 149, size: 13, font: fontBoldT, color: DARK })
    }

    // Issue Date — x=87, y=118, size=12
    const dateTextT = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    templatePage.drawText(dateTextT, { x: 87, y: 118, size: 12, font: fontBoldT, color: BLACK })

    // PRN / Serial No. — x=655, y=120, size=12
    templatePage.drawText(s(prn_no), { x: 655, y: 120, size: 12, font: fontBoldT, color: BLACK })

    // QR Code (small, bottom-right corner)
    templatePage.drawImage(qrImageTemplate, { x: tw - 82, y: 12, width: 48, height: 48 })

    const templatePdfBytes = await templatePdfDoc.save()
    console.log('[Course Issue] FRCRCE Template PDF generated, size:', templatePdfBytes.length, 'bytes')

    // ── PART 2: AUTHBLOCK VERIFICATION CERTIFICATE ───────────────
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595.28, 841.89])
    const cw = 595.28
    const ch = 841.89

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const qrImage = await pdfDoc.embedPng(qrBuffer)

    const LGREY = rgb(0.35, 0.35, 0.35)
    const WHITE = rgb(1, 1, 1)
    const GREEN = rgb(0.05, 0.50, 0.15)
    const TEAL = rgb(0.0, 0.46, 0.53)

    // White background
    page.drawRectangle({ x: 0, y: 0, width: cw, height: ch, color: WHITE })

    // Header
    const headerY = ch - 55
    page.drawText('AUTHBLOCK', { x: 40, y: headerY + 12, size: 28, font: fontBold, color: TEAL })
    page.drawText('Blockchain Certification Authority · Fr. Conceicao Rodrigues College of Engineering', {
      x: 40, y: headerY - 6, size: 9, font: fontReg, color: LGREY
    })
    page.drawRectangle({ x: 40, y: ch - 80, width: cw - 80, height: 1.5, color: TEAL })

    // Title
    const typeLabel = (course_type || 'course').toUpperCase()
    page.drawText(`${typeLabel} CERTIFICATE`, { x: 40, y: ch - 102, size: 15, font: fontBold, color: BLACK })
    page.drawText('Course Certificate — Cryptographically Secured on Ethereum (Sepolia)', {
      x: 40, y: ch - 120, size: 9, font: fontReg, color: LGREY
    })

    // Certificate ID band
    page.drawRectangle({ x: 40, y: ch - 152, width: cw - 80, height: 22, color: rgb(0.92, 0.98, 0.98) })
    page.drawRectangle({ x: 40, y: ch - 152, width: cw - 80, height: 22, borderColor: rgb(0.70, 0.90, 0.90), borderWidth: 0.8 })
    page.drawText('Certificate ID:', { x: 48, y: ch - 145, size: 9, font: fontBold, color: TEAL })
    page.drawText(certificateId, { x: 118, y: ch - 145, size: 9, font: fontBold, color: BLACK })

    // Participant Information
    let yPos = ch - 183
    page.drawText('PARTICIPANT INFORMATION', { x: 40, y: yPos, size: 11, font: fontBold, color: TEAL })
    page.drawRectangle({ x: 40, y: yPos - 4, width: cw - 80, height: 0.8, color: rgb(0.70, 0.90, 0.90) })
    yPos -= 22

    page.drawText('Full Name', { x: 40, y: yPos, size: 8, font: fontReg, color: LGREY })
    page.drawText('PRN Number', { x: 310, y: yPos, size: 8, font: fontReg, color: LGREY })
    yPos -= 13
    page.drawText(s(student_name), { x: 40, y: yPos, size: 13, font: fontBold, color: BLACK })
    page.drawText(s(prn_no), { x: 310, y: yPos, size: 13, font: fontBold, color: BLACK })
    yPos -= 28

    // Course Details
    page.drawText('COURSE DETAILS', { x: 40, y: yPos, size: 11, font: fontBold, color: TEAL })
    page.drawRectangle({ x: 40, y: yPos - 4, width: cw - 80, height: 0.8, color: rgb(0.70, 0.90, 0.90) })
    yPos -= 22

    page.drawText('Course Name', { x: 40, y: yPos, size: 8, font: fontReg, color: LGREY })
    yPos -= 13
    page.drawText(s(course_name), { x: 40, y: yPos, size: 14, font: fontBold, color: BLACK })
    yPos -= 22

    page.drawText('Type', { x: 40, y: yPos, size: 8, font: fontReg, color: LGREY })
    page.drawText('Duration', { x: 160, y: yPos, size: 8, font: fontReg, color: LGREY })
    page.drawText('Instructor', { x: 310, y: yPos, size: 8, font: fontReg, color: LGREY })
    yPos -= 13
    page.drawText(s(course_type), { x: 40, y: yPos, size: 12, font: fontBold, color: BLACK })
    page.drawText(s(duration), { x: 160, y: yPos, size: 12, font: fontBold, color: BLACK })
    page.drawText(s(instructor_name) || '—', { x: 310, y: yPos, size: 12, font: fontBold, color: BLACK })
    yPos -= 22

    page.drawText('Start Date', { x: 40, y: yPos, size: 8, font: fontReg, color: LGREY })
    page.drawText('End Date', { x: 160, y: yPos, size: 8, font: fontReg, color: LGREY })
    page.drawText('Grade / Result', { x: 310, y: yPos, size: 8, font: fontReg, color: LGREY })
    yPos -= 13
    page.drawText(s(start_date) || '—', { x: 40, y: yPos, size: 12, font: fontBold, color: BLACK })
    page.drawText(s(end_date) || '—', { x: 160, y: yPos, size: 12, font: fontBold, color: BLACK })
    page.drawText(s(grade) || '—', { x: 310, y: yPos, size: 16, font: fontBold, color: GREEN })
    yPos -= 22

    if (description) {
      page.drawText('Description', { x: 40, y: yPos, size: 8, font: fontReg, color: LGREY })
      yPos -= 13
      const descText = String(description).substring(0, 200)
      page.drawText(descText, { x: 40, y: yPos, size: 9, font: fontReg, color: DARK })
      yPos -= 22
    }

    yPos -= 8

    // Blockchain Verification
    page.drawText('BLOCKCHAIN VERIFICATION', { x: 40, y: yPos, size: 11, font: fontBold, color: TEAL })
    page.drawRectangle({ x: 40, y: yPos - 4, width: cw - 80, height: 0.8, color: rgb(0.70, 0.90, 0.90) })
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

    page.drawText('[OK] Course Certificate Secured on Ethereum Blockchain (Sepolia)', {
      x: 40, y: yPos, size: 10, font: fontBold, color: GREEN
    })

    // QR Code
    const qrSize = 110
    const qrX = (cw - qrSize) / 2
    const qrY = 58
    page.drawRectangle({ x: 40, y: yPos - 8, width: cw - 80, height: 0.8, color: rgb(0.70, 0.90, 0.90) })
    page.drawText('SCAN TO VERIFY CERTIFICATE AUTHENTICITY', {
      x: (cw - 180) / 2, y: qrY + qrSize + 10, size: 9, font: fontBold, color: TEAL
    })
    page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize })
    page.drawText('Scan QR code to verify this certificate on the blockchain', {
      x: (cw - 240) / 2, y: qrY - 12, size: 8, font: fontReg, color: LGREY
    })

    // Footer
    page.drawRectangle({ x: 40, y: 30, width: cw - 80, height: 0.8, color: rgb(0.70, 0.90, 0.90) })
    page.drawText('This is a digitally signed blockchain certificate issued by Authblock.', {
      x: 40, y: 18, size: 7, font: fontReg, color: LGREY
    })
    page.drawText(`Verify at: ${baseUrl}/verify`, {
      x: (cw - 100) / 2, y: 8, size: 7, font: fontReg, color: TEAL
    })

    const pdfBytes = await pdfDoc.save()
    console.log('[Course Issue] AuthBlock cert PDF generated, size:', pdfBytes.length, 'bytes')

    // ── Generate PDF hashes ──────────────────────────────
    const templateHash = '0x' + crypto.createHash('sha256').update(templatePdfBytes).digest('hex')
    const pdfHash = '0x' + crypto.createHash('sha256').update(pdfBytes).digest('hex')
    console.log('[Course Issue] Template cert hash:', templateHash.substring(0, 20) + '...')
    console.log('[Course Issue] AuthBlock cert hash:', pdfHash.substring(0, 20) + '...')

    // ── Register TEMPLATE PDF hash on blockchain (user uploads this) ──
    let tx_hash_pdf: string | null = null
    try {
      const { contract } = await getCourseBlockchainContract()
      console.log('[Blockchain] Registering course template PDF hash...')
      const tx = await contract.registerHash(templateHash)
      const receipt = await tx.wait()
      tx_hash_pdf = receipt.hash
      console.log('[Blockchain] ✓ Course template hash stored! TX:', tx_hash_pdf)
    } catch (e: any) {
      console.error('[Blockchain] Failed to store course PDF hash:', e)
      throw new Error('Failed to register course PDF hash: ' + e.message)
    }

    // ── Upload BOTH PDFs to S3 ───────────────────────────────────
    const [templateUrl, certUrl] = await Promise.all([
      uploadToS3(`courses/${certificateId}-certificate.pdf`, templatePdfBytes, 'application/pdf'),
      uploadToS3(`courses/${certificateId}-authblock.pdf`, pdfBytes, 'application/pdf'),
    ])
    console.log('[S3] ✓ FRCRCE template certificate:', templateUrl)
    console.log('[S3] ✓ AuthBlock verification cert:', certUrl)

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
      INSERT INTO courses (
        student_name, prn_no, course_name, course_type, duration,
        instructor_name, start_date, end_date, grade, description,
        pdf_url, issued_by,
        pdf_hash, data_hash, tx_hash_pdf, tx_hash_data,
        certificate_id, verification_url, certificate_data
      ) VALUES (
        ${student_name}, ${prn_no}, ${course_name}, ${course_type || null}, ${duration || null},
        ${instructor_name || null}, ${start_date || null}, ${end_date || null}, ${grade || null}, ${description || null},
        ${templateUrl}, ${issued_by || null},
        ${templateHash}, ${dataHash}, ${tx_hash_pdf}, ${tx_hash_data},
        ${certificateId}, ${verificationUrl}, ${JSON.stringify(courseData)}
      )
      RETURNING id
    `

    const newId = result && result[0] ? result[0].id : null
    console.log('[Database] ✓ Saved to courses table with ID:', newId)

    // Fire-and-forget email notification
    if (student_email) {
      publishIssuanceNotification({
        studentName: String(student_name),
        studentEmail: String(student_email),
        prnNo: String(prn_no),
        serialNo: '',
        examination: `${course_type || 'Course'} — ${course_name}`,
        branch: '',
        session: String(end_date || ''),
        sgpi: '',
        cgpi: '',
        remarks: String(grade || ''),
        marksheetUrl: templateUrl,
        certificateUrl: certUrl,
        certificateId,
        verificationUrl,
        issueDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      }).catch(e => console.error('[Notify] Email notification failed:', e))
    }

    console.log('[Course Issue] === COURSE ISSUANCE COMPLETE ===\n')

    return NextResponse.json({
      success: true,
      id: newId,
      certificate: {
        id: certificateId,
        url: certUrl,
        template_url: templateUrl,
        data_hash: dataHash,
        pdf_hash: pdfHash,
        tx_data: tx_hash_data,
        tx_pdf: tx_hash_pdf,
        verification_url: verificationUrl
      }
    })

  } catch (err: any) {
    console.error('[course-issue] ERROR:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
