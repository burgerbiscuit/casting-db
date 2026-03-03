import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  // Fetch all contacts in batches to bypass PostgREST row limit
  let all: any[] = []
  let from = 0
  const batchSize = 1000
  while (true) {
    const { data, error } = await supabase
      .from('agency_contacts')
      .select('*')
      .order('agency_name')
      .range(from, from + batchSize - 1)
    if (error || !data || data.length === 0) break
    all = all.concat(data)
    if (data.length < batchSize) break
    from += batchSize
  }
  return NextResponse.json(all)
}
