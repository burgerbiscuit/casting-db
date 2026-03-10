'use client'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, X, LayoutGrid } from 'lucide-react'

interface Props {
  presentationId: string
  presentationName: string
  projectName: string
  presModels: any[]
  categories: any[]
}

export default function ShareViewer({ presentationName, projectName, presModels, categories }: Props) {
  const [slideIndex, setSlideIndex] = useState<number | null>(null)
  const [view, setView] = useState<'grid' | 'slides'>('grid')

  // Sort by category, then alphabetically by last name within category
  const catMap: Record<string, any> = {}
  categories.forEach(c => { catMap[c.id] = c })

  const uncategorized = presModels.filter(m => !m.category_id)
  const byCat: Record<string, any[]> = {}
  presModels.filter(m => m.category_id).forEach(m => {
    if (!byCat[m.category_id]) byCat[m.category_id] = []
    byCat[m.category_id].push(m)
  })

  const alphaSort = (arr: any[]) => [...arr].sort((a, b) => {
    const la = (a.models?.first_name || '').toLowerCase()
    const lb = (b.models?.first_name || '').toLowerCase()
    return la.localeCompare(lb)
  })

  const sections: { label: string; models: any[] }[] = []
  categories.forEach(cat => {
    if (byCat[cat.id]?.length) sections.push({ label: cat.name, models: alphaSort(byCat[cat.id]) })
  })
  if (uncategorized.length) sections.push({ label: '', models: alphaSort(uncategorized) })

  const allModels = sections.flatMap(s => s.models)

  const getPhoto = (m: any) => m.models?.model_media?.[0]?.public_url || null

  const openSlide = (model: any) => {
    const idx = allModels.findIndex(m => m.id === model.id)
    setSlideIndex(idx)
    setView('slides')
  }

  const closeSlide = () => { setSlideIndex(null); setView('grid') }
  const prev = () => setSlideIndex(i => i !== null && i > 0 ? i - 1 : i)
  const next = () => setSlideIndex(i => i !== null && i < allModels.length - 1 ? i + 1 : i)

  const currentModel = slideIndex !== null ? allModels[slideIndex] : null

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-neutral-100 px-8 py-5 flex items-center justify-between">
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-400">Tasha Tongpreecha Casting</p>
          <h1 className="text-lg tracking-widest uppercase font-light mt-0.5">{presentationName}</h1>
          {projectName && <p className="text-xs text-neutral-400 tracking-widest uppercase mt-0.5">{projectName}</p>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-400">{allModels.length} models</span>
          <button onClick={() => setView('grid')}
            className={`p-1.5 ${view === 'grid' ? 'text-black' : 'text-neutral-300 hover:text-neutral-500'}`}>
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {/* Grid view */}
      {view === 'grid' && (
        <div className="px-8 py-8">
          {sections.map((section, si) => (
            <div key={si} className="mb-12">
              {section.label && (
                <p className="text-[10px] tracking-[0.25em] uppercase text-neutral-400 mb-6">{section.label}</p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {section.models.map(m => {
                  const photo = getPhoto(m)
                  const model = m.models
                  return (
                    <button key={m.id} onClick={() => openSlide(m)}
                      className="text-left group">
                      <div className="aspect-[3/4] bg-neutral-100 overflow-hidden mb-2">
                        {photo
                          ? <img src={photo} alt={model?.first_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          : <div className="w-full h-full bg-neutral-100 flex items-center justify-center text-neutral-300 text-xs">No photo</div>
                        }
                      </div>
                      <p className="text-xs tracking-wider uppercase">{model?.first_name} {model?.last_name}</p>
                      {model?.height && <p className="text-[10px] text-neutral-400">{model.height}</p>}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide view */}
      {view === 'slides' && currentModel && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          <div className="flex items-center justify-between px-8 py-4 border-b border-neutral-100">
            <div>
              <p className="text-sm tracking-wider uppercase font-light">
                {currentModel.models?.first_name} {currentModel.models?.last_name}
              </p>
              {currentModel.models?.height && (
                <p className="text-xs text-neutral-400">{currentModel.models.height}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-neutral-400">{(slideIndex || 0) + 1} / {allModels.length}</span>
              <button onClick={closeSlide}><X size={18} className="text-neutral-400 hover:text-black" /></button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center relative overflow-hidden">
            <button onClick={prev} disabled={(slideIndex || 0) === 0}
              className="absolute left-4 z-10 p-2 text-neutral-400 hover:text-black disabled:opacity-20 transition-colors">
              <ChevronLeft size={24} />
            </button>
            {getPhoto(currentModel)
              ? <img src={getPhoto(currentModel)} alt="" className="h-full max-h-[80vh] object-contain" />
              : <div className="w-64 h-80 bg-neutral-100 flex items-center justify-center text-neutral-400 text-sm">No photo</div>
            }
            <button onClick={next} disabled={(slideIndex || 0) === allModels.length - 1}
              className="absolute right-4 z-10 p-2 text-neutral-400 hover:text-black disabled:opacity-20 transition-colors">
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
