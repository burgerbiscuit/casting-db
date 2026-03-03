import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const APP_URL = 'https://cast.tashatongpreecha.com'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: member } = await supabase.from('team_members').select('id').eq('user_id', user.id).single()
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { email, name, projectIds = [], note = '' } = await request.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const serviceSupabase = await createServiceClient()

  try {
    // Check if user already exists
    const { data: existingUsers } = await serviceSupabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())

    let userId: string

    if (existingUser) {
      // User already exists — send them a magic link to log in
      userId = existingUser.id
      await serviceSupabase.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: { redirectTo: APP_URL + '/client' },
      })
    } else {
      // New user — send invite
      const { data, error } = await serviceSupabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: APP_URL + '/client',
      })
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      userId = data.user.id
    }

    // Create/update client profile
    await serviceSupabase.from('client_profiles').upsert({
      user_id: userId,
      name: name || email,
      email,
    }, { onConflict: 'user_id' })

    // Auto-assign projects
    if (projectIds.length > 0) {
      const rows = projectIds.map((pid: string) => ({ client_id: userId, project_id: pid }))
      await serviceSupabase.from('client_projects').upsert(rows, { onConflict: 'client_id,project_id' })
    }

    // Send branded email via Resend if key available
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      const { Resend } = await import('resend')
      const resend = new Resend(resendKey)
      const firstName = (name || email).split(' ')[0]
      await resend.emails.send({
        from: 'Tasha Tongpreecha Casting <hi@tashatongpreecha.com>',
        to: email,
        subject: "You've been invited to view a casting presentation",
        html: buildInviteEmail(firstName, APP_URL + '/client', note),
      })
    } else {
      // No Resend key — send password reset so they can set a password and log in
      await serviceSupabase.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: { redirectTo: APP_URL + '/client/reset-password' },
      })
    }

    return NextResponse.json({ success: true, userId, alreadyExisted: !!existingUser })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to invite client' }, { status: 500 })
  }
}

function buildInviteEmail(name: string, loginUrl: string, note: string): string {
  const noteBlock = note
    ? '<div style="background:#f5f5f5;padding:16px;font-size:13px;color:#444;margin-bottom:28px;border-left:2px solid #111;">' + note + '</div>'
    : ''
  return '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Helvetica Neue,Helvetica,Arial,sans-serif;background:#fff;color:#111;margin:0;padding:0;">'
    + '<div style="max-width:560px;margin:60px auto;padding:0 24px;">'
    + '<div style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#888;margin-bottom:48px;">TASHA TONGPREECHA <strong style="color:#111;">CASTING</strong></div>'
    + '<h1 style="font-size:22px;font-weight:300;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 16px;">You\'ve been invited</h1>'
    + '<p style="font-size:14px;line-height:1.7;color:#555;margin:0 0 20px;">Hi ' + name + ',</p>'
    + '<p style="font-size:14px;line-height:1.7;color:#555;margin:0 0 20px;">You\'ve been given access to a casting presentation by Tasha Tongpreecha Casting.</p>'
    + noteBlock
    + '<a href="' + loginUrl + '" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:14px 32px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">View Casting &rarr;</a>'
    + '<div style="margin-top:48px;font-size:11px;color:#bbb;">Tasha Tongpreecha Casting &middot; <a href="https://www.tashatongpreecha.com" style="color:#bbb;">tashatongpreecha.com</a></div>'
    + '</div></body></html>'
}
