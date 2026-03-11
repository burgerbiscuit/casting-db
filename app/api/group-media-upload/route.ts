import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const groupId = formData.get('groupId') as string
  const mediaType = (formData.get('mediaType') as string) || 'photo'
  if (!groupId) return NextResponse.json({ error: 'Missing groupId' }, { status: 400 })

  const svc = await createServiceClient()

  for (const [, value] of formData.entries()) {
    if (!(value instanceof File) || value.size === 0) continue
    const ext = value.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${groupId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error: upErr } = await svc.storage
      .from('group-media')
      .upload(path, await value.arrayBuffer(), { contentType: value.type || 'image/jpeg' })
    if (upErr) { console.error('Group media upload error:', upErr.message); continue }
    const { data: { publicUrl } } = svc.storage.from('group-media').getPublicUrl(path)

    // If no cover photo exists yet, make this one the cover
    const { data: existing } = await svc.from('group_media')
      .select('id').eq('group_id', groupId).eq('is_cover', true).limit(1)
    const isCover = !existing || existing.length === 0

    await svc.from('group_media').insert({
      group_id: groupId,
      storage_path: path,
      public_url: publicUrl,
      media_type: mediaType,
      is_visible: true,
      is_cover: isCover,
    })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { mediaId, storagePath } = await req.json()
  const svc = await createServiceClient()
  if (storagePath) {
    await svc.storage.from('group-media').remove([storagePath])
  }
  await svc.from('group_media').delete().eq('id', mediaId)
  return NextResponse.json({ ok: true })
}
