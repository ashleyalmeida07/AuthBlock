'use client'

import React from 'react'
import Link from 'next/link'
import { Container } from '@/components/ui'
import { ArrowRight, Shield, QrCode } from 'lucide-react'

export function CTA({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  return (
    <section className="relative py-24 bg-white overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      <Container className="relative z-10">
        {/* Dark card CTA */}
        <div
          className="relative rounded-2xl px-8 py-14 md:px-16 text-center overflow-hidden"
          style={{ background: '#0A0F1E' }}
        >
          {/* Subtle grid overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px),' +
                'linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />

          {/* Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-24 rounded-full blur-3xl opacity-20" style={{ background: '#2563EB' }} />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest mb-5"
              style={{ background: 'rgba(37,99,235,0.15)', color: '#93C5FD', border: '1px solid rgba(37,99,235,0.25)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Ethereum Blockchain
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4 leading-tight">
              Your credentials deserve<br className="hidden md:block" /> to be verified — safely.
            </h2>

            <p className="text-base max-w-xl mx-auto leading-relaxed mb-10" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Upload once. Get verified. Share globally with complete confidence — powered by cryptographic proof, not trust.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={isLoggedIn ? '/dashboard' : '/login'}
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all text-sm shadow-lg"
                style={{ boxShadow: '0 4px 20px rgba(37,99,235,0.4)' }}
              >
                {isLoggedIn ? 'Dashboard' : 'Get Started'}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/verify"
                className="inline-flex items-center gap-2 px-7 py-3.5 font-semibold rounded-xl text-sm transition-all"
                style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                <QrCode className="w-4 h-4" />
                Verify a Certificate
              </Link>
            </div>

            {/* Trust row */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
              {[
                { icon: Shield, text: '100% Tamper Detection' },
                { icon: QrCode, text: 'Instant QR Verification' },
                { icon: ArrowRight, text: 'Permanent On-Chain Record' },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-2">
                  <item.icon className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
                  <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
