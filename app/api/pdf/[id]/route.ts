import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const esc = (s = '') => (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  try {
    const authSupabase = await createClient()
    const { data: { user } } = await authSupabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: teamMember } = await authSupabase.from('team_members').select('id').eq('user_id', user.id).single()
    if (!teamMember) {
      const supabaseCheck = await createServiceClient()
      const { data: pres } = await supabaseCheck.from('presentations').select('project_id').eq('id', id).single()
      if (pres) {
        const { data: access } = await authSupabase.from('client_projects').select('id').eq('client_id', user.id).eq('project_id', pres.project_id).single()
        if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      } else {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const supabase = await createServiceClient()

    const { data: presentation } = await supabase
      .from('presentations')
      .select('*, projects(name)')
      .eq('id', id)
      .single()

    const { data: presentationModels } = await supabase
      .from('presentation_models')
      .select('*, models(*)')
      .eq('presentation_id', id)
      .eq('is_visible', true)
      .order('display_order')

    if (!presentation || !presentationModels?.length) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Get shortlisted model IDs from client_shortlists
    const { data: shortlists } = await supabase
      .from('client_shortlists')
      .select('model_id')
      .eq('presentation_id', id)

    const shortlistedIds = new Set((shortlists || []).map((s: any) => s.model_id))

    // Get client notes
    const { data: clientNoteRows } = await supabase
      .from('client_shortlists')
      .select('model_id, notes')
      .eq('presentation_id', id)

    const clientNotesMap = new Map<string, string>()
    ;(clientNoteRows || []).forEach((r: any) => { if (r.notes) clientNotesMap.set(r.model_id, r.notes) })

    const modelIds = (presentationModels || []).map((pm: any) => pm.model_id)
    const { data: allMedia } = await supabase
      .from('model_media')
      .select('*')
      .in('model_id', modelIds)
      .eq('is_visible', true)
      .eq('type', 'photo')
      .order('display_order')

    const mediaByModel = new Map<string, any[]>()
    ;(allMedia || []).forEach(m => {
      if (!mediaByModel.has(m.model_id)) mediaByModel.set(m.model_id, [])
      mediaByModel.get(m.model_id)!.push(m)
    })

    // Sort: shortlisted first
    const shortlisted = (presentationModels || []).filter((pm: any) => shortlistedIds.has(pm.model_id))
    const rest = (presentationModels || []).filter((pm: any) => !shortlistedIds.has(pm.model_id))

    const renderModelPage = (pm: any) => {
      const model = pm.models
      const photos = mediaByModel.get(model.id) || []
      const photo1 = photos[0]?.public_url || ''
      const photo2 = photos[1]?.public_url || ''
      const clientNotes = clientNotesMap.get(model.id) || ''

      const sizingFields = [
        model.height_ft ? `<div><div style="font-size:10px;color:#aaa;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px">Height</div><div>${esc(String(model.height_ft))}'${esc(String(model.height_in || 0))}"</div></div>` : '',
        model.bust ? `<div><div style="font-size:10px;color:#aaa;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px">Bust</div><div>${esc(model.bust)}</div></div>` : '',
        model.waist ? `<div><div style="font-size:10px;color:#aaa;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px">Waist</div><div>${esc(model.waist)}</div></div>` : '',
        model.hips ? `<div><div style="font-size:10px;color:#aaa;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px">Hips</div><div>${esc(model.hips)}</div></div>` : '',
        model.chest ? `<div><div style="font-size:10px;color:#aaa;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px">Chest</div><div>${esc(model.chest)}</div></div>` : '',
        model.shoe_size ? `<div><div style="font-size:10px;color:#aaa;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px">Shoe</div><div>US ${esc(model.shoe_size)}</div></div>` : '',
        model.dress_size ? `<div><div style="font-size:10px;color:#aaa;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px">Dress</div><div>${esc(model.dress_size)}</div></div>` : '',
        pm.show_instagram && model.instagram_handle ? `<div><div style="font-size:10px;color:#aaa;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px">Instagram</div><div><a href="https://instagram.com/${esc(model.instagram_handle)}" style="color:#111;text-decoration:underline">@${esc(model.instagram_handle)}</a></div></div>` : '',
        pm.show_portfolio && model.portfolio_url ? `<div><div style="font-size:10px;color:#aaa;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px">Portfolio</div><div><a href="${esc(model.portfolio_url.startsWith('http') ? model.portfolio_url : 'https://' + model.portfolio_url)}" style="color:#111;text-decoration:underline">View ↗</a></div></div>` : '',
      ].filter(Boolean).join('')

      return `<div style="page-break-after: always; padding: 40px; font-family: 'Inter', sans-serif;">
  <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 20px;">
    <div>
      <h2 style="font-size:18px; font-weight:300; letter-spacing:0.1em; text-transform:uppercase; margin:0">${esc(model.first_name)} ${esc(model.last_name)}</h2>
      ${model.agency ? `<p style="font-size:11px; color:#999; margin:4px 0 0">${esc(model.agency)}</p>` : ''}
    </div>
    <div style="display:flex; gap:20px; font-size:11px; color:#666; text-align:right">
      ${sizingFields}
    </div>
  </div>
  <div style="display:flex; gap:12px; margin-bottom:20px;">
    ${photo1 ? `<img src="${esc(photo1)}" style="width:calc(50% - 6px); aspect-ratio:3/4; object-fit:cover; object-position:top;" />` : `<div style="width:calc(50% - 6px); aspect-ratio:3/4; background:#f5f5f5;"></div>`}
    ${photo2 ? `<img src="${esc(photo2)}" style="width:calc(50% - 6px); aspect-ratio:3/4; object-fit:cover; object-position:top;" />` : `<div style="width:calc(50% - 6px); aspect-ratio:3/4; background:#f5f5f5;"></div>`}
  </div>
  ${clientNotes ? `<div style="font-size:12px; color:#555; border-top:1px solid #eee; padding-top:12px; line-height:1.6">${esc(clientNotes)}</div>` : ''}
</div>`
    }

    const shortlistedSection = shortlisted.length > 0 ? `
<div style="page-break-after: always; padding: 40px; font-family: 'Inter', sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh;">
  <div style="text-align:center">
    <p style="font-size:10px; letter-spacing:0.2em; text-transform:uppercase; color:#999; margin-bottom:12px">Selected</p>
    <h2 style="font-size:28px; font-weight:300; letter-spacing:0.08em; text-transform:uppercase;">${shortlisted.length} Model${shortlisted.length !== 1 ? 's' : ''}</h2>
  </div>
</div>
${shortlisted.map(renderModelPage).join('')}` : ''

    const allTalentSection = rest.length > 0 ? `
<div style="page-break-after: always; padding: 40px; font-family: 'Inter', sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh;">
  <div style="text-align:center">
    <p style="font-size:10px; letter-spacing:0.2em; text-transform:uppercase; color:#999; margin-bottom:12px">All Talent</p>
    <h2 style="font-size:28px; font-weight:300; letter-spacing:0.08em; text-transform:uppercase;">${rest.length} Model${rest.length !== 1 ? 's' : ''}</h2>
  </div>
</div>
${rest.map(renderModelPage).join('')}` : (!shortlisted.length ? (presentationModels || []).map(renderModelPage).join('') : '')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(presentation.name)}</title><style>
@page { margin: 0; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; color: #111; }
</style></head><body>
<div style="page-break-after: always; padding: 80px 40px; font-family: 'Inter', sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh;">
  <div style="text-align:center">
    <img src="/logo.jpg" style="height:32px; width:auto; margin-bottom:32px; display:block; margin-left:auto; margin-right:auto;" />
    <h1 style="font-size:24px; font-weight:300; letter-spacing:0.1em; text-transform:uppercase; margin-bottom:8px">${esc(presentation.name)}</h1>
    <p style="font-size:12px; color:#999; letter-spacing:0.05em">${esc((presentation.projects as any)?.name || '')}</p>
  </div>
</div>
${shortlisted.length > 0 ? shortlistedSection : ''}
${rest.length > 0 || shortlisted.length === 0 ? allTalentSection : ''}
</body></html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html;charset=utf-8',
        'Content-Disposition': `attachment; filename="${esc(presentation.name)}.html"`
      }
    })
  } catch (e) {
    console.error('PDF error:', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
