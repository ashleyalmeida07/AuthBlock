'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, ArrowRight, ShieldCheck, GraduationCap, AlertCircle, Hash, User, ArrowLeft, Lock } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage() {
  const router  = useRouter()
  const [prn, setPrn]           = useState('')
  const [fullName, setFullName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]       = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prn_no: prn.trim(), full_name: fullName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to login')
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-50"
      style={{
        backgroundImage:
          'linear-gradient(to right, rgba(203,213,225,0.3) 1px, transparent 1px),' +
          'linear-gradient(to bottom, rgba(203,213,225,0.3) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }}
    >
      {/* ── Left panel — branding ──────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-10 bg-white border-r border-slate-200 relative overflow-hidden">

        {/* Subtle top-right glow */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-30" style={{ background: '#BFDBFE' }} />

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2.5 mb-12 hover:opacity-80 transition-opacity w-fit">
            <Image src="/logo.png" alt="Authblock" width={30} height={30} />
            <span className="text-sm font-bold tracking-widest text-slate-900 uppercase">AuthBlock</span>
          </Link>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-bold text-blue-700 uppercase tracking-[0.15em]">
              <GraduationCap className="w-3 h-3" /> Student Portal
            </div>
            <h2 className="text-2xl font-bold text-slate-900 leading-tight">
              Your Academic<br />Identity, On-Chain.
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              AuthBlock ties your credentials to a single cryptographic anchor — tamper-proof and verifiable anywhere in the world.
            </p>
          </div>
        </div>

        {/* Bottom info */}
        <div className="relative z-10 space-y-3">
          {/* Verified badge card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Blockchain Verified</p>
                <p className="text-[10px] text-slate-400">Sepolia Ethereum Network</p>
              </div>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-full rounded-full" />
            </div>
          </div>

          {/* Info rows */}
          {[
            { label: 'Documents', value: 'Marksheet · Degree · Course' },
            { label: 'Storage', value: 'Supabase + Blockchain Hash' },
            { label: 'Network', value: 'Ethereum Sepolia' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-[11px] text-slate-400">{item.label}</span>
              <span className="text-[11px] font-semibold text-slate-600">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — form ────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative">

        {/* Back link */}
        <Link
          href="/"
          className="absolute top-6 left-6 flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to home
        </Link>

        <div className="w-full max-w-[380px]">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <Image src="/logo.png" alt="Authblock" width={26} height={26} />
            <span className="text-sm font-bold tracking-widest text-slate-900 uppercase">AuthBlock</span>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Blue top accent */}
            <div className="h-1 bg-gradient-to-r from-blue-600 to-blue-400" />

            <div className="p-8">
              {/* Header */}
              <div className="mb-7">
                <h1 className="text-xl font-bold text-slate-900 mb-1">Student Portal</h1>
                <p className="text-sm text-slate-500">Enter your details to access your credentials.</p>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="mb-5 p-3.5 rounded-xl flex items-start gap-3 bg-red-50 border border-red-200"
                  >
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-medium text-red-700">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleLogin} className="space-y-4">
                {/* PRN */}
                <div className="space-y-1.5">
                  <label htmlFor="prn" className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                    PRN Number
                  </label>
                  <div className="relative">
                    <input
                      id="prn"
                      type="text"
                      required
                      value={prn}
                      onChange={e => setPrn(e.target.value)}
                      placeholder="e.g. 2021BTCS001"
                      className="w-full px-4 py-2.5 pr-10 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-800 placeholder-slate-300 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                    />
                    <Hash className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  </div>
                </div>

                {/* Full Name */}
                <div className="space-y-1.5">
                  <label htmlFor="fullName" className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      id="fullName"
                      type="text"
                      required
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="As registered in records"
                      className="w-full px-4 py-2.5 pr-10 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-800 placeholder-slate-300 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                    />
                    <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 mt-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all duration-200 hover:shadow-lg hover:shadow-blue-600/25 disabled:opacity-60 disabled:pointer-events-none"
                >
                  {isLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating…</>
                    : <>View Credentials <ArrowRight className="w-4 h-4" /></>
                  }
                </button>
              </form>

              {/* Security notice */}
              <div className="mt-5 flex items-start gap-2 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Your credentials are secured on the Ethereum blockchain — only you can access them with your registered details.
                </p>
              </div>
            </div>
          </div>

          {/* Guest verify link */}
          <div className="mt-5 text-center">
            <Link
              href="/verify"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-blue-600 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Not a student? Verify a document instead
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
