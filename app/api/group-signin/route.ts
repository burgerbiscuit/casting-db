import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { groupName, projectId } = await req.json()
  if (!groupName?.trim() || !projectId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const svc = await createServiceClient()

  const { data: group, error } = await svc.from('groups').insert({
    name: groupName.trim(),
    group_type: 'Climbing',
    reviewed: false,
  }).select('id').single()

  if (error || !group) {
    return NextResponse.json({ error: error?.message || 'Failed to create group' }, { status: 500 })
  }

  await svc.from('project_groups').upsert({
    project_id: projectId,
    group_id: group.id,
  }, { onConflict: 'project_id,group_id' })

  return NextResponse.json({ ok: true, groupId: group.id })
}
