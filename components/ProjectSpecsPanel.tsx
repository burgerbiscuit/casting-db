'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

type Project = {
  id: string
  name: string
  description?: string
  client_name?: string
  location?: string
  shoot_date?: string
  specs?: string
  photographer?: string
  stylist?: string
  model_rate?: string
  hours?: string
  pages?: string
  usage?: string
  billing_contact?: string
  client_emails?: string[]
  presentation_rounds?: any[]
}

export default function ProjectSpecsPanel({ project }: { project: Project }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    client_name: project.client_name || '',
    location: project.location || '',
    shoot_date: project.shoot_date || '',
    photographer: project.photographer || '',
    stylist: project.stylist || '',
    model_rate: project.model_rate || '',
    hours: project.hours || '',
    pages: project.pages || '',
    usage: project.usage || '',
    billing_contact: project.billing_contact || '',
    client_emails: (project.client_emails || []).join(', '),
    specs: project.specs || '',
    description: project.description || '',
  })
  const [data, setData] = useState(project)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const save = async () => {
    setSaving(true)
    const emails = form.client_emails.split(',').map(e => e.trim()).filter(Boolean)
    const { data: updated, error } = await supabase.from('projects').update({
      client_name: form.client_name || null,
      location: form.location || null,
      shoot_date: form.shoot_date || null,
      photographer: form.photographer || null,
      stylist: form.stylist || null,
      model_rate: form.model_rate || null,
      hours: form.hours || null,
      pages: form.pages || null,
      usage: form.usage || null,
      billing_contact: form.billing_contact || null,
      client_emails: emails.length ? emails : null,
      specs: form.specs || null,
      description: form.description || null,
    }).eq('id', project.id).select().single()
    setSaving(false)
    if (updated) { setData(updated); setEditing(false) }
  }

  const fields = [
    { key: 'client_name', label: 'Client' },
    { key: 'location', label: 'Location' },
    { key: 'shoot_date', label: 'Shoot Date', type: 'date' },
    { key: 'photographer', label: 'Photographer' },
    { key: 'stylist', label: 'Stylist' },
    { key: 'model_rate', label: 'Model Rate' },
    { key: 'hours', label: 'Hours' },
    { key: 'pages', label: 'Pages' },
    { key: 'usage', label: 'Usage' },
    { key: 'billing_contact', label: 'Billing Contact' },
  ]

  const hasData = fields.some(f => (data as any)[f.key]) || data.client_emails?.length || data.specs

  if (!editing) return (
    <div className="border border-neutral-100 p-6 mb-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs tracking-widest uppercase text-neutral-400">Project Details</p>
        <button onClick={() => setEditing(true)} className="text-[10px] tracking-widest uppercase text-neutral-400 hover:text-black border border-neutral-200 px-3 py-1 hover:border-black transition-colors">Edit</button>
      </div>
      {!hasData ? (
        <button onClick={() => setEditing(true)} className="text-xs text-neutral-400 hover:text-black underline">+ Add project details</button>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
          {fields.map(f => (data as any)[f.key] ? (
            <div key={f.key}>
              <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-0.5">{f.label}</p>
              <p className="text-sm">
                {f.key === 'shoot_date' ? new Date((data as any)[f.key]).toLocaleDateString('en-US', {month:'long',day:'numeric',year:'numeric'}) : (data as any)[f.key]}
              </p>
            </div>
          ) : null)}
          {data.client_emails?.length ? (
            <div className="col-span-2">
              <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-0.5">Client Emails</p>
              <p className="text-sm">{data.client_emails.join(', ')}</p>
            </div>
          ) : null}
          {data.specs ? (
            <div className="col-span-2 md:col-span-4">
              <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-0.5">Notes / Specs</p>
              <p className="text-sm text-neutral-600 whitespace-pre-wrap">{data.specs}</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )

  return (
    <div className="border border-black p-6 mb-4">
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs tracking-widest uppercase">Edit Project Details</p>
        <button onClick={() => setEditing(false)} className="text-neutral-400 hover:text-black text-lg leading-none">✕</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {fields.map(f => (
          <div key={f.key}>
            <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-1">{f.label}</p>
            <input
              type={f.type || 'text'}
              value={(form as any)[f.key]}
              onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              className="w-full border-b border-neutral-300 py-1.5 text-sm focus:outline-none focus:border-black bg-transparent"
            />
          </div>
        ))}
        <div>
          <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-1">Client Emails <span className="normal-case">(comma separated)</span></p>
          <input
            value={form.client_emails}
            onChange={e => setForm(p => ({ ...p, client_emails: e.target.value }))}
            placeholder="email@client.com, email2@client.com"
            className="w-full border-b border-neutral-300 py-1.5 text-sm focus:outline-none focus:border-black bg-transparent"
          />
        </div>
        <div>
          <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-1">Description</p>
          <input
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            className="w-full border-b border-neutral-300 py-1.5 text-sm focus:outline-none focus:border-black bg-transparent"
          />
        </div>
      </div>
      <div className="mb-5">
        <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-1">Notes / Additional Specs</p>
        <textarea
          value={form.specs}
          onChange={e => setForm(p => ({ ...p, specs: e.target.value }))}
          rows={3}
          className="w-full border-b border-neutral-300 py-1.5 text-sm focus:outline-none focus:border-black bg-transparent resize-none"
        />
      </div>
      <div className="flex gap-3">
        <button onClick={save} disabled={saving}
          className="px-6 py-2.5 text-xs tracking-widest uppercase bg-black text-white hover:bg-neutral-800 disabled:opacity-40 transition-colors">
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button onClick={() => setEditing(false)}
          className="px-6 py-2.5 text-xs tracking-widest uppercase border border-neutral-300 hover:border-black transition-colors">
          Cancel
        </button>
      </div>
    </div>
  )
}
