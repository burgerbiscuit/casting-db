import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { presentationId, projectId, password } = await req.json()

  if ((!presentationId && !projectId) || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  if (projectId) {
    const { data: project } = await supabase
      .from('projects')
      .select('id, share_password')
      .eq('id', projectId)
      .single()

    if (!project || !project.share_password) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (project.share_password !== password) {
      return NextResponse.json({ error: 'Wrong password' }, { status: 401 })
    }

    // Also set share cookies for all presentations in this project
    const { data: presentations } = await supabase
      .from('presentations')
      .select('id')
      .eq('project_id', projectId)

    const res = NextResponse.json({ ok: true })
    res.cookies.set(`share_project_${projectId}`, 'true', {
      httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax',
    })
    for (const pres of presentations || []) {
      res.cookies.set(`share_${pres.id}`, 'true', {
        httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax',
      })
    }
    return res
  }

  // Presentation share
  const { data: presentation } = await supabase
    .from('presentations')
    .select('id, share_password')
    .eq('id', presentationId)
    .single()

  if (!presentation || !presentation.share_password) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (presentation.share_password !== password) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(`share_${presentationId}`, 'true', {
    httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax',
  })
  return res
}
