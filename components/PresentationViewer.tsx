'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { ModelCard } from '@/components/ModelCard'
import { LayoutGrid, ChevronLeft, ChevronRight, Heart, X } from 'lucide-react'

interface Props {
  presentationModels: any[]
  mediaByModel: Record<string, any[]>
  presentationId: string
  clientId: string
  shortlistMap: Record<string, any>
  confirmMap: Record<string, boolean>
  clientFirstName: string
  presentationName: string
  projectName: string
  projectSpecs: string
}

export function PresentationViewer({
  presentationModels, mediaByModel, presentationId, clientId, shortlistMap, confirmMap: initialConfirmMap, clientFirstName, presentationName, projectName, projectSpecs
}: Props) {
  const [view, setView] = useState<'grid' | 'slides'>('grid')
  const [slideIndex, setSlideIndex] = useState(0)
  const [followerCounts, setFollowerCounts] = useState<Record<string, string>>({})
  const [clientNotes, setClientNotes] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {}
    presentationModels.forEach(pm => { if (pm.client_notes) m[pm.model_id] = pm.client_notes })
    return m
  })
  const [mediaModal, setMediaModal] = useState<{ url: string; type: string } | null>(null)
  const clientNoteDebounce = useRef<any>(null)

  useEffect(() => {
    if (view === 'slides') {
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [view])

  const [shortlists, setShortlists] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {}
    Object.keys(shortlistMap).forEach(k => { m[k] = true })
    return m
  })
  const [confirms, setConfirms] = useState<Record<string, boolean>>(initialConfirmMap || {})
  const [confirmModal, setConfirmModal] = useState<{ modelId: string; modelName: string } | null>(null)

  const [search, setSearch] = useState('')
  const [filterHeight, setFilterHeight] = useState('')
  const [filterGender, setFilterGender] = useState('')

  // All unique heights and genders for filter dropdowns
  const allHeights = [...new Set(presentationModels.map(pm => {
    const m = pm.models
    return m?.height_ft ? `${m.height_ft}'${m.height_in || 0}"` : null
  }).filter(Boolean))].sort()

  const allGenders = [...new Set(presentationModels.map(pm => pm.models?.gender).filter(Boolean))].sort()

  const filtered = presentationModels.filter(pm => {
    const m = pm.models
    if (!m) return true
    const fullName = `${m.first_name} ${m.last_name}`.toLowerCase()
    const skills = (m.skills || []).join(' ').toLowerCase()
    const hobbies = (m.hobbies || []).join(' ').toLowerCase()
    const agency = (m.agency || '').toLowerCase()
    const q = search.toLowerCase()
    const heightStr = m.height_ft ? `${m.height_ft}'${m.height_in || 0}"` : ''

    if (search && !fullName.includes(q) && !skills.includes(q) && !hobbies.includes(q) && !agency.includes(q)) return false
    if (filterHeight && heightStr !== filterHeight) return false
    if (filterGender && m.gender !== filterGender) return false
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    const aC = !!confirms[a.model_id]
    const bC = !!confirms[b.model_id]
    const aS = !!shortlists[a.model_id]
    const bS = !!shortlists[b.model_id]
    if (aC && !bC) return -1
    if (!aC && bC) return 1
    if (aS && !bS) return -1
    if (!aS && bS) return 1
    return 0
  })

  useEffect(() => {
    const model = sorted[slideIndex]?.models
    if (!model?.instagram_handle) return
    const handle = model.instagram_handle
    if (followerCounts[handle]) return
    fetch('/api/instagram/' + handle)
      .then(r => r.json())
      .then(d => {
        if (d.follower_count) {
          const n = d.follower_count
          const fmt = n >= 1_000_000 ? (n/1_000_000).toFixed(1)+'M' : n >= 1_000 ? (n/1_000).toFixed(1)+'K' : String(n)
          setFollowerCounts(prev => ({ ...prev, [handle]: fmt }))
        }
      }).catch(() => {})
  }, [slideIndex, sorted])

  const current = sorted[slideIndex]
  const currentModel = current?.models
  const currentMedia = (mediaByModel[current?.model_id] || []).filter((m: any) => m.is_visible)
  const photoMedia = currentMedia.filter((m: any) => m.type !== 'video' && m.type !== 'digital')
  const videoMedia = currentMedia.filter((m: any) => m.type === 'video')
  const digitalMedia = currentMedia.filter((m: any) => m.type === 'digital')

  const prev = () => setSlideIndex(i => Math.max(0, i - 1))
  const next = () => setSlideIndex(i => Math.min(sorted.length - 1, i + 1))

  const touchStartX = useRef<number | null>(null)
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (dx < -50) next()
    else if (dx > 50) prev()
    touchStartX.current = null
  }

  const handleShortlistChange = useCallback((modelId: string, val: boolean) => {
    setShortlists(prev => ({ ...prev, [modelId]: val }))
  }, [])

  const saveClientNotes = async (modelId: string, notes: string) => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.from('presentation_models')
      .update({ client_notes: notes, client_notes_author: clientId || 'Client' })
      .eq('presentation_id', presentationId)
      .eq('model_id', modelId)
  }

  const handleClientNotesChange = (modelId: string, val: string) => {
    setClientNotes(prev => ({ ...prev, [modelId]: val }))
    clearTimeout(clientNoteDebounce.current)
    clientNoteDebounce.current = setTimeout(() => saveClientNotes(modelId, val), 800)
  }

  const handleConfirm = async (modelId: string) => {
    const supabase = (await import('@/lib/supabase/client')).createClient()
    const next = !confirms[modelId]
    setConfirms(prev => ({ ...prev, [modelId]: next }))
    if (next) {
      setShortlists(prev => ({ ...prev, [modelId]: true }))
      await supabase.from('client_shortlists').upsert(
        { presentation_id: presentationId, model_id: modelId, client_id: clientId, status: 'confirmed' },
        { onConflict: 'presentation_id,model_id,client_id' }
      )
    } else {
      await supabase.from('client_shortlists').update({ status: 'shortlisted' })
        .eq('presentation_id', presentationId).eq('model_id', modelId).eq('client_id', clientId)
    }
  }

  const confirmedCount = Object.values(confirms).filter(Boolean).length
  const shortlistedCount = Object.values(shortlists).filter(Boolean).length

  const getSizingParts = (pm: any, model: any): string[] => {
    const parts: string[] = []
    if (model?.agency) parts.push(model.agency)
    if (pm?.show_sizing) {
      if (model?.height_ft) parts.push(`${model.height_ft}'${model.height_in}"`)
      if (model?.bust) parts.push(`Bust ${model.bust}`)
      if (model?.waist) parts.push(`Waist ${model.waist}`)
      if (model?.hips) parts.push(`Hips ${model.hips}`)
      if (model?.chest) parts.push(`Chest ${model.chest}`)
      if (model?.suit_size) parts.push(`Suit ${model.suit_size}`)
      if (model?.shoe_size) parts.push(`Shoe US ${model.shoe_size}`)
      if (model?.dress_size) parts.push(`Dress ${model.dress_size}`)
    }
    if (pm?.show_instagram && model?.instagram_handle) parts.push(`@${model.instagram_handle}`)
    return parts
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => setView('grid')}
          className={`flex items-center gap-2 px-4 py-2 text-xs tracking-widest uppercase border transition-colors ${view === 'grid' ? 'bg-black text-white border-black' : 'border-neutral-300 text-neutral-500 hover:border-black'}`}>
          <LayoutGrid size={12} /> Grid
        </button>
        <button onClick={() => { setView('slides'); setSlideIndex(0) }}
          className={`flex items-center gap-2 px-4 py-2 text-xs tracking-widest uppercase border transition-colors ${view === 'slides' ? 'bg-black text-white border-black' : 'border-neutral-300 text-neutral-500 hover:border-black'}`}>
          <span className="text-[10px]">▶</span> Slides
        </button>
        {shortlistedCount > 0 && (
          <span className="ml-auto flex items-center gap-1 text-xs tracking-widest uppercase text-neutral-500">
            <Heart size={12} className="fill-black text-black" /> {shortlistedCount} shortlisted
          </span>
        )}
      </div>

      {view === 'grid' && (
        <div>
          {/* Search & filter bar */}
          <div className="flex gap-3 mb-6 flex-wrap items-end">
            <div className="relative flex-1 min-w-[180px]">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search name, agency, skill, hobby..."
                className="w-full border-b border-neutral-300 py-2 text-sm focus:outline-none focus:border-black placeholder:text-neutral-300 bg-transparent pr-6"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-0 top-2 text-neutral-300 hover:text-black">
                  <X size={14} />
                </button>
              )}
            </div>
            <select value={filterHeight} onChange={e => setFilterHeight(e.target.value)}
              className="text-xs border-b border-neutral-300 py-2 focus:outline-none focus:border-black bg-transparent pr-4">
              <option value="">All Heights</option>
              {allHeights.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <select value={filterGender} onChange={e => setFilterGender(e.target.value)}
              className="text-xs border-b border-neutral-300 py-2 focus:outline-none focus:border-black bg-transparent pr-4">
              <option value="">All Genders</option>
              {allGenders.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            {(search || filterHeight || filterGender) && (
              <button onClick={() => { setSearch(''); setFilterHeight(''); setFilterGender('') }}
                className="text-xs tracking-widest uppercase text-neutral-400 hover:text-black">
                Clear
              </button>
            )}
            <span className="text-xs text-neutral-400">{filtered.length} shown</span>
          </div>

          {shortlistedCount > 0 && (
            <div className="mb-8">
              <p className="label mb-4 flex items-center gap-2"><Heart size={10} className="fill-black text-black" /> Shortlisted</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {sorted.filter(pm => shortlists[pm.model_id]).map(pm => (
                  <div key={pm.id} className="relative">
                    {confirms[pm.model_id] && (
                      <div className="absolute top-2 left-2 z-10 bg-black text-white text-[9px] tracking-widest uppercase px-2 py-1">Confirmed</div>
                    )}
                    <ModelCard presentationModel={pm} model={pm.models}
                      media={mediaByModel[pm.model_id] || []} presentationId={presentationId}
                      clientId={clientId} initialShortlisted={true}
                      initialNotes={shortlistMap[pm.model_id]?.notes || ''}
                      onShortlistChange={(v) => handleShortlistChange(pm.model_id, v)}
                      onCardClick={() => { setSlideIndex(sorted.findIndex(s => s.model_id === pm.model_id)); setView('slides') }} />
                    <button
                      onClick={() => {
                        if (confirms[pm.model_id]) { handleConfirm(pm.model_id) }
                        else setConfirmModal({ modelId: pm.model_id, modelName: `${pm.models?.first_name} ${pm.models?.last_name}` })
                      }}
                      className={`w-full mt-1 py-1.5 text-[9px] tracking-widest uppercase transition-colors border ${confirms[pm.model_id] ? 'bg-black text-white border-black hover:opacity-70' : 'border-neutral-200 hover:border-black text-neutral-400 hover:text-black'}`}>
                      {confirms[pm.model_id] ? '✓ Confirmed' : 'Confirm Talent'}
                    </button>
                  </div>
                ))}
              </div>
              <div className="border-t border-neutral-100 mt-8 mb-6" />
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {sorted.filter(pm => !shortlists[pm.model_id]).map(pm => (
              <div key={pm.id} className="relative">
                {confirms[pm.model_id] && (
                  <div className="absolute top-2 left-2 z-10 bg-black text-white text-[9px] tracking-widest uppercase px-2 py-1">Confirmed</div>
                )}
                <ModelCard presentationModel={pm} model={pm.models}
                  media={mediaByModel[pm.model_id] || []} presentationId={presentationId}
                  clientId={clientId} initialShortlisted={false}
                  initialNotes={shortlistMap[pm.model_id]?.notes || ''}
                  onShortlistChange={(v) => handleShortlistChange(pm.model_id, v)}
                  onCardClick={() => { setSlideIndex(sorted.findIndex(s => s.model_id === pm.model_id)); setView('slides') }} />
                <button
                  onClick={() => {
                    if (confirms[pm.model_id]) { handleConfirm(pm.model_id) }
                    else setConfirmModal({ modelId: pm.model_id, modelName: `${pm.models?.first_name} ${pm.models?.last_name}` })
                  }}
                  className={`w-full mt-1 py-1.5 text-[9px] tracking-widest uppercase transition-colors border ${confirms[pm.model_id] ? 'bg-black text-white border-black hover:opacity-70' : 'border-neutral-200 hover:border-black text-neutral-400 hover:text-black'}`}>
                  {confirms[pm.model_id] ? '✓ Confirmed' : 'Confirm Talent'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'slides' && current && currentModel && (
        <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} className="fixed inset-0 bg-white z-40 flex flex-col overflow-hidden">

          {/* Centered header: brand → name → sizing */}
          <div className="flex-shrink-0 text-center pt-4 pb-3 px-6 relative border-b border-neutral-100">
            <img src="/logo.jpg" alt="" className="h-4 w-auto mx-auto mb-2 opacity-60" />
            <h2 className="text-2xl md:text-3xl font-light tracking-[0.15em] uppercase leading-tight">
              {currentModel.first_name} {currentModel.last_name}
            </h2>
            <p className="text-xs text-neutral-500 mt-1 tracking-wider">
              {getSizingParts(current, currentModel).join('  ·  ')}
            </p>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
              <button
                onClick={() => {
                  if (confirms[current.model_id]) { handleConfirm(current.model_id) }
                  else setConfirmModal({ modelId: current.model_id, modelName: `${currentModel?.first_name} ${currentModel?.last_name}` })
                }}
                className={`text-[9px] tracking-widest uppercase border px-3 py-1.5 transition-colors ${confirms[current.model_id] ? 'bg-black text-white border-black hover:opacity-70' : 'border-neutral-300 hover:border-black text-neutral-500 hover:text-black'}`}>
                {confirms[current.model_id] ? '✓ Confirmed' : 'Confirm Talent'}
              </button>
              <SlideActions presentationId={presentationId} modelId={current.model_id} clientId={clientId}
                initialShortlisted={!!shortlists[current.model_id]} initialNotes={shortlistMap[current.model_id]?.notes || ""} initialAuthor={shortlistMap[current.model_id]?.author_name || ''}
                onShortlistChange={(v) => handleShortlistChange(current.model_id, v)} compact={true} model={currentModel} projectName={projectName} clientFirstName={clientFirstName} />
              <button onClick={() => setView('grid')} className="text-xs tracking-widest uppercase text-neutral-400 hover:text-black transition-colors">✕</button>
            </div>
          </div>

          {/* Body: photos left + right panel */}
          <div className="flex flex-1 min-h-0 overflow-hidden">

            {/* Photos flush left */}
            <div className="flex flex-1 min-w-0 gap-2 pt-4 pb-0 pl-0 pr-0 overflow-hidden">
              {currentMedia.length === 0 && (
                <div className="bg-neutral-100 flex items-center justify-center text-neutral-300 text-xs flex-1">No photos</div>
              )}
              {photoMedia.slice(0, 2).map((m: any, i: number) => (
                <div key={m.id} className="bg-neutral-100 overflow-hidden flex-1" style={{maxWidth:'calc(50% - 4px)'}}>
                  {m.type === 'video'
                    ? <video src={m.public_url} className="w-full h-full object-cover" controls />
                    : <img src={m.public_url} alt="" className="w-full h-full object-cover object-top" />}
                </div>
              ))}
            </div>

            {/* Right panel: always visible */}
            <div className="w-48 xl:w-56 flex-shrink-0 flex flex-col px-5 py-5 justify-between">
              <div className="space-y-4 text-center">
                {current.admin_notes && (
                  <p className="text-xs text-neutral-600 italic leading-relaxed">{current.admin_notes}</p>
                )}
                {current.rate && (
                  <p className="text-base font-medium tracking-wider">{current.rate}</p>
                )}
                {current.location && (
                  <p className="text-sm text-neutral-500 tracking-wider">{current.location}</p>
                )}
              </div>

              {/* Client notes + links at bottom */}
              <div className="space-y-3">
                <textarea
                  value={clientNotes[current.model_id] || ''}
                  onChange={e => handleClientNotesChange(current.model_id, e.target.value)}
                  placeholder="Your notes..."
                  rows={3}
                  className="w-full text-sm bg-transparent resize-none focus:outline-none placeholder:text-neutral-300 leading-relaxed border-b border-neutral-200 pb-2"
                />
                <div className="space-y-1.5">
                  {current.show_portfolio && currentModel.portfolio_url && (
                    <a href={currentModel.portfolio_url.startsWith('http') ? currentModel.portfolio_url : 'https://' + currentModel.portfolio_url}
                      target="_blank" rel="noopener noreferrer"
                      className="block text-xs tracking-widest uppercase underline underline-offset-2 hover:opacity-60 transition-opacity">
                      Portfolio ↗
                    </a>
                  )}
                  {current.show_instagram && currentModel.instagram_handle && (
                    <a href={"https://instagram.com/" + currentModel.instagram_handle}
                      target="_blank" rel="noopener noreferrer"
                      className="block text-xs tracking-widest uppercase underline underline-offset-2 hover:opacity-60 transition-opacity">
                      Instagram ↗
                    </a>
                  )}
                  {videoMedia.length > 0 && (
                    <button onClick={() => setMediaModal({ url: videoMedia[0].public_url, type: 'video' })}
                      className="block text-xs tracking-widest uppercase underline underline-offset-2 hover:opacity-60 transition-opacity">
                      ▶ Video
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Prev / Next bottom bar */}
          <div className="flex items-center justify-between px-8 py-3 border-t border-neutral-100 flex-shrink-0">
            <button onClick={prev} disabled={slideIndex === 0}
              className="flex items-center gap-2 text-xs tracking-widest uppercase disabled:opacity-20 hover:opacity-60 transition-opacity">
              <ChevronLeft size={14} /> Prev
            </button>
            <span className="text-xs text-neutral-400">{slideIndex + 1} / {sorted.length}</span>
            <button onClick={next} disabled={slideIndex === sorted.length - 1}
              className="flex items-center gap-2 text-xs tracking-widest uppercase disabled:opacity-20 hover:opacity-60 transition-opacity">
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {mediaModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8">
          <button onClick={() => setMediaModal(null)} className="absolute top-4 right-4 text-white hover:opacity-60">
            <X size={24} />
          </button>
          {mediaModal.type === 'video'
            ? <video src={mediaModal.url} controls autoPlay className="max-w-full max-h-full" />
            : <img src={mediaModal.url} alt="" className="max-w-full max-h-full object-contain" />}
        </div>
      )}
    </div>
  )
}

function SlideActions({ presentationId, modelId, clientId, initialShortlisted, initialNotes, initialAuthor, onShortlistChange, compact, model, projectName, clientFirstName }: {
  presentationId: string, modelId: string, clientId: string, initialShortlisted: boolean, initialNotes: string, initialAuthor?: string, onShortlistChange?: (v: boolean) => void, compact?: boolean, model?: any, projectName?: string, clientFirstName?: string
}) {
  const [shortlisted, setShortlisted] = useState(initialShortlisted)
  const [notes, setNotes] = useState(initialNotes)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const toggle = async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const next = !shortlisted
    setShortlisted(next)
    onShortlistChange?.(next)
    if (next) {
      await supabase.from('client_shortlists').upsert({ presentation_id: presentationId, model_id: modelId, client_id: clientId, notes })
    } else {
      await supabase.from('client_shortlists').delete().eq('presentation_id', presentationId).eq('model_id', modelId).eq('client_id', clientId)
    }
  }

  const saveNotes = async (val: string) => {
    setNotes(val)
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.from('client_shortlists').upsert(
      { presentation_id: presentationId, model_id: modelId, client_id: clientId, notes: val, author_name: clientFirstName || null },
      { onConflict: 'presentation_id,model_id,client_id' }
    )
  }


  if (compact) return (
    <div className="flex items-center gap-2 relative">
      {toast && (
        <div className="absolute -top-8 right-0 bg-black text-white text-[10px] px-2 py-1 whitespace-nowrap tracking-wider">{toast}</div>
      )}
      <button onClick={toggle}
        className={[`flex items-center gap-1.5 px-3 py-2 text-xs tracking-widest uppercase border transition-colors`, shortlisted ? 'bg-black text-white border-black' : 'border-neutral-300 hover:border-black'].join(' ')}>
        <Heart size={11} className={shortlisted ? 'fill-white text-white' : ''} />
        {shortlisted ? 'Shortlisted' : 'Shortlist'}
      </button>
    </div>
  )

  return (
    <div className="space-y-3 relative">
      {toast && (
        <div className="absolute -top-8 left-0 right-0 bg-black text-white text-[10px] px-2 py-1 text-center tracking-wider">{toast}</div>
      )}
      <button onClick={toggle}
        className={[`w-full py-3 text-xs tracking-widest uppercase border transition-colors flex items-center justify-center gap-2`, shortlisted ? 'bg-black text-white border-black' : 'border-neutral-300 hover:border-black'].join(' ')}>
        <Heart size={12} className={shortlisted ? 'fill-white text-white' : ''} />
        {shortlisted ? 'Shortlisted' : 'Add to Shortlist'}
      </button>
      {notes && initialAuthor && (
        <p className="text-[10px] text-neutral-400 tracking-wider">{initialAuthor}</p>
      )}
      <textarea value={notes} onChange={e => saveNotes(e.target.value)} placeholder="Your notes..." 
        rows={2} className="w-full text-sm border-b border-neutral-200 bg-transparent py-2 focus:outline-none focus:border-black resize-none placeholder:text-neutral-300" />
    </div>
  )
}
