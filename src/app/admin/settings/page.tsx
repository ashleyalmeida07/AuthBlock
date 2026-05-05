'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Settings, User, Phone, Briefcase, Mail, Shield,
  Save, Loader2, CheckCircle, AlertCircle, Calendar, Hash
} from 'lucide-react'
import AdminShell, { type AdminRecord } from '@/components/admin/AdminShell'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
        <div className="text-sm font-medium text-slate-700 truncate">{value || '—'}</div>
      </div>
    </div>
  )
}

function SettingsContent({ currentUser }: { currentUser: AdminRecord }) {
  const [form, setForm] = useState({
    name: currentUser.name || '',
    phone: currentUser.phone || '',
    position: currentUser.position || '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    setError('')
    setSuccess(false)

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentUser.id, ...form }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const isSuperAdmin = currentUser.admin_type === 'superadmin'
  const joinedDate = new Date(currentUser.created_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <div className="max-w-5xl mx-auto space-y-6 w-full">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
          <p className="text-slate-500 mt-1.5 text-sm">Manage your profile and account preferences.</p>
        </div>
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${
          isSuperAdmin
            ? 'bg-amber-50 border-amber-200 text-amber-700'
            : 'bg-blue-50 border-blue-200 text-blue-700'
        }`}>
          <Shield className="w-3.5 h-3.5" />
          {isSuperAdmin ? 'Superadmin' : 'Admin'}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left — Account Info */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1 space-y-4"
        >
          {/* Avatar card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center text-center gap-3">
            {currentUser.firebase_photo_url ? (
              <img
                src={currentUser.firebase_photo_url}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 shadow-sm"
              />
            ) : (
              <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-sm ${
                isSuperAdmin
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                  : 'bg-gradient-to-br from-blue-500 to-cyan-500'
              }`}>
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="font-bold text-slate-900 text-base">{currentUser.name}</div>
              <div className="text-xs text-slate-500 mt-0.5">{currentUser.position || 'No position set'}</div>
            </div>
            <div className="w-full pt-1 border-t border-slate-100">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Auth Provider</div>
              <div className="flex items-center justify-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${currentUser.firebase_uid ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className="text-xs font-medium text-slate-600">
                  {currentUser.firebase_uid ? 'Google Auth — Active' : 'Pending First Login'}
                </span>
              </div>
            </div>
          </div>

          {/* Read-only info */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Account Details</div>
            <InfoRow icon={Mail}     label="Email"      value={currentUser.email} />
            <InfoRow icon={Hash}     label="Account ID" value={currentUser.id} />
            <InfoRow icon={Shield}   label="Role"       value={isSuperAdmin ? 'Superadmin' : 'Admin'} />
            <InfoRow icon={Calendar} label="Joined"     value={joinedDate} />
          </div>
        </motion.div>

        {/* Right — Edit Profile */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-2 space-y-4"
        >
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-800">Edit Profile</h2>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              {/* Notifications */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700"
                >
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  Profile updated successfully.
                </motion.div>
              )}

              <Field label="Full Name">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={set('name')}
                    className="input pl-9"
                    placeholder="Your full name"
                  />
                </div>
              </Field>

              <Field label="Phone Number">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={form.phone}
                    onChange={set('phone')}
                    className="input pl-9"
                    placeholder="+91 00000 00000"
                  />
                </div>
              </Field>

              <Field label="Position / Designation">
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={form.position}
                    onChange={set('position')}
                    className="input pl-9"
                    placeholder="e.g. Controller of Examination"
                  />
                </div>
              </Field>

              <Field label="Email Address">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={currentUser.email}
                    disabled
                    className="input pl-9 bg-slate-50 text-slate-400 cursor-not-allowed"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Email is linked to your Google account and cannot be changed here.
                </p>
              </Field>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 py-2.5 px-6 font-semibold text-white rounded-lg bg-blue-600 hover:bg-blue-700 border border-blue-700 transition-colors disabled:opacity-60 text-sm"
                >
                  {isSaving
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                    : <><Save className="w-4 h-4" /> Save Changes</>
                  }
                </button>
              </div>
            </form>
          </div>

          {/* Security info card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-800">Security</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2.5 border-b border-slate-100">
                <div>
                  <div className="text-sm font-medium text-slate-700">Authentication Method</div>
                  <div className="text-xs text-slate-400 mt-0.5">Managed via Google OAuth (Firebase)</div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                  Google Auth
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <div>
                  <div className="text-sm font-medium text-slate-700">Session Status</div>
                  <div className="text-xs text-slate-400 mt-0.5">Your current authenticated session</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-700">Active</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <AdminShell>
      {(admin) => <SettingsContent currentUser={admin} />}
    </AdminShell>
  )
}
