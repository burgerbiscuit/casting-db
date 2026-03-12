import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Registers a media file that was uploaded directly to Supabase storage
// (used for videos to bypass Vercel's 4.5MB body limit)
export async function POST(req: NextRequest) {
  const { modelId, storagePath, publicUrl, type } = await req.json()
  if (!modelId || !storagePath || !publicUrl) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const svc = await createServiceClient()
  const { error } = await svc.from('model_media').insert({
    model_id: modelId,
    storage_path: storagePath,
    public_url: publicUrl,
    type: type || 'video',
    is_visible: true,
    uploaded_at: new Date().toISOString(),
  })

  if (error) {
    console.error('model-media-register error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
