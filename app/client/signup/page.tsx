'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ClientSignupPage() {
  const supabase = createClient()
  const [step, setStep] = useState<'form' | 'done'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', company: '', email: '', password: '', confirm: ''
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const inp = 'w-full border-b border-neutral-200 py-2.5 text-sm focus:outline-none focus:border-black bg-transparent placeholder:text-neutral-300'

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.name) { setError('Please enter your name.'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }

    setLoading(true)
    try {
      // Create auth account
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { name: form.name } }
      })
      if (signUpErr) throw new Error(signUpErr.message)
      if (!data.user) throw new Error('Signup failed.')

      // Create client profile
      await supabase.from('client_profiles').upsert({
        user_id: data.user.id,
        name: form.name,
        email: form.email,
        company: form.company || null,
      }, { onConflict: 'user_id' })

      setStep('done')
    } catch (err: any) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'done') return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <img src="/logo.jpg" alt="Tasha Tongpreecha Casting" className="h-6 w-auto mb-10" />
      <div className="max-w-sm text-center">
        <h1 className="text-xl font-light tracking-widest uppercase mb-4">Account Created</h1>
        <p className="text-sm text-neutral-500 mb-2">
          You're in. A team member will assign you access to your project shortly.
        </p>
        <p className="text-sm text-neutral-400 mb-10">
          Once assigned, you'll be able to log in and view your presentations.
        </p>
        <Link href="/client/login"
          className="inline-block bg-black text-white text-xs tracking-widest uppercase px-8 py-3 hover:bg-neutral-800 transition-colors">
          Go to Login
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <img src="/logo.jpg" alt="Tasha Tongpreecha Casting" className="h-6 w-auto mx-auto mb-2" />
          <p className="text-xs tracking-widest uppercase text-neutral-400">Client Portal</p>
        </div>

        <h1 className="text-xl font-light tracking-widest uppercase mb-8 text-center">Create Account</h1>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="label block mb-1">Full Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} required autoFocus className={inp} />
          </div>
          <div>
            <label className="label block mb-1">Company / Brand</label>
            <input value={form.company} onChange={e => set('company', e.target.value)} placeholder="Optional" className={inp} />
          </div>
          <div>
            <label className="label block mb-1">Email *</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required className={inp} />
          </div>
          <div>
            <label className="label block mb-1">Password *</label>
            <input type="password" value={form.password} onChange={e => set('password', e.target.value)} required minLength={8} placeholder="At least 8 characters" className={inp} />
          </div>
          <div>
            <label className="label block mb-1">Confirm Password *</label>
            <input type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)} required className={inp} />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-3.5 bg-black text-white text-xs tracking-widest uppercase hover:bg-neutral-800 transition-colors disabled:opacity-40 mt-2">
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-6 text-xs text-neutral-400">
          Already have an account?{' '}
          <Link href="/client/login" className="underline underline-offset-2 hover:text-black transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
