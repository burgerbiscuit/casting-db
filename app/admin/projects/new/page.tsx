'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { ProjectFormFields, ProjectFormData, emptyProjectForm, toDbPayload } from '@/components/ProjectFormFields'
import { ImagePlus, X } from 'lucide-react'

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function NewProject() {
  const supabase = createClient()
  const router = useRouter()
  const [form, setForm] = useState<ProjectFormData>(emptyProjectForm())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasNewCols, setHasNewCols] = useState(false)
  const [moodboardFiles, setMoodboardFiles] = useState<File[]>([])
  const [moodboardPreviews, setMoodboardPreviews] = useState<string[]>([])

  // Check if new columns exist
  useEffect(() => {
    supabase.from('projects').select('photographer_url').limit(1).then(({ error }) => {
      setHasNewCols(!error)
    })
  }, [])

  const onChange = (updates: Partial<ProjectFormData>) => {
    setForm(f => {
      const next = { ...f, ...updates }
      // Auto-slug from name
      if (updates.name !== undefined) next.slug = slugify(updates.name)
      return next
    })
  }

  const addMoodboard = (files: FileList | null) => {
    if (!files) return
    const arr = Array.from(files)
    setMoodboardFiles(f => [...f, ...arr])
    arr.forEach(file => {
      const url = URL.createObjectURL(file)
      setMoodboardPreviews(p => [...p, url])
    })
  }

  const removeMoodboard = (i: number) => {
    setMoodboardFiles(f => f.filter((_, idx) => idx !== i))
    setMoodboardPreviews(p => p.filter((_, idx) => idx !== i))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) { setError('Project name is required.'); return }
    setLoading(true); setError('')

    const payload = { name: form.name, slug: form.slug || slugify(form.name), ...toDbPayload(form, hasNewCols) }
    const { data: proj, error: projErr } = await supabase.from('projects').insert(payload).select('id, name').single()
    if (projErr) { setError(projErr.message); setLoading(false); return }

    // Auto-create presentation
    await supabase.from('presentations').insert({ project_id: proj.id, name: proj.name, is_published: false })

    // Upload moodboard images
    for (const file of moodboardFiles) {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `projects/${proj.id}/moodboard/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: upErr } = await supabase.storage.from('project-files').upload(path, file)
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from('project-files').getPublicUrl(path)
        await supabase.from('project_files').insert({
          project_id: proj.id,
          name: file.name,
          file_type: 'moodboard',
          public_url: publicUrl,
          storage_path: path,
        })
      }
    }

    router.push(`/admin/projects/${proj.id}`)
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-light tracking-widest uppercase mb-10">New Project</h1>

      {!hasNewCols && (
        <div className="border border-amber-200 bg-amber-50 px-4 py-3 mb-8 text-xs text-amber-700">
          <strong>Migration needed</strong> — URL hyperlink fields and expanded billing are locked until you run the DB migration.{' '}
          <a href="/admin/settings?tab=migrations" className="underline">Run migration →</a>
        </div>
      )}

      <form onSubmit={submit} className="space-y-10">
        <ProjectFormFields form={form} onChange={onChange} showSlug hasNewCols={hasNewCols} />

        {/* Moodboard */}
        <div>
          <p className="text-xs tracking-widest uppercase font-medium mb-4 pb-2 border-b border-neutral-100">Moodboard</p>
          <div className="flex flex-wrap gap-3">
            {moodboardPreviews.map((url, i) => (
              <div key={i} className="relative w-24 h-32 group">
                <img src={url} className="w-full h-full object-cover" alt="" />
                <button type="button" onClick={() => removeMoodboard(i)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={10} />
                </button>
              </div>
            ))}
            <label className="w-24 h-32 border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-black transition-colors">
              <input type="file" accept="image/*" multiple className="hidden" onChange={e => addMoodboard(e.target.files)} />
              <ImagePlus size={18} className="text-neutral-300" />
              <span className="text-[10px] tracking-widest uppercase text-neutral-300">Add</span>
            </label>
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex gap-4 pt-2">
          <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Project'}</Button>
        </div>
      </form>
    </div>
  )
}
