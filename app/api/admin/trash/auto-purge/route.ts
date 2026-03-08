import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// POST /api/admin/trash/auto-purge - Permanently delete items older than 30 days
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-api-key')
  
  // Protect with API key (set in .env.local as TRASH_PURGE_SECRET)
  if (secret !== process.env.TRASH_PURGE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const svc = await createServiceClient()

  // Find models deleted > 30 days ago
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: toPurge, error: selectErr } = await svc
    .from('models')
    .select('id')
    .eq('is_deleted', true)
    .lt('deleted_at', thirtyDaysAgo)

  if (selectErr) return NextResponse.json({ error: selectErr.message }, { status: 400 })

  const purgeIds = toPurge?.map((m: any) => m.id) || []

  if (purgeIds.length === 0) {
    return NextResponse.json({ ok: true, message: 'No items to purge', purged: 0 })
  }

  // Hard delete these models
  const { error: deleteErr } = await svc.from('models').delete().in('id', purgeIds)

  if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 400 })

  return NextResponse.json({
    ok: true,
    message: `Permanently purged ${purgeIds.length} models`,
    purged: purgeIds.length,
    timestamp: new Date().toISOString(),
  })
}
