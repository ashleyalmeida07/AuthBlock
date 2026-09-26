'use client'

import React from 'react'
import Link from 'next/link'
import { Container } from '@/components/ui'
import { ArrowRight, QrCode } from 'lucide-react'
import { ShiningText } from '@/components/ui/shining-text'

export function CTA({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  return (
    <section className="relative py-24 bg-white overflow-hidden">
      <Container className="relative z-10">
        <div className="relative rounded-[2rem] px-8 py-16 md:px-16 lg:py-20 bg-brand-navy overflow-hidden">
          {/* Subtle glow inside the dark container */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-full bg-brand-blue opacity-[0.08] blur-[100px] rounded-full pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
            <div className="max-w-xl">
              <span className="text-xs font-bold text-brand-blue tracking-[0.2em] uppercase mb-4 block">
                Get Started
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-white tracking-tight mb-6 leading-tight">
                <ShiningText text="Your credentials deserve to be verified — safely." />
              </h2>
              <p className="text-lg text-white/60 font-light leading-relaxed">
                Upload once. Get verified. Share globally with complete confidence — powered by cryptographic proof, not trust.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
              <Link
                href={isLoggedIn ? '/dashboard' : '/login'}
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-brand-blue text-white font-medium rounded-full hover:bg-brand-bright transition-all duration-300 w-full sm:w-auto text-base"
              >
                {isLoggedIn ? 'Dashboard' : 'Start Issuing'}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/scan"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 text-white font-medium rounded-full border border-white/10 hover:bg-white/10 transition-all duration-300 w-full sm:w-auto text-base"
              >
                <QrCode className="w-4 h-4" />
                Verify a Document
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
