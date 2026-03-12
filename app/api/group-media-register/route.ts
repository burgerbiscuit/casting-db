import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Registers a media file that was uploaded directly to Supabase storage
export async function POST(req: NextRequest) {
  const { groupId, storagePath, publicUrl, mediaType } = await req.json()
  if (!groupId || !storagePath || !publicUrl) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const svc = await createServiceClient()

  // If no cover photo exists yet, make this one the cover
  const { data: existing } = await svc.from('group_media')
    .select('id').eq('group_id', groupId).eq('is_cover', true).limit(1)
  const isCover = !existing || existing.length === 0

  const { error } = await svc.from('group_media').insert({
    group_id: groupId,
    storage_path: storagePath,
    public_url: publicUrl,
    media_type: mediaType || 'photo',
    is_visible: true,
    is_cover: isCover,
  })

  if (error) {
    console.error('group-media-register error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
