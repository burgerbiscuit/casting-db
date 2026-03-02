'use client'
import { useState } from 'react'

const SKILLS = ['Acting','Dancing','Singing','Modeling','Athletics','Swimming','Yoga','Pilates','Martial Arts','Horseback Riding','Figure Skating','Painting','Music','Comedy','Voice Over']

export default function ScoutPage() {
  const [step, setStep] = useState<'form' | 'done'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    gender: '', date_of_birth: '', instagram_handle: '', portfolio_url: '',
    agency: '', height_ft: '', height_in: '', bust: '', waist: '', hips: '',
    chest: '', dress_size: '', shoe_size: '', suit_size: '',
    skills: [] as string[], notes: ''
  })

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const toggleSkill = (s: string) => set('skills', form.skills.includes(s) ? form.skills.filter(x => x !== s) : [...form.skills, s])

  const submit = async () => {
    if (!form.first_name || !form.last_name) { setError('Please enter your name.'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/scout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, skills: form.skills.join(', ') })
      })
      if (!res.ok) throw new Error('Submission failed')
      setStep('done')
    } catch (e) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'done') return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="text-center max-w-sm">
        <img src="/logo.jpg" alt="Tasha Tongpreecha Casting" className="h-8 w-auto mx-auto mb-10" />
        <h2 className="text-2xl font-light tracking-widest uppercase mb-4">Thank You</h2>
        <p className="text-sm text-neutral-500">Your submission has been received. We'll be in touch if there's a fit.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white px-6 py-12">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-12">
          <img src="/logo.jpg" alt="Tasha Tongpreecha Casting" className="h-8 w-auto mx-auto mb-8" />
          <h1 className="text-2xl font-light tracking-widest uppercase mb-2">Get Scouted</h1>
          <p className="text-sm text-neutral-400">Submit your information to be considered for future castings.</p>
        </div>

        <div className="space-y-6">
          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label block mb-1">First Name *</label>
              <input value={form.first_name} onChange={e => set('first_name', e.target.value)}
                className="w-full border-b border-neutral-200 py-2 text-sm focus:outline-none focus:border-black bg-transparent" />
            </div>
            <div>
              <label className="label block mb-1">Last Name *</label>
              <input value={form.last_name} onChange={e => set('last_name', e.target.value)}
                className="w-full border-b border-neutral-200 py-2 text-sm focus:outline-none focus:border-black bg-transparent" />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label block mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                className="w-full border-b border-neutral-200 py-2 text-sm focus:outline-none focus:border-black bg-transparent" />
            </div>
            <div>
              <label className="label block mb-1">Phone</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)}
                className="w-full border-b border-neutral-200 py-2 text-sm focus:outline-none focus:border-black bg-transparent" />
            </div>
          </div>

          {/* Gender + DOB */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label block mb-2">Gender</label>
              <div className="flex gap-3">
                {['Female','Male','Non-binary'].map(g => (
                  <button key={g} onClick={() => set('gender', g.toLowerCase())}
                    className={`text-xs tracking-widest uppercase px-3 py-1.5 border transition-colors ${form.gender === g.toLowerCase() ? 'bg-black text-white border-black' : 'border-neutral-300 hover:border-black'}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label block mb-1">Date of Birth</label>
              <input type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)}
                className="w-full border-b border-neutral-200 py-2 text-sm focus:outline-none focus:border-black bg-transparent" />
            </div>
          </div>

          {/* Socials */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label block mb-1">Instagram</label>
              <input value={form.instagram_handle} onChange={e => set('instagram_handle', e.target.value.replace('@',''))}
                placeholder="@handle" className="w-full border-b border-neutral-200 py-2 text-sm focus:outline-none focus:border-black bg-transparent" />
            </div>
            <div>
              <label className="label block mb-1">Portfolio / Website</label>
              <input value={form.portfolio_url} onChange={e => set('portfolio_url', e.target.value)}
                className="w-full border-b border-neutral-200 py-2 text-sm focus:outline-none focus:border-black bg-transparent" />
            </div>
          </div>

          {/* Agency */}
          <div>
            <label className="label block mb-1">Agency (if represented)</label>
            <input value={form.agency} onChange={e => set('agency', e.target.value)}
              className="w-full border-b border-neutral-200 py-2 text-sm focus:outline-none focus:border-black bg-transparent" />
          </div>

          {/* Sizing */}
          <div>
            <p className="label mb-3">Measurements</p>
            <div className="grid grid-cols-4 gap-3">
              {[['Height (ft)', 'height_ft'], ['Height (in)', 'height_in'], ['Shoe', 'shoe_size'], ['Dress', 'dress_size']].map(([label, key]) => (
                <div key={key}>
                  <label className="label block mb-1">{label}</label>
                  <input value={(form as any)[key]} onChange={e => set(key, e.target.value)}
                    className="w-full border-b border-neutral-200 py-2 text-sm focus:outline-none focus:border-black bg-transparent" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-3 mt-3">
              {form.gender === 'male'
                ? [['Chest', 'chest'], ['Waist', 'waist'], ['Inseam', 'inseam'], ['Suit', 'suit_size']].map(([label, key]) => (
                    <div key={key}>
                      <label className="label block mb-1">{label}</label>
                      <input value={(form as any)[key] || ''} onChange={e => set(key, e.target.value)}
                        className="w-full border-b border-neutral-200 py-2 text-sm focus:outline-none focus:border-black bg-transparent" />
                    </div>
                  ))
                : [['Bust', 'bust'], ['Waist', 'waist'], ['Hips', 'hips'], ['', '']].map(([label, key]) => label ? (
                    <div key={key}>
                      <label className="label block mb-1">{label}</label>
                      <input value={(form as any)[key]} onChange={e => set(key, e.target.value)}
                        className="w-full border-b border-neutral-200 py-2 text-sm focus:outline-none focus:border-black bg-transparent" />
                    </div>
                  ) : <div key="empty" />)
              }
            </div>
          </div>

          {/* Skills */}
          <div>
            <p className="label mb-3">Skills</p>
            <div className="flex flex-wrap gap-2">
              {SKILLS.map(s => (
                <button key={s} onClick={() => toggleSkill(s)}
                  className={`text-xs tracking-widest uppercase px-3 py-1.5 border transition-colors ${form.skills.includes(s) ? 'bg-black text-white border-black' : 'border-neutral-200 hover:border-black'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label block mb-1">Anything else you'd like us to know?</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
              className="w-full border-b border-neutral-200 py-2 text-sm focus:outline-none focus:border-black bg-transparent resize-none" />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button onClick={submit} disabled={loading}
            className="w-full py-4 bg-black text-white text-xs tracking-widest uppercase hover:bg-neutral-800 transition-colors disabled:opacity-50">
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}
