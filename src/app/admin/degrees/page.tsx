'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap, FileSignature, AlertCircle, Loader2,
  CheckCircle, Search, History, Download, ExternalLink
} from 'lucide-react'
import AdminShell, { type AdminRecord } from '@/components/admin/AdminShell'

// ── Shared sub-components ──────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
      {children}
    </label>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────

function DegreesContent({ currentUser }: { currentUser: AdminRecord }) {
  const [activeTab, setActiveTab] = useState<'manual' | 'history'>('manual')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successData, setSuccessData] = useState<{ url: string; tx: string } | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const [formData, setFormData] = useState({
    serial_no: '',
    student_name: '',
    student_email: '',
    prn_no: '',
    branch: '',
    degree_title: 'Bachelor of Engineering',
    enrollment_year: '',
    year_of_passing: '',
    final_cgpi: '',
    classification: '',
    convocation_date: '',
  })

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFormData(prev => ({ ...prev, [field]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccessData(null)

    try {
      const res = await fetch('/api/admin/degrees/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, issued_by: currentUser.id })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to issue degree certificate')

      setSuccessData({ url: data.certificate?.url || '', tx: data.certificate?.tx_data || '' })
      setFormData({
        serial_no: '', student_name: '', student_email: '', prn_no: '',
        branch: '', degree_title: 'Bachelor of Engineering',
        enrollment_year: '', year_of_passing: '', final_cgpi: '',
        classification: '', convocation_date: '',
      })
      fetchHistory()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'history') fetchHistory()
  }, [activeTab])

  async function fetchHistory() {
    try {
      setLoadingHistory(true)
      const res = await fetch(`/api/admin/degrees?t=${Date.now()}`, { cache: 'no-store' })
      const data = await res.json()
      if (res.ok && data.degrees) setHistory(data.degrees)
      else setError(data.error || 'Failed to load history')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoadingHistory(false)
    }
  }

  const filtered = history.filter(d =>
    d.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.prn_no?.includes(searchQuery) ||
    d.degree_title?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto space-y-8 w-full">

      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            {/* Gold graduation cap accent */}
            <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#B8860B,#FFD700)' }}>
              <GraduationCap className="w-5 h-5 text-white" />
            </span>
            Issue Degree Certificates
          </h1>
          <p className="text-base text-slate-500 mt-2">
            Issue blockchain-verified final degree certificates secured on Ethereum.
          </p>
        </div>
        {/* Live badge */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold"
          style={{ background: '#FFFBEB', borderColor: '#FDE68A', color: '#92400E' }}>
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          DegreeRegistry · Sepolia
        </div>
      </motion.div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex items-center gap-2 px-6 py-4 font-bold transition-all text-sm uppercase tracking-wide border-b-2 ${
            activeTab === 'manual'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <FileSignature className="w-4 h-4" /> Manual Entry
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-6 py-4 font-bold transition-all text-sm uppercase tracking-wide border-b-2 ${
            activeTab === 'history'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <History className="w-4 h-4" /> History
          {history.length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700">
              {history.length}
            </span>
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* Error banner */}
          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-sm font-medium">{error}</div>
            </div>
          )}

          {/* Success banner */}
          {successData && (
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-amber-500" />
                <div>
                  <h4 className="font-bold">Degree Certificate Issued!</h4>
                  <p className="text-sm opacity-80">Secured on Ethereum (Sepolia) and uploaded to S3.</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 shrink-0 border-t sm:border-l sm:border-t-0 border-amber-200/50 pt-3 sm:pt-0 sm:pl-4 mt-3 sm:mt-0">
                {successData.url && (
                  <a href={successData.url} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors">
                    <Download className="w-3.5 h-3.5" /> View PDF
                  </a>
                )}
                {successData.tx && (
                  <a href={`https://sepolia.etherscan.io/tx/${successData.tx}`} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-amber-200 text-amber-700 hover:border-amber-400 rounded-xl text-xs font-bold transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" /> Etherscan
                  </a>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'manual' ? (
            <form onSubmit={handleSubmit} className="glass-card p-6 md:p-8">

              {/* Top accent stripe */}
              <div className="h-1.5 rounded-full mb-8" style={{ background: 'linear-gradient(90deg,#B8860B,#FFD700,#B8860B)' }} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">

                {/* Left: Student Info */}
                <div className="space-y-5">
                  <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-amber-100 flex items-center justify-center">
                      <GraduationCap className="w-3 h-3 text-amber-600" />
                    </span>
                    Student Information
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Serial No.">
                      <input type="text" className="input font-medium font-mono text-amber-700"
                        value={formData.serial_no} onChange={set('serial_no')} />
                    </Field>
                    <Field label="PRN No.">
                      <input type="text" required className="input font-medium font-mono"
                        value={formData.prn_no} onChange={set('prn_no')} />
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Full Name">
                      <input type="text" required className="input font-medium"
                        value={formData.student_name} onChange={set('student_name')} />
                    </Field>
                    <Field label="Email Address">
                      <input type="email" placeholder="Optional" className="input font-medium"
                        value={formData.student_email} onChange={set('student_email')} />
                    </Field>
                  </div>

                  <Field label="Branch / Programme">
                    <input type="text" required className="input font-medium"
                      placeholder="e.g. Computer Engineering"
                      value={formData.branch} onChange={set('branch')} />
                  </Field>

                  <Field label="Degree Title">
                    <select required className="input font-medium bg-white"
                      value={formData.degree_title} onChange={set('degree_title')}>
                      <option>Bachelor of Engineering</option>
                      <option>Bachelor of Technology</option>
                      <option>Master of Engineering</option>
                      <option>Master of Technology</option>
                      <option>Bachelor of Computer Applications</option>
                      <option>Master of Computer Applications</option>
                    </select>
                  </Field>
                </div>

                {/* Right: Academic Details */}
                <div className="space-y-5">
                  <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-amber-100 flex items-center justify-center">
                      <GraduationCap className="w-3 h-3 text-amber-600" />
                    </span>
                    Academic Details
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Enrollment Year">
                      <input type="text" required className="input font-medium" placeholder="e.g. 2020"
                        value={formData.enrollment_year} onChange={set('enrollment_year')} />
                    </Field>
                    <Field label="Year of Passing">
                      <input type="text" required className="input font-medium" placeholder="e.g. 2024"
                        value={formData.year_of_passing} onChange={set('year_of_passing')} />
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Final CGPI">
                      <input type="text" required className="input font-medium" placeholder="e.g. 9.31"
                        value={formData.final_cgpi} onChange={set('final_cgpi')} />
                    </Field>
                    <Field label="Classification">
                      <select required className="input font-medium bg-white"
                        value={formData.classification} onChange={set('classification')}>
                        <option value="">Select...</option>
                        <option>First Class with Distinction</option>
                        <option>First Class</option>
                        <option>Second Class</option>
                        <option>Pass Class</option>
                      </select>
                    </Field>
                  </div>

                  <Field label="Convocation Date">
                    <input type="text" className="input font-medium" placeholder="e.g. 15 March 2025"
                      value={formData.convocation_date} onChange={set('convocation_date')} />
                  </Field>

                  {/* Preview card */}
                  {(formData.student_name || formData.degree_title) && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 rounded-xl border"
                      style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}
                    >
                      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Preview</p>
                      <p className="font-bold text-slate-800 text-sm">{formData.student_name || '—'}</p>
                      <p className="text-xs text-slate-500">{formData.degree_title} · {formData.branch || '—'}</p>
                      <p className="text-xs text-slate-500">{formData.enrollment_year || '—'} – {formData.year_of_passing || '—'}</p>
                      {formData.final_cgpi && (
                        <p className="text-xs font-bold text-amber-700 mt-1">CGPI: {formData.final_cgpi} · {formData.classification}</p>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-w-[220px] flex items-center justify-center gap-2 py-3.5 px-8 font-bold text-white rounded-xl transition-all shadow-lg disabled:opacity-60"
                  style={{ background: isSubmitting ? '#D97706' : 'linear-gradient(135deg,#B8860B,#D4A017)', boxShadow: '0 4px 20px -4px rgba(184,134,11,0.4)' }}
                >
                  {isSubmitting
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating on Blockchain...</>
                    : <><GraduationCap className="w-5 h-5" /> Issue Degree Certificate</>
                  }
                </button>
              </div>
            </form>
          ) : (
            /* ── History Tab ── */
            <div className="glass-card overflow-hidden">
              <div className="p-4 bg-amber-50 border-b border-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="font-bold text-amber-900 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" /> Issued Degree Certificates
                  <span className="text-xs font-normal text-amber-600">({history.length} total)</span>
                </h2>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search name, PRN or degree..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 border border-amber-200 rounded-lg text-sm font-medium outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 w-full sm:w-[280px] bg-white"
                    />
                  </div>
                  <button
                    onClick={fetchHistory}
                    disabled={loadingHistory}
                    className="px-3 py-2 text-white rounded-lg font-semibold text-sm transition disabled:opacity-50"
                    style={{ background: '#B8860B' }}
                  >
                    {loadingHistory ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Student</th>
                      <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Degree</th>
                      <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Performance</th>
                      <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Issued</th>
                      <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {loadingHistory ? (
                      <tr><td colSpan={5} className="p-8 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" /> Loading degrees...
                      </td></tr>
                    ) : filtered.length === 0 ? (
                      <tr><td colSpan={5} className="p-12 text-center">
                        <GraduationCap className="w-10 h-10 text-amber-200 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">No degree certificates issued yet.</p>
                      </td></tr>
                    ) : (
                      filtered.map(d => (
                        <tr key={d.id} className="hover:bg-amber-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{d.student_name}</div>
                            <div className="font-mono text-xs text-slate-500 mt-0.5">{d.prn_no}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-amber-800 text-sm">{d.degree_title}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{d.branch} · {d.enrollment_year}–{d.year_of_passing}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800">
                              CGPI: {d.final_cgpi || '—'}
                            </span>
                            <div className="text-[10px] text-slate-500 mt-1">{d.classification || '—'}</div>
                          </td>
                          <td className="px-6 py-4 text-slate-600 text-xs font-medium">
                            {d.issued_at ? new Date(d.issued_at).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            }) : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center gap-2 justify-end flex-wrap">
                              {d.pdf_url && (
                                <a href={d.pdf_url} target="_blank" rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white rounded-lg text-xs font-bold transition-colors border border-amber-200">
                                  <Download className="w-3.5 h-3.5" /> Certificate
                                </a>
                              )}
                              {d.tx_hash_data && (
                                <a href={`https://sepolia.etherscan.io/tx/${d.tx_hash_data}`} target="_blank" rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-600 hover:bg-sky-600 hover:text-white rounded-lg text-xs font-bold transition-colors border border-sky-100">
                                  <ExternalLink className="w-3.5 h-3.5" /> Etherscan
                                </a>
                              )}
                              {!d.pdf_url && !d.tx_hash_data && (
                                <span className="text-xs text-slate-400">No links</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default function DegreesPage() {
  return (
    <AdminShell>
      {(admin) => <DegreesContent currentUser={admin} />}
    </AdminShell>
  )
}
