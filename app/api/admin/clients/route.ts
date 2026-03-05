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

  // Fetch client profiles
  const { data: profiles } = await serviceSupabase
    .from('client_profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (!profiles) return NextResponse.json([])

  // Fetch all client_projects (client_id = auth user_id, matches client_profiles.user_id)
  const { data: clientProjects } = await serviceSupabase
    .from('client_projects')
    .select('client_id, project_id')

  // Merge: attach client_projects array to each profile by user_id
  const projectsByUser: Record<string, { project_id: string }[]> = {}
  for (const cp of clientProjects || []) {
    if (!projectsByUser[cp.client_id]) projectsByUser[cp.client_id] = []
    projectsByUser[cp.client_id].push({ project_id: cp.project_id })
  }

  const merged = profiles.map(p => ({
    ...p,
    client_projects: projectsByUser[p.user_id] || [],
  }))

  return NextResponse.json(merged)
}
