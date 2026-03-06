'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChipInput } from '@/components/ChipInput'
import { Upload, X } from 'lucide-react'

const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry Level', desc: '0–2 years' },
  { value: 'mid', label: 'Mid Level', desc: '2–5 years' },
  { value: 'senior', label: 'Senior', desc: '5–10 years' },
  { value: 'director', label: 'Casting Director', desc: '10+ years' },
]

const SOFTWARE_OPTIONS = [
  'Casting Networks', 'Spotlight', 'Actors Access', 'Now Casting',
  'The Casting Frontier', 'Backstage', 'Mandy', 'Excel', 'Google Sheets'
]

export default function AssistantPage() {
  const supabase = createClient()
  const [step, setStep] = useState<'form' | 'done'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resumeFile, setResumeFile] = useState<File | null>(null)

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    city: '', country: '',
    opportunity_type: '', // 'Job' | 'Internship'
    school_credit: null as boolean | null,
    experience_level: '',
    years_experience: '',
    languages: [] as string[],
    skills: [] as string[],
    software: [] as string[],
    instagram_handle: '', website_url: '',
    notes: '',
  })

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const inp = 'w-full border-b border-neutral-200 py-2 text-sm focus:outline-none focus:border-black bg-transparent placeholder:text-neutral-300'
  const lbl = 'label block mb-1'

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.first_name || !form.last_name) { setError('Please enter your name.'); return }
    if (!form.email) { setError('Email is required.'); return }
    setLoading(true); setError('')

    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (Array.isArray(v)) fd.append(k, JSON.stringify(v))
        else fd.append(k, String(v ?? ''))
      })
      if (resumeFile) fd.append('resume', resumeFile)

      const res = await fetch('/api/assistant-submit', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed')
      setStep('done')
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'done') return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="px-8 py-6 border-b border-neutral-100">
        <img src="/logo.jpg" alt="Tasha Tongpreecha Casting" className="h-8 w-auto" />
      </header>
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <h2 className="text-2xl font-light tracking-widest uppercase mb-4">Thank You</h2>
          <p className="text-sm text-neutral-500 mb-8">Your resume has been received. We'll be in touch when there's an opportunity that fits.</p>
          <a href="https://www.tashatongpreecha.com" target="_blank" rel="noopener noreferrer"
            className="text-xs tracking-widest uppercase text-neutral-400 hover:text-black transition-colors">
            ← Back to Website
          </a>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white px-6 py-12">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-12">
          <img src="/logo.jpg" alt="" className="h-8 w-auto mx-auto mb-8" />
          <h1 className="text-2xl font-light tracking-widest uppercase mb-2">Casting Assistant</h1>
          <p className="text-sm text-neutral-400">Submit your resume to be considered for casting assistant opportunities.</p>
        </div>

        <form onSubmit={submit} className="space-y-8">
          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div><label className={lbl}>First Name *</label><input value={form.first_name} onChange={e => set('first_name', e.target.value)} className={inp} required autoFocus /></div>
            <div><label className={lbl}>Last Name *</label><input value={form.last_name} onChange={e => set('last_name', e.target.value)} className={inp} required /></div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div><label className={lbl}>Email *</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inp} required /></div>
            <div><label className={lbl}>Phone</label><input value={form.phone} onChange={e => set('phone', e.target.value)} className={inp} /></div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div><label className={lbl}>City</label><input value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. New York" className={inp} /></div>
            <div><label className={lbl}>Country</label><input value={form.country} onChange={e => set('country', e.target.value)} placeholder="e.g. USA" className={inp} /></div>
          </div>

          {/* Job or Internship */}
          <div>
            <p className="label mb-3">I am looking for a</p>
            <div className="flex gap-3">
              {['Job', 'Internship'].map(opt => (
                <button key={opt} type="button"
                  onClick={() => setForm(f => ({ ...f, opportunity_type: opt, school_credit: opt === 'Job' ? null : f.school_credit }))}
                  className={`px-6 py-3 text-left border transition-colors ${form.opportunity_type === opt ? 'bg-black text-white border-black' : 'border-neutral-200 hover:border-black'}`}>
                  <p className="text-xs font-medium tracking-wider uppercase">{opt}</p>
                </button>
              ))}
            </div>
          </div>

          {/* School credit — only if internship */}
          {form.opportunity_type === 'Internship' && (
            <div>
              <p className="label mb-3">Can you receive school credit for this internship?</p>
              <div className="flex gap-3">
                {[{ label: 'Yes', value: true }, { label: 'No', value: false }].map(opt => (
                  <button key={opt.label} type="button"
                    onClick={() => setForm(f => ({ ...f, school_credit: opt.value }))}
                    className={`px-6 py-2.5 text-xs border tracking-wider uppercase transition-colors ${form.school_credit === opt.value ? 'bg-black text-white border-black' : 'border-neutral-200 hover:border-black'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Experience Level */}
          <div>
            <p className="label mb-3">Experience Level</p>
            <div className="grid grid-cols-2 gap-2">
              {EXPERIENCE_LEVELS.map(lvl => (
                <button key={lvl.value} type="button" onClick={() => set('experience_level', lvl.value)}
                  className={`px-4 py-3 text-left border transition-colors ${form.experience_level === lvl.value ? 'bg-black text-white border-black' : 'border-neutral-200 hover:border-black'}`}>
                  <p className="text-xs font-medium tracking-wider uppercase">{lvl.label}</p>
                  <p className={`text-[10px] mt-0.5 ${form.experience_level === lvl.value ? 'text-white/70' : 'text-neutral-400'}`}>{lvl.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Years experience */}
          <div>
            <label className={lbl}>Years of Experience</label>
            <input type="number" min="0" max="50" value={form.years_experience}
              onChange={e => set('years_experience', e.target.value)}
              placeholder="e.g. 3" className={inp} />
          </div>

          {/* Languages */}
          <ChipInput label="Languages Spoken" value={form.languages} onChange={v => set('languages', v)} placeholder="e.g. English, Spanish — press Enter" />

          {/* Skills */}
          <div>
            <p className="label mb-1">Skills</p>
            <p className="text-xs text-neutral-400 mb-3">Casting-specific skills and specialties.</p>
            <ChipInput value={form.skills} onChange={v => set('skills', v)}
              placeholder="e.g. Talent Scouting, Commercial Casting, Kids Casting..." />
          </div>

          {/* Software */}
          <div>
            <p className="label mb-3">Software & Platforms</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {SOFTWARE_OPTIONS.map(s => (
                <button key={s} type="button"
                  onClick={() => set('software', form.software.includes(s) ? form.software.filter((x: string) => x !== s) : [...form.software, s])}
                  className={`text-xs px-3 py-1.5 border transition-colors ${form.software.includes(s) ? 'bg-black text-white border-black' : 'border-neutral-200 hover:border-black text-neutral-600'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Social */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Instagram</label>
              <input value={form.instagram_handle} onChange={e => set('instagram_handle', e.target.value.replace('@', ''))}
                placeholder="handle (no @)" className={inp} />
            </div>
            <div>
              <label className={lbl}>Website / Portfolio</label>
              <input value={form.website_url} onChange={e => set('website_url', e.target.value)}
                placeholder="yoursite.com" className={inp} />
            </div>
          </div>

          {/* Resume Upload */}
          <div>
            <p className="label mb-2">Resume *</p>
            <p className="text-xs text-neutral-400 mb-3">PDF preferred. Max 10MB.</p>
            {resumeFile ? (
              <div className="flex items-center justify-between border border-neutral-200 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-neutral-100 flex items-center justify-center text-[10px] tracking-widest uppercase text-neutral-500">
                    {resumeFile.name.split('.').pop()?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-medium">{resumeFile.name}</p>
                    <p className="text-[10px] text-neutral-400">{(resumeFile.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                </div>
                <button type="button" onClick={() => setResumeFile(null)} className="text-neutral-300 hover:text-red-400 transition-colors">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 p-8 cursor-pointer hover:border-black transition-colors gap-3">
                <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => setResumeFile(e.target.files?.[0] || null)} />
                <Upload size={20} className="text-neutral-300" />
                <span className="text-xs tracking-widest uppercase text-neutral-400">Click to upload resume</span>
                <span className="text-[10px] text-neutral-300">PDF, DOC, DOCX</span>
              </label>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className={lbl}>Anything else?</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
              placeholder="Tell us about your background, availability, or anything relevant..."
              className="w-full border-b border-neutral-200 py-2 text-sm focus:outline-none focus:border-black bg-transparent resize-none placeholder:text-neutral-300" />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-4 bg-black text-white text-xs tracking-widest uppercase hover:bg-neutral-800 transition-colors disabled:opacity-50">
            {loading ? 'Submitting...' : 'Submit Resume'}
          </button>
        </form>
      </div>
    </div>
  )
}
