import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// GET /api/admin/trash - List soft-deleted items
export async function GET(req: NextRequest) {
  const svc = await createServiceClient()
  
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')
  const type = searchParams.get('type') // 'model', 'presentation', 'project'
  const search = searchParams.get('search')

  let query = svc.from('models').select('id, first_name, last_name, email, deleted_at, created_at, source', { count: 'exact' }).eq('is_deleted', true)

  if (type === 'model') {
    // Already filtering models
  }
  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data, count, error } = await query.order('deleted_at', { ascending: false }).range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const daysUntilPurge = data?.map((m: any) => ({
    ...m,
    daysUntilPurge: Math.max(0, 30 - Math.floor((Date.now() - new Date(m.deleted_at).getTime()) / (1000 * 60 * 60 * 24)))
  }))

  return NextResponse.json({ items: daysUntilPurge, total: count, limit, offset })
}

// POST /api/admin/trash/restore/:id - Restore a deleted model
export async function POST(req: NextRequest) {
  const svc = await createServiceClient()
  const { id } = await req.json()

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await svc.from('models').update({ is_deleted: false, deleted_at: null }).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ ok: true, message: 'Model restored' })
}
