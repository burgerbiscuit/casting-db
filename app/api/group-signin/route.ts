import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { groupName, projectId, groupData } = body

  if (!groupName?.trim() || !projectId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const svc = await createServiceClient()

  const { data: group, error } = await svc.from('groups').insert({
    name: groupName.trim(),
    group_type: groupData?.group_type || null,
    size: groupData?.size || null,
    based_in: groupData?.based_in || null,
    agency: groupData?.agency || null,
    instagram_handle: groupData?.instagram_handle || null,
    website: groupData?.website || null,
    description: groupData?.description || null,
    group_story: groupData?.group_story || null,
    contact_name: groupData?.contact_name || null,
    contact_email: groupData?.contact_email || null,
    contact_phone: groupData?.contact_phone || null,
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
