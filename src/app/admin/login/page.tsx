'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { ArrowLeft, AlertCircle, Loader2, Lock } from 'lucide-react'
import { Logo } from '@/components/ui'

type Status = 'idle' | 'loading' | 'error'

const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
)

function AdminLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam === 'AccessDenied') {
      setStatus('error')
      setErrorMsg('Access Denied. Your email is not registered as an admin.')
    } else if (errorParam) {
      setStatus('error')
      setErrorMsg('An error occurred during sign in.')
    }
  }, [searchParams])

  async function handleGoogleSignIn() {
    setStatus('loading')
    setErrorMsg('')

    try {
      await signIn('google', { callbackUrl: '/admin/dashboard' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setErrorMsg(msg)
      setStatus('error')
    }
  }

  const isLoading = status === 'loading'

  return (
    <div className="min-h-screen flex bg-brand-bg"
      style={{
        backgroundImage:
          'linear-gradient(to right, rgba(7, 20, 61, 0.05) 1px, transparent 1px),' +
          'linear-gradient(to bottom, rgba(7, 20, 61, 0.05) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }}
    >
      {/* ── Left panel — white branding ─────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[400px] shrink-0 p-10 bg-white border-r border-brand-border/50 relative">

        {/* Logo */}
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-brand-navy">
              <Logo className="w-5 h-5" fill="white" />
            </div>
            <span className="text-sm font-bold tracking-widest text-brand-navy uppercase">AuthBlock</span>
          </div>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-brand-soft/50 text-brand-blue border border-brand-blue/20">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-blue animate-pulse" />
              Restricted Access
            </div>
            <h1 className="text-3xl font-light text-brand-heading leading-tight">
              Admin<br />Portal
            </h1>
            <p className="text-sm leading-relaxed text-brand-navy/60">
              Issue and manage blockchain-verified academic credentials securely.
            </p>
          </div>
        </div>

        {/* Bottom info cards */}
        <div className="space-y-3">
          {[
            { label: 'Smart Contracts', value: '4 Active', color: 'text-emerald-600' },
            { label: 'Network', value: 'Ethereum Sepolia', color: 'text-brand-blue' },
            { label: 'Documents', value: 'Marksheet · Degree', color: 'text-amber-600' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-brand-border/30">
              <span className="text-xs text-brand-navy/60">{item.label}</span>
              <span className={`text-xs font-semibold font-mono ${item.color}`}>{item.value}</span>
            </div>
          ))}

          {/* Powered by Ethereum badge */}
          <div className="flex items-center gap-2 pt-2">
            <span className="text-xs text-brand-navy/40">Secured by Ethereum blockchain</span>
          </div>
        </div>
      </div>

      {/* ── Right panel — login form ─────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative">

        {/* Back to site */}
        <Link
          href="/"
          className="absolute top-6 left-6 flex items-center gap-1.5 text-xs font-medium text-brand-navy/50 hover:text-brand-navy transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to site
        </Link>

        <div className="w-full max-w-[360px]">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-brand-navy">
              <Logo className="w-4 h-4" fill="white" />
            </div>
            <span className="text-sm font-bold tracking-widest text-brand-navy uppercase">AuthBlock Admin</span>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl border border-brand-border shadow-sm overflow-hidden">

            <div className="p-8">
              {/* Header */}
              <div className="mb-7">
                <h2 className="text-xl font-medium text-brand-heading mb-1.5">Sign in to Admin Portal</h2>
                <p className="text-sm text-brand-navy/60">
                  Use your authorized Google account to continue.
                </p>
              </div>

              {/* Status messages */}
              {status === 'error' && (
                <div className="mb-5 p-4 rounded-xl flex items-start gap-3 bg-red-50 border border-red-200">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-700">Something went wrong</p>
                    <p className="text-xs mt-0.5 text-red-600">{errorMsg || 'Please try again.'}</p>
                  </div>
                </div>
              )}

              {/* Sign in button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className={`w-full flex items-center justify-center gap-3 py-3 rounded-full font-medium text-sm transition-all duration-200 border
                  ${isLoading
                    ? 'bg-brand-bg border-brand-border text-brand-navy/40 cursor-not-allowed'
                    : 'bg-white border-brand-border text-brand-navy hover:bg-brand-bg hover:border-brand-border/80 hover:shadow-sm active:scale-[0.99]'
                  }`}
              >
                {isLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin text-brand-blue" /> Verifying access…</>
                  : <><GoogleIcon /> Continue with Google</>
                }
              </button>

              {/* Retry */}
              {status === 'error' && (
                <button
                  onClick={() => setStatus('idle')}
                  className="w-full mt-3 text-xs py-2 text-brand-navy/40 hover:text-brand-navy/70 transition-colors"
                >
                  ← Try a different account
                </button>
              )}

              {/* Security notice */}
              <div className="mt-6 flex items-start gap-2.5 p-4 rounded-2xl bg-brand-bg border border-brand-border/50">
                <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5 text-brand-navy/40" />
                <p className="text-[11px] leading-relaxed text-brand-navy/50">
                  Access is restricted to authorized administrators only. All sign-in attempts are verified against the admin registry.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
      </div>
    }>
      <AdminLoginContent />
    </Suspense>
  )
}
