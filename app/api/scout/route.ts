import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json()
  const supabase = createServiceClient()
  const { data, error } = await supabase.from('models').insert({
    first_name: body.first_name,
    last_name: body.last_name,
    email: body.email || null,
    phone: body.phone || null,
    gender: body.gender || null,
    date_of_birth: body.date_of_birth || null,
    instagram_handle: body.instagram_handle || null,
    portfolio_url: body.portfolio_url || null,
    website_url: body.website_url || null,
    agency: body.agency || null,
    based_in: body.based_in || null,
    height_ft: body.height_ft ? parseInt(body.height_ft) : null,
    height_in: body.height_in ? parseInt(body.height_in) : null,
    bust: body.bust || null, waist: body.waist || null, hips: body.hips || null,
    chest: body.chest || null, dress_size: body.dress_size || null,
    shoe_size: body.shoe_size || null, suit_size: body.suit_size || null, inseam: body.inseam || null,
    ethnicity_broad: body.ethnicity_broad || null,
    ethnicity_specific: body.ethnicity_specific || null,
    languages: Array.isArray(body.languages) ? body.languages : [],
    skills: Array.isArray(body.skills) ? body.skills : [],
    hobbies: Array.isArray(body.hobbies) ? body.hobbies : [],
    notes: body.notes || null,
    source: 'scouting',
  }).select('id').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, id: data.id })
}
