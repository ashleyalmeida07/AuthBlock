'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Logo } from '@/components/ui'
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
      { icon: Settings,       label: 'Settings',        href: '/admin/settings',   accent: '#2563EB' },
    ]
  }
]

export default function AdminShell({ children }: AdminShellProps) {
  const router   = useRouter()
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [admin, setAdmin]           = useState<AdminRecord | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const fetchAdmin = useCallback(async (email: string) => {
    try {
      const res  = await fetch(`/api/admin/me?email=${encodeURIComponent(email)}`)
      const data = await res.json()
      if (data.admin) {
        setAdmin(data.admin)
      } else {
        // Email authenticated via Google but not found in admin DB
        console.error('[AdminShell] Admin not found for email:', email, data)
        await signOut({ callbackUrl: '/admin/login?error=AccessDenied' })
      }
    } catch (err) {
      console.error('[AdminShell] fetchAdmin error:', err)
      await signOut({ callbackUrl: '/admin/login?error=AccessDenied' })
    }
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/admin/login')
    } else if (status === 'authenticated' && session?.user?.email) {
      fetchAdmin(session.user.email)
    }
  }, [status, session, router, fetchAdmin])

  async function handleSignOut() {
    await signOut({ callbackUrl: '/admin/login' })
  }

  if (status === 'loading' || (status === 'authenticated' && !admin)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="flex items-center gap-3 text-brand-navy/60">
          <div className="w-5 h-5 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Authenticating…</span>
        </div>
      </div>
    )
  }

  if (!admin) return null


  const isSuperAdmin = admin.admin_type === 'superadmin'
  const pageTitle = pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-brand-border">

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-[60px] border-b border-brand-border/50 shrink-0">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-brand-blue shadow-sm shadow-blue-glow">
          <Logo className="w-4 h-4" fill="white" />
        </div>
        <span className="text-sm font-bold tracking-widest text-brand-heading uppercase">AuthBlock</span>
        <button className="ml-auto lg:hidden text-brand-navy/40 hover:text-brand-navy/80 transition-colors" onClick={() => setSidebarOpen(false)}>
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
              <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-brand-navy/40">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {visibleItems.map(item => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group relative ${
                        isActive ? 'text-brand-bright bg-brand-soft' : 'text-brand-navy/60 hover:text-brand-heading hover:bg-brand-bg'
                      }`}
                    >
                      {/* Active left border */}
                      {isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-brand-blue" />
                      )}
                      <item.icon
                        className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-brand-blue' : 'text-brand-navy/40 group-hover:text-brand-navy/60'}`}
                      />
                      <span className="flex-1">{item.label}</span>
                      {isActive && (
                        <ChevronRight className="w-3 h-3 opacity-50 text-brand-blue" />
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
      <div className="px-3 py-4 border-t border-brand-border/50 shrink-0 bg-white">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-2 bg-brand-bg border border-brand-border/50">
          {session?.user?.image ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={session.user.image} alt={admin.name} className="w-8 h-8 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 bg-brand-blue shadow-sm">
              {admin.name[0].toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-brand-heading truncate">{admin.name}</div>
            <div className={`text-[10px] font-medium ${isSuperAdmin ? 'text-amber-600' : 'text-brand-navy/60'}`}>
              {isSuperAdmin ? '⬡ Superadmin' : '◯ Admin'}
            </div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-all text-brand-navy/60 hover:text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign out
        </button>
      </div>
    </div>
  )

  return (
    <div className="h-screen flex overflow-hidden bg-brand-bg">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 lg:hidden" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full z-30 w-60 transition-transform duration-300 flex flex-col
        lg:static lg:translate-x-0 lg:shrink-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="h-[60px] bg-white border-b border-brand-border flex items-center px-4 gap-4 shrink-0">
          <button
            className="lg:hidden p-1.5 rounded-lg transition-colors text-brand-navy/60 hover:bg-slate-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm min-w-0">
            <span className="text-brand-navy/40 font-medium hidden sm:inline">Admin</span>
            <span className="text-brand-navy/30 hidden sm:inline">/</span>
            <span className="font-semibold text-brand-heading capitalize truncate">{pageTitle}</span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Chain status pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-brand-border bg-brand-bg text-xs font-semibold text-brand-navy/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Sepolia
            </div>

            {/* Admin avatar */}
            <div className="flex items-center gap-2 pl-3 border-l border-brand-border">
              {session?.user?.image ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={session.user.image} alt={admin.name} className="w-7 h-7 rounded-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ background: '#2563EB' }}>
                  {admin.name[0].toUpperCase()}
                </div>
              )}
              <span className="text-xs font-semibold text-brand-navy hidden sm:inline">{admin.name.split(' ')[0]}</span>
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-brand-bg">
          {children(admin)}
        </main>
      </div>
    </div>
  )
}
