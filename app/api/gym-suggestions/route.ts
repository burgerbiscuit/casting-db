import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || ''
  const supabase = await createServiceClient()

  const { data } = await supabase
    .from('models')
    .select('home_gym')
    .eq('source', 'climber')
    .ilike('home_gym', `%${q}%`)
    .not('home_gym', 'is', null)
    .limit(20)

  // Deduplicate and sort
  const gyms = [...new Set((data || []).map((r: any) => r.home_gym).filter(Boolean))].sort()

  return NextResponse.json(gyms)
}
