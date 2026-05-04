'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, FileSignature, AlertCircle, Loader2,
  CheckCircle, Search, History, Download, ExternalLink, Clock
} from 'lucide-react'
import AdminShell, { type AdminRecord } from '@/components/admin/AdminShell'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  )
}

const COURSE_TYPES = ['Workshop', 'Certification', 'Online Course', 'Seminar', 'Training Program', 'Bootcamp', 'Internship']

function CoursesContent({ currentUser }: { currentUser: AdminRecord }) {
  const [activeTab, setActiveTab] = useState<'manual' | 'history'>('manual')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successData, setSuccessData] = useState<{ url: string; tx: string } | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Processing steps state
  const [processingSteps, setProcessingSteps] = useState<{ label: string; status: 'pending' | 'active' | 'done' | 'error' }[]>([])
  const [showProcessing, setShowProcessing] = useState(false)

  const [formData, setFormData] = useState({
    student_name: '',
    student_email: '',
    prn_no: '',
    course_name: '',
    course_type: 'Workshop',
    duration: '',
    instructor_name: '',
    start_date: '',
    end_date: '',
    grade: '',
    description: '',
  })

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setFormData(prev => ({ ...prev, [field]: e.target.value }))

  const updateStep = (index: number, status: 'active' | 'done' | 'error') => {
    setProcessingSteps(prev => prev.map((s, i) => i === index ? { ...s, status } : s))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccessData(null)

    const steps = [
      { label: 'Connecting to AuthBlock API...', status: 'pending' as const },
      { label: 'Generating data hash (SHA-256)...', status: 'pending' as const },
      { label: 'Registering hash on Ethereum (Sepolia)...', status: 'pending' as const },
      { label: 'Generating course certificate PDF...', status: 'pending' as const },
      { label: 'Uploading to cloud storage...', status: 'pending' as const },
      { label: 'Saving to database...', status: 'pending' as const },
    ]
    setProcessingSteps(steps)
    setShowProcessing(true)

    try {
      updateStep(0, 'active')
      await new Promise(r => setTimeout(r, 400))
      updateStep(0, 'done')

      updateStep(1, 'active')
      await new Promise(r => setTimeout(r, 300))
      updateStep(1, 'done')

      updateStep(2, 'active')

      const res = await fetch('/api/admin/courses/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, issued_by: currentUser.id })
      })
      const data = await res.json()

      if (!res.ok) {
        updateStep(2, 'error')
        throw new Error(data.error || 'Failed to issue course certificate')
      }

      updateStep(2, 'done')

      updateStep(3, 'active')
      await new Promise(r => setTimeout(r, 300))
      updateStep(3, 'done')

      updateStep(4, 'active')
      await new Promise(r => setTimeout(r, 300))
      updateStep(4, 'done')

      updateStep(5, 'active')
      await new Promise(r => setTimeout(r, 200))
      updateStep(5, 'done')

      setSuccessData({ url: data.certificate?.url || '', tx: data.certificate?.tx_data || '' })
      setFormData({
        student_name: '', student_email: '', prn_no: '',
        course_name: '', course_type: 'Workshop', duration: '',
        instructor_name: '', start_date: '', end_date: '', grade: '', description: '',
      })
      fetchHistory()

      setTimeout(() => setShowProcessing(false), 2000)
    } catch (err: any) {
      setError(err.message)
      setTimeout(() => setShowProcessing(false), 3000)
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
      const res = await fetch(`/api/admin/courses?t=${Date.now()}`, { cache: 'no-store' })
      const data = await res.json()
      if (res.ok && data.courses) setHistory(data.courses)
      else setError(data.error || 'Failed to load history')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoadingHistory(false)
    }
  }

  const filtered = history.filter(c =>
    c.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.prn_no?.includes(searchQuery) ||
    c.course_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Type badge colours
  const typeColors: Record<string, string> = {
    Workshop: 'bg-blue-100 text-blue-700',
    Certification: 'bg-cyan-100 text-cyan-700',
    'Online Course': 'bg-sky-100 text-sky-700',
    Seminar: 'bg-indigo-100 text-indigo-700',
    'Training Program': 'bg-emerald-100 text-emerald-700',
    Bootcamp: 'bg-orange-100 text-orange-700',
    Internship: 'bg-purple-100 text-purple-700',
  }

  const TEAL = '#2563EB' // blue-600
  const TEAL_LIGHT = '#EFF6FF' // blue-50

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
            <span className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-600">
              <BookOpen className="w-5 h-5 text-white" />
            </span>
            Issue Course Certificates
          </h1>
          <p className="text-base text-slate-500 mt-2">
            Issue blockchain-verified certificates for workshops, seminars, and short-term courses.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold bg-emerald-50 border-emerald-200 text-emerald-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          CourseRegistry · Sepolia
        </div>
      </motion.div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {(['manual', 'history'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-6 py-4 font-bold transition-all text-sm uppercase tracking-wide border-b-2 ${
              activeTab === tab
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab === 'manual' ? <FileSignature className="w-4 h-4" /> : <History className="w-4 h-4" />}
            {tab === 'manual' ? 'Manual Entry' : (
              <>History{history.length > 0 && (
                <span className="ml-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700">
                  {history.length}
                </span>
              )}</>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-sm font-medium">{error}</div>
            </div>
          )}

          {/* Processing steps terminal */}
          {showProcessing && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-6 bg-white border border-slate-200 rounded-xl overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                <Loader2 className={`w-4 h-4 text-blue-600 ${processingSteps.every(s => s.status === 'done') ? '' : 'animate-spin'}`} />
                <span className="text-sm font-semibold text-slate-700">
                  {processingSteps.every(s => s.status === 'done') ? 'Certificate Issued Successfully' : 'Issuing Course Certificate...'}
                </span>
              </div>
              <div className="px-4 py-3 space-y-2">
                {processingSteps.map((step, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm">
                    {step.status === 'pending' && <span className="w-4 h-4 rounded-full border-2 border-slate-200" />}
                    {step.status === 'active' && <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />}
                    {step.status === 'done' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                    {step.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                    <span className={
                      step.status === 'done' ? 'text-slate-500' :
                      step.status === 'active' ? 'text-slate-800 font-medium' :
                      step.status === 'error' ? 'text-red-600 font-medium' :
                      'text-slate-400'
                    }>{step.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {successData && (
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border bg-blue-50 border-blue-200 text-blue-800"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-blue-600" />
                <div>
                  <h4 className="font-bold">Course Certificate Issued!</h4>
                  <p className="text-sm opacity-80">Secured on Ethereum (Sepolia) and uploaded to S3.</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 shrink-0 border-t sm:border-l sm:border-t-0 border-blue-200/50 pt-3 sm:pt-0 sm:pl-4 mt-3 sm:mt-0">
                {successData.url && (
                  <a href={successData.url} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-xl text-xs font-bold transition-colors bg-blue-600 hover:bg-blue-700">
                    <Download className="w-3.5 h-3.5" /> View PDF
                  </a>
                )}
                {successData.tx && (
                  <a href={`https://sepolia.etherscan.io/tx/${successData.tx}`} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border rounded-xl text-xs font-bold transition-colors border-blue-200 text-blue-700 hover:border-blue-400">
                    <ExternalLink className="w-3.5 h-3.5" /> Etherscan
                  </a>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'manual' ? (
            <form onSubmit={handleSubmit} className="glass-card p-6 md:p-8">



              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">

                {/* Left: Participant Info */}
                <div className="space-y-5">
                  <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                    <span className="w-5 h-5 rounded flex items-center justify-center bg-blue-100">
                      <BookOpen className="w-3 h-3 text-blue-600" />
                    </span>
                    Participant Information
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="PRN No.">
                      <input type="text" required className="input font-medium font-mono"
                        value={formData.prn_no} onChange={set('prn_no')} />
                    </Field>
                    <Field label="Full Name">
                      <input type="text" required className="input font-medium"
                        value={formData.student_name} onChange={set('student_name')} />
                    </Field>
                  </div>

                  <Field label="Email Address">
                    <input type="email" placeholder="Optional — for notification" className="input font-medium"
                      value={formData.student_email} onChange={set('student_email')} />
                  </Field>

                  {/* Course type selector with pills */}
                  <Field label="Course Type">
                    <div className="flex flex-wrap gap-2 mt-1">
                      {COURSE_TYPES.map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, course_type: type }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            formData.course_type === type
                              ? 'text-white border-transparent'
                              : 'text-slate-500 border-slate-200 bg-slate-50 hover:border-slate-300'
                          }`}
                          style={formData.course_type === type ? { background: '#2563EB', borderColor: '#2563EB' } : {}}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field label="Grade / Result">
                    <div className="flex flex-wrap gap-2 mt-1">
                      {['O', 'A+', 'A', 'B+', 'B', 'Pass', 'Distinction', 'Merit'].map(g => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, grade: g }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            formData.grade === g
                              ? 'text-white border-transparent'
                              : 'text-slate-500 border-slate-200 bg-slate-50 hover:border-slate-300'
                          }`}
                          style={formData.grade === g ? { background: '#059669', borderColor: '#059669' } : {}}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                    <input type="text" placeholder="or type custom grade..."
                      className="input font-medium mt-2 text-sm"
                      value={formData.grade} onChange={set('grade')} />
                  </Field>
                </div>

                {/* Right: Course Details */}
                <div className="space-y-5">
                  <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                    <span className="w-5 h-5 rounded flex items-center justify-center bg-blue-100">
                      <BookOpen className="w-3 h-3 text-blue-600" />
                    </span>
                    Course Details
                  </h3>

                  <Field label="Course Name">
                    <input type="text" required className="input font-medium"
                      placeholder="e.g. Machine Learning Fundamentals"
                      value={formData.course_name} onChange={set('course_name')} />
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Duration">
                      <input type="text" className="input font-medium" placeholder="e.g. 40 hours"
                        value={formData.duration} onChange={set('duration')} />
                    </Field>
                    <Field label="Instructor / Organizer">
                      <input type="text" className="input font-medium"
                        value={formData.instructor_name} onChange={set('instructor_name')} />
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Start Date">
                      <input type="text" className="input font-medium" placeholder="e.g. 01 Jan 2025"
                        value={formData.start_date} onChange={set('start_date')} />
                    </Field>
                    <Field label="End Date">
                      <input type="text" className="input font-medium" placeholder="e.g. 15 Jan 2025"
                        value={formData.end_date} onChange={set('end_date')} />
                    </Field>
                  </div>

                  <Field label="Description (Optional)">
                    <textarea className="input font-medium min-h-[80px] resize-none text-sm"
                      placeholder="Brief description of what the course covered..."
                      value={formData.description}
                      onChange={set('description')}
                    />
                  </Field>

                  {/* Live preview card */}
                  {formData.course_name && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 rounded-xl border bg-blue-50 border-blue-200"
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-1 text-blue-600">Preview</p>
                      <p className="font-bold text-slate-800 text-sm">{formData.student_name || '—'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${typeColors[formData.course_type] || 'bg-slate-100 text-slate-600'}`}>
                          {formData.course_type}
                        </span>
                        <span className="text-xs text-slate-600 font-medium">{formData.course_name}</span>
                      </div>
                      {formData.grade && (
                        <p className="text-xs font-bold mt-1" style={{ color: '#059669' }}>Grade: {formData.grade}</p>
                      )}
                      {(formData.start_date || formData.end_date) && (
                        <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formData.start_date} {formData.end_date ? `→ ${formData.end_date}` : ''}
                          {formData.duration ? ` · ${formData.duration}` : ''}
                        </p>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-w-[240px] flex items-center justify-center gap-2 py-3 px-8 font-semibold text-white rounded-lg transition-colors disabled:opacity-60 bg-blue-600 hover:bg-blue-700 border border-blue-700"
                >
                  {isSubmitting
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating on Blockchain...</>
                    : <><BookOpen className="w-5 h-5" /> Issue Course Certificate</>
                  }
                </button>
              </div>
            </form>
          ) : (
            /* ── History Tab ── */
            <div className="glass-card overflow-hidden">
              <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-blue-50 border-blue-100">
                <h2 className="font-bold flex items-center gap-2 text-blue-900">
                  <BookOpen className="w-4 h-4" /> Issued Course Certificates
                  <span className="text-xs font-normal text-blue-600">({history.length} total)</span>
                </h2>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search name, PRN or course..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 border rounded-lg text-sm font-medium outline-none w-full sm:w-[280px] bg-white border-blue-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={fetchHistory}
                    disabled={loadingHistory}
                    className="px-3 py-2 text-white rounded-lg font-semibold text-sm transition disabled:opacity-50 bg-blue-600 hover:bg-blue-700"
                  >
                    {loadingHistory ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Participant</th>
                      <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Course</th>
                      <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Details</th>
                      <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider">Issued</th>
                      <th className="px-6 py-4 font-bold text-slate-600 text-xs uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {loadingHistory ? (
                      <tr><td colSpan={5} className="p-8 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" /> Loading courses...
                      </td></tr>
                    ) : filtered.length === 0 ? (
                      <tr><td colSpan={5} className="p-12 text-center">
                        <BookOpen className="w-10 h-10 mx-auto mb-3 text-blue-200" />
                        <p className="text-slate-500 font-medium">No course certificates issued yet.</p>
                      </td></tr>
                    ) : (
                      filtered.map(c => (
                        <tr key={c.id} className="transition-colors hover:bg-blue-50/50">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{c.student_name}</div>
                            <div className="font-mono text-xs text-slate-500 mt-0.5">{c.prn_no}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-800 text-sm">{c.course_name}</div>
                            {c.course_type && (
                              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${typeColors[c.course_type] || 'bg-slate-100 text-slate-600'}`}>
                                {c.course_type}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {c.grade && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800">
                                {c.grade}
                              </span>
                            )}
                            <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                              {c.duration && <><Clock className="w-3 h-3" /> {c.duration}</>}
                              {c.instructor_name && ` · ${c.instructor_name}`}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600 text-xs font-medium">
                            {c.issued_at ? new Date(c.issued_at).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            }) : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center gap-2 justify-end flex-wrap">
                              {c.pdf_url && (
                                <a href={c.pdf_url} target="_blank" rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-600 hover:text-white">
                                  <Download className="w-3.5 h-3.5" /> Certificate
                                </a>
                              )}
                              {c.tx_hash_data && (
                                <a href={`https://sepolia.etherscan.io/tx/${c.tx_hash_data}`} target="_blank" rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-600 hover:bg-sky-600 hover:text-white rounded-lg text-xs font-bold transition-colors border border-sky-100">
                                  <ExternalLink className="w-3.5 h-3.5" /> Etherscan
                                </a>
                              )}
                              {!c.pdf_url && !c.tx_hash_data && (
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

export default function CoursesPage() {
  return (
    <AdminShell>
      {(admin) => <CoursesContent currentUser={admin} />}
    </AdminShell>
  )
}
