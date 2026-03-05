import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { presentationId, password } = await req.json()

  if (!presentationId || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { data: presentation } = await supabase
    .from('presentations')
    .select('id, share_password')
    .eq('id', presentationId)
    .single()

  if (!presentation || !presentation.share_password) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (presentation.share_password !== password) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(`share_${presentationId}`, 'true', {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax',
  })
  return res
}
