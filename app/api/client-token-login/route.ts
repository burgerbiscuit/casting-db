import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { token, password } = await req.json()
  if (!token || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const svc = await createServiceClient()

  // Look up the token record
  const { data: tokenRecord } = await svc
    .from('client_tokens')
    .select('id, user_id, password_display')
    .eq('token', token)
    .single()

  if (!tokenRecord) return NextResponse.json({ error: 'Invalid link' }, { status: 404 })
  if (tokenRecord.password_display !== password) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }

  // Get the internal email for this auth user
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: authUser } = await admin.auth.admin.getUserById(tokenRecord.user_id)
  if (!authUser?.user?.email) return NextResponse.json({ error: 'Auth error' }, { status: 500 })

  // Sign in using the Supabase anon client (so the session is set in cookies properly)
  const signInRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: authUser.user.email, password }),
  })

  if (!signInRes.ok) {
    const err = await signInRes.json()
    return NextResponse.json({ error: err.error_description || 'Sign in failed' }, { status: 401 })
  }

  const session = await signInRes.json()

  // Set Supabase auth cookies manually
  const res = NextResponse.json({ ok: true })
  const cookieOpts = { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 30, sameSite: 'lax' as const }
  res.cookies.set('sb-yayrsksrgrsjxcewwwlg-auth-token', JSON.stringify([session.access_token, session.refresh_token]), cookieOpts)

  return res
}
