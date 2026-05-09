'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
// @ts-ignore
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import {
  GraduationCap, FileSignature, AlertCircle, Loader2,
  CheckCircle, Search, History, Download, ExternalLink, UploadCloud, FileText
} from 'lucide-react'
import AdminShell, { type AdminRecord } from '@/components/admin/AdminShell'
import ProcessingTerminal, { type TerminalLog } from '@/components/admin/ProcessingTerminal'

// ── Shared sub-components ──────────────────────────────────────────

function Label({ required, children }: { required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      {children}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────

function DegreesContent({ currentUser }: { currentUser: AdminRecord }) {
  const [activeTab, setActiveTab] = useState<'manual' | 'bulk' | 'history'>('manual')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successData, setSuccessData] = useState<{ url: string; degree_url: string; cert_url: string; tx: string } | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Processing steps state
  const [processingSteps, setProcessingSteps] = useState<{ label: string; status: 'pending' | 'active' | 'done' | 'error' }[]>([])
  const [showProcessing, setShowProcessing] = useState(false)

  // Terminal processing state (bulk)
  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([])
  const [terminalActive, setTerminalActive] = useState(false)
  const [terminalComplete, setTerminalComplete] = useState(false)
  const [terminalCurrentIndex, setTerminalCurrentIndex] = useState(0)
  const [terminalTotalCount, setTerminalTotalCount] = useState(0)
  const [terminalSuccessCount, setTerminalSuccessCount] = useState(0)
  const [terminalErrorCount, setTerminalErrorCount] = useState(0)

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
      { label: 'Registering hash on Ethereum blockchain...', status: 'pending' as const },
      { label: 'Generating degree certificate PDF...', status: 'pending' as const },
      { label: 'Uploading to cloud storage...', status: 'pending' as const },
      { label: 'Saving to database...', status: 'pending' as const },
    ]
    setProcessingSteps(steps)
    setShowProcessing(true)

    // Simulate step progress alongside the actual API call
    try {
      updateStep(0, 'active')
      await new Promise(r => setTimeout(r, 400))
      updateStep(0, 'done')

      updateStep(1, 'active')
      await new Promise(r => setTimeout(r, 300))
      updateStep(1, 'done')

      updateStep(2, 'active')

      const res = await fetch('/api/admin/degrees/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, issued_by: currentUser.id })
      })
      const data = await res.json()

      if (!res.ok) {
        updateStep(2, 'error')
        throw new Error(data.error || 'Failed to issue degree certificate')
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

      setSuccessData({ url: data.certificate?.url || '', degree_url: data.certificate?.degree_url || '', cert_url: data.certificate?.cert_url || '', tx: data.certificate?.tx_data || '' })
      setFormData({
        serial_no: '', student_name: '', student_email: '', prn_no: '',
        branch: '', degree_title: 'Bachelor of Engineering',
        enrollment_year: '', year_of_passing: '', final_cgpi: '',
        classification: '', convocation_date: '',
      })
      fetchHistory()

      // Auto-hide processing after a moment
      setTimeout(() => setShowProcessing(false), 2000)
    } catch (err: any) {
      setError(err.message)
      setTimeout(() => setShowProcessing(false), 3000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const addLog = useCallback((message: string, status: TerminalLog['status'], txHash?: string) => {
    setTerminalLogs(prev => [...prev, { id: Date.now() + Math.random(), message, status, timestamp: new Date(), txHash }])
  }, [])

  const resetTerminal = useCallback(() => {
    setTerminalActive(false)
    setTerminalComplete(false)
    setTerminalLogs([])
    setTerminalCurrentIndex(0)
    setTerminalTotalCount(0)
    setTerminalSuccessCount(0)
    setTerminalErrorCount(0)
  }, [])

  // --- Bulk CSV/XLSX handler ---
  async function handleBulkUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsSubmitting(true)
    setError('')
    setSuccessData(null)

    const fileExt = file.name.split('.').pop()?.toLowerCase()
    let rows: any[] = []

    try {
      if (fileExt === 'csv') {
        const text = await file.text()
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true })
        rows = parsed.data
      } else if (fileExt === 'xlsx' || fileExt === 'xls') {
        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        rows = XLSX.utils.sheet_to_json(sheet)
      } else {
        throw new Error('Please upload a .csv or .xlsx file')
      }

      const validRows = rows.filter((r: any) => r.student_name?.toString().trim() && r.prn_no?.toString().trim())
      if (validRows.length === 0) throw new Error('No valid rows found. Ensure student_name and prn_no columns exist.')

      setTerminalTotalCount(validRows.length)
      setTerminalActive(true)
      setTerminalComplete(false)
      setTerminalLogs([])
      setTerminalCurrentIndex(0)
      setTerminalSuccessCount(0)
      setTerminalErrorCount(0)

      await new Promise(r => setTimeout(r, 300))
      addLog(`Starting bulk degree issuance for ${validRows.length} student(s)…`, 'info')
      addLog('Connecting to AuthBlock API…', 'info')
      await new Promise(r => setTimeout(r, 400))
      addLog('Connection established. Beginning degree generation.', 'info')

      let successCount = 0
      let errorCount = 0

      for (let idx = 0; idx < validRows.length; idx++) {
        const row = validRows[idx]
        const sName = row.student_name?.toString().trim()
        const sPrn = row.prn_no?.toString().trim()
        const rowLabel = `[${idx + 1}/${validRows.length}]`

        setTerminalCurrentIndex(idx + 1)
        addLog(`${rowLabel} Generating degree for ${sName || 'Unknown'} (PRN: ${sPrn || 'N/A'})…`, 'processing')

        try {
          const payload = {
            serial_no: row.serial_no || '',
            student_name: sName,
            student_email: row.student_email?.toString().trim() || '',
            prn_no: sPrn,
            branch: row.branch || '',
            degree_title: row.degree_title || 'Bachelor of Engineering',
            enrollment_year: row.enrollment_year || '',
            year_of_passing: row.year_of_passing || '',
            final_cgpi: row.final_cgpi || '',
            classification: row.classification || '',
            convocation_date: row.convocation_date || '',
            issued_by: currentUser.id
          }

          const res = await fetch('/api/admin/degrees/issue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })

          if (res.ok) {
            successCount++
            setTerminalSuccessCount(successCount)
            const data = await res.json()
            addLog(`${rowLabel} ✓ Degree issued for ${sName}`, 'success', data.certificate?.tx_data)
          } else {
            errorCount++
            setTerminalErrorCount(errorCount)
            const errData = await res.json().catch(() => ({}))
            addLog(`${rowLabel} ✗ Failed for ${sName} — ${errData.error || 'Server error'}`, 'error')
          }
        } catch (rowErr: any) {
          errorCount++
          setTerminalErrorCount(errorCount)
          addLog(`${rowLabel} ✗ Exception for ${sName}: ${rowErr.message}`, 'error')
        }
      }

      setTerminalComplete(true)
      if (successCount > 0) {
        addLog(`\nBulk processing complete: ${successCount} succeeded, ${errorCount} failed.`, 'info')
        fetchHistory()
      } else {
        addLog('No valid degrees were issued.', 'error')
      }
    } catch (err: any) {
      setError(err.message)
      if (terminalActive) setTerminalComplete(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  function downloadDegreeTemplate() {
    const headers = ['serial_no', 'student_name', 'student_email', 'prn_no', 'branch', 'degree_title', 'enrollment_year', 'year_of_passing', 'final_cgpi', 'classification', 'convocation_date']
    const row = ['05', 'JOHN DOE', 'john@example.com', '20230164000000', 'Computer Engineering', 'Bachelor of Engineering', '2020', '2024', '9.5', 'First Class with Distinction', '15 March 2026']
    const ws = XLSX.utils.aoa_to_sheet([headers, row])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Template')
    XLSX.writeFile(wb, 'Degree_Upload_Template.xlsx')
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
            <span className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-600">
              <GraduationCap className="w-5 h-5 text-white" />
            </span>
            Issue Degree Certificates
          </h1>
          <p className="text-base text-slate-500 mt-2">
            Issue blockchain-verified final degree certificates secured on Ethereum.
          </p>
        </div>
        {/* Live badge */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold bg-emerald-50 border-emerald-200 text-emerald-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          DegreeRegistry · Live
        </div>
      </motion.div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex items-center gap-2 px-6 py-4 font-bold transition-all text-sm uppercase tracking-wide border-b-2 ${
            activeTab === 'manual'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <FileSignature className="w-4 h-4" /> Manual Entry
        </button>
        <button
          onClick={() => setActiveTab('bulk')}
          className={`flex items-center gap-2 px-6 py-4 font-bold transition-all text-sm uppercase tracking-wide border-b-2 ${
            activeTab === 'bulk'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <UploadCloud className="w-4 h-4" /> Bulk CSV Upload
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-6 py-4 font-bold transition-all text-sm uppercase tracking-wide border-b-2 ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <History className="w-4 h-4" /> History
          {history.length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700">
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
                  {processingSteps.every(s => s.status === 'done') ? 'Degree Issued Successfully' : 'Issuing Degree Certificate...'}
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

          {/* Success banner */}
          {successData && (
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-blue-50 border border-blue-200 rounded-2xl text-blue-800"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-blue-500" />
                <div>
                  <h4 className="font-bold">Degree Certificate Issued!</h4>
                  <p className="text-sm opacity-80">Secured on Ethereum and uploaded to cloud storage.</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 shrink-0 border-t sm:border-l sm:border-t-0 border-blue-200/50 pt-3 sm:pt-0 sm:pl-4 mt-3 sm:mt-0">
                {successData.degree_url && (
                  <a href={successData.degree_url} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors">
                    <Download className="w-3.5 h-3.5" /> Degree PDF
                  </a>
                )}
                {successData.cert_url && (
                  <a href={successData.cert_url} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 text-blue-700 hover:border-blue-400 rounded-xl text-xs font-bold transition-colors">
                    <Download className="w-3.5 h-3.5" /> AuthBlock Cert
                  </a>
                )}
                {successData.tx && (
                  <a href={`https://sepolia.etherscan.io/tx/${successData.tx}`} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 text-blue-700 hover:border-blue-400 rounded-xl text-xs font-bold transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" /> Etherscan
                  </a>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'manual' ? (
            <form onSubmit={handleSubmit} className="glass-card p-6 md:p-8">



              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">

                {/* Left: Student Info */}
                <div className="space-y-5">
                  <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center">
                      <GraduationCap className="w-3 h-3 text-blue-600" />
                    </span>
                    Student Information
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Serial No.">
                      <input type="text" className="input font-medium font-mono text-blue-700"
                        value={formData.serial_no} onChange={set('serial_no')} />
                    </Field>
                    <Field label="PRN No." required>
                      <input type="text" required className="input font-medium font-mono"
                        value={formData.prn_no} onChange={set('prn_no')} />
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Full Name" required>
                      <input type="text" required className="input font-medium"
                        value={formData.student_name} onChange={set('student_name')} />
                    </Field>
                    <Field label="Email Address">
                      <input type="email" placeholder="Optional" className="input font-medium"
                        value={formData.student_email} onChange={set('student_email')} />
                    </Field>
                  </div>

                  <Field label="Branch / Programme" required>
                    <input type="text" required className="input font-medium"
                      placeholder="e.g. Computer Engineering"
                      value={formData.branch} onChange={set('branch')} />
                  </Field>

                  <Field label="Degree Title" required>
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
                    <span className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center">
                      <GraduationCap className="w-3 h-3 text-blue-600" />
                    </span>
                    Academic Details
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Enrollment Year" required>
                      <input type="text" required className="input font-medium" placeholder="e.g. 2020"
                        value={formData.enrollment_year} onChange={set('enrollment_year')} />
                    </Field>
                    <Field label="Year of Passing" required>
                      <input type="text" required className="input font-medium" placeholder="e.g. 2024"
                        value={formData.year_of_passing} onChange={set('year_of_passing')} />
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Final CGPI" required>
                      <input type="text" required className="input font-medium" placeholder="e.g. 9.31"
                        value={formData.final_cgpi} onChange={set('final_cgpi')} />
                    </Field>
                    <Field label="Classification" required>
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
                      className="p-4 rounded-xl border bg-blue-50 border-blue-200"
                    >
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Preview</p>
                      <p className="font-bold text-slate-800 text-sm">{formData.student_name || '—'}</p>
                      <p className="text-xs text-slate-500">{formData.degree_title} · {formData.branch || '—'}</p>
                      <p className="text-xs text-slate-500">{formData.enrollment_year || '—'} – {formData.year_of_passing || '—'}</p>
                      {formData.final_cgpi && (
                        <p className="text-xs font-bold text-blue-700 mt-1">CGPI: {formData.final_cgpi} · {formData.classification}</p>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-w-[220px] flex items-center justify-center gap-2 py-3 px-8 font-semibold text-white rounded-lg transition-colors disabled:opacity-60 bg-blue-600 hover:bg-blue-700 border border-blue-700"
                >
                  {isSubmitting
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating on Blockchain...</>
                    : <><GraduationCap className="w-5 h-5" /> Issue Degree Certificate</>
                  }
                </button>
              </div>
            </form>
          ) : activeTab === 'bulk' ? (
            terminalActive ? (
              <ProcessingTerminal
                logs={terminalLogs}
                currentIndex={terminalCurrentIndex}
                totalCount={terminalTotalCount}
                isComplete={terminalComplete}
                successCount={terminalSuccessCount}
                errorCount={terminalErrorCount}
                onReset={resetTerminal}
              />
            ) : (
            <div className="glass-card p-12 text-center rounded-3xl border-dashed">
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <GraduationCap className="w-8 h-8 text-amber-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Bulk Degree Issuance</h2>
              <p className="text-slate-500 max-w-md mx-auto mb-8">
                Upload a .CSV or .XLSX containing student data to issue multiple degree certificates concurrently.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <label className="bg-blue-600 hover:bg-blue-700 text-white transition-all font-semibold rounded-xl cursor-pointer flex items-center justify-center gap-2 py-3.5 px-8 min-w-[200px]">
                  <UploadCloud className="w-5 h-5" /> Choose File
                  <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleBulkUpload} disabled={isSubmitting} />
                </label>
                <button onClick={downloadDegreeTemplate} type="button" className="flex items-center gap-2 py-3.5 px-8 font-semibold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-xl transition-colors min-w-[200px] justify-center">
                  <Download className="w-5 h-5" /> Download Template
                </button>
              </div>

              <div className="mt-8 text-left max-w-lg mx-auto bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Required Columns</h3>
                <div className="flex flex-wrap gap-1.5">
                  {['serial_no','student_name','student_email','prn_no','branch','degree_title','enrollment_year','year_of_passing','final_cgpi','classification','convocation_date'].map(col => (
                    <span key={col} className="text-[10px] font-mono font-bold bg-white border border-slate-200 px-2 py-1 rounded text-slate-600">{col}</span>
                  ))}
                </div>
              </div>
            </div>
            )
          ) : activeTab === 'history' ? (
            <div className="glass-card overflow-hidden">
              <div className="p-4 bg-blue-50 border-b border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="font-bold text-blue-900 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" /> Issued Degree Certificates
                  <span className="text-xs font-normal text-blue-600">({history.length} total)</span>
                </h2>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search name, PRN or degree..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 border border-blue-200 rounded-lg text-sm font-medium outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full sm:w-[280px] bg-white"
                    />
                  </div>
                  <button
                    onClick={fetchHistory}
                    disabled={loadingHistory}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition disabled:opacity-50"
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
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-2" /> Loading degrees...
                      </td></tr>
                    ) : filtered.length === 0 ? (
                      <tr><td colSpan={5} className="p-12 text-center">
                        <GraduationCap className="w-10 h-10 text-blue-200 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">No degree certificates issued yet.</p>
                      </td></tr>
                    ) : (
                      filtered.map(d => (
                        <tr key={d.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{d.student_name}</div>
                            <div className="font-mono text-xs text-slate-500 mt-0.5">{d.prn_no}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-blue-800 text-sm">{d.degree_title}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{d.branch} · {d.enrollment_year}–{d.year_of_passing}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-800">
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
                                <a href={d.pdf_url.replace('-certificate.pdf', '-degree.pdf').replace(/\/([^/]+)\.pdf$/, '/$1.pdf')} target="_blank" rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white rounded-lg text-xs font-bold transition-colors border border-amber-200">
                                  <Download className="w-3.5 h-3.5" /> Degree
                                </a>
                              )}
                              {d.pdf_url && (
                                <a href={d.pdf_url} target="_blank" rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold transition-colors border border-blue-200">
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
          ) : null}
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
