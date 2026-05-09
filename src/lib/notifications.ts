import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export interface IssuanceNotificationPayload {
  studentName: string
  studentEmail: string
  prnNo: string
  serialNo?: string
  documentType: 'marksheet' | 'degree' | 'course'
  // Marksheet-specific
  examination?: string
  branch?: string
  session?: string
  sgpi?: string
  cgpi?: string
  remarks?: string
  // Degree-specific
  degreeTitle?: string
  yearOfPassing?: string
  classification?: string
  // Course-specific
  courseName?: string
  courseType?: string
  grade?: string
  duration?: string
  instructorName?: string
  // Common
  certificateUrl: string
  documentUrl?: string
  certificateId?: string
  verificationUrl?: string
  issueDate: string
}

function getDocLabel(type: string) {
  switch (type) {
    case 'marksheet': return 'Marksheet'
    case 'degree': return 'Degree Certificate'
    case 'course': return 'Course Certificate'
    default: return 'Document'
  }
}

function buildDetailsHtml(p: IssuanceNotificationPayload): string {
  const rows: string[] = []
  const row = (label: string, value?: string) => {
    if (value) rows.push(`<tr><td style="padding:8px 16px;font-weight:600;color:#475569;border-bottom:1px solid #f1f5f9">${label}</td><td style="padding:8px 16px;color:#0f172a;border-bottom:1px solid #f1f5f9">${value}</td></tr>`)
  }

  row('Student Name', p.studentName)
  row('PRN No.', p.prnNo)
  if (p.serialNo) row('Serial No.', p.serialNo)

  if (p.documentType === 'marksheet') {
    row('Examination', p.examination)
    row('Branch', p.branch)
    row('Session', p.session)
    row('SGPI', p.sgpi)
    row('CGPI', p.cgpi)
    row('Remarks', p.remarks)
  } else if (p.documentType === 'degree') {
    row('Degree', p.degreeTitle)
    row('Branch', p.branch)
    row('Year of Passing', p.yearOfPassing)
    row('Classification', p.classification)
  } else if (p.documentType === 'course') {
    row('Course', p.courseName)
    row('Type', p.courseType)
    row('Grade', p.grade)
    row('Duration', p.duration)
    row('Instructor', p.instructorName)
  }

  row('Issue Date', p.issueDate)
  if (p.certificateId) row('Certificate ID', p.certificateId)

  return rows.join('')
}

function buildEmailHtml(p: IssuanceNotificationPayload): string {
  const docLabel = getDocLabel(p.documentType)
  const detailsRows = buildDetailsHtml(p)

  const downloadBtnHtml = p.documentUrl
    ? `<a href="${p.documentUrl}" target="_blank" style="display:inline-block;padding:12px 28px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;margin-right:12px">Download ${docLabel}</a>`
    : ''
  const certBtnHtml = `<a href="${p.certificateUrl}" target="_blank" style="display:inline-block;padding:12px 28px;background:#ffffff;color:#2563eb;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;border:2px solid #2563eb">View AuthBlock Certificate</a>`
  const verifyBtnHtml = p.verificationUrl
    ? `<div style="margin-top:16px"><a href="${p.verificationUrl}" target="_blank" style="color:#2563eb;font-size:13px;text-decoration:underline">Verify on Blockchain →</a></div>`
    : ''

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%);border-radius:16px 16px 0 0;padding:32px 32px 24px;text-align:center">
      <div style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px">AuthBlock</div>
      <div style="font-size:13px;color:#93c5fd;margin-top:4px">Blockchain-Secured Academic Credentials</div>
    </div>

    <!-- Body -->
    <div style="background:#ffffff;border-radius:0 0 16px 16px;padding:32px;box-shadow:0 4px 24px rgba(0,0,0,0.06)">
      <h2 style="margin:0 0 8px;font-size:22px;color:#0f172a">Your ${docLabel} is Ready! 🎓</h2>
      <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6">
        Dear <strong>${p.studentName}</strong>,<br>
        Your ${docLabel.toLowerCase()} has been issued and secured on the Ethereum blockchain. 
        The document is tamper-proof and can be verified anytime.
      </p>

      <!-- Details Table -->
      <table style="width:100%;border-collapse:collapse;border-radius:12px;overflow:hidden;background:#f8fafc;margin-bottom:24px">
        <tbody>${detailsRows}</tbody>
      </table>

      <!-- Download Buttons -->
      <div style="text-align:center;padding:8px 0 16px">
        ${downloadBtnHtml}
        ${certBtnHtml}
        ${verifyBtnHtml}
      </div>

      <!-- Footer -->
      <div style="border-top:1px solid #e2e8f0;padding-top:20px;margin-top:24px;text-align:center">
        <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.5">
          This is an automated notification from AuthBlock.<br>
          Fr. Conceicao Rodrigues College of Engineering, Bandra (W), Mumbai - 400050
        </p>
      </div>
    </div>
  </div>
</body>
</html>`
}

/**
 * Sends an issuance notification email directly via SMTP.
 * Non-fatal: errors are logged but never break the issuance response.
 */
export async function sendIssuanceEmail(payload: IssuanceNotificationPayload): Promise<void> {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('[SMTP] SMTP credentials not set — skipping email')
    return
  }

  if (!payload.studentEmail) {
    console.warn('[SMTP] No student email for PRN:', payload.prnNo, '— skipping email')
    return
  }

  const docLabel = getDocLabel(payload.documentType)

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: payload.studentEmail,
      subject: `${docLabel} Issued — ${payload.studentName} | AuthBlock`,
      html: buildEmailHtml(payload),
    })
    console.log('[SMTP] ✓ Email sent to:', payload.studentEmail, '| MessageId:', info.messageId)
  } catch (err: any) {
    console.error('[SMTP] Failed to send email:', err.message)
  }
}
