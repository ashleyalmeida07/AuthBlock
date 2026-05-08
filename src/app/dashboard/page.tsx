import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { sql } from '@/lib/db'
import Link from 'next/link'
import { Navbar } from '@/components/landing'
import { GraduationCap, ShieldCheck, FileText, ChevronRight, Download, ExternalLink, Award, Clock, Hash } from 'lucide-react'
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

  const qrScans = await db`
    SELECT * FROM qr_scans
    WHERE prn_no = ${user.prn_no}
    ORDER BY scanned_at DESC
    LIMIT 10
  `

  const totalCredentials = marksheets.length + degrees.length

  return (
    <div className="min-h-screen bg-[#f8fafc] relative selection:bg-blue-200">
      <Navbar isLoggedIn={true} user={user} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-24 relative z-10">

        {/* Hero Header */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-2">Academic Dashboard</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-1">
                Welcome, {user.full_name?.split(' ')[0] || 'Student'}
              </h1>
              <p className="text-slate-500 font-medium">
                PRN: <span className="font-mono text-slate-700">{user.prn_no}</span>
                <span className="mx-2 text-slate-300">|</span>
                <span className="text-blue-600 font-bold">{totalCredentials}</span> blockchain-verified credentials
              </p>
            </div>
            <Link href="/scan" className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Verification Portal
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <FileText className="w-4.5 h-4.5 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{marksheets.length}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Marksheets</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                <GraduationCap className="w-4.5 h-4.5 text-amber-600" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{degrees.length}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Degrees</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{totalCredentials}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">On-Chain</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center">
                <Hash className="w-4.5 h-4.5 text-sky-600" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 tracking-tight">{qrScans.length}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">QR Scans</p>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-10">
          <div className="p-6 sm:p-8 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-shrink-0 bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <QRDisplay token={qrToken} />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900 mb-1">Academic Passport QR</h2>
              <p className="text-sm text-slate-500 mb-5 leading-relaxed max-w-lg">
                Share this QR code with verifying institutions or employers. Only the AuthBlock platform can decode and validate your credentials.
              </p>
              <div className="flex flex-wrap gap-3">
                <RegenerateQRButton />
              </div>

              {qrScans.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Recent Scan Activity</h3>
                  <div className="space-y-2">
                    {qrScans.slice(0, 3).map((scan: any) => (
                      <div key={scan.id} className="text-xs bg-slate-50 rounded-lg px-3 py-2.5 flex justify-between items-center">
                        <span className="font-medium text-slate-600">IP: {scan.scanned_by_ip || 'Unknown'}</span>
                        <span className="text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
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
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-amber-700" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Degree Certificates</h2>
              <span className="ml-auto text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">{degrees.length} issued</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {degrees.map((deg: any) => (
                <div key={deg.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-slate-300 transition-colors">
                  <div className="px-6 py-5 border-b border-slate-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 block mb-1">{deg.branch}</span>
                        <h3 className="text-lg font-bold text-slate-900">{deg.degree_title}</h3>
                      </div>
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">{deg.year_of_passing}</span>
                    </div>
                  </div>

                  <div className="px-6 py-5 grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Classification</p>
                      <p className="text-sm font-bold text-emerald-600">{deg.classification || 'N/A'}</p>
                    </div>
                    <div className="border-l border-slate-100 pl-4">
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">CGPI</p>
                      <p className="text-lg font-black text-slate-900 tracking-tighter">{deg.final_cgpi || 'N/A'}</p>
                    </div>
                    <div className="border-l border-slate-100 pl-4">
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Convocation</p>
                      <p className="text-xs font-bold text-slate-600">{deg.convocation_date || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center gap-2">
                    <a href={deg.pdf_url?.replace('-certificate.pdf', '-degree.pdf') || deg.pdf_url} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-amber-400 rounded-lg text-xs font-bold text-slate-700 hover:text-amber-700 transition-colors">
                      <Download className="w-3 h-3" /> Degree
                    </a>
                    <a href={deg.pdf_url} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-400 rounded-lg text-xs font-bold text-slate-700 hover:text-blue-700 transition-colors">
                      <Award className="w-3 h-3" /> Certificate
                    </a>
                    <a href={`/verify?cert=${deg.certificate_id}&hash=${deg.data_hash}&tx=${deg.tx_hash_data}`}
                      className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors">
                      <ShieldCheck className="w-3 h-3" /> Verify
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Marksheets Section */}
        {marksheets.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-700" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Semester Marksheets</h2>
              <span className="ml-auto text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">{marksheets.length} issued</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {marksheets.map((doc: any) => (
                <div key={doc.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-slate-300 transition-colors">
                  <div className="px-6 py-5 border-b border-slate-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 block mb-1">{doc.branch}</span>
                        <h3 className="text-lg font-bold text-slate-900">{doc.examination}</h3>
                      </div>
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">{doc.session_name}</span>
                    </div>
                  </div>

                  <div className="px-6 py-5 grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Result</p>
                      <p className={`text-sm font-bold ${doc.remarks?.toUpperCase().includes('PASS') || doc.remarks === 'SUCCESSFUL' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {doc.remarks}
                      </p>
                    </div>
                    <div className="border-l border-slate-100 pl-4">
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">SGPI</p>
                      <p className="text-lg font-black text-slate-900 tracking-tighter">{doc.sgpi || 'N/A'}</p>
                    </div>
                    <div className="border-l border-slate-100 pl-4">
                      <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">CGPI</p>
                      <p className="text-lg font-black text-slate-900 tracking-tighter">{doc.cgpi || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center gap-2">
                    <a href={doc.supabase_pdf_url} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-400 rounded-lg text-xs font-bold text-slate-700 hover:text-blue-700 transition-colors">
                      <Download className="w-3 h-3" /> Marksheet
                    </a>
                    <a href={doc.certificate_url} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-400 rounded-lg text-xs font-bold text-slate-700 hover:text-indigo-700 transition-colors">
                      <Award className="w-3 h-3" /> Certificate
                    </a>
                    <a href={`/verify?cert=${doc.certificate_id}&hash=${doc.data_hash}&tx=${doc.tx_hash_data}`}
                      className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors">
                      <ShieldCheck className="w-3 h-3" /> Verify
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {totalCredentials === 0 && (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <FileText className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No Credentials Found</h3>
            <p className="text-slate-500 max-w-md mx-auto text-sm">
              Your university has not yet issued any blockchain-verified credentials to your PRN.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
