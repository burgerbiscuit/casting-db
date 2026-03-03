import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Scout submissions create a model in the general database only — NOT linked to any project.
// Models must sign into a casting (/cast/[slug]) to be linked to a project.
// In-memory rate limit: max 5 submissions per IP per hour
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 3600_000 })
    return true
  }
  if (entry.count >= 5) return false
  entry.count++
  return true
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many submissions. Please try again later.' }, { status: 429 })
  }

  const body = await req.json()

  // Validate required fields
  const firstName = (body.first_name || '').trim()
  const lastName = (body.last_name || '').trim()
  if (!firstName || !lastName) {
    return NextResponse.json({ error: 'First name and last name are required.' }, { status: 400 })
  }
  if (firstName.length > 100 || lastName.length > 100) {
    return NextResponse.json({ error: 'Name fields are too long.' }, { status: 400 })
  }
  if (body.email && !EMAIL_RE.test(body.email)) {
    return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
  }

  const supabase = await createServiceClient()
  const { data, error } = await supabase.from('models').insert({
    first_name: firstName,
    last_name: lastName,
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
    reviewed: false,
    board: body.board || null,
    agent_name: body.agent_name || null,
  }).select('id').single()

  if (error) {
    console.error('Scout insert error:', error.message)
    return NextResponse.json({ error: 'Submission failed. Please try again.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true, id: data.id })
}
