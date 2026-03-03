import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// Public endpoint — returns only non-sensitive fields for cast sign-in autocomplete
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() || ''
  if (q.length < 2) return NextResponse.json([])

  const supabase = await createServiceClient()
  const parts = q.split(' ').filter(Boolean)
  const firstName = parts[0] || ''
  const lastName = parts[1] || ''

  let query = supabase
    .from('models')
    .select('id, first_name, last_name, agency, based_in')
    .limit(8)

  if (lastName) {
    query = query.or(`first_name.ilike.${firstName}%,last_name.ilike.${lastName}%`)
  } else {
    query = query.or(`first_name.ilike.${firstName}%,last_name.ilike.${firstName}%`)
  }

  const { data } = await query
  const filtered = (data || []).filter(m => {
    const full = (m.first_name + ' ' + m.last_name).toLowerCase()
    return full.includes(q.toLowerCase()) || full.startsWith(firstName.toLowerCase())
  })

  return NextResponse.json(filtered)
}
