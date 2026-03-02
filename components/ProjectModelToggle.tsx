'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function ProjectModelToggle({ presentationId, model, isInPresentation, displayOrder }: {
  presentationId: string
  model: any
  isInPresentation: boolean
  displayOrder: number
}) {
  const supabase = createClient()
  const [included, setIncluded] = useState(isInPresentation)
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    setLoading(true)
    if (included) {
      await supabase.from('presentation_models').delete().eq('presentation_id', presentationId).eq('model_id', model.id)
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
    setLoading(false)
  }

  return (
    <button onClick={toggle} disabled={loading}
      className={`w-5 h-5 border-2 flex items-center justify-center transition-colors flex-shrink-0 ${included ? 'bg-black border-black' : 'border-neutral-300 hover:border-black'}`}>
      {included && <span className="text-white text-[10px]">✓</span>}
    </button>
  )
}
