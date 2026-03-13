'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ProjectLoginForm({ projectName, redirectTo }: { projectName: string; redirectTo: string }) {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Incorrect email or password.'); setLoading(false) }
    else window.location.href = redirectTo
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-sm text-center">
        <p className="text-[9px] tracking-widest uppercase text-neutral-400 mb-2">Casting Presentation</p>
        <h1 className="text-lg font-light tracking-widest uppercase mb-10">{projectName}</h1>

        <form onSubmit={login} className="space-y-5 text-left">
          <div>
            <label className="block text-[10px] tracking-widest uppercase text-neutral-500 mb-1.5">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              required autoFocus autoComplete="email"
              className="w-full border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:border-black"
            />
          </div>
          <div>
            <label className="block text-[10px] tracking-widest uppercase text-neutral-500 mb-1.5">Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              required autoComplete="current-password"
              className="w-full border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:border-black"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-black text-white py-3 text-xs tracking-widest uppercase hover:bg-neutral-800 disabled:opacity-50 transition-colors">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
