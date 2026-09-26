'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, ArrowRight, ShieldCheck, GraduationCap, AlertCircle, Hash, User, ArrowLeft, Lock } from 'lucide-react'
import Link from 'next/link'
import { Logo } from '@/components/ui'

export default function LoginPage() {
  const router = useRouter()
  const [prn, setPrn] = useState('')
  const [fullName, setFullName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const res = await fetch('/api/student-login', {
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
    <div className="min-h-screen flex bg-brand-bg relative overflow-hidden">

      {/* ── Left panel — branding ──────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-10 bg-white border-r border-brand-border/50 relative overflow-hidden">

        {/* Subtle top-right glow */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-30" style={{ background: '#2563EB' }} />

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 mb-12 hover:opacity-80 transition-opacity w-fit">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-brand-navy">
              <Logo className="w-5 h-5" fill="white" />
            </div>
            <span className="text-sm font-bold tracking-widest text-brand-navy uppercase">AuthBlock</span>
          </Link>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-soft/50 border border-brand-blue/20 text-[10px] font-bold text-brand-blue uppercase tracking-[0.15em]">
              <GraduationCap className="w-3 h-3" /> Student Portal
            </div>
            <h2 className="text-3xl font-light text-brand-heading leading-tight">
              Your Academic<br />Identity, On-Chain.
            </h2>
            <p className="text-sm text-brand-navy/60 leading-relaxed max-w-xs">
              AuthBlock ties your credentials to a single cryptographic anchor — tamper-proof and verifiable anywhere in the world.
            </p>
          </div>
        </div>

        {/* Bottom info */}
        <div className="relative z-10 space-y-3">


          {/* Info rows */}
          {[
            { label: 'Documents', value: 'Marksheet · Degree' },
            { label: 'Storage', value: 'Supabase + Blockchain Hash' },
            { label: 'Network', value: 'Ethereum Sepolia' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-brand-border/30">
              <span className="text-[11px] text-brand-navy/50">{item.label}</span>
              <span className="text-[11px] font-semibold text-brand-navy">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — form ────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
        
        {/* Center glowing orb behind form */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-blue opacity-10 blur-[100px] rounded-full pointer-events-none" />

        {/* Back link */}
        <Link
          href="/"
          className="absolute top-6 left-6 flex items-center gap-1.5 text-xs font-medium text-brand-navy/50 hover:text-brand-navy transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to home
        </Link>

        <div className="w-full max-w-[380px]">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-brand-navy">
              <Logo className="w-4 h-4" fill="white" />
            </div>
            <span className="text-sm font-bold tracking-widest text-brand-navy uppercase">AuthBlock</span>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl border border-brand-border shadow-sm overflow-hidden">
            <div className="p-8">
              {/* Header */}
              <div className="mb-7">
                <h1 className="text-xl font-medium text-brand-heading mb-1.5">Student Portal</h1>
                <p className="text-sm text-brand-navy/60">Enter your details to access your credentials.</p>
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
                  <label htmlFor="prn" className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-navy/50">
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
                      className="w-full px-4 py-3 pr-10 bg-brand-bg border border-brand-border/50 rounded-xl text-sm font-medium text-brand-navy placeholder-brand-navy/30 outline-none transition-all focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10"
                    />
                    <Hash className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-navy/30" />
                  </div>
                </div>

                {/* Full Name */}
                <div className="space-y-1.5">
                  <label htmlFor="fullName" className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-navy/50">
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
                      className="w-full px-4 py-3 pr-10 bg-brand-bg border border-brand-border/50 rounded-xl text-sm font-medium text-brand-navy placeholder-brand-navy/30 outline-none transition-all focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/10"
                    />
                    <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-navy/30" />
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 mt-4 py-3.5 bg-brand-blue hover:bg-brand-bright text-white font-medium rounded-full text-sm transition-all duration-300 hover:shadow-blue-glow hover:-translate-y-0.5 disabled:opacity-60 disabled:pointer-events-none"
                >
                  {isLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating…</>
                    : <>View Credentials <ArrowRight className="w-4 h-4" /></>
                  }
                </button>
              </form>

              {/* Security notice */}
              <div className="mt-6 flex items-start gap-2.5 p-4 rounded-2xl bg-brand-bg border border-brand-border/50">
                <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5 text-brand-navy/40" />
                <p className="text-[11px] text-brand-navy/50 leading-relaxed">
                  Your credentials are secured on the Ethereum blockchain — only you can access them with your registered details.
                </p>
              </div>
            </div>
          </div>

          {/* Guest verify link */}
          <div className="mt-6 text-center">
            <Link
              href="/verify"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-navy/50 hover:text-brand-blue transition-colors"
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
