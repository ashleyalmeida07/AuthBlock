'use client'

import React from 'react'
import { Container } from '@/components/ui'
import { Shield, Zap, Globe, Lock, QrCode, BarChart3 } from 'lucide-react'
import { ShiningText } from '@/components/ui/shining-text'

const features = [
  {
    icon: Shield,
    title: 'Tamper-Proof Certificates',
    description: 'Every document is hashed and anchored on Ethereum. Any tampering changes the hash — the blockchain rejects it instantly.',
  },
  {
    icon: QrCode,
    title: 'Instant QR Verification',
    description: 'Scan any certificate QR with any camera. Verification happens in seconds — no app download, no account required.',
  },
  {
    icon: Globe,
    title: 'Globally Accessible',
    description: 'Share your credential with any employer, university, or institution worldwide. The verification link works everywhere.',
  },
  {
    icon: Zap,
    title: 'Bulk Issuance',
    description: 'Issue hundreds of certificates in one go. Upload student data, generate PDFs, and register all hashes on-chain at once.',
  },
  {
    icon: Lock,
    title: 'Zero Trust Model',
    description: 'No central authority can alter records. Certificates exist permanently on the blockchain — beyond anyone\'s control.',
  },
  {
    icon: BarChart3,
    title: 'Full Audit Trail',
    description: 'Track every issuance, every verification scan, and every hash recorded. Complete transparency across all credential types.',
  },
]

export function Features() {
  return (
    <section id="features" className="relative py-32 bg-brand-bg">
      <Container>
        {/* Header */}
        <div className="max-w-3xl mb-20">
          <h2 className="text-4xl md:text-5xl lg:text-[4rem] font-light text-brand-heading tracking-tight leading-tight">
            <ShiningText text="Everything you need for trusted academic credentials." />
          </h2>
        </div>

        {/* 3×2 grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f) => (
            <div
              key={f.title}
              className="group bg-white rounded-[2rem] p-10 border border-brand-border hover:shadow-hover transition-all duration-300 flex flex-col hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-8 shrink-0 bg-brand-soft text-brand-blue transition-transform duration-300 group-hover:scale-110">
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-medium text-brand-navy mb-4">{f.title}</h3>
              <p className="text-base text-brand-navy/60 leading-relaxed font-light">{f.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
