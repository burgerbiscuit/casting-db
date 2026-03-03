import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { modelData, projectId, modelId: existingModelId, isReturning, selfieBase64Files } = body

  const supabase = await createServiceClient()

  // Safety check — projectId must always be present
  if (!projectId) {
    console.error('[cast-signin] Missing projectId! modelData:', JSON.stringify(modelData).slice(0, 200))
    // Still create the model so they're not lost, but flag it
    const { data, error } = await supabase.from('models').insert({ ...modelData, notes: '[MISSING PROJECT - check cast sign-in]' }).select('id').single()
    return NextResponse.json({ ok: true, modelId: data?.id, warning: 'project_missing' })
  }

  let modelId = existingModelId
  try {
    if (isReturning && modelId) {
      await supabase.from('models').update(modelData).eq('id', modelId)
    } else {
      const { data, error } = await supabase.from('models').insert(modelData).select('id').single()
      if (error) return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
      modelId = data?.id
    }

    if (modelId) {
      await supabase.from('project_models').upsert({ project_id: projectId, model_id: modelId })
      // Auto-add to the project's presentation — create one if it doesn't exist yet
      let { data: pres } = await supabase.from('presentations').select('id').eq('project_id', projectId).single()
      if (!pres) {
        const { data: proj } = await supabase.from('projects').select('name').eq('id', projectId).single()
        const { data: newPres } = await supabase.from('presentations').insert({
          project_id: projectId,
          name: proj?.name || 'Presentation',
          is_published: false,
        }).select('id').single()
        pres = newPres
      }
      if (pres) {
        const { data: existing } = await supabase.from('presentation_models').select('id').eq('presentation_id', pres.id).eq('model_id', modelId).single()
        if (!existing) {
          const { data: lastPm } = await supabase.from('presentation_models').select('display_order').eq('presentation_id', pres.id).order('display_order', { ascending: false }).limit(1).single()
          await supabase.from('presentation_models').insert({
            presentation_id: pres.id,
            model_id: modelId,
            display_order: (lastPm?.display_order ?? -1) + 1,
            show_sizing: true, show_instagram: true, show_portfolio: true, is_visible: true
          })
        }
      }
    }

    return NextResponse.json({ ok: true, modelId })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
