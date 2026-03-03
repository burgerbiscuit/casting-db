import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const TASHA_USER_ID = '328944d5-bf72-424d-874b-8f21b363464a'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.id !== TASHA_USER_ID) {
    return NextResponse.json({ error: 'Only Tasha can remove team members.' }, { status: 403 })
  }

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const serviceSupabase = await createServiceClient()

  // Don't allow removing Tasha herself
  const { data: member } = await serviceSupabase.from('team_members').select('user_id').eq('id', id).single()
  if (member?.user_id === TASHA_USER_ID) {
    return NextResponse.json({ error: 'Cannot remove the owner.' }, { status: 400 })
  }

  await serviceSupabase.from('team_members').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
