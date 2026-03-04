import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.toLowerCase() || ''
  if (!q) return NextResponse.json([])

  const supabase = await createServiceClient()
  const { data } = await supabase
    .from('agency_contacts')
    .select('agency_name')
    .ilike('agency_name', `%${q}%`)
    .limit(500)

  const seen = new Set<string>()
  const results: string[] = []

  for (const row of data || []) {
    const name = row.agency_name?.trim()
    if (!name || seen.has(name.toLowerCase())) continue
    seen.add(name.toLowerCase())
    results.push(name)
  }

  results.sort((a, b) => a.localeCompare(b))
  return NextResponse.json(results.slice(0, 20))
}
