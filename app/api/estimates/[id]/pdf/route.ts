import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const esc = (s?: string | null) => (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
const fmt = (n?: number | null) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }) + ' USD'
const fmtDate = (d?: string | null) => {
  if (!d) return ''
  const dt = new Date(d)
  return dt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

async function requireTeam(authSupabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never) {
  const { data: { user } } = await (authSupabase as any).auth.getUser()
  if (!user) return null
  const { data: tm } = await (authSupabase as any).from('team_members').select('id').eq('user_id', user.id).single()
  return tm ? user : null
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authSupabase = await createClient()
  const user = await requireTeam(authSupabase as any)
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createServiceClient()
  const { data: est } = await supabase.from('estimates').select('*, projects(name, shoot_date)').eq('id', params.id).single()
  if (!est) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const projectName = (est.projects as any)?.name || ''
  const shootDate = (est.projects as any)?.shoot_date || ''
  const titleParts = [projectName ? projectName.toUpperCase() : '', fmtDate(shootDate).toUpperCase()].filter(Boolean)
  const titleLine = titleParts.length ? ' - ' + titleParts.join(' ') : ''

  const billingHtml = [
    est.billing_contact_name ? 'Billing contact name: ' + esc(est.billing_contact_name) : '',
    est.billing_contact_phone ? 'Phone number: ' + esc(est.billing_contact_phone) : '',
    est.billing_contact_email ? 'Email: <a href="mailto:' + esc(est.billing_contact_email) + '">' + esc(est.billing_contact_email) + '</a>' : '',
    est.billing_contact_address ? 'Address: ' + esc(est.billing_contact_address) : '',
  ].filter(Boolean).map(l => '<p>' + l + '</p>').join('\n')

  const sigBlock = est.signature_data
    ? '<img src="' + esc(est.signature_data as string) + '" style="max-height:60px;max-width:220px;display:block;" />'
      + '<p style="font-size:9px;color:#555;margin-top:4px;">Signed'
      + (est.signer_name ? ' by ' + esc(est.signer_name as string) : '') + ' on '
      + new Date(est.signed_at as string).toLocaleDateString('en-US', {year:'numeric',month:'long',day:'numeric'}) + '</p>'
    : `<table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;border-bottom:1px solid #111;font-size:11px;color:#555;width:80px;">Name</td><td style="padding:8px 0;border-bottom:1px solid #111;"></td></tr>
        <tr><td style="padding:16px 0 8px;border-bottom:1px solid #111;font-size:11px;color:#555;">Title</td><td style="border-bottom:1px solid #111;"></td></tr>
        <tr><td style="padding:16px 0 8px;border-bottom:1px solid #111;font-size:11px;color:#555;">Company</td><td style="border-bottom:1px solid #111;"></td></tr>
        <tr><td style="padding:16px 0 8px;border-bottom:1px solid #111;font-size:11px;color:#555;">Signature</td><td style="border-bottom:1px solid #111;"></td></tr>
        <tr><td style="padding:16px 0 8px;border-bottom:1px solid #111;font-size:11px;color:#555;">Date</td><td style="border-bottom:1px solid #111;"></td></tr>
       </table>`

  const notesHtml = est.notes ? '<p style="margin-top:16px;font-size:10px;color:#555;line-height:1.6;">' + esc(est.notes as string) + '</p>' : ''

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Casting Estimate</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: white; color: #111; padding: 56px 64px; max-width: 850px; margin: 0 auto; font-size: 11px; }
  @media print { body { padding: 40px 48px; } }
  .header-brand { text-align: center; font-size: 13px; letter-spacing: 0.35em; text-transform: uppercase; padding-bottom: 10px; border-bottom: 2px solid #111; margin-bottom: 20px; }
  .header-brand span { font-weight: 700; }
  .doc-title { text-align: center; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; font-weight: 600; margin-bottom: 28px; }
  .billing-contact { margin-bottom: 36px; }
  .billing-contact .label { font-size: 10px; font-weight: 700; margin-bottom: 4px; }
  .billing-contact p { font-size: 11px; line-height: 1.7; }
  .billing-contact a { color: #1a56db; }
  .main-layout { display: flex; gap: 48px; align-items: flex-start; margin-bottom: 48px; }
  .main-left { flex: 1; }
  .main-right { flex: 0 0 260px; }
  .fee-table { width: 100%; border-collapse: collapse; }
  .fee-table thead th { background: #d0d0d0; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 8px 12px; border: 1px solid #999; }
  .fee-table thead th:last-child { text-align: right; }
  .fee-table tbody td { padding: 12px; border: 1px solid #ccc; font-size: 11px; line-height: 1.6; vertical-align: top; white-space: pre-wrap; }
  .fee-table tfoot td { padding: 8px 12px; border: 1px solid #ccc; font-size: 11px; font-weight: 600; }
  .fee-table tfoot td:last-child { text-align: right; }
  .terms { margin-top: 48px; border-top: 1px solid #ccc; padding-top: 24px; }
  .terms-title { font-size: 11px; font-weight: 700; margin-bottom: 16px; }
  .term-head { font-size: 10px; font-weight: 700; margin-top: 14px; margin-bottom: 4px; }
  .term-body { font-size: 9.5px; line-height: 1.6; color: #333; }
</style>
</head>
<body>

<div class="header-brand">TASHA TONGPREECHA <span>CASTING</span></div>
<div class="doc-title">TASHA TONGPREECHA CASTING ESTIMATE` + titleLine + `</div>

<div class="billing-contact">
  <p class="label">BILLING CONTACT</p>
  ` + billingHtml + `
</div>

<div class="main-layout">
  <div class="main-left">
    <table class="fee-table">
      <thead><tr><th style="text-align:left;width:70%">CASTING DIRECTOR</th><th>FEE</th></tr></thead>
      <tbody><tr>
        <td>` + esc(est.scope_description as string || 'Casting Director fee') + `</td>
        <td style="text-align:right;white-space:nowrap;">` + fmt(est.casting_fee as number) + `</td>
      </tr></tbody>
      <tfoot><tr><td>Total</td><td>` + fmt(est.casting_fee as number) + `</td></tr></tfoot>
    </table>
    ` + notesHtml + `
  </div>
  <div class="main-right">` + sigBlock + `</div>
</div>

<div class="terms">
  <p class="terms-title">TERMS &amp; CONDITIONS</p>
  <p class="term-head">Scope &amp; Overages</p>
  <p class="term-body">This estimate is based on the specs shared. Any change in scope, including added shoot days, deliverables, usage, or altered casting criteria — may result in additional fees ("Overages"). Overages will be communicated in writing and require written approval before proceeding.</p>
  <p class="term-head">Payment Terms</p>
  <p class="term-body">• Final balance due within 30 days of final invoice.<br>• Late payments incur a 2% monthly finance charge.</p>
  <p class="term-head">Cancellations / Postponements</p>
  <p class="term-body">If casting has begun, 50% of the casting fee is due even if the project is canceled.<br>If cancellation occurs within 48 hours of the scheduled casting, 100% of fees and confirmed vendor costs apply.<br>If project is delayed or paused by client beyond the original timeline, additional hold fees may apply.</p>
  <p class="term-head">Usage &amp; Talent Liability</p>
  <p class="term-body">Casting Director provides talent options and recommendations in good faith but is not responsible for talent performance or final usage rights negotiated directly with talent agents or production.</p>
  <p class="term-head">Portfolio Rights</p>
  <p class="term-body">Casting Director may use non-confidential imagery or footage from the casting session for archival and portfolio purposes unless otherwise agreed in writing.</p>
</div>

<script>window.onload = () => window.print()</script>
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' }
  })
}
