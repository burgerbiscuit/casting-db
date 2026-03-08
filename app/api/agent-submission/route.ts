import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { cleanInstagramHandle } from '@/lib/instagram-utils'


const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
function rateLimit(ip: string, max = 5): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 3600_000 })
    return false
  }
  if (entry.count >= max) return true
  entry.count++
  return false
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "unknown"
  if (rateLimit(ip)) return NextResponse.json({ error: "Too many submissions" }, { status: 429 })

  const body = await req.json()

  // Input validation
  if (body.first_name && String(body.first_name).length > 100) return NextResponse.json({ error: "Input too long" }, { status: 400 })
  if (body.last_name && String(body.last_name).length > 100) return NextResponse.json({ error: "Input too long" }, { status: 400 })
  if (body.agency_name && String(body.agency_name).length > 200) return NextResponse.json({ error: "Input too long" }, { status: 400 })
  if (body.email && String(body.email).length > 254) return NextResponse.json({ error: "Input too long" }, { status: 400 })
  if (body.phone && String(body.phone).length > 30) return NextResponse.json({ error: "Input too long" }, { status: 400 })
  if (body.city && String(body.city).length > 100) return NextResponse.json({ error: "Input too long" }, { status: 400 })
  if (body.boards && String(body.boards).length > 200) return NextResponse.json({ error: "Input too long" }, { status: 400 })
  if (body.instagram && String(body.instagram).length > 100) return NextResponse.json({ error: "Input too long" }, { status: 400 })
  if (body.website && String(body.website).length > 500) return NextResponse.json({ error: "Input too long" }, { status: 400 })
  if (body.notes && String(body.notes).length > 2000) return NextResponse.json({ error: "Input too long" }, { status: 400 })
  const supabase = await createServiceClient()
  const { error } = await supabase.from('agent_submissions').insert({
    first_name: body.first_name,
    last_name: body.last_name,
    agency_name: body.agency_name,
    email: body.email?.toLowerCase(),
    phone: body.phone || null,
    city: body.city || null,
    boards: body.boards || null,
    instagram: cleanInstagramHandle(body.instagram),
    website: body.website || null,
    notes: body.notes || null,
    reviewed: false,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
