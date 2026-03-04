'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const DEMO_PROJECT_ID = '7539e334-c3f1-4caf-a931-3b2f4929d78f'

export default function DemoPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/demo-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'Incorrect password.')
      setLoading(false)
      return
    }
    router.push(`/demo/${DEMO_PROJECT_ID}`)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-neutral-100 px-8 py-5">
        <img src="/logo.jpg" alt="Tasha Tongpreecha Casting" className="h-6 w-auto" />
      </header>
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-2 text-center">Demo</p>
          <h1 className="text-2xl font-light tracking-widest uppercase text-center mb-10">Enter Password</h1>

          <form onSubmit={submit} className="space-y-6">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              required
              className="w-full border-b border-neutral-300 bg-transparent py-3 text-sm text-center tracking-widest focus:outline-none focus:border-black"
            />
            {error && <p className="text-xs text-red-500 text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 text-xs tracking-widest uppercase hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              {loading ? '...' : 'Enter'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
