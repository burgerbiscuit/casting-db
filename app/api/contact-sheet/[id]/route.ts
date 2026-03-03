import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const esc = (s = '') => (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authSupabase = await createClient()
  const { data: { user } } = await authSupabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabaseSvc = await createServiceClient()
  const { data: member } = await supabaseSvc.from('team_members').select('id').eq('user_id', user.id).single()
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const projectId = params.id
  const { data: project } = await supabaseSvc.from('projects').select('*').eq('id', projectId).single()
  const { data: pms } = await supabaseSvc
    .from('project_models').select('*, models(*)').eq('project_id', projectId).eq('admin_confirmed', true).order('signed_in_at')

  if (!project || !pms?.length) return new NextResponse('<html><body style="font-family:sans-serif;padding:40px"><h2>No confirmed models yet for this project.</h2></body></html>', { status: 200, headers: {'Content-Type':'text/html'} })

  const modelIds = pms.map((pm: any) => pm.model_id)
  const { data: allMedia } = await supabaseSvc.from('model_media').select('*').in('model_id', modelIds).eq('type', 'photo').eq('is_visible', true).order('display_order')
  const photoMap: Record<string, string> = {}
  ;(allMedia || []).forEach((m: any) => { if (!photoMap[m.model_id]) photoMap[m.model_id] = m.public_url })

  const agencyNames = [...new Set(pms.map((pm: any) => pm.models?.agency).filter(Boolean))] as string[]
  const { data: agentContacts } = agencyNames.length ? await supabaseSvc.from('agency_contacts').select('*').in('agency_name', agencyNames).eq('contact_type', 'model') : { data: [] }
  const agentMap: Record<string, any> = {}
  ;(agentContacts || []).forEach((a: any) => { const k = a.agency_name?.toLowerCase(); if (!agentMap[k] || a.is_main_contact) agentMap[k] = a })

  const modelRows = pms.map((pm: any) => {
    const m = pm.models
    const photo = photoMap[pm.model_id]
    const agent = agentMap[m?.agency?.toLowerCase()]
    const sizing = [m?.height_ft ? `${m.height_ft}'${m.height_in||0}"` : null, m?.bust ? `B ${m.bust}` : null, m?.waist ? `W ${m.waist}` : null, m?.hips ? `H ${m.hips}` : null, m?.chest ? `CH ${m.chest}` : null, m?.dress_size ? `Dress ${m.dress_size}` : null, m?.shoe_size ? `Shoe ${m.shoe_size}` : null].filter(Boolean).join(' · ')
    return `<div class="row">
      <div class="photo">${photo ? `<img src="${esc(photo)}" />` : '<div class="nophoto">No Photo</div>'}</div>
      <div class="col">
        <div class="name">${esc(m?.first_name)} ${esc(m?.last_name)}</div>
        ${m?.agency ? `<div class="sub">${esc(m.agency)}</div>` : ''}
        ${sizing ? `<div class="sizing">${esc(sizing)}</div>` : ''}
        ${m?.instagram_handle ? `<div class="sizing">@${esc(m.instagram_handle)}</div>` : ''}
        ${m?.tiktok_handle ? `<div class="sizing">TT: @${esc(m.tiktok_handle)}</div>` : ''}
        <div class="link"><a href="https://cast.tashatongpreecha.com/admin/models/${esc(m?.id)}">View Profile ↗</a></div>
      </div>
      <div class="col">
        ${pm.pm_rate||pm.rate ? `<div class="field"><span class="lbl">Rate</span>${esc(pm.pm_rate||pm.rate)}</div>` : ''}
        ${pm.confirmed_usage ? `<div class="field"><span class="lbl">Usage</span>${esc(pm.confirmed_usage)}</div>` : ''}
        ${pm.confirmed_days ? `<div class="field"><span class="lbl">Days</span>${esc(pm.confirmed_days)}</div>` : ''}
        ${pm.pm_location||pm.location ? `<div class="field"><span class="lbl">Location</span>${esc(pm.pm_location||pm.location)}</div>` : ''}
        ${pm.pm_notes ? `<div class="field"><span class="lbl">Notes</span>${esc(pm.pm_notes)}</div>` : ''}
      </div>
      <div class="col">
        ${agent ? `<div class="lbl">Agent</div><div class="name2">${esc(agent.agent_name||'')}${agent.agency_name ? ` — ${esc(agent.agency_name)}` : ''}</div>${agent.email ? `<div class="sub"><a href="mailto:${esc(agent.email)}">${esc(agent.email)}</a></div>` : ''}${agent.cell_phone ? `<div class="sub">${esc(agent.cell_phone)}</div>` : ''}${agent.office_phone ? `<div class="sub">${esc(agent.office_phone)}</div>` : ''}${agent.board ? `<div class="sizing">${esc(agent.board)}</div>` : ''}` : '<div class="lbl" style="color:#ddd">No agent on file</div>'}
      </div>
    </div>`
  }).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(project.name)} — Contact Sheet</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Helvetica Neue',sans-serif;background:#fff;color:#111;padding:20mm 15mm}@page{size:A4;margin:0}
.header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #000;padding-bottom:14px;margin-bottom:20px}
.htitle{font-size:20px;font-weight:300;letter-spacing:.15em;text-transform:uppercase}.hbrand{font-size:9px;letter-spacing:.2em;text-transform:uppercase;font-weight:500;margin-bottom:4px}
.hmeta{text-align:right;font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:#999;line-height:1.8}
.row{display:grid;grid-template-columns:72px 1fr 1fr 1fr;gap:14px;padding:14px 0;border-bottom:1px solid #f0f0f0;page-break-inside:avoid;align-items:start}
.photo img{width:72px;height:96px;object-fit:cover;object-position:top}.nophoto{width:72px;height:96px;background:#f5f5f5;display:flex;align-items:center;justify-content:center;font-size:8px;color:#ccc}
.name{font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;margin-bottom:3px}
.name2{font-size:10px;font-weight:500;margin-bottom:3px}.sub{font-size:9px;color:#666;margin-bottom:2px}.sub a{color:#666;text-decoration:none}
.sizing{font-size:8px;color:#999;margin-bottom:3px;line-height:1.5}
.link{margin-top:5px}.link a{font-size:8px;text-transform:uppercase;letter-spacing:.1em;color:#000;text-decoration:underline}
.field{margin-bottom:5px}.lbl{font-size:7px;text-transform:uppercase;letter-spacing:.12em;color:#bbb;display:block;margin-bottom:1px}
.footer{margin-top:20px;padding-top:10px;border-top:1px solid #eee;font-size:8px;color:#ccc;letter-spacing:.1em;text-transform:uppercase;text-align:center}
@media print{body{-webkit-print-color-adjust:exact}}</style></head><body>
<div class="header"><div><div class="hbrand">Tasha Tongpreecha Casting</div><div class="htitle">${esc(project.name)}</div></div>
<div class="hmeta">${project.client_name?`Client: ${esc(project.client_name)}<br>`:''}${project.shoot_date?`Shoot: ${new Date(project.shoot_date).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}<br>`:''}${project.location?`Location: ${esc(project.location)}<br>`:''}${pms.length} Confirmed ${pms.length===1?'Model':'Models'}<br>Generated: ${new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</div></div>
${modelRows}
<div class="footer">Tasha Tongpreecha Casting · cast.tashatongpreecha.com · Confidential</div>
</body></html>`

  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' } })
}
