import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// DELETE /api/admin/trash/[id] - Permanently delete an item
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const svc = await createServiceClient()
  const { id } = params

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // Hard delete the model
  const { error } = await svc.from('models').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true, message: 'Model permanently deleted' })
}
