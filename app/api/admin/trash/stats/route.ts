import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET /api/admin/trash/stats - Get deletion stats
export async function GET(req: NextRequest) {
  const svc = await createServiceClient()

  const { count: deletedCount } = await svc.from('models').select('id', { count: 'exact' }).eq('is_deleted', true)
  const { count: totalCount } = await svc.from('models').select('id', { count: 'exact' })

  // Count media associated with deleted models
  const { data: deletedMedia } = await svc
    .from('model_media')
    .select('id')
    .in('model_id', await svc.from('models').select('id').eq('is_deleted', true).then(r => r.data?.map((m: any) => m.id) || []))

  return NextResponse.json({
    totalDeleted: deletedCount || 0,
    totalModels: totalCount || 0,
    deletedMediaFiles: deletedMedia?.length || 0,
    percentageDeleted: ((deletedCount || 0) / (totalCount || 1) * 100).toFixed(2),
  })
}
