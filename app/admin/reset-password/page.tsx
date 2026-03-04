'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function ResetPassword() {
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'checking' | 'loggedin' | 'recovery' | 'invalid'>('checking')

  useEffect(() => {
    // Check if already logged in (change password flow)
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setMode('loggedin'); return }
    })
    // Also listen for PASSWORD_RECOVERY event from reset link
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setMode('recovery')
    })
    setTimeout(() => setMode(m => m === 'checking' ? 'invalid' : m), 3000)
  }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) setError(error.message)
    else setDone(true)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-sm px-6 text-center">
        <img src="/logo.jpg" alt="Tasha Tongpreecha Casting" className="h-6 w-auto mx-auto mb-2" />
        <p className="text-xs tracking-widest uppercase text-neutral-400 mb-10">Change Password</p>

        {done ? (
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">Password updated successfully.</p>
            <a href="/admin" className="block text-xs tracking-widest uppercase underline hover:opacity-60">Back to Admin →</a>
          </div>
        ) : mode === 'checking' ? (
          <p className="text-sm text-neutral-400">Loading...</p>
        ) : mode === 'invalid' ? (
          <div className="space-y-4">
            <p className="text-sm text-neutral-500">Invalid or expired link.</p>
            <a href="/admin/login" className="block text-xs tracking-widest uppercase underline hover:opacity-60">Back to Sign In →</a>
          </div>
        ) : (
          <form onSubmit={save} className="space-y-6 text-left">
            <Input label="New Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoFocus />
            <Input label="Confirm Password" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Saving...' : 'Set New Password'}
            </Button>
            <a href="/admin" className="block text-center text-xs tracking-widest uppercase text-neutral-400 hover:text-black">Cancel</a>
          </form>
        )}
      </div>
    </main>
  )
}
