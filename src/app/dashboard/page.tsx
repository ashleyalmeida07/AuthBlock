import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { sql } from '@/lib/db'
import Link from 'next/link'
import { Navbar } from '@/components/landing'
import { GraduationCap, ShieldCheck, FileText, Download, Award, Clock, Hash } from 'lucide-react'
import crypto from 'crypto'
import { QRDisplay, RegenerateQRButton } from '@/components/QRControls'

export default async function DashboardPage() {
  const cookieStore = cookies()
  const sessionCookie = cookieStore.get('student_session')

  if (!sessionCookie?.value) {
    redirect('/login')
  }

  const user = JSON.parse(sessionCookie.value)

  // @ts-ignore
  const db = sql()

  const userRecord = await db`SELECT qr_token FROM users WHERE prn_no = ${user.prn_no}`
  let qrToken = userRecord.length > 0 ? userRecord[0].qr_token : null

  if (!qrToken && userRecord.length > 0) {
    qrToken = crypto.randomUUID()
    await db`UPDATE users SET qr_token = ${qrToken} WHERE prn_no = ${user.prn_no}`
  }

  const marksheets = await db`
    SELECT * FROM marksheets
    WHERE prn_no = ${user.prn_no}
    ORDER BY issued_at DESC
  `

  const degrees = await db`
    SELECT * FROM degrees
    WHERE prn_no = ${user.prn_no}
    ORDER BY issued_at DESC
  `

  const courses = await db`
    SELECT * FROM courses
    WHERE prn_no = ${user.prn_no}
    ORDER BY issued_at DESC
  `

  const qrScans = await db`
    SELECT * FROM qr_scans
    WHERE prn_no = ${user.prn_no}
    ORDER BY scanned_at DESC
    LIMIT 10
  `

  const totalCredentials = marksheets.length + degrees.length + courses.length

  return (
    <div className="min-h-screen bg-brand-bg relative selection:bg-brand-soft">
      <Navbar isLoggedIn={true} user={user} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-28 md:pt-32 relative z-10">

        {/* Hero Header */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-xs font-bold text-brand-blue uppercase tracking-widest mb-3">Academic Dashboard</p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light text-brand-heading tracking-tight mb-2">
                Welcome, {user.full_name?.split(' ')[0] || 'Student'}
              </h1>
              <p className="text-brand-navy/60 font-medium">
                PRN: <span className="font-mono text-brand-navy">{user.prn_no}</span>
                <span className="mx-2 text-brand-navy/20">|</span>
                <span className="text-brand-blue font-bold">{totalCredentials}</span> blockchain-verified credentials
              </p>
            </div>
            <Link href="/scan" className="flex items-center gap-2 bg-brand-navy hover:bg-brand-heading px-6 py-3 rounded-full text-sm font-medium text-white transition-all hover:shadow-lg">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Verification Portal
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-10">
          <div className="bg-white rounded-3xl border border-brand-border/50 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-soft/50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-brand-blue" />
              </div>
            </div>
            <p className="text-3xl font-light text-brand-heading tracking-tight">{marksheets.length}</p>
            <p className="text-xs font-bold text-brand-navy/50 uppercase tracking-wider mt-1">Marksheets</p>
          </div>
          <div className="bg-white rounded-3xl border border-brand-border/50 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <p className="text-3xl font-light text-brand-heading tracking-tight">{degrees.length}</p>
            <p className="text-xs font-bold text-brand-navy/50 uppercase tracking-wider mt-1">Degrees</p>
          </div>
          <div className="bg-white rounded-3xl border border-brand-border/50 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-3xl font-light text-brand-heading tracking-tight">{courses.length}</p>
            <p className="text-xs font-bold text-brand-navy/50 uppercase tracking-wider mt-1">Courses</p>
          </div>
          <div className="bg-white rounded-3xl border border-brand-border/50 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-3xl font-light text-brand-heading tracking-tight">{totalCredentials}</p>
            <p className="text-xs font-bold text-brand-navy/50 uppercase tracking-wider mt-1">On-Chain</p>
          </div>
          <div className="bg-white rounded-3xl border border-brand-border/50 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                <Hash className="w-5 h-5 text-sky-600" />
              </div>
            </div>
            <p className="text-3xl font-light text-brand-heading tracking-tight">{qrScans.length}</p>
            <p className="text-xs font-bold text-brand-navy/50 uppercase tracking-wider mt-1">QR Scans</p>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="bg-white rounded-3xl border border-brand-border shadow-sm overflow-hidden mb-12">
          <div className="p-8 sm:p-10 flex flex-col md:flex-row items-center gap-10">
            <div className="flex-shrink-0 bg-brand-bg p-6 rounded-3xl border border-brand-border/50">
              <QRDisplay token={qrToken} />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-light text-brand-heading mb-2">Academic Passport QR</h2>
              <p className="text-sm text-brand-navy/60 mb-6 leading-relaxed max-w-lg">
                Share this QR code with verifying institutions or employers. Only the AuthBlock platform can decode and validate your credentials.
              </p>
              <div className="flex flex-wrap gap-3">
                <RegenerateQRButton />
              </div>

              {qrScans.length > 0 && (
                <div className="mt-8 pt-6 border-t border-brand-border/50">
                  <h3 className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest mb-3">Recent Scan Activity</h3>
                  <div className="space-y-2">
                    {qrScans.slice(0, 3).map((scan: any) => (
                      <div key={scan.id} className="text-xs bg-brand-bg rounded-xl px-4 py-3 flex justify-between items-center border border-brand-border/30">
                        <span className="font-medium text-brand-navy/80">IP: {scan.scanned_by_ip || 'Unknown'}</span>
                        <span className="text-brand-navy/50 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(scan.scanned_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Degrees Section */}
        {degrees.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-xl font-medium text-brand-heading">Degree Certificates</h2>
              <span className="ml-auto text-xs font-bold text-brand-navy/50 bg-brand-bg border border-brand-border px-3 py-1.5 rounded-full">{degrees.length} issued</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {degrees.map((deg: any) => (
                <div key={deg.id} className="bg-white rounded-3xl border border-brand-border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="px-8 py-6 border-b border-brand-border/50">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 block mb-2">{deg.branch}</span>
                        <h3 className="text-xl font-medium text-brand-heading">{deg.degree_title}</h3>
                      </div>
                      <span className="text-xs font-bold text-brand-navy/60 bg-brand-bg border border-brand-border px-3 py-1.5 rounded-full">{deg.year_of_passing}</span>
                    </div>
                  </div>

                  <div className="px-8 py-6 grid grid-cols-3 gap-6">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-brand-navy/40 mb-1.5">Classification</p>
                      <p className="text-sm font-bold text-emerald-600">{deg.classification || 'N/A'}</p>
                    </div>
                    <div className="border-l border-brand-border/50 pl-6">
                      <p className="text-[10px] uppercase font-bold text-brand-navy/40 mb-1.5">CGPI</p>
                      <p className="text-xl font-light text-brand-heading tracking-tighter">{deg.final_cgpi || 'N/A'}</p>
                    </div>
                    <div className="border-l border-brand-border/50 pl-6">
                      <p className="text-[10px] uppercase font-bold text-brand-navy/40 mb-1.5">Convocation</p>
                      <p className="text-sm font-medium text-brand-navy/80">{deg.convocation_date || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="px-8 py-5 bg-brand-bg border-t border-brand-border/50 flex flex-wrap items-center gap-3">
                    <a href={deg.pdf_url?.replace('-certificate.pdf', '-degree.pdf') || deg.pdf_url} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-brand-border/80 hover:border-amber-400 rounded-full text-xs font-medium text-brand-navy hover:text-amber-700 transition-colors shadow-sm">
                      <Download className="w-3.5 h-3.5" /> Degree
                    </a>
                    <a href={deg.pdf_url} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-brand-border/80 hover:border-brand-blue rounded-full text-xs font-medium text-brand-navy hover:text-brand-blue transition-colors shadow-sm">
                      <Award className="w-3.5 h-3.5" /> Certificate
                    </a>
                    <a href={`/verify?cert=${deg.certificate_id}&hash=${deg.data_hash}&tx=${deg.tx_hash_data}`}
                      className="ml-auto inline-flex items-center gap-2 px-4 py-2 bg-brand-navy hover:bg-brand-heading text-white rounded-full text-xs font-medium transition-colors shadow-sm">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verify
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Courses Section */}
        {courses.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-medium text-brand-heading">Course Certificates</h2>
              <span className="ml-auto text-xs font-bold text-brand-navy/50 bg-brand-bg border border-brand-border px-3 py-1.5 rounded-full">{courses.length} issued</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {courses.map((course: any) => (
                <div key={course.id} className="bg-white rounded-3xl border border-brand-border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="px-8 py-6 border-b border-brand-border/50">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600 block mb-2">{course.course_type || 'Certification'}</span>
                        <h3 className="text-xl font-medium text-brand-heading">{course.course_name}</h3>
                      </div>
                      <span className="text-xs font-bold text-brand-navy/60 bg-brand-bg border border-brand-border px-3 py-1.5 rounded-full">{new Date(course.issued_at).getFullYear()}</span>
                    </div>
                  </div>

                  <div className="px-8 py-6 grid grid-cols-3 gap-6">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-brand-navy/40 mb-1.5">Grade</p>
                      <p className="text-sm font-bold text-emerald-600">{course.grade || 'N/A'}</p>
                    </div>
                    <div className="border-l border-brand-border/50 pl-6">
                      <p className="text-[10px] uppercase font-bold text-brand-navy/40 mb-1.5">Duration</p>
                      <p className="text-sm font-medium text-brand-heading">{course.duration || 'N/A'}</p>
                    </div>
                    <div className="border-l border-brand-border/50 pl-6">
                      <p className="text-[10px] uppercase font-bold text-brand-navy/40 mb-1.5">Instructor</p>
                      <p className="text-sm font-medium text-brand-navy/80">{course.instructor_name || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="px-8 py-5 bg-brand-bg border-t border-brand-border/50 flex flex-wrap items-center gap-3">
                    <a href={course.pdf_url} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-brand-border/80 hover:border-purple-400 rounded-full text-xs font-medium text-brand-navy hover:text-purple-700 transition-colors shadow-sm">
                        <Download className="w-3.5 h-3.5" /> Certificate
                    </a>
                    <a href={`/verify?cert=${course.certificate_id}&hash=${course.data_hash}&tx=${course.tx_hash_data}`}
                      className="ml-auto inline-flex items-center gap-2 px-4 py-2 bg-brand-navy hover:bg-brand-heading text-white rounded-full text-xs font-medium transition-colors shadow-sm">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verify
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Marksheets Section */}
        {marksheets.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-brand-soft/50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-brand-blue" />
              </div>
              <h2 className="text-xl font-medium text-brand-heading">Semester Marksheets</h2>
              <span className="ml-auto text-xs font-bold text-brand-navy/50 bg-brand-bg border border-brand-border px-3 py-1.5 rounded-full">{marksheets.length} issued</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {marksheets.map((doc: any) => (
                <div key={doc.id} className="bg-white rounded-3xl border border-brand-border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="px-8 py-6 border-b border-brand-border/50">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-blue block mb-2">{doc.branch}</span>
                        <h3 className="text-xl font-medium text-brand-heading">{doc.examination}</h3>
                      </div>
                      <span className="text-xs font-bold text-brand-navy/60 bg-brand-bg border border-brand-border px-3 py-1.5 rounded-full">{doc.session_name}</span>
                    </div>
                  </div>

                  <div className="px-8 py-6 grid grid-cols-3 gap-6">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-brand-navy/40 mb-1.5">Result</p>
                      <p className={`text-sm font-bold ${doc.remarks?.toUpperCase().includes('PASS') || doc.remarks === 'SUCCESSFUL' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {doc.remarks}
                      </p>
                    </div>
                    <div className="border-l border-brand-border/50 pl-6">
                      <p className="text-[10px] uppercase font-bold text-brand-navy/40 mb-1.5">SGPI</p>
                      <p className="text-xl font-light text-brand-heading tracking-tighter">{doc.sgpi || 'N/A'}</p>
                    </div>
                    <div className="border-l border-brand-border/50 pl-6">
                      <p className="text-[10px] uppercase font-bold text-brand-navy/40 mb-1.5">CGPI</p>
                      <p className="text-xl font-light text-brand-heading tracking-tighter">{doc.cgpi || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="px-8 py-5 bg-brand-bg border-t border-brand-border/50 flex flex-wrap items-center gap-3">
                    <a href={doc.supabase_pdf_url} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-brand-border/80 hover:border-brand-blue rounded-full text-xs font-medium text-brand-navy hover:text-brand-blue transition-colors shadow-sm">
                      <Download className="w-3.5 h-3.5" /> Marksheet
                    </a>
                    <a href={doc.certificate_url} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-brand-border/80 hover:border-indigo-400 rounded-full text-xs font-medium text-brand-navy hover:text-indigo-700 transition-colors shadow-sm">
                      <Award className="w-3.5 h-3.5" /> Certificate
                    </a>
                    <a href={`/verify?cert=${doc.certificate_id}&hash=${doc.data_hash}&tx=${doc.tx_hash_data}`}
                      className="ml-auto inline-flex items-center gap-2 px-4 py-2 bg-brand-navy hover:bg-brand-heading text-white rounded-full text-xs font-medium transition-colors shadow-sm">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verify
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {totalCredentials === 0 && (
          <div className="bg-white border-2 border-dashed border-brand-border rounded-3xl p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-brand-bg rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-brand-navy/30" />
            </div>
            <h3 className="text-2xl font-light text-brand-heading mb-3">No Credentials Found</h3>
            <p className="text-brand-navy/60 max-w-md mx-auto text-sm leading-relaxed">
              Your university has not yet issued any blockchain-verified credentials to your PRN.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
