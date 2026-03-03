import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { presentationId } = await req.json()
  const serviceSupabase = await createServiceClient()

  const { data: pres } = await serviceSupabase
    .from('presentations')
    .select('*, projects(name, client_name)')
    .eq('id', presentationId)
    .single()

  if (!pres) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: clientProjects } = await serviceSupabase
    .from('client_projects')
    .select('client_profiles(name, email)')
    .eq('project_id', pres.project_id)

  const clients = (clientProjects || [])
    .map((cp: any) => cp.client_profiles)
    .filter((c: any) => c?.email)

  if (!clients.length) return NextResponse.json({ error: 'No clients assigned to this project' }, { status: 400 })

  const resend = new Resend(process.env.RESEND_API_KEY)
  const appUrl = 'https://cast.tashatongpreecha.com'
  const presentationUrl = `${appUrl}/client/presentations/${presentationId}`
  const projectName = pres.projects?.name || pres.name
  const clientName = pres.projects?.client_name || ''

  const results = []
  for (const client of clients) {
    const { data, error } = await resend.emails.send({
      from: 'Tasha Tongpreecha Casting <casting@tashatongpreecha.com>',
      to: client.email,
      subject: `Presentation Ready: ${projectName}`,
      html: `
        <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:48px 24px;background:#fff;color:#1a1a1a;">
          <img src="${appUrl}/logo.jpg" alt="Tasha Tongpreecha Casting" style="height:28px;margin-bottom:40px;" />
          <p style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#999;margin-bottom:8px;">New Presentation</p>
          <h1 style="font-size:22px;font-weight:300;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 24px 0;">${projectName}</h1>
          <p style="font-size:14px;line-height:1.6;color:#555;margin-bottom:32px;">
            Hi${clientName ? ' ' + clientName : ''},<br><br>
            Your presentation is ready. Click below to view talent, add notes, and build your shortlist.
          </p>
          <a href="${presentationUrl}" style="display:inline-block;background:#000;color:#fff;text-decoration:none;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;padding:14px 32px;">View Presentation</a>
          <p style="font-size:12px;color:#aaa;margin-top:48px;border-top:1px solid #f0f0f0;padding-top:24px;">
            cast.tashatongpreecha.com · <a href="https://www.tashatongpreecha.com" style="color:#aaa;">tashatongpreecha.com</a>
          </p>
        </div>
      `,
    })
    results.push({ email: client.email, sent: !error, error: error?.message })
  }

  return NextResponse.json({ sent: results.filter(r => r.sent).length, total: clients.length, results })
}
