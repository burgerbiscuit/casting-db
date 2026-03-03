import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
  const supabase = await createServiceClient()
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, slug, status, description')
    .eq('slug', slug)
    .single()
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (data.status === 'archived') return NextResponse.json({ error: 'This casting is closed.' }, { status: 410 })
  return NextResponse.json(data)
}
