'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Container, Logo } from '@/components/ui'
import { Menu, X, LogOut, FileText, ArrowRight, ChevronDown } from 'lucide-react'

const navLinks = [
  { name: 'Features', href: '/#features' },
  { name: 'How It Works', href: '/#how-it-works' },
  { name: 'Verify', href: '/scan' },
  { name: 'About', href: '/#about' },
]

export function Navbar({ isLoggedIn: _isLoggedIn, user: _user }: { isLoggedIn?: boolean, user?: any }) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [sessionLoaded, setSessionLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/student-session')
      .then(r => r.json())
      .then(data => {
        setUser(data.loggedIn ? data.user : null)
        setSessionLoaded(true)
      })
      .catch(() => setSessionLoaded(true))
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-xl border-b border-brand-border py-4 shadow-sm'
          : 'bg-transparent py-6'
      }`}
    >
      <Container>
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-brand-navy flex items-center justify-center transition-transform group-hover:scale-105">
              <Logo className="w-5 h-5" fill="white" />
            </div>
            <span className="text-xl font-medium text-brand-navy tracking-tight">
              Authblock
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="flex items-center gap-1.5 text-brand-navy/70 hover:text-brand-bright transition-colors duration-200 text-[15px] font-medium"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* CTA / Auth Area */}
          <div className="hidden lg:flex items-center gap-6">
            {!sessionLoaded ? (
              <div className="w-24 h-10 bg-slate-100 animate-pulse rounded-full" />
            ) : user ? (
              <div className="flex items-center gap-6">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 text-brand-navy hover:opacity-80 transition-opacity"
                >
                  <div className="w-9 h-9 rounded-full bg-brand-soft flex items-center justify-center text-brand-blue font-medium text-sm">
                    {user.full_name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium">{user.full_name}</span>
                </Link>
                <a
                  href="/api/student-logout"
                  className="text-sm font-medium text-brand-navy/60 hover:text-red-600 transition-colors"
                >
                  Sign Out
                </a>
              </div>
            ) : (
              <Link
                href="/login"
                className="group flex items-center gap-2 px-6 py-2.5 bg-brand-blue text-white text-[15px] font-medium rounded-full hover:bg-brand-bright transition-all duration-300 shadow-blue-glow hover:-translate-y-0.5"
              >
                Get Started
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden text-brand-navy p-2 hover:bg-brand-soft rounded-full transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-brand-border shadow-lg py-6 animate-fade-in">
            <div className="flex flex-col gap-2 px-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="flex items-center justify-between text-brand-navy/80 hover:text-brand-bright transition-colors py-3 text-lg font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              
              <div className="pt-6 mt-4 border-t border-brand-border flex flex-col gap-4">
                {!sessionLoaded ? null : user ? (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 p-4 bg-brand-soft rounded-2xl"
                    >
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-brand-blue font-medium text-lg">
                        {user.full_name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-base font-medium text-brand-navy">{user.full_name}</p>
                        <p className="text-xs text-brand-navy/60">{user.prn_no}</p>
                      </div>
                    </Link>
                    <a
                      href="/api/student-logout"
                      className="w-full text-center py-3 text-brand-navy border border-brand-border text-base font-medium rounded-full hover:bg-slate-50 transition-colors"
                    >
                      Sign Out
                    </a>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-blue text-white text-base font-medium rounded-full hover:bg-brand-bright transition-colors shadow-blue-glow"
                  >
                    Get Started <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </Container>
    </nav>
  )
}

