import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')

  if (!name) return NextResponse.json({ error: 'Missing name' }, { status: 400 })

  // Auth check
  const authSupabase = await createClient()
  const { data: { user } } = await authSupabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createServiceClient()
  const { data: agency } = await supabase
    .from('agencies')
    .select('email, name')
    .ilike('name', name)
    .single()

  if (!agency) return NextResponse.json({ email: null })
  return NextResponse.json({ email: agency.email || null })
}
