import { createClient, createServiceClient } from '@/lib/supabase/server'
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
      const igUrl = igHandle ? `https://www.instagram.com/${igHandle}/` : ''
      const portfolioRaw = pm.show_portfolio && m.portfolio_url ? toUrl(m.portfolio_url) : ''
      const igFollowers = m.instagram_followers ? Number(m.instagram_followers).toLocaleString() : ''

      return `
        <div class="slide model-slide">
          <div class="photos-row">
            <div class="photo-main">${photo1 ? `<img src="${esc(photo1.public_url)}" />` : '<div class="photo-empty"></div>'}</div>
            <div class="photo-sec">${photo2 ? `<img src="${esc(photo2.public_url)}" />` : '<div class="photo-empty"></div>'}</div>
          </div>
          <div class="model-info">
            <div class="info-left">
              <div class="model-name">${esc(m.first_name)} ${esc(m.last_name)}</div>
              ${m.agency ? `<div class="model-agency">${esc(m.agency)}</div>` : ''}
              ${sizing.length ? `<div class="sizing-row">${sizing.map((s: string) => `<span>${esc(s)}</span>`).join('<span class="dot">·</span>')}</div>` : ''}
              <div class="links-row">
                ${igUrl ? `<a href="${esc(igUrl)}" class="pdf-link">Instagram${igFollowers ? ` (${igFollowers})` : ''} ↗</a>` : ''}
                ${portfolioRaw ? `<a href="${esc(portfolioRaw)}" class="pdf-link">Portfolio ↗</a>` : ''}
              </div>
            </div>
            <div class="info-right">
              ${pm.rate ? `<div class="note-item"><span class="note-label">Rate</span><span class="note-val">${esc(pm.rate)}</span></div>` : ''}
              ${pm.location ? `<div class="note-item"><span class="note-label">Location</span><span class="note-val">${esc(pm.location)}</span></div>` : ''}
              ${pm.admin_notes ? `<div class="note-item"><span class="note-label">Notes</span><span class="note-val">${esc(pm.admin_notes)}</span></div>` : ''}
            </div>
          </div>
        </div>`
    }

    // Divider: ONLY the section name, nothing else
    const sectionDivider = (name: string) => `
      <div class="slide divider-slide">
        <div class="divider-name">${esc(name)}</div>
      </div>`

    // Title page: logo image + project name + shoot date + photographer + stylist
    const titlePage = `
      <div class="slide title-slide">
        <div class="title-inner">
          <img src="${baseUrl}/logo.jpg" class="title-logo-img" alt="Tasha Tongpreecha Casting" />
          <div class="title-project">${esc(projectName)}</div>
          <div class="title-meta">
            ${shootDate ? `<div class="title-meta-row">${esc(shootDate)}</div>` : ''}
            ${photographer ? `<div class="title-meta-row"><span class="meta-label">Photographer</span> ${esc(photographer)}</div>` : ''}
            ${stylist ? `<div class="title-meta-row"><span class="meta-label">Stylist</span> ${esc(stylist)}</div>` : ''}
          </div>
          <div class="title-count">${presentationModels.length} ${presentationModels.length === 1 ? 'Model' : 'Models'}</div>
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
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: #fff; color: #111; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

  @page { size: 210mm 297mm portrait; margin: 0; }

  .slide {
    width: 210mm;
    height: 297mm;
    page-break-after: always;
    page-break-inside: avoid;
    overflow: hidden;
    position: relative;
    background: white;
    display: flex;
    flex-direction: column;
  }

  /* ── TITLE PAGE ─────────────────────── */
  .title-slide {
    align-items: center;
    justify-content: center;
    background: #fff;
  }
  .title-inner { text-align: center; padding: 0 40mm; width: 100%; }
  .title-logo-img { height: 28px; width: auto; margin-bottom: 48px; object-fit: contain; }
  .title-project {
    font-size: 28px; font-weight: 200;
    letter-spacing: 0.25em; text-transform: uppercase;
    line-height: 1.2; margin-bottom: 28px;
  }
  .title-meta { display: flex; flex-direction: column; gap: 7px; margin-bottom: 32px; }
  .title-meta-row { font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: #777; }
  .meta-label { color: #bbb; margin-right: 6px; }
  .title-count { font-size: 8px; letter-spacing: 0.3em; text-transform: uppercase; color: #ccc; }

  /* ── DIVIDER ─────────────────────────── */
  .divider-slide {
    background: #000;
    align-items: center;
    justify-content: center;
  }
  .divider-name {
    font-size: 36px; font-weight: 200;
    letter-spacing: 0.3em; text-transform: uppercase;
    color: #fff;
    text-align: center;
    padding: 0 20mm;
  }

  /* ── MODEL SLIDE ─────────────────────── */
  .model-slide { }
  .photos-row {
    display: flex;
    width: 100%;
    height: 195mm;
    flex-shrink: 0;
    gap: 1.5px;
    background: #e8e8e8;
  }
  .photo-main { flex: 1.15; overflow: hidden; }
  .photo-sec  { flex: 0.85; overflow: hidden; }
  .photo-main img,
  .photo-sec img { width: 100%; height: 100%; object-fit: cover; object-position: top center; display: block; }
  .photo-empty { width: 100%; height: 100%; background: #ebebeb; }

  .model-info {
    flex: 1;
    display: flex;
    align-items: flex-start;
    padding: 12px 10mm 10px;
    gap: 8mm;
    border-top: 1px solid #e8e8e8;
    min-height: 0;
    overflow: hidden;
  }
  .info-left { flex: 1.4; display: flex; flex-direction: column; gap: 5px; min-width: 0; }
  .info-right { flex: 1; display: flex; flex-direction: column; gap: 5px; min-width: 0; }

  .model-name {
    font-size: 14px; font-weight: 300;
    letter-spacing: 0.15em; text-transform: uppercase;
    line-height: 1.15; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .model-agency { font-size: 7px; letter-spacing: 0.2em; text-transform: uppercase; color: #999; }
  .sizing-row { display: flex; flex-wrap: wrap; align-items: center; gap: 1px 0; }
  .sizing-row span { font-size: 7px; letter-spacing: 0.1em; color: #555; }
  .dot { font-size: 7px; color: #ccc; margin: 0 4px; }
  .links-row { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 2px; }
  .pdf-link {
    font-size: 7px; letter-spacing: 0.2em; text-transform: uppercase;
    color: #111; text-decoration: underline;
    -webkit-print-color-adjust: exact;
  }
  .note-item { display: flex; gap: 5px; align-items: baseline; }
  .note-label { font-size: 6.5px; letter-spacing: 0.18em; text-transform: uppercase; color: #bbb; min-width: 42px; flex-shrink: 0; }
  .note-val { font-size: 7.5px; color: #444; line-height: 1.4; }
</style>
</head>
<body>
${titlePage}
${pages}
<script>
  // Give images time to load before print dialog
  window.addEventListener('load', function() {
    var imgs = document.querySelectorAll('img');
    var loaded = 0;
    if (imgs.length === 0) { setTimeout(window.print, 300); return; }
    imgs.forEach(function(img) {
      if (img.complete) { loaded++; if (loaded === imgs.length) setTimeout(window.print, 300); }
      else { img.onload = img.onerror = function() { loaded++; if (loaded === imgs.length) setTimeout(window.print, 300); }; }
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
