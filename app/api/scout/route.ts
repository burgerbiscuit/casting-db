import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json()
  const supabase = createServiceClient()
  const { error } = await supabase.from('models').insert({
    first_name: body.first_name,
    last_name: body.last_name,
    email: body.email,
    phone: body.phone,
    gender: body.gender,
    date_of_birth: body.date_of_birth || null,
    instagram_handle: body.instagram_handle,
    portfolio_url: body.portfolio_url,
    agency: body.agency,
    height_ft: body.height_ft ? parseInt(body.height_ft) : null,
    height_in: body.height_in ? parseInt(body.height_in) : null,
    bust: body.bust,
    waist: body.waist,
    hips: body.hips,
    chest: body.chest,
    dress_size: body.dress_size,
    shoe_size: body.shoe_size,
    suit_size: body.suit_size,
    skills: body.skills,
    notes: body.notes,
    source: 'scouting',
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
