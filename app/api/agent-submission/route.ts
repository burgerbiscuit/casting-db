import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const supabase = await createServiceClient()
  const { error } = await supabase.from('agent_submissions').insert({
    first_name: body.first_name,
    last_name: body.last_name,
    agency_name: body.agency_name,
    email: body.email?.toLowerCase(),
    phone: body.phone || null,
    city: body.city || null,
    boards: body.boards || null,
    instagram: body.instagram || null,
    website: body.website || null,
    notes: body.notes || null,
    reviewed: false,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
