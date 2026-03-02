'use client'
import { useState } from 'react'
import { ProjectModelGrid } from '@/components/ProjectModelGrid'
import { ProjectModelToggle } from '@/components/ProjectModelToggle'
import { ProjectModelManager } from '@/components/ProjectModelManager'
import Link from 'next/link'
import { LayoutGrid, List } from 'lucide-react'

interface Props {
  projectId: string
  modelsWithPhotos: any[]
  mainPres: any | null
  presModelIds: Set<string>
}

export function ProjectModelsSection({ projectId, modelsWithPhotos, mainPres, presModelIds }: Props) {
  const [view, setView] = useState<'list' | 'grid'>('list')

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="label">Models Signed In ({modelsWithPhotos.length})</p>
        <div className="flex items-center gap-2">
          {mainPres && <p className="text-[10px] text-neutral-400 tracking-wider uppercase mr-2">✓ = on client presentation</p>}
          {modelsWithPhotos.length > 0 && (
            <div className="flex border border-neutral-200 overflow-hidden">
              <button
                onClick={() => setView('list')}
                className={`flex items-center gap-1 px-2 py-1 text-[10px] tracking-widest uppercase transition-colors ${view === 'list' ? 'bg-black text-white' : 'text-neutral-500 hover:bg-neutral-50'}`}
              >
                <List size={10} /> List
              </button>
              <button
                onClick={() => setView('grid')}
                className={`flex items-center gap-1 px-2 py-1 text-[10px] tracking-widest uppercase border-l border-neutral-200 transition-colors ${view === 'grid' ? 'bg-black text-white' : 'text-neutral-500 hover:bg-neutral-50'}`}
              >
                <LayoutGrid size={10} /> Grid
              </button>
            </div>
          )}
        </div>
      </div>

      {modelsWithPhotos.length === 0 ? (
        <div className="border border-dashed border-neutral-200 p-8 text-center">
          <p className="text-sm text-neutral-400">No models signed in yet.</p>
          <p className="text-xs text-neutral-300 mt-2">Share the model sign-in link above.</p>
        </div>
      ) : view === 'grid' ? (
        <ProjectModelGrid
          projectId={projectId}
          presentationId={mainPres?.id || null}
          initialModels={modelsWithPhotos}
          presModelIds={presModelIds}
        />
      ) : mainPres ? (
        <div className="space-y-2">
          {modelsWithPhotos.map((pm: any, i: number) => (
            <div key={pm.id} className="flex items-center gap-3 border border-neutral-100 px-3 py-2">
              <ProjectModelToggle
                presentationId={mainPres.id}
                model={pm.models}
                isInPresentation={presModelIds.has(pm.models?.id)}
                displayOrder={i}
              />
              {pm.photo && <img src={pm.photo} className="w-8 h-8 object-cover rounded-sm flex-shrink-0" alt="" />}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{pm.models?.first_name} {pm.models?.last_name}</p>
                {pm.models?.agency && <p className="text-[10px] text-neutral-400">{pm.models?.agency}</p>}
              </div>
              <Link href={`/admin/models/${pm.models?.id}`} className="text-[10px] text-neutral-300 hover:text-black transition-colors">View →</Link>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <ProjectModelManager projectId={projectId} initialModels={modelsWithPhotos} />
          <p className="text-xs text-neutral-400 mt-3">Create a presentation to enable the toggle view.</p>
        </div>
      )}
    </div>
  )
}
