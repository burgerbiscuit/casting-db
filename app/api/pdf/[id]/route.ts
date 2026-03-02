import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const esc = (s: string) => (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  try {
    // Auth check: user must be logged in (team member OR authenticated client)
    const authSupabase = await createClient()
    const { data: { user } } = await authSupabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify access: either team member or client with access to this presentation's project
    const { data: teamMember } = await authSupabase.from('team_members').select('id').eq('user_id', user.id).single()
    if (!teamMember) {
      // Must be a client with access to this project
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

    const modelIds = (presentationModels || []).map((pm: any) => pm.model_id)
    const { data: allMedia } = await supabase
      .from('model_media')
      .select('*')
      .in('model_id', modelIds)

    const mediaByModel = new Map<string, any[]>()
    ;(allMedia || []).forEach(m => {
      if (!mediaByModel.has(m.model_id)) mediaByModel.set(m.model_id, [])
      mediaByModel.get(m.model_id)!.push(m)
    })

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(presentation.name)}</title><style>* { margin: 0; padding: 0; box-sizing: border-box; } body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111; } .cover { page-break-after: always; padding: 40px; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; text-align: center; } .cover h1 { font-size: 32px; font-weight: 300; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 20px; } .model { page-break-inside: avoid; padding: 40px; } .model-name { font-size: 18px; font-weight: 600; text-transform: uppercase; margin-bottom: 20px; } .photos { display: flex; gap: 20px; margin-bottom: 20px; } .photo { width: 45%; aspect-ratio: 3/4; object-fit: cover; } .sizing { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; font-size: 12px; } .sizing-item { border: 1px solid #e5e5e5; padding: 10px; } .sizing-label { font-size: 10px; color: #888; font-weight: 600; text-transform: uppercase; margin-bottom: 5px; } .sizing-value { font-weight: 600; } .links { font-size: 12px; margin-bottom: 15px; } .links a { color: #0000FF; text-decoration: underline; display: block; }</style></head><body><div class="cover"><h1>${esc(presentation.name)}</h1><p>${esc((presentation.projects as any)?.name || '')}</p></div>${presentationModels.map((pm: any) => {const model = pm.models; const pdfPhotos = (mediaByModel.get(model.id) || []).filter(m => m.is_pdf_primary || m.is_pdf_secondary); return `<div class="model"><div class="model-name">${esc(model.first_name)} ${esc(model.last_name)}</div>${pdfPhotos.length > 0 ? `<div class="photos">${pdfPhotos.slice(0,2).map((p: any) => `<img src="${esc(p.public_url)}" class="photo">`).join('')}</div>` : ''}${pm.show_sizing ? `<div class="sizing">${model.height_ft ? `<div class="sizing-item"><div class="sizing-label">Height</div><div class="sizing-value">${esc(String(model.height_ft))}'${esc(String(model.height_in))}"</div></div>` : ''}${model.bust ? `<div class="sizing-item"><div class="sizing-label">Bust</div><div class="sizing-value">${esc(model.bust)}</div></div>` : ''}${model.waist ? `<div class="sizing-item"><div class="sizing-label">Waist</div><div class="sizing-value">${esc(model.waist)}</div></div>` : ''}${model.hips ? `<div class="sizing-item"><div class="sizing-label">Hips</div><div class="sizing-value">${esc(model.hips)}</div></div>` : ''}${model.shoe_size ? `<div class="sizing-item"><div class="sizing-label">Shoe</div><div class="sizing-value">${esc(model.shoe_size)}</div></div>` : ''}${model.dress_size ? `<div class="sizing-item"><div class="sizing-label">Dress</div><div class="sizing-value">${esc(model.dress_size)}</div></div>` : ''}</div>` : ''}<div class="links">${pm.show_instagram && model.instagram_handle ? `<a href="https://instagram.com/${esc(model.instagram_handle)}">@${esc(model.instagram_handle)}</a>` : ''}${pm.show_portfolio && model.portfolio_url ? `<a href="${esc(model.portfolio_url)}">${esc(model.portfolio_url)}</a>` : ''}</div></div>`}).join('')}</body></html>`

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
