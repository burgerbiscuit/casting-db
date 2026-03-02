import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

export async function POST(request: NextRequest) {
  // Auth check: must be an authenticated team member
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: member } = await supabase.from('team_members').select('id').eq('user_id', user.id).single()
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { email, name, role } = await request.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const serviceSupabase = await createServiceClient()
  const tempPassword = randomBytes(16).toString('hex')

  try {
    const { data, error } = await serviceSupabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    await serviceSupabase.from('team_members').insert({
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
