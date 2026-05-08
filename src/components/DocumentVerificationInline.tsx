'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, XCircle, Loader2, ArrowRight, ShieldCheck, Edit3, Scan, FileSearch, Sparkles, RefreshCcw } from 'lucide-react'
import CertificateVerification from '@/components/CertificateVerification'
import Script from 'next/script'

export default function DocumentVerificationInline() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processStep, setProcessStep] = useState('')
  const [result, setResult] = useState<any>(null)
  const [extractedData, setExtractedData] = useState<any>(null)
  const [dragActive, setDragActive] = useState(false)
  const [verifiedCertId, setVerifiedCertId] = useState<string | null>(null)

  async function sha256(buffer: ArrayBuffer | Uint8Array) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer as BufferSource)
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
  }

  async function buildMarksheetCoordinateHash(fields: {
    name: string; prn_no: string; serial_no: string; examination: string;
    branch: string; session: string; sgpi: string; cgpi: string; remarks: string
  }): Promise<string> {
    const mapping = [
      { field: 'Branch',      value: fields.branch      || '' },
      { field: 'CGPI',        value: fields.cgpi        || '' },
      { field: 'Examination', value: fields.examination || '' },
      { field: 'Full Name',   value: fields.name        || '' },
      { field: 'PRN Number',  value: fields.prn_no      || '' },
      { field: 'Remarks',     value: fields.remarks     || '' },
      { field: 'SGPI',        value: fields.sgpi        || '' },
      { field: 'Serial No.',  value: fields.serial_no   || '' },
      { field: 'Session',     value: fields.session     || '' },
    ].sort((a, b) => a.field.localeCompare(b.field))
    return '0x' + await sha256(new TextEncoder().encode(JSON.stringify(mapping)))
  }

  const resetState = () => { setExtractedData(null); setResult(null); setProcessStep(''); setFile(null); setVerifiedCertId(null) }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false)
    if (e.dataTransfer.files?.[0]) { resetState(); setFile(e.dataTransfer.files[0]) }
  }

  const performVerification = async (hashToVerify: string, certId?: string) => {
    setProcessStep('Querying blockchain for hash authenticity...')
    try {
      const res = await fetch('/api/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hash: hashToVerify.startsWith('0x') ? hashToVerify : '0x' + hashToVerify }) })
      const data = await res.json()
      setResult(data)
      if (data.verified) setVerifiedCertId(certId || data?.record?.certificate_id || null)
    } catch (e: any) {
      setResult({ verified: false, message: 'Server error: ' + e.message })
    } finally { setIsProcessing(false); setProcessStep(''); setExtractedData(null) }
  }

  // Field-based search fallback (for re-saved PDFs / scanned copies)
  const performFieldSearch = async (fields: { doc_type?: string; student_name?: string; serial_no?: string; prn_no?: string; course_name?: string; examination?: string }) => {
    setProcessStep('Searching records by extracted text...')
    try {
      console.log('[Verify] Field search with:', fields)
      const res = await fetch('/api/verify/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
      })
      const data = await res.json()
      console.log('[Verify] Field search result:', data)
      setResult(data)
      if (data.verified) setVerifiedCertId(data?.record?.certificate_id || null)
    } catch (e: any) {
      setResult({ verified: false, message: 'Search failed: ' + e.message })
    } finally { setIsProcessing(false); setProcessStep(''); setExtractedData(null) }
  }

  // Detect document type from text content
  const detectDocType = (allText: string): 'degree' | 'course' | 'marksheet' | null => {
    const t = allText.toLowerCase()
    if (t.includes('has been awarded the degree') || t.includes('university of mumbai') && t.includes('degree of')) return 'degree'
    if (t.includes('successfully completed') && (t.includes('conducted from') || t.includes('total duration'))) return 'course'
    if (t.includes('sgpi') || t.includes('cgpi') || t.includes('examination') || t.includes('marksheet')) return 'marksheet'
    return null
  }

  const performPdfTextExtraction = async (page: any): Promise<boolean> => {
    setProcessStep('Extracting text layer from PDF...')
    const content = await page.getTextContent()
    const items = content.items as any[]
    if (items.length < 5) return false

    const allText = items.map((i: any) => i.str || '').join(' ')
    const docType = detectDocType(allText)
    console.log('[Verify] Detected document type:', docType, '| Text items:', items.length)

    const extractAtCoord = (targetX: number, targetY: number, tol = 5, maxW = 200): string => {
      return items.filter(i => i.str?.trim() && Math.abs(i.transform[5] - targetY) <= tol && i.transform[4] >= targetX - 10 && i.transform[4] <= targetX + maxW)
        .sort((a, b) => a.transform[4] - b.transform[4]).map(i => i.str.trim()).join(' ').trim()
    }
    const extractLineFrom = (startX: number, targetY: number, tol = 5): string => {
      return items.filter(i => i.str?.trim() && Math.abs(i.transform[5] - targetY) <= tol && i.transform[4] >= startX - 5)
        .sort((a, b) => a.transform[4] - b.transform[4]).map(i => i.str.trim()).join(' ').trim()
    }
    // Extract centered text at a given Y coordinate
    const extractCentered = (targetY: number, tol = 8): string => {
      return items.filter(i => i.str?.trim() && Math.abs(i.transform[5] - targetY) <= tol)
        .sort((a, b) => a.transform[4] - b.transform[4]).map(i => i.str.trim()).join(' ').trim()
    }

    // ── DEGREE extraction ────────────────────────────────────────
    if (docType === 'degree') {
      setProcessStep('Detected degree certificate — extracting fields...')
      // Student name at y≈355, serial at y≈48 (bottom-right)
      const student_name = extractCentered(355, 10) || extractCentered(283, 10)
      const serial_no = extractAtCoord(640, 48, 8, 120) || extractAtCoord(655, 120, 8, 120)
      console.log('[Verify] Degree extraction:', { student_name, serial_no })

      if (student_name || serial_no) {
        await performFieldSearch({ doc_type: 'degree', student_name, serial_no })
        return true
      }
      return false
    }

    // ── COURSE extraction ────────────────────────────────────────
    if (docType === 'course') {
      setProcessStep('Detected course certificate — extracting fields...')
      const student_name = extractCentered(283, 10) || extractCentered(315, 10)
      const course_name = extractCentered(244, 10) || extractCentered(260, 10)
      const prn_no = extractAtCoord(640, 120, 8, 120) || extractAtCoord(680, 75, 8, 100)
      console.log('[Verify] Course extraction:', { student_name, course_name, prn_no })

      if (student_name || course_name) {
        await performFieldSearch({ doc_type: 'course', student_name, course_name, prn_no })
        return true
      }
      return false
    }

    // ── MARKSHEET extraction (existing logic) ────────────────────
    const isAuthblockCert = items.some((i: any) => i.str?.includes('AUTHBLOCK'))
    let name = '', prn_no = '', serial_no = '', examination = '', branch = '', session = '', sgpi = '', cgpi = '', remarks = '', certificate_id = ''

    if (isAuthblockCert) {
      name = extractAtCoord(40, 623, 6, 260); serial_no = extractAtCoord(310, 623, 6, 200)
      prn_no = extractAtCoord(40, 588, 6, 200); branch = extractAtCoord(310, 588, 6, 200)
      examination = extractAtCoord(40, 525, 6, 260); session = extractAtCoord(310, 525, 6, 200)
      sgpi = extractAtCoord(40, 479, 6, 100); cgpi = extractAtCoord(160, 479, 6, 100)
      remarks = extractAtCoord(310, 479, 6, 200); certificate_id = extractAtCoord(118, 696, 6, 300)
      serial_no = serial_no === '—' ? '' : serial_no
    } else {
      serial_no = extractAtCoord(440, 685, 5, 120); name = extractLineFrom(150, 647, 3)
      examination = extractLineFrom(150, 630, 3); branch = extractLineFrom(150, 612, 3)
      session = extractLineFrom(150, 595, 3); prn_no = extractAtCoord(150, 580, 3, 150)
      remarks = extractAtCoord(130, 118, 5, 100); sgpi = extractAtCoord(277, 118, 5, 50); cgpi = extractAtCoord(335, 118, 5, 50)
    }

    if (!name && !prn_no && !serial_no) return false

    // Try data hash first (exact field match)
    const hash = await buildMarksheetCoordinateHash({ name, prn_no, serial_no, examination, branch, session, sgpi, cgpi, remarks })
    setProcessStep('Trying data hash verification...')
    try {
      const res = await fetch('/api/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hash }) })
      const data = await res.json()
      if (data?.verified) {
        setResult(data)
        setVerifiedCertId(certificate_id || data?.record?.certificate_id || null)
        setIsProcessing(false); setProcessStep('')
        return true
      }
    } catch {}

    // Fall back to field search if hash doesn't match
    console.log('[Verify] Data hash didn\'t match, trying field search...')
    await performFieldSearch({ doc_type: 'marksheet', student_name: name, serial_no, prn_no, examination })
    return true
  }

  const performOcrExtraction = async (sourceElement: HTMLImageElement | HTMLCanvasElement) => {
    setProcessStep('Sending to OCR API...')
    let sourceCanvas: HTMLCanvasElement
    if (sourceElement instanceof HTMLCanvasElement) { sourceCanvas = sourceElement }
    else { sourceCanvas = document.createElement('canvas'); sourceCanvas.width = sourceElement.naturalWidth; sourceCanvas.height = sourceElement.naturalHeight; sourceCanvas.getContext('2d')!.drawImage(sourceElement, 0, 0) }

    const blob = await new Promise<Blob>(resolve => sourceCanvas.toBlob(b => resolve(b!), 'image/png', 1.0))
    const formData = new FormData(); formData.append('file', blob, 'document.png')
    try {
      const res = await fetch('/api/ocr', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const ef = data.extractedData

      // Try hash-based verification first
      const hash = await buildMarksheetCoordinateHash({ name: ef.name||'', prn_no: ef.prn_no||'', serial_no: ef.serial_no||'', examination: ef.examination||'', branch: ef.branch||'', session: ef.session||'', sgpi: ef.sgpi||'', cgpi: ef.cgpi||'', remarks: ef.remarks||'' })
      try {
        const vRes = await fetch('/api/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hash }) })
        const vData = await vRes.json()
        if (vData?.verified) {
          setResult(vData)
          setVerifiedCertId(ef.certificate_id || vData?.record?.certificate_id || null)
          setIsProcessing(false); setProcessStep('')
          return
        }
      } catch {}

      // Fall back to field search
      await performFieldSearch({
        student_name: ef.name || '',
        serial_no: ef.serial_no || '',
        prn_no: ef.prn_no || '',
        examination: ef.examination || ''
      })
    } catch (e: any) {
      setResult({ verified: false, message: 'OCR failed: ' + e.message })
      setIsProcessing(false); setProcessStep('')
    }
  }

  const handleProcess = async () => {
    if (!file) return
    setIsProcessing(true); setExtractedData(null); setResult(null)
    try {
      if (file.type === 'application/pdf') {
        setProcessStep('Computing SHA-256 hash of PDF bytes...')
        const buffer = await file.arrayBuffer()
        const pdfHash = await sha256(buffer)
        console.log('[Verify] PDF hash computed:', pdfHash.substring(0, 20) + '...')

        // Step 1: Try direct PDF hash match (works for degree, marksheet, course)
        setProcessStep('Verifying PDF hash against blockchain...')
        try {
          const res = await fetch('/api/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hash: '0x' + pdfHash })
          })
          const pdfRes = await res.json()
          console.log('[Verify] PDF hash API response:', pdfRes)

          if (pdfRes?.verified) {
            setResult(pdfRes)
            setVerifiedCertId(pdfRes?.record?.certificate_id || null)
            setIsProcessing(false)
            return
          }
        } catch (e) {
          console.error('[Verify] PDF hash check failed:', e)
        }

        // Step 2: If PDF hash not found, try text extraction (marksheets only)
        setProcessStep('PDF hash not found. Trying text-layer extraction...')
        const pdfjsLib = (window as any)['pdfjs-dist/build/pdf']
        if (!pdfjsLib) throw new Error('PDF.js not loaded yet. Please try again.')
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise
        const page = await pdf.getPage(1)
        const textExtracted = await performPdfTextExtraction(page)
        if (!textExtracted) {
          // Step 3: Fall back to visual OCR (scanned documents)
          setProcessStep('Falling back to visual OCR...')
          const viewport = page.getViewport({ scale: 2.5 })
          const canvas = document.createElement('canvas')
          canvas.width = viewport.width; canvas.height = viewport.height
          await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise
          await performOcrExtraction(canvas)
        }
      } else if (file.type.startsWith('image/')) {
        setProcessStep('Loading image...')
        const img = new Image(); img.src = URL.createObjectURL(file)
        await new Promise(r => { img.onload = r })
        await performOcrExtraction(img)
      } else { throw new Error('Unsupported file type. Upload a PDF or image.') }
    } catch (e: any) {
      setResult({ verified: false, message: e.message || 'Verification error.' })
      setIsProcessing(false); setProcessStep('')
    }
  }

  return (
    <div className="w-full">
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js" strategy="afterInteractive" onLoad={() => {
        const p = (window as any)['pdfjs-dist/build/pdf']
        if (p) p.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
      }} />

      <AnimatePresence mode="wait">
        {!extractedData && !result && (
          <motion.div key="dropzone" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="w-full max-w-2xl mx-auto">
            <div
              className={`relative overflow-hidden border-2 border-dashed rounded-3xl p-10 text-center transition-all duration-300 cursor-pointer ${dragActive ? 'border-emerald-500 bg-emerald-50/50' : file ? 'border-emerald-200 bg-white shadow-lg' : 'border-slate-300 bg-white hover:border-emerald-400 hover:bg-emerald-50/30'}`}
              onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            >
              {!file ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center">
                    <Upload className="w-7 h-7 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-1">Upload Document</h3>
                    <p className="text-slate-500 text-sm">Drag & drop your PDF or scanned image here</p>
                  </div>
                  <label className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold cursor-pointer hover:bg-emerald-700 transition-colors">
                    <ArrowRight className="w-4 h-4" /> Browse Files
                    <input type="file" className="hidden" accept=".pdf,image/png,image/jpeg" onChange={e => e.target.files && (resetState(), setFile(e.target.files[0]))} />
                  </label>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isProcessing ? 'bg-emerald-50 animate-pulse' : 'bg-emerald-50'}`}>
                    {isProcessing ? <Scan className="w-8 h-8 text-emerald-500 animate-spin" /> : <FileText className="w-8 h-8 text-emerald-600" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 truncate max-w-sm">{file.name}</h3>
                    <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  {!isProcessing ? (
                    <div className="flex gap-3">
                      <button onClick={() => setFile(null)} className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors text-sm">Clear</button>
                      <button onClick={handleProcess} className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-2 text-sm">
                        <Sparkles className="w-4 h-4" /> Start Verification
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 w-full max-w-xs">
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div className="h-full bg-gradient-to-r from-emerald-500 to-blue-500" initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }} />
                      </div>
                      <p className="text-sm font-medium text-slate-600 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> {processStep || 'Analyzing...'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {result && (
          <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
            {result.verified && (verifiedCertId || result?.record?.data_hash) ? (
              <div>
                <CertificateVerification certId={verifiedCertId || undefined} hash={result?.record?.data_hash || result?.record?.pdf_hash} tx={result?.txHash || result?.record?.tx_hash_data} />
                <div className="flex justify-center mt-6">
                  <button onClick={resetState} className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-white border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors">
                    <RefreshCcw className="w-4 h-4" /> Verify Another
                  </button>
                </div>
              </div>
            ) : (
              <div className={`max-w-2xl mx-auto rounded-2xl overflow-hidden border ${result.verified ? 'border-emerald-200' : 'border-red-200'}`}>
                <div className={`p-10 text-center ${result.verified ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${result.verified ? 'bg-emerald-500' : 'bg-red-500'}`}>
                    {result.verified ? <ShieldCheck className="w-10 h-10 text-white" /> : <XCircle className="w-10 h-10 text-white" />}
                  </div>
                  <h2 className={`text-2xl font-extrabold mb-3 ${result.verified ? 'text-emerald-900' : 'text-red-900'}`}>
                    {result.verified ? 'Authenticity Verified' : 'Verification Failed'}
                  </h2>
                  <p className={`text-sm leading-relaxed ${result.verified ? 'text-emerald-700' : 'text-red-700'}`}>
                    {result.message || (result.verified ? 'Hash matches blockchain record.' : 'No matching record found on blockchain.')}
                  </p>
                </div>
                <div className="p-5 bg-white flex justify-center border-t">
                  <button onClick={resetState} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold border-2 transition-colors ${result.verified ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50' : 'border-red-200 text-red-700 hover:bg-red-50'}`}>
                    <RefreshCcw className="w-4 h-4" /> Try Another
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
