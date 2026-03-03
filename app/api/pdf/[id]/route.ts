import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const esc = (s = '') => (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')

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
    const { data: presentation } = await supabase.from('presentations').select('*, projects(name)').eq('id', id).single()
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
    // Group models by category
    interface CategoryGroup { id: string; name: string; models: any[] }
    const grouped: CategoryGroup[] = []
    cats.forEach((cat: any) => {
      const models = presentationModels.filter((pm: any) => pm.category_id === cat.id)
      if (models.length) grouped.push({ id: cat.id, name: cat.name, models })
    })
    const uncategorized = presentationModels.filter((pm: any) => !pm.category_id)
    if (uncategorized.length) grouped.push({ id: 'none', name: '', models: uncategorized })

    const projectName = (presentation.projects as any)?.name || ''
    const presName = presentation.name

    const modelSlide = (pm: any) => {
      const m = pm.models
      const media = (mediaByModel[pm.model_id] || []).filter((med: any) => med.type !== 'video')
      const primaryPhoto = media.find((med: any) => med.is_pdf_primary) || media[0]
      const secondaryPhoto = media.find((med: any) => med.is_pdf_secondary) || media[1]

      const sizing = []
      if (m.height_ft) sizing.push(`${m.height_ft}'${m.height_in || 0}" HT`)
      if (m.bust) sizing.push(`${m.bust} B`)
      if (m.waist) sizing.push(`${m.waist} W`)
      if (m.hips) sizing.push(`${m.hips} H`)
      if (m.chest) sizing.push(`${m.chest} CH`)
      if (m.inseam) sizing.push(`${m.inseam} IN`)
      if (m.dress_size) sizing.push(`Dress ${m.dress_size}`)
      if (m.suit_size) sizing.push(`Suit ${m.suit_size}`)
      if (m.shoe_size) sizing.push(`Shoe ${m.shoe_size}`)

      const igHandle = m.instagram_handle ? `@${m.instagram_handle.replace('@','')}` : ''

      return `
        <div class="model-slide">
          <div class="slide-photos">
            ${primaryPhoto ? `<div class="photo-primary"><img src="${esc(primaryPhoto.public_url)}" /></div>` : '<div class="photo-primary photo-empty"></div>'}
            ${secondaryPhoto ? `<div class="photo-secondary"><img src="${esc(secondaryPhoto.public_url)}" /></div>` : ''}
          </div>
          <div class="slide-info">
            <div class="model-name">${esc(m.first_name)} ${esc(m.last_name)}</div>
            ${m.agency ? `<div class="model-agency">${esc(m.agency)}</div>` : ''}
            ${sizing.length ? `<div class="model-sizing">${sizing.map(s => `<span>${esc(s)}</span>`).join('')}</div>` : ''}
            ${igHandle ? `<div class="model-ig">${esc(igHandle)}</div>` : ''}
            ${pm.admin_notes ? `<div class="model-notes">${esc(pm.admin_notes)}</div>` : ''}
            ${pm.rate ? `<div class="model-rate">${esc(pm.rate)}</div>` : ''}
            ${pm.location ? `<div class="model-location">${esc(pm.location)}</div>` : ''}
          </div>
        </div>`
    }

    const sectionPages = grouped.map(group => {
      const header = group.name ? `
        <div class="section-header-slide">
          <div class="section-header-name">${esc(group.name)}</div>
        </div>` : ''
      return header + group.models.map(modelSlide).join('')
    }).join('')

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${esc(presName)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background: white; }
  @page { size: A4 landscape; margin: 0; }

  .model-slide, .section-header-slide {
    width: 297mm; height: 210mm;
    page-break-after: always;
    display: flex;
    overflow: hidden;
    position: relative;
  }
  .section-header-slide {
    align-items: center;
    justify-content: center;
    background: #000;
    flex-direction: column;
    gap: 16px;
  }
  .section-header-slide::before {
    content: '${esc(presName)}';
    position: absolute;
    top: 28px;
    left: 40px;
    font-size: 8px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.4);
  }
  .section-header-name {
    font-size: 42px;
    font-weight: 200;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: white;
  }

  /* Model slide layout */
  .slide-photos {
    display: flex;
    gap: 3px;
    height: 100%;
    background: #f5f5f5;
    flex-shrink: 0;
    width: 55%;
  }
  .photo-primary { flex: 1; overflow: hidden; }
  .photo-primary img, .photo-secondary img { width: 100%; height: 100%; object-fit: cover; object-position: top center; display: block; }
  .photo-secondary { width: 38%; overflow: hidden; }
  .photo-empty { background: #ececec; }

  .slide-info {
    flex: 1;
    padding: 40px 36px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 14px;
    border-left: 1px solid #e5e5e5;
  }
  .model-name {
    font-size: 22px;
    font-weight: 300;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    line-height: 1.2;
  }
  .model-agency { font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: #888; }
  .model-sizing { display: flex; flex-wrap: wrap; gap: 6px 14px; }
  .model-sizing span { font-size: 8px; letter-spacing: 0.15em; text-transform: uppercase; color: #444; }
  .model-ig { font-size: 9px; letter-spacing: 0.1em; color: #888; }
  .model-notes { font-size: 9px; color: #555; line-height: 1.6; font-style: italic; }
  .model-rate { font-size: 11px; font-weight: 500; letter-spacing: 0.1em; }
  .model-location { font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase; color: #888; }

  /* Watermark presentation name */
  .slide-info::after {
    content: '${esc(presName)}';
    position: absolute;
    bottom: 24px;
    right: 32px;
    font-size: 7px;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: #ddd;
  }
  .model-slide { position: relative; }
</style>
</head>
<body>
${sectionPages}
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
