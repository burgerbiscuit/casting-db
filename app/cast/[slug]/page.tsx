'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ChipInput } from '@/components/ChipInput'

type Step = 'loading' | 'landing' | 'name' | 'confirm' | 'form' | 'done'
type Gender = 'female' | 'male' | 'non-binary' | ''

const HEIGHT_FT = [4,5,6,7]
const HEIGHT_IN = [0,1,2,3,4,5,6,7,8,9,10,11]

// Ethnicity: broad category -> specific options
const ETHNICITY_MAP: Record<string, string[]> = {
  'Asian': ['Thai', 'Japanese', 'Korean', 'Chinese', 'Filipino', 'Vietnamese', 'Indonesian', 'Malaysian', 'Singaporean', 'Cambodian', 'Burmese', 'Laotian'],
  'South Asian': ['Indian', 'Pakistani', 'Bangladeshi', 'Sri Lankan', 'Nepali'],
  'Latino / Hispanic': ['Colombian', 'Mexican', 'Brazilian', 'Puerto Rican', 'Cuban', 'Dominican', 'Peruvian', 'Venezuelan', 'Argentinian', 'Chilean', 'Ecuadorian', 'Guatemalan'],
  'Black / African': ['Nigerian', 'Ghanaian', 'Ethiopian', 'Kenyan', 'South African', 'Jamaican', 'Haitian', 'Trinidadian', 'Somali', 'Congolese', 'Senegalese'],
  'White / European': ['French', 'Italian', 'Spanish', 'German', 'British', 'Russian', 'Polish', 'Scandinavian', 'Dutch', 'Greek', 'Portuguese', 'Eastern European'],
  'Middle Eastern': ['Lebanese', 'Iranian/Persian', 'Egyptian', 'Turkish', 'Moroccan', 'Israeli', 'Iraqi', 'Syrian', 'Jordanian', 'Emirati', 'Saudi'],
  'Pacific Islander': ['Hawaiian', 'Samoan', 'Tongan', 'Fijian', 'Maori'],
  'Indigenous': ['Native American', 'First Nations', 'Aboriginal Australian'],
  'Mixed': ['Mixed'],
  'Other': ['Other'],
}

const SKILL_SUGGESTIONS = [
  'Acting', 'Dancing', 'Singing', 'Painting', 'Sculpting', 'Photography',
  'Figure Skating', 'Gymnastics', 'Martial Arts', 'Rock Climbing', 'Surfing',
  'Skiing', 'Snowboarding', 'Horseback Riding', 'Yoga', 'Pilates',
  'Basketball', 'Soccer', 'Tennis', 'Boxing', 'Swimming', 'Diving',
  'Skateboarding', 'BMX', 'Parkour', 'Aerial Silks', 'Circus Arts',
  'Juggling', 'Magic', 'Improv', 'Stand-up Comedy', 'Poetry', 'Spoken Word',
  'Playing Piano', 'Playing Guitar', 'DJing', 'Producing Music',
  'Cooking', 'Bartending', 'Tattoo Artist', 'Makeup Artist', 'Hairstylist',
]

const defaultForm = {
  gender: '' as Gender,
  height_ft: 5, height_in: 7,
  // Female sizing
  bust: '', waist: '', hips: '', dress_size: '',
  // Male sizing
  chest: '', suit_size: '', inseam: '',
  // Shared
  shoe_size: '',
  agency: '',
  ethnicity_broad: [] as string[],
  ethnicity_specific: [] as string[],
  languages: [] as string[],
  instagram_handle: '',
  portfolio_url: '',
  skills: [] as string[],
  hobbies: [] as string[],
  email: '', phone: '',
}

export default function CastPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const supabase = createClient()
  const [step, setStep] = useState<Step>('loading')
  const [project, setProject] = useState<any>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [selectedModel, setSelectedModel] = useState<any>(null)
  const [modelPhoto, setModelPhoto] = useState<string | null>(null)
  const [isReturning, setIsReturning] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [agencySuggestions, setAgencySuggestions] = useState<string[]>([])
  const [showAgencySuggestions, setShowAgencySuggestions] = useState(false)
  const debounceRef = useRef<any>(null)

  useEffect(() => {
    supabase.from('projects').select('*').eq('slug', slug).single().then(({ data }) => {
      if (data) { setProject(data); setStep('landing') }
    })
  }, [slug])

  const searchModels = async (fn: string, ln: string) => {
    if (!fn) { setSuggestions([]); return }
    const { data } = await supabase
      .from('models').select('id, first_name, last_name, agency')
      .ilike('first_name', `${fn}%`)
      .limit(5)
    setSuggestions((data || []).filter(m =>
      !ln || m.last_name.toLowerCase().startsWith(ln.toLowerCase())
    ))
  }

  const onNameChange = (fn: string, ln: string) => {
    setFirstName(fn); setLastName(ln)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchModels(fn, ln), 300)
  }

  const searchAgencies = async (q: string) => {
    if (!q) { setAgencySuggestions([]); return }
    const { data } = await supabase
      .from('models').select('agency').ilike('agency', `%${q}%`).not('agency', 'is', null).limit(10)
    const unique = [...new Set((data || []).map((r: any) => r.agency).filter(Boolean))]
    setAgencySuggestions(unique)
  }

  const selectSuggestion = async (model: any) => {
    setSelectedModel(model); setFirstName(model.first_name); setLastName(model.last_name)
    setSuggestions([])
    // Fetch PDF primary photo
    const { data: photoData } = await supabase
      .from('model_media')
      .select('public_url')
      .eq('model_id', model.id)
      .eq('is_pdf_primary', true)
      .single()
    if (!photoData) {
      // Fall back to first visible photo
      const { data: fallback } = await supabase
        .from('model_media')
        .select('public_url')
        .eq('model_id', model.id)
        .eq('is_visible', true)
        .eq('type', 'photo')
        .order('display_order')
        .limit(1)
        .single()
      setModelPhoto(fallback?.public_url || null)
    } else {
      setModelPhoto(photoData.public_url)
    }
    setStep('confirm')
  }

  const confirmReturning = async () => {
    const { data } = await supabase.from('models').select('*').eq('id', selectedModel.id).single()
    if (data) {
      setForm({
        gender: (data.gender || '') as Gender,
        height_ft: data.height_ft || 5, height_in: data.height_in || 7,
        bust: data.bust || '', waist: data.waist || '', hips: data.hips || '', dress_size: data.dress_size || '',
        chest: data.chest || '', suit_size: data.suit_size || '', inseam: data.inseam || '',
        shoe_size: data.shoe_size || '',
        agency: data.agency || '',
        ethnicity_broad: data.ethnicity_broad ? (Array.isArray(data.ethnicity_broad) ? data.ethnicity_broad : data.ethnicity_broad.split(',').map((s:string)=>s.trim())) : [],
        ethnicity_specific: data.ethnicity_specific ? (Array.isArray(data.ethnicity_specific) ? data.ethnicity_specific : data.ethnicity_specific.split(',').map((s:string)=>s.trim())) : [],
        languages: data.languages || [],
        instagram_handle: data.instagram_handle || '',
        portfolio_url: data.portfolio_url || '',
        skills: data.skills || [], hobbies: data.hobbies || [],
        email: data.email || '', phone: data.phone || '',
      })
    }
    setIsReturning(true); setStep('form')
  }

  const handleSubmit = async () => {
    setSaving(true)
    const modelData = {
      first_name: firstName, last_name: lastName,
      gender: form.gender,
      height_ft: form.height_ft, height_in: form.height_in,
      bust: form.bust, waist: form.waist, hips: form.hips, dress_size: form.dress_size,
      chest: form.chest, suit_size: form.suit_size, inseam: form.inseam,
      shoe_size: form.shoe_size,
      agency: form.agency,
      ethnicity_broad: Array.isArray(form.ethnicity_broad) ? form.ethnicity_broad.join(',') : form.ethnicity_broad,
      ethnicity_specific: Array.isArray(form.ethnicity_specific) ? form.ethnicity_specific.join(',') : form.ethnicity_specific,
      languages: form.languages,
      instagram_handle: form.instagram_handle,
      portfolio_url: form.portfolio_url,
      skills: form.skills, hobbies: form.hobbies,
      email: form.email || null, phone: form.phone || null,
      updated_at: new Date().toISOString(),
    }

    let modelId = selectedModel?.id
    if (isReturning && modelId) {
      await supabase.from('models').update(modelData).eq('id', modelId)
    } else {
      const { data } = await supabase.from('models').insert(modelData).select('id').single()
      modelId = data?.id
    }
    if (modelId) await supabase.from('project_models').upsert({ project_id: project.id, model_id: modelId })
    setSaving(false); setStep('done')
  }

  if (step === 'loading') return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <img src="/logo.jpg" alt="Tasha Tongpreecha Casting" className="h-6 w-auto" />
          {project && step !== 'landing' && (
            <p className="text-xs text-neutral-400 tracking-widest uppercase mt-2">{project.name}</p>
          )}
        </div>

        {step === 'landing' && (
          <div className="text-center">
            <h1 className="text-3xl font-light tracking-widest uppercase mb-4">{project?.name}</h1>
            {project?.description && <p className="text-sm text-neutral-500 mb-12">{project.description}</p>}
            <Button onClick={() => setStep('name')} size="lg">Sign In</Button>
          </div>
        )}

        {step === 'name' && (
          <div>
            <h2 className="text-xl font-light tracking-widest uppercase mb-10 text-center">Your Name</h2>
            <div className="space-y-6 relative">
              <Input label="First Name" value={firstName} onChange={e => onNameChange(e.target.value, lastName)} autoFocus />
              <Input label="Last Name" value={lastName} onChange={e => onNameChange(firstName, e.target.value)} />
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-neutral-200 z-10 mt-1 shadow-sm">
                  {suggestions.map(s => (
                    <button key={s.id} onClick={() => selectSuggestion(s)}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-neutral-50 border-b border-neutral-100 last:border-0">
                      <span className="font-medium">{s.first_name} {s.last_name}</span>
                      {s.agency && <span className="text-neutral-400 ml-2 text-xs">· {s.agency}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-10 flex gap-4">
              <Button variant="ghost" onClick={() => setStep('landing')}>Back</Button>
              <Button onClick={() => { setSelectedModel(null); setIsReturning(false); setStep('form') }} disabled={!firstName || !lastName}>Continue</Button>
            </div>
          </div>
        )}

        {step === 'confirm' && selectedModel && (
          <div className="text-center">
            <h2 className="text-xl font-light tracking-widest uppercase mb-10">Is This You?</h2>
            <div className="border border-neutral-200 mb-8 overflow-hidden w-1/3 mx-auto">
              {modelPhoto ? (
                <img src={modelPhoto} alt={selectedModel.first_name} className="w-full aspect-square object-cover" />
              ) : (
                <div className="w-full aspect-square bg-neutral-100 flex items-center justify-center text-neutral-300 text-2xl font-light">
                  {selectedModel.first_name?.[0]}{selectedModel.last_name?.[0]}
                </div>
              )}
              <div className="p-6">
                <p className="text-xl font-light tracking-wider uppercase mb-1">{selectedModel.first_name} {selectedModel.last_name}</p>
                {selectedModel.agency && <p className="text-sm text-neutral-500">{selectedModel.agency}</p>}
              </div>
            </div>
            <div className="flex gap-4 justify-center">
              <Button onClick={confirmReturning}>Yes, This Is Me</Button>
              <Button variant="secondary" onClick={() => { setSelectedModel(null); setModelPhoto(null); setIsReturning(false); setStep('form') }}>Not Me</Button>
            </div>
          </div>
        )}

        {step === 'form' && (
          <div>
            <h2 className="text-xl font-light tracking-widest uppercase mb-2 text-center">Your Details</h2>
            <p className="text-center text-sm text-neutral-400 mb-10">
              {isReturning ? 'Review and update anything that has changed.' : 'Fill in your information below.'}
            </p>

            <div className="space-y-8">
              {/* Gender */}
              <div>
                <p className="label mb-3">Gender</p>
                <div className="flex gap-3">
                  {(['female', 'male', 'non-binary'] as Gender[]).map(g => (
                    <button key={g} type="button" onClick={() => setForm(f => ({ ...f, gender: g }))}
                      className={`flex-1 py-2 text-xs border tracking-wider uppercase transition-colors ${form.gender === g ? 'bg-black text-white border-black' : 'border-neutral-300 hover:border-black'}`}>
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
                    <select value={form.height_ft} onChange={e => setForm(f => ({ ...f, height_ft: +e.target.value }))}
                      className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none">
                      {HEIGHT_FT.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="label">In</label>
                    <select value={form.height_in} onChange={e => setForm(f => ({ ...f, height_in: +e.target.value }))}
                      className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none">
                      {HEIGHT_IN.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Female sizing */}
              {(form.gender === 'female' || form.gender === 'non-binary' || form.gender === '') && (
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Bust" value={form.bust} onChange={e => setForm(f => ({ ...f, bust: e.target.value }))} placeholder='e.g. 34"' />
                  <Input label="Waist" value={form.waist} onChange={e => setForm(f => ({ ...f, waist: e.target.value }))} placeholder='e.g. 26"' />
                  <Input label="Hips" value={form.hips} onChange={e => setForm(f => ({ ...f, hips: e.target.value }))} placeholder='e.g. 36"' />
                  <Input label="Dress Size" value={form.dress_size} onChange={e => setForm(f => ({ ...f, dress_size: e.target.value }))} />
                </div>
              )}

              {/* Male sizing */}
              {(form.gender === 'male') && (
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Chest" value={form.chest} onChange={e => setForm(f => ({ ...f, chest: e.target.value }))} placeholder='e.g. 40"' />
                  <Input label="Waist" value={form.waist} onChange={e => setForm(f => ({ ...f, waist: e.target.value }))} placeholder='e.g. 32"' />
                  <Input label="Inseam" value={form.inseam} onChange={e => setForm(f => ({ ...f, inseam: e.target.value }))} placeholder='e.g. 32"' />
                  <Input label="Suit Size" value={form.suit_size} onChange={e => setForm(f => ({ ...f, suit_size: e.target.value }))} placeholder='e.g. 40R' />
                </div>
              )}

              <Input label="Shoe Size" value={form.shoe_size} onChange={e => setForm(f => ({ ...f, shoe_size: e.target.value }))} />

              {/* Agency with autocomplete */}
              <div className="relative">
                <Input
                  label="Agency"
                  value={form.agency}
                  onChange={e => {
                    setForm(f => ({ ...f, agency: e.target.value }))
                    searchAgencies(e.target.value)
                    setShowAgencySuggestions(true)
                  }}
                  onFocus={() => { if (form.agency) { searchAgencies(form.agency); setShowAgencySuggestions(true) } }}
                  placeholder="Agency name or Freelance"
                />
                {showAgencySuggestions && agencySuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-neutral-200 z-10 shadow-sm">
                    {agencySuggestions.map(a => (
                      <button key={a} type="button"
                        onClick={() => { setForm(f => ({ ...f, agency: a })); setShowAgencySuggestions(false) }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 border-b border-neutral-100 last:border-0">
                        {a}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Ethnicity - multi-select two tier */}
              <div>
                <p className="label mb-3">Ethnicity</p>
                <p className="text-xs text-neutral-400 mb-3">Select all that apply.</p>
                <div>
                  <label className="label block mb-2">Background</label>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {Object.keys(ETHNICITY_MAP).map(b => (
                      <button key={b} type="button"
                        onClick={() => setForm(f => ({
                          ...f,
                          ethnicity_broad: (f.ethnicity_broad as string[]).includes(b)
                            ? (f.ethnicity_broad as string[]).filter(x => x !== b)
                            : [...(f.ethnicity_broad as string[]), b]
                        }))}
                        className={`text-xs px-3 py-2 border transition-colors ${(form.ethnicity_broad as string[]).includes(b) ? 'bg-black text-white border-black' : 'border-neutral-300 hover:border-black'}`}>
                        {b}
                      </button>
                    ))}
                  </div>
                  {(form.ethnicity_broad as string[]).length > 0 && (
                    <>
                      <label className="label block mb-2">More Specific</label>
                      <div className="flex flex-wrap gap-2">
                        {(form.ethnicity_broad as string[]).flatMap(b => ETHNICITY_MAP[b] || []).map(s => (
                          <button key={s} type="button"
                            onClick={() => setForm(f => ({
                              ...f,
                              ethnicity_specific: (f.ethnicity_specific as string[]).includes(s)
                                ? (f.ethnicity_specific as string[]).filter(x => x !== s)
                                : [...(f.ethnicity_specific as string[]), s]
                            }))}
                            className={`text-xs px-3 py-2 border transition-colors ${(form.ethnicity_specific as string[]).includes(s) ? 'bg-black text-white border-black' : 'border-neutral-300 hover:border-black'}`}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <Input label="Instagram Handle" value={form.instagram_handle}
                onChange={e => setForm(f => ({ ...f, instagram_handle: e.target.value.replace('@', '') }))}
                placeholder="yourhandle (no @)" />

              <Input label="Portfolio / Website" value={form.portfolio_url}
                onChange={e => setForm(f => ({ ...f, portfolio_url: e.target.value }))} type="url" placeholder="https://..." />

              <ChipInput
                label="Languages Spoken"
                value={form.languages}
                onChange={languages => setForm(f => ({ ...f, languages }))}
                placeholder="e.g. English, Spanish, Thai — press Enter"
              />

              <div>
                <p className="label mb-2">Skills</p>
                <p className="text-xs text-neutral-400 mb-3">Type to add your own or click a suggestion below.</p>
                <ChipInput value={form.skills} onChange={skills => setForm(f => ({ ...f, skills }))} placeholder="Type and press Enter..." />
                <div className="flex flex-wrap gap-2 mt-3">
                  {SKILL_SUGGESTIONS.filter(s => !form.skills.includes(s)).slice(0, 12).map(s => (
                    <button key={s} type="button"
                      onClick={() => setForm(f => ({ ...f, skills: [...f.skills, s] }))}
                      className="text-[10px] px-2 py-1 border border-neutral-200 text-neutral-500 hover:border-black hover:text-black transition-colors">
                      + {s}
                    </button>
                  ))}
                </div>
              </div>

              <ChipInput label="Hobbies" value={form.hobbies}
                onChange={hobbies => setForm(f => ({ ...f, hobbies }))}
                placeholder="e.g. Cooking, Travel — press Enter" />

              <div className="border-t border-neutral-100 pt-6 space-y-4">
                <p className="label">Optional Contact</p>
                <Input label="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" />
                <Input label="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} type="tel" />
              </div>
            </div>

            <div className="mt-10 flex gap-4">
              <Button variant="ghost" onClick={() => setStep('name')}>Back</Button>
              <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : 'Check In'}</Button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center">
            <div className="text-4xl mb-6">✓</div>
            <h2 className="text-xl font-light tracking-widest uppercase mb-4">You are Checked In</h2>
            <p className="text-sm text-neutral-500 mb-12">{project?.name}</p>
            <button
              onClick={() => {
                setFirstName(''); setLastName('');
                setSelectedModel(null); setModelPhoto(null);
                setIsReturning(false); setForm(defaultForm);
                setSuggestions([]); setStep('name');
              }}
              className="text-xs tracking-widest uppercase border border-black px-6 py-3 hover:bg-black hover:text-white transition-colors"
            >
              Sign In Another Talent
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
