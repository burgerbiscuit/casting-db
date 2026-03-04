import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const esc = (s = '') => (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
const toUrl = (s = '') => s.startsWith('http') ? s : `https://${s}`

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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
    const { data: presentation } = await supabase.from('presentations').select('*, projects(name, shoot_date)').eq('id', id).single()
    const { data: presentationModels } = await supabase
      .from('presentation_models').select('*, models(*)').eq('presentation_id', id).eq('is_visible', true).order('display_order')
    const { data: categories } = await supabase
      .from('presentation_categories').select('*').eq('presentation_id', id).order('display_order')

    if (!presentation || !presentationModels?.length) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const modelIds = presentationModels.map((pm: any) => pm.model_id)
    const { data: allMedia } = await supabase.from('model_media').select('*').in('model_id', modelIds).eq('is_visible', true).order('display_order')
    const mediaByModel: Record<string, any[]> = {}
    ;(allMedia || []).forEach((m: any) => { if (!mediaByModel[m.model_id]) mediaByModel[m.model_id] = []; mediaByModel[m.model_id].push(m) })

    const cats = categories || []
    const projectName = (presentation.projects as any)?.name || ''
    const shootDate = (presentation.projects as any)?.shoot_date || ''
    const presName = presentation.name

    const alpha = (a: any, b: any) => {
      const aName = `${a.models?.last_name||''} ${a.models?.first_name||''}`.toLowerCase()
      const bName = `${b.models?.last_name||''} ${b.models?.first_name||''}`.toLowerCase()
      return aName.localeCompare(bName)
    }

    interface CatGroup { id: string; name: string; models: any[] }
    const grouped: CatGroup[] = []
    cats.forEach((cat: any) => {
      const models = presentationModels.filter((pm: any) => pm.category_id === cat.id).sort(alpha)
      if (models.length) grouped.push({ id: cat.id, name: cat.name, models })
    })
    const uncategorized = presentationModels.filter((pm: any) => !pm.category_id).sort(alpha)
    if (uncategorized.length) grouped.push({ id: 'none', name: '', models: uncategorized })

    const getSizing = (m: any) => {
      const p: string[] = []
      if (m.height_ft) p.push(`${m.height_ft}'${m.height_in||0}"`)
      if (m.bust) p.push(`Bust ${m.bust}`)
      if (m.waist) p.push(`Waist ${m.waist}`)
      if (m.hips) p.push(`Hips ${m.hips}`)
      if (m.chest) p.push(`Chest ${m.chest}`)
      if (m.inseam) p.push(`Inseam ${m.inseam}`)
      if (m.dress_size) p.push(`Dress ${m.dress_size}`)
      if (m.suit_size) p.push(`Suit ${m.suit_size}`)
      if (m.shoe_size) p.push(`Shoe ${m.shoe_size}`)
      return p
    }

    const modelSlide = (pm: any) => {
      const m = pm.models
      const media = (mediaByModel[pm.model_id] || []).filter((med: any) => med.type !== 'video')
      const photo1 = media.find((med: any) => med.is_pdf_primary) || media[0]
      const photo2 = media.find((med: any) => med.is_pdf_secondary) || media[1]
      const sizing = getSizing(m)
      const igHandle = m.instagram_handle ? m.instagram_handle.replace('@','') : ''
      const igUrl = igHandle ? `https://instagram.com/${igHandle}` : ''
      const portfolioUrl = pm.show_portfolio && m.portfolio_url ? toUrl(m.portfolio_url) : ''

      return `
        <div class="slide">
          <div class="photos">
            <div class="photo">${photo1 ? `<img src="${esc(photo1.public_url)}" />` : '<div class="photo-empty"></div>'}</div>
            <div class="photo">${photo2 ? `<img src="${esc(photo2.public_url)}" />` : '<div class="photo-empty"></div>'}</div>
          </div>
          <div class="info">
            <div class="info-top">
              <div class="name">${esc(m.first_name)} ${esc(m.last_name)}</div>
              ${m.agency ? `<div class="agency">${esc(m.agency)}</div>` : ''}
              ${sizing.length ? `<div class="sizing">${sizing.map((s: string) => `<span>${esc(s)}</span>`).join('<span class="dot">·</span>')}</div>` : ''}
              <div class="links">
                ${igUrl ? `<a href="${esc(igUrl)}" class="link">Instagram ↗</a>` : ''}
                ${portfolioUrl ? `<a href="${esc(portfolioUrl)}" class="link">Portfolio ↗</a>` : ''}
              </div>
            </div>
            <div class="info-notes">
              ${pm.rate ? `<div class="note-row"><span class="note-label">Rate</span><span class="note-val">${esc(pm.rate)}</span></div>` : ''}
              ${pm.location ? `<div class="note-row"><span class="note-label">Location</span><span class="note-val">${esc(pm.location)}</span></div>` : ''}
              ${pm.admin_notes ? `<div class="note-row"><span class="note-label">Notes</span><span class="note-val">${esc(pm.admin_notes)}</span></div>` : ''}
              ${pm.client_notes ? `<div class="note-row"><span class="note-label">Client Notes</span><span class="note-val">${esc(pm.client_notes)}</span></div>` : ''}
            </div>
            <div class="info-footer">${esc(projectName)}</div>
          </div>
        </div>`
    }

    const sectionDivider = (name: string) => `
      <div class="slide section-slide">
        <div class="section-project">${esc(projectName)}</div>
        <div class="section-name">${esc(name)}</div>
        <div class="section-pres">${esc(presName)}</div>
      </div>`

    const titlePage = `
      <div class="slide title-slide">
        <div class="title-inner">
          <div class="title-logo">TASHA TONGPREECHA CASTING</div>
          <div class="title-project">${esc(projectName)}</div>
          <div class="title-pres">${esc(presName)}</div>
          ${shootDate ? `<div class="title-date">${esc(String(shootDate))}</div>` : ''}
          <div class="title-count">${presentationModels.length} Models</div>
        </div>
      </div>`

    const pages = grouped.map(group => {
      const divider = group.name ? sectionDivider(group.name) : ''
      return divider + group.models.map(modelSlide).join('')
    }).join('')

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${esc(presName)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: white; color: #111; }
  @page { size: 380mm 215mm; margin: 0; }

  .slide {
    width: 380mm; height: 215mm;
    page-break-after: always;
    display: flex; overflow: hidden; position: relative;
  }

  /* TITLE PAGE */
  .title-slide { background: #fff; border: 12px solid #000; align-items: center; justify-content: center; }
  .title-inner { text-align: center; }
  .title-logo { font-size: 8px; letter-spacing: 0.4em; text-transform: uppercase; color: #999; margin-bottom: 32px; }
  .title-project { font-size: 48px; font-weight: 200; letter-spacing: 0.2em; text-transform: uppercase; line-height: 1.1; margin-bottom: 12px; }
  .title-pres { font-size: 12px; letter-spacing: 0.3em; text-transform: uppercase; color: #555; margin-bottom: 8px; }
  .title-date { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #999; margin-bottom: 16px; }
  .title-count { font-size: 9px; letter-spacing: 0.25em; text-transform: uppercase; color: #bbb; }

  /* SECTION DIVIDER */
  .section-slide { background: #000; align-items: center; justify-content: center; flex-direction: column; gap: 16px; }
  .section-project { font-size: 8px; letter-spacing: 0.4em; text-transform: uppercase; color: rgba(255,255,255,0.3); margin-bottom: 8px; }
  .section-name { font-size: 52px; font-weight: 200; letter-spacing: 0.25em; text-transform: uppercase; color: white; }
  .section-pres { font-size: 9px; letter-spacing: 0.3em; text-transform: uppercase; color: rgba(255,255,255,0.25); margin-top: 8px; }

  /* MODEL SLIDE */
  .photos { display: flex; gap: 2px; width: 58%; flex-shrink: 0; background: #f0f0f0; }
  .photo { flex: 1; overflow: hidden; }
  .photo img { width: 100%; height: 100%; object-fit: cover; object-position: top center; display: block; }
  .photo-empty { width: 100%; height: 100%; background: #e8e8e8; }

  .info { flex: 1; display: flex; flex-direction: column; justify-content: space-between; padding: 32px 28px 24px; border-left: 1px solid #e8e8e8; min-width: 0; }
  .info-top { display: flex; flex-direction: column; gap: 10px; }
  .name { font-size: 22px; font-weight: 300; letter-spacing: 0.15em; text-transform: uppercase; line-height: 1.15; }
  .agency { font-size: 8px; letter-spacing: 0.25em; text-transform: uppercase; color: #999; }
  .sizing { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 0; }
  .sizing span { font-size: 8px; letter-spacing: 0.12em; text-transform: uppercase; color: #555; }
  .dot { font-size: 8px; color: #ccc; margin: 0 5px; }
  .links { display: flex; flex-direction: column; gap: 4px; margin-top: 4px; }
  .link { font-size: 8px; letter-spacing: 0.2em; text-transform: uppercase; color: #111; text-decoration: underline; }

  .info-notes { display: flex; flex-direction: column; gap: 7px; border-top: 1px solid #f0f0f0; padding-top: 14px; }
  .note-row { display: flex; gap: 10px; align-items: baseline; }
  .note-label { font-size: 7px; letter-spacing: 0.2em; text-transform: uppercase; color: #aaa; min-width: 56px; flex-shrink: 0; }
  .note-val { font-size: 9px; color: #333; line-height: 1.5; }

  .info-footer { font-size: 7px; letter-spacing: 0.25em; text-transform: uppercase; color: #ddd; text-align: right; }
</style>
</head>
<body>
${titlePage}
${pages}
<script>window.onload = () => window.print()</script>
</body>
</html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="${esc(presName)}.pdf"`,
      }
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
