'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NewInvoicePage() {
  const router = useRouter()
  const supabase = createClient()
  const [projects, setProjects] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const year = new Date().getFullYear()
  const [form, setForm] = useState({
    project_id: '',
    invoice_number: `INV-${year}-001`,
    client_name: '',
    client_email: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    subtotal: '',
    tax_rate: '0',
    tax_amount: '0',
    total: '',
    status: 'draft',
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
    }
  }

  const updateTotals = (subtotal: string, taxRate: string) => {
    const sub = parseFloat(subtotal) || 0
    const rate = parseFloat(taxRate) || 0
    const tax = sub * (rate / 100)
    const total = sub + tax
    setForm(f => ({
      ...f,
      subtotal,
      tax_rate: taxRate,
      tax_amount: tax.toFixed(2),
      total: total.toFixed(2),
    }))
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error: err } = await supabase.from('invoices').insert({
      project_id: form.project_id || null,
      invoice_number: form.invoice_number,
      client_name: form.client_name,
      client_email: form.client_email,
      issue_date: form.issue_date,
      due_date: form.due_date,
      subtotal: parseFloat(form.subtotal) || 0,
      tax_rate: parseFloat(form.tax_rate) || 0,
      tax_amount: parseFloat(form.tax_amount) || 0,
      total: parseFloat(form.total) || 0,
      status: form.status,
      notes: form.notes,
      created_by: user?.id,
    }).select().single()
    setSaving(false)
    if (err) { setError(err.message); return }
    router.push(`/admin/billing?tab=invoices`)
  }

  const labelClass = "block text-[10px] tracking-widest uppercase text-neutral-500 mb-1"
  const inputClass = "w-full border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-black"

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <a href="/admin/billing" className="text-[10px] tracking-widest uppercase text-neutral-400 hover:text-black">← Billing</a>
        <h1 className="text-2xl font-light tracking-widest uppercase mt-2">New Invoice</h1>
      </div>

      <form onSubmit={save} className="space-y-8">
        {/* Project & Invoice # */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Project</label>
            <select value={form.project_id} onChange={e => onProjectChange(e.target.value)} className={inputClass}>
              <option value="">Select project...</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Invoice #</label>
            <input value={form.invoice_number} onChange={e => set('invoice_number', e.target.value)} className={inputClass} />
          </div>
        </div>

        {/* Client Info */}
        <div>
          <p className="text-[10px] tracking-widest uppercase font-medium mb-3">Client</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Client Name</label>
              <input value={form.client_name} onChange={e => set('client_name', e.target.value)} className={inputClass} placeholder="Client name" />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input value={form.client_email} onChange={e => set('client_email', e.target.value)} className={inputClass} type="email" placeholder="client@example.com" />
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
            <label className={labelClass}>Due Date</label>
            <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} className={inputClass} />
          </div>
        </div>

        {/* Amount */}
        <div>
          <p className="text-[10px] tracking-widest uppercase font-medium mb-3">Amount</p>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Subtotal (USD)</label>
                <input type="number" value={form.subtotal} onChange={e => updateTotals(e.target.value, form.tax_rate)} className={inputClass} placeholder="0.00" min="0" step="0.01" />
              </div>
              <div>
                <label className={labelClass}>Tax Rate (%)</label>
                <input type="number" value={form.tax_rate} onChange={e => updateTotals(form.subtotal, e.target.value)} className={inputClass} placeholder="0" min="0" step="0.01" />
              </div>
              <div>
                <label className={labelClass}>Tax Amount</label>
                <div className="border border-neutral-200 px-3 py-2 bg-neutral-50 text-sm">${parseFloat(form.tax_amount || '0').toFixed(2)}</div>
              </div>
            </div>
            <div>
              <label className={labelClass}>Total (USD)</label>
              <div className="border border-black px-3 py-2 text-sm font-medium">${parseFloat(form.total || '0').toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className={labelClass}>Status</label>
          <select value={form.status} onChange={e => set('status', e.target.value)} className={inputClass}>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className={labelClass}>Notes</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} className={inputClass + " resize-none"} />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex gap-4">
          <button type="submit" disabled={saving} className="px-6 py-2.5 bg-black text-white text-xs tracking-widest uppercase hover:bg-neutral-800 disabled:opacity-50">
            {saving ? 'Saving...' : 'Create Invoice'}
          </button>
          <a href="/admin/billing" className="px-6 py-2.5 border border-neutral-200 text-xs tracking-widest uppercase hover:bg-neutral-50">
            Cancel
          </a>
        </div>
      </form>
    </div>
  )
}
