import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action, presentationId, modelId, notes, isReleased, status } = await req.json()

  const serviceSupa = await createServiceClient()

  if (action === 'toggle') {
    // Delete if exists, else insert
    const { data: existing } = await serviceSupa
      .from('client_shortlists')
      .select('id')
      .eq('presentation_id', presentationId)
      .eq('model_id', modelId)
      .eq('client_id', user.id)
      .maybeSingle()

    if (existing) {
      await serviceSupa.from('client_shortlists').delete().eq('id', existing.id)
    } else {
      await serviceSupa.from('client_shortlists').insert({
        presentation_id: presentationId,
        model_id: modelId,
        client_id: user.id,
        status: 'shortlisted',
        notes: notes || '',
      })
    }
    return NextResponse.json({ ok: true })
  }

  if (action === 'updateNotes') {
    const { data: existing } = await serviceSupa
      .from('client_shortlists')
      .select('id')
      .eq('presentation_id', presentationId)
      .eq('model_id', modelId)
      .eq('client_id', user.id)
      .maybeSingle()

    if (existing) {
      await serviceSupa.from('client_shortlists').update({ notes }).eq('id', existing.id)
    }
    return NextResponse.json({ ok: true })
  }

  if (action === 'updateStatus') {
    const { data: existing } = await serviceSupa
      .from('client_shortlists')
      .select('id')
      .eq('presentation_id', presentationId)
      .eq('model_id', modelId)
      .eq('client_id', user.id)
      .maybeSingle()

    if (existing) {
      await serviceSupa.from('client_shortlists').update({ status }).eq('id', existing.id)
    } else {
      await serviceSupa.from('client_shortlists').insert({
        presentation_id: presentationId,
        model_id: modelId,
        client_id: user.id,
        status,
      })
    }
    return NextResponse.json({ ok: true })
  }

  if (action === 'updateRelease') {
    const { data: existing } = await serviceSupa
      .from('client_shortlists')
      .select('id')
      .eq('presentation_id', presentationId)
      .eq('model_id', modelId)
      .eq('client_id', user.id)
      .maybeSingle()

    if (existing) {
      await serviceSupa
        .from('client_shortlists')
        .update({ is_released: isReleased, status: 'shortlisted' })
        .eq('id', existing.id)
    } else {
      await serviceSupa.from('client_shortlists').insert({
        presentation_id: presentationId,
        model_id: modelId,
        client_id: user.id,
        is_released: isReleased,
        status: 'shortlisted',
      })
    }
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
