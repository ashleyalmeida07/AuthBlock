'use client'

import React from 'react'
import { Container } from '@/components/ui'
import { Upload, QrCode, CheckCircle, ArrowRight } from 'lucide-react'
import { ShiningText } from '@/components/ui/shining-text'

const steps = [
  {
    number: '01',
    icon: Upload,
    title: 'Admin Issues the Certificate',
    description: 'The admin uploads student data and generates a PDF. The document is hashed and registered on the Ethereum blockchain instantly.',
    tag: 'Blockchain Registration',
  },
  {
    number: '02',
    icon: QrCode,
    title: 'Student Receives a Signed QR',
    description: 'Each certificate comes with a unique QR code. Scan it with any camera to trigger instant on-chain verification — no app needed.',
    tag: 'QR · Hash · API',
  },
  {
    number: '03',
    icon: CheckCircle,
    title: 'Anyone Can Verify Anywhere',
    description: 'Employers, universities, or institutions scan the QR or enter the certificate ID. Tampered? The chain rejects it instantly.',
    tag: 'Globally Verifiable',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-32 bg-white">
      <Container>
        {/* Header */}
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-5xl lg:text-[4rem] font-light text-brand-heading tracking-tight leading-tight">
            <ShiningText text={<>From issuance to verification<br className="hidden md:block" /> in three steps.</>} />
          </h2>
          <p className="text-brand-navy/60 mt-6 text-lg max-w-2xl mx-auto font-light">
            No third-party lookups. No paper trails. Just cryptographic proof — permanent and tamper-proof.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {steps.map((step, i) => (
            <div
              key={step.number}
              className="group relative bg-white rounded-[2rem] p-10 md:p-12 border border-brand-border hover:shadow-hover transition-all duration-300 flex flex-col hover:-translate-y-1"
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-brand-soft flex items-center justify-center mb-8 shrink-0 transition-transform duration-300 group-hover:scale-110">
                <step.icon className="w-6 h-6 text-brand-blue" />
              </div>

              {/* Content */}
              <h3 className="text-2xl font-medium text-brand-navy mb-4">{step.title}</h3>
              <p className="text-base text-brand-navy/60 leading-relaxed flex-1 font-light">{step.description}</p>

              {/* Tag */}
              <div className="mt-8 inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-blue" />
                <span className="text-[11px] font-semibold uppercase tracking-widest text-brand-navy/70">{step.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
