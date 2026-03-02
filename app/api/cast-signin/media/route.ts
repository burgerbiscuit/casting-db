import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { modelId, storagePath, publicUrl } = await req.json()
  if (!modelId || !storagePath || !publicUrl) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  const supabase = await createServiceClient()
  await supabase.from('model_media').insert({
    model_id: modelId,
    storage_path: storagePath,
    public_url: publicUrl,
    type: 'photo',
    is_visible: true,
  })
  return NextResponse.json({ ok: true })
}
