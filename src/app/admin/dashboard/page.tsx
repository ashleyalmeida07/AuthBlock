'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  FileText, Shield, Users, ArrowUpRight, Loader2,
  GraduationCap, BookOpen, Activity, TrendingUp, Hash
} from 'lucide-react'
import AdminShell, { type AdminRecord } from '@/components/admin/AdminShell'

function StatCard({
  label, value, icon: Icon, accent, sub, delay = 0
}: {
  label: string
  value: number | string
  icon: React.ElementType
  accent: string
  sub?: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-3 hover:border-slate-300 hover:shadow-sm transition-all duration-200"
    >
      <div className="flex items-start justify-between">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${accent}14` }}>
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </div>
        <ArrowUpRight className="w-3.5 h-3.5 text-slate-300" />
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-900 tabular-nums">{value}</div>
        <div className="text-xs font-medium text-slate-500 mt-0.5">{label}</div>
        {sub && <div className="text-[10px] text-slate-400 mt-1 font-mono">{sub}</div>}
      </div>
    </motion.div>
  )
}

function QuickActionCard({
  href, icon: Icon, label, description, accent, delay = 0
}: {
  href: string
  icon: React.ElementType
  label: string
  description: string
  accent: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Link
        href={href}
        className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-sm transition-all duration-200 group"
      >
        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${accent}12` }}>
          <Icon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" style={{ color: accent }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-slate-800">{label}</div>
          <div className="text-xs text-slate-400 mt-0.5">{description}</div>
        </div>
        <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors shrink-0" />
      </Link>
    </motion.div>
  )
}

function DashboardContent({ admin }: { admin: AdminRecord }) {
  const isSuperAdmin = admin.admin_type === 'superadmin'
  const [stats, setStats] = useState({
    certificatesIssued: 0,
    marksheetsIssued: 0,
    degreesIssued: 0,
    coursesIssued: 0,
    verifiedOnChain: 0,
    adminUsers: 0
  })
  const [loading, setLoading] = useState(true)
  const now = new Date()

  useEffect(() => {
    async function fetchStats() {
      try {
        const res  = await fetch('/api/admin/dashboard-stats')
        const data = await res.json()
        if (data.success) setStats(data.stats)
      } catch (err) {
        console.error('Failed to fetch stats:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const val = (n: number) => loading
    ? <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
    : n

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">

      {/* ── Welcome Banner ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm"
      >
        <div className="relative px-8 py-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold tracking-[0.15em] uppercase text-slate-500">
                Admin Portal · Sepolia Testnet
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Good {now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening'}, {admin.name.split(' ')[0]}
            </h1>
            <p className="text-sm mt-1.5 font-medium text-slate-500">
              {admin.position ? `${admin.position} · ` : ''}
              <span className={isSuperAdmin ? 'text-amber-600' : 'text-slate-500'}>
                {isSuperAdmin ? '⬡ Superadmin' : '◯ Admin'}
              </span>
            </p>
          </div>

          {/* Email chip */}
          <div className="relative z-10 shrink-0 rounded-xl px-5 py-4 bg-slate-50 border border-slate-100 shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-1">Signed in as</div>
            <div className="font-mono text-sm font-semibold text-slate-700 truncate max-w-[240px]">{admin.email}</div>
          </div>
        </div>
      </motion.div>

      {/* ── Stat Cards ─────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-slate-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Issuance Overview</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Total Issued"      value={val(stats.certificatesIssued)} icon={Activity}      accent="#2563EB" delay={0}    />
          <StatCard label="Marksheets"        value={val(stats.marksheetsIssued)}   icon={FileText}      accent="#2563EB" delay={0.05} />
          <StatCard label="Degrees"           value={val(stats.degreesIssued)}      icon={GraduationCap} accent="#D97706" delay={0.1}  />
          <StatCard label="Course Certs"      value={val(stats.coursesIssued)}      icon={BookOpen}      accent="#0D9488" delay={0.15} />
          <StatCard label="On-Chain"          value={val(stats.verifiedOnChain)}    icon={Shield}        accent="#059669" delay={0.2}  />
          <StatCard label="Admin Users"       value={val(stats.adminUsers)}         icon={Users}         accent="#6366F1" delay={0.25} />
        </div>
      </div>

      {/* ── Quick Actions ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Issuance column */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Hash className="w-4 h-4 text-slate-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Issue Documents</h2>
          </div>
          <div className="space-y-2">
            <QuickActionCard
              href="/admin/marksheets"
              icon={FileText}
              label="Issue Marksheet"
              description="Blockchain-anchored semester marksheet"
              accent="#2563EB"
              delay={0.1}
            />
            <QuickActionCard
              href="/admin/degrees"
              icon={GraduationCap}
              label="Issue Final Degree"
              description="Permanent degree record on DegreeRegistry"
              accent="#D97706"
              delay={0.15}
            />
            <QuickActionCard
              href="/admin/courses"
              icon={BookOpen}
              label="Issue Course Certificate"
              description="Workshops, seminars, and short-term courses"
              accent="#0D9488"
              delay={0.2}
            />
          </div>
        </div>

        {/* System column */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-slate-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">System</h2>
          </div>
          <div className="space-y-2">
            {isSuperAdmin && (
              <QuickActionCard
                href="/admin/users"
                icon={Users}
                label="Manage Admins"
                description="Add, edit, or remove admin users"
                accent="#6366F1"
                delay={0.1}
              />
            )}
            <QuickActionCard
              href="/admin/network"
              icon={Activity}
              label="Network Status"
              description="View blockchain node and contract health"
              accent="#059669"
              delay={0.15}
            />
          </div>

          {/* Blockchain info card */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-3 rounded-xl p-5 border border-slate-200 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                Active Contracts
              </span>
              <span className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-[10px] font-bold text-emerald-600 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Sepolia
              </span>
            </div>
            <div className="space-y-3">
              {[
                { label: 'CertificateRegistry', icon: FileText, color: '#2563EB' },
                { label: 'DegreeRegistry', icon: GraduationCap, color: '#D97706' },
                { label: 'CourseRegistry', icon: BookOpen, color: '#0D9488' },
                { label: 'QRScanLogger', icon: Activity, color: '#6366F1' },
              ].map(c => (
                <div key={c.label} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded bg-slate-50 flex items-center justify-center shrink-0">
                    <c.icon className="w-3.5 h-3.5" style={{ color: c.color }} />
                  </div>
                  <span className="text-xs font-mono font-medium flex-1 truncate text-slate-600">{c.label}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  return (
    <AdminShell>
      {(admin) => <DashboardContent admin={admin} />}
    </AdminShell>
  )
}
