'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Suspense } from 'react'

function NewPresentationForm() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [projects, setProjects] = useState<any[]>([])
  const [projectId, setProjectId] = useState(searchParams.get('project') || '')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('projects').select('id, name').eq('status', 'active').then(({ data }) => setProjects(data || []))
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data } = await supabase.from('presentations').insert({ project_id: projectId, name }).select('id').single()
    if (data) {
      // Auto-add all models already signed into this project
      const { data: pms } = await supabase.from('project_models').select('model_id').eq('project_id', projectId)
      if (pms && pms.length > 0) {
        await supabase.from('presentation_models').insert(
          pms.map((pm: any, i: number) => ({
            presentation_id: data.id, model_id: pm.model_id,
            display_order: i, show_sizing: true, show_instagram: true, show_portfolio: true, is_visible: true
          }))
        )
      }
      router.push(`/admin/presentations/${data.id}`)
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-light tracking-widest uppercase mb-10">New Presentation</h1>
      <form onSubmit={submit} className="space-y-6">
        <div>
          <label className="label block mb-2">Project</label>
          <select value={projectId} onChange={e => setProjectId(e.target.value)} required
            className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none">
            <option value="">Select project...</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <Input label="Presentation Name" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Initial Selects" />
        <div className="flex gap-4">
          <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create'}</Button>
        </div>
      </form>
    </div>
  )
}

export default function NewPresentationPage() {
  return <Suspense><NewPresentationForm /></Suspense>
}
