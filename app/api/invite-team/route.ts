import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { email, name, role } = await request.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const supabase = await createServiceClient()

  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: Math.random().toString(36).slice(-12),
      email_confirm: true,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    await supabase.from('team_members').insert({
      user_id: data.user.id,
      name: name || email,
      email,
      role: role || 'member',
    })

    return NextResponse.json({ success: true, userId: data.user.id })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to invite team member' }, { status: 500 })
  }
}
