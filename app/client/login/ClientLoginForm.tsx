'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Link from 'next/link'

export default function ClientLoginForm({ redirectTo }: { redirectTo: string }) {
  const supabase = createClient()
  const [mode, setMode] = useState<'login' | 'request'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [requested, setRequested] = useState(false)

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else window.location.href = redirectTo
  }

  const requestAccess = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.from('client_requests').insert({
      name, email, company: company || null, message: message || null
    })
    if (error) { setError('Something went wrong. Please try again.'); setLoading(false) }
    else { setRequested(true); setLoading(false) }
  }

  if (requested) return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-sm px-6 text-center">
        <img src="/logo.jpg" alt="Tasha Tongpreecha Casting" className="h-6 w-auto mx-auto mb-8" />
        <h2 className="text-sm tracking-widest uppercase mb-4">Request Received</h2>
        <p className="text-sm text-neutral-500 mb-8">Your request has been submitted. You'll receive an email once your account has been approved.</p>
        <Link href="/client" className="text-xs text-neutral-400 tracking-wider uppercase hover:text-black">← Back</Link>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-sm px-6 text-center">
        <img src="/logo.jpg" alt="Tasha Tongpreecha Casting" className="h-6 w-auto mx-auto mb-2" />
        <p className="text-xs tracking-widest uppercase text-neutral-400 mb-10">Client Portal</p>

        <div className="flex border border-neutral-200 mb-8">
          <button onClick={() => setMode('login')}
            className={`flex-1 py-2.5 text-xs tracking-widest uppercase transition-colors ${mode === 'login' ? 'bg-black text-white' : 'hover:bg-neutral-50'}`}>
            Sign In
          </button>
          <button onClick={() => setMode('request')}
            className={`flex-1 py-2.5 text-xs tracking-widest uppercase transition-colors ${mode === 'request' ? 'bg-black text-white' : 'hover:bg-neutral-50'}`}>
            Request Access
          </button>
        </div>

        {mode === 'login' ? (
          <form onSubmit={login} className="space-y-6 text-left">
            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
            <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">{loading ? 'Signing in...' : 'Sign In'}</Button>
            <p className="text-center">
              <button type="button" onClick={async () => {
                if (!email) { alert('Enter your email first'); return }
                await supabase.auth.resetPasswordForEmail(email, { redirectTo: 'https://cast.tashatongpreecha.com/client/reset-password' })
                alert('Reset link sent to ' + email)
              }} className="text-xs text-neutral-400 hover:text-black transition-colors tracking-wider">
                Forgot password?
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={requestAccess} className="space-y-6 text-left">
            <Input label="Your Name" value={name} onChange={e => setName(e.target.value)} required autoFocus />
            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <Input label="Company / Brand" value={company} onChange={e => setCompany(e.target.value)} />
            <div>
              <label className="label block mb-2">Message (optional)</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
                placeholder="Tell us about your project..."
                className="w-full border-b border-neutral-300 py-2 text-sm focus:outline-none focus:border-black bg-transparent resize-none placeholder:text-neutral-300" />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">{loading ? 'Submitting...' : 'Request Access'}</Button>
            <p className="text-xs text-neutral-400 text-center">A team member will review and approve your request.</p>
          </form>
        )}

        <Link href="/client" className="block mt-8 text-xs text-neutral-400 tracking-wider uppercase hover:text-black transition-colors">← Back</Link>
      </div>
    </main>
  )
}
