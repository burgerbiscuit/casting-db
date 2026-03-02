'use client'
import { useState, useRef } from 'react'
import { ChipInput } from '@/components/ChipInput'
import { createClient } from '@/lib/supabase/client'

const ETHNICITY_MAP: Record<string, string[]> = {
  'Asian': ['Thai', 'Japanese', 'Korean', 'Chinese', 'Filipino', 'Vietnamese', 'Indonesian', 'Malaysian', 'Cambodian', 'Burmese', 'Laotian'],
  'South Asian': ['Indian', 'Pakistani', 'Bangladeshi', 'Sri Lankan', 'Nepali'],
  'Latino / Hispanic': ['Colombian', 'Mexican', 'Brazilian', 'Puerto Rican', 'Cuban', 'Dominican', 'Peruvian', 'Venezuelan', 'Argentinian', 'Chilean'],
  'Black / African': ['Nigerian', 'Ghanaian', 'Ethiopian', 'Kenyan', 'South African', 'Jamaican', 'Haitian', 'Somali', 'Congolese', 'Senegalese'],
  'White / European': ['British', 'French', 'Italian', 'Spanish', 'German', 'Swedish', 'Dutch', 'Polish', 'Russian', 'Australian'],
  'Middle Eastern': ['Lebanese', 'Iranian', 'Turkish', 'Egyptian', 'Moroccan', 'Israeli', 'Saudi', 'Iraqi', 'Syrian', 'Jordanian'],
  'Mixed': [],
  'Other': [],
}

const SKILL_SUGGESTIONS = ['Acting','Dancing','Singing','Modeling','Athletics','Swimming','Yoga','Pilates','Martial Arts','Horseback Riding','Figure Skating','Painting','Music','Comedy','Voice Over','Surfing','Skateboarding','Rock Climbing','Gymnastics','Boxing']

const HEIGHT_FT = [4,5,6,7]
const HEIGHT_IN = [0,1,2,3,4,5,6,7,8,9,10,11]
const SHOE_SIZES = [
  {us: '4', eu: '34'}, {us: '4.5', eu: '34-35'}, {us: '5', eu: '35'},
  {us: '5.5', eu: '35-36'}, {us: '6', eu: '36'}, {us: '6.5', eu: '36-37'},
  {us: '7', eu: '37'}, {us: '7.5', eu: '37-38'}, {us: '8', eu: '38'},
  {us: '8.5', eu: '38-39'}, {us: '9', eu: '39'}, {us: '9.5', eu: '39-40'},
  {us: '10', eu: '40'}, {us: '10.5', eu: '40-41'}, {us: '11', eu: '41'},
  {us: '11.5', eu: '41-42'}, {us: '12', eu: '42'}, {us: '12.5', eu: '42-43'},
  {us: '13', eu: '43'}, {us: '14', eu: '44'}, {us: '15', eu: '45'},
]
const heightToCm = (ft: number, inches: number) => Math.round((ft * 30.48) + (inches * 2.54))


export default function ScoutPage() {
  const supabase = createClient()
  const [step, setStep] = useState<'form' | 'done'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [agencySuggestions, setAgencySuggestions] = useState<string[]>([])
  const [showAgency, setShowAgency] = useState(false)
  const [basedInSuggestions, setBasedInSuggestions] = useState<string[]>([])
  const [showBasedIn, setShowBasedIn] = useState(false)
  const [selfieFiles, setSelfieFiles] = useState<File[]>([])
  const [selfieUrls, setSelfieUrls] = useState<string[]>([])

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    gender: '',
  gender_other: '', date_of_birth: '',
    instagram_handle: '', portfolio_url: '',
    agency: '', based_in: '',
    height_ft: 5, height_in: 7,
    bust: '', waist: '', hips: '', chest: '', dress_size: '', shoe_size: '', suit_size: '', inseam: '',
    ethnicity_broad: [] as string[], ethnicity_specific: [] as string[],
    ethnicity_other: '',
  languages: [] as string[],
    skills: [] as string[], hobbies: [] as string[],
    notes: '',
  })

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const searchAgencies = async (q: string) => {
    if (!q) { setAgencySuggestions([]); return }
    const { data } = await supabase.from('models').select('agency').ilike('agency', `%${q}%`).not('agency', 'is', null).limit(10)
    setAgencySuggestions([...new Set((data || []).map((r: any) => r.agency).filter(Boolean))])
  }

  const searchBasedIn = async (q: string) => {
    if (!q) { setBasedInSuggestions([]); return }
    const { data } = await supabase.from('models').select('based_in').ilike('based_in', q + '%').not('based_in', 'is', null).limit(8)
    setBasedInSuggestions([...new Set((data || []).map((r: any) => r.based_in).filter(Boolean))])
  }

  const submit = async () => {
    if (!form.first_name || !form.last_name) { setError('Please enter your name.'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/scout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          ethnicity_broad: form.ethnicity_broad.join(','),
          ethnicity_specific: form.ethnicity_specific.join(','),
          skills: form.skills,
          hobbies: form.hobbies,
          languages: form.languages,
        })
      })
      const { id: modelId } = await res.json()
      if (!res.ok) throw new Error('Submission failed')
      // Upload photos
      if (modelId) {
        for (const file of selfieFiles) {
          const ext = file.name.split('.').pop() || 'jpg'
          const path = `${modelId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
          const { error: upErr } = await supabase.storage.from('model-media').upload(path, file)
          if (!upErr) {
            const { data: { publicUrl } } = supabase.storage.from('model-media').getPublicUrl(path)
            await supabase.from('model_media').insert({ model_id: modelId, storage_path: path, public_url: publicUrl, type: 'photo', is_visible: true })
          }
        }
      }
      setStep('done')
    } catch (e) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inp = 'w-full border-b border-neutral-200 py-2 text-sm focus:outline-none focus:border-black bg-transparent'
  const lbl = 'label block mb-1'

  if (step === 'done') return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="px-8 py-6 border-b border-neutral-100">
        <img src="/logo.jpg" alt="Tasha Tongpreecha Casting" className="h-8 w-auto" />
      </header>
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <h2 className="text-2xl font-light tracking-widest uppercase mb-4">Thank You</h2>
          <p className="text-sm text-neutral-500 mb-8">Your submission has been received. We'll be in touch if there's a fit.</p>
          <div className="space-y-4">
            <a href="https://www.instagram.com/tashatongpreecha" target="_blank" rel="noopener noreferrer"
              className="block text-sm tracking-widest uppercase underline underline-offset-4 hover:opacity-60 transition-opacity">
              Follow @tashatongpreecha on Instagram
            </a>
            <a href="https://www.tashatongpreecha.com" target="_blank" rel="noopener noreferrer"
              className="block text-sm tracking-widest uppercase text-neutral-400 hover:text-black transition-colors">
              ← Back to Website
            </a>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-white px-6 py-12">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-12">
          <img src="/logo.jpg" alt="" className="h-8 w-auto mx-auto mb-8" />
          <h1 className="text-2xl font-light tracking-widest uppercase mb-2">Get Scouted</h1>
          <p className="text-sm text-neutral-400">Submit your information to be considered for future castings.</p>
        </div>

        <div className="space-y-8">
          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div><label className={lbl}>First Name *</label><input value={form.first_name} onChange={e => set('first_name', e.target.value)} className={inp} /></div>
            <div><label className={lbl}>Last Name *</label><input value={form.last_name} onChange={e => set('last_name', e.target.value)} className={inp} /></div>
          </div>

          {/* Gender */}
          <div>
            <p className="label mb-3">Gender</p>
            <div className="flex flex-wrap gap-2">
              {['female','male','non-binary','other'].map(g => (
                <button key={g} type="button" onClick={() => set('gender', g)}
                  className={`px-4 py-2 text-xs border tracking-wider uppercase transition-colors ${form.gender === g ? 'bg-black text-white border-black' : 'border-neutral-300 hover:border-black'}`}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Height */}
          <div>
            <p className="label mb-3">Height</p>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="label">Ft</label>
                <select value={form.height_ft} onChange={e => set('height_ft', +e.target.value)} className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none">
                  {HEIGHT_FT.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="label">In</label>
                <select value={form.height_in} onChange={e => set('height_in', +e.target.value)} className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none">
                  {HEIGHT_IN.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Sizing */}
          {form.gender === 'female' && (
            <div className="grid grid-cols-2 gap-4">
              <div><label className={lbl}>Bust</label><input value={form.bust} onChange={e => set('bust', e.target.value)} className={inp} placeholder='e.g. 34"' /></div>
              <div><label className={lbl}>Waist</label><input value={form.waist} onChange={e => set('waist', e.target.value)} className={inp} placeholder='e.g. 26"' /></div>
              <div><label className={lbl}>Hips</label><input value={form.hips} onChange={e => set('hips', e.target.value)} className={inp} placeholder='e.g. 36"' /></div>
              <div><label className={lbl}>Dress Size</label><input value={form.dress_size} onChange={e => set('dress_size', e.target.value)} className={inp} /></div>
            </div>
          )}
          {form.gender === 'male' && (
            <div className="grid grid-cols-2 gap-4">
              <div><label className={lbl}>Chest</label><input value={form.chest} onChange={e => set('chest', e.target.value)} className={inp} placeholder='e.g. 40"' /></div>
              <div><label className={lbl}>Waist</label><input value={form.waist} onChange={e => set('waist', e.target.value)} className={inp} placeholder='e.g. 32"' /></div>
              <div><label className={lbl}>Inseam</label><input value={form.inseam} onChange={e => set('inseam', e.target.value)} className={inp} placeholder='e.g. 32"' /></div>
              <div><label className={lbl}>Suit Size</label><input value={form.suit_size} onChange={e => set('suit_size', e.target.value)} className={inp} placeholder='e.g. 40R' /></div>
            </div>
          )}
          {(form.gender === 'non-binary' || form.gender === 'other') && (
            <div className="grid grid-cols-2 gap-4">
              <div><label className={lbl}>Bust</label><input value={form.bust} onChange={e => set('bust', e.target.value)} className={inp} /></div>
              <div><label className={lbl}>Chest</label><input value={form.chest} onChange={e => set('chest', e.target.value)} className={inp} /></div>
              <div><label className={lbl}>Waist</label><input value={form.waist} onChange={e => set('waist', e.target.value)} className={inp} /></div>
              <div><label className={lbl}>Hips</label><input value={form.hips} onChange={e => set('hips', e.target.value)} className={inp} /></div>
              <div><label className={lbl}>Dress Size</label><input value={form.dress_size} onChange={e => set('dress_size', e.target.value)} className={inp} /></div>
              <div><label className={lbl}>Suit Size</label><input value={form.suit_size} onChange={e => set('suit_size', e.target.value)} className={inp} /></div>
            </div>
          )}
          <div>
            <label className={lbl}>Shoe Size (US)</label>
            <select value={form.shoe_size} onChange={e => set('shoe_size', e.target.value)}
              className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none">
              <option value="">Select...</option>
              {SHOE_SIZES.map(s => (
                <option key={s.us} value={s.us}>US {s.us} / EU {s.eu}</option>
              ))}
            </select>
          </div>

          {/* Agency autocomplete */}
          <div className="relative">
            <label className={lbl}>Agency (if represented)</label>
            <input value={form.agency} onChange={e => { set('agency', e.target.value); searchAgencies(e.target.value); setShowAgency(true) }}
              onFocus={() => { if (form.agency) { searchAgencies(form.agency); setShowAgency(true) } }}
              placeholder="Agency name or Freelance" className={inp} />
            {showAgency && agencySuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-neutral-200 z-10 shadow-sm">
                {agencySuggestions.map(a => (
                  <button key={a} type="button" onClick={() => { set('agency', a); setShowAgency(false) }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 border-b border-neutral-100 last:border-0">{a}</button>
                ))}
              </div>
            )}
          </div>

          {/* Ethnicity */}
          <div>
            <p className="label mb-3">Ethnicity</p>
            <p className="text-xs text-neutral-400 mb-3">Select all that apply.</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {Object.keys(ETHNICITY_MAP).map(b => (
                <button key={b} type="button"
                  onClick={() => set('ethnicity_broad', form.ethnicity_broad.includes(b) ? form.ethnicity_broad.filter((x:string) => x !== b) : [...form.ethnicity_broad, b])}
                  className={`text-xs px-3 py-2 border transition-colors ${form.ethnicity_broad.includes(b) ? 'bg-black text-white border-black' : 'border-neutral-300 hover:border-black'}`}>
                  {b}
                </button>
              ))}
            </div>
            {form.ethnicity_broad.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.ethnicity_broad.flatMap((b: string) => ETHNICITY_MAP[b] || []).map(s => (
                  <button key={s} type="button"
                    onClick={() => set('ethnicity_specific', form.ethnicity_specific.includes(s) ? form.ethnicity_specific.filter((x:string) => x !== s) : [...form.ethnicity_specific, s])}
                    className={`text-xs px-3 py-2 border transition-colors ${form.ethnicity_specific.includes(s) ? 'bg-black text-white border-black' : 'border-neutral-300 hover:border-black'}`}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Languages */}
          <ChipInput label="Languages Spoken" value={form.languages} onChange={v => set('languages', v)} placeholder="e.g. English, Spanish — press Enter" />

          {/* Instagram + Portfolio */}
          <div className="grid grid-cols-2 gap-4">
            <div><label className={lbl}>Instagram</label><input value={form.instagram_handle} onChange={e => set('instagram_handle', e.target.value.replace('@',''))} placeholder="yourhandle" className={inp} /></div>
            <div><label className={lbl}>Portfolio URL</label><input value={form.portfolio_url} onChange={e => set('portfolio_url', e.target.value)} className={inp} /></div>
            <div><label className={lbl}>Website URL</label><input value={(form as any).website_url || ''} onChange={e => set('website_url', e.target.value)} className={inp} /></div>
          </div>

          {/* Skills */}
          <div>
            <p className="label mb-2">Skills</p>
            <p className="text-xs text-neutral-400 mb-3">Type to add your own or click a suggestion.</p>
            <ChipInput value={form.skills} onChange={v => set('skills', v)} placeholder="Type and press Enter..." />
            <div className="flex flex-wrap gap-2 mt-3">
              {SKILL_SUGGESTIONS.filter(s => !form.skills.includes(s)).map(s => (
                <button key={s} type="button" onClick={() => set('skills', [...form.skills, s])}
                  className="text-[10px] px-2 py-1 border border-neutral-200 text-neutral-500 hover:border-black hover:text-black transition-colors">+ {s}</button>
              ))}
            </div>
          </div>

          {/* Hobbies */}
          <ChipInput label="Hobbies" value={form.hobbies} onChange={v => set('hobbies', v)} placeholder="e.g. Cooking, Travel — press Enter" />

          {/* Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div><label className={lbl}>Email</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inp} /></div>
            <div><label className={lbl}>Phone</label><input value={form.phone} onChange={e => set('phone', e.target.value)} className={inp} /></div>
          </div>

          {/* Based In */}
          <div className="relative">
            <label className={lbl}>Based In (City, Country)</label>
            <input value={form.based_in} onChange={e => { set('based_in', e.target.value); searchBasedIn(e.target.value); setShowBasedIn(true) }}
              onFocus={() => { if (form.based_in) { searchBasedIn(form.based_in); setShowBasedIn(true) } }}
              placeholder="e.g. New York, USA" className={inp} />
            {showBasedIn && basedInSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-neutral-200 z-10 shadow-sm">
                {basedInSuggestions.map(a => (
                  <button key={a} type="button" onClick={() => { set('based_in', a); setShowBasedIn(false) }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 border-b border-neutral-100 last:border-0">{a}</button>
                ))}
              </div>
            )}
          </div>

          {/* Date of Birth */}
          <div><label className={lbl}>Date of Birth</label><input type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} className={inp} /></div>

          {/* Photos */}
          <div>
            <p className="label mb-2">Photos (Optional)</p>
            <p className="text-xs text-neutral-400 mb-3">Upload up to 2 photos of yourself.</p>
            <div className="flex gap-3">
              {[0,1].map(i => (
                <label key={i} className="flex-1 aspect-[3/4] border-2 border-dashed border-neutral-200 flex items-center justify-center cursor-pointer hover:border-black transition-colors overflow-hidden">
                  <input type="file" accept="image/*" className="hidden" onChange={e => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const f = [...selfieFiles]; f[i] = file; setSelfieFiles(f)
                    const u = [...selfieUrls]; u[i] = URL.createObjectURL(file); setSelfieUrls(u)
                  }} />
                  {selfieUrls[i] ? <img src={selfieUrls[i]} className="w-full h-full object-cover" alt="" /> : <span className="text-xs text-neutral-300 tracking-widest uppercase">+ Photo {i+1}</span>}
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={lbl}>Anything else you'd like us to know?</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} className="w-full border-b border-neutral-200 py-2 text-sm focus:outline-none focus:border-black bg-transparent resize-none" />
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
