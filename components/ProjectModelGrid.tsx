'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ProjectModelGridProps {
  projectId: string
  presentationId: string | null
  initialModels: any[]
  presModelIds: Set<string>
}

function getInitials(model: any) {
  return ((model?.first_name?.[0] || '') + (model?.last_name?.[0] || '')).toUpperCase()
}

function ModelGridCard({ pm, presentationId, initialIncluded, displayOrder }: {
  pm: any
  presentationId: string | null
  initialIncluded: boolean
  displayOrder: number
}) {
  const supabase = createClient()
  const model = pm.models
  const [included, setIncluded] = useState(initialIncluded)
  const [option, setOption] = useState(pm.pm_option || '')
  const [rate, setRate] = useState(pm.pm_rate || '')
  const [location, setLocation] = useState(pm.pm_location || '')
  const [notes, setNotes] = useState(pm.pm_notes || '')

  const saveField = async (field: string, value: string) => {
    await supabase.from('project_models').update({ [field]: value }).eq('id', pm.id)
  }

  const togglePresentation = async () => {
    if (!presentationId) return
    if (included) {
      await Promise.all([
        supabase.from('presentation_models').delete().eq('presentation_id', presentationId).eq('model_id', model.id),
        supabase.from('client_shortlists').delete().eq('presentation_id', presentationId).eq('model_id', model.id),
      ])
      setIncluded(false)
    } else {
      await supabase.from('presentation_models').insert({
        presentation_id: presentationId,
        model_id: model.id,
        display_order: displayOrder,
        show_sizing: true, show_instagram: true, show_portfolio: true, is_visible: true
      })
      setIncluded(true)
    }
  }

  return (
    <div className="border border-neutral-100 flex flex-col">
      <div className="relative" style={{ aspectRatio: '3/4' }}>
        {pm.photo ? (
          <img src={pm.photo} alt="" className="w-full h-full object-cover object-top" />
        ) : (
          <div className="w-full h-full bg-neutral-100 flex items-center justify-center text-neutral-400 text-lg font-light tracking-widest">
            {getInitials(model)}
          </div>
        )}
        {presentationId && (
          <button
            onClick={togglePresentation}
            className={`absolute top-2 right-2 w-5 h-5 border-2 flex items-center justify-center transition-colors ${included ? 'bg-black border-black' : 'bg-white border-neutral-300 hover:border-black'}`}
            title={included ? 'Remove from presentation' : 'Add to presentation'}
          >
            {included && <span className="text-white text-[10px]">✓</span>}
          </button>
        )}
      </div>
      <div className="p-2 flex flex-col gap-1.5">
        <p className="text-xs font-medium truncate">{model?.first_name} {model?.last_name}</p>
        {model?.agency && <p className="text-[10px] text-neutral-400 truncate">{model?.agency}</p>}
        <input
          className="w-full text-[10px] border-b border-neutral-200 bg-transparent py-0.5 focus:outline-none focus:border-black placeholder:text-neutral-300"
          placeholder="Option"
          value={option}
          onChange={e => setOption(e.target.value)}
          onBlur={e => saveField('pm_option', e.target.value)}
        />
        <input
          className="w-full text-[10px] border-b border-neutral-200 bg-transparent py-0.5 focus:outline-none focus:border-black placeholder:text-neutral-300"
          placeholder="Rate"
          value={rate}
          onChange={e => setRate(e.target.value)}
          onBlur={e => saveField('pm_rate', e.target.value)}
        />
        <input
          className="w-full text-[10px] border-b border-neutral-200 bg-transparent py-0.5 focus:outline-none focus:border-black placeholder:text-neutral-300"
          placeholder="Location"
          value={location}
          onChange={e => setLocation(e.target.value)}
          onBlur={e => saveField('pm_location', e.target.value)}
        />
        <textarea
          className="w-full text-[10px] border-b border-neutral-200 bg-transparent py-0.5 focus:outline-none focus:border-black placeholder:text-neutral-300 resize-none"
          placeholder="Notes"
          rows={2}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onBlur={e => saveField('pm_notes', e.target.value)}
        />
      </div>
    </div>
  )
}

export function ProjectModelGrid({ projectId, presentationId, initialModels, presModelIds }: ProjectModelGridProps) {
  return (
    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {initialModels.map((pm, i) => (
        <ModelGridCard
          key={pm.id}
          pm={pm}
          presentationId={presentationId}
          initialIncluded={presModelIds.has(pm.models?.id)}
          displayOrder={i}
        />
      ))}
    </div>
  )
}
