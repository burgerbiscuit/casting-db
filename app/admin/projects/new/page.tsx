'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function NewProject() {
  const supabase = createClient()
  const router = useRouter()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onNameChange = (v: string) => {
    setName(v)
    setSlug(slugify(v))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.from('projects').insert({ name, slug, description })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/admin/projects')
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-light tracking-widest uppercase mb-10">New Project</h1>
      <form onSubmit={submit} className="space-y-6">
        <Input label="Project Name" value={name} onChange={e => onNameChange(e.target.value)} required autoFocus />
        <Input label="Slug (URL)" value={slug} onChange={e => setSlug(e.target.value)} required />
        <p className="text-xs text-neutral-400">Cast link: /cast/{slug}</p>
        <div>
          <label className="label block mb-2">Description (optional)</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="w-full border-b border-neutral-300 bg-transparent px-0 py-2 text-sm focus:outline-none focus:border-black resize-none"
            placeholder="Project details..."
          />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex gap-4">
          <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Project'}</Button>
        </div>
      </form>
    </div>
  )
}
