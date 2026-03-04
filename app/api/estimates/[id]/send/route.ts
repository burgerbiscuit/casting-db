import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

async function requireTeam(authSupabase: any) {
  const { data: { user } } = await authSupabase.auth.getUser()
  if (!user) return null
  const { data: tm } = await authSupabase.from('team_members').select('id').eq('user_id', user.id).single()
  if (!tm) return null
  return user
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const authSupabase = await createClient()
  const user = await requireTeam(authSupabase)
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createServiceClient()
  const { data: estimate, error } = await supabase
    .from('estimates')
    .select('*, projects(name)')
    .eq('id', params.id)
    .single()

  if (error || !estimate) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const signUrl = `https://cast.tashatongpreecha.com/sign/${estimate.sign_token}`

  const resend = new Resend(process.env.RESEND_API_KEY)
  const projectName = (estimate.projects as any)?.name || 'your project'

  await resend.emails.send({
    from: 'hi@tashatongpreecha.com',
    to: estimate.client_email,
    subject: `Casting Estimate ${estimate.estimate_number} — ${projectName}`,
    html: `
      <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #111;">
        <p style="font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; color: #999; margin-bottom: 32px;">TASHA TONGPREECHA CASTING</p>
        <h1 style="font-size: 24px; font-weight: 300; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 24px;">Casting Estimate</h1>
        <p style="font-size: 14px; line-height: 1.7; color: #333; margin-bottom: 8px;">Hi ${estimate.client_name || 'there'},</p>
        <p style="font-size: 14px; line-height: 1.7; color: #333; margin-bottom: 24px;">
          Please review and sign your casting estimate <strong>${estimate.estimate_number}</strong> for <strong>${projectName}</strong>.
        </p>
        <a href="${signUrl}" style="display: inline-block; background: #000; color: #fff; text-decoration: none; padding: 14px 28px; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase;">
          Review &amp; Sign Estimate
        </a>
        <p style="font-size: 11px; color: #999; margin-top: 32px; line-height: 1.6;">
          Or copy this link:<br>
          <a href="${signUrl}" style="color: #111;">${signUrl}</a>
        </p>
        <p style="font-size: 10px; color: #bbb; margin-top: 40px; border-top: 1px solid #f0f0f0; padding-top: 20px;">
          tasha@tashatongpreecha.com
        </p>
      </div>
    `,
  })

  await supabase.from('estimates').update({ status: 'sent', updated_at: new Date().toISOString() }).eq('id', params.id)

  return NextResponse.json({ ok: true })
}
