'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ShieldCheck,
  XCircle,
  Loader2,
  RefreshCcw,
  ExternalLink,
  Award,
  Calendar,
  User,
  GraduationCap,
  Hash,
  Link2,
  AlertCircle,
  FileText,
  MapPin,
  CheckCircle2,
  Clock
} from 'lucide-react'

interface CertificateVerificationProps {
  certId?: string
  hash?: string
  tx?: string
}

interface VerificationResult {
  verified: boolean
  certificate?: any
  verification?: any
  blockchain?: any
  error?: string
}

export default function CertificateVerification({ certId, hash, tx }: CertificateVerificationProps) {
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [loading, setLoading] = useState(true)

  const formatValue = (value: unknown) => {
    if (value === null || value === undefined || value === '') return 'Not available'
    return String(value)
  }

  const formatDate = (value: unknown) => {
    if (!value) return 'Not available'
    const date = new Date(String(value))
    if (Number.isNaN(date.getTime())) return String(value)
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  useEffect(() => {
    verifyCertificate()
  }, [certId, hash, tx])

  const verifyCertificate = async () => {
    try {
      setLoading(true)

      if (!certId && !hash) {
        setResult({ verified: false, error: 'Certificate ID or hash is required for verification.' })
        return
      }

      const params = new URLSearchParams()
      if (certId) params.set('cert', certId)
      if (hash)   params.set('hash', hash)
      if (tx)     params.set('tx', tx)

      const response = await fetch(`/api/verify/certificate?${params.toString()}`)
      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({ verified: false, error: 'Network error: ' + error.message })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Verifying Credential</h2>
          <p className="text-slate-500 text-sm">Checking blockchain authenticity...</p>
        </div>
      </div>
    )
  }

  const isVerified = result?.verified

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-blue-700 font-bold text-xs uppercase tracking-widest mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            AuthBlock Verification
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
            Credential Verification
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto text-sm">
            Blockchain-verified academic credential from Fr. Conceicao Rodrigues College of Engineering
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
        >
          {/* Status Banner */}
          <div className={`px-6 py-8 text-center ${
            isVerified
              ? 'bg-emerald-50 border-b border-emerald-100'
              : 'bg-red-50 border-b border-red-100'
          }`}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15, delay: 0.1 }}
              className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                isVerified ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
              }`}
            >
              {isVerified ? <ShieldCheck className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
            </motion.div>

            <h2 className={`text-2xl font-extrabold mb-1 ${
              isVerified ? 'text-emerald-900' : 'text-red-900'
            }`}>
              {isVerified ? 'Credential Verified' : 'Verification Failed'}
            </h2>

            <p className={`text-sm font-medium ${isVerified ? 'text-emerald-600' : 'text-red-600'}`}>
              {isVerified
                ? 'This credential is authentic and anchored on the Ethereum blockchain'
                : result?.error || 'Credential could not be verified'
              }
            </p>
          </div>

          {/* Certificate Details */}
          {isVerified && result?.certificate && (
            <div className="divide-y divide-slate-100">

              {/* Student Info */}
              <div className="p-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> Student Information
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <InfoCell label="Student Name" value={result.certificate.student_name} />
                  <InfoCell label="PRN Number" value={result.certificate.prn_no} mono />
                  <InfoCell label="Serial Number" value={result.certificate.serial_no} mono />
                  <InfoCell label="Branch" value={result.certificate.branch} />
                </div>
              </div>

              {/* Academic Details */}
              <div className="p-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <GraduationCap className="w-3.5 h-3.5" /> Academic Details
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <InfoCell label="Examination" value={result.certificate.examination} />
                  <InfoCell label="Session" value={result.certificate.session || result.certificate.session_name} />
                  <InfoCell label="SGPI" value={result.certificate.sgpi} highlight />
                  <InfoCell label="CGPI" value={result.certificate.cgpi} highlight />
                  <div className="col-span-2">
                    <InfoCell label="Result" value={result.certificate.remarks} />
                  </div>
                </div>
              </div>

              {/* Verified Fields Table */}
              {result.certificate.ocr_coordinate_map && result.certificate.ocr_coordinate_map.length > 0 && (
                <div className="p-6">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" /> Blockchain-Anchored Fields
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    These exact values were hashed and stored on Ethereum. Any alteration will cause verification to fail.
                  </p>
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Field</th>
                          <th className="text-left px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Anchored Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.certificate.ocr_coordinate_map.map((entry: any, idx: number) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                            <td className="px-4 py-2 font-semibold text-slate-600 text-xs">{entry.field}</td>
                            <td className="px-4 py-2 font-mono text-slate-900 text-xs">{entry.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Verification Checks */}
              <div className="p-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Integrity Checks
                </h3>
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <CheckBadge label="Hash" valid={result.verification?.hash_valid} />
                  <CheckBadge label="Transaction" valid={result.verification?.transaction_valid} />
                  <CheckBadge label="Blockchain" valid={result.verification?.on_blockchain} />
                </div>

                <div className="space-y-2.5">
                  <HashRow label="Expected Hash (QR)" value={result.verification?.expected_hash} color="emerald" />
                  <HashRow label="Stored Data Hash (DB)" value={result.verification?.stored_data_hash} color="emerald" />
                  <HashRow label="Expected TX (QR)" value={result.verification?.expected_tx} color="blue" />
                  <HashRow label="Stored TX Hash (DB)" value={result.verification?.stored_tx} color="blue" />
                </div>
              </div>

              {/* Blockchain Anchors */}
              <div className="p-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5" /> Blockchain Anchors
                </h3>
                <div className="space-y-3">
                  <HashRow label="Data Hash (SHA-256)" value={result.blockchain?.data_hash} color="slate" />
                  <HashRow label="PDF Hash (SHA-256)" value={result.blockchain?.pdf_hash} color="slate" />

                  {result.blockchain?.tx_hash_data && (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Data Hash Transaction</p>
                      <p className="font-mono text-xs text-slate-700 break-all mb-2">{result.blockchain.tx_hash_data}</p>
                      {result.blockchain?.etherscan_data_url && (
                        <a href={result.blockchain.etherscan_data_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">
                          <ExternalLink className="w-3 h-3" /> View on Etherscan
                        </a>
                      )}
                    </div>
                  )}

                  {result.blockchain?.tx_hash_pdf && (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">PDF Hash Transaction</p>
                      <p className="font-mono text-xs text-slate-700 break-all mb-2">{result.blockchain.tx_hash_pdf}</p>
                      {result.blockchain?.etherscan_pdf_url && (
                        <a href={result.blockchain.etherscan_pdf_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">
                          <ExternalLink className="w-3 h-3" /> View on Etherscan
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Metadata */}
              <div className="p-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" /> Certificate Metadata
                </h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <InfoCell label="Certificate ID" value={result.certificate.id || result.certificate.certificate_id} mono />
                  <InfoCell label="Issue Date" value={formatDate(result.certificate.issued_at)} />
                  <InfoCell label="Issued By" value={result.certificate.issued_by || 'FRCRCE Admin'} />
                  <InfoCell label="On-chain Timestamp" value={formatDate(result.verification?.blockchain_timestamp)} />
                </div>

                {/* Document Links */}
                <div className="flex flex-wrap gap-3 mt-4">
                  {result.certificate?.marksheet_url && (
                    <a href={result.certificate.marksheet_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 hover:border-blue-300 rounded-lg text-xs font-bold text-slate-600 hover:text-blue-700 transition-colors">
                      <FileText className="w-3.5 h-3.5" /> View Marksheet
                    </a>
                  )}
                  {result.certificate?.certificate_url && (
                    <a href={result.certificate.certificate_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 hover:border-blue-300 rounded-lg text-xs font-bold text-slate-600 hover:text-blue-700 transition-colors">
                      <Award className="w-3.5 h-3.5" /> View Certificate
                    </a>
                  )}
                  {result.certificate?.verification_url && (
                    <a href={result.certificate.verification_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 hover:border-blue-300 rounded-lg text-xs font-bold text-slate-600 hover:text-blue-700 transition-colors">
                      <Link2 className="w-3.5 h-3.5" /> Verification Link
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error Details (failed verification) */}
          {!isVerified && result?.error && (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <h4 className="font-bold text-red-900 text-sm">Details</h4>
                </div>
                <p className="text-red-700 text-sm">{result.error}</p>

                {result.verification && (
                  <div className="mt-4 space-y-1.5">
                    <VerifyRow label="Hash validation" valid={result.verification.hash_valid} />
                    <VerifyRow label="Transaction validation" valid={result.verification.transaction_valid} />
                    <VerifyRow label="Blockchain verification" valid={result.verification.on_blockchain} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Link2 className="w-3 h-3" /> AuthBlock · Ethereum Blockchain
            </p>
            <button
              onClick={verifyCertificate}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors"
            >
              <RefreshCcw className="w-3 h-3" /> Verify Again
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

/* ── Helper Components ──────────────────────────────────────────── */

function InfoCell({ label, value, mono, highlight }: { label: string; value: unknown; mono?: boolean; highlight?: boolean }) {
  const v = value === null || value === undefined || value === '' ? 'Not available' : String(value)
  return (
    <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-sm font-bold ${highlight ? 'text-emerald-600 text-lg' : 'text-slate-900'} ${mono ? 'font-mono' : ''} break-all`}>{v}</p>
    </div>
  )
}

function CheckBadge({ label, valid }: { label: string; valid?: boolean }) {
  return (
    <div className={`rounded-xl px-4 py-3 border text-center ${valid ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-xs font-bold ${valid ? 'text-emerald-700' : 'text-red-700'}`}>
        {valid ? '✓ Valid' : '✗ Invalid'}
      </p>
    </div>
  )
}

function HashRow({ label, value, color }: { label: string; value: unknown; color: string }) {
  const v = value === null || value === undefined || value === '' ? 'Not available' : String(value)
  const bg = color === 'emerald' ? 'bg-emerald-50 border-emerald-100' : color === 'blue' ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-200'
  return (
    <div className={`${bg} rounded-xl px-4 py-3 border`}>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="font-mono text-xs text-slate-700 break-all">{v}</p>
    </div>
  )
}

function VerifyRow({ label, valid }: { label: string; valid?: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-600">{label}</span>
      <span className={valid ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
        {valid ? '✓ Valid' : '✗ Invalid'}
      </span>
    </div>
  )
}