'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ChipInput } from '@/components/ChipInput'

type Step = 'loading' | 'landing' | 'name' | 'confirm' | 'verify' | 'not-me' | 'form' | 'done' | 'group-name' | 'group-form' | 'group-done'
type Gender = 'female' | 'male' | 'non-binary' | 'other' | ''

const HEIGHT_FT = [4,5,6,7]
const HEIGHT_IN = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5]
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
  tiktok_handle: '',
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
  const [birthdayInput, setBirthdayInput] = useState('')
  const [birthdayError, setBirthdayError] = useState('')
  const [project, setProject] = useState<any>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [groupName, setGroupName] = useState('')
  const [groupSaving, setGroupSaving] = useState(false)
  const [groupForm, setGroupForm] = useState({
    group_type: '', size: '', based_in: '', agency: '',
    instagram_handle: '', website: '',
    description: '', group_story: '',
    contact_name: '', contact_email: '', contact_phone: '',
  })
  const setGF = (k: string, v: string) => setGroupForm(f => ({ ...f, [k]: v }))
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [selectedModel, setSelectedModel] = useState<any>(null)
  const [modelPhoto, setModelPhoto] = useState<string | null>(null)
  const [isReturning, setIsReturning] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [agencySuggestions, setAgencySuggestions] = useState<string[]>([])
  const [agencyContacts, setAgencyContacts] = useState<any[]>([])
  const [boardSuggestions, setBoardSuggestions] = useState<string[]>([])
  const [agentNameSuggestions, setAgentNameSuggestions] = useState<string[]>([])
  const [basedInSuggestions, setBasedInSuggestions] = useState<string[]>([])
  const [showBasedInSuggestions, setShowBasedInSuggestions] = useState(false)
  const [selfieFiles, setSelfieFiles] = useState<File[]>([])
  const [selfiePreviewUrls, setSelfiePreviewUrls] = useState<string[]>([])
  const [photoErrors, setPhotoErrors] = useState<string[]>(['', ''])
  const [photoCompressing, setPhotoCompressing] = useState<boolean[]>([false, false])
  const [showAgencySuggestions, setShowAgencySuggestions] = useState(false)
  const [showBoardSuggestions, setShowBoardSuggestions] = useState(false)
  const [showAgentNameSuggestions, setShowAgentNameSuggestions] = useState(false)
  const agencyRef = useRef<HTMLDivElement>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const agentNameRef = useRef<HTMLDivElement>(null)
  const nameSearchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (nameSearchRef.current && !nameSearchRef.current.contains(e.target as Node)) setSuggestions([])
      if (agencyRef.current && !agencyRef.current.contains(e.target as Node)) setShowAgencySuggestions(false)
      if (boardRef.current && !boardRef.current.contains(e.target as Node)) setShowBoardSuggestions(false)
      if (agentNameRef.current && !agentNameRef.current.contains(e.target as Node)) setShowAgentNameSuggestions(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])
  // Friends & Family
  const [friendSearch, setFriendSearch] = useState('')
  const [friendResults, setFriendResults] = useState<any[]>([])
  const [relatedModels, setRelatedModels] = useState<string[]>([])
  const [relatedModelNames, setRelatedModelNames] = useState<Record<string, string>>({})
  const debounceRef = useRef<any>(null)
  const friendDebounceRef = useRef<any>(null)

  useEffect(() => {
    fetch('/api/project-by-slug?slug=' + encodeURIComponent(slug))
      .then(r => r.ok ? r.json() : null)
      .then(data => {
      if (data?.id) { setProject(data); setStep('landing') }
    })
  }, [slug])

  const searchModels = async (fn: string, ln: string) => {
    const q = (fn + (ln ? ' ' + ln : '')).trim()
    if (q.length < 2) { setSuggestions([]); return }
    // Use server-side API — works for unauthenticated users on cast sign-in
    const res = await fetch('/api/model-search?q=' + encodeURIComponent(q))
    const data = await res.json()
    setSuggestions(Array.isArray(data) ? data : [])
  }

  const onNameChange = (fn: string, ln: string) => {
    setFirstName(fn); setLastName(ln)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchModels(fn, ln), 300)
  }

  const searchAgencies = async (q: string) => {
    if (!q) { setAgencySuggestions([]); setAgencyContacts([]); return }
    const { data } = await supabase
      .from('agency_contacts')
      .select('agency_name')
      .ilike('agency_name', `%${q}%`)
      .limit(20)
    const unique = [...new Set((data || []).map((r: any) => r.agency_name).filter(Boolean))]
    setAgencySuggestions(unique)
  }

  const loadAgentContacts = async (agencyName: string) => {
    if (!agencyName) { setAgencyContacts([]); return }
    const { data } = await supabase
      .from('agency_contacts')
      .select('agent_name, board, email, cell_phone')
      .ilike('agency_name', agencyName)
      .not('agent_name', 'is', null)
      .order('board')
    setAgencyContacts(data || [])
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

  const handleSkipSignIn = async () => {
    setSaving(true)
    const res = await fetch('/api/cast-signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelId: selectedModel.id, projectId: project?.id, isReturning: true, modelData: {}, selfieBase64Files: [] })
    })
    setSaving(false)
    setStep('done')
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
        tiktok_handle: data.tiktok_handle || '',
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
      tiktok_handle: form.tiktok_handle || null,
      portfolio_url: form.portfolio_url,
      website_url: form.website_url || null,
      skills: form.skills, hobbies: form.hobbies,
      notes: form.notes || null,
      email: form.email || null, phone: form.phone || null, based_in: form.based_in || null, date_of_birth: form.date_of_birth || null,
      updated_at: new Date().toISOString(),
    }

    try {
      const res = await fetch('/api/cast-signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelData, projectId: project.id, modelId: selectedModel?.id, isReturning }),
      })
      if (!res.ok) throw new Error('Server error ' + res.status)
      const result = await res.json()
      const modelId = result.modelId
      if (!modelId) throw new Error('No model ID returned')

      for (const file of selfieFiles.filter(Boolean)) {
        if (file.size > 8 * 1024 * 1024) { console.warn('Skipping oversized photo:', file.name); continue }
        const fd = new FormData()
        fd.append('modelId', modelId)
        fd.append('file', file)
        await fetch('/api/cast-signin/media', { method: 'POST', body: fd })
      }
      for (const relId of relatedModels) {
        await supabase.from('model_relationships').insert({
          model_id: modelId, related_model_id: relId, relationship_type: 'friend_family',
        })
      }
      setSaving(false); setStep('done')
    } catch (err) {
      console.error('Sign-in error:', err)
      alert('Something went wrong saving your info. Please check your connection and try again.')
      setSaving(false)
    }
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
      <div className="max-w-lg mx-auto px-4 md:px-6 py-8 md:py-16">
        <div className="text-center mb-12">
          <img src="/logo.jpg" alt="Tasha Tongpreecha Casting" className="h-6 w-auto mx-auto" />
          {project && step !== 'landing' && (
            <p className="text-xs text-neutral-400 tracking-widest uppercase mt-2">{project.name}</p>
          )}
        </div>

        {step === 'landing' && (
          <div className="text-center">
            <h1 className="text-3xl font-light tracking-widest uppercase mb-4">{project?.name}</h1>
            {project?.shoot_date && (
              <p className="text-sm text-neutral-400 mb-12 tracking-wider">
                {new Date(project.shoot_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            )}
            <Button onClick={() => setStep(project?.is_group_signin ? 'group-name' : 'name')} size="lg">Sign In</Button>
          </div>
        )}

        {step === 'name' && (
          <div>
            <h2 className="text-xl font-light tracking-widest uppercase mb-10 text-center">Your Name</h2>
            <div className="space-y-6 relative" ref={nameSearchRef}>
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
              <Button onClick={() => { setBirthdayInput(''); setBirthdayError(''); setStep('verify') }}>Yes, This Is Me</Button>
              <Button variant="secondary" onClick={() => setStep('not-me')}>Not Me</Button>
            </div>
          </div>
        )}

        {step === 'verify' && selectedModel && (
          <div className="text-center">
            <h2 className="text-xl font-light tracking-widest uppercase mb-4">One Quick Check</h2>
            <p className="text-sm text-neutral-500 mb-10">Enter your date of birth to confirm it's you.</p>
            <div className="max-w-xs mx-auto text-left mb-6">
              <label className="label block mb-2">Date of Birth</label>
              <input
                type="date"
                value={birthdayInput}
                onChange={e => { setBirthdayInput(e.target.value); setBirthdayError('') }}
                className="w-full border-b border-neutral-300 py-2 text-sm focus:outline-none focus:border-black bg-transparent"
              />
              {birthdayError && <p className="text-xs text-red-500 mt-2">{birthdayError}</p>}
            </div>
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <Button onClick={async () => {
                if (!birthdayInput) { setBirthdayError('Please enter your date of birth'); return }
                // Fetch dob from DB and compare
                const { data } = await supabase.from('models').select('date_of_birth').eq('id', selectedModel.id).single()
                const stored = data?.date_of_birth ? data.date_of_birth.slice(0, 10) : null
                if (!stored) {
                  // No birthday on file — just let them through
                  confirmReturning()
                } else if (stored === birthdayInput) {
                  confirmReturning()
                } else {
                  setBirthdayError("That doesn't match. Please try again or select Not Me to go back.")
                }
              }}>Confirm</Button>
              <Button variant="ghost" onClick={() => {
                // Skip verification — go straight to sign-in complete
                handleSkipSignIn()
              }}>Skip — Just Sign Me In</Button>
              <button onClick={() => setStep('confirm')} className="text-xs text-neutral-400 underline mt-1">← Back</button>
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
              <Button variant="secondary" onClick={() => { setSelectedModel(null); setModelPhoto(null); setIsReturning(false); setSelfieFiles([]); setSelfiePreviewUrls([]); setPhotoErrors(['', '']); setForm(defaultForm); setStep('form') }}>
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
                      {HEIGHT_IN.map(n => <option key={n} value={n}>{Number.isInteger(n) ? n : n}</option>)}
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
              <div className="relative" ref={agencyRef}>
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
                {showAgencySuggestions && (agencySuggestions.length > 0 || form.agency.length > 1) && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-neutral-200 z-10 shadow-sm">
                    {agencySuggestions.map(a => (
                      <button key={a} type="button"
                        onClick={() => { setForm(f => ({ ...f, agency: a, agent_name: '', board: '' })); setShowAgencySuggestions(false); loadAgentContacts(a) }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 border-b border-neutral-100 last:border-0">
                        {a}
                      </button>
                    ))}
                    {form.agency && !agencySuggestions.map(a => a.toLowerCase()).includes(form.agency.toLowerCase()) && (
                      <button type="button"
                        onClick={() => { setShowAgencySuggestions(false); setAgencyContacts([]) }}
                        className="w-full px-4 py-2 text-left text-sm text-neutral-400 hover:bg-neutral-50 italic border-t border-neutral-100">
                        + Use "{form.agency}" as new agency
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Agent picker from agency_contacts */}
              {agencyContacts.length > 0 && (
                <div>
                  <p className="label mb-2">Select Your Agent</p>
                  <div className="space-y-1 max-h-48 overflow-y-auto border border-neutral-200">
                    {agencyContacts.map((ac, i) => (
                      <button key={i} type="button"
                        onClick={() => { setShowAgencySuggestions(false); setShowBoardSuggestions(false); setForm(f => ({ ...f, agent_name: ac.agent_name || '', board: ac.board || '' })) }}
                        className={`w-full px-4 py-2.5 text-left text-sm border-b border-neutral-100 last:border-0 transition-colors ${form.agent_name === ac.agent_name ? 'bg-black text-white' : 'hover:bg-neutral-50'}`}>
                        <span className="font-medium">{ac.agent_name}</span>
                        {ac.board && <span className="ml-2 text-xs opacity-60">{ac.board}</span>}
                        {ac.email && <span className="block text-xs opacity-50 mt-0.5">{ac.email}</span>}
                      </button>
                    ))}
                    <button type="button"
                      onClick={() => setForm(f => ({ ...f, agent_name: '', board: '' }))}
                      className="w-full px-4 py-2.5 text-left text-sm text-neutral-400 hover:bg-neutral-50 italic">
                      + My agent isn't listed — enter manually
                    </button>
                  </div>
                </div>
              )}

              {/* Board with autocomplete */}
              <div className="relative" ref={boardRef}>
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
              <div className="relative" ref={agentNameRef}>
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
                  <div className="absolute top-full left-0 right-0 bg-white border border-neutral-200 z-10 shadow-sm max-h-48 overflow-y-auto">
                    {agentNameSuggestions.map(a => (
                      <button key={a} type="button"
                        onClick={() => { setForm(f => ({ ...f, agent_name: a })); setShowAgentNameSuggestions(false) }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 border-b border-neutral-100 last:border-0">
                        {a}
                      </button>
                    ))}
                    {form.agent_name && !agentNameSuggestions.includes(form.agent_name) && (
                      <button type="button"
                        onClick={() => setShowAgentNameSuggestions(false)}
                        className="w-full px-4 py-2 text-left text-sm font-medium text-neutral-600 hover:bg-neutral-50 border-t border-neutral-200">
                        ✓ Use "{form.agent_name}" (new)
                      </button>
                    )}
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
              <Input label="TikTok Handle" value={form.tiktok_handle}
                onChange={e => setForm(f => ({ ...f, tiktok_handle: e.target.value.replace('@', '') }))}
                placeholder="yourhandle (no @)" />

              <Input label="Portfolio URL" value={form.portfolio_url}
                onChange={e => setForm(f => ({ ...f, portfolio_url: e.target.value }))} type="text" placeholder="yoursite.com or https://..." />
              <Input label="Website URL" value={form.website_url}
                onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))} type="text" placeholder="yoursite.com or https://..." />

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
                <p className="text-xs text-neutral-400 mb-0">Upload up to 2 photos of yourself.</p>
                <p className="text-[11px] text-neutral-300">Max 8 MB per photo — large images are automatically compressed.</p>
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
                          const comp = [...photoCompressing]; comp[i] = true; setPhotoCompressing(comp)
                          const { compressImage } = await import('@/lib/compress-image')
                          const compressed = await compressImage(file).catch(() => file)
                          const done = [...photoCompressing]; done[i] = false; setPhotoCompressing(done)
                          const newFiles = [...selfieFiles]; newFiles[i] = compressed; setSelfieFiles(newFiles)
                          const newUrls = [...selfiePreviewUrls]; newUrls[i] = URL.createObjectURL(compressed); setSelfiePreviewUrls(newUrls)
                        }} />
                        {photoCompressing[i]
                          ? <span className="text-[10px] text-neutral-400 tracking-widest uppercase">Compressing…</span>
                          : selfiePreviewUrls[i]
                            ? <img src={selfiePreviewUrls[i]} className="w-full h-full object-cover" alt="" />
                            : <span className="text-xs text-neutral-300 tracking-widest uppercase">+ Photo {i + 1}</span>}
                      </label>
                      {photoErrors[i] && <p className="text-[10px] text-red-500">{photoErrors[i]}</p>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-neutral-100 pt-6 space-y-4">
                <p className="label">Optional Contact</p>
                <Input label="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} type="text" inputMode="email" />
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
                setSelfieFiles([]); setSelfiePreviewUrls([]); setPhotoErrors(['', '']);
                setSuggestions([]); setRelatedModels([]); setRelatedModelNames({}); setStep('name');
              }}
              className="text-xs tracking-widest uppercase border border-black px-6 py-3 hover:bg-black hover:text-white transition-colors"
            >
              Sign In Another Talent
            </button>
          </div>
        )}

        {step === 'group-name' && (
          <div>
            <h2 className="text-xl font-light tracking-widest uppercase mb-10 text-center">Name of Group</h2>
            <input
              autoFocus
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder="Enter your group name"
              className="w-full border-b border-neutral-300 bg-transparent py-3 text-sm focus:outline-none focus:border-black placeholder:text-neutral-300 text-center"
              onKeyDown={e => { if (e.key === 'Enter' && groupName.trim()) setStep('group-form') }}
            />
            <div className="mt-10 flex gap-4 justify-center">
              <Button variant="ghost" onClick={() => setStep('landing')}>Back</Button>
              <Button disabled={!groupName.trim()} onClick={() => setStep('group-form')}>Continue</Button>
            </div>
          </div>
        )}

        {step === 'group-form' && (
          <div className="space-y-7">
            <div>
              <h2 className="text-xl font-light tracking-widest uppercase mb-1 text-center">{groupName}</h2>
              <p className="text-xs text-neutral-400 text-center tracking-widest uppercase">Tell us about your group</p>
            </div>

            {/* Group Type + Size */}
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-1">
                <label className="label">Group Type</label>
                <select value={groupForm.group_type} onChange={e => setGF('group_type', e.target.value)}
                  className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none focus:border-black">
                  <option value="">Select...</option>
                  {['Climbing', 'Dance', 'Music', 'Sports', 'Acrobatics', 'Comedy', 'Cheer', 'Theater', 'Other'].map(t =>
                    <option key={t} value={t}>{t}</option>
                  )}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="label">Size</label>
                <input value={groupForm.size} onChange={e => setGF('size', e.target.value)}
                  placeholder="e.g. Duo, Trio, 4–6"
                  className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none focus:border-black placeholder:text-neutral-300" />
              </div>
            </div>

            {/* Location + Agency */}
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-1">
                <label className="label">Based In</label>
                <input value={groupForm.based_in} onChange={e => setGF('based_in', e.target.value)}
                  placeholder="City"
                  className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none focus:border-black placeholder:text-neutral-300" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="label">Agency / Rep</label>
                <input value={groupForm.agency} onChange={e => setGF('agency', e.target.value)}
                  className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none focus:border-black" />
              </div>
            </div>

            {/* Instagram + Website */}
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-1">
                <label className="label">Instagram</label>
                <input value={groupForm.instagram_handle} onChange={e => setGF('instagram_handle', e.target.value.replace(/^@/, ''))}
                  placeholder="@handle"
                  className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none focus:border-black placeholder:text-neutral-300" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="label">Website</label>
                <input value={groupForm.website} onChange={e => setGF('website', e.target.value)}
                  placeholder="https://"
                  className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none focus:border-black placeholder:text-neutral-300" />
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1">
              <label className="label">About Your Group</label>
              <textarea value={groupForm.description} onChange={e => setGF('description', e.target.value)}
                rows={3} placeholder="Style, background, what you do..."
                className="w-full border border-neutral-200 bg-transparent p-3 text-sm focus:outline-none focus:border-black resize-none placeholder:text-neutral-300" />
            </div>

            {/* Group Story */}
            <div className="flex flex-col gap-1">
              <label className="label">Your Group's Story</label>
              <p className="text-[10px] text-neutral-400">Origin, journey, what climbing means to you as a group.</p>
              <textarea value={groupForm.group_story} onChange={e => setGF('group_story', e.target.value)}
                rows={5} placeholder="Tell your story..."
                className="w-full border border-neutral-200 bg-transparent p-3 text-sm focus:outline-none focus:border-black resize-none placeholder:text-neutral-300" />
            </div>

            {/* Contact */}
            <div>
              <p className="label mb-3">Contact</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="label">Name</label>
                  <input value={groupForm.contact_name} onChange={e => setGF('contact_name', e.target.value)}
                    className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none focus:border-black" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="label">Email</label>
                  <input type="email" value={groupForm.contact_email} onChange={e => setGF('contact_email', e.target.value)}
                    className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none focus:border-black" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="label">Phone</label>
                  <input type="tel" value={groupForm.contact_phone} onChange={e => setGF('contact_phone', e.target.value)}
                    className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none focus:border-black" />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <Button variant="ghost" onClick={() => setStep('group-name')}>Back</Button>
              <Button
                disabled={groupSaving}
                onClick={async () => {
                  if (!groupName.trim() || !project?.id) return
                  setGroupSaving(true)
                  await fetch('/api/group-signin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ groupName: groupName.trim(), projectId: project.id, groupData: groupForm }),
                  })
                  setGroupSaving(false)
                  setStep('group-done')
                }}
              >
                {groupSaving ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </div>
        )}

        {step === 'group-done' && (
          <div className="text-center">
            <div className="text-4xl mb-6">✓</div>
            <h2 className="text-xl font-light tracking-widest uppercase mb-4">Signed In</h2>
            <p className="text-sm text-neutral-500 mb-12">{groupName}</p>
            <button
              onClick={() => { setGroupName(''); setStep('group-name') }}
              className="text-xs tracking-widest uppercase border border-black px-6 py-3 hover:bg-black hover:text-white transition-colors"
            >
              Sign In Another Group
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
