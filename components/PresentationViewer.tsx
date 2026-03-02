'use client'
import { useState } from 'react'
import { ModelCard } from '@/components/ModelCard'
import { LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react'

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

  const current = presentationModels[slideIndex]
  const currentModel = current?.models
  const currentMedia = (mediaByModel[current?.model_id] || []).filter((m: any) => m.is_visible)

  const prev = () => setSlideIndex(i => Math.max(0, i - 1))
  const next = () => setSlideIndex(i => Math.min(presentationModels.length - 1, i + 1))

  const formatFollowers = (n: number) => {
    if (!n) return null
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return n.toString()
  }

  return (
    <div>
      {/* View toggle */}
      <div className="flex items-center gap-2 mb-8">
        <button
          onClick={() => setView('grid')}
          className={`flex items-center gap-2 px-4 py-2 text-xs tracking-widest uppercase border transition-colors ${view === 'grid' ? 'bg-black text-white border-black' : 'border-neutral-300 text-neutral-500 hover:border-black'}`}
        >
          <LayoutGrid size={12} /> Grid
        </button>
        <button
          onClick={() => { setView('slides'); setSlideIndex(0) }}
          className={`flex items-center gap-2 px-4 py-2 text-xs tracking-widest uppercase border transition-colors ${view === 'slides' ? 'bg-black text-white border-black' : 'border-neutral-300 text-neutral-500 hover:border-black'}`}
        >
          <span className="text-[10px]">▶</span> Slides
        </button>
      </div>

      {/* Grid view */}
      {view === 'grid' && (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {presentationModels.map(pm => (
            <ModelCard
              key={pm.id}
              presentationModel={pm}
              model={pm.models}
              media={mediaByModel[pm.model_id] || []}
              presentationId={presentationId}
              clientId={clientId}
              initialShortlisted={!!shortlistMap[pm.model_id]}
              initialNotes={shortlistMap[pm.model_id]?.notes || ''}
            />
          ))}
        </div>
      )}

      {/* Slides view */}
      {view === 'slides' && current && currentModel && (
        <div className="flex flex-col items-center">
          {/* Progress */}
          <p className="label mb-6">{slideIndex + 1} / {presentationModels.length}</p>

          <div className="w-full max-w-4xl">
            {/* Name on top */}
            <h2 className="text-3xl font-light tracking-widest uppercase mb-4">
              {currentModel.first_name} {currentModel.last_name}
            </h2>
            {/* Sizing row */}
            {current.show_sizing && (
              <div className="flex flex-wrap gap-6 text-sm mb-4">
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
                    <a href={currentModel.portfolio_url.startsWith('http') ? currentModel.portfolio_url : 'https://' + currentModel.portfolio_url} target="_blank" rel="noopener noreferrer" className="hover:underline">Portfolio ↗</a>
                  </div>
                )}
                {currentModel.agency && <div><span className="label block">Agency</span>{currentModel.agency}</div>}
              </div>
            )}
            {current.admin_notes && <p className="text-sm text-neutral-500 italic border-l-2 border-neutral-200 pl-3 mb-4">{current.admin_notes}</p>}
            {/* Two photos side by side */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {currentMedia.filter((m) => m.is_visible).slice(0, 2).map((m) => (
                <div key={m.id} className="aspect-[3/4] overflow-hidden bg-neutral-100">
                  {m.type === 'video' ? <video src={m.public_url} className="w-full h-full object-cover" controls /> : <img src={m.public_url} alt="" className="w-full h-full object-cover" />}
                </div>
              ))}
              {currentMedia.length === 0 && <div className="aspect-[3/4] bg-neutral-100 flex items-center justify-center text-neutral-300 text-xs col-span-2">No photos</div>}
            </div>
            <SlideActions presentationId={presentationId} modelId={current.model_id} clientId={clientId} initialShortlisted={!!shortlistMap[current.model_id]} initialNotes={shortlistMap[current.model_id]?.notes || ''} />
            <div className="hidden">
              {/* Photos */}
              <div>
                {currentMedia.length > 0 ? (
                  <SlidePhotoCarousel media={currentMedia} />
                ) : (
                  <div className="aspect-[3/4] bg-neutral-100 flex items-center justify-center text-neutral-300 text-xs">No photo</div>
                )}
              </div>

              {/* Info */}
              <div className="py-4">
                <h2 className="text-3xl font-light tracking-widest uppercase mb-6">
                  {currentModel.first_name} {currentModel.last_name}
                </h2>

                {current.show_sizing && (
                  <div className="mb-6">
                    <p className="label mb-3">Sizing</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {currentModel.height_ft && <div><span className="label block">Height</span>{currentModel.height_ft}&apos;{currentModel.height_in}&quot;</div>}
                      {currentModel.bust && <div><span className="label block">Bust</span>{currentModel.bust}</div>}
                      {currentModel.waist && <div><span className="label block">Waist</span>{currentModel.waist}</div>}
                      {currentModel.hips && <div><span className="label block">Hips</span>{currentModel.hips}</div>}
                      {currentModel.chest && <div><span className="label block">Chest</span>{currentModel.chest}</div>}
                      {currentModel.suit_size && <div><span className="label block">Suit</span>{currentModel.suit_size}</div>}
                      {currentModel.shoe_size && <div><span className="label block">Shoe</span>{currentModel.shoe_size}</div>}
                      {currentModel.dress_size && <div><span className="label block">Dress</span>{currentModel.dress_size}</div>}
                    </div>
                  </div>
                )}

                {current.show_instagram && currentModel.instagram_handle && (
                  <div className="mb-4">
                    <p className="label mb-1">Instagram</p>
                    <a href={`https://instagram.com/${currentModel.instagram_handle}`} target="_blank" rel="noopener noreferrer"
                      className="text-sm hover:underline">
                      @{currentModel.instagram_handle}
                    </a>
                  </div>
                )}

                {current.show_portfolio && currentModel.portfolio_url && (
                  <div className="mb-4">
                    <p className="label mb-1">Portfolio</p>
                    <a href={currentModel.portfolio_url.startsWith('http') ? currentModel.portfolio_url : `https://${currentModel.portfolio_url}`}
                      target="_blank" rel="noopener noreferrer" className="text-sm hover:underline truncate block">
                      {currentModel.portfolio_url}
                    </a>
                  </div>
                )}

                {currentModel.agency && (
                  <div className="mb-4">
                    <p className="label mb-1">Agency</p>
                    <p className="text-sm">{currentModel.agency}</p>
                  </div>
                )}

                {current.admin_notes && (
                  <div className="mb-6 border-l-2 border-neutral-200 pl-4">
                    <p className="text-sm text-neutral-500 italic">{current.admin_notes}</p>
                  </div>
                )}

                {/* Shortlist + notes */}
                <SlideActions
                  presentationId={presentationId}
                  modelId={current.model_id}
                  clientId={clientId}
                  initialShortlisted={!!shortlistMap[current.model_id]}
                  initialNotes={shortlistMap[current.model_id]?.notes || ''}
                />
</div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-10 pt-8 border-t border-neutral-100">
              <button onClick={prev} disabled={slideIndex === 0}
                className="flex items-center gap-2 text-xs tracking-widest uppercase disabled:opacity-20 hover:opacity-60 transition-opacity">
                <ChevronLeft size={16} /> Previous
              </button>

              {/* Thumbnail strip */}
              <div className="flex gap-2 overflow-x-auto max-w-sm">
                {presentationModels.map((pm, i) => {
                  const thumb = (mediaByModel[pm.model_id] || []).find((m: any) => m.is_visible && m.type === 'photo')
                  return (
                    <button key={pm.id} onClick={() => setSlideIndex(i)}
                      className={`flex-shrink-0 w-10 h-10 overflow-hidden border-2 transition-colors ${i === slideIndex ? 'border-black' : 'border-transparent opacity-50 hover:opacity-80'}`}>
                      {thumb ? (
                        <img src={thumb.public_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-neutral-100 flex items-center justify-center text-[8px] text-neutral-400">
                          {pm.models?.first_name?.[0]}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              <button onClick={next} disabled={slideIndex === presentationModels.length - 1}
                className="flex items-center gap-2 text-xs tracking-widest uppercase disabled:opacity-20 hover:opacity-60 transition-opacity">
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SlidePhotoCarousel({ media }: { media: any[] }) {
  const [idx, setIdx] = useState(0)
  const photos = media.filter(m => m.type === 'photo')
  const videos = media.filter(m => m.type === 'video')
  const all = [...photos, ...videos]

  return (
    <div>
      <div className="aspect-[3/4] overflow-hidden bg-neutral-100">
        {all[idx]?.type === 'video' ? (
          <video src={all[idx].public_url} className="w-full h-full object-cover" controls />
        ) : (
          <img src={all[idx]?.public_url} alt="" className="w-full h-full object-cover" />
        )}
      </div>
      {all.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto">
          {all.map((m, i) => (
            <button key={m.id} onClick={() => setIdx(i)}
              className={`flex-shrink-0 w-14 h-14 overflow-hidden border-2 transition-colors ${i === idx ? 'border-black' : 'border-transparent opacity-50 hover:opacity-80'}`}>
              {m.type === 'video' ? (
                <div className="w-full h-full bg-neutral-200 flex items-center justify-center text-xs">▶</div>
              ) : (
                <img src={m.public_url} alt="" className="w-full h-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SlideActions({ presentationId, modelId, clientId, initialShortlisted, initialNotes }: {
  presentationId: string, modelId: string, clientId: string, initialShortlisted: boolean, initialNotes: string
}) {
  const [shortlisted, setShortlisted] = useState(initialShortlisted)
  const [notes, setNotes] = useState(initialNotes)

  const toggle = async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const next = !shortlisted
    setShortlisted(next)
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
    <div className="space-y-3 mt-6 pt-6 border-t border-neutral-100">
      <button onClick={toggle}
        className={`w-full py-3 text-xs tracking-widest uppercase border transition-colors ${shortlisted ? 'bg-black text-white border-black' : 'border-neutral-300 hover:border-black'}`}>
        {shortlisted ? '♥ Shortlisted' : '♡ Add to Shortlist'}
      </button>
      <textarea value={notes} onChange={e => saveNotes(e.target.value)} placeholder="Your notes..."
        rows={3} className="w-full text-sm border-b border-neutral-200 bg-transparent py-2 focus:outline-none focus:border-black resize-none placeholder:text-neutral-300" />
    </div>
  )
}
