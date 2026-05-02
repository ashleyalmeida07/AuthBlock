'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Shield, ArrowLeft, AlertCircle, Loader2, Lock } from 'lucide-react'

type Status = 'idle' | 'loading' | 'denied' | 'error'

const GoogleIcon = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

export default function AdminLoginPage() {
  const router = useRouter()
  const [status, setStatus]           = useState<Status>('idle')
  const [errorMsg, setErrorMsg]       = useState('')
  const [deniedEmail, setDeniedEmail] = useState('')

  async function handleGoogleSignIn() {
    setStatus('loading')
    setErrorMsg('')
    setDeniedEmail('')

    let signedInEmail = ''
    let signedInUid   = ''
    let signedInPhoto = ''

    try {
      const provider = new GoogleAuthProvider()
      provider.addScope('email')
      const cred = await signInWithPopup(auth, provider)

      signedInEmail = cred.user.email ?? ''
      signedInUid   = cred.user.uid
      signedInPhoto = cred.user.photoURL ?? ''

      const res  = await fetch('/api/admin/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signedInEmail.toLowerCase() }),
      })
      const data = await res.json()

      if (!data.allowed) {
        try { await cred.user.delete() } catch { /* best effort */ }
        await auth.signOut()
        setDeniedEmail(signedInEmail)
        setStatus('denied')
        return
      }

      await fetch('/api/admin/link-firebase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:              signedInEmail.toLowerCase(),
          firebase_uid:       signedInUid,
          firebase_email:     signedInEmail,
          firebase_photo_url: signedInPhoto || null
        }),
      })

      router.push('/admin/dashboard')

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (
        msg.includes('popup-closed-by-user') ||
        msg.includes('cancelled-popup-request') ||
        msg.includes('user-cancelled')
      ) {
        setStatus('idle')
        return
      }
      try { await auth.signOut() } catch { /* ignore */ }
      setErrorMsg(msg)
      setStatus('error')
    }
  }

  const isLoading = status === 'loading'

  return (
    <div className="min-h-screen flex bg-slate-50"
      style={{
        backgroundImage:
          'linear-gradient(to right, rgba(203,213,225,0.3) 1px, transparent 1px),' +
          'linear-gradient(to bottom, rgba(203,213,225,0.3) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }}
    >
      {/* ── Left panel — white branding ─────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[400px] shrink-0 p-10 bg-white border-r border-slate-200 relative">

        {/* Logo */}
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-600">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-bold tracking-widest text-slate-900 uppercase">AuthBlock</span>
          </div>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-100">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Restricted Access
            </div>
            <h1 className="text-3xl font-bold text-slate-900 leading-tight">
              Admin<br />Portal
            </h1>
            <p className="text-sm leading-relaxed text-slate-500">
              Issue and manage blockchain-verified academic credentials for Fr. Conceicao Rodrigues College of Engineering.
            </p>
          </div>
        </div>

        {/* Bottom info cards */}
        <div className="space-y-3">
          {[
            { label: 'Smart Contracts', value: '4 Active', color: 'text-emerald-600' },
            { label: 'Network', value: 'Ethereum Sepolia', color: 'text-blue-600' },
            { label: 'Documents', value: 'Marksheet · Degree · Course', color: 'text-amber-600' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-slate-100">
              <span className="text-xs text-slate-500">{item.label}</span>
              <span className={`text-xs font-semibold font-mono ${item.color}`}>{item.value}</span>
            </div>
          ))}

          {/* Powered by Ethereum badge */}
          <div className="flex items-center gap-2 pt-2">
            <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
              <span className="text-white text-[9px] font-bold">Ξ</span>
            </div>
            <span className="text-xs text-slate-400">Secured by Ethereum blockchain</span>
          </div>
        </div>
      </div>

      {/* ── Right panel — login form ─────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative">

        {/* Back to site */}
        <Link
          href="/"
          className="absolute top-6 left-6 flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to site
        </Link>

        <div className="w-full max-w-[360px]">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <Image src="/logo.png" alt="Authblock" width={28} height={28} />
            <span className="text-sm font-bold tracking-widest text-slate-900 uppercase">AuthBlock Admin</span>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

            {/* Card top accent */}
            <div className="h-1 bg-gradient-to-r from-blue-600 to-blue-400" />

            <div className="p-8">
              {/* Header */}
              <div className="mb-7">
                <h2 className="text-xl font-bold text-slate-900 mb-1.5">Sign in to Admin Portal</h2>
                <p className="text-sm text-slate-500">
                  Use your authorized Google account to continue.
                </p>
              </div>

              {/* Status messages */}
              {status === 'denied' && (
                <div className="mb-5 p-4 rounded-xl flex items-start gap-3 bg-red-50 border border-red-200">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">Access Denied</p>
                    <p className="text-xs mt-0.5 leading-relaxed text-red-600">
                      <span className="font-mono">{deniedEmail}</span> is not registered as an admin.
                    </p>
                  </div>
                </div>
              )}

              {status === 'error' && (
                <div className="mb-5 p-4 rounded-xl flex items-start gap-3 bg-amber-50 border border-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-700">Something went wrong</p>
                    <p className="text-xs mt-0.5 text-amber-600">{errorMsg || 'Please try again.'}</p>
                  </div>
                </div>
              )}

              {/* Sign in button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className={`w-full flex items-center justify-center gap-3 py-3 rounded-xl font-semibold text-sm transition-all duration-200 border
                  ${isLoading
                    ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md active:scale-[0.99]'
                  }`}
              >
                {isLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying access…</>
                  : <><GoogleIcon /> Continue with Google</>
                }
              </button>

              {/* Retry */}
              {(status === 'denied' || status === 'error') && (
                <button
                  onClick={() => setStatus('idle')}
                  className="w-full mt-3 text-xs py-2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  ← Try a different account
                </button>
              )}

              {/* Security notice */}
              <div className="mt-6 flex items-start gap-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
                <p className="text-[11px] leading-relaxed text-slate-400">
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
