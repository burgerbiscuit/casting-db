'use client'
import { useState, useRef, useCallback } from 'react'
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
        <div className="flex flex-col items-center" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          {/* Progress + shortlist indicator */}
          <div className="flex items-center justify-between w-full max-w-2xl mb-4">
            <p className="label">{slideIndex + 1} / {sorted.length}</p>
            {shortlists[current.model_id] && (
              <span className="flex items-center gap-1 text-xs tracking-widest uppercase">
                <Heart size={10} className="fill-black text-black" /> Shortlisted
              </span>
            )}
          </div>

          <div className="w-full max-w-2xl">
            {/* Name */}
            <h2 className="text-2xl md:text-3xl font-light tracking-widest uppercase mb-3">
              {currentModel.first_name} {currentModel.last_name}
            </h2>

            {/* Sizing row */}
            {current.show_sizing && (
              <div className="flex flex-wrap gap-4 text-sm mb-4">
                {currentModel.height_ft && <div><span className="label block">Height</span>{currentModel.height_ft}&apos;{currentModel.height_in}&quot;</div>}
                {currentModel.bust && <div><span className="label block">Bust</span>{currentModel.bust}</div>}
                {currentModel.waist && <div><span className="label block">Waist</span>{currentModel.waist}</div>}
                {currentModel.hips && <div><span className="label block">Hips</span>{currentModel.hips}</div>}
                {currentModel.chest && <div><span className="label block">Chest</span>{currentModel.chest}</div>}
                {currentModel.suit_size && <div><span className="label block">Suit</span>{currentModel.suit_size}</div>}
                {currentModel.shoe_size && <div><span className="label block">Shoe</span>{currentModel.shoe_size}</div>}
                {currentModel.dress_size && <div><span className="label block">Dress</span>{currentModel.dress_size}</div>}
                {current.show_instagram && currentModel.instagram_handle && (
                  <div><span className="label block">Instagram</span>
                    <a href={'https://instagram.com/' + currentModel.instagram_handle} target="_blank" rel="noopener noreferrer" className="hover:underline">@{currentModel.instagram_handle}</a>
                  </div>
                )}
                {current.show_portfolio && currentModel.portfolio_url && (
                  <div><span className="label block">Portfolio</span>
                    <a href={currentModel.portfolio_url.startsWith('http') ? currentModel.portfolio_url : 'https://' + currentModel.portfolio_url} target="_blank" rel="noopener noreferrer" className="hover:underline">↗</a>
                  </div>
                )}
                {currentModel.agency && <div><span className="label block">Agency</span>{currentModel.agency}</div>}
              </div>
            )}

            {current.admin_notes && <p className="text-sm text-neutral-500 italic border-l-2 border-neutral-200 pl-3 mb-4">{current.admin_notes}</p>}

            {/* Two photos side by side */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {currentMedia.slice(0, 2).map((m: any) => (
                <div key={m.id} className="aspect-[3/4] overflow-hidden bg-neutral-100">
                  {m.type === 'video'
                    ? <video src={m.public_url} className="w-full h-full object-cover" controls />
                    : <img src={m.public_url} alt="" className="w-full h-full object-cover" />}
                </div>
              ))}
              {currentMedia.length === 0 && (
                <div className="aspect-[3/4] bg-neutral-100 flex items-center justify-center text-neutral-300 text-xs col-span-2">No photos</div>
              )}
            </div>

            {/* Shortlist button */}
            <SlideActions
              presentationId={presentationId}
              modelId={current.model_id}
              clientId={clientId}
              initialShortlisted={!!shortlists[current.model_id]}
              initialNotes={shortlistMap[current.model_id]?.notes || ''}
              onShortlistChange={(v) => handleShortlistChange(current.model_id, v)}
            />

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-neutral-100">
              <button onClick={prev} disabled={slideIndex === 0}
                className="flex items-center gap-2 text-xs tracking-widest uppercase disabled:opacity-20 hover:opacity-60 transition-opacity">
                <ChevronLeft size={16} /> Prev
              </button>

              {/* Thumbnail strip */}
              <div className="flex gap-1.5 overflow-x-auto max-w-[200px] md:max-w-sm">
                {sorted.map((pm, i) => {
                  const thumb = (mediaByModel[pm.model_id] || []).find((m: any) => m.is_visible && m.type === 'photo')
                  return (
                    <button key={pm.id} onClick={() => setSlideIndex(i)}
                      className={`relative flex-shrink-0 w-9 h-9 overflow-hidden border-2 transition-colors ${i === slideIndex ? 'border-black' : 'border-transparent opacity-40 hover:opacity-70'}`}>
                      {thumb
                        ? <img src={thumb.public_url} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-neutral-100 flex items-center justify-center text-[8px] text-neutral-400">{pm.models?.first_name?.[0]}</div>}
                      {shortlists[pm.model_id] && <div className="absolute top-0 right-0 w-2 h-2 bg-black rounded-full" />}
                    </button>
                  )
                })}
              </div>

              <button onClick={next} disabled={slideIndex === sorted.length - 1}
                className="flex items-center gap-2 text-xs tracking-widest uppercase disabled:opacity-20 hover:opacity-60 transition-opacity">
                Next <ChevronRight size={16} />
              </button>
            </div>

            {/* Mobile swipe hint */}
            <p className="text-center text-[10px] text-neutral-300 tracking-widest uppercase mt-4 md:hidden">swipe to navigate</p>
          </div>
        </div>
      )}
    </div>
  )
}

function SlideActions({ presentationId, modelId, clientId, initialShortlisted, initialNotes, onShortlistChange }: {
  presentationId: string, modelId: string, clientId: string, initialShortlisted: boolean, initialNotes: string, onShortlistChange?: (v: boolean) => void
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

  return (
    <div className="space-y-3">
      <button onClick={toggle}
        className={`w-full py-3 text-xs tracking-widest uppercase border transition-colors flex items-center justify-center gap-2 ${shortlisted ? 'bg-black text-white border-black' : 'border-neutral-300 hover:border-black'}`}>
        <Heart size={12} className={shortlisted ? 'fill-white text-white' : ''} />
        {shortlisted ? 'Shortlisted' : 'Add to Shortlist'}
      </button>
      <textarea value={notes} onChange={e => saveNotes(e.target.value)} placeholder="Your notes..."
        rows={2} className="w-full text-sm border-b border-neutral-200 bg-transparent py-2 focus:outline-none focus:border-black resize-none placeholder:text-neutral-300" />
    </div>
  )
}
