'use client'

import React from 'react'
import { Container } from '@/components/ui'
import { Upload, QrCode, CheckCircle, ArrowRight } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: Upload,
    accent: '#2563EB',
    accentBg: '#EFF6FF',
    title: 'Admin Issues the Certificate',
    description: 'The admin uploads student data and generates a PDF. The document is hashed and registered on the Ethereum blockchain instantly.',
    tag: 'Blockchain Registration',
  },
  {
    number: '02',
    icon: QrCode,
    accent: '#059669',
    accentBg: '#ECFDF5',
    title: 'Student Receives a Signed QR',
    description: 'Each certificate comes with a unique QR code. Scan it with any camera to trigger instant on-chain verification — no app needed.',
    tag: 'QR · Hash · API',
  },
  {
    number: '03',
    icon: CheckCircle,
    accent: '#0D9488',
    accentBg: '#F0FDFA',
    title: 'Anyone Can Verify Anywhere',
    description: 'Employers, universities, or institutions scan the QR or enter the certificate ID. Tampered? The chain rejects it instantly.',
    tag: 'Globally Verifiable',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 bg-white">
      {/* top rule */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      <Container>
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="text-xs font-bold text-blue-700 uppercase tracking-[0.15em]">How It Works</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            From issuance to verification<br className="hidden md:block" /> in three steps
          </h2>
          <p className="text-slate-500 mt-3 text-base max-w-xl mx-auto">
            No third-party lookups. No paper trails. Just cryptographic proof — permanent and tamper-proof.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto relative">
          {/* connecting line desktop */}
          <div className="hidden md:block absolute top-10 left-[33%] right-[33%] h-px bg-gradient-to-r from-blue-200 via-emerald-200 to-teal-200 z-0" />

          {steps.map((step, i) => (
            <div
              key={step.number}
              className="relative bg-white rounded-2xl p-7 border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-300 flex flex-col z-10"
            >
              {/* Step number */}
              <div className="text-[52px] font-black leading-none mb-4 select-none" style={{ color: '#F1F5F9' }}>
                {step.number}
              </div>

              {/* Icon */}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 shrink-0" style={{ background: step.accentBg }}>
                <step.icon className="w-5 h-5" style={{ color: step.accent }} />
              </div>

              {/* Content */}
              <h3 className="text-base font-bold text-slate-900 mb-2">{step.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed flex-1">{step.description}</p>

              {/* Tag */}
              <div className="mt-5 inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: step.accent }} />
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: step.accent }}>{step.tag}</span>
              </div>

              {/* Arrow for non-last */}
              {i < steps.length - 1 && (
                <div className="hidden md:flex absolute -right-3 top-10 z-20 w-6 h-6 bg-white border border-slate-200 rounded-full items-center justify-center shadow-sm">
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
