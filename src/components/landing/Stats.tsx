'use client'

import React from 'react'
import { Container } from '@/components/ui'
import { Shield, FileCheck, Clock, Globe } from 'lucide-react'

const stats = [
  {
    value: '100%',
    label: 'Tamper Detection Rate',
    sub: 'Zero successful forgeries since launch',
    icon: Shield,
    accent: '#2563EB',
    accentBg: '#EFF6FF',
  },
  {
    value: '< 3s',
    label: 'Verification Time',
    sub: 'QR scan to on-chain result',
    icon: Clock,
    accent: '#059669',
    accentBg: '#ECFDF5',
  },
  {
    value: '3',
    label: 'Document Types Supported',
    sub: 'Marksheet · Final Degree · Course Certificate',
    icon: FileCheck,
    accent: '#D97706',
    accentBg: '#FFFBEB',
  },
  {
    value: '∞',
    label: 'Permanent On-Chain Record',
    sub: 'Credentials live on Ethereum forever',
    icon: Globe,
    accent: '#0D9488',
    accentBg: '#F0FDFA',
  },
]

export function Stats() {
  return (
    <section className="relative py-20 bg-white">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      <Container>
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-[0.15em]">By The Numbers</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            Built to be trusted
          </h2>
          <p className="text-slate-500 mt-3 text-base max-w-lg mx-auto">
            Every metric here is backed by the Ethereum blockchain — not marketing claims.
          </p>
        </div>

        {/* 4-column stat grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-white border border-slate-200 rounded-xl p-6 hover:border-slate-300 hover:shadow-sm transition-all duration-200"
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4" style={{ background: s.accentBg }}>
                <s.icon className="w-4.5 h-4.5 w-[18px] h-[18px]" style={{ color: s.accent }} />
              </div>
              <div className="text-3xl font-black text-slate-900 tracking-tight mb-1">{s.value}</div>
              <div className="text-sm font-semibold text-slate-700 mb-1">{s.label}</div>
              <div className="text-xs text-slate-400 leading-relaxed">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Ethereum proof strip */}
        <div className="mt-8 flex items-center justify-center gap-3 py-4 px-6 bg-slate-900 rounded-xl max-w-2xl mx-auto">
          <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">Ξ</span>
          </div>
          <p className="text-sm text-slate-300">
            All credentials are permanently registered on <span className="text-white font-semibold">Ethereum Sepolia</span> — publicly verifiable by anyone, forever.
          </p>
        </div>
      </Container>
    </section>
  )
}
