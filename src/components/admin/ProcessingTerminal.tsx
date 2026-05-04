'use client'

import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, CheckCircle2, XCircle, Loader2, Info, RotateCcw, ExternalLink } from 'lucide-react'

export interface TerminalLog {
  id: number
  message: string
  status: 'info' | 'processing' | 'success' | 'error' | 'skip'
  timestamp: Date
  txHash?: string
}

interface ProcessingTerminalProps {
  logs: TerminalLog[]
  currentIndex: number
  totalCount: number
  isComplete: boolean
  successCount: number
  errorCount: number
  onReset?: () => void
}

const statusConfig = {
  info:       { icon: Info,         color: 'text-blue-600',   prefix: 'INFO' },
  processing: { icon: Loader2,     color: 'text-amber-600',  prefix: 'PROC' },
  success:    { icon: CheckCircle2, color: 'text-emerald-600', prefix: '  OK' },
  error:      { icon: XCircle,     color: 'text-red-600',    prefix: 'FAIL' },
  skip:       { icon: Info,         color: 'text-slate-500',  prefix: 'SKIP' },
}

export default function ProcessingTerminal({
  logs,
  currentIndex,
  totalCount,
  isComplete,
  successCount,
  errorCount,
  onReset,
}: ProcessingTerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  const progress = totalCount > 0 ? Math.round((currentIndex / totalCount) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="rounded-2xl overflow-hidden border border-slate-200 shadow-xl shadow-slate-200/50"
    >
      {/* ── Title bar ── */}
      <div className="flex items-center justify-between px-5 py-3 bg-slate-100 border-b border-slate-200">
        <div className="flex items-center gap-3">
          {/* Title removed macOS-style dots */}
          <div className="flex items-center gap-2 text-slate-600 text-xs font-mono font-semibold tracking-wide uppercase">
            <Terminal className="w-3.5 h-3.5" />
            authblock — bulk processor
          </div>
        </div>
        <div className="text-xs font-mono text-slate-500">
          {isComplete ? 'COMPLETED' : `${currentIndex}/${totalCount}`}
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="h-1 bg-slate-200">
        <motion.div
          className={`h-full ${isComplete ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500'}`}
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{ backgroundSize: '200% 100%' }}
        />
      </div>

      {/* ── Terminal body ── */}
      <div
        ref={scrollRef}
        className="bg-white px-5 py-4 font-mono text-[13px] leading-relaxed overflow-y-auto max-h-[420px] min-h-[280px] scroll-smooth"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 #f8fafc',
        }}
      >
        {/* Startup banner */}
        <div className="text-slate-400 mb-3 select-none">
          <div>╭─────────────────────────────────────────────────╮</div>
          <div>│  AuthBlock Bulk Marksheet Processor v1.0        │</div>
          <div>│  Processing {totalCount} student record{totalCount !== 1 ? 's' : ''}…{' '.repeat(Math.max(0, 25 - String(totalCount).length))}│</div>
          <div>╰─────────────────────────────────────────────────╯</div>
        </div>

        <AnimatePresence initial={false}>
          {logs.map((log) => {
            const cfg = statusConfig[log.status]
            const Icon = cfg.icon
            const time = log.timestamp.toLocaleTimeString('en-US', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-2 py-0.5 group"
              >
                <span className="text-slate-400 shrink-0 select-none">{time}</span>
                <span className={`shrink-0 font-bold ${cfg.color} select-none`}>[{cfg.prefix}]</span>
                <Icon
                  className={`w-3.5 h-3.5 mt-[3px] shrink-0 ${cfg.color} ${
                    log.status === 'processing' ? 'animate-spin' : ''
                  }`}
                />
                <span className={`${log.status === 'skip' ? 'text-slate-400' : 'text-slate-700'} flex-1`}>
                  {log.message}
                  {log.txHash && (
                    <a 
                      href={`https://sepolia.etherscan.io/tx/${log.txHash}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 ml-3 font-semibold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 px-2 py-0.5 rounded"
                    >
                      <ExternalLink className="w-3 h-3" /> Etherscan
                    </a>
                  )}
                </span>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Blinking cursor when processing */}
        {!isComplete && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
            className="inline-block w-2.5 h-4 bg-emerald-500 mt-2 rounded-sm"
          />
        )}

        {/* ── Summary block ── */}
        {isComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="mt-4 pt-4 border-t border-slate-100"
          >
            <div className="text-slate-400 mb-2">─── Process Complete ───</div>
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-200">
                <div className="text-2xl font-bold text-slate-700">{totalCount}</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mt-1">Total Rows</div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
                <div className="text-2xl font-bold text-emerald-600">{successCount}</div>
                <div className="text-[10px] uppercase tracking-wider text-emerald-700 font-semibold mt-1">Succeeded</div>
              </div>
              <div className={`rounded-xl p-3 text-center border ${errorCount > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className={`text-2xl font-bold ${errorCount > 0 ? 'text-red-600' : 'text-slate-500'}`}>{errorCount}</div>
                <div className={`text-[10px] uppercase tracking-wider font-semibold mt-1 ${errorCount > 0 ? 'text-red-700' : 'text-slate-500'}`}>Failed</div>
              </div>
            </div>
            <div className="text-emerald-500 text-xs font-semibold">
              ✓ All operations finished. View issued marksheets in the History tab.
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Footer action bar ── */}
      {isComplete && onReset && (
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-mono">
            {successCount} of {totalCount} marksheets issued successfully
          </p>
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-purple-900/30"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Upload Another File
          </button>
        </div>
      )}
    </motion.div>
  )
}
