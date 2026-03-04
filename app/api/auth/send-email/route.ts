import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'

const RESEND_API_KEY = process.env.RESEND_API_KEY!
const HOOK_SECRET = process.env.AUTH_HOOK_SECRET!
const FROM = 'Tasha Tongpreecha Casting <casting@tashatongpreecha.com>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cast.tashatongpreecha.com'
// Supabase verification endpoint — must use the Supabase project URL, NOT the app URL
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yayrsksrgrsjxcewwwlg.supabase.co'

// Verify Supabase hook signature
function verifySignature(body: string, signature: string | null): boolean {
  if (!signature || !HOOK_SECRET) return false
  try {
    // Supabase sends: v1=<hmac-sha256-hex>
    const parts = signature.split(',')
    for (const part of parts) {
      const [scheme, sig] = part.split('=')
      if (scheme === 'v1') {
        const secret = Buffer.from(HOOK_SECRET.replace('whsec_', ''), 'base64')
        const expected = createHmac('sha256', secret).update(body).digest('hex')
        const actual = Buffer.from(sig, 'hex')
        const exp = Buffer.from(expected, 'hex')
        if (actual.length === exp.length && timingSafeEqual(actual, exp)) return true
      }
    }
    return false
  } catch {
    return false
  }
}

function buildEmailHtml(type: string, confirmationUrl: string, email: string): { subject: string; html: string } {
  const base = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; color: #111;">
      <div style="margin-bottom: 40px;">
        <p style="font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #999; margin: 0;">Tasha Tongpreecha Casting</p>
      </div>
  `
  const footer = `
      <div style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #eee;">
        <p style="font-size: 11px; color: #bbb; margin: 0;">If you didn't request this, you can ignore this email.</p>
      </div>
    </div>
  `
  const btn = (url: string, label: string) => `
    <a href="${url}" style="display: inline-block; background: #111; color: #fff; text-decoration: none; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; padding: 14px 32px; margin: 24px 0;">
      ${label}
    </a>
  `

  if (type === 'magiclink') {
    return {
      subject: 'Your login link — Tasha Tongpreecha Casting',
      html: base + `
        <h1 style="font-size: 22px; font-weight: 300; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 16px;">Log In</h1>
        <p style="font-size: 14px; color: #555; line-height: 1.6;">Click below to access the client portal. This link expires in 1 hour.</p>
        ${btn(confirmationUrl, 'Access Client Portal')}
        <p style="font-size: 11px; color: #999; margin-top: 16px;">Or copy this link: <a href="${confirmationUrl}" style="color: #555;">${confirmationUrl}</a></p>
      ` + footer,
    }
  }

  if (type === 'invite') {
    return {
      subject: "You've been invited — Tasha Tongpreecha Casting",
      html: base + `
        <h1 style="font-size: 22px; font-weight: 300; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 16px;">You're Invited</h1>
        <p style="font-size: 14px; color: #555; line-height: 1.6;">You've been given access to the Tasha Tongpreecha Casting client portal. Click below to set up your account.</p>
        ${btn(confirmationUrl, 'Accept Invitation')}
      ` + footer,
    }
  }

  if (type === 'recovery') {
    return {
      subject: 'Reset your password — Tasha Tongpreecha Casting',
      html: base + `
        <h1 style="font-size: 22px; font-weight: 300; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 16px;">Reset Password</h1>
        <p style="font-size: 14px; color: #555; line-height: 1.6;">Click below to reset your password.</p>
        ${btn(confirmationUrl, 'Reset Password')}
      ` + footer,
    }
  }

  if (type === 'signup' || type === 'email_change') {
    return {
      subject: 'Confirm your email — Tasha Tongpreecha Casting',
      html: base + `
        <h1 style="font-size: 22px; font-weight: 300; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 16px;">Confirm Email</h1>
        <p style="font-size: 14px; color: #555; line-height: 1.6;">Click below to confirm your email address.</p>
        ${btn(confirmationUrl, 'Confirm Email')}
      ` + footer,
    }
  }

  // Fallback
  return {
    subject: 'Action required — Tasha Tongpreecha Casting',
    html: base + `
      <p style="font-size: 14px; color: #555;">Please click the link below to continue:</p>
      ${btn(confirmationUrl, 'Continue')}
    ` + footer,
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-supabase-signature')

  // Verify signature (only if secret is configured)
  if (HOOK_SECRET && !verifySignature(rawBody, signature)) {
    console.error('[send-email hook] Invalid signature')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { user, email_data } = payload
  const email = user?.email
  const type = email_data?.email_action_type
  // token_hash is the correct value for the verify URL; fall back to token
  const token = email_data?.token_hash || email_data?.token
  const redirectTo = email_data?.redirect_to || `${APP_URL}/client`

  if (!email || !token) {
    console.error('[send-email hook] Missing email or token', { email, token })
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Confirmation URL MUST use the Supabase project URL for /auth/v1/verify — not the app URL
  const confirmationUrl = `${SUPABASE_URL}/auth/v1/verify?token=${token}&type=${type}&redirect_to=${encodeURIComponent(redirectTo)}`

  const { subject, html } = buildEmailHtml(type, confirmationUrl, email)

  // Send via Resend
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to: [email], subject, html }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('[send-email hook] Resend error:', err)
    return NextResponse.json({ error: 'Email send failed' }, { status: 500 })
  }

  const data = await res.json()
  console.log('[send-email hook] Sent via Resend:', data.id, 'to:', email, 'type:', type)

  // Must return 200 with empty object for Supabase hook to succeed
  return NextResponse.json({})
}
