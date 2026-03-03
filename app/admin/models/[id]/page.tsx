'use client'
import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ChipInput } from '@/components/ChipInput'
import { MediaUploader } from '@/components/MediaUploader'
import { Eye, EyeOff, Trash2, Star, Crop } from 'lucide-react'
import { ImageCropper } from '@/components/ImageCropper'
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal'
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
  const router = useRouter()
  const [model, setModel] = useState<any>(null)
  const [media, setMedia] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'media' | 'presenting'>('profile')
  const [cropTarget, setCropTarget] = useState<{url: string, storagePath: string, id: string} | null>(null)
  const [showDeleteModel, setShowDeleteModel] = useState(false)
  const [presentations, setPresentations] = useState<any[]>([])

  const loadModel = useCallback(async () => {
    const { data } = await supabase.from('models').select('*').eq('id', id).single()
    setModel(data)
  }, [id])

  const loadMedia = useCallback(async () => {
    const { data } = await supabase.from('model_media').select('*').eq('model_id', id).order('display_order')
    setMedia(data || [])
  }, [id])

  const loadPresentations = useCallback(async () => {
    const { data } = await supabase
      .from('presentation_models')
      .select('id, is_visible, admin_notes, presentation_id, presentations(id, name, is_published, projects(name))')
      .eq('model_id', id)
      .order('created_at', { ascending: false })
    setPresentations(data || [])
  }, [id])

  useEffect(() => { loadModel(); loadMedia(); loadPresentations() }, [loadModel, loadMedia, loadPresentations])

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

  const handleCropSave = async (blob: Blob, filename: string) => {
    if (!cropTarget) return
    const supabase = createClient()
    const ext = 'jpg'
    const path = cropTarget.storagePath.replace(/\.[^.]+$/, '') + '_cropped.' + ext
    await supabase.storage.from('model-media').upload(path, blob, { contentType: 'image/jpeg', upsert: true })
    const { data: { publicUrl } } = supabase.storage.from('model-media').getPublicUrl(path)
    await supabase.from('model_media').update({ public_url: publicUrl, storage_path: path }).eq('id', cropTarget.id)
    setCropTarget(null)
    loadMedia()
  }

  const togglePresVisibility = async (pmId: string, current: boolean) => {
    await supabase.from('presentation_models').update({ is_visible: !current }).eq('id', pmId)
    loadPresentations()
  }

  const savePresAdminNotes = async (pmId: string, notes: string) => {
    await supabase.from('presentation_models').update({ admin_notes: notes }).eq('id', pmId)
  }

  const deleteModel = async () => {
    await supabase.from('presentation_models').delete().eq('model_id', model.id)
    await supabase.from('project_models').delete().eq('model_id', model.id)
    await supabase.from('model_media').delete().eq('model_id', model.id)
    await supabase.from('models').delete().eq('id', model.id)
    router.push('/admin/models')
  }

  const markReviewed = async (val: boolean) => {
    await supabase.from('models').update({ reviewed: val }).eq('id', model.id)
    setModel((m: any) => ({ ...m, reviewed: val }))
  }

  const deleteMedia = async (mediaId: string, storagePath: string) => {
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
    <>
    {cropTarget && (
      <ImageCropper
        src={cropTarget.url}
        filename={cropTarget.storagePath.split('/').pop() || 'photo.jpg'}
        onDone={handleCropSave}
        onCancel={() => setCropTarget(null)}
      />
    )}
    <div>
      <div className="flex items-center justify-between mb-10">
        <div>
          <Link href="/admin/models" className="label hover:text-black">← Models</Link>
          <h1 className="text-2xl font-light tracking-widest uppercase mt-2">
            {model.first_name} {model.last_name}
          </h1>
          {model.agency && <p className="text-sm text-neutral-400">{model.agency}</p>}
        </div>
        <div className="flex items-center gap-3">
          {!model.reviewed ? (
            <button onClick={() => markReviewed(true)}
              className="flex items-center gap-1.5 text-xs bg-amber-500 text-white hover:bg-amber-600 transition-colors px-3 py-2 rounded-sm tracking-wider uppercase">
              ✓ Mark as Reviewed
            </button>
          ) : (
            <button onClick={() => markReviewed(false)}
              className="flex items-center gap-1.5 text-xs text-green-600 hover:text-neutral-500 transition-colors px-3 py-2 tracking-wider uppercase">
              ✓ Reviewed
            </button>
          )}
          <button onClick={() => setShowDeleteModel(true)} className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 transition-colors px-3 py-2">
            <Trash2 size={12} /> Delete Model
          </button>
          <Button onClick={saveModel} disabled={saving}>
            {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-neutral-200 mb-4">
        {(['profile', 'media'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`pb-3 text-xs tracking-widest uppercase transition-colors ${activeTab === tab ? 'border-b-2 border-black text-black' : 'text-neutral-400 hover:text-black'}`}>
            {tab} {tab === 'media' ? `(${media.length})` : ''}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="max-w-2xl space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-3">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Bust" value={model.bust || ''} onChange={e => setModel({ ...model, bust: e.target.value })} />
              <Input label="Waist" value={model.waist || ''} onChange={e => setModel({ ...model, waist: e.target.value })} />
              <Input label="Hips" value={model.hips || ''} onChange={e => setModel({ ...model, hips: e.target.value })} />
              <Input label="Dress Size" value={model.dress_size || ''} onChange={e => setModel({ ...model, dress_size: e.target.value })} />
            </div>
          )}

          {/* Male sizing */}
          {model.gender === 'male' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <Input label="TikTok Handle" value={(model as any).tiktok_handle || ''} onChange={e => setModel({ ...model, tiktok_handle: e.target.value.replace('@', '') } as any)} placeholder="handle (no @)" />
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

      {activeTab === 'presenting' && (
        <div className="space-y-6">
          <div>
            <p className="text-xs text-neutral-400 mb-6">Control which presentations this model appears in, and add notes visible to clients in each presentation.</p>
            {presentations.length === 0 && (
              <p className="text-sm text-neutral-400 py-4">This model hasn't been added to any presentations yet.</p>
            )}
            <div className="space-y-4">
              {presentations.map((pm: any) => {
                const pres = pm.presentations
                const project = pres?.projects
                return (
                  <div key={pm.id} className="border border-neutral-200 p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium">{pres?.name}</p>
                        <p className="text-xs text-neutral-400">{project?.name}</p>
                        <p className={`text-[10px] tracking-widest uppercase mt-1 ${pres?.is_published ? 'text-black' : 'text-neutral-400'}`}>
                          {pres?.is_published ? '● Published' : '○ Draft'}
                        </p>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-xs tracking-widest uppercase text-neutral-500">Show in presentation</span>
                        <div onClick={() => togglePresVisibility(pm.id, pm.is_visible)}
                          className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${pm.is_visible !== false ? 'bg-black' : 'bg-neutral-200'}`}>
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${pm.is_visible !== false ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </div>
                      </label>
                    </div>
                    <div>
                      <label className="label text-[10px] block mb-2">Notes for client (visible in this presentation)</label>
                      <textarea
                        defaultValue={pm.admin_notes || ''}
                        onBlur={e => savePresAdminNotes(pm.id, e.target.value)}
                        rows={3}
                        placeholder="Add notes that will appear on this model's slide for the client..."
                        className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none resize-none placeholder:text-neutral-300"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'media' && (
        <div>
          {/* Sectioned uploads */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-3 mb-4">
            <div>
              <p className="label mb-3">Photos</p>
              <MediaUploader modelId={id} onUploaded={loadMedia} mediaType="photo" />
            </div>
            <div>
              <p className="label mb-3">Video</p>
              <MediaUploader modelId={id} onUploaded={loadMedia} mediaType="video" />
            </div>
            <div>
              <p className="label mb-3">Digitals</p>
              <MediaUploader modelId={id} onUploaded={loadMedia} mediaType="digital" />
            </div>
          </div>

          {media.length > 0 && (
            <div className="mt-4 mb-2 flex gap-3 text-[10px] text-neutral-400 tracking-wider uppercase">
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
                  {/* Upload timestamp */}
                  {m.uploaded_at && (
                    <p className="text-[9px] text-neutral-400 tracking-wider text-center">
                      {new Date(m.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {' '}{new Date(m.uploaded_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </p>
                  )}
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
                    {m.type === 'photo' && (
                      <button onClick={() => setCropTarget({ id: m.id, url: m.public_url, storagePath: m.storage_path })}
                        className="px-2 py-1.5 border border-neutral-200 text-neutral-400 hover:border-black transition-colors" title="Crop photo">
                        <Crop size={10} />
                      </button>
                    )}
                    <button onClick={() => deleteMedia(m.id, m.storage_path)}
                      className="px-2 py-1.5 border border-neutral-200 text-neutral-300 hover:border-red-300 hover:text-red-400 transition-colors">
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!media.length && (
              <p className="col-span-4 text-sm text-neutral-400 py-4 text-center">No media yet. Upload above.</p>
            )}
          </div>
        </div>
      )}
    </div>
    </>
  )
}
