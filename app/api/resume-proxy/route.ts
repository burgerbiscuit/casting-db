import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // Must be a logged-in team member
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const svc = await createServiceClient()
  const { data: member } = await svc.from('team_members').select('id').eq('user_id', user.id).single()
  if (!member) return new NextResponse('Forbidden', { status: 403 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return new NextResponse('Missing id', { status: 400 })

  // Get the submission
  const { data: submission } = await svc
    .from('assistant_submissions')
    .select('resume_storage_path, first_name, last_name')
    .eq('id', id)
    .single()

  if (!submission?.resume_storage_path) {
    return new NextResponse('No resume found', { status: 404 })
  }

  // Download from storage
  const { data, error } = await svc.storage
    .from('resumes')
    .download(submission.resume_storage_path)

  if (error || !data) {
    return new NextResponse('Failed to fetch resume', { status: 500 })
  }

  const buffer = await data.arrayBuffer()
  const filename = `${submission.first_name}_${submission.last_name}_Resume.pdf`

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
