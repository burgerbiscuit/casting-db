'use client'
import { useState, use } from 'react'

export default function TokenAccessPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/client-token-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Incorrect password'); setLoading(false); return }
      window.location.href = '/client'
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="px-8 py-6 border-b border-neutral-100">
        <img src="/logo.jpg" alt="Tasha Tongpreecha Casting" className="h-8 w-auto" />
      </header>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <h1 className="text-xl font-light tracking-widest uppercase mb-2 text-center">Client Portal</h1>
          <p className="text-sm text-neutral-400 text-center mb-10">Enter the password you received to access your presentations.</p>

          <form onSubmit={submit} className="space-y-6">
            <div>
              <label className="block text-xs tracking-widest uppercase text-neutral-500 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
                required
                className="w-full border-b border-neutral-300 py-3 text-sm focus:outline-none focus:border-black bg-transparent"
                placeholder="Enter your access password"
              />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-4 bg-black text-white text-xs tracking-widest uppercase hover:bg-neutral-800 transition-colors disabled:opacity-40"
            >
              {loading ? 'Signing in...' : 'Access Portal'}
            </button>
          </form>

          <p className="text-center text-xs text-neutral-300 mt-8">
            Questions? Contact <a href="mailto:tasha@tashatongpreecha.com" className="underline hover:text-neutral-500">tasha@tashatongpreecha.com</a>
          </p>
        </div>
      </div>
    </div>
  )
}
