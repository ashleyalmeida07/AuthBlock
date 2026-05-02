'use client'

import React from 'react'
import { Container } from '@/components/ui'
import { Shield, Zap, Globe, Lock, QrCode, BarChart3 } from 'lucide-react'

const features = [
  {
    icon: Shield,
    accent: '#2563EB',
    accentBg: '#EFF6FF',
    title: 'Tamper-Proof Certificates',
    description: 'Every document is hashed and anchored on Ethereum. Any tampering changes the hash — the blockchain rejects it instantly.',
  },
  {
    icon: QrCode,
    accent: '#059669',
    accentBg: '#ECFDF5',
    title: 'Instant QR Verification',
    description: 'Scan any certificate QR with any camera. Verification happens in seconds — no app download, no account required.',
  },
  {
    icon: Globe,
    accent: '#0D9488',
    accentBg: '#F0FDFA',
    title: 'Globally Accessible',
    description: 'Share your credential with any employer, university, or institution worldwide. The verification link works everywhere.',
  },
  {
    icon: Zap,
    accent: '#D97706',
    accentBg: '#FFFBEB',
    title: 'Bulk Issuance',
    description: 'Issue hundreds of certificates in one go. Upload student data, generate PDFs, and register all hashes on-chain at once.',
  },
  {
    icon: Lock,
    accent: '#7C3AED',
    accentBg: '#F5F3FF',
    title: 'Zero Trust Model',
    description: 'No central authority can alter records. Certificates exist permanently on the blockchain — beyond anyone\'s control.',
  },
  {
    icon: BarChart3,
    accent: '#DB2777',
    accentBg: '#FDF2F8',
    title: 'Full Audit Trail',
    description: 'Track every issuance, every verification scan, and every hash recorded. Complete transparency across all credential types.',
  },
]

export function Features() {
  return (
    <section id="features" className="relative py-24 bg-slate-50">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      <Container>
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 mb-4 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-[0.15em]">Features</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            Everything you need for<br className="hidden md:block" /> trusted academic credentials
          </h2>
          <p className="text-slate-500 mt-3 text-base max-w-xl mx-auto">
            Built specifically for colleges and universities — issue, manage, and verify all credential types in one place.
          </p>
        </div>

        {/* 3×2 grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="group bg-white rounded-xl p-6 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 shrink-0 transition-transform duration-200 group-hover:scale-105" style={{ background: f.accentBg }}>
                <f.icon className="w-5 h-5" style={{ color: f.accent }} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
