'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ShareGate({ presentationId, presentationName }: { presentationId: string; presentationName: string }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/share-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ presentationId, password }),
    })
    if (res.ok) {
      router.push(`/client/presentations/${presentationId}`)
    } else {
      setError('Incorrect password')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400 mb-2">
          Tasha Tongpreecha Casting
        </p>
        <h1 className="text-xl tracking-widest uppercase font-light mb-1">{presentationName}</h1>
        <p className="text-xs text-neutral-400 mb-10">Enter the password to view this presentation</p>

        <form onSubmit={submit} className="space-y-5">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className="w-full border-b border-neutral-300 py-2.5 text-center text-sm tracking-widest focus:outline-none focus:border-black transition-colors placeholder:text-neutral-300 placeholder:tracking-widest"
          />
          {error && <p className="text-xs text-red-400 tracking-wide">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-black text-white py-3 text-[10px] tracking-[0.3em] uppercase hover:bg-neutral-800 transition-colors disabled:opacity-40">
            {loading ? 'Checking...' : 'View Presentation'}
          </button>
        </form>
      </div>
    </div>
  )
}
