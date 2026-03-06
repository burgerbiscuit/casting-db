import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function assertTeamMember() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const svc = await createServiceClient()
  const { data: member } = await svc.from('team_members').select('id').eq('user_id', user.id).single()
  return member ? user : null
}

// POST — upload one or more files
export async function POST(req: NextRequest) {
  const user = await assertTeamMember()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const projectId = formData.get('projectId') as string
  if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 })

  const svc = await createServiceClient()
  const uploaded: any[] = []

  for (const [key, value] of formData.entries()) {
    if (!(value instanceof File) || value.size === 0) continue

    const ext = value.name.split('.').pop()?.toLowerCase() || 'bin'
    const path = `project-files/${projectId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: upErr } = await svc.storage
      .from('model-media')
      .upload(path, await value.arrayBuffer(), { contentType: value.type || 'application/octet-stream' })

    if (upErr) {
      console.error('Project file upload error:', upErr.message)
      continue
    }

    const { data: { publicUrl } } = svc.storage.from('model-media').getPublicUrl(path)

    const { data: record } = await svc.from('project_files').insert({
      project_id: projectId,
      name: value.name,
      storage_path: path,
      public_url: publicUrl,
      file_type: value.type,
    }).select().single()

    if (record) uploaded.push(record)
  }

  return NextResponse.json({ ok: true, files: uploaded })
}

// DELETE — remove a file (project_files or model_media)
export async function DELETE(req: NextRequest) {
  const user = await assertTeamMember()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { fileId, storagePath, bucket = 'model-media', table = 'project_files' } = await req.json()
  const svc = await createServiceClient()

  if (storagePath) await svc.storage.from(bucket).remove([storagePath])
  if (fileId) await svc.from(table).delete().eq('id', fileId)

  return NextResponse.json({ ok: true })
}
