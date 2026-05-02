'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import {
  LayoutDashboard, FileText, Users, Settings, LogOut, Menu, X,
  ActivitySquare, GraduationCap, BookOpen, ChevronRight, Shield
} from 'lucide-react'

export interface AdminRecord {
  id: string
  name: string
  email: string
  phone: string | null
  position: string | null
  admin_type: 'superadmin' | 'admin'
  firebase_uid: string | null
  firebase_photo_url: string | null
  created_at: string
}

interface AdminShellProps {
  children: (admin: AdminRecord) => React.ReactNode
}

// ── Nav config ────────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard',      href: '/admin/dashboard',  accent: '#2563EB' },
    ]
  },
  {
    label: 'Issuance',
    items: [
      { icon: FileText,       label: 'Marksheets',      href: '/admin/marksheets', accent: '#2563EB' },
      { icon: GraduationCap,  label: 'Degrees',         href: '/admin/degrees',    accent: '#D97706' },
      { icon: BookOpen,       label: 'Course Certs',    href: '/admin/courses',    accent: '#0D9488' },
    ]
  },
  {
    label: 'System',
    items: [
      { icon: Users,          label: 'Manage Admins',   href: '/admin/users',      accent: '#2563EB', superOnly: true },
      { icon: ActivitySquare, label: 'Network Status',  href: '/admin/network',    accent: '#2563EB', superOnly: true },
      { icon: Settings,       label: 'Settings',        href: '/admin/settings',   accent: '#2563EB', soon: true },
    ]
  }
]

export default function AdminShell({ children }: AdminShellProps) {
  const router   = useRouter()
  const pathname = usePathname()
  const [admin, setAdmin]           = useState<AdminRecord | null>(null)
  const [loading, setLoading]       = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const fetchAdmin = useCallback(async (email: string) => {
    const res  = await fetch(`/api/admin/me?email=${encodeURIComponent(email)}`)
    const data = await res.json()
    if (data.admin) setAdmin(data.admin)
  }, [])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.replace('/admin/login'); return }
      await fetchAdmin(user.email!)
      setLoading(false)
    })
    return () => unsub()
  }, [router, fetchAdmin])

  async function handleSignOut() {
    await signOut(auth)
    router.replace('/admin/login')
  }

  if (loading || !admin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0F1E' }}>
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Authenticating…</span>
        </div>
      </div>
    )
  }

  const isSuperAdmin = admin.admin_type === 'superadmin'
  const pageTitle = pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: '#0A0F1E' }}>

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-[60px] border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#2563EB' }}>
          <Shield className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-bold tracking-widest text-white uppercase">AuthBlock</span>
        <button className="ml-auto lg:hidden text-slate-500 hover:text-white transition-colors" onClick={() => setSidebarOpen(false)}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav Sections */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto no-scrollbar">
        {NAV_SECTIONS.map(section => {
          const visibleItems = section.items.filter(i => !i.superOnly || isSuperAdmin)
          if (visibleItems.length === 0) return null
          return (
            <div key={section.label}>
              <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                {section.label}
              </p>
              <div className="space-y-0.5">
                {visibleItems.map(item => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.label}
                      href={item.soon ? '#' : item.href}
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group relative"
                      style={{
                        color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
                        background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent',
                      }}
                    >
                      {/* Active left border */}
                      {isActive && (
                        <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full" style={{ background: item.accent }} />
                      )}
                      <item.icon
                        className="w-4 h-4 shrink-0 transition-colors"
                        style={{ color: isActive ? item.accent : 'rgba(255,255,255,0.35)' }}
                      />
                      <span className="flex-1 group-hover:text-white transition-colors">{item.label}</span>
                      {item.soon && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}>
                          SOON
                        </span>
                      )}
                      {isActive && !item.soon && (
                        <ChevronRight className="w-3 h-3 opacity-50" style={{ color: item.accent }} />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Admin footer */}
      <div className="px-3 py-4 border-t shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
          {admin.firebase_photo_url ? (
            <img src={admin.firebase_photo_url} alt={admin.name} className="w-8 h-8 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ background: '#2563EB' }}>
              {admin.name[0].toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-white truncate">{admin.name}</div>
            <div className="text-[10px] font-medium" style={{ color: isSuperAdmin ? '#FCD34D' : 'rgba(255,255,255,0.35)' }}>
              {isSuperAdmin ? '⬡ Superadmin' : '◯ Admin'}
            </div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-all"
          style={{ color: 'rgba(255,255,255,0.35)', background: 'transparent' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)'; (e.currentTarget as HTMLButtonElement).style.color = '#F87171' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.35)' }}
        >
          <LogOut className="w-3.5 h-3.5" /> Sign out
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex" style={{ background: '#F1F5F9' }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 lg:hidden" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full z-30 w-60 transition-transform duration-300 flex-col
        lg:static lg:translate-x-0 lg:shrink-0 lg:flex
        ${sidebarOpen ? 'flex translate-x-0' : 'hidden -translate-x-full'}
      `}>
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="h-[60px] bg-white border-b border-slate-200 flex items-center px-4 gap-4 shrink-0">
          <button
            className="lg:hidden p-1.5 rounded-lg transition-colors text-slate-500 hover:bg-slate-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm min-w-0">
            <span className="text-slate-400 font-medium hidden sm:inline">Admin</span>
            <span className="text-slate-300 hidden sm:inline">/</span>
            <span className="font-semibold text-slate-800 capitalize truncate">{pageTitle}</span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Chain status pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Sepolia
            </div>

            {/* Admin avatar */}
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              {admin.firebase_photo_url ? (
                <img src={admin.firebase_photo_url} alt={admin.name} className="w-7 h-7 rounded-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ background: '#2563EB' }}>
                  {admin.name[0].toUpperCase()}
                </div>
              )}
              <span className="text-xs font-semibold text-slate-700 hidden sm:inline">{admin.name.split(' ')[0]}</span>
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {children(admin)}
        </main>
      </div>
    </div>
  )
}
