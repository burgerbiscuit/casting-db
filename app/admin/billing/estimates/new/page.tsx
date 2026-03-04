'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NewEstimatePage() {
  const router = useRouter()
  const supabase = createClient()
  const [projects, setProjects] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const year = new Date().getFullYear()
  const [form, setForm] = useState({
    project_id: '',
    estimate_number: `EST-${year}-001`,
    client_name: '',
    client_email: '',
    billing_contact_name: '',
    billing_contact_phone: '',
    billing_contact_email: '',
    billing_contact_address: '',
    issue_date: new Date().toISOString().split('T')[0],
    valid_until: '',
    scope_description: 'Casting Director fee for booking up to 1 models\nScope of work - Full-service casting: breakdown advisement, talent sourcing, talent review and shortlisting, casting sessions as needed (in person casting not included), callbacks, booking management, client communication. 3 rounds max. Does not include payment of models or any negotiations outside of the specs agreed to upon signing',
    casting_fee: '',
    notes: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    supabase.from('projects').select('id, name, client_emails, billing_contact, shoot_date').eq('status', 'active').order('created_at', { ascending: false })
      .then(({ data }) => setProjects(data || []))
  }, [])

  const onProjectChange = (projectId: string) => {
    set('project_id', projectId)
    const proj = projects.find(p => p.id === projectId)
    if (proj) {
      if (proj.client_emails?.[0]) set('client_email', proj.client_emails[0])
      if (proj.billing_contact) set('billing_contact_name', proj.billing_contact)
    }
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error: err } = await supabase.from('estimates').insert({
      ...form,
      project_id: form.project_id || null,
      casting_fee: parseFloat(form.casting_fee) || 0,
      created_by: user?.id,
    }).select().single()
    setSaving(false)
    if (err) { setError(err.message); return }
    router.push(`/admin/billing/estimates/${data.id}`)
  }

  const labelClass = "block text-[10px] tracking-widest uppercase text-neutral-500 mb-1"
  const inputClass = "w-full border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-black"

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <a href="/admin/billing" className="text-[10px] tracking-widest uppercase text-neutral-400 hover:text-black">← Billing</a>
        <h1 className="text-2xl font-light tracking-widest uppercase mt-2">New Estimate</h1>
      </div>

      <form onSubmit={save} className="space-y-8">
        {/* Project & Estimate # */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Project</label>
            <select value={form.project_id} onChange={e => onProjectChange(e.target.value)} className={inputClass}>
              <option value="">Select project...</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Estimate #</label>
            <input value={form.estimate_number} onChange={e => set('estimate_number', e.target.value)} className={inputClass} />
          </div>
        </div>

        {/* Billing Contact */}
        <div>
          <p className="text-[10px] tracking-widest uppercase font-medium mb-3">Billing Contact</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Contact Name</label>
              <input value={form.billing_contact_name} onChange={e => set('billing_contact_name', e.target.value)} className={inputClass} placeholder="Briana Lemmo" />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input value={form.billing_contact_phone} onChange={e => set('billing_contact_phone', e.target.value)} className={inputClass} placeholder="914-299-8834" />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input value={form.billing_contact_email} onChange={e => set('billing_contact_email', e.target.value)} className={inputClass} type="email" placeholder="finance@client.com" />
            </div>
            <div>
              <label className={labelClass}>Address</label>
              <input value={form.billing_contact_address} onChange={e => set('billing_contact_address', e.target.value)} className={inputClass} placeholder="648 Kissam Road, Peekskill, NY 10566" />
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Issue Date</label>
            <input type="date" value={form.issue_date} onChange={e => set('issue_date', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Valid Until</label>
            <input type="date" value={form.valid_until} onChange={e => set('valid_until', e.target.value)} className={inputClass} />
          </div>
        </div>

        {/* Scope & Fee */}
        <div>
          <p className="text-[10px] tracking-widest uppercase font-medium mb-3">Casting Director Fee</p>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Scope of Work</label>
              <textarea value={form.scope_description} onChange={e => set('scope_description', e.target.value)} rows={6} className={inputClass + " resize-none"} />
            </div>
            <div>
              <label className={labelClass}>Fee Amount (USD)</label>
              <input type="number" value={form.casting_fee} onChange={e => set('casting_fee', e.target.value)} className={inputClass} placeholder="500" min="0" step="0.01" />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className={labelClass}>Additional Notes</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} className={inputClass + " resize-none"} />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex gap-4">
          <button type="submit" disabled={saving} className="px-6 py-2.5 bg-black text-white text-xs tracking-widest uppercase hover:bg-neutral-800 disabled:opacity-50">
            {saving ? 'Saving...' : 'Create Estimate'}
          </button>
          <a href="/admin/billing" className="px-6 py-2.5 border border-neutral-200 text-xs tracking-widest uppercase hover:bg-neutral-50">
            Cancel
          </a>
        </div>
      </form>
    </div>
  )
}
