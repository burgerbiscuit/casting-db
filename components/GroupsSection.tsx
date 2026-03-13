'use client'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react'

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
  const [view, setView] = useState<'grid' | 'slides'>(hasModels ? 'grid' : 'slides')
  const [slideIndex, setSlideIndex] = useState(0)

  const current = groups[slideIndex]

  return (
    <div className={`${hasModels ? 'mt-12 pt-8 border-t border-neutral-200' : ''}`}>
      {/* Header + view toggle */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs tracking-widest uppercase text-neutral-400">Groups ({groups.length})</p>
        <div className="flex gap-2">
          <button onClick={() => setView('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs tracking-widest uppercase border transition-colors ${view === 'grid' ? 'bg-black text-white border-black' : 'border-neutral-300 text-neutral-500 hover:border-black'}`}>
            <LayoutGrid size={11} /> Grid
          </button>
          <button onClick={() => setView('slides')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs tracking-widest uppercase border transition-colors ${view === 'slides' ? 'bg-black text-white border-black' : 'border-neutral-300 text-neutral-500 hover:border-black'}`}>
            Slides
          </button>
        </div>
      </div>

      {/* Grid view */}
      {view === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {groups.map((pg, i) => (
            <button key={pg.id} onClick={() => { setSlideIndex(i); setView('slides') }} className="text-left group">
              <div className="aspect-[3/4] overflow-hidden bg-neutral-100 mb-2">
                {pg.coverPhoto ? (
                  <img src={pg.coverPhoto} alt={pg.groups?.name} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-300 text-[9px] tracking-widest uppercase">No Photo</div>
                )}
              </div>
              <p className="text-xs font-medium tracking-widest uppercase">{pg.groups?.name}</p>
              {pg.groups?.group_type && <p className="text-[10px] text-neutral-400 mt-0.5">{pg.groups.group_type}</p>}
              {pg.groups?.size && <p className="text-[10px] text-neutral-400">{pg.groups.size}</p>}
              {pg.notes && <p className="text-[10px] text-neutral-500 mt-1">{pg.notes}</p>}
            </button>
          ))}
        </div>
      )}

      {/* Slides view */}
      {view === 'slides' && current && (
        <div className="flex flex-col items-center">
          {/* Photo */}
          <div className="w-full max-w-lg aspect-[3/4] overflow-hidden bg-neutral-100 mb-6 relative">
            {current.coverPhoto ? (
              <img src={current.coverPhoto} alt={current.groups?.name} className="w-full h-full object-cover object-top" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-300 text-xs tracking-widest uppercase">No Photo</div>
            )}
          </div>

          {/* Info */}
          <div className="text-center mb-8 max-w-md">
            <p className="text-lg font-light tracking-widest uppercase mb-1">{current.groups?.name}</p>
            {current.groups?.group_type && <p className="text-xs text-neutral-400 tracking-widest mb-0.5">{current.groups.group_type}</p>}
            {current.groups?.size && <p className="text-xs text-neutral-400">{current.groups.size}</p>}
            {current.groups?.based_in && <p className="text-xs text-neutral-400">{current.groups.based_in}</p>}
            {current.notes && <p className="text-sm text-neutral-600 mt-3 leading-relaxed">{current.notes}</p>}
            {current.groups?.description && <p className="text-xs text-neutral-400 mt-2 leading-relaxed">{current.groups.description}</p>}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-6">
            <button onClick={() => setSlideIndex(i => Math.max(0, i - 1))} disabled={slideIndex === 0}
              className="p-2 border border-neutral-300 hover:border-black disabled:opacity-20 disabled:cursor-default transition-colors">
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs text-neutral-400 tracking-widest">{slideIndex + 1} / {groups.length}</span>
            <button onClick={() => setSlideIndex(i => Math.min(groups.length - 1, i + 1))} disabled={slideIndex === groups.length - 1}
              className="p-2 border border-neutral-300 hover:border-black disabled:opacity-20 disabled:cursor-default transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
