import { createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type') || ''
  const svc = await createServiceClient()

  let fields: Record<string, any> = {}
  let resumeFile: { buffer: ArrayBuffer; name: string; type: string } | null = null

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData()
    for (const [key, value] of formData.entries()) {
      if (value instanceof File && value.size > 0) {
        resumeFile = { buffer: await value.arrayBuffer(), name: value.name, type: value.type }
      } else if (typeof value === 'string') {
        try { fields[key] = JSON.parse(value) } catch { fields[key] = value }
      }
    }
  } else {
    fields = await req.json()
  }

  let resume_url = null
  let resume_storage_path = null

  if (resumeFile) {
    const ext = resumeFile.name.split('.').pop() || 'pdf'
    const path = `assistants/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error: upErr } = await svc.storage
      .from('resumes')
      .upload(path, resumeFile.buffer, { contentType: resumeFile.type || 'application/pdf' })
    if (upErr) return NextResponse.json({ error: 'Resume upload failed: ' + upErr.message }, { status: 500 })
    // Bucket is private — generate a long-lived signed URL (10 years) for admin access
    const { data: signedData } = await svc.storage.from('resumes').createSignedUrl(path, 60 * 60 * 24 * 365 * 10)
    resume_url = signedData?.signedUrl ?? null
    resume_storage_path = path
  }

  const { error } = await svc.from('assistant_submissions').insert({
    first_name: fields.first_name,
    last_name: fields.last_name,
    email: fields.email,
    phone: fields.phone || null,
    city: fields.city || null,
    country: fields.country || null,
    based_in: [fields.city, fields.country].filter(Boolean).join(', ') || null,
    experience_level: fields.experience_level || null,
    years_experience: fields.years_experience ? parseInt(fields.years_experience) : null,
    languages: Array.isArray(fields.languages) && fields.languages.length ? fields.languages : null,
    skills: Array.isArray(fields.skills) && fields.skills.length ? fields.skills : null,
    software: Array.isArray(fields.software) && fields.software.length ? fields.software : null,
    instagram_handle: fields.instagram_handle || null,
    website_url: fields.website_url || null,
    resume_url,
    resume_storage_path,
    notes: fields.notes || null,
    opportunity_type: fields.opportunity_type || null,
    school_credit: fields.school_credit === true || fields.school_credit === 'true',
    status: 'new',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
