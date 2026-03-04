'use client'
import { useState } from 'react'
import Link from 'next/link'

const ROLES = [
  'Photographer', 'Videographer / Director', 'Stylist', 'Hair & Makeup',
  'Art Director', 'Creative Director', 'Production Company', 'PR Agency',
  'Brand / Client', 'Set Designer', 'Casting Director', 'Casting Assistant', 'Other'
]

export default function OtherForm() {
  const [form, setForm] = useState({
    first_name: '', last_name: '', role: '', company: '',
    email: '', phone: '', city: '', instagram: '', website: '', notes: '',
    opportunity_type: '', school_credit: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  const isCastingAssistant = form.role === 'Casting Assistant'

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/other-submission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        school_credit: form.school_credit === 'Yes' ? true : form.school_credit === 'No' ? false : null,
      }),
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
        <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-2">Industry Submission</p>
        <h1 className="text-2xl font-light tracking-widest uppercase mb-10">Your Details</h1>

        <form onSubmit={submit} className="space-y-6">
          <div className="flex flex-col gap-1">
            <label className="label">I Am A *</label>
            <select required value={form.role} onChange={e => set('role', e.target.value)}
              className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none focus:border-black">
              <option value="">Select your role</option>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Casting Assistant extras */}
          {isCastingAssistant && (
            <div className="space-y-5 border border-neutral-100 p-5 bg-neutral-50/50">
              <div>
                <p className="label mb-3">I am looking for a</p>
                <div className="flex gap-3">
                  {['Job', 'Internship'].map(opt => (
                    <button key={opt} type="button" onClick={() => { set('opportunity_type', opt); if (opt === 'Job') set('school_credit', '') }}
                      className={`px-5 py-2.5 text-xs border tracking-wider uppercase transition-colors ${form.opportunity_type === opt ? 'bg-black text-white border-black' : 'border-neutral-300 hover:border-black'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {form.opportunity_type === 'Internship' && (
                <div>
                  <p className="label mb-3">Can you receive school credit for this internship?</p>
                  <div className="flex gap-3">
                    {['Yes', 'No'].map(opt => (
                      <button key={opt} type="button" onClick={() => set('school_credit', opt)}
                        className={`px-5 py-2.5 text-xs border tracking-wider uppercase transition-colors ${form.school_credit === opt ? 'bg-black text-white border-black' : 'border-neutral-300 hover:border-black'}`}>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-neutral-400">
                Want to include your resume?{' '}
                <a href="/assistant" className="underline underline-offset-2 hover:text-black transition-colors">
                  Use our full casting assistant form →
                </a>
              </p>
            </div>
          )}

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
            <label className="label">Company / Studio</label>
            <input value={form.company} onChange={e => set('company', e.target.value)}
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
            <label className="label">Website / Portfolio</label>
            <input value={form.website} placeholder="https://" onChange={e => set('website', e.target.value)}
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
