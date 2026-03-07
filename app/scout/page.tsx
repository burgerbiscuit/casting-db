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
  'Other': [],
}

const SKILL_SUGGESTIONS = ['Acting','Dancing','Singing','Modeling','Athletics','Swimming','Yoga','Pilates','Martial Arts','Horseback Riding','Figure Skating','Painting','Music','Comedy','Voice Over','Surfing','Skateboarding','Rock Climbing','Gymnastics','Boxing']

const HEIGHT_FT = [3, 4, 5, 6, 7]
const HEIGHT_IN = [0,1,2,3,4,5,6,7,8,9,10,11]

const ADULT_SHOE_SIZES = [
  {us: '4', eu: '34'}, {us: '4.5', eu: '34-35'}, {us: '5', eu: '35'},
  {us: '5.5', eu: '35-36'}, {us: '6', eu: '36'}, {us: '6.5', eu: '36-37'},
  {us: '7', eu: '37'}, {us: '7.5', eu: '37-38'}, {us: '8', eu: '38'},
  {us: '8.5', eu: '38-39'}, {us: '9', eu: '39'}, {us: '9.5', eu: '39-40'},
  {us: '10', eu: '40'}, {us: '10.5', eu: '40-41'}, {us: '11', eu: '41'},
  {us: '11.5', eu: '41-42'}, {us: '12', eu: '42'}, {us: '12.5', eu: '42-43'},
  {us: '13', eu: '43'}, {us: '14', eu: '44'}, {us: '15', eu: '45'},
]

const KIDS_SHOE_SIZES = [
  {us: '1C', label: 'US 1C (Toddler)'}, {us: '2C', label: 'US 2C'}, {us: '3C', label: 'US 3C'},
  {us: '4C', label: 'US 4C'}, {us: '5C', label: 'US 5C'}, {us: '6C', label: 'US 6C'},
  {us: '7C', label: 'US 7C'}, {us: '8C', label: 'US 8C'}, {us: '9C', label: 'US 9C'},
  {us: '10C', label: 'US 10C'}, {us: '11C', label: 'US 11C'}, {us: '12C', label: 'US 12C'},
  {us: '13C', label: 'US 13C'}, {us: '1Y', label: 'US 1Y (Youth)'}, {us: '2Y', label: 'US 2Y'},
  {us: '3Y', label: 'US 3Y'}, {us: '4Y', label: 'US 4Y'}, {us: '5Y', label: 'US 5Y'},
  {us: '6Y', label: 'US 6Y'}, {us: '7Y', label: 'US 7Y'},
]

const KIDS_CLOTHING_SIZES = ['2T','3T','4T','4','5','6','6X','7','8','10','12','14','16']

const heightToCm = (ft: number, inches: number) => Math.round((ft * 30.48) + (inches * 2.54))

export default function ScoutPage() {
  const supabase = createClient()
  const [step, setStep] = useState<'form' | 'done'>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sizeMode, setSizeMode] = useState<'adult' | 'kids'>('adult')

  const [agencySuggestions, setAgencySuggestions] = useState<string[]>([])
  const [agencyContacts, setAgencyContacts] = useState<any[]>([])
  const [showAgency, setShowAgency] = useState(false)
  const [boardSuggestions, setBoardSuggestions] = useState<string[]>([])
  const [showBoard, setShowBoard] = useState(false)
  const [agentNameSuggestions, setAgentNameSuggestions] = useState<string[]>([])
  const [showAgentName, setShowAgentName] = useState(false)
  const [basedInSuggestions, setBasedInSuggestions] = useState<string[]>([])
  const [showBasedIn, setShowBasedIn] = useState(false)
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>(SKILL_SUGGESTIONS)
  const [selfieFiles, setSelfieFiles] = useState<File[]>([])
  const [selfieUrls, setSelfieUrls] = useState<string[]>([])
  const [photoErrors, setPhotoErrors] = useState<string[]>(['', ''])
  const [photoCompressing, setPhotoCompressing] = useState<boolean[]>([false, false])

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    gender: '',
    gender_other: '',
    date_of_birth: '',
    instagram_handle: '', tiktok_handle: '', portfolio_url: '', website_url: '',
    agency: '', board: '', agent_name: '', based_in: '',
    height_ft: 5, height_in: 7,
    bust: '', waist: '', hips: '', chest: '', dress_size: '', shoe_size: '', suit_size: '', inseam: '',
    kids_clothing_size: '', kids_shoe_size: '', kids_age: '',
    ethnicity_broad: [] as string[], ethnicity_specific: [] as string[],
    ethnicity_other: '',
    languages: [] as string[],
    skills: [] as string[], hobbies: [] as string[],
    notes: '',
  })

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const searchAgencies = async (q: string) => {
    if (!q) { setAgencySuggestions([]); setAgencyContacts([]); return }
    const { data } = await supabase.from('agency_contacts').select('agency_name').ilike('agency_name', `%${q}%`).limit(20)
    const unique = [...new Set((data || []).map((r: any) => r.agency_name).filter(Boolean))]
    setAgencySuggestions(unique)
  }

  const loadAgentContacts = async (agencyName: string) => {
    if (!agencyName) { setAgencyContacts([]); return }
    const { data } = await supabase.from('agency_contacts').select('agent_name, board, email').ilike('agency_name', agencyName).not('agent_name', 'is', null).order('board')
    setAgencyContacts(data || [])
  }

  const searchBoards = async (q: string) => {
    if (!q) { setBoardSuggestions([]); return }
    const { data } = await supabase.from('models').select('board').ilike('board', `%${q}%`).not('board', 'is', null).limit(10)
    setBoardSuggestions([...new Set((data || []).map((r: any) => r.board).filter(Boolean))])
  }

  const searchAgentNames = async (q: string) => {
    if (!q) { setAgentNameSuggestions([]); return }
    const { data } = await supabase.from('models').select('agent_name').ilike('agent_name', `%${q}%`).not('agent_name', 'is', null).limit(10)
    setAgentNameSuggestions([...new Set((data || []).map((r: any) => r.agent_name).filter(Boolean))])
  }

  const searchBasedIn = async (q: string) => {
    if (!q) { setBasedInSuggestions([]); return }
    const { data } = await supabase.from('models').select('based_in').ilike('based_in', q + '%').not('based_in', 'is', null).limit(8)
    setBasedInSuggestions([...new Set((data || []).map((r: any) => r.based_in).filter(Boolean))])
  }

  // Skills: fetch existing from DB so similar entries group together
  const searchSkills = async (q: string) => {
    if (!q) { setSkillSuggestions(SKILL_SUGGESTIONS); return }
    const { data } = await supabase.from('models').select('skills').not('skills', 'is', null).limit(200)
    const allSkills = (data || []).flatMap((r: any) => Array.isArray(r.skills) ? r.skills : [])
    const counts: Record<string, number> = {}
    allSkills.forEach((s: string) => { const k = s.trim(); if (k) counts[k] = (counts[k] || 0) + 1 })
    // Sort by frequency, filter by query
    const matched = Object.keys(counts)
      .filter(s => s.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => counts[b] - counts[a])
    // Merge with static suggestions
    const staticMatched = SKILL_SUGGESTIONS.filter(s => s.toLowerCase().includes(q.toLowerCase()) && !matched.includes(s))
    setSkillSuggestions([...matched, ...staticMatched])
  }

  const submit = async () => {
    if (!form.first_name || !form.last_name) { setError('Please enter your name.'); return }
    // Validate file sizes before uploading
    const oversized = selfieFiles.filter(Boolean).find(f => f.size > 8 * 1024 * 1024)
    if (oversized) { setError(`"${oversized.name}" is too large (max 8 MB). Please choose a smaller photo.`); return }
    setLoading(true); setError('')
    try {
      // Use FormData so images upload server-side with service key (bypasses storage RLS)
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (Array.isArray(v)) fd.append(k, JSON.stringify(v))
        else if (v !== null && v !== undefined) fd.append(k, String(v))
      })
      selfieFiles.filter(Boolean).forEach(file => fd.append('photos', file))

      const res = await fetch('/api/scout', { method: 'POST', body: fd })
      const ct = res.headers.get('content-type') || ''
      const json = ct.includes('application/json') ? await res.json() : {}
      if (!res.ok) throw new Error(res.status === 413 ? 'Photos are too large. Please reduce file sizes and try again.' : json.error || 'Submission failed')
      setStep('done')
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inp = 'w-full border-b border-neutral-200 py-2 text-sm focus:outline-none focus:border-black bg-transparent'
  const lbl = 'label block mb-1'

  const hasOtherSpecific = form.ethnicity_specific.some(s => s.startsWith('Other'))

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
            <p className="text-sm">
              Please <a href="https://www.instagram.com/tashatongpreecha" target="_blank" rel="noopener noreferrer"
                className="text-xs tracking-widest uppercase underline underline-offset-2 hover:opacity-60 transition-opacity">
                follow @tashatongpreecha on instagram for updates on castings
              </a>
            </p>
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
            {form.gender === 'other' && (
              <div className="mt-3">
                <label className={lbl}>Please specify</label>
                <input value={form.gender_other} onChange={e => set('gender_other', e.target.value)}
                  placeholder="e.g. Gender fluid" className={inp} />
              </div>
            )}
          </div>

          {/* Adult vs Kids size toggle */}
          <div>
            <p className="label mb-3">Size Type</p>
            <div className="flex border border-neutral-200 w-fit">
              <button type="button" onClick={() => setSizeMode('adult')}
                className={`px-6 py-2 text-xs tracking-widest uppercase transition-colors ${sizeMode === 'adult' ? 'bg-black text-white' : 'text-neutral-500 hover:bg-neutral-50'}`}>
                Adult
              </button>
              <button type="button" onClick={() => setSizeMode('kids')}
                className={`px-6 py-2 text-xs tracking-widest uppercase transition-colors ${sizeMode === 'kids' ? 'bg-black text-white' : 'text-neutral-500 hover:bg-neutral-50'}`}>
                Kids
              </button>
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
            <p className="text-xs text-neutral-400 mt-1">{heightToCm(form.height_ft, form.height_in)} cm</p>
          </div>

          {/* ADULT SIZING */}
          {sizeMode === 'adult' && (
            <>
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
                  {ADULT_SHOE_SIZES.map(s => (
                    <option key={s.us} value={s.us}>US {s.us} / EU {s.eu}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* KIDS SIZING */}
          {sizeMode === 'kids' && (
            <div className="space-y-4">
              <div>
                <label className={lbl}>Age</label>
                <input value={form.kids_age} onChange={e => set('kids_age', e.target.value)}
                  placeholder="e.g. 7" className={inp} />
              </div>
              <div>
                <label className={lbl}>Kids Clothing Size</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {KIDS_CLOTHING_SIZES.map(s => (
                    <button key={s} type="button" onClick={() => set('kids_clothing_size', s)}
                      className={`px-3 py-1.5 text-xs border transition-colors ${form.kids_clothing_size === s ? 'bg-black text-white border-black' : 'border-neutral-300 hover:border-black'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={lbl}>Kids Shoe Size</label>
                <select value={form.kids_shoe_size} onChange={e => set('kids_shoe_size', e.target.value)}
                  className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none">
                  <option value="">Select...</option>
                  {KIDS_SHOE_SIZES.map(s => (
                    <option key={s.us} value={s.us}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={lbl}>Waist</label><input value={form.waist} onChange={e => set('waist', e.target.value)} className={inp} placeholder='e.g. 22"' /></div>
                <div><label className={lbl}>Chest / Bust</label><input value={form.chest || form.bust} onChange={e => { set('chest', e.target.value); set('bust', e.target.value) }} className={inp} placeholder='e.g. 26"' /></div>
              </div>
            </div>
          )}

          {/* Agency autocomplete */}
          <div className="relative">
            <label className={lbl}>Agency (if represented)</label>
            <input value={form.agency} onChange={e => { set('agency', e.target.value); searchAgencies(e.target.value); setShowAgency(true) }}
              onFocus={() => { if (form.agency) { searchAgencies(form.agency); setShowAgency(true) } }}
              placeholder="Agency name or Freelance" className={inp} />
            {showAgency && (agencySuggestions.length > 0 || form.agency.length > 1) && (
              <div className="absolute top-full left-0 right-0 bg-white border border-neutral-200 z-10 shadow-sm">
                {agencySuggestions.map(a => (
                  <button key={a} type="button" onClick={() => { set('agency', a); set('agent_name', ''); set('board', ''); setShowAgency(false); loadAgentContacts(a) }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 border-b border-neutral-100 last:border-0">{a}</button>
                ))}
                {form.agency && !agencySuggestions.map((a: string) => a.toLowerCase()).includes(form.agency.toLowerCase()) && (
                  <button type="button" onClick={() => { setShowAgency(false); setAgencyContacts([]) }}
                    className="w-full px-4 py-2 text-left text-sm text-neutral-400 hover:bg-neutral-50 italic border-t border-neutral-100">
                    + Use "{form.agency}" as new agency
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Agent picker from agency roster */}
          {agencyContacts.length > 0 && (
            <div>
              <label className={lbl}>Select Your Agent</label>
              <div className="space-y-1 max-h-48 overflow-y-auto border border-neutral-200 mt-1">
                {agencyContacts.map((ac: any, i: number) => (
                  <button key={i} type="button"
                    onClick={() => { set('agent_name', ac.agent_name || ''); set('board', ac.board || '') }}
                    className={`w-full px-4 py-2.5 text-left text-sm border-b border-neutral-100 last:border-0 transition-colors ${form.agent_name === ac.agent_name ? 'bg-black text-white' : 'hover:bg-neutral-50'}`}>
                    <span className="font-medium">{ac.agent_name}</span>
                    {ac.board && <span className="ml-2 text-xs opacity-60">{ac.board}</span>}
                  </button>
                ))}
                <button type="button" onClick={() => { set('agent_name', ''); set('board', '') }}
                  className="w-full px-4 py-2.5 text-left text-sm text-neutral-400 hover:bg-neutral-50 italic">
                  + My agent isn't listed — enter manually
                </button>
              </div>
            </div>
          )}

          {/* Agent Name manual */}
          <div className="relative">
            <label className={lbl}>Agent Name <span className="text-neutral-400 font-normal normal-case">(if applicable)</span></label>
            <input value={form.agent_name} onChange={e => { set('agent_name', e.target.value); searchAgentNames(e.target.value); setShowAgentName(true) }}
              onFocus={() => { if (form.agent_name) { searchAgentNames(form.agent_name); setShowAgentName(true) } }}
              placeholder="Your agent's name" className={inp} />
            {showAgentName && agentNameSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-neutral-200 z-10 shadow-sm">
                {agentNameSuggestions.map(a => (
                  <button key={a} type="button" onClick={() => { set('agent_name', a); setShowAgentName(false) }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 border-b border-neutral-100 last:border-0">{a}</button>
                ))}
              </div>
            )}
          </div>

          {/* Board */}
          <div className="relative">
            <label className={lbl}>Board <span className="text-neutral-400 font-normal normal-case">(if applicable)</span></label>
            <input value={form.board} onChange={e => { set('board', e.target.value); searchBoards(e.target.value); setShowBoard(true) }}
              onFocus={() => { if (form.board) { searchBoards(form.board); setShowBoard(true) } }}
              placeholder="Board name" className={inp} />
            {showBoard && boardSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-neutral-200 z-10 shadow-sm">
                {boardSuggestions.map(a => (
                  <button key={a} type="button" onClick={() => { set('board', a); setShowBoard(false) }}
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
                  onClick={() => set('ethnicity_broad', form.ethnicity_broad.includes(b) ? form.ethnicity_broad.filter((x: string) => x !== b) : [...form.ethnicity_broad, b])}
                  className={`text-xs px-3 py-2 border transition-colors ${form.ethnicity_broad.includes(b) ? 'bg-black text-white border-black' : 'border-neutral-300 hover:border-black'}`}>
                  {b}
                </button>
              ))}
            </div>
            {form.ethnicity_broad.includes('Other') && (
              <div className="mb-3">
                <label className={lbl}>Please specify (Ethnicity)</label>
                <input value={form.ethnicity_other} onChange={e => set('ethnicity_other', e.target.value)}
                  placeholder="Please specify your ethnicity" className={inp} />
              </div>
            )}
            {form.ethnicity_broad.filter((b: string) => b !== 'Other').length > 0 && (
              <>
                <label className="label block mb-2">More Specific</label>
                <div className="flex flex-wrap gap-2">
                  {/* Deduplicate specifics across all selected broad categories, add single Other at end */}
                  {(() => {
                    const specifics = [...new Set(
                      form.ethnicity_broad
                        .filter((b: string) => b !== 'Other')
                        .flatMap((b: string) => ETHNICITY_MAP[b] || [])
                    )]
                    return [...specifics, 'Other'].map(s => (
                      <button key={s} type="button"
                        onClick={() => set('ethnicity_specific', form.ethnicity_specific.includes(s) ? form.ethnicity_specific.filter((x: string) => x !== s) : [...form.ethnicity_specific, s])}
                        className={`text-xs px-3 py-2 border transition-colors ${form.ethnicity_specific.includes(s) ? 'bg-black text-white border-black' : 'border-neutral-300 hover:border-black'}`}>
                        {s}
                      </button>
                    ))
                  })()}
                </div>
                {form.ethnicity_specific.includes('Other') && (
                  <div className="mt-3">
                    <label className={lbl}>Please specify</label>
                    <input value={form.ethnicity_other} onChange={e => set('ethnicity_other', e.target.value)}
                      placeholder="e.g. Trinidadian, Afro-Cuban..." className={inp} autoFocus />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Languages */}
          <ChipInput label="Languages Spoken" value={form.languages} onChange={v => set('languages', v)} placeholder="e.g. English, Spanish — press Enter" />

          {/* Social + Portfolio */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Instagram</label>
              <input value={form.instagram_handle} onChange={e => set('instagram_handle', e.target.value.replace('@', ''))}
                placeholder="handle (no @)" className={inp} />
            </div>
            <div>
              <label className={lbl}>TikTok</label>
              <input value={form.tiktok_handle} onChange={e => set('tiktok_handle', e.target.value.replace('@', ''))}
                placeholder="handle (no @)" className={inp} />
            </div>
            <div>
              <label className={lbl}>Portfolio URL</label>
              <input value={form.portfolio_url} onChange={e => set('portfolio_url', e.target.value)}
                placeholder="model portfolio, etc." className={inp} />
            </div>
            <div>
              <label className={lbl}>Website URL</label>
              <input value={form.website_url} onChange={e => set('website_url', e.target.value)}
                placeholder="yourwebsite.com" className={inp} />
            </div>
          </div>

          {/* Skills — DB-powered suggestions so entries group canonically */}
          <div>
            <p className="label mb-1">Skills</p>
            <p className="text-xs text-neutral-400 mb-3">Type to search or add your own. Similar skills will group automatically.</p>
            <ChipInput
              value={form.skills}
              onChange={v => set('skills', v)}
              placeholder="e.g. Tattoo Artist, Acting..."
              suggestions={skillSuggestions}
              onSearch={searchSkills}
            />
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
            <div><label className={lbl}>Email</label><input type="text" inputMode="email" value={form.email} onChange={e => set('email', e.target.value)} className={inp} /></div>
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
          <div>
            <label className={lbl}>Date of Birth</label>
            <p className="text-xs text-neutral-400 mb-1">Used to verify your identity when you sign in in the future.</p>
            <input type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} className={inp} />
          </div>

          {/* Photos */}
          <div>
            <p className="label mb-2">Photos (Optional)</p>
            <p className="text-xs text-neutral-400 mb-1">Upload up to 2 photos of yourself.</p>
            <p className="text-xs text-neutral-400 mb-1">Recent, unedited photos with no makeup or filters preferred.</p>
            <p className="text-[11px] text-neutral-300 mb-3">Max 8 MB per photo — large images are automatically compressed.</p>
            <div className="flex gap-3">
              {[0,1].map(i => (
                <div key={i} className="flex-1 flex flex-col gap-1">
                  <label className={`aspect-[3/4] border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-black transition-colors overflow-hidden relative ${photoErrors[i] ? 'border-red-300' : 'border-neutral-200'}`}>
                    <input type="file" accept="image/*" className="hidden" onChange={async e => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      // Immediate size check before compression
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
                        : <span className="text-xs text-neutral-300 tracking-widest uppercase">+ Photo {i+1}</span>}
                  </label>
                  {photoErrors[i] && <p className="text-[10px] text-red-500">{photoErrors[i]}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={lbl}>Anything else?</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
              placeholder="Anything else you'd like us to know? The more we know about you, the easier it will be to get you booked!"
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
