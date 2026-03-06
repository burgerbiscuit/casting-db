import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type') || ''
  const supabase = await createServiceClient()

  // FormData path — file upload (cast sign-in selfies, unauthenticated)
  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData()
    const modelId = formData.get('modelId') as string
    if (!modelId) return NextResponse.json({ error: 'Missing modelId' }, { status: 400 })

    for (const [, value] of formData.entries()) {
      if (!(value instanceof File) || value.size === 0) continue
      const ext = value.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${modelId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('model-media')
        .upload(path, await value.arrayBuffer(), { contentType: value.type || 'image/jpeg' })
      if (upErr) { console.error('Cast media upload error:', upErr.message); continue }
      const { data: { publicUrl } } = supabase.storage.from('model-media').getPublicUrl(path)
      await supabase.from('model_media').insert({
        model_id: modelId, storage_path: path, public_url: publicUrl,
        type: 'photo', is_visible: true, uploaded_at: new Date().toISOString(),
      })
    }
    return NextResponse.json({ ok: true })
  }

  // JSON path — legacy (storagePath + publicUrl already set externally, just record in DB)
  const { modelId, storagePath, publicUrl } = await req.json()
  if (!modelId || !storagePath || !publicUrl) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  await supabase.from('model_media').insert({
    model_id: modelId, storage_path: storagePath, public_url: publicUrl, type: 'photo', is_visible: true,
  })
  return NextResponse.json({ ok: true })
}
