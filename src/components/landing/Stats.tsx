'use client'

import React from 'react'
import { Container } from '@/components/ui'
import { Shield, FileCheck, Clock, Globe } from 'lucide-react'
import { ShiningText } from '@/components/ui/shining-text'

const stats = [
  {
    value: '100%',
    label: 'Tamper Detection Rate',
    sub: 'Zero successful forgeries',
    icon: Shield,
  },
  {
    value: '< 3s',
    label: 'Verification Time',
    sub: 'Instant on-chain result',
    icon: Clock,
  },
  {
    value: '3',
    label: 'Document Types',
    sub: 'Marksheets, Degrees & Courses',
    icon: FileCheck,
  },
  {
    value: '∞',
    label: 'Permanent Record',
    sub: 'Lives on Ethereum forever',
    icon: Globe,
  },
]

export function Stats() {
  return (
    <section className="relative py-32 bg-white">
      <Container>
        {/* Header */}
        <div className="mb-20">
          <h2 className="text-4xl md:text-5xl lg:text-[4rem] font-light text-brand-heading tracking-tight leading-tight">
            <ShiningText text={<>Performance without<br className="hidden md:block" /> sacrificing trust.</>} />
          </h2>
          <p className="text-brand-navy/60 mt-6 text-lg max-w-2xl font-light">
            Every metric here is backed by the Ethereum blockchain — not marketing claims.
          </p>
        </div>

        {/* 4-column stat grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-brand-bg rounded-[1.5rem] p-8 border border-brand-border flex flex-col"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white shadow-subtle shrink-0 text-brand-blue">
                  <s.icon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-4xl font-semibold text-brand-navy tracking-tight mb-2">{s.value}</div>
              <div className="text-base font-medium text-brand-navy mb-1">{s.label}</div>
              <div className="text-sm text-brand-navy/60 font-light">{s.sub}</div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
