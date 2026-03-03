import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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

  try {
    // inviteUserByEmail sends a real invite email with a magic link
    const { data, error } = await serviceSupabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${(process.env.NEXT_PUBLIC_APP_URL || 'https://cast.tashatongpreecha.com').trim()}/admin`,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Upsert team_members record
    await serviceSupabase.from('team_members').upsert({
      user_id: data.user.id,
      name: name || email,
      email,
      role: role || 'member',
    }, { onConflict: 'user_id' })

    return NextResponse.json({ success: true, userId: data.user.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to invite team member' }, { status: 500 })
  }
}
