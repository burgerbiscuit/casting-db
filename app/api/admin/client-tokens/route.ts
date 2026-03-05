import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// Service client with admin auth capabilities
function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function assertTeamMember() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const svc = await createServiceClient()
  const { data: member } = await svc.from('team_members').select('id').eq('user_id', user.id).single()
  return member ? user : null
}

// GET — list all client tokens
export async function GET() {
  const user = await assertTeamMember()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const svc = await createServiceClient()
  const { data, error } = await svc
    .from('client_tokens')
    .select('id, token, name, email, password_display, project_ids, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch project names for display
  const { data: projects } = await svc.from('projects').select('id, name')
  const projectMap: Record<string, string> = {}
  ;(projects || []).forEach((p: any) => { projectMap[p.id] = p.name })

  const enriched = (data || []).map((t: any) => ({
    ...t,
    project_names: (t.project_ids || []).map((id: string) => projectMap[id] || id),
  }))

  return NextResponse.json(enriched)
}

function generatePassword() {
  const words = ['coral','stone','ivory','cedar','amber','slate','pearl','linen','dusk','mist','sand','ink']
  const digits = Math.floor(100 + Math.random() * 900)
  const w1 = words[Math.floor(Math.random() * words.length)]
  const w2 = words[Math.floor(Math.random() * words.length)]
  return `${w1}-${w2}-${digits}`
}

// POST — create a new client token
export async function POST(req: NextRequest) {
  const user = await assertTeamMember()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, email, password, projectIds } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const admin = getAdminClient()
  const svc = await createServiceClient()

  const finalPassword = password?.trim() || generatePassword()

  // Generate a unique internal email for the backing Supabase auth user
  const uniqueSuffix = Math.random().toString(36).slice(2, 10)
  const internalEmail = `client-${uniqueSuffix}@internal.cast`

  // Create Supabase auth user (invisible to client)
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: internalEmail,
    password: finalPassword,
    email_confirm: true,
    user_metadata: { display_name: name, is_token_client: true },
  })

  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  const authUserId = authData.user.id

  // Create client_profile so existing project/shortlist code works
  await svc.from('client_profiles').insert({
    user_id: authUserId,
    name: name.trim(),
    email: email?.trim() || internalEmail,
  })

  // Link to projects
  if (projectIds?.length) {
    await svc.from('client_projects').insert(
      projectIds.map((pid: string) => ({ client_id: authUserId, project_id: pid }))
    )
  }

  // Create the token record
  const { data: tokenData, error: tokenError } = await svc
    .from('client_tokens')
    .insert({
      name: name.trim(),
      email: email?.trim() || null,
      password_display: finalPassword,
      user_id: authUserId,
      project_ids: projectIds || [],
    })
    .select()
    .single()

  if (tokenError) {
    // Rollback auth user if token creation failed
    await admin.auth.admin.deleteUser(authUserId)
    return NextResponse.json({ error: tokenError.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    token: tokenData,
    link: `${process.env.NEXT_PUBLIC_APP_URL}/client/access/${tokenData.token}`,
    password: finalPassword,
  })
}

// PATCH — update project access for a token
export async function PATCH(req: NextRequest) {
  const user = await assertTeamMember()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tokenId, projectIds, password } = await req.json()
  const svc = await createServiceClient()

  // Get existing token
  const { data: existing } = await svc.from('client_tokens').select('user_id, password_display').eq('id', tokenId).single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updates: any = {}
  if (projectIds !== undefined) {
    updates.project_ids = projectIds
    // Sync client_projects
    await svc.from('client_projects').delete().eq('client_id', existing.user_id)
    if (projectIds.length) {
      await svc.from('client_projects').insert(
        projectIds.map((pid: string) => ({ client_id: existing.user_id, project_id: pid }))
      )
    }
  }

  if (password?.trim()) {
    updates.password_display = password.trim()
    // Update Supabase auth password
    const admin = getAdminClient()
    await admin.auth.admin.updateUserById(existing.user_id, { password: password.trim() })
  }

  await svc.from('client_tokens').update(updates).eq('id', tokenId)

  return NextResponse.json({ ok: true })
}

// DELETE — remove a client token and its auth user
export async function DELETE(req: NextRequest) {
  const user = await assertTeamMember()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tokenId } = await req.json()
  const svc = await createServiceClient()
  const admin = getAdminClient()

  const { data: existing } = await svc.from('client_tokens').select('user_id').eq('id', tokenId).single()
  if (existing?.user_id) {
    await admin.auth.admin.deleteUser(existing.user_id) // cascades to client_profile + client_projects
  }
  await svc.from('client_tokens').delete().eq('id', tokenId)

  return NextResponse.json({ ok: true })
}
