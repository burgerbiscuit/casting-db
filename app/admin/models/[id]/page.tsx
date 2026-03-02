'use client'
import { useState, useEffect, useCallback, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ChipInput } from '@/components/ChipInput'
import { MediaUploader } from '@/components/MediaUploader'
import { Eye, EyeOff, Trash2, Star } from 'lucide-react'
import Link from 'next/link'

const ETHNICITY_MAP: Record<string, string[]> = {
  'Asian': ['Thai', 'Japanese', 'Korean', 'Chinese', 'Filipino', 'Vietnamese', 'Indonesian', 'Malaysian', 'Cambodian', 'Burmese', 'Laotian'],
  'South Asian': ['Indian', 'Pakistani', 'Bangladeshi', 'Sri Lankan', 'Nepali'],
  'Latino / Hispanic': ['Colombian', 'Mexican', 'Brazilian', 'Puerto Rican', 'Cuban', 'Dominican', 'Peruvian', 'Venezuelan', 'Argentinian', 'Chilean'],
  'Black / African': ['Nigerian', 'Ghanaian', 'Ethiopian', 'Kenyan', 'South African', 'Jamaican', 'Haitian', 'Somali', 'Congolese', 'Senegalese'],
  'White / European': ['French', 'Italian', 'Spanish', 'German', 'British', 'Russian', 'Polish', 'Scandinavian', 'Dutch', 'Greek', 'Portuguese'],
  'Middle Eastern': ['Lebanese', 'Iranian/Persian', 'Egyptian', 'Turkish', 'Moroccan', 'Israeli', 'Iraqi', 'Syrian', 'Jordanian'],
  'Pacific Islander': ['Hawaiian', 'Samoan', 'Tongan', 'Fijian', 'Maori'],
  'Indigenous': ['Native American', 'First Nations', 'Aboriginal Australian'],
  'Mixed': ['Mixed'], 'Other': ['Other'],
}

export default function ModelProfile({ params }: { params: { id: string } }) {
  const { id } = params
  const supabase = createClient()
  const [model, setModel] = useState<any>(null)
  const [media, setMedia] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'media'>('profile')

  const loadModel = useCallback(async () => {
    const { data } = await supabase.from('models').select('*').eq('id', id).single()
    setModel(data)
  }, [id])

  const loadMedia = useCallback(async () => {
    const { data } = await supabase.from('model_media').select('*').eq('model_id', id).order('display_order')
    setMedia(data || [])
  }, [id])

  useEffect(() => { loadModel(); loadMedia() }, [loadModel, loadMedia])

  const saveModel = async () => {
    setSaving(true)
    await supabase.from('models').update({ ...model, updated_at: new Date().toISOString() }).eq('id', id)
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const toggleFlag = async (mediaId: string, field: 'is_visible' | 'is_pdf_primary' | 'is_pdf_secondary', value: boolean) => {
    if (field === 'is_pdf_primary' && value) {
      await supabase.from('model_media').update({ is_pdf_primary: false }).eq('model_id', id)
    }
    if (field === 'is_pdf_secondary' && value) {
      await supabase.from('model_media').update({ is_pdf_secondary: false }).eq('model_id', id)
    }
    await supabase.from('model_media').update({ [field]: value }).eq('id', mediaId)
    loadMedia()
  }

  const deleteMedia = async (mediaId: string, storagePath: string) => {
    if (!confirm('Delete this file?')) return
    await supabase.storage.from('model-media').remove([storagePath])
    await supabase.from('model_media').delete().eq('id', mediaId)
    loadMedia()
  }

  if (!model) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <div>
          <Link href="/admin/models" className="label hover:text-black">← Models</Link>
          <h1 className="text-2xl font-light tracking-widest uppercase mt-2">
            {model.first_name} {model.last_name}
          </h1>
          {model.agency && <p className="text-sm text-neutral-400">{model.agency}</p>}
        </div>
        <Button onClick={saveModel} disabled={saving}>
          {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Changes'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-neutral-200 mb-8">
        {(['profile', 'media'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`pb-3 text-xs tracking-widest uppercase transition-colors ${activeTab === tab ? 'border-b-2 border-black text-black' : 'text-neutral-400 hover:text-black'}`}>
            {tab} {tab === 'media' ? `(${media.length})` : ''}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="max-w-2xl space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <Input label="First Name" value={model.first_name || ''} onChange={e => setModel({ ...model, first_name: e.target.value })} />
            <Input label="Last Name" value={model.last_name || ''} onChange={e => setModel({ ...model, last_name: e.target.value })} />
          </div>

          {/* Gender */}
          <div>
            <p className="label mb-3">Gender</p>
            <div className="flex gap-3">
              {['female', 'male', 'non-binary'].map(g => (
                <button key={g} type="button" onClick={() => setModel({ ...model, gender: g })}
                  className={`flex-1 py-2 text-xs border tracking-wider uppercase transition-colors ${model.gender === g ? 'bg-black text-white border-black' : 'border-neutral-300 hover:border-black'}`}>
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
                <select value={model.height_ft || 5} onChange={e => setModel({ ...model, height_ft: +e.target.value })}
                  className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none">
                  {[4,5,6,7].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="label">In</label>
                <select value={model.height_in ?? 0} onChange={e => setModel({ ...model, height_in: +e.target.value })}
                  className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none">
                  {[0,1,2,3,4,5,6,7,8,9,10,11].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Female sizing */}
          {model.gender !== 'male' && (
            <div className="grid grid-cols-2 gap-4">
              <Input label="Bust" value={model.bust || ''} onChange={e => setModel({ ...model, bust: e.target.value })} />
              <Input label="Waist" value={model.waist || ''} onChange={e => setModel({ ...model, waist: e.target.value })} />
              <Input label="Hips" value={model.hips || ''} onChange={e => setModel({ ...model, hips: e.target.value })} />
              <Input label="Dress Size" value={model.dress_size || ''} onChange={e => setModel({ ...model, dress_size: e.target.value })} />
            </div>
          )}

          {/* Male sizing */}
          {model.gender === 'male' && (
            <div className="grid grid-cols-2 gap-4">
              <Input label="Chest" value={model.chest || ''} onChange={e => setModel({ ...model, chest: e.target.value })} />
              <Input label="Waist" value={model.waist || ''} onChange={e => setModel({ ...model, waist: e.target.value })} />
              <Input label="Inseam" value={model.inseam || ''} onChange={e => setModel({ ...model, inseam: e.target.value })} />
              <Input label="Suit Size" value={model.suit_size || ''} onChange={e => setModel({ ...model, suit_size: e.target.value })} />
            </div>
          )}

          <Input label="Shoe Size" value={model.shoe_size || ''} onChange={e => setModel({ ...model, shoe_size: e.target.value })} />
          <Input label="Agency" value={model.agency || ''} onChange={e => setModel({ ...model, agency: e.target.value })} />

          {/* Ethnicity - multi select */}
          <div>
            <p className="label mb-3">Ethnicity</p>
            <label className="label block mb-2">Background</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.keys(ETHNICITY_MAP).map(b => {
                const broad = Array.isArray(model.ethnicity_broad) ? model.ethnicity_broad : (model.ethnicity_broad ? model.ethnicity_broad.split(',').map((s:string)=>s.trim()) : [])
                return (
                  <button key={b} type="button" onClick={() => {
                    const current = Array.isArray(model.ethnicity_broad) ? model.ethnicity_broad : (model.ethnicity_broad ? model.ethnicity_broad.split(',').map((s:string)=>s.trim()) : [])
                    const updated = current.includes(b) ? current.filter((x:string)=>x!==b) : [...current, b]
                    setModel({ ...model, ethnicity_broad: updated })
                  }}
                  className={`text-xs px-3 py-2 border transition-colors ${broad.includes(b) ? 'bg-black text-white border-black' : 'border-neutral-300 hover:border-black'}`}>
                    {b}
                  </button>
                )
              })}
            </div>
            {(() => {
              const broad = Array.isArray(model.ethnicity_broad) ? model.ethnicity_broad : (model.ethnicity_broad ? model.ethnicity_broad.split(',').map((s:string)=>s.trim()) : [])
              const specific = Array.isArray(model.ethnicity_specific) ? model.ethnicity_specific : (model.ethnicity_specific ? model.ethnicity_specific.split(',').map((s:string)=>s.trim()) : [])
              const options = broad.flatMap((b:string) => ETHNICITY_MAP[b] || [])
              return options.length > 0 ? (
                <div>
                  <label className="label block mb-2">More Specific</label>
                  <div className="flex flex-wrap gap-2">
                    {options.map((s:string) => (
                      <button key={s} type="button" onClick={() => {
                        const updated = specific.includes(s) ? specific.filter((x:string)=>x!==s) : [...specific, s]
                        setModel({ ...model, ethnicity_specific: updated })
                      }}
                      className={`text-xs px-3 py-2 border transition-colors ${specific.includes(s) ? 'bg-black text-white border-black' : 'border-neutral-300 hover:border-black'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null
            })()}
          </div>

          <Input label="Instagram Handle" value={model.instagram_handle || ''} onChange={e => setModel({ ...model, instagram_handle: e.target.value.replace('@', '') })} placeholder="handle (no @)" />
          <Input label="Portfolio URL" value={model.portfolio_url || ''} onChange={e => setModel({ ...model, portfolio_url: e.target.value })} type="url" />
          <ChipInput label="Languages Spoken" value={model.languages || []} onChange={languages => setModel({ ...model, languages })} />
          <ChipInput label="Skills" value={model.skills || []} onChange={skills => setModel({ ...model, skills })} />
          <ChipInput label="Hobbies" value={model.hobbies || []} onChange={hobbies => setModel({ ...model, hobbies })} />

          <div className="border-t border-neutral-100 pt-6 space-y-4">
            <Input label="Email" value={model.email || ''} onChange={e => setModel({ ...model, email: e.target.value })} type="email" />
            <Input label="Phone" value={model.phone || ''} onChange={e => setModel({ ...model, phone: e.target.value })} />
          </div>

          <div>
            <label className="label block mb-2">Admin Notes</label>
            <textarea value={model.notes || ''} onChange={e => setModel({ ...model, notes: e.target.value })} rows={4}
              className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none resize-none" />
          </div>
        </div>
      )}

      {activeTab === 'media' && (
        <div>
          <MediaUploader modelId={id} onUploaded={loadMedia} />

          {media.length > 0 && (
            <div className="mt-4 mb-2 flex gap-6 text-[10px] text-neutral-400 tracking-wider uppercase">
              <span className="flex items-center gap-1"><Eye size={10} /> Show in presentations</span>
              <span className="flex items-center gap-1"><EyeOff size={10} /> Hide from presentations</span>
              <span className="flex items-center gap-1"><Star size={10} fill="currentColor" /> PDF photo 1 or 2</span>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {media.map(m => (
              <div key={m.id} className={`border overflow-hidden transition-colors ${m.is_visible ? 'border-neutral-200' : 'border-neutral-100 opacity-50'}`}>
                <div className="relative">
                  {m.type === 'video' ? (
                    <video src={m.public_url} className="w-full aspect-square object-cover" />
                  ) : (
                    <img src={m.public_url} alt="" className="w-full aspect-square object-cover" />
                  )}
                  {!m.is_visible && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                      <span className="text-[10px] tracking-widest uppercase text-neutral-400">Hidden</span>
                    </div>
                  )}
                </div>

                <div className="p-3 space-y-2 bg-white">
                  {/* Show / Hide toggle */}
                  <button onClick={() => toggleFlag(m.id, 'is_visible', !m.is_visible)}
                    className={`w-full flex items-center justify-center gap-2 py-1.5 text-[10px] tracking-widest uppercase border transition-colors ${m.is_visible ? 'border-black bg-black text-white' : 'border-neutral-300 text-neutral-500 hover:border-black'}`}>
                    {m.is_visible ? <><Eye size={10} /> Showing</> : <><EyeOff size={10} /> Hidden</>}
                  </button>

                  {/* PDF selectors */}
                  <div className="flex gap-1.5">
                    <button onClick={() => toggleFlag(m.id, 'is_pdf_primary', !m.is_pdf_primary)}
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] tracking-widest uppercase border transition-colors ${m.is_pdf_primary ? 'border-black bg-black text-white' : 'border-neutral-200 text-neutral-400 hover:border-black'}`}
                      title="Use as first PDF photo">
                      <Star size={9} fill={m.is_pdf_primary ? 'white' : 'none'} /> PDF 1
                    </button>
                    <button onClick={() => toggleFlag(m.id, 'is_pdf_secondary', !m.is_pdf_secondary)}
                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] tracking-widest uppercase border transition-colors ${m.is_pdf_secondary ? 'border-black bg-black text-white' : 'border-neutral-200 text-neutral-400 hover:border-black'}`}
                      title="Use as second PDF photo">
                      <Star size={9} fill={m.is_pdf_secondary ? 'white' : 'none'} /> PDF 2
                    </button>
                    <button onClick={() => deleteMedia(m.id, m.storage_path)}
                      className="px-2 py-1.5 border border-neutral-200 text-neutral-300 hover:border-red-300 hover:text-red-400 transition-colors">
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!media.length && (
              <p className="col-span-4 text-sm text-neutral-400 py-8 text-center">No media yet. Upload above.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
