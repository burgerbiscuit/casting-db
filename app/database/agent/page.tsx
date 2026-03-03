'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function AgentForm() {
  const [form, setForm] = useState({
    first_name: '', last_name: '', agency_name: '', email: '',
    phone: '', city: '', boards: '', instagram: '', website: '', notes: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/agent-submission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setLoading(false)
    setSubmitted(true)
  }

  if (submitted) return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-neutral-100 px-8 py-5">
        <img src="/logo.jpg" alt="Tasha Tongpreecha Casting" className="h-6 w-auto" />
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <p className="text-xs tracking-widest uppercase text-neutral-400 mb-4">Thank You</p>
        <h1 className="text-2xl font-light tracking-widest uppercase mb-4">Received</h1>
        <p className="text-sm text-neutral-500 mb-10 max-w-sm">Your details have been submitted. We'll be in touch if there's a fit.</p>
        <Link href="/database" className="text-[10px] tracking-widest uppercase underline underline-offset-4 text-neutral-400 hover:text-black">← Back</Link>
      </main>
    </div>
  )

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-neutral-100 px-8 py-5">
        <img src="/logo.jpg" alt="Tasha Tongpreecha Casting" className="h-6 w-auto" />
      </header>
      <main className="max-w-xl mx-auto w-full px-6 py-16">
        <Link href="/database" className="text-[10px] tracking-widest uppercase text-neutral-400 hover:text-black mb-10 block">← Back</Link>
        <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-2">Agent Submission</p>
        <h1 className="text-2xl font-light tracking-widest uppercase mb-10">Your Details</h1>

        <form onSubmit={submit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-1">
              <label className="label">First Name *</label>
              <input required value={form.first_name} onChange={e => set('first_name', e.target.value)}
                className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none focus:border-black" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="label">Last Name *</label>
              <input required value={form.last_name} onChange={e => set('last_name', e.target.value)}
                className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none focus:border-black" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="label">Agency Name *</label>
            <input required value={form.agency_name} onChange={e => set('agency_name', e.target.value)}
              className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none focus:border-black" />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-1">
              <label className="label">Email *</label>
              <input required type="email" value={form.email} onChange={e => set('email', e.target.value)}
                className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none focus:border-black" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="label">Phone</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)}
                className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none focus:border-black" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-1">
              <label className="label">City</label>
              <input value={form.city} onChange={e => set('city', e.target.value)}
                className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none focus:border-black" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="label">Instagram</label>
              <input value={form.instagram} placeholder="@handle" onChange={e => set('instagram', e.target.value)}
                className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none focus:border-black" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="label">Website</label>
            <input value={form.website} placeholder="https://" onChange={e => set('website', e.target.value)}
              className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none focus:border-black" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="label">Boards / Divisions</label>
            <input value={form.boards} placeholder="e.g. Women, Men, New Faces" onChange={e => set('boards', e.target.value)}
              className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none focus:border-black" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="label">Anything Else We Should Know</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
              className="w-full border border-neutral-200 bg-transparent p-3 text-sm focus:outline-none focus:border-black resize-none" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-black text-white py-3 text-xs tracking-widest uppercase hover:bg-neutral-800 transition-colors disabled:opacity-50">
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </main>
    </div>
  )
}
