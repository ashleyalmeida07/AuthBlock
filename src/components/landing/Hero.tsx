'use client'

import React from 'react'
import { Container, Logo } from '@/components/ui'
import { motion } from 'framer-motion'
import { ShiningText } from '@/components/ui/shining-text'
import { ShieldCheck, Network, CheckCircle2, Database } from 'lucide-react'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { y: "120%", opacity: 0, rotateX: 20 },
  visible: {
    y: 0,
    opacity: 1,
    rotateX: 0,
    transition: {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1], // smooth custom ease
    },
  },
}

const fadeVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.8, 
      ease: [0.16, 1, 0.3, 1] 
    } 
  }
}

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
          
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="flex flex-col items-center"
          >
            {/* Badge */}
            <motion.div 
              variants={fadeVariants}
              className="inline-flex items-center gap-3 px-4 py-2 bg-brand-soft/50 border border-brand-border/50 rounded-full mb-10 shadow-sm bg-white/50 backdrop-blur-sm"
            >
              <span className="w-2 h-2 rounded-full bg-brand-blue animate-pulse" />
              <span className="text-xs font-medium text-brand-navy tracking-wide">Blockchain Verified on Ethereum</span>
            </motion.div>

            {/* Main Heading with Slit Animation and Shining Text */}
            <h1 className="text-5xl sm:text-6xl md:text-[5rem] lg:text-[6.5rem] font-light text-brand-heading leading-[1.05] mb-8 tracking-tight" style={{ perspective: '1000px' }}>
              <span className="block overflow-hidden pb-1">
                <motion.span variants={itemVariants} className="block origin-bottom">
                  Secure <ShiningText text="credentials" />
                </motion.span>
              </span>
              <span className="block overflow-hidden pb-1">
                <motion.span variants={itemVariants} className="block origin-bottom">
                  without the <ShiningText text="risk." />
                </motion.span>
              </span>
            </h1>

            <motion.p 
              variants={fadeVariants}
              className="text-lg md:text-xl text-brand-navy/60 mb-14 leading-relaxed max-w-2xl mx-auto font-light"
            >
              Issue tamper-proof certificates anchored on the Ethereum blockchain. 
              If it&apos;s verified, share it globally. If it&apos;s tampered, the chain catches it instantly.
            </motion.p>

            <motion.div 
              variants={fadeVariants}
              className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[15px] text-brand-navy w-full pb-8"
            >
              <div className="flex items-center gap-2.5 px-5 py-2.5 bg-[#f8f9fa] border border-gray-200 rounded-md">
                <ShieldCheck className="w-5 h-5 text-brand-blue" />
                <span className="font-medium">Tamper-Proof Certificates</span>
              </div>

              <div className="flex items-center gap-2.5 px-5 py-2.5 bg-[#f8f9fa] border border-gray-200 rounded-md">
                <Network className="w-5 h-5 text-brand-blue" />
                <span className="font-medium">Ethereum Secured</span>
              </div>

              <div className="flex items-center gap-2.5 px-5 py-2.5 bg-[#f8f9fa] border border-gray-200 rounded-md">
                <CheckCircle2 className="w-5 h-5 text-brand-blue" />
                <span className="font-medium">Instantly Verifiable</span>
              </div>

              <div className="flex items-center gap-2.5 px-5 py-2.5 bg-[#f8f9fa] border border-gray-200 rounded-md">
                <Database className="w-5 h-5 text-brand-blue" />
                <span className="font-medium">Permanent Record</span>
              </div>
            </motion.div>

          </motion.div>

        </div>
      </Container>
      
    </section>
  )
}

