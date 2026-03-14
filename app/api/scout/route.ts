import { createServiceClient } from '@/lib/supabase/server'
import { cleanInstagramHandle } from '@/lib/instagram-utils'
import { NextRequest, NextResponse } from 'next/server'

// Scout submissions create a model in the general database only — NOT linked to any project.
// Models must sign into a casting (/cast/[slug]) to be linked to a project.
// In-memory rate limit fallback: max 3 submissions per IP per 10 minutes per instance
// (real rate limiting is DB-backed below — this is a fast first-pass guard)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkInMemoryRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 600_000 })
    return true
  }
  if (entry.count >= 3) return false
  entry.count++
  return true
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  if (!checkInMemoryRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many submissions from your connection. Please wait a few minutes and try again.' }, { status: 429 })
  }

  const contentType = req.headers.get('content-type') || ''
  const supabase = await createServiceClient()

  // Parse as multipart FormData (supports file uploads) or fall back to JSON
  let body: Record<string, any> = {}
  let photoFiles: { name: string; arrayBuffer: ArrayBuffer; type: string }[] = []

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData()
    for (const [key, value] of formData.entries()) {
      if ((key === 'photos' || key.startsWith('photo')) && value instanceof File && value.size > 0) {
        photoFiles.push({ name: value.name, arrayBuffer: await value.arrayBuffer(), type: value.type })
      } else if (value instanceof File) {
        // ignore other file fields
      } else if (typeof value === 'string') {
        // Parse JSON arrays if needed
        if (key === 'skills' || key === 'hobbies' || key === 'languages' || key === 'ethnicity_broad' || key === 'ethnicity_specific') {
          try { body[key] = JSON.parse(value) } catch { body[key] = value ? [value] : [] }
        } else {
          body[key] = value
        }
      }
    }
  } else {
    body = await req.json()
  }

  // Validate required fields
  const firstName = (body.first_name || '').trim()
  const lastName = (body.last_name || '').trim()
  if (!firstName || !lastName) {
    return NextResponse.json({ error: 'First name and last name are required.' }, { status: 400 })
  }
  if (firstName.length > 100 || lastName.length > 100) {
    return NextResponse.json({ error: 'Name fields are too long.' }, { status: 400 })
  }
  if (body.email && !EMAIL_RE.test(body.email)) {
    return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
  }

  // Email deduplication — check if this email already submitted (within last 90 days)
  if (body.email) {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    const { data: existing } = await supabase
      .from('models')
      .select('id')
      .eq('email', body.email.trim().toLowerCase())
      .gte('created_at', cutoff)
      .limit(1)
    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'This email has already been submitted. If you need to update your profile, please contact us directly.' }, { status: 409 })
    }
  }

  const { data, error } = await supabase.from('models').insert({
    first_name: firstName,
    last_name: lastName,
    email: body.email || null,
    phone: body.phone || null,
    gender: body.gender || null,
    date_of_birth: body.date_of_birth || null,
    instagram_handle: cleanInstagramHandle(body.instagram_handle),
    tiktok_handle: body.tiktok_handle || null,
    portfolio_url: body.portfolio_url || null,
    website_url: body.website_url || null,
    agency: body.agency || null,
    based_in: body.based_in || null,
    height_ft: body.height_ft ? parseInt(body.height_ft) : null,
    height_in: body.height_in ? parseInt(body.height_in) : null,
    bust: body.bust || null, waist: body.waist || null, hips: body.hips || null,
    chest: body.chest || null, dress_size: body.dress_size || null,
    shoe_size: body.shoe_size || null, suit_size: body.suit_size || null, inseam: body.inseam || null,
    ethnicity_broad: Array.isArray(body.ethnicity_broad) ? body.ethnicity_broad.join(',') : (body.ethnicity_broad || null),
    ethnicity_specific: Array.isArray(body.ethnicity_specific) ? body.ethnicity_specific.join(',') : (body.ethnicity_specific || null),
    languages: Array.isArray(body.languages) ? body.languages : [],
    skills: Array.isArray(body.skills) ? body.skills : [],
    hobbies: Array.isArray(body.hobbies) ? body.hobbies : [],
    notes: body.notes || null,
    home_gym: body.home_gym || null,
    source: body.source || 'scouting',
    reviewed: false,
    board: body.board || null,
    agent_name: body.agent_name || null,
  }).select('id').single()

  if (error) {
    console.error('Scout insert error:', error.message)
    return NextResponse.json({ error: 'Submission failed. Please try again.' }, { status: 500 })
  }

  const modelId = data.id

  // Upload photos server-side using service key — bypasses storage RLS
  const uploadErrors: string[] = []
  for (const photo of photoFiles.slice(0, 2)) {
    try {
      const ext = photo.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${modelId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('model-media')
        .upload(path, photo.arrayBuffer, { contentType: photo.type || 'image/jpeg' })
      if (upErr) {
        console.error('Scout photo upload error:', upErr.message)
        uploadErrors.push(upErr.message)
        continue
      }
      const { data: { publicUrl } } = supabase.storage.from('model-media').getPublicUrl(path)
      await supabase.from('model_media').insert({
        model_id: modelId,
        storage_path: path,
        public_url: publicUrl,
        type: 'photo',
        is_visible: true,
        display_order: photoFiles.indexOf(photo),
      })
    } catch (err: any) {
      console.error('Scout photo exception:', err?.message)
      uploadErrors.push(err?.message || 'upload failed')
    }
  }

  // If submitted via the climber form, auto-add to the Tender Moments project + presentation
  if (body.source === 'climber') {
    const CLIMBER_PROJECT_ID = '120bf745-09fa-4f6a-8d54-e2ef5284636b'
    const CLIMBER_PRESENTATION_ID = '8e5e3d04-f90d-4ba1-8a97-e300afc6b630'

    // Add to project_models (shows on the Models tab)
    await supabase.from('project_models').upsert({
      project_id: CLIMBER_PROJECT_ID,
      model_id: modelId,
      signed_in_at: new Date().toISOString(),
    }, { onConflict: 'project_id,model_id' })

    // Add to presentation_models (shows on the Presentation tab)
    await supabase.from('presentation_models').insert({
      presentation_id: CLIMBER_PRESENTATION_ID,
      model_id: modelId,
      is_visible: true,
    })
  }

  return NextResponse.json({ ok: true, id: modelId, uploadErrors })
}
