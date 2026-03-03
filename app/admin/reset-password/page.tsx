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
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase puts the session in the URL hash after clicking the reset link
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
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
        <p className="text-xs tracking-widest uppercase text-neutral-400 mb-10">Reset Password</p>

        {done ? (
          <div className="space-y-4">
            <p className="text-sm text-neutral-600">Password updated. You can now sign in.</p>
            <a href="/admin/login" className="block text-xs tracking-widest uppercase underline hover:opacity-60">Sign In →</a>
          </div>
        ) : !ready ? (
          <p className="text-sm text-neutral-400">Loading — please wait or check your reset link is valid.</p>
        ) : (
          <form onSubmit={save} className="space-y-6 text-left">
            <Input label="New Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoFocus />
            <Input label="Confirm Password" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Saving...' : 'Set New Password'}
            </Button>
          </form>
        )}
      </div>
    </main>
  )
}
