'use client'
import { useState, useEffect, useCallback } from 'react'
import { LayoutGrid } from 'lucide-react'

interface GroupEntry {
  id: string
  notes?: string
  coverPhoto?: string
  groups?: {
    id: string
    name: string
    group_type?: string
    size?: string
    based_in?: string
    description?: string
  }
}

export function GroupsSection({ groups, hasModels }: { groups: GroupEntry[]; hasModels: boolean }) {
  const [view, setView] = useState<'grid' | 'slides'>('grid')
  const [slideIndex, setSlideIndex] = useState(0)

  const current = groups[slideIndex]

  const prev = useCallback(() => setSlideIndex(i => Math.max(0, i - 1)), [])
  const next = useCallback(() => setSlideIndex(i => Math.min(groups.length - 1, i + 1)), [groups.length])

  // Keyboard navigation in slides view
  useEffect(() => {
    if (view !== 'slides') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape') setView('grid')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [view, prev, next])

  const openSlide = (i: number) => { setSlideIndex(i); setView('slides') }

  return (
    <>
      {/* Header + view toggle — same style as PresentationViewer */}
      <div className={`${hasModels ? 'mt-12 pt-8 border-t border-neutral-200' : ''}`}>
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => setView('grid')}
            className={`flex items-center gap-2 px-4 py-2 text-xs tracking-widest uppercase border transition-colors ${view === 'grid' ? 'bg-black text-white border-black' : 'border-neutral-300 text-neutral-500 hover:border-black'}`}>
            <LayoutGrid size={12} /> Grid
          </button>
          <button onClick={() => { setView('slides'); setSlideIndex(0) }}
            className={`flex items-center gap-2 px-4 py-2 text-xs tracking-widest uppercase border transition-colors ${view === 'slides' ? 'bg-black text-white border-black' : 'border-neutral-300 text-neutral-500 hover:border-black'}`}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
            Slides
          </button>
          <span className="ml-auto text-xs tracking-widest uppercase text-neutral-400">{groups.length} {groups.length === 1 ? 'Group' : 'Groups'}</span>
        </div>

        {/* Grid — matches PresentationViewer grid exactly */}
        {view === 'grid' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
            {groups.map((pg, i) => (
              <div key={pg.id} className="cursor-pointer" onClick={() => openSlide(i)}>
                <div className="relative aspect-[3/4] bg-neutral-100 overflow-hidden mb-2 md:mb-3">
                  {pg.coverPhoto ? (
                    <img src={pg.coverPhoto} alt={pg.groups?.name}
                      className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-300 text-[9px] tracking-widest uppercase">No Photo</div>
                  )}
                </div>
                <div className="px-0">
                  <h3 className="text-sm font-medium tracking-widest uppercase mb-1 leading-tight">{pg.groups?.name}</h3>
                  {pg.groups?.group_type && <p className="text-xs text-neutral-500">{pg.groups.group_type}</p>}
                  {pg.groups?.size && <p className="text-xs text-neutral-500">{pg.groups.size}</p>}
                  {pg.notes && <p className="text-xs text-neutral-500 mt-1 italic">{pg.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Slides — full-screen overlay matching PresentationViewer */}
      {view === 'slides' && current && (
        <div className="fixed inset-0 bg-white z-40 flex flex-col overflow-hidden" style={{ height: '100dvh' }}>

          {/* TOP BAR */}
          <div className="flex-shrink-0 px-8 py-3 flex items-center justify-between">
            <button onClick={() => setView('grid')} className="text-neutral-400 hover:text-black transition-colors text-xs tracking-widest uppercase">← Back</button>
            <img src="/logo.jpg" alt="Tasha Tongpreecha Casting" className="h-5 w-auto" />
            <button onClick={() => setView('grid')} className="text-neutral-400 hover:text-black transition-colors text-lg">✕</button>
          </div>

          {/* NAME + INFO BAR */}
          <div className="flex-shrink-0 px-8 py-3 flex items-center justify-between bg-white">
            <div>
              <h2 className="text-2xl font-light tracking-[0.15em] uppercase mb-1">{current.groups?.name}</h2>
              <p className="text-[13px] text-neutral-500 tracking-wider">
                {[current.groups?.group_type, current.groups?.size, current.groups?.based_in].filter(Boolean).join(' · ')}
              </p>
            </div>
            <span className="text-xs text-neutral-400 tracking-widest">{slideIndex + 1} / {groups.length}</span>
          </div>

          {/* BODY: Photo + optional notes */}
          <div className="flex-1 min-h-0 flex overflow-hidden gap-6 pb-4">

            {/* Photo — fits to full height, natural aspect ratio */}
            <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden bg-neutral-50">
              {current.coverPhoto ? (
                <img src={current.coverPhoto} alt={current.groups?.name}
                  className="h-full w-auto object-contain object-top" />
              ) : (
                <div className="text-neutral-300 text-xs tracking-widest uppercase">No Photo</div>
              )}
            </div>

            {/* Notes panel (only if notes or description) */}
            {(current.notes || current.groups?.description) && (
              <div className="w-56 flex-shrink-0 overflow-y-auto py-2">
                {current.groups?.description && (
                  <p className="text-sm text-neutral-500 leading-relaxed mb-4">{current.groups.description}</p>
                )}
                {current.notes && (
                  <>
                    <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-2">Notes</p>
                    <p className="text-sm text-neutral-600 leading-relaxed">{current.notes}</p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* PREV / NEXT */}
          <div className="flex-shrink-0 flex items-center justify-between px-8 py-4 border-t border-neutral-100">
            <button onClick={prev} disabled={slideIndex === 0}
              className="flex items-center gap-2 text-xs tracking-widest uppercase text-neutral-500 hover:text-black disabled:opacity-20 disabled:cursor-default transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
              Prev
            </button>
            <div className="flex gap-1">
              {groups.map((_, i) => (
                <button key={i} onClick={() => setSlideIndex(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${i === slideIndex ? 'bg-black' : 'bg-neutral-300'}`} />
              ))}
            </div>
            <button onClick={next} disabled={slideIndex === groups.length - 1}
              className="flex items-center gap-2 text-xs tracking-widest uppercase text-neutral-500 hover:text-black disabled:opacity-20 disabled:cursor-default transition-colors">
              Next
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
