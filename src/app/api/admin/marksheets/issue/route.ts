import { NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { uploadToS3 } from '@/lib/s3'
import { sql } from '@/lib/db'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import QRCode from 'qrcode'
import { getBlockchainContract } from '@/lib/blockchain'
import {
  createCertificateData,
  generateMarksheetCoordinateHash,
  type MarksheetCoordinateMap,
  type CertificateData
} from '@/lib/certificate'
import { sendIssuanceEmail } from '@/lib/notifications'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      serial_no, student_name, student_email, prn_no, examination, branch, session_name, sgpi, cgpi, date, remarks, subjects, issued_by
    } = body

    if (!student_name || !prn_no || !serial_no) {
      return NextResponse.json({ error: 'Missing required student data' }, { status: 400 })
    }

    console.log('[Issue] === STARTING DUAL ISSUANCE (Marksheet + Certificate) ===')
    console.log('[Issue] Student:', student_name, 'PRN:', prn_no)

    // ============================================================
    // PART 1: GENERATE MARKSHEET PDF (with coordinate tracking)
    // ============================================================
    console.log('\n[Marksheet] Generating marksheet PDF...')

    const pdfDoc = await PDFDocument.create()
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)

    // Standard A4
    const width = 595.28
    const height = 841.89
    const page = pdfDoc.addPage([width, height])

    // Load Template Image
    const templatePath = path.join(process.cwd(), 'public', 'FRCRCE_Marksheet_Template.png')
    const imgBytes = fs.readFileSync(templatePath)
    const img = await pdfDoc.embedPng(imgBytes)

    page.drawImage(img, { x: 0, y: 0, width, height })

    // ── Coordinate mapping collector ───────────────────────────────────────────
    // Tracks the critical semantic fields drawn on the marksheet for hashing.
    const coordinateMap: MarksheetCoordinateMap[] = []

    const drawPoint = (text: any, x: number, y: number, isBold = true, size = 10) => {
      page.drawText(String(text ?? ''), { x, y, size, font: isBold ? font : fontRegular, color: rgb(0, 0, 0) })
    }

    // Helper that draws AND records semantic coordinate entry
    const drawAndTrack = (field: string, text: any, x: number, y: number, isBold = true, size = 10) => {
      const str = String(text ?? '')
      drawPoint(str, x, y, isBold, size)
      coordinateMap.push({ field, x, y, value: str })
    }

    // ── Draw & track critical, semantically labelled fields ───────────────────
    drawAndTrack('Serial No.',   serial_no,    440, 685, true, 11)
    drawAndTrack('Full Name',    student_name, 150, 647, true, 11)
    drawAndTrack('Examination',  examination,  150, 630, true, 11)
    drawAndTrack('Branch',       branch,       150, 612, true, 11)
    drawAndTrack('Session',      session_name, 150, 595, true, 11)
    drawAndTrack('PRN Number',   prn_no,       150, 580, true, 11)

    // Subjects — drawn but NOT tracked in the semantic coordinate map per plan
    let currentY = 485
    for (const sub of subjects || []) {
      drawPoint(sub.code,  90,  currentY, false, 9)
      drawPoint(sub.title, 145, currentY, true,  9)
      drawPoint(sub.credits, 368, currentY, true, 9)
      drawPoint(sub.grade,   398, currentY, true, 9)
      drawPoint(sub.gp,      430, currentY, true, 9)
      const cp = sub.grade === 'F' ? '0' : sub.credits
      drawPoint(cp === '--' ? '--' : cp, 470, currentY, true, 9)
      drawPoint(sub.cpgp, 510, currentY, true, 9)
      currentY -= 20
    }

    // Totals
    const totalCredits = (subjects || []).reduce((acc: number, s: any) => acc + parseInt(s.credits === '--' ? '0' : (s.credits || '0')), 0)
    const totalGp      = (subjects || []).reduce((acc: number, s: any) => acc + parseInt(s.gp === '--' ? '0' : (s.gp || '0')), 0)
    const totalCp      = (subjects || []).reduce((acc: number, s: any) => acc + (s.grade === 'F' || s.credits === '--' ? 0 : parseInt(s.credits || '0')), 0)
    const totalCpGp    = (subjects || []).reduce((acc: number, s: any) => acc + parseInt(s.cpgp === '--' ? '0' : (s.cpgp || '0')), 0)

    drawPoint(totalCredits.toString(), 365, 140, true, 10)
    drawPoint(totalGp.toString(),      395, 140, true, 10)
    drawPoint(totalCp.toString(),      470, 140, true, 10)
    drawPoint(totalCpGp.toString(),    507, 140, true, 10)

    // Track the summary results row
    drawAndTrack('Remarks', remarks || 'SUCCESSFUL', 130, 118, true, 10)
    drawAndTrack('SGPI',    sgpi,                    277, 118, true, 10)
    drawAndTrack('CGPI',    cgpi,                    335, 118, true, 10)
    drawPoint(date, 130, 100, true, 10)

    console.log('[Marksheet] Coordinate map collected:', coordinateMap.length, 'fields')
    console.log('[Marksheet] Coordinate map:', JSON.stringify(coordinateMap, null, 2))

    // ── Generate marksheet coordinate hash (data_hash) ─────────────────────
    const marksheetDataHash = generateMarksheetCoordinateHash(coordinateMap)
    console.log('[Marksheet] Coordinate Hash (data_hash):', marksheetDataHash.substring(0, 20) + '...')

    // ── Finalise marksheet PDF bytes (before QR, so hash is over clean data) ─
    const marksheetPdfBytes = await pdfDoc.save()
    const marksheetFileName = `${prn_no}_${Date.now()}.pdf`
    console.log('[Marksheet] PDF generated, size:', marksheetPdfBytes.length, 'bytes')

    // ── Generate marksheet PDF hash (pdf_hash) ─────────────────────────────
    const marksheetPdfHash = '0x' + crypto.createHash('sha256').update(marksheetPdfBytes).digest('hex')
    console.log('[Marksheet] PDF Hash (pdf_hash):', marksheetPdfHash.substring(0, 20) + '...')

    // ============================================================
    // PART 2: REGISTER MARKSHEET DATA HASH ON BLOCKCHAIN (tx_hash_data)
    // ============================================================
    let tx_hash_data: string | null = null
    try {
      const { contract } = await getBlockchainContract()
      console.log('[Blockchain] Registering marksheet coordinate data hash...')
      const txData = await contract.registerHash(marksheetDataHash)
      const recData = await txData.wait()
      tx_hash_data = recData.hash
      console.log('[Blockchain] ✓ Marksheet data hash stored! TX:', tx_hash_data)
    } catch (e: any) {
      console.error('[Blockchain] Failed to store marksheet data hash:', e)
      throw new Error('Failed to register marksheet data hash: ' + e.message)
    }

    // ============================================================
    // PART 3: REGISTER MARKSHEET PDF HASH ON BLOCKCHAIN (tx_hash_pdf)
    // ============================================================
    let tx_hash_pdf: string | null = null
    try {
      const { contract } = await getBlockchainContract()
      console.log('[Blockchain] Registering marksheet PDF hash...')
      const txPdf = await contract.registerHash(marksheetPdfHash)
      const recPdf = await txPdf.wait()
      tx_hash_pdf = recPdf.hash
      console.log('[Blockchain] ✓ Marksheet PDF hash stored! TX:', tx_hash_pdf)
    } catch (e: any) {
      console.error('[Blockchain] Failed to store marksheet PDF hash:', e)
      throw new Error('Failed to register marksheet PDF hash: ' + e.message)
    }

    // ============================================================
    // PART 4: CREATE VERIFICATION URL & QR CODE
    // (verification URL uses the marksheet data hash)
    // ============================================================
    const extractedData = {
      name: String(student_name || ''),
      prn_no: String(prn_no || ''),
      serial_no: String(serial_no || ''),
      examination: String(examination || ''),
      branch: String(branch || ''),
      session: String(session_name || ''),
      sgpi: String(sgpi || ''),
      cgpi: String(cgpi || ''),
      remarks: String(remarks || 'SUCCESSFUL'),
      totals: {
        credits: totalCredits.toString(),
        gp: totalGp.toString(),
        cp: totalCp.toString(),
        cpgp: totalCpGp.toString()
      }
    }

    const certificateData: CertificateData = createCertificateData(extractedData)
    // Attach the marksheet hashes to certificate metadata
    certificateData.blockchain_hash = marksheetDataHash

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const verificationUrl = `${baseUrl}/verify?cert=${certificateData.certificate_id}&hash=${marksheetDataHash}&tx=${tx_hash_data}`
    const qrScanUrl       = `${baseUrl}/verify?cert=${certificateData.certificate_id}`
    certificateData.verification_url = verificationUrl
    console.log('[Certificate] Verification URL created (references marksheet hashes)')

    // Generate QR Code
    const qrBuffer = await QRCode.toBuffer(qrScanUrl, {
      errorCorrectionLevel: 'L',
      type: 'png',
      width: 300,
      margin: 2
    })

    // ============================================================
    // PART 5: GENERATE AUTHBLOCK CERTIFICATE PDF WITH QR CODE
    // (Authblock cert lists marksheet hashes — no new blockchain tx)
    // ============================================================
    // ============================================================
    // PART 5: GENERATE FRCRCE CERTIFICATE PDF USING TEMPLATE
    // Uses FRCRCE_Certificate_Template.png as background
    // ============================================================
    const certPdfDoc = await PDFDocument.create()
    const certPage   = certPdfDoc.addPage([595.28, 841.89])
    const cw = 595.28
    const ch = 841.89

    const fontBold = await certPdfDoc.embedFont(StandardFonts.HelveticaBold)
    const fontReg  = await certPdfDoc.embedFont(StandardFonts.Helvetica)
    const qrImage  = await certPdfDoc.embedPng(qrBuffer)

    const s = (v: any): string => String(v ?? '')

    const BLACK = rgb(0,    0,    0)
    const DARK  = rgb(0.13, 0.13, 0.13)
    const LGREY = rgb(0.35, 0.35, 0.35)
    const BLUE  = rgb(0.11, 0.30, 0.87)
    const WHITE = rgb(1,    1,    1)
    const GREEN = rgb(0.05, 0.50, 0.15)
    const RED   = rgb(0.70, 0.05, 0.05)

    // ── Embed & draw FRCRCE Certificate Template as background ──
    const certTemplatePath = path.join(process.cwd(), 'public', 'FRCRCE_Certificate_Template.png')
    const certTemplateBytes = fs.readFileSync(certTemplatePath)
    const certTemplateImg   = await certPdfDoc.embedPng(certTemplateBytes)
    certPage.drawImage(certTemplateImg, { x: 0, y: 0, width: cw, height: ch })

    // ── Overlay student details on the template ──────────────────
    // Adjust x/y coordinates to match your template layout
    // Student Name — centered, large
    const nameText = s(student_name).toUpperCase()
    const nameFontSize = 18
    const nameWidth = fontBold.widthOfTextAtSize(nameText, nameFontSize)
    certPage.drawText(nameText, {
      x: (cw - nameWidth) / 2,
      y: ch - 370,
      size: nameFontSize,
      font: fontBold,
      color: BLACK,
    })

    // Branch
    const branchText = s(branch)
    const branchFontSize = 13
    const branchWidth = fontBold.widthOfTextAtSize(branchText, branchFontSize)
    certPage.drawText(branchText, {
      x: (cw - branchWidth) / 2,
      y: ch - 405,
      size: branchFontSize,
      font: fontBold,
      color: DARK,
    })

    // Result / Remarks
    const remarksText = s(remarks || 'SUCCESSFUL')
    const isPass = remarksText.toUpperCase().includes('PASS') || remarksText.toUpperCase().includes('SUCCESS')
    const remarksWidth = fontBold.widthOfTextAtSize(remarksText, 12)
    certPage.drawText(remarksText, {
      x: (cw - remarksWidth) / 2,
      y: ch - 435,
      size: 12,
      font: fontBold,
      color: isPass ? GREEN : RED,
    })

    // SGPI & CGPI
    certPage.drawText(`SGPI: ${s(sgpi)}   CGPI: ${s(cgpi)}`, {
      x: (cw - 120) / 2,
      y: ch - 458,
      size: 11,
      font: fontBold,
      color: BLUE,
    })

    // Serial No (bottom left area)
    certPage.drawText(`Serial No: ${s(serial_no)}`, {
      x: 60,
      y: 90,
      size: 9,
      font: fontReg,
      color: LGREY,
    })

    // PRN (bottom left)
    certPage.drawText(`PRN: ${s(prn_no)}`, {
      x: 60,
      y: 76,
      size: 9,
      font: fontReg,
      color: LGREY,
    })

    // Data hash (small, below serial)
    certPage.drawText(`Hash: ${marksheetDataHash.substring(0, 32)}...`, {
      x: 60,
      y: 62,
      size: 7,
      font: fontReg,
      color: LGREY,
    })

    // ── QR Code (bottom right) ───────────────────────────────────
    const qrSize = 90
    certPage.drawImage(qrImage, {
      x: cw - qrSize - 55,
      y: 52,
      width: qrSize,
      height: qrSize,
    })
    certPage.drawText('Scan to Verify', {
      x: cw - qrSize - 30,
      y: 44,
      size: 7,
      font: fontReg,
      color: LGREY,
    })

    const certPdfBytes = await certPdfDoc.save()
    console.log('[Certificate] FRCRCE Certificate PDF generated, size:', certPdfBytes.length, 'bytes')


    // ============================================================
    // PART 6: UPLOAD AUTHBLOCK CERTIFICATE TO AWS S3
    // ============================================================
    const certS3Key = `certificates/${certificateData.certificate_id}.pdf`
    console.log('[S3] Uploading certificate to authblock-docs/certificates/...')

    const certPdfUrl = await uploadToS3(certS3Key, certPdfBytes, 'application/pdf')
    console.log('[S3] ✓ Certificate uploaded:', certPdfUrl)

    // ============================================================
    // PART 7: UPLOAD MARKSHEET TO AWS S3
    // ============================================================
    console.log('\n[S3] Uploading marksheet to authblock-docs/marksheets/...')

    const marksheetS3Key = `marksheets/${marksheetFileName}`
    const marksheetPdfUrl = await uploadToS3(marksheetS3Key, marksheetPdfBytes, 'application/pdf')
    console.log('[S3] ✓ Marksheet uploaded:', marksheetPdfUrl)

    // ============================================================
    // PART 8: SAVE TO DATABASE
    // data_hash  = marksheet coordinate hash (semantic fields + x/y)
    // pdf_hash   = marksheet PDF hash
    // tx_hash_data = blockchain tx for data_hash
    // tx_hash_pdf  = blockchain tx for pdf_hash
    // ============================================================
    const subjectsJson    = JSON.stringify(subjects || [])
    const certificateJson = JSON.stringify({
      ...certificateData,
      // Stored for OCR/canvas verification: tells the verifier exactly where on
      // the PDF page each field lives so text can be extracted and compared.
      // x/y are NOT part of the blockchain hash — only field+value are hashed.
      ocr_coordinate_map: coordinateMap
    })

    // @ts-ignore
    const db = sql()

    console.log('\n[Database] Auto-registering student in users table...')
    await db`
      INSERT INTO users (prn_no, full_name, student_email)
      VALUES (${prn_no}, ${student_name}, ${student_email || null})
      ON CONFLICT (prn_no) DO UPDATE 
      SET student_email = COALESCE(users.student_email, EXCLUDED.student_email)
    `

    const result = await db`
      INSERT INTO marksheets (
        serial_no, student_name, prn_no, examination, branch, session_name, sgpi, cgpi, remarks, subjects,
        supabase_pdf_url, issued_by,
        pdf_hash, data_hash, tx_hash_pdf, tx_hash_data,
        certificate_id, certificate_url, verification_url, certificate_data
      ) VALUES (
        ${serial_no}, ${student_name}, ${prn_no}, ${examination}, ${branch}, ${session_name}, ${sgpi}, ${cgpi}, ${remarks}, ${subjectsJson},
        ${marksheetPdfUrl}, ${issued_by},
        ${marksheetPdfHash}, ${marksheetDataHash}, ${tx_hash_pdf}, ${tx_hash_data},
        ${certificateData.certificate_id}, ${certPdfUrl}, ${verificationUrl}, ${certificateJson}
      )
      RETURNING id
    `

    // @ts-ignore
    const newId = result && result[0] ? result[0].id : null
    console.log('\n[Database] ✓ Saved to marksheets table with ID:', newId)

    // ============================================================
    // PART 9: SEND EMAIL NOTIFICATION VIA SMTP
    // (fire-and-forget: any failure does NOT affect the issuance response)
    // ============================================================
    sendIssuanceEmail({
      studentName:     String(student_name || ''),
      studentEmail:    String(student_email || ''),
      prnNo:           String(prn_no || ''),
      serialNo:        String(serial_no || ''),
      documentType:    'marksheet',
      examination:     String(examination || ''),
      branch:          String(branch || ''),
      session:         String(session_name || ''),
      sgpi:            String(sgpi || ''),
      cgpi:            String(cgpi || ''),
      remarks:         String(remarks || 'SUCCESSFUL'),
      documentUrl:     marksheetPdfUrl,
      certificateUrl:  certPdfUrl,
      certificateId:   certificateData.certificate_id,
      verificationUrl: verificationUrl,
      issueDate:       new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
    }).catch(e => console.error('[Notify] Email notification failed:', e))

    console.log('[Issue] === DUAL ISSUANCE COMPLETE ===\n')

    return NextResponse.json({
      success: true,
      id: newId,
      marksheet: {
        url: marksheetPdfUrl
      },
      certificate: {
        id: certificateData.certificate_id,
        url: certPdfUrl,
        marksheet_data_hash: marksheetDataHash,
        marksheet_pdf_hash: marksheetPdfHash,
        tx_data: tx_hash_data,
        tx_pdf: tx_hash_pdf,
        verification_url: verificationUrl
      }
    })

  } catch (err: any) {
    console.error('[issue] ERROR:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
