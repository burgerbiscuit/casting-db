'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Link from 'next/link'

type Mode = 'login' | 'forgot' | 'setup'

export default function AdminLogin() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<Mode>('login')
  const [sent, setSent] = useState(false)

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else window.location.href = '/admin'
  }

  const sendLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://cast.tashatongpreecha.com/admin/reset-password',
    })
    setLoading(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  const switchMode = (m: Mode) => { setMode(m); setError(''); setSent(false) }

  return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-sm px-6 text-center">
        <img src="/logo.jpg" alt="Tasha Tongpreecha Casting" className="h-6 w-auto mx-auto mb-2" />
        <p className="text-xs tracking-widest uppercase text-neutral-400 mb-10">Casting Team</p>

        {/* Tab switcher */}
        <div className="flex border border-neutral-200 mb-8">
          <button onClick={() => switchMode('login')}
            className={"flex-1 py-2 text-xs tracking-widest uppercase transition-colors " + (mode === 'login' ? 'bg-black text-white' : 'hover:bg-neutral-50 text-neutral-500')}>
            Sign In
          </button>
          <button onClick={() => switchMode('setup')}
            className={"flex-1 py-2 text-xs tracking-widest uppercase transition-colors " + (mode === 'setup' ? 'bg-black text-white' : 'hover:bg-neutral-50 text-neutral-500')}>
            New Account
          </button>
        </div>

        {sent ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-neutral-600">Check your email — a link has been sent to <strong>{email}</strong>.</p>
            <p className="text-xs text-neutral-400">Click the link to {mode === 'setup' ? 'set your password and access the team portal' : 'reset your password'}.</p>
            <button onClick={() => { setSent(false); setMode('login') }}
              className="text-xs text-neutral-400 hover:text-black transition-colors tracking-wider uppercase">
              ← Back to sign in
            </button>
          </div>
        ) : mode === 'login' ? (
          <form onSubmit={login} className="space-y-6 text-left">
            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
            <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            <p className="text-center">
              <button type="button" onClick={() => switchMode('forgot')}
                className="text-xs text-neutral-400 hover:text-black transition-colors tracking-wider">
                Forgot password?
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={sendLink} className="space-y-6 text-left">
            <p className="text-sm text-neutral-500 text-center">
              {mode === 'setup'
                ? 'Enter your team email and we\'ll send you a link to set your password.'
                : 'Enter your email and we\'ll send a reset link.'}
            </p>
            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Sending...' : mode === 'setup' ? 'Send Setup Link' : 'Send Reset Link'}
            </Button>
            <p className="text-center">
              <button type="button" onClick={() => switchMode('login')}
                className="text-xs text-neutral-400 hover:text-black transition-colors tracking-wider">
                ← Back to sign in
              </button>
            </p>
          </form>
        )}

        <Link href="/" className="block mt-8 text-xs text-neutral-400 tracking-wider uppercase hover:text-black transition-colors">← Back</Link>
      </div>
    </main>
  )
}
