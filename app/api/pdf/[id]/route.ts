import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getInstagramUrl, cleanInstagramHandle } from '@/lib/instagram-utils'
import { NextRequest, NextResponse } from 'next/server'

const esc = (s = '') => (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
const toUrl = (s = '') => s.startsWith('http') ? s : `https://${s}`
const fmtDate = (d: string) => {
  if (!d) return ''
  try { return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }
  catch { return d }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  const host = request.headers.get('host') || 'cast.tashatongpreecha.com'
  const proto = host.includes('localhost') ? 'http' : 'https'
  const baseUrl = `${proto}://${host}`

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
      .select('*, projects(name, shoot_date, photographer, stylist)')
      .eq('id', id).single()

    const { data: presentationModels } = await supabase
      .from('presentation_models').select('*, models(*)')
      .eq('presentation_id', id).eq('is_visible', true).order('display_order')

    const { data: categories } = await supabase
      .from('presentation_categories').select('*').eq('presentation_id', id).order('display_order')

    if (!presentation || !presentationModels?.length) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const modelIds = presentationModels.map((pm: any) => pm.model_id)
    const { data: allMedia } = await supabase
      .from('model_media').select('*').in('model_id', modelIds).eq('is_visible', true).order('display_order')
    const mediaByModel: Record<string, any[]> = {}
    ;(allMedia || []).forEach((m: any) => {
      if (!mediaByModel[m.model_id]) mediaByModel[m.model_id] = []
      mediaByModel[m.model_id].push(m)
    })

    const cats = categories || []
    const proj = presentation.projects as any
    const projectName = proj?.name || ''
    const shootDate = proj?.shoot_date ? fmtDate(proj.shoot_date) : ''
    const photographer = proj?.photographer || ''
    const stylist = proj?.stylist || ''
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
      if (m.height_ft) p.push(`Height: ${m.height_ft}'${m.height_in||0}"`)
      if (m.bust || m.chest) p.push(`Chest: ${m.bust || m.chest}`)
      if (m.waist) p.push(`Waist: ${m.waist}`)
      if (m.hips) p.push(`Hips: ${m.hips}`)
      if (m.shoe_size) p.push(`Shoes: ${m.shoe_size}`)
      if (m.dress_size) p.push(`Dress: ${m.dress_size}`)
      return p
    }

    const modelSlide = (pm: any) => {
      const m = pm.models
      const media = (mediaByModel[pm.model_id] || []).filter((med: any) => med.type !== 'video')
      const photo1 = media.find((med: any) => med.is_pdf_primary) || media[0]
      const photo2 = media.find((med: any) => med.is_pdf_secondary) || media[1]
      const sizing = getSizing(m)

      const igUrl = getInstagramUrl(m.instagram_handle) || ''
      const portfolioRaw = pm.show_portfolio && m.portfolio_url ? toUrl(m.portfolio_url) : ''

      const infoItems: string[] = []
      if (pm.pm_option) infoItems.push(`<div class="info-option">${esc(pm.pm_option)}</div>`)
      if (pm.pm_rate) infoItems.push(`<div class="info-rate">${esc(pm.pm_rate)}</div>`)
      if (pm.location) infoItems.push(`<div class="info-note"><span class="note-lbl">Location</span>${esc(pm.location)}</div>`)
      if (pm.admin_notes) infoItems.push(`<div class="info-note"><span class="note-lbl">Notes</span>${esc(pm.admin_notes)}</div>`)

      const linkItems: string[] = []
      if (portfolioRaw) linkItems.push(`<a href="${esc(portfolioRaw)}" class="pdf-link">PORTFOLIO</a>`)
      if (igUrl) linkItems.push(`<a href="${esc(igUrl)}" class="pdf-link">INSTAGRAM</a>`)

      return `
        <div class="slide model-slide">
          <div class="model-header">
            <img src="${baseUrl}/logo.jpg" class="slide-logo" alt="Tasha Tongpreecha Casting" />
            <div class="model-name">${esc(m.first_name?.toUpperCase())} ${esc(m.last_name?.toUpperCase())}</div>
            ${m.agency ? `<div class="model-agency">${esc(m.agency)}</div>` : ''}
            ${sizing.length ? `<div class="sizing-row">${sizing.join('<span class="sep"> &nbsp; </span>')}</div>` : ''}
          </div>
          <div class="model-body">
            <div class="photos-area">
              <div class="photo photo-1">${photo1 ? `<img src="${esc(photo1.public_url)}" />` : '<div class="photo-empty"></div>'}</div>
              <div class="photo photo-2">${photo2 ? `<img src="${esc(photo2.public_url)}" />` : '<div class="photo-empty"></div>'}</div>
            </div>
            <div class="info-panel">
              <div class="info-main">
                ${infoItems.join('')}
              </div>
              <div class="info-links">
                ${linkItems.join('')}
              </div>
            </div>
          </div>
        </div>`
    }

    // Divider: ONLY the section name — nothing else
    const sectionDivider = (name: string) => `
      <div class="slide divider-slide">
        <div class="divider-name">${esc(name.toUpperCase())}</div>
      </div>`

    // Cover page
    const coverPage = `
      <div class="slide cover-slide">
        <div class="cover-inner">
          <img src="${baseUrl}/logo.jpg" class="cover-logo" alt="Tasha Tongpreecha Casting" />
          <div class="cover-project">${esc(projectName.toUpperCase())}</div>
          <div class="cover-meta">
            ${shootDate ? `<div class="cover-meta-row">${esc(shootDate)}</div>` : ''}
            ${photographer ? `<div class="cover-meta-row"><span class="meta-label">Photographer</span> ${esc(photographer)}</div>` : ''}
            ${stylist ? `<div class="cover-meta-row"><span class="meta-label">Stylist</span> ${esc(stylist)}</div>` : ''}
          </div>
          <div class="cover-count">${presentationModels.length} ${presentationModels.length === 1 ? 'MODEL' : 'MODELS'}</div>
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
  body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    background: #fff; color: #111;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }

  @page { size: A4 landscape; margin: 0; }

  .slide {
    width: 297mm; height: 210mm;
    page-break-after: always;
    page-break-inside: avoid;
    overflow: hidden;
    position: relative;
    background: white;
  }

  /* ── COVER ─────────────────────────────── */
  .cover-slide {
    display: flex; align-items: center; justify-content: center;
    background: #fff;
  }
  .cover-inner { text-align: center; padding: 0 50mm; }
  .cover-logo { height: 22px; width: auto; margin-bottom: 36px; object-fit: contain; }
  .cover-project {
    font-size: 32px; font-weight: 300;
    letter-spacing: 0.22em; line-height: 1.2;
    margin-bottom: 24px;
  }
  .cover-meta { display: flex; flex-direction: column; gap: 6px; margin-bottom: 24px; }
  .cover-meta-row { font-size: 8.5px; letter-spacing: 0.22em; text-transform: uppercase; color: #888; }
  .meta-label { color: #bbb; margin-right: 6px; }
  .cover-count { font-size: 8px; letter-spacing: 0.3em; text-transform: uppercase; color: #ccc; }

  /* ── DIVIDER ────────────────────────────── */
  .divider-slide {
    background: #000;
    display: flex; align-items: center; justify-content: center;
  }
  .divider-name {
    font-size: 44px; font-weight: 200;
    letter-spacing: 0.3em;
    color: #fff;
    text-align: center;
    padding: 0 20mm;
  }

  /* ── MODEL SLIDE ────────────────────────── */
  .model-slide {
    display: flex;
    flex-direction: column;
  }

  /* Header: logo + name + sizing */
  .model-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 20mm 8px;
    border-bottom: 1px solid #ebebeb;
    flex-shrink: 0;
  }
  .slide-logo { height: 14px; width: auto; object-fit: contain; margin-bottom: 6px; opacity: 0.5; }
  .model-name {
    font-size: 30px; font-weight: 300;
    letter-spacing: 0.2em;
    line-height: 1.1; text-align: center;
  }
  .model-agency {
    font-size: 7px; letter-spacing: 0.25em; text-transform: uppercase;
    color: #999; margin-top: 3px;
  }
  .sizing-row {
    font-size: 9.5px; letter-spacing: 0.05em; color: #333;
    margin-top: 4px; text-align: center;
  }
  .sep { color: #ccc; }

  /* Body: photos + info panel */
  .model-body {
    display: flex;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
  .photos-area {
    display: flex;
    flex: 1;
    gap: 2px;
    background: #e8e8e8;
    overflow: hidden;
  }
  .photo { overflow: hidden; flex: 1; }
  .photo-1 { flex: 1.15; }
  .photo-2 { flex: 0.85; }
  .photo img {
    width: 100%; height: 100%;
    object-fit: cover; object-position: top center; display: block;
  }
  .photo-empty { width: 100%; height: 100%; background: #e8e8e8; }

  /* Right panel */
  .info-panel {
    width: 52mm;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 18px 14px 18px 16px;
    border-left: 1px solid #ebebeb;
  }
  .info-main { display: flex; flex-direction: column; gap: 10px; }
  .info-option {
    font-size: 12px; font-weight: 300;
    letter-spacing: 0.12em; text-transform: uppercase; color: #222;
  }
  .info-rate {
    font-size: 12px; font-weight: 300;
    letter-spacing: 0.08em; color: #222;
  }
  .info-note {
    font-size: 8.5px; color: #444; line-height: 1.5;
    display: flex; flex-direction: column; gap: 1px;
  }
  .note-lbl {
    font-size: 7px; letter-spacing: 0.2em; text-transform: uppercase; color: #bbb;
  }
  .info-links { display: flex; flex-direction: column; gap: 6px; }
  .pdf-link {
    font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase;
    color: #0070c0; text-decoration: underline;
    -webkit-print-color-adjust: exact;
  }
</style>
</head>
<body>
${coverPage}
${pages}
<script>
  window.addEventListener('load', function() {
    var imgs = document.querySelectorAll('img');
    var total = imgs.length, loaded = 0;
    function tryPrint() { if (++loaded >= total) setTimeout(window.print, 400); }
    if (total === 0) { setTimeout(window.print, 300); return; }
    imgs.forEach(function(img) {
      if (img.complete) tryPrint();
      else { img.onload = tryPrint; img.onerror = tryPrint; }
    });
  });
</script>
</body>
</html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="${esc(presName)}.pdf"`,
      }
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
