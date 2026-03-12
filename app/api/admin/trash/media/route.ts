import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET /api/admin/trash/media - List soft-deleted media files
export async function GET(req: NextRequest) {
  const svc = await createServiceClient()
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '100')

  const { data, error } = await svc
    .from('model_media')
    .select('id, model_id, public_url, type, deleted_at, models(first_name, last_name)')
    .eq('is_deleted', true)
    .order('deleted_at', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const items = (data || []).map((m: any) => ({
    ...m,
    daysUntilPurge: Math.max(0, 30 - Math.floor((Date.now() - new Date(m.deleted_at).getTime()) / (1000 * 60 * 60 * 24)))
  }))

  return NextResponse.json({ items })
}

// POST /api/admin/trash/media - Restore a deleted media file
export async function POST(req: NextRequest) {
  const svc = await createServiceClient()
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await svc.from('model_media').update({ is_deleted: false, deleted_at: null }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true })
}

// DELETE /api/admin/trash/media - Permanently delete a media file (removes from storage too)
export async function DELETE(req: NextRequest) {
  const svc = await createServiceClient()
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // Get storage path before deleting
  const { data: media } = await svc.from('model_media').select('storage_path').eq('id', id).single()
  if (media?.storage_path) {
    await svc.storage.from('model-media').remove([media.storage_path])
  }
  await svc.from('model_media').delete().eq('id', id)

  return NextResponse.json({ ok: true })
}
