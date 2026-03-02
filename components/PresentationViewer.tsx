'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { ModelCard } from '@/components/ModelCard'
import { LayoutGrid, ChevronLeft, ChevronRight, Heart } from 'lucide-react'

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

  // Lock body scroll when in slides mode
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

  // Sort: shortlisted first, then rest
  const sorted = [...presentationModels].sort((a, b) => {
    const aS = !!shortlists[a.model_id]
    const bS = !!shortlists[b.model_id]
    if (aS && !bS) return -1
    if (!aS && bS) return 1
    return 0
  })

  // Fetch IG followers for current slide
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

  const prev = () => setSlideIndex(i => Math.max(0, i - 1))
  const next = () => setSlideIndex(i => Math.min(sorted.length - 1, i + 1))

  // Touch swipe
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

  const shortlistedCount = Object.values(shortlists).filter(Boolean).length

  return (
    <div>
      {/* View toggle */}
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

      {/* Grid view */}
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

      {/* Slides view */}
      {view === 'slides' && current && currentModel && (
        <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} className="fixed inset-0 bg-white z-40 flex flex-col overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-100 flex-shrink-0">
            <img src="/logo.jpg" alt="" className="h-5 w-auto" />
            <p className="label">{slideIndex + 1} / {sorted.length}</p>
            <button onClick={() => setView('grid')} className="text-xs tracking-widest uppercase hover:opacity-60 transition-opacity">✕ Exit Slides</button>
          </div>

          {/* Main: left info panel + right photos */}
          <div className="flex flex-1 min-h-0 overflow-hidden">

            {/* LEFT: info + notes */}
            <div className="flex flex-col justify-between w-64 xl:w-72 flex-shrink-0 border-r border-neutral-100 px-6 py-5 overflow-y-auto">
              <div>
                <h2 className="text-xl font-light tracking-widest uppercase mb-1">
                  {currentModel.first_name}<br />{currentModel.last_name}
                </h2>
                {currentModel.agency && <p className="text-xs text-neutral-400 mb-4">{currentModel.agency}</p>}

                {current.show_sizing && (
                  <div className="space-y-2 mb-4">
                    {currentModel.height_ft && <div><span className="label block">Height</span>{currentModel.height_ft}&apos;{currentModel.height_in}&quot;</div>}
                    {currentModel.bust && <div><span className="label block">Bust</span>{currentModel.bust}</div>}
                    {currentModel.waist && <div><span className="label block">Waist</span>{currentModel.waist}</div>}
                    {currentModel.hips && <div><span className="label block">Hips</span>{currentModel.hips}</div>}
                    {currentModel.chest && <div><span className="label block">Chest</span>{currentModel.chest}</div>}
                    {currentModel.suit_size && <div><span className="label block">Suit</span>{currentModel.suit_size}</div>}
                    {currentModel.shoe_size && <div><span className="label block">Shoe (US)</span>US {currentModel.shoe_size}</div>}
                    {currentModel.dress_size && <div><span className="label block">Dress</span>{currentModel.dress_size}</div>}
                  </div>
                )}
                {current.show_instagram && currentModel.instagram_handle && (
                  <div className="mb-2">
                    <span className="label block">Instagram</span>
                    <a href={"https://instagram.com/" + currentModel.instagram_handle} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline">@{currentModel.instagram_handle}</a>
                  </div>
                )}
                {current.show_portfolio && currentModel.portfolio_url && (
                  <div className="mb-2">
                    <span className="label block">Portfolio</span>
                    <a href={currentModel.portfolio_url.startsWith("http") ? currentModel.portfolio_url : "https://" + currentModel.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline">View ↗</a>
                  </div>
                )}

                {/* Client notes (location, rate, notes) */}
                {(current.location || current.rate || current.client_notes) && (
                  <div className="mt-4 pt-4 border-t border-neutral-100 space-y-2">
                    {current.location && <div><span className="label block">Location</span><p className="text-sm">{current.location}</p></div>}
                    {current.rate && <div><span className="label block">Rate</span><p className="text-sm">{current.rate}</p></div>}
                    {current.client_notes && <div><span className="label block">Notes</span><p className="text-sm text-neutral-600 leading-relaxed">{current.client_notes}</p></div>}
                  </div>
                )}
              </div>

              {/* Shortlist + nav at bottom */}
              <div className="mt-4 pt-4 border-t border-neutral-100">
                <SlideActions presentationId={presentationId} modelId={current.model_id} clientId={clientId}
                  initialShortlisted={!!shortlists[current.model_id]} initialNotes={shortlistMap[current.model_id]?.notes || ""}
                  onShortlistChange={(v) => handleShortlistChange(current.model_id, v)} compact={true} />
                <div className="flex items-center justify-between mt-4">
                  <button onClick={prev} disabled={slideIndex === 0}
                    className="flex items-center gap-1 text-xs tracking-widest uppercase disabled:opacity-20 hover:opacity-60 transition-opacity">
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <button onClick={next} disabled={slideIndex === sorted.length - 1}
                    className="flex items-center gap-1 text-xs tracking-widest uppercase disabled:opacity-20 hover:opacity-60 transition-opacity">
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT: 3:4 photos */}
            <div className="flex-1 min-w-0 flex gap-3 p-4">
              {currentMedia.length === 0 && (
                <div className="flex-1 bg-neutral-100 flex items-center justify-center text-neutral-300 text-xs">No photos</div>
              )}
              {currentMedia.slice(0, 2).map((m: any) => (
                <div key={m.id} className="flex-1 min-w-0 relative" style={{aspectRatio: '3/4', maxWidth: 'calc(50% - 6px)'}}>
                  <div className="absolute inset-0">
                    {m.type === "video"
                      ? <video src={m.public_url} className="w-full h-full object-cover" controls />
                      : <img src={m.public_url} alt="" className="w-full h-full object-cover object-top" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Thumbnail strip */}
          <div className="flex items-center justify-center gap-1.5 py-2 border-t border-neutral-100 flex-shrink-0 overflow-x-auto px-4">
            {sorted.map((pm, i) => {
              const thumb = (mediaByModel[pm.model_id] || []).find((m: any) => m.is_visible && m.type === "photo")
              const active = i === slideIndex
              return (
                <button key={pm.id} onClick={() => setSlideIndex(i)}
                  className={["relative flex-shrink-0 w-9 h-9 overflow-hidden border-2 transition-colors", active ? "border-black" : "border-transparent opacity-40 hover:opacity-70"].join(" ")}>
                  {thumb
                    ? <img src={thumb.public_url} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-neutral-100 flex items-center justify-center text-[8px] text-neutral-400">{pm.models?.first_name?.[0]}</div>}
                  {shortlists[pm.model_id] && <div className="absolute top-0 right-0 w-2 h-2 bg-black rounded-full" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function SlideActions({ presentationId, modelId, clientId, initialShortlisted, initialNotes, onShortlistChange, compact }: {
  presentationId: string, modelId: string, clientId: string, initialShortlisted: boolean, initialNotes: string, onShortlistChange?: (v: boolean) => void, compact?: boolean
}) {
  const [shortlisted, setShortlisted] = useState(initialShortlisted)
  const [notes, setNotes] = useState(initialNotes)

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

  if (compact) return (
    <button onClick={toggle}
      className={[`flex items-center gap-1.5 px-3 py-2 text-xs tracking-widest uppercase border transition-colors`, shortlisted ? 'bg-black text-white border-black' : 'border-neutral-300 hover:border-black'].join(' ')}>
      <Heart size={11} className={shortlisted ? 'fill-white text-white' : ''} />
      {shortlisted ? 'Shortlisted' : 'Shortlist'}
    </button>
  )

  return (
    <div className="space-y-3">
      <button onClick={toggle}
        className={[`w-full py-3 text-xs tracking-widest uppercase border transition-colors flex items-center justify-center gap-2`, shortlisted ? 'bg-black text-white border-black' : 'border-neutral-300 hover:border-black'].join(' ')}>
        <Heart size={12} className={shortlisted ? 'fill-white text-white' : ''} />
        {shortlisted ? 'Shortlisted' : 'Add to Shortlist'}
      </button>
      <textarea value={notes} onChange={e => saveNotes(e.target.value)} placeholder="Your notes..."
        rows={2} className="w-full text-sm border-b border-neutral-200 bg-transparent py-2 focus:outline-none focus:border-black resize-none placeholder:text-neutral-300" />
    </div>
  )
}
