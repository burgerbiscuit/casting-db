import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const esc = (s = '') => (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
const fmtDate = (d: string) => {
  if (!d) return ''
  try { return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) } catch { return d }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params  // presentation id
  const host = request.headers.get('host') || 'cast.tashatongpreecha.com'
  const proto = host.includes('localhost') ? 'http' : 'https'
  const baseUrl = `${proto}://${host}`

  try {
    const authSupabase = await createClient()
    const { data: { user } } = await authSupabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: member } = await authSupabase.from('team_members').select('id').eq('user_id', user.id).single()
    if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const supabase = await createServiceClient()

    const { data: presentation } = await supabase
      .from('presentations').select('*, projects(id, name, shoot_date, model_rate, usage, photographer, stylist, location)')
      .eq('id', id).single()
    if (!presentation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const project = presentation.projects as any

    const { data: projectModels } = await supabase
      .from('project_models')
      .select('*, models(id, first_name, last_name, agency, height_ft, height_in, bust, waist, hips, shoe_size, dress_size)')
      .eq('project_id', project.id)
      .eq('admin_confirmed', true)
      .eq('chart_hidden', false)

    const confirmed = projectModels || []
    const modelIds = confirmed.map((pm: any) => pm.models?.id).filter(Boolean)

    const { data: photos } = modelIds.length > 0 ? await supabase
      .from('model_media').select('model_id, public_url')
      .in('model_id', modelIds).eq('is_visible', true).eq('type', 'photo').order('display_order') : { data: [] }
    const photoMap: Record<string, string> = {}
    ;(photos || []).forEach((p: any) => { if (!photoMap[p.model_id]) photoMap[p.model_id] = p.public_url })

    const agencies = [...new Set(confirmed.map((pm: any) => pm.models?.agency).filter(Boolean))] as string[]
    const { data: agentContacts } = agencies.length > 0 ? await supabase
      .from('agency_contacts').select('agency_name, agent_name, email, cell_phone, office_phone, is_main_contact')
      .in('agency_name', agencies).eq('contact_type', 'model')
      .order('is_main_contact', { ascending: false }) : { data: [] }
    const agentMap: Record<string, any> = {}
    ;(agentContacts || []).forEach((ac: any) => {
      const key = (ac.agency_name || '').toLowerCase()
      if (!agentMap[key] || ac.is_main_contact) agentMap[key] = ac
    })

    const shootDate = project.shoot_date ? fmtDate(project.shoot_date) : ''
    const projectLabel = [project.name, shootDate, project.location].filter(Boolean).join('  ·  ').toUpperCase()

    const rows = confirmed.map((pm: any) => {
      const model = pm.models
      const photo = photoMap[model?.id]
      const agent = agentMap[(model?.agency || '').toLowerCase()]
      const sizing: string[] = []
      if (model?.height_ft) sizing.push(`${model.height_ft}'${model.height_in ?? 0}"`)
      if (model?.bust) sizing.push(`Bust: ${model.bust}`)
      if (model?.waist) sizing.push(`Waist: ${model.waist}`)
      if (model?.hips) sizing.push(`Hips: ${model.hips}`)
      if (model?.shoe_size) sizing.push(`Shoe: ${model.shoe_size}`)
      if (model?.dress_size) sizing.push(`Dress: ${model.dress_size}`)

      const displayRate = pm.pm_rate || project.model_rate || ''
      const displayDate = pm.confirmed_date || shootDate || ''
      const displayUsage = pm.confirmed_usage || project.usage || ''

      return `<tr>
        <td class="c-photo">${photo ? `<img src="${esc(photo)}" />` : ''}</td>
        <td class="c-name">
          <b>${esc((model?.first_name || '').toUpperCase())} ${esc((model?.last_name || '').toUpperCase())}</b>
          ${pm.pm_option ? `<br><span class="sub">${esc(pm.pm_option)}</span>` : ''}
        </td>
        <td class="c-contact">
          ${model?.agency ? `<b>${esc(model.agency)}</b><br>` : ''}
          ${agent?.agent_name ? `${esc(agent.agent_name)}<br>` : ''}
          ${agent?.email ? `<span class="sub">${esc(agent.email)}</span><br>` : ''}
          ${agent?.cell_phone ? `<span class="sub">C: ${esc(agent.cell_phone)}</span><br>` : ''}
          ${agent?.office_phone ? `<span class="sub">O: ${esc(agent.office_phone)}</span>` : ''}
        </td>
        <td class="c-rate">${esc(displayRate)}</td>
        <td class="c-date">${esc(displayDate)}</td>
        <td class="c-size">${sizing.map(s => `<span>${esc(s)}</span>`).join('<br>')}</td>
        <td class="c-usage">${esc(displayUsage)}</td>
        <td class="c-notes">${esc(pm.confirmed_notes || '')}</td>
        <td class="c-w9 ${pm.w9_status === 'RECEIVED' ? 'w9-received' : ''}">${esc(pm.w9_status || '—')}</td>
      </tr>`
    }).join('')

    const html = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>${esc(project.name)} — Confirmation Chart</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; font-size:10px; color:#111; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  @page { size: landscape; margin: 12mm 10mm; }

  .header { text-align:center; margin-bottom:14px; }
  .header img.logo { height:20px; width:auto; margin-bottom:10px; }
  .header .project { font-size:13px; font-weight:300; letter-spacing:0.18em; text-transform:uppercase; }
  .header .meta { font-size:8px; letter-spacing:0.15em; text-transform:uppercase; color:#999; margin-top:4px; }

  table { width:100%; border-collapse:collapse; }
  thead tr th {
    background:#111; color:#fff;
    font-size:7.5px; letter-spacing:0.2em; text-transform:uppercase; font-weight:600;
    padding:6px 7px; text-align:left; border:1px solid #333;
  }
  tbody tr td {
    border:1px solid #d0d0d0; padding:5px 7px; vertical-align:top; font-size:9.5px; line-height:1.45;
  }
  tbody tr:nth-child(even) td { background:#fafafa; }

  .c-photo { width:48px; padding:3px; }
  .c-photo img { width:42px; height:54px; object-fit:cover; object-position:top; display:block; }
  .c-name { width:80px; font-weight:600; letter-spacing:0.05em; }
  .c-contact { width:150px; }
  .c-rate { width:100px; font-weight:500; }
  .c-date { width:80px; }
  .c-size { width:110px; }
  .c-usage { width:120px; }
  .c-notes { }
  .c-w9 { width:62px; text-align:center; font-size:8px; letter-spacing:0.12em; text-transform:uppercase; }
  .w9-received { color:#166534; font-weight:700; }
  b { font-weight:700; }
  .sub { font-size:8.5px; color:#555; }

  .footer { margin-top:12px; text-align:center; font-size:7.5px; letter-spacing:0.18em; text-transform:uppercase; color:#bbb; }
</style>
</head><body>
<div class="header">
  <img src="${baseUrl}/logo.jpg" class="logo" alt="Tasha Tongpreecha Casting" />
  <div class="project">${esc(project.name)}</div>
  <div class="meta">${esc([shootDate, project.photographer ? `Photographer: ${project.photographer}` : '', project.stylist ? `Stylist: ${project.stylist}` : ''].filter(Boolean).join('  ·  '))}</div>
</div>
<table>
  <thead>
    <tr>
      <th>PHOTO</th><th>NAME</th><th>CONTACT</th>
      <th>RATE</th><th>DATE</th><th>SIZE</th><th>USAGE</th>
      <th>NOTES / ADD'L USAGE</th><th>W-9</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>
<div class="footer">Tasha Tongpreecha Casting &nbsp;·&nbsp; tashatongpreecha.com</div>
<script>
  window.addEventListener('load', function() {
    var imgs = document.querySelectorAll('img'), total = imgs.length, loaded = 0;
    function go() { if(++loaded >= total) setTimeout(window.print, 300); }
    if (!total) { setTimeout(window.print, 300); return; }
    imgs.forEach(function(i){ if(i.complete) go(); else { i.onload=go; i.onerror=go; } });
  });
</script>
</body></html>`

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
