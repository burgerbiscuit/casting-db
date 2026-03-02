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
  presentationName: string
  projectName: string
}

export function PresentationViewer({
  presentationModels, mediaByModel, presentationId, clientId, shortlistMap, presentationName, projectName
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

  const sorted = [...presentationModels].sort((a, b) => {
    const aS = !!shortlists[a.model_id]
    const bS = !!shortlists[b.model_id]
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
          {shortlistedCount > 0 && (
            <div className="mb-8">
              <p className="label mb-4 flex items-center gap-2"><Heart size={10} className="fill-black text-black" /> Shortlisted</p>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {sorted.filter(pm => shortlists[pm.model_id]).map(pm => (
                  <ModelCard key={pm.id} presentationModel={pm} model={pm.models}
                    media={mediaByModel[pm.model_id] || []} presentationId={presentationId}
                    clientId={clientId} initialShortlisted={true}
                    initialNotes={shortlistMap[pm.model_id]?.notes || ''}
                    onShortlistChange={(v) => handleShortlistChange(pm.model_id, v)} />
                ))}
              </div>
              <div className="border-t border-neutral-100 mt-8 mb-6" />
            </div>
          )}
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {sorted.filter(pm => !shortlists[pm.model_id]).map(pm => (
              <ModelCard key={pm.id} presentationModel={pm} model={pm.models}
                media={mediaByModel[pm.model_id] || []} presentationId={presentationId}
                clientId={clientId} initialShortlisted={false}
                initialNotes={shortlistMap[pm.model_id]?.notes || ''}
                onShortlistChange={(v) => handleShortlistChange(pm.model_id, v)} />
            ))}
          </div>
        </div>
      )}

      {view === 'slides' && current && currentModel && (
        <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} className="fixed inset-0 bg-white z-40 flex flex-col overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-100 flex-shrink-0">
            <img src="/logo.jpg" alt="" className="h-5 w-auto" />
            <p className="label">{slideIndex + 1} / {sorted.length}</p>
            <button onClick={() => setView('grid')} className="text-xs tracking-widest uppercase hover:opacity-60 transition-opacity">✕ Exit Slides</button>
          </div>

          {/* Info row: ONE LINE */}
          <div className="flex-shrink-0 px-6 py-2 border-b border-neutral-100 flex items-center overflow-hidden">
            <span className="text-sm font-medium tracking-wider uppercase whitespace-nowrap">
              {currentModel.first_name} {currentModel.last_name}
            </span>
            {getSizingParts(current, currentModel).map((part, i) => (
              <span key={i} className="text-sm text-neutral-500 whitespace-nowrap">
                <span className="mx-2 text-neutral-300">·</span>{part}
              </span>
            ))}
            <div className="ml-auto flex-shrink-0 pl-4">
              <SlideActions presentationId={presentationId} modelId={current.model_id} clientId={clientId}
                initialShortlisted={!!shortlists[current.model_id]} initialNotes={shortlistMap[current.model_id]?.notes || ""}
                onShortlistChange={(v) => handleShortlistChange(current.model_id, v)} compact={true} model={currentModel} projectName={projectName} />
            </div>
          </div>

          {/* Main content */}
          <div className="flex flex-1 min-h-0 overflow-hidden">

            {/* LEFT: admin private notes, always visible, full height */}
            <div className="w-[280px] flex-shrink-0 border-r border-neutral-100 px-5 py-4 overflow-y-auto">
              <p className="label mb-2 text-xs">Private Notes</p>
              {current.notes
                ? <p className="text-sm text-neutral-600 leading-relaxed">{current.notes}</p>
                : <p className="text-sm text-neutral-300 italic">Private notes</p>}
              {current.location && (
                <div className="mt-4 pt-3 border-t border-neutral-100">
                  <span className="label block text-xs">Location</span>
                  <p className="text-sm">{current.location}</p>
                </div>
              )}
              {current.rate && (
                <div className="mt-2">
                  <span className="label block text-xs">Rate</span>
                  <p className="text-sm">{current.rate}</p>
                </div>
              )}
            </div>

            {/* CENTER: photos flushed left, 3:4 */}
            <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
              <div className="flex flex-1 min-h-0 gap-2 p-4 justify-start items-stretch overflow-hidden">
                {currentMedia.length === 0 && (
                  <div className="bg-neutral-100 flex items-center justify-center text-neutral-300 text-xs flex-shrink-0" style={{aspectRatio:'3/4', height:'100%'}}>No photos</div>
                )}
                {photoMedia.slice(0, 2).map((m: any) => (
                  <div key={m.id} className="bg-neutral-100 overflow-hidden flex-shrink-0" style={{aspectRatio:'3/4', height:'100%', maxHeight:'100%'}}>
                    <img src={m.public_url} alt="" className="w-full h-full object-cover object-top" />
                  </div>
                ))}
              </div>
              {(videoMedia.length > 0 || digitalMedia.length > 0) && (
                <div className="flex gap-2 px-4 pb-3 flex-shrink-0">
                  {videoMedia.map((m: any) => (
                    <button key={m.id} onClick={() => setMediaModal({ url: m.public_url, type: 'video' })}
                      className="text-xs px-3 py-1.5 border border-neutral-300 hover:border-black transition-colors tracking-wider">
                      ▶ Video
                    </button>
                  ))}
                  {digitalMedia.length > 0 && (
                    <button onClick={() => setMediaModal({ url: digitalMedia[0].public_url, type: 'digital' })}
                      className="text-xs px-3 py-1.5 border border-neutral-300 hover:border-black transition-colors tracking-wider">
                      📷 Digitals
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT: client notes */}
            <div className="w-[200px] flex-shrink-0 border-l border-neutral-100 px-4 py-4 flex flex-col">
              <p className="label mb-2 text-xs">Your Notes</p>
              <textarea
                value={clientNotes[current.model_id] || ''}
                onChange={e => handleClientNotesChange(current.model_id, e.target.value)}
                placeholder="Add your notes..."
                className="flex-1 w-full text-sm bg-transparent resize-none focus:outline-none placeholder:text-neutral-300 leading-relaxed"
              />
              <p className="text-xs text-neutral-400 mt-2">— Client</p>
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

function SlideActions({ presentationId, modelId, clientId, initialShortlisted, initialNotes, onShortlistChange, compact, model, projectName }: {
  presentationId: string, modelId: string, clientId: string, initialShortlisted: boolean, initialNotes: string, onShortlistChange?: (v: boolean) => void, compact?: boolean, model?: any, projectName?: string
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
    await supabase.from('client_shortlists').upsert({ presentation_id: presentationId, model_id: modelId, client_id: clientId, notes: val })
  }

  const emailAgent = async () => {
    if (!model?.agency) return
    const firstName = model.first_name || ''
    const lastName = model.last_name || ''
    const proj = projectName || 'this project'
    const subject = encodeURIComponent(`Shortlist Notification - ${proj}`)
    const body = encodeURIComponent(`Hi, we wanted to let you know that ${firstName} ${lastName} has been shortlisted for ${proj}. Please get in touch to discuss next steps.`)

    try {
      const res = await fetch(`/api/agency-email?name=${encodeURIComponent(model.agency)}`)
      const data = await res.json()
      if (data.email) {
        window.location.href = `mailto:${data.email}?subject=${subject}&body=${body}`
      } else {
        showToast('No agency email on file')
        window.location.href = `mailto:?subject=${subject}&body=${body}`
      }
    } catch {
      showToast('No agency email on file')
      window.location.href = `mailto:?subject=${subject}&body=${body}`
    }
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
      {shortlisted && model?.agency && (
        <button onClick={emailAgent}
          className="flex items-center gap-1 px-3 py-2 text-xs tracking-widest uppercase border border-neutral-300 hover:border-black transition-colors">
          ✉ Email Agent
        </button>
      )}
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
      {shortlisted && model?.agency && (
        <button onClick={emailAgent}
          className="w-full py-2 text-xs tracking-widest uppercase border border-neutral-200 hover:border-black transition-colors flex items-center justify-center gap-2">
          ✉ Email Agent
        </button>
      )}
      <textarea value={notes} onChange={e => saveNotes(e.target.value)} placeholder="Your notes..."
        rows={2} className="w-full text-sm border-b border-neutral-200 bg-transparent py-2 focus:outline-none focus:border-black resize-none placeholder:text-neutral-300" />
    </div>
  )
}
