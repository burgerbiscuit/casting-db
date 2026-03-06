import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const svc = await createServiceClient()
  const { data: isTeam } = await svc.from('team_members').select('id').eq('user_id', user.id).single()
  if (!isTeam) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { projectId, ...payload } = await req.json()
  const { data, error } = await svc.from('projects').update(payload).eq('id', projectId).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, data })
}
