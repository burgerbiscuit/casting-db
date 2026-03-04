'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'

interface LineItem {
  description: string
  quantity: number
  rate: number
  amount: number
}

export default function NewEstimatePage() {
  const router = useRouter()
  const [projects, setProjects] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  const year = new Date().getFullYear()
  const [form, setForm] = useState({
    project_id: '',
    estimate_number: `EST-${year}-001`,
    client_name: '',
    client_email: '',
    issue_date: new Date().toISOString().split('T')[0],
    valid_until: '',
    casting_fee: '',
    talent_budget: '',
    expenses: '',
    notes: '',
  })
  const [items, setItems] = useState<LineItem[]>([])

  useEffect(() => {
    fetch('/api/estimates').then(r => r.json()).then(data => {
      // Get count to auto-number
      if (Array.isArray(data)) {
        const num = String(data.length + 1).padStart(3, '0')
        setForm(f => ({ ...f, estimate_number: `EST-${year}-${num}` }))
      }
    })
    // Load projects
    fetch('/api/invoices').then(() => {}).catch(() => {})
    import('@/lib/supabase/client').then(({ createClient }) => {
      const supabase = createClient()
      supabase.from('projects').select('id, name, client_emails').order('name').then(({ data }) => {
        setProjects(data || [])
      })
    })
  }, [])

  const handleProjectChange = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    setForm(f => ({
      ...f,
      project_id: projectId,
      client_email: project?.client_emails?.[0] || f.client_email,
    }))
  }

  const subtotal =
    Number(form.casting_fee || 0) +
    Number(form.talent_budget || 0) +
    Number(form.expenses || 0) +
    items.reduce((s, i) => s + i.amount, 0)

  const addItem = () => setItems(prev => [...prev, { description: '', quantity: 1, rate: 0, amount: 0 }])

  const updateItem = (idx: number, field: keyof LineItem, value: string | number) => {
    setItems(prev => {
      const next = [...prev]
      const item = { ...next[idx], [field]: field === 'description' ? value : Number(value) }
      item.amount = item.quantity * item.rate
      next[idx] = item
      return next
    })
  }

  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx))

  const save = async () => {
    setSaving(true)
    const res = await fetch('/api/estimates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, items }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.id) router.push(`/admin/billing/estimates/${data.id}`)
  }

  const label = 'text-[9px] tracking-widest uppercase text-neutral-400 block mb-1'
  const input = 'w-full border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-black'

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-light tracking-widest uppercase mb-8">New Estimate</h1>

      <div className="space-y-6">
        {/* Project */}
        <div>
          <label className={label}>Project</label>
          <select value={form.project_id} onChange={e => handleProjectChange(e.target.value)} className={input}>
            <option value="">— Select project —</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {/* Estimate # + Dates */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={label}>Estimate #</label>
            <input value={form.estimate_number} onChange={e => setForm(f => ({ ...f, estimate_number: e.target.value }))} className={input} />
          </div>
          <div>
            <label className={label}>Issue Date</label>
            <input type="date" value={form.issue_date} onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))} className={input} />
          </div>
          <div>
            <label className={label}>Valid Until</label>
            <input type="date" value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))} className={input} />
          </div>
        </div>

        {/* Client */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Client Name</label>
            <input value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} className={input} />
          </div>
          <div>
            <label className={label}>Client Email</label>
            <input type="email" value={form.client_email} onChange={e => setForm(f => ({ ...f, client_email: e.target.value }))} className={input} />
          </div>
        </div>

        {/* Core fees */}
        <div>
          <p className={label + ' mb-3'}>Fees</p>
          <div className="grid grid-cols-3 gap-4">
            {[['casting_fee', 'Casting Fee'], ['talent_budget', 'Talent Budget'], ['expenses', 'Expenses']].map(([key, lbl]) => (
              <div key={key}>
                <label className={label}>{lbl}</label>
                <input type="number" min="0" step="0.01"
                  value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className={input} placeholder="0.00" />
              </div>
            ))}
          </div>
        </div>

        {/* Line items */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className={label}>Additional Line Items</p>
            <button onClick={addItem} className="flex items-center gap-1 text-[10px] tracking-widest uppercase text-neutral-500 hover:text-black">
              <Plus size={12} /> Add
            </button>
          </div>
          {items.length > 0 && (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-[9px] tracking-widest uppercase text-neutral-400 px-1">
                <div className="col-span-6">Description</div>
                <div className="col-span-2 text-center">Qty</div>
                <div className="col-span-2 text-right">Rate</div>
                <div className="col-span-2 text-right">Amount</div>
              </div>
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <input className={input + ' col-span-6'} placeholder="Description"
                    value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} />
                  <input type="number" className={input + ' col-span-2 text-center'} min="1"
                    value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} />
                  <input type="number" className={input + ' col-span-2 text-right'} min="0" step="0.01"
                    value={item.rate} onChange={e => updateItem(idx, 'rate', e.target.value)} />
                  <div className="col-span-1 text-right text-sm">${item.amount.toFixed(2)}</div>
                  <button onClick={() => removeItem(idx)} className="col-span-1 flex justify-center text-neutral-300 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subtotal */}
        <div className="border-t border-black pt-4 flex justify-end">
          <div>
            <p className={label}>Total</p>
            <p className="text-2xl font-light">${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className={label}>Notes</label>
          <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            className={input + ' resize-none'} />
        </div>

        <button onClick={save} disabled={saving}
          className="w-full bg-black text-white text-xs tracking-widest uppercase py-3 hover:bg-neutral-800 disabled:opacity-50 transition-colors">
          {saving ? 'Saving...' : 'Save as Draft'}
        </button>
      </div>
    </div>
  )
}
