import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceSupabase = await createServiceClient()

  const { data: member } = await serviceSupabase
    .from('team_members').select('id').eq('user_id', user.id).single()
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: clients } = await serviceSupabase
    .from('client_profiles')
    .select('*, client_projects(project_id)')
    .order('created_at', { ascending: false })

  return NextResponse.json(clients || [])
}
