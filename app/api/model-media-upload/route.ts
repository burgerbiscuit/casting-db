import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // Allow both authenticated team members and unauthenticated (cast sign-in flow uses /api/cast-signin/media)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const formData = await req.formData()
  const modelId = formData.get('modelId') as string
  const mediaType = (formData.get('mediaType') as string) || 'photo'
  if (!modelId) return NextResponse.json({ error: 'Missing modelId' }, { status: 400 })

  const svc = await createServiceClient()

  const mediaId = formData.get('mediaId') as string | null // set for crop-update flow

  for (const [, value] of formData.entries()) {
    if (!(value instanceof File) || value.size === 0) continue
    const ext = value.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${modelId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error: upErr } = await svc.storage
      .from('model-media')
      .upload(path, await value.arrayBuffer(), { contentType: value.type || 'image/jpeg' })
    if (upErr) { console.error('Model media upload error:', upErr.message); continue }
    const { data: { publicUrl } } = svc.storage.from('model-media').getPublicUrl(path)
    if (mediaId) {
      // Crop update — overwrite existing record
      await svc.from('model_media').update({ public_url: publicUrl, storage_path: path }).eq('id', mediaId)
    } else {
      // Check if this model already has a primary photo — if not, make this one primary
      const { data: existing } = await svc.from('model_media')
        .select('id').eq('model_id', modelId).eq('is_pdf_primary', true).limit(1)
      const isPrimary = !existing || existing.length === 0

      await svc.from('model_media').insert({
        model_id: modelId, storage_path: path, public_url: publicUrl,
        type: mediaType, is_visible: true, uploaded_at: new Date().toISOString(),
        is_pdf_primary: isPrimary,
      })
    }
  }

  return NextResponse.json({ ok: true })
}
