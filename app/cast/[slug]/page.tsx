'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ChipInput } from '@/components/ChipInput'

type Step = 'loading' | 'landing' | 'name' | 'confirm' | 'form' | 'done'
type Gender = 'female' | 'male' | 'non-binary' | 'other' | ''

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

const ETHNICITY_MAP: Record<string, string[]> = {
  'Asian': ['Thai', 'Japanese', 'Korean', 'Chinese', 'Filipino', 'Vietnamese', 'Indonesian', 'Malaysian', 'Singaporean', 'Cambodian', 'Burmese', 'Laotian'],
  'South Asian': ['Indian', 'Pakistani', 'Bangladeshi', 'Sri Lankan', 'Nepali'],
  'Latino / Hispanic': ['Colombian', 'Mexican', 'Brazilian', 'Puerto Rican', 'Cuban', 'Dominican', 'Peruvian', 'Venezuelan', 'Argentinian', 'Chilean', 'Ecuadorian', 'Guatemalan'],
  'Black / African': ['Nigerian', 'Ghanaian', 'Ethiopian', 'Kenyan', 'South African', 'Jamaican', 'Haitian', 'Trinidadian', 'Somali', 'Congolese', 'Senegalese'],
  'White / European': ['French', 'Italian', 'Spanish', 'German', 'British', 'Russian', 'Polish', 'Scandinavian', 'Dutch', 'Greek', 'Portuguese', 'Eastern European'],
  'Middle Eastern': ['Lebanese', 'Iranian/Persian', 'Egyptian', 'Turkish', 'Moroccan', 'Israeli', 'Iraqi', 'Syrian', 'Jordanian', 'Emirati', 'Saudi'],
  'Pacific Islander': ['Hawaiian', 'Samoan', 'Tongan', 'Fijian', 'Maori'],
  'Indigenous': ['Native American', 'First Nations', 'Aboriginal Australian'],
  'Mixed': [],
  'Other': [],
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
  gender_other: '',
  height_ft: 5, height_in: 7,
  bust: '', waist: '', hips: '', dress_size: '',
  chest: '', suit_size: '', inseam: '',
  shoe_size: '',
  agency: '',
  board: '',
  agent_name: '',
  ethnicity_broad: [] as string[],
  ethnicity_specific: [] as string[],
  ethnicity_other: '',
  languages: [] as string[],
  instagram_handle: '',
  portfolio_url: '',
  website_url: '',
  skills: [] as string[],
  hobbies: [] as string[],
  notes: '',
  email: '', phone: '', based_in: '', date_of_birth: '',
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
  const [boardSuggestions, setBoardSuggestions] = useState<string[]>([])
  const [agentNameSuggestions, setAgentNameSuggestions] = useState<string[]>([])
  const [basedInSuggestions, setBasedInSuggestions] = useState<string[]>([])
  const [showBasedInSuggestions, setShowBasedInSuggestions] = useState(false)
  const [selfieFiles, setSelfieFiles] = useState<File[]>([])
  const [selfiePreviewUrls, setSelfiePreviewUrls] = useState<string[]>([])
  const [showAgencySuggestions, setShowAgencySuggestions] = useState(false)
  const [showBoardSuggestions, setShowBoardSuggestions] = useState(false)
  const [showAgentNameSuggestions, setShowAgentNameSuggestions] = useState(false)
  // Friends & Family
  const [friendSearch, setFriendSearch] = useState('')
  const [friendResults, setFriendResults] = useState<any[]>([])
  const [relatedModels, setRelatedModels] = useState<string[]>([])
  const [relatedModelNames, setRelatedModelNames] = useState<Record<string, string>>({})
  const debounceRef = useRef<any>(null)
  const friendDebounceRef = useRef<any>(null)

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
    const { data } = await supabase.from('models').select('agency').ilike('agency', `%${q}%`).not('agency', 'is', null).limit(10)
    const unique = [...new Set((data || []).map((r: any) => r.agency).filter(Boolean))]
    setAgencySuggestions(unique)
  }

  const searchBoards = async (q: string) => {
    if (!q) { setBoardSuggestions([]); return }
    const { data } = await supabase.from('models').select('board').ilike('board', `%${q}%`).not('board', 'is', null).limit(10)
    const unique = [...new Set((data || []).map((r: any) => r.board).filter(Boolean))]
    setBoardSuggestions(unique)
  }

  const searchAgentNames = async (q: string) => {
    if (!q) { setAgentNameSuggestions([]); return }
    const { data } = await supabase.from('models').select('agent_name').ilike('agent_name', `%${q}%`).not('agent_name', 'is', null).limit(10)
    const unique = [...new Set((data || []).map((r: any) => r.agent_name).filter(Boolean))]
    setAgentNameSuggestions(unique)
  }

  const searchBasedIn = async (q: string) => {
    if (!q) { setBasedInSuggestions([]); return }
    const { data } = await supabase.from('models').select('based_in').ilike('based_in', q + '%').not('based_in', 'is', null).limit(8)
    const unique = [...new Set((data || []).map((r: any) => r.based_in).filter(Boolean))]
    setBasedInSuggestions(unique)
  }

  const searchFriends = async (q: string) => {
    if (!q || q.length < 2) { setFriendResults([]); return }
    const { data } = await supabase
      .from('models')
      .select('id, first_name, last_name')
      .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
      .limit(8)
    setFriendResults(data || [])
  }

  const onFriendSearchChange = (q: string) => {
    setFriendSearch(q)
    clearTimeout(friendDebounceRef.current)
    friendDebounceRef.current = setTimeout(() => searchFriends(q), 300)
  }

  const selectFriend = (model: any) => {
    if (!relatedModels.includes(model.id)) {
      setRelatedModels(prev => [...prev, model.id])
      setRelatedModelNames(prev => ({ ...prev, [model.id]: `${model.first_name} ${model.last_name}` }))
    }
    setFriendSearch('')
    setFriendResults([])
  }

  const removeFriend = (id: string) => {
    setRelatedModels(prev => prev.filter(x => x !== id))
  }

  const selectSuggestion = async (model: any) => {
    setSelectedModel(model); setFirstName(model.first_name); setLastName(model.last_name)
    setSuggestions([])
    const { data: photoData } = await supabase
      .from('model_media').select('public_url').eq('model_id', model.id).eq('is_pdf_primary', true).single()
    if (!photoData) {
      const { data: fallback } = await supabase
        .from('model_media').select('public_url').eq('model_id', model.id).eq('is_visible', true).eq('type', 'photo').order('display_order').limit(1).single()
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
        gender_other: data.gender_other || '',
        height_ft: data.height_ft || 5, height_in: data.height_in || 7,
        bust: data.bust || '', waist: data.waist || '', hips: data.hips || '', dress_size: data.dress_size || '',
        chest: data.chest || '', suit_size: data.suit_size || '', inseam: data.inseam || '',
        shoe_size: data.shoe_size || '',
        agency: data.agency || '',
        board: data.board || '',
        agent_name: data.agent_name || '',
        ethnicity_broad: data.ethnicity_broad ? (Array.isArray(data.ethnicity_broad) ? data.ethnicity_broad : data.ethnicity_broad.split(',').map((s:string)=>s.trim())) : [],
        ethnicity_specific: data.ethnicity_specific ? (Array.isArray(data.ethnicity_specific) ? data.ethnicity_specific : data.ethnicity_specific.split(',').map((s:string)=>s.trim())) : [],
        ethnicity_other: data.ethnicity_other || '',
        languages: data.languages || [],
        instagram_handle: data.instagram_handle || '',
        portfolio_url: data.portfolio_url || '',
        website_url: data.website_url || '',
        skills: data.skills || [], hobbies: data.hobbies || [],
        notes: data.notes || '',
        email: data.email || '', phone: data.phone || '', based_in: data.based_in || '', date_of_birth: data.date_of_birth || '',
      })
    }
    setIsReturning(true); setStep('form')
  }

  const handleSubmit = async () => {
    setSaving(true)
    const modelData = {
      first_name: firstName, last_name: lastName,
      gender: form.gender === 'other' && form.gender_other ? form.gender_other : form.gender,
      gender_other: form.gender_other,
      height_ft: form.height_ft, height_in: form.height_in,
      bust: form.bust, waist: form.waist, hips: form.hips, dress_size: form.dress_size,
      chest: form.chest, suit_size: form.suit_size, inseam: form.inseam,
      shoe_size: form.shoe_size,
      agency: form.agency,
      board: form.board || null,
      agent_name: form.agent_name || null,
      ethnicity_broad: Array.isArray(form.ethnicity_broad) ? form.ethnicity_broad.join(',') : form.ethnicity_broad,
      ethnicity_specific: Array.isArray(form.ethnicity_specific) ? form.ethnicity_specific.join(',') : form.ethnicity_specific,
      ethnicity_other: form.ethnicity_other || null,
      languages: form.languages,
      instagram_handle: form.instagram_handle,
      portfolio_url: form.portfolio_url,
      website_url: form.website_url || null,
      skills: form.skills, hobbies: form.hobbies,
      notes: form.notes || null,
      email: form.email || null, phone: form.phone || null, based_in: form.based_in || null, date_of_birth: form.date_of_birth || null,
      updated_at: new Date().toISOString(),
    }

    const res = await fetch('/api/cast-signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelData, projectId: project.id, modelId: selectedModel?.id, isReturning }),
    })
    const result = await res.json()
    const modelId = result.modelId

    if (modelId) {
      for (const file of selfieFiles) {
        const ext = file.name.split('.').pop() || 'jpg'
        const storagePath = modelId + '/' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext
        const { error: upErr } = await supabase.storage.from('model-media').upload(storagePath, file)
        if (!upErr) {
          const { data: { publicUrl } } = supabase.storage.from('model-media').getPublicUrl(storagePath)
          await fetch('/api/cast-signin/media', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ modelId, storagePath, publicUrl }),
          })
        }
      }
      // Save friends & family relationships
      for (const relId of relatedModels) {
        await supabase.from('model_relationships').insert({
          model_id: modelId,
          related_model_id: relId,
          relationship_type: 'friend_family',
        })
      }
    }
    setSaving(false); setStep('done')
  }

  // Helper: does any selected ethnicity-specific value need a text input?
  const hasOtherSpecific = (form.ethnicity_specific as string[]).some(s => s.startsWith('Other '))

  if (step === 'loading') return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <img src="/logo.jpg" alt="Tasha Tongpreecha Casting" className="h-6 w-auto mx-auto" />
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
            <div className="border border-neutral-200 mb-8 overflow-hidden max-w-[220px] mx-auto">
              {modelPhoto ? (
                <img src={modelPhoto} alt={selectedModel.first_name} className="w-full aspect-[3/4] object-cover object-top" />
              ) : (
                <div className="w-full aspect-[3/4] bg-neutral-100 flex items-center justify-center text-neutral-300 text-2xl font-light">
                  {selectedModel.first_name?.[0]}{selectedModel.last_name?.[0]}
                </div>
              )}
              <div className="p-4">
                <p className="text-sm font-medium tracking-wider uppercase leading-snug">{selectedModel.first_name} {selectedModel.last_name}</p>
                {selectedModel.agency && <p className="text-xs text-neutral-500 mt-1">{selectedModel.agency}</p>}
              </div>
            </div>
            <div className="flex gap-4 justify-center mb-8">
              <Button onClick={confirmReturning}>Yes, This Is Me</Button>
              <Button variant="secondary" onClick={() => setStep('not-me')}>Not Me</Button>
            </div>
          </div>
        )}

        {step === 'not-me' && (
          <div className="text-center">
            <h2 className="text-xl font-light tracking-widest uppercase mb-4">No Problem</h2>
            <p className="text-sm text-neutral-500 mb-10">What would you like to do?</p>
            <div className="flex flex-col gap-4 max-w-xs mx-auto">
              <Button onClick={() => { setSelectedModel(null); setModelPhoto(null); setIsReturning(false); setFirstName(''); setLastName(''); setStep('name') }}>
                Search My Name Again
              </Button>
              <Button variant="secondary" onClick={() => { setSelectedModel(null); setModelPhoto(null); setIsReturning(false); setStep('form') }}>
                I'm New — Add Me
              </Button>
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
                  {(['female', 'male', 'non-binary', 'other'] as Gender[]).map(g => (
                    <button key={g} type="button" onClick={() => setForm(f => ({ ...f, gender: g }))}
                      className={`flex-1 py-2 text-xs border tracking-wider uppercase transition-colors ${form.gender === g ? 'bg-black text-white border-black' : 'border-neutral-300 hover:border-black'}`}>
                      {g}
                    </button>
                  ))}
                </div>
                {form.gender === 'other' && (
                  <div className="mt-3">
                    <Input label="Please specify" value={form.gender_other} onChange={e => setForm(f => ({ ...f, gender_other: e.target.value }))} placeholder="e.g. Gender fluid" />
                  </div>
                )}
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
                <p className="text-xs text-neutral-400 mt-1">{heightToCm(form.height_ft, form.height_in)} cm</p>
              </div>

              {/* Female sizing */}
              {(form.gender === 'female') && (
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Bust" value={form.bust} onChange={e => setForm(f => ({ ...f, bust: e.target.value }))} placeholder='e.g. 34"' />
                  <Input label="Waist" value={form.waist} onChange={e => setForm(f => ({ ...f, waist: e.target.value }))} placeholder='e.g. 26"' />
                  <Input label="Hips" value={form.hips} onChange={e => setForm(f => ({ ...f, hips: e.target.value }))} placeholder='e.g. 36"' />
                  <Input label="Dress Size" value={form.dress_size} onChange={e => setForm(f => ({ ...f, dress_size: e.target.value }))} />
                </div>
              )}
              {(form.gender === 'non-binary' || form.gender === 'other') && (
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Bust" value={form.bust} onChange={e => setForm(f => ({ ...f, bust: e.target.value }))} placeholder='e.g. 34"' />
                  <Input label="Chest" value={form.chest} onChange={e => setForm(f => ({ ...f, chest: e.target.value }))} placeholder='e.g. 40"' />
                  <Input label="Waist" value={form.waist} onChange={e => setForm(f => ({ ...f, waist: e.target.value }))} placeholder='e.g. 26"' />
                  <Input label="Hips" value={form.hips} onChange={e => setForm(f => ({ ...f, hips: e.target.value }))} placeholder='e.g. 36"' />
                  <Input label="Dress Size" value={form.dress_size} onChange={e => setForm(f => ({ ...f, dress_size: e.target.value }))} />
                  <Input label="Suit Size" value={form.suit_size} onChange={e => setForm(f => ({ ...f, suit_size: e.target.value }))} placeholder='e.g. 40R' />
                  <Input label="Inseam" value={form.inseam} onChange={e => setForm(f => ({ ...f, inseam: e.target.value }))} placeholder='e.g. 32"' />
                </div>
              )}
              {(form.gender === 'male') && (
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Chest" value={form.chest} onChange={e => setForm(f => ({ ...f, chest: e.target.value }))} placeholder='e.g. 40"' />
                  <Input label="Waist" value={form.waist} onChange={e => setForm(f => ({ ...f, waist: e.target.value }))} placeholder='e.g. 32"' />
                  <Input label="Inseam" value={form.inseam} onChange={e => setForm(f => ({ ...f, inseam: e.target.value }))} placeholder='e.g. 32"' />
                  <Input label="Suit Size" value={form.suit_size} onChange={e => setForm(f => ({ ...f, suit_size: e.target.value }))} placeholder='e.g. 40R' />
                </div>
              )}

              <div>
                <label className="label block mb-1">Shoe Size (US)</label>
                <select value={form.shoe_size} onChange={e => setForm(f => ({ ...f, shoe_size: e.target.value }))}
                  className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none">
                  <option value="">Select...</option>
                  {SHOE_SIZES.map(s => (
                    <option key={s.us} value={s.us}>US {s.us} / EU {s.eu}</option>
                  ))}
                </select>
              </div>

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

              {/* Board with autocomplete */}
              <div className="relative">
                <Input
                  label="Board"
                  value={form.board}
                  onChange={e => {
                    setForm(f => ({ ...f, board: e.target.value }))
                    searchBoards(e.target.value)
                    setShowBoardSuggestions(true)
                  }}
                  onFocus={() => { if (form.board) { searchBoards(form.board); setShowBoardSuggestions(true) } }}
                  placeholder="Board name (if applicable)"
                />
                {showBoardSuggestions && boardSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-neutral-200 z-10 shadow-sm">
                    {boardSuggestions.map(a => (
                      <button key={a} type="button"
                        onClick={() => { setForm(f => ({ ...f, board: a })); setShowBoardSuggestions(false) }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 border-b border-neutral-100 last:border-0">
                        {a}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Agent Name with autocomplete */}
              <div className="relative">
                <Input
                  label="Agent Name"
                  value={form.agent_name}
                  onChange={e => {
                    setForm(f => ({ ...f, agent_name: e.target.value }))
                    searchAgentNames(e.target.value)
                    setShowAgentNameSuggestions(true)
                  }}
                  onFocus={() => { if (form.agent_name) { searchAgentNames(form.agent_name); setShowAgentNameSuggestions(true) } }}
                  placeholder="Your agent's name"
                />
                {showAgentNameSuggestions && agentNameSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-neutral-200 z-10 shadow-sm">
                    {agentNameSuggestions.map(a => (
                      <button key={a} type="button"
                        onClick={() => { setForm(f => ({ ...f, agent_name: a })); setShowAgentNameSuggestions(false) }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 border-b border-neutral-100 last:border-0">
                        {a}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Ethnicity */}
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
                  {(form.ethnicity_broad as string[]).includes('Other') && (
                    <div className="mb-4">
                      <Input label="Please specify (Ethnicity)" value={form.ethnicity_other}
                        onChange={e => setForm(f => ({ ...f, ethnicity_other: e.target.value }))}
                        placeholder="Please specify your ethnicity" />
                    </div>
                  )}
                  {(form.ethnicity_broad as string[]).length > 0 && (
                    <>
                      <label className="label block mb-2">More Specific</label>
                      <div className="flex flex-wrap gap-2">
                        {(form.ethnicity_broad as string[]).flatMap(b => {
                          const specifics = ETHNICITY_MAP[b] || []
                          if (specifics.length === 0) return []
                          return [...specifics, 'Other']
                        }).map(s => (
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
                      {hasOtherSpecific && (
                        <div className="mt-3">
                          <Input label="Please specify (specific background)" value={form.ethnicity_other}
                            onChange={e => setForm(f => ({ ...f, ethnicity_other: e.target.value }))}
                            placeholder="Please specify" />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <Input label="Instagram Handle" value={form.instagram_handle}
                onChange={e => setForm(f => ({ ...f, instagram_handle: e.target.value.replace('@', '') }))}
                placeholder="yourhandle (no @)" />

              <Input label="Portfolio URL" value={form.portfolio_url}
                onChange={e => setForm(f => ({ ...f, portfolio_url: e.target.value }))} type="url" placeholder="https://..." />
              <Input label="Website URL" value={form.website_url}
                onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))} type="url" placeholder="https://..." />

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

              {/* Friends & Family */}
              <div className="border-t border-neutral-100 pt-6">
                <p className="label mb-2">Friends & Family</p>
                <p className="text-xs text-neutral-400 mb-3">Search for a friend or family member in our database.</p>
                {relatedModels.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {relatedModels.map(id => (
                      <span key={id} className="flex items-center gap-1 px-3 py-1.5 bg-black text-white text-xs">
                        {relatedModelNames[id] || id}
                        <button type="button" onClick={() => removeFriend(id)} className="ml-1 hover:opacity-60">✕</button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="relative">
                  <input
                    value={friendSearch}
                    onChange={e => onFriendSearchChange(e.target.value)}
                    placeholder="Search by name..."
                    className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none focus:border-black"
                  />
                  {friendResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-neutral-200 z-10 shadow-sm">
                      {friendResults.map(m => (
                        <button key={m.id} type="button" onClick={() => selectFriend(m)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 border-b border-neutral-100 last:border-0">
                          {m.first_name} {m.last_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-neutral-100 pt-6 space-y-4">
                <p className="label">Photos (Optional)</p>
                <p className="text-xs text-neutral-400">Upload up to 2 photos of yourself.</p>
                <div className="flex gap-3">
                  {[0, 1].map(i => (
                    <label key={i} className="flex-1 aspect-[3/4] border-2 border-dashed border-neutral-200 flex items-center justify-center cursor-pointer hover:border-black transition-colors overflow-hidden relative">
                      <input type="file" accept="image/*" className="hidden" onChange={e => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        const newFiles = [...selfieFiles]; newFiles[i] = file; setSelfieFiles(newFiles)
                        const newUrls = [...selfiePreviewUrls]; newUrls[i] = URL.createObjectURL(file); setSelfiePreviewUrls(newUrls)
                      }} />
                      {selfiePreviewUrls[i]
                        ? <img src={selfiePreviewUrls[i]} className="w-full h-full object-cover" alt="" />
                        : <span className="text-xs text-neutral-300 tracking-widest uppercase">+ Photo {i + 1}</span>}
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t border-neutral-100 pt-6 space-y-4">
                <p className="label">Optional Contact</p>
                <Input label="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="email" />
                <Input label="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} type="tel" />
                <div className="relative">
                  <Input label="Based In (City, Country)" value={form.based_in}
                    onChange={e => { setForm(f => ({ ...f, based_in: e.target.value })); searchBasedIn(e.target.value); setShowBasedInSuggestions(true) }}
                    onFocus={() => { if (form.based_in) { searchBasedIn(form.based_in); setShowBasedInSuggestions(true) } }}
                    placeholder="e.g. New York, USA" />
                  {showBasedInSuggestions && basedInSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-neutral-200 z-10 shadow-sm">
                      {basedInSuggestions.map(a => (
                        <button key={a} type="button"
                          onClick={() => { setForm(f => ({ ...f, based_in: a })); setShowBasedInSuggestions(false) }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 border-b border-neutral-100 last:border-0">{a}</button>
                      ))}
                    </div>
                  )}
                </div>
                <Input label="Date of Birth" value={form.date_of_birth} onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))} type="date" />
              </div>

              {/* Anything else */}
              <div>
                <label className="label block mb-1">Anything else?</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Anything else you'd like us to know? The more we know about you, the easier it will be to get you booked!"
                  rows={3}
                  className="w-full border-b border-neutral-200 bg-transparent py-2 text-sm focus:outline-none focus:border-black resize-none"
                />
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
                setSuggestions([]); setRelatedModels([]); setRelatedModelNames({}); setStep('name');
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
