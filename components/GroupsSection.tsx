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
    agency?: string
    instagram_handle?: string
    website?: string
    description?: string
    group_story?: string
    skills?: string[]
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
                <div className="px-0 p-3">
                  <h3 className="text-sm font-medium tracking-widest uppercase mb-1 leading-tight">{pg.groups?.name}</h3>
                  {pg.groups?.agency && <p className="text-xs text-neutral-600 mb-0.5">{pg.groups.agency}</p>}
                  {[pg.groups?.group_type, pg.groups?.size, pg.groups?.based_in].filter(Boolean).length > 0 && (
                    <p className="text-xs text-neutral-500 mb-1">{[pg.groups?.group_type, pg.groups?.size, pg.groups?.based_in].filter(Boolean).join(' · ')}</p>
                  )}
                  {pg.groups?.instagram_handle && (
                    <a href={`https://instagram.com/${pg.groups.instagram_handle.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-xs text-neutral-500 underline underline-offset-2 hover:text-black block mb-0.5">
                      @{pg.groups.instagram_handle.replace(/^@/, '')}
                    </a>
                  )}
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
          <div className="flex-shrink-0 px-8 py-3 flex items-start justify-between bg-white gap-4">
            <div>
              <h2 className="text-2xl font-light tracking-[0.15em] uppercase mb-0.5">{current.groups?.name}</h2>
              {current.groups?.agency && <p className="text-sm text-neutral-500 mb-0.5">{current.groups.agency}</p>}
              <p className="text-[13px] text-neutral-500 tracking-wider">
                {[current.groups?.group_type, current.groups?.size, current.groups?.based_in].filter(Boolean).join(' · ')}
              </p>
              <div className="flex gap-4 mt-1 flex-wrap">
                {current.groups?.instagram_handle && (
                  <a href={`https://instagram.com/${current.groups.instagram_handle.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] tracking-widest uppercase underline underline-offset-2 text-neutral-500 hover:text-black">
                    @{current.groups.instagram_handle.replace(/^@/, '')} ↗
                  </a>
                )}
                {current.groups?.website && (
                  <a href={current.groups.website.startsWith('http') ? current.groups.website : 'https://' + current.groups.website}
                    target="_blank" rel="noopener noreferrer"
                    className="text-[10px] tracking-widest uppercase underline underline-offset-2 text-neutral-500 hover:text-black">
                    Website ↗
                  </a>
                )}
              </div>
            </div>
            <span className="text-xs text-neutral-400 tracking-widest flex-shrink-0">{slideIndex + 1} / {groups.length}</span>
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

            {/* Notes / info panel */}
            {(current.notes || current.groups?.description || current.groups?.group_story || (current.groups?.skills?.length ?? 0) > 0) && (
              <div className="w-64 flex-shrink-0 overflow-y-auto py-2 space-y-4">
                {current.groups?.description && (
                  <div>
                    <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-1">About</p>
                    <p className="text-sm text-neutral-600 leading-relaxed">{current.groups.description}</p>
                  </div>
                )}
                {current.groups?.group_story && (
                  <div>
                    <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-1">Story</p>
                    <p className="text-sm text-neutral-600 leading-relaxed">{current.groups.group_story}</p>
                  </div>
                )}
                {(current.groups?.skills?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-1">Skills</p>
                    <p className="text-sm text-neutral-600">{current.groups!.skills!.join(', ')}</p>
                  </div>
                )}
                {current.notes && (
                  <div>
                    <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-1">Notes</p>
                    <p className="text-sm text-neutral-600 leading-relaxed">{current.notes}</p>
                  </div>
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
