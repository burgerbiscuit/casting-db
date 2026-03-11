'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

const ETHNICITY_OPTIONS = [
  'Asian', 'South Asian', 'Black / African', 'Latino / Hispanic',
  'White / European', 'Middle Eastern', 'Pacific Islander', 'Indigenous',
  'Mixed', 'Other',
]

const HEIGHT_FT = [4, 5, 6, 7]
const HEIGHT_IN = [0,1,2,3,4,5,6,7,8,9,10,11]

export default function ClimberPage() {
  const [step, setStep] = useState<'form' | 'done'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    gender: '',
    height_ft: 5,
    height_in: 7,
    ethnicity: '',
    instagram_handle: '',
    based_in: '',
    email: '',
    phone: '',
    home_gym: '',
    why_climb: '',
  })

  const [selfieFiles, setSelfieFiles] = useState<(File | null)[]>([null, null])
  const [selfieUrls, setSelfieUrls] = useState<string[]>(['', ''])
  const [photoErrors, setPhotoErrors] = useState<string[]>(['', ''])
  const [photoCompressing, setPhotoCompressing] = useState<boolean[]>([false, false])
  const gymRef = useRef<HTMLDivElement>(null)
  const [gymSuggestions, setGymSuggestions] = useState<string[]>([])
  const [showGymDropdown, setShowGymDropdown] = useState(false)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (gymRef.current && !gymRef.current.contains(e.target as Node)) setShowGymDropdown(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const fetchGymSuggestions = async (q: string) => {
    if (!q.trim()) { setGymSuggestions([]); setShowGymDropdown(false); return }
    const res = await fetch(`/api/gym-suggestions?q=${encodeURIComponent(q)}`)
    const data = await res.json()
    setGymSuggestions(data)
    setShowGymDropdown(data.length > 0)
  }

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('Please enter your full name.')
      return
    }
    if (!form.email.trim()) {
      setError('Email is required.')
      return
    }
    const photos = selfieFiles.filter(Boolean) as File[]
    if (photos.length < 1) {
      setError('Please upload at least one photo.')
      return
    }

    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('first_name', form.first_name.trim())
      fd.append('last_name', form.last_name.trim())
      fd.append('gender', form.gender)
      fd.append('height_ft', String(form.height_ft))
      fd.append('height_in', String(form.height_in))
      fd.append('ethnicity_broad', form.ethnicity)
      fd.append('instagram_handle', form.instagram_handle.trim())
      fd.append('based_in', form.based_in.trim())
      fd.append('email', form.email.trim())
      fd.append('phone', form.phone.trim())
      fd.append('home_gym', form.home_gym.trim())
      fd.append('notes', form.why_climb.trim())
      fd.append('source', 'climber')
      photos.forEach(p => fd.append('photos', p))

      const res = await fetch('/api/scout', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Submission failed. Please try again.'); setLoading(false); return }
      setStep('done')
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (step === 'done') return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-neutral-100 px-8 py-5">
        <img src="/logo.jpg" alt="Tasha Tongpreecha Casting" className="h-6 w-auto" />
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <p className="text-xs tracking-widest uppercase text-neutral-400 mb-4">Thank You</p>
        <h1 className="text-2xl font-light tracking-widest uppercase mb-4">Received</h1>
        <p className="text-sm text-neutral-500 mb-10 max-w-sm">
          Your story has been submitted. We'll be in touch if there's a fit.
        </p>
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
        <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-2">Climbers / Stories</p>
        <h1 className="text-2xl font-light tracking-widest uppercase mb-3">Your Story</h1>
        <p className="text-xs text-neutral-400 mb-10 leading-relaxed">Tell us about yourself and what climbing means to you.</p>

        <form onSubmit={submit} className="space-y-7">

          {/* Name */}
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

          {/* Gender */}
          <div className="flex flex-col gap-2">
            <label className="label">Gender</label>
            <div className="flex flex-wrap gap-2">
              {['female', 'male', 'non-binary', 'prefer not to say'].map(g => (
                <button key={g} type="button" onClick={() => set('gender', g)}
                  className={`px-4 py-2 text-xs border tracking-wider uppercase transition-colors ${form.gender === g ? 'bg-black text-white border-black' : 'border-neutral-300 hover:border-black'}`}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Height */}
          <div className="flex flex-col gap-1">
            <label className="label">Height</label>
            <div className="flex gap-3">
              <select value={form.height_ft} onChange={e => set('height_ft', parseInt(e.target.value))}
                className="border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none focus:border-black">
                {HEIGHT_FT.map(f => <option key={f} value={f}>{f} ft</option>)}
              </select>
              <select value={form.height_in} onChange={e => set('height_in', parseInt(e.target.value))}
                className="border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none focus:border-black">
                {HEIGHT_IN.map(i => <option key={i} value={i}>{i} in</option>)}
              </select>
            </div>
          </div>

          {/* Ethnicity */}
          <div className="flex flex-col gap-1">
            <label className="label">Ethnicity</label>
            <select value={form.ethnicity} onChange={e => set('ethnicity', e.target.value)}
              className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none focus:border-black">
              <option value="">Select...</option>
              {ETHNICITY_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>

          {/* Instagram */}
          <div className="flex flex-col gap-1">
            <label className="label">Instagram</label>
            <div className="relative">
              <span className="absolute left-0 top-2 text-sm text-neutral-400">@</span>
              <input value={form.instagram_handle} onChange={e => set('instagram_handle', e.target.value.replace(/^@/, ''))}
                placeholder="yourhandle"
                className="w-full pl-4 border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none focus:border-black placeholder:text-neutral-300" />
            </div>
          </div>

          {/* Based In */}
          <div className="flex flex-col gap-1">
            <label className="label">Where Are You Based?</label>
            <input value={form.based_in} onChange={e => set('based_in', e.target.value)}
              placeholder="City, State / Country"
              className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none focus:border-black placeholder:text-neutral-300" />
          </div>

          {/* Home Gym */}
          <div className="flex flex-col gap-1" ref={gymRef}>
            <label className="label">Your Home Gym</label>
            <div className="relative">
              <input
                value={form.home_gym}
                onChange={e => { set('home_gym', e.target.value); fetchGymSuggestions(e.target.value) }}
                onFocus={() => form.home_gym && setShowGymDropdown(gymSuggestions.length > 0)}
                placeholder="e.g. Vital BK, Brooklyn Boulders..."
                autoComplete="off"
                className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none focus:border-black placeholder:text-neutral-300"
              />
              {showGymDropdown && gymSuggestions.length > 0 && (
                <div className="absolute z-20 left-0 right-0 top-full bg-white border border-neutral-200 shadow-sm max-h-48 overflow-y-auto">
                  {gymSuggestions.map(s => (
                    <button key={s} type="button"
                      onMouseDown={() => { set('home_gym', s); setShowGymDropdown(false) }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-neutral-50 transition-colors border-b border-neutral-50 last:border-0">
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-1">
              <label className="label">Email *</label>
              <input required type="email" value={form.email} onChange={e => set('email', e.target.value)}
                className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none focus:border-black" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="label">Phone</label>
              <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none focus:border-black" />
            </div>
          </div>

          {/* Why do you climb */}
          <div className="flex flex-col gap-2">
            <label className="label">Why Do You Climb, and What Does It Mean to You?</label>
            <p className="text-[10px] text-neutral-400 leading-relaxed">Share your story in your own words.</p>
            <textarea
              value={form.why_climb}
              onChange={e => set('why_climb', e.target.value)}
              rows={6}
              placeholder="Tell us your story..."
              className="w-full border border-neutral-200 bg-transparent p-3 text-sm focus:outline-none focus:border-black resize-none placeholder:text-neutral-300"
            />
          </div>

          {/* Photos */}
          <div>
            <p className="label mb-2">Photos (Optional)</p>
            <p className="text-xs text-neutral-400 mb-1">Upload up to 2 photos of yourself.</p>
            <p className="text-xs text-neutral-400 mb-1">A portrait and a climbing photo if you have one.</p>
            <p className="text-[11px] text-neutral-300 mb-3">Max 8 MB per photo — large images are automatically compressed.</p>
            <div className="flex gap-3">
              {[0, 1].map(i => (
                <div key={i} className="flex-1 flex flex-col gap-1">
                  <label className={`aspect-[3/4] border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-black transition-colors overflow-hidden relative ${photoErrors[i] ? 'border-red-300' : 'border-neutral-200'}`}>
                    <input type="file" accept="image/*" className="hidden" onChange={async e => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      if (file.size > 20 * 1024 * 1024) {
                        const errs = [...photoErrors]; errs[i] = `Too large (${(file.size/1024/1024).toFixed(0)} MB). Max 8 MB.`; setPhotoErrors(errs)
                        return
                      }
                      const errs = [...photoErrors]; errs[i] = ''; setPhotoErrors(errs)
                      const compressing = [...photoCompressing]; compressing[i] = true; setPhotoCompressing(compressing)
                      const { compressImage } = await import('@/lib/compress-image')
                      const compressed = await compressImage(file).catch(() => file)
                      const done = [...photoCompressing]; done[i] = false; setPhotoCompressing(done)
                      const f = [...selfieFiles]; f[i] = compressed; setSelfieFiles(f)
                      const u = [...selfieUrls]; u[i] = URL.createObjectURL(compressed); setSelfieUrls(u)
                    }} />
                    {photoCompressing[i]
                      ? <span className="text-[10px] text-neutral-400 tracking-widest uppercase">Compressing…</span>
                      : selfieUrls[i]
                        ? <img src={selfieUrls[i]} className="w-full h-full object-cover" alt="" />
                        : <span className="text-xs text-neutral-300 tracking-widest uppercase">+ Photo {i + 1}</span>}
                  </label>
                  {photoErrors[i] && <p className="text-[10px] text-red-500">{photoErrors[i]}</p>}
                </div>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-black text-white py-3 text-xs tracking-widest uppercase hover:bg-neutral-800 transition-colors disabled:opacity-50 mt-2">
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </main>
    </div>
  )
}
