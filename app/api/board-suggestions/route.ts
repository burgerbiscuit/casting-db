import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.toLowerCase() || ''

  const supabase = await createServiceClient()
  const { data } = await supabase
    .from('agency_contacts')
    .select('board, section')
    .limit(5000)

  const seen = new Set<string>()
  const results: string[] = []

  for (const row of data || []) {
    for (const val of [row.board, row.section]) {
      if (!val) continue
      const trimmed = val.trim()
      // Skip campaign credits (long strings with / separators or brand names)
      if (trimmed.length > 50) continue
      if (trimmed.includes('/') && trimmed.length > 30) continue
      if (!trimmed || seen.has(trimmed.toLowerCase())) continue
      seen.add(trimmed.toLowerCase())
      if (!q || trimmed.toLowerCase().includes(q)) {
        results.push(trimmed)
      }
    }
  }

  results.sort((a, b) => a.localeCompare(b))
  return NextResponse.json(results.slice(0, 20))
}
