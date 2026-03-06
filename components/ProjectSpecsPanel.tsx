'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ProjectFormFields, ProjectFormData, fromProject, toDbPayload } from '@/components/ProjectFormFields'
import { ImagePlus, X, ExternalLink } from 'lucide-react'

export default function ProjectSpecsPanel({ project }: { project: any }) {
  const supabase = createClient()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<ProjectFormData>(fromProject(project))
  const [display, setDisplay] = useState(project)
  const [hasNewCols, setHasNewCols] = useState(false)
  const [moodboards, setMoodboards] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    supabase.from('projects').select('photographer_url').limit(1).then(({ error }) => setHasNewCols(!error))
    loadMoodboards()
  }, [])

  const loadMoodboards = async () => {
    const { data } = await supabase.from('project_files').select('*').eq('project_id', project.id).eq('file_type', 'moodboard').order('created_at')
    setMoodboards(data || [])
  }

  const save = async () => {
    setSaving(true)
    const payload = toDbPayload(form, hasNewCols)
    const res = await fetch('/api/projects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: project.id, ...payload })
    })
    const result = await res.json()
    setSaving(false)
    if (result.data) { setDisplay(result.data); setForm(fromProject(result.data)); setEditing(false) }
  }

  const [uploadError, setUploadError] = useState('')

  const uploadMoodboard = async (files: FileList | null) => {
    if (!files) return
    setUploading(true)
    setUploadError('')
    try {
      for (const file of Array.from(files)) {
        // Upload directly to Supabase storage (bypasses Vercel 4.5MB API limit)
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const path = `project-files/${project.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: upErr } = await supabase.storage.from('model-media').upload(path, file, { contentType: file.type })
        if (upErr) throw new Error(`Storage upload failed: ${upErr.message}`)
        const { data: { publicUrl } } = supabase.storage.from('model-media').getPublicUrl(path)
        // Save record to DB
        const { error: dbErr } = await supabase.from('project_files').insert({
          project_id: project.id,
          name: file.name,
          storage_path: path,
          public_url: publicUrl,
          file_type: 'moodboard',
        })
        if (dbErr) throw new Error(`DB save failed: ${dbErr.message}`)
      }
    } catch (e: any) {
      setUploadError(e.message || 'Upload failed')
    }
    setUploading(false)
    loadMoodboards()
  }

  const deleteMoodboard = async (id: string, storagePath: string) => {
    await fetch('/api/project-files', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId: id, storagePath, bucket: 'model-media', table: 'project_files' }),
    })
    loadMoodboards()
  }

  const onChange = (updates: Partial<ProjectFormData>) => setForm(f => ({ ...f, ...updates }))

  const creditLink = (name: string, url: string | undefined) =>
    url ? <a href={url} target="_blank" rel="noopener noreferrer" className="hover:opacity-60 transition-opacity underline underline-offset-2 flex items-center gap-1">{name} <ExternalLink size={10} /></a> : <span>{name}</span>

  // Read-only view
  if (!editing) {
    const credits = [
      { label: 'Client', value: display.client_name, url: display.client_url },
      { label: 'Photographer', value: display.photographer, url: display.photographer_url },
      { label: 'Stylist', value: display.stylist, url: display.stylist_url },
    ].filter(f => f.value)

    const shoot = [
      { label: 'Location', value: display.location },
      { label: 'Shoot Date', value: display.shoot_date ? new Date(display.shoot_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null },
      { label: 'Rate', value: display.model_rate },
      { label: 'Hours', value: display.hours },
      { label: 'Pages', value: display.pages },
      { label: 'Usage', value: display.usage },
    ].filter(f => f.value)

    const billing = [
      { label: 'Billing Contact', value: display.billing_contact },
      { label: 'Billing Name', value: display.billing_name },
      { label: 'Billing Email', value: display.billing_email },
      { label: 'Billing Address', value: display.billing_address },
    ].filter(f => f.value)

    const hasAny = credits.length || shoot.length || billing.length || display.specs || moodboards.length

    return (
      <div className="border border-neutral-100 p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs tracking-widest uppercase text-neutral-400">Project Details</p>
          <button onClick={() => setEditing(true)} className="text-[10px] tracking-widest uppercase text-neutral-400 hover:text-black border border-neutral-200 px-3 py-1 hover:border-black transition-colors">Edit</button>
        </div>

        {!hasAny ? (
          <button onClick={() => setEditing(true)} className="text-xs text-neutral-400 hover:text-black underline">+ Add project details</button>
        ) : (
          <div className="space-y-6">
            {/* Credits */}
            {credits.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
                {credits.map(f => (
                  <div key={f.label}>
                    <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-0.5">{f.label}</p>
                    <p className="text-sm">{creditLink(f.value, f.url)}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Shoot details */}
            {shoot.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
                {shoot.map(f => (
                  <div key={f.label}>
                    <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-0.5">{f.label}</p>
                    <p className="text-sm">{f.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Client emails */}
            {display.client_emails?.length > 0 && (
              <div>
                <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-0.5">Client Emails</p>
                <p className="text-sm">{display.client_emails.join(', ')}</p>
              </div>
            )}

            {/* Billing */}
            {billing.length > 0 && (
              <div>
                <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-2">Billing</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
                  {billing.map(f => (
                    <div key={f.label}>
                      <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-0.5">{f.label}</p>
                      <p className="text-sm">{f.value}</p>
                    </div>
                  ))}
                </div>
                {display.billing_notes && (
                  <p className="text-xs text-neutral-500 mt-2 italic">{display.billing_notes}</p>
                )}
              </div>
            )}

            {/* Specs */}
            {display.specs && (
              <div>
                <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-0.5">Requirements</p>
                <p className="text-sm text-neutral-600 whitespace-pre-wrap">{display.specs}</p>
              </div>
            )}

            {/* Moodboard */}
            {moodboards.length > 0 && (
              <div>
                <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-2">Moodboard</p>
                <div className="flex flex-wrap gap-3">
                  {moodboards.map(m => (
                    <div key={m.id} className="relative group w-20 h-24">
                      <a href={m.public_url} target="_blank" rel="noopener noreferrer">
                        <img src={m.public_url} alt={m.name} className="w-full h-full object-cover hover:opacity-80 transition-opacity" />
                      </a>
                      <button onClick={() => deleteMoodboard(m.id, m.storage_path)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={9} />
                      </button>
                    </div>
                  ))}
                  <label className="w-20 h-24 border-2 border-dashed border-neutral-200 flex items-center justify-center cursor-pointer hover:border-black transition-colors">
                    <input type="file" accept="image/*" multiple className="hidden" onChange={e => uploadMoodboard(e.target.files)} />
                    <ImagePlus size={16} className={uploading ? 'animate-pulse text-neutral-400' : 'text-neutral-300'} />
                  </label>
                  {uploadError && <p className="text-red-500 text-[10px] mt-2 col-span-full">{uploadError}</p>}
                </div>
              </div>
            )}

            {moodboards.length === 0 && (
              <div>
                <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-2">Moodboard</p>
                <label className="inline-flex items-center gap-2 text-xs text-neutral-400 hover:text-black cursor-pointer border border-dashed border-neutral-200 px-4 py-2 hover:border-black transition-colors">
                  <input type="file" accept="image/*" multiple className="hidden" onChange={e => uploadMoodboard(e.target.files)} />
                  <ImagePlus size={14} />
                  {uploading ? 'Uploading...' : 'Upload moodboard images'}
                </label>
                {uploadError && <p className="text-red-500 text-[10px] mt-2">{uploadError}</p>}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="border border-black p-6 mb-4">
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs tracking-widest uppercase font-medium">Edit Project Details</p>
        <button onClick={() => { setForm(fromProject(display)); setEditing(false) }} className="text-neutral-400 hover:text-black text-lg leading-none">✕</button>
      </div>

      {!hasNewCols && (
        <div className="border border-amber-200 bg-amber-50 px-4 py-2 mb-6 text-xs text-amber-700">
          URL hyperlink fields + expanded billing are locked until you run the DB migration in Supabase SQL editor.
        </div>
      )}

      <ProjectFormFields form={form} onChange={onChange} hasNewCols={hasNewCols} />

      <div className="flex gap-3 mt-8">
        <button onClick={save} disabled={saving}
          className="px-6 py-2.5 text-xs tracking-widest uppercase bg-black text-white hover:bg-neutral-800 disabled:opacity-40 transition-colors">
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button onClick={() => { setForm(fromProject(display)); setEditing(false) }}
          className="px-6 py-2.5 text-xs tracking-widest uppercase border border-neutral-300 hover:border-black transition-colors">
          Cancel
        </button>
      </div>
    </div>
  )
}
