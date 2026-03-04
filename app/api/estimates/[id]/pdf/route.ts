import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const esc = (s = '') => (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
const fmt = (n: number) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })

async function requireTeam(authSupabase: any) {
  const { data: { user } } = await authSupabase.auth.getUser()
  if (!user) return null
  const { data: tm } = await authSupabase.from('team_members').select('id').eq('user_id', user.id).single()
  if (!tm) return null
  return user
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authSupabase = await createClient()
  const user = await requireTeam(authSupabase)
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createServiceClient()
  const { data: estimate, error } = await supabase
    .from('estimates')
    .select('*, projects(name), estimate_items(*)')
    .eq('id', params.id)
    .single()

  if (error || !estimate) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const items = (estimate.estimate_items || []) as any[]
  const projectName = (estimate.projects as any)?.name || ''

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''

  const lineItems: string[] = []
  if (Number(estimate.casting_fee) > 0) {
    lineItems.push(`<tr><td>Casting Fee</td><td style="text-align:center">1</td><td style="text-align:right">${fmt(estimate.casting_fee)}</td><td style="text-align:right">${fmt(estimate.casting_fee)}</td></tr>`)
  }
  if (Number(estimate.talent_budget) > 0) {
    lineItems.push(`<tr><td>Talent Budget</td><td style="text-align:center">1</td><td style="text-align:right">${fmt(estimate.talent_budget)}</td><td style="text-align:right">${fmt(estimate.talent_budget)}</td></tr>`)
  }
  if (Number(estimate.expenses) > 0) {
    lineItems.push(`<tr><td>Expenses</td><td style="text-align:center">1</td><td style="text-align:right">${fmt(estimate.expenses)}</td><td style="text-align:right">${fmt(estimate.expenses)}</td></tr>`)
  }
  items.forEach((item: any) => {
    lineItems.push(`<tr><td>${esc(item.description)}</td><td style="text-align:center">${esc(String(item.quantity))}</td><td style="text-align:right">${fmt(item.rate)}</td><td style="text-align:right">${fmt(item.amount)}</td></tr>`)
  })

  const signatureBlock = estimate.signature_data
    ? `<div class="sig-block"><p class="sig-label">SIGNED</p><img src="${esc(estimate.signature_data)}" style="max-height:80px;max-width:300px;border-bottom:1px solid #111;padding-bottom:8px;" /><p class="sig-date">${formatDate(estimate.signed_at)}</p></div>`
    : `<div class="sig-block"><p class="sig-label">AUTHORIZED SIGNATURE</p><div style="border-bottom:1px solid #111;height:60px;margin-bottom:8px;"></div><div style="display:flex;gap:40px"><div style="flex:1;border-top:1px solid #ddd;padding-top:8px;font-size:8px;letter-spacing:0.2em;text-transform:uppercase;color:#999;">Signature</div><div style="width:140px;border-top:1px solid #ddd;padding-top:8px;font-size:8px;letter-spacing:0.2em;text-transform:uppercase;color:#999;">Date</div></div></div>`

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${esc(estimate.estimate_number || 'Estimate')}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: white; color: #111; padding: 60px; max-width: 800px; margin: 0 auto; }
  @media print { body { padding: 40px; } }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; border-bottom: 2px solid #111; padding-bottom: 24px; }
  .logo { font-size: 9px; letter-spacing: 0.4em; text-transform: uppercase; color: #111; font-weight: 600; }
  .doc-title { font-size: 9px; letter-spacing: 0.4em; text-transform: uppercase; color: #999; margin-top: 6px; }
  .meta { text-align: right; }
  .meta-row { font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase; color: #555; margin-bottom: 4px; }
  .meta-val { color: #111; font-weight: 500; }
  .bill-to { margin-bottom: 40px; }
  .section-label { font-size: 8px; letter-spacing: 0.3em; text-transform: uppercase; color: #999; margin-bottom: 10px; }
  .bill-name { font-size: 16px; font-weight: 300; letter-spacing: 0.1em; margin-bottom: 4px; }
  .bill-email { font-size: 11px; color: #555; letter-spacing: 0.05em; }
  .project-name { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #555; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
  thead th { font-size: 8px; letter-spacing: 0.25em; text-transform: uppercase; color: #999; border-bottom: 1px solid #111; padding: 0 8px 10px; }
  thead th:last-child { text-align: right; }
  thead th:nth-child(2), thead th:nth-child(3) { text-align: center; }
  tbody td { font-size: 12px; padding: 12px 8px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
  .total-row { display: flex; justify-content: flex-end; margin-bottom: 40px; }
  .total-box { border-top: 2px solid #111; padding-top: 12px; min-width: 200px; }
  .total-label { font-size: 8px; letter-spacing: 0.3em; text-transform: uppercase; color: #999; margin-bottom: 6px; }
  .total-amount { font-size: 24px; font-weight: 300; letter-spacing: 0.05em; }
  .notes-section { margin-bottom: 40px; }
  .notes-text { font-size: 12px; line-height: 1.7; color: #555; white-space: pre-wrap; }
  .sig-block { margin-top: 48px; border-top: 1px solid #e0e0e0; padding-top: 32px; }
  .sig-label { font-size: 8px; letter-spacing: 0.3em; text-transform: uppercase; color: #999; margin-bottom: 16px; }
  .sig-date { font-size: 9px; color: #555; letter-spacing: 0.1em; margin-top: 8px; }
  .footer { margin-top: 48px; font-size: 8px; letter-spacing: 0.2em; text-transform: uppercase; color: #bbb; border-top: 1px solid #f0f0f0; padding-top: 20px; }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="logo">Tasha Tongpreecha Casting</div>
    <div class="doc-title">Casting Estimate</div>
  </div>
  <div class="meta">
    <div class="meta-row">Estimate <span class="meta-val">${esc(estimate.estimate_number || '')}</span></div>
    <div class="meta-row">Date <span class="meta-val">${formatDate(estimate.issue_date)}</span></div>
    ${estimate.valid_until ? `<div class="meta-row">Valid Until <span class="meta-val">${formatDate(estimate.valid_until)}</span></div>` : ''}
    <div class="meta-row" style="margin-top:8px;">Status <span class="meta-val" style="text-transform:uppercase;">${esc(estimate.status || 'draft')}</span></div>
  </div>
</div>

<div class="bill-to">
  <p class="section-label">Bill To</p>
  <p class="bill-name">${esc(estimate.client_name || '')}</p>
  ${estimate.client_email ? `<p class="bill-email">${esc(estimate.client_email)}</p>` : ''}
  ${projectName ? `<p class="project-name">${esc(projectName)}</p>` : ''}
</div>

<table>
  <thead>
    <tr>
      <th style="text-align:left">Description</th>
      <th>Qty</th>
      <th>Rate</th>
      <th style="text-align:right">Amount</th>
    </tr>
  </thead>
  <tbody>
    ${lineItems.join('\n    ')}
  </tbody>
</table>

<div class="total-row">
  <div class="total-box">
    <div class="total-label">Total</div>
    <div class="total-amount">${fmt(estimate.subtotal)}</div>
  </div>
</div>

${estimate.notes ? `<div class="notes-section"><p class="section-label">Notes</p><p class="notes-text">${esc(estimate.notes)}</p></div>` : ''}

${signatureBlock}

<div class="footer">tasha@tashatongpreecha.com</div>

<script>window.onload = () => window.print()</script>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': `inline; filename="${esc(estimate.estimate_number || 'estimate')}.pdf"`,
    }
  })
}
