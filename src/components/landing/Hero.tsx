'use client'

import React from 'react'
import Link from 'next/link'
import { Container, Logo } from '@/components/ui'
import { ArrowRight, Search } from 'lucide-react'

export function Hero({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  return (
    <section
      className="relative min-h-[95vh] flex flex-col justify-center overflow-hidden bg-brand-bg pt-28 md:pt-36 pb-0"
    >
      {/* Subtle top glow */}
      <div className="absolute top-0 inset-x-0 h-[600px] bg-hero-glow pointer-events-none" />
      
      {/* Heavy blue gradient at the bottom based on the reference */}
      <div className="absolute bottom-0 inset-x-0 h-[60vh] bg-gradient-to-t from-brand-blue/80 via-brand-blue/20 to-transparent pointer-events-none" />

      <Container className="relative z-10 flex-1 flex flex-col justify-center pb-24 md:pb-32">
        <div className="max-w-5xl mx-auto text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-brand-soft/50 border border-brand-border/50 rounded-full mb-10 animate-fade-in shadow-sm bg-white/50 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-brand-blue animate-pulse" />
            <span className="text-xs font-medium text-brand-navy tracking-wide">Blockchain Verified on Ethereum</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl sm:text-6xl md:text-[5rem] lg:text-[6.5rem] font-light text-brand-heading leading-[1.05] mb-8 tracking-tight animate-fade-up opacity-0" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            Secure credentials
            <br />
            without the <span className="text-brand-blue font-normal">risk.</span>
          </h1>

          <p className="text-lg md:text-xl text-brand-navy/60 mb-14 leading-relaxed max-w-2xl mx-auto animate-fade-up opacity-0 font-light" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            Issue tamper-proof certificates anchored on the Ethereum blockchain. 
            If it&apos;s verified, share it globally. If it&apos;s tampered, the chain catches it instantly.
          </p>

          {/* Pill CTA - Matching the reference image */}
          <div className="mx-auto max-w-lg p-2 bg-white rounded-full shadow-lg border border-brand-border/30 flex items-center justify-between gap-2 animate-fade-up opacity-0 relative z-20 hover:shadow-xl hover:border-brand-border/60 transition-all duration-300" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
            <div className="flex-1 flex items-center pl-6 pr-2 py-1">
              <Search className="w-5 h-5 text-brand-navy/30 mr-3" />
              <input 
                type="text" 
                placeholder="Enter Certificate ID to Verify..." 
                className="w-full bg-transparent border-none outline-none text-brand-navy placeholder:text-brand-navy/40 text-base"
              />
            </div>
            <Link
              href={isLoggedIn ? "/dashboard" : "/login"}
              className="group inline-flex items-center justify-center gap-1 sm:gap-2 px-4 sm:px-8 py-3 sm:py-4 bg-brand-blue text-white font-medium rounded-full hover:bg-brand-bright transition-all duration-300 shadow-blue-glow w-auto shrink-0 text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">{isLoggedIn ? "Dashboard" : "Issue Credentials"}</span>
              <span className="sm:hidden">{isLoggedIn ? "Dash" : "Issue"}</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

        </div>
      </Container>
      
      {/* Logo Farm row at the bottom of the hero section */}
      <div className="relative z-10 w-full border-t border-white/20 bg-brand-blue/10 backdrop-blur-sm py-6">
        <Container>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 text-sm text-white font-medium animate-fade-up opacity-0" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
            <span className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
              <Logo className="w-6 h-6" fill="white" />
              <span className="tracking-wide">AUTHBLOCK</span>
            </span>
            <span className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Tamper-Proof
            </span>
            <span className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-200" /> Ethereum Secured
            </span>
            <span className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Instantly Verifiable
            </span>
            <span className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-200" /> Permanent Record
            </span>
          </div>
        </Container>
      </div>
    </section>
  )
}

