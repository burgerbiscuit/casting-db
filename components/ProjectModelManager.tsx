'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { X } from 'lucide-react'

interface ProjectModel {
  id: string
  model_id: string
  photo: string | null
  models: {
    id: string
    first_name: string
    last_name: string
    agency: string
    gender: string
    height_ft: number
    height_in: number
  }
}

export function ProjectModelManager({ projectId, initialModels }: { projectId: string, initialModels: ProjectModel[] }) {
  const supabase = createClient()
  const [models, setModels] = useState(initialModels)

  const remove = async (pmId: string, modelName: string) => {
    if (!confirm(`Remove ${modelName} from this project? Their profile will not be deleted.`)) return
    await supabase.from('project_models').delete().eq('id', pmId)
    setModels(prev => prev.filter(m => m.id !== pmId))
  }

  return (
    <div className="space-y-2">
      {models.map(pm => {
        const m = pm.models
        if (!m) return null
        return (
          <div key={pm.id} className="flex items-center gap-3 border border-neutral-100 p-3 hover:border-neutral-300 transition-colors group">
            {/* Thumbnail */}
            <div className="w-10 h-10 bg-neutral-100 overflow-hidden flex-shrink-0">
              {pm.photo ? (
                <img src={pm.photo} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-300 text-xs font-medium">
                  {m.first_name?.[0]}{m.last_name?.[0]}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{m.first_name} {m.last_name}</p>
              <p className="text-xs text-neutral-400 truncate">
                {m.agency || 'No agency'}
                {m.height_ft ? ` · ${m.height_ft}'${m.height_in}"` : ''}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Link href={`/admin/models/${m.id}`} className="text-[10px] tracking-widest uppercase text-neutral-400 hover:text-black underline">
                Profile
              </Link>
              <button
                onClick={() => remove(pm.id, `${m.first_name} ${m.last_name}`)}
                className="text-neutral-300 hover:text-red-400 transition-colors ml-1"
                title="Remove from project"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
