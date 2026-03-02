'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Plus, X } from 'lucide-react'

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function NewProject() {
  const supabase = createClient()
  const router = useRouter()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [clientName, setClientName] = useState('')
  const [location, setLocation] = useState('')
  const [shootDate, setShootDate] = useState('')
  const [specs, setSpecs] = useState('')
  const [presRounds, setPresRounds] = useState<{label: string, date: string}[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const inp = 'w-full border-b border-neutral-200 py-2 text-sm focus:outline-none focus:border-black bg-transparent'

  const onNameChange = (v: string) => { setName(v); setSlug(slugify(v)) }
  const addRound = () => setPresRounds(r => [...r, { label: 'Round ' + (r.length + 1), date: '' }])
  const removeRound = (i: number) => setPresRounds(r => r.filter((_, idx) => idx !== i))
  const updateRound = (i: number, field: 'label' | 'date', val: string) =>
    setPresRounds(r => r.map((rnd, idx) => idx === i ? { ...rnd, [field]: val } : rnd))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { data: proj, error } = await supabase.from('projects').insert({
      name, slug, description,
      client_name: clientName || null,
      location: location || null,
      shoot_date: shootDate || null,
      specs: specs || null,
      presentation_rounds: presRounds.filter(r => r.date),
    }).select('id, name').single()
    if (error) { setError(error.message); setLoading(false); return }

    // Auto-create a presentation for every new project
    if (proj) {
      await supabase.from('presentations').insert({
        project_id: proj.id,
        name: proj.name,
        is_published: false,
      })
    }
    router.push('/admin/projects')
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-light tracking-widest uppercase mb-10">New Project</h1>
      <form onSubmit={submit} className="space-y-8">

        <div className="space-y-5">
          <Input label="Project Name *" value={name} onChange={e => onNameChange(e.target.value)} required autoFocus />
          <div>
            <Input label="Slug (URL)" value={slug} onChange={e => setSlug(e.target.value)} required />
            <p className="text-xs text-neutral-400 mt-1">Cast link: /cast/{slug}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label block mb-1">Client / Brand</label>
              <input value={clientName} onChange={e => setClientName(e.target.value)} className={inp} placeholder="e.g. Dior" />
            </div>
            <div>
              <label className="label block mb-1">Location</label>
              <input value={location} onChange={e => setLocation(e.target.value)} className={inp} placeholder="e.g. Bangkok, Thailand" />
            </div>
          </div>
          <div>
            <label className="label block mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className="w-full border-b border-neutral-200 bg-transparent py-2 text-sm focus:outline-none focus:border-black resize-none" placeholder="Brief project overview..." />
          </div>
        </div>

        <div>
          <label className="label block mb-1">Shoot Date</label>
          <input type="date" value={shootDate} onChange={e => setShootDate(e.target.value)} className={inp} />
        </div>

        <div>
          <label className="label block mb-1">Specs &amp; Requirements</label>
          <textarea value={specs} onChange={e => setSpecs(e.target.value)} rows={4}
            className="w-full border-b border-neutral-200 bg-transparent py-2 text-sm focus:outline-none focus:border-black resize-none"
            placeholder="e.g. Female, 18-28, height 5'7&quot;+, natural look, no visible tattoos..." />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="label">Presentation Rounds</p>
            <button type="button" onClick={addRound}
              className="flex items-center gap-1 text-xs tracking-widest uppercase hover:opacity-60 transition-opacity">
              <Plus size={12} /> Add Round
            </button>
          </div>
          {presRounds.length === 0 && (
            <p className="text-xs text-neutral-400">No rounds added. Click + Add Round to schedule presentation dates.</p>
          )}
          <div className="space-y-3">
            {presRounds.map((r, i) => (
              <div key={i} className="flex items-center gap-3">
                <input value={r.label} onChange={e => updateRound(i, 'label', e.target.value)}
                  className="border-b border-neutral-200 py-2 text-sm focus:outline-none focus:border-black bg-transparent w-32" placeholder="Round 1" />
                <input type="date" value={r.date} onChange={e => updateRound(i, 'date', e.target.value)}
                  className="border-b border-neutral-200 py-2 text-sm focus:outline-none focus:border-black bg-transparent flex-1" />
                <button type="button" onClick={() => removeRound(i)} className="text-neutral-300 hover:text-red-400 transition-colors">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
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
