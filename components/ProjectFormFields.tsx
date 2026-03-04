'use client'
import { X, Plus, Link as LinkIcon } from 'lucide-react'

export type ProjectFormData = {
  name: string
  slug: string
  description: string
  // Credits
  client_name: string
  client_url: string
  photographer: string
  photographer_url: string
  stylist: string
  stylist_url: string
  // Shoot details
  location: string
  shoot_date: string
  model_rate: string
  hours: string
  pages: string
  usage: string
  specs: string
  // Billing
  billing_contact: string
  billing_name: string
  billing_email: string
  billing_address: string
  billing_notes: string
  client_emails: string
  // Rounds
  presentation_rounds: { label: string; date: string }[]
}

export const emptyProjectForm = (): ProjectFormData => ({
  name: '', slug: '', description: '',
  client_name: '', client_url: '',
  photographer: '', photographer_url: '',
  stylist: '', stylist_url: '',
  location: '', shoot_date: '',
  model_rate: '', hours: '', pages: '', usage: '', specs: '',
  billing_contact: '', billing_name: '', billing_email: '', billing_address: '', billing_notes: '',
  client_emails: '',
  presentation_rounds: [],
})

export function fromProject(p: any): ProjectFormData {
  return {
    name: p.name || '',
    slug: p.slug || '',
    description: p.description || '',
    client_name: p.client_name || '',
    client_url: p.client_url || '',
    photographer: p.photographer || '',
    photographer_url: p.photographer_url || '',
    stylist: p.stylist || '',
    stylist_url: p.stylist_url || '',
    location: p.location || '',
    shoot_date: p.shoot_date || '',
    model_rate: p.model_rate || '',
    hours: p.hours || '',
    pages: p.pages || '',
    usage: p.usage || '',
    specs: p.specs || '',
    billing_contact: p.billing_contact || '',
    billing_name: p.billing_name || '',
    billing_email: p.billing_email || '',
    billing_address: p.billing_address || '',
    billing_notes: p.billing_notes || '',
    client_emails: (p.client_emails || []).join(', '),
    presentation_rounds: p.presentation_rounds || [],
  }
}

// The DB columns that exist today vs need migration
const NEW_COLS = ['photographer_url', 'stylist_url', 'client_url', 'billing_name', 'billing_email', 'billing_address', 'billing_notes']

export function toDbPayload(form: ProjectFormData, hasNewCols: boolean) {
  const base: any = {
    client_name: form.client_name || null,
    photographer: form.photographer || null,
    stylist: form.stylist || null,
    location: form.location || null,
    shoot_date: form.shoot_date || null,
    model_rate: form.model_rate || null,
    hours: form.hours || null,
    pages: form.pages || null,
    usage: form.usage || null,
    specs: form.specs || null,
    billing_contact: form.billing_contact || null,
    client_emails: form.client_emails ? form.client_emails.split(',').map((e: string) => e.trim()).filter(Boolean) : null,
    description: form.description || null,
    presentation_rounds: form.presentation_rounds.filter(r => r.date),
  }
  if (hasNewCols) {
    base.client_url = form.client_url || null
    base.photographer_url = form.photographer_url || null
    base.stylist_url = form.stylist_url || null
    base.billing_name = form.billing_name || null
    base.billing_email = form.billing_email || null
    base.billing_address = form.billing_address || null
    base.billing_notes = form.billing_notes || null
  }
  return base
}

interface Props {
  form: ProjectFormData
  onChange: (updates: Partial<ProjectFormData>) => void
  showSlug?: boolean
  hasNewCols?: boolean
}

export function ProjectFormFields({ form, onChange, showSlug = false, hasNewCols = false }: Props) {
  const set = (k: keyof ProjectFormData, v: any) => onChange({ [k]: v })
  const inp = 'w-full border-b border-neutral-200 py-2 text-sm focus:outline-none focus:border-black bg-transparent placeholder:text-neutral-300'
  const lbl = 'text-[10px] tracking-widest uppercase text-neutral-400 block mb-1'

  const addRound = () => set('presentation_rounds', [...form.presentation_rounds, { label: `Round ${form.presentation_rounds.length + 1}`, date: '' }])
  const removeRound = (i: number) => set('presentation_rounds', form.presentation_rounds.filter((_, idx) => idx !== i))
  const updateRound = (i: number, field: 'label' | 'date', val: string) =>
    set('presentation_rounds', form.presentation_rounds.map((r, idx) => idx === i ? { ...r, [field]: val } : r))

  return (
    <div className="space-y-8">
      {/* Project Identity */}
      <div className="space-y-4">
        <div>
          <label className={lbl}>Project Name *</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} required autoFocus className={`${inp} text-base`} />
        </div>
        {showSlug && (
          <div>
            <label className={lbl}>Slug (URL)</label>
            <input value={form.slug} onChange={e => set('slug', e.target.value)} className={inp} />
            <p className="text-xs text-neutral-400 mt-1">Cast sign-in link: /cast/{form.slug || '...'}</p>
          </div>
        )}
        <div>
          <label className={lbl}>Description</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
            placeholder="Brief project overview..."
            className="w-full border-b border-neutral-200 bg-transparent py-2 text-sm focus:outline-none focus:border-black resize-none placeholder:text-neutral-300" />
        </div>
      </div>

      {/* Credits */}
      <div>
        <p className="text-xs tracking-widest uppercase font-medium mb-4 pb-2 border-b border-neutral-100">Credits</p>
        <div className="space-y-4">
          {/* Client / Brand */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Client / Brand</label>
              <input value={form.client_name} onChange={e => set('client_name', e.target.value)}
                placeholder="e.g. Dior" className={inp} />
            </div>
            <div>
              <label className={lbl}>
                <span className="flex items-center gap-1"><LinkIcon size={9} />Brand / Outlet URL {!hasNewCols && <span className="text-amber-500 normal-case">*migration needed</span>}</span>
              </label>
              <input value={form.client_url} onChange={e => set('client_url', e.target.value)}
                placeholder="https://..." disabled={!hasNewCols}
                className={`${inp} ${!hasNewCols ? 'opacity-40 cursor-not-allowed' : ''}`} />
            </div>
          </div>

          {/* Photographer */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Photographer</label>
              <input value={form.photographer} onChange={e => set('photographer', e.target.value)}
                placeholder="Name" className={inp} />
            </div>
            <div>
              <label className={lbl}>
                <span className="flex items-center gap-1"><LinkIcon size={9} />Photographer URL {!hasNewCols && <span className="text-amber-500 normal-case">*</span>}</span>
              </label>
              <input value={form.photographer_url} onChange={e => set('photographer_url', e.target.value)}
                placeholder="https://..." disabled={!hasNewCols}
                className={`${inp} ${!hasNewCols ? 'opacity-40 cursor-not-allowed' : ''}`} />
            </div>
          </div>

          {/* Stylist */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Stylist</label>
              <input value={form.stylist} onChange={e => set('stylist', e.target.value)}
                placeholder="Name" className={inp} />
            </div>
            <div>
              <label className={lbl}>
                <span className="flex items-center gap-1"><LinkIcon size={9} />Stylist URL {!hasNewCols && <span className="text-amber-500 normal-case">*</span>}</span>
              </label>
              <input value={form.stylist_url} onChange={e => set('stylist_url', e.target.value)}
                placeholder="https://..." disabled={!hasNewCols}
                className={`${inp} ${!hasNewCols ? 'opacity-40 cursor-not-allowed' : ''}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Shoot Details */}
      <div>
        <p className="text-xs tracking-widest uppercase font-medium mb-4 pb-2 border-b border-neutral-100">Shoot Details</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Location</label>
            <input value={form.location} onChange={e => set('location', e.target.value)}
              placeholder="e.g. Bangkok, Thailand" className={inp} />
          </div>
          <div>
            <label className={lbl}>Shoot Date</label>
            <input type="date" value={form.shoot_date} onChange={e => set('shoot_date', e.target.value)} className={inp} />
          </div>
          <div>
            <label className={lbl}>Model Rate</label>
            <input value={form.model_rate} onChange={e => set('model_rate', e.target.value)}
              placeholder="e.g. $5,000/day" className={inp} />
          </div>
          <div>
            <label className={lbl}>Hours</label>
            <input value={form.hours} onChange={e => set('hours', e.target.value)}
              placeholder="e.g. 8 hrs" className={inp} />
          </div>
          <div>
            <label className={lbl}>Pages / Images</label>
            <input value={form.pages} onChange={e => set('pages', e.target.value)}
              placeholder="e.g. 10 pages" className={inp} />
          </div>
          <div>
            <label className={lbl}>Usage</label>
            <input value={form.usage} onChange={e => set('usage', e.target.value)}
              placeholder="e.g. Print + Digital 1yr" className={inp} />
          </div>
        </div>
      </div>

      {/* Specs */}
      <div>
        <p className="text-xs tracking-widest uppercase font-medium mb-4 pb-2 border-b border-neutral-100">Casting Requirements</p>
        <textarea value={form.specs} onChange={e => set('specs', e.target.value)} rows={4}
          placeholder="e.g. Female, 18-28, height 5'7&quot;+, natural look, no visible tattoos..."
          className="w-full border-b border-neutral-200 bg-transparent py-2 text-sm focus:outline-none focus:border-black resize-none placeholder:text-neutral-300" />
      </div>

      {/* Billing */}
      <div>
        <p className="text-xs tracking-widest uppercase font-medium mb-4 pb-2 border-b border-neutral-100">
          Billing {!hasNewCols && <span className="text-amber-500 text-[10px] ml-2">*migration needed for full billing fields</span>}
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Billing Contact (Name)</label>
            <input value={form.billing_contact} onChange={e => set('billing_contact', e.target.value)}
              placeholder="Full name" className={inp} />
          </div>
          <div>
            <label className={lbl}>Billing Name / Company {!hasNewCols && <span className="text-amber-500">*</span>}</label>
            <input value={form.billing_name} onChange={e => set('billing_name', e.target.value)}
              placeholder="Company or individual name" disabled={!hasNewCols}
              className={`${inp} ${!hasNewCols ? 'opacity-40 cursor-not-allowed' : ''}`} />
          </div>
          <div>
            <label className={lbl}>Billing Email {!hasNewCols && <span className="text-amber-500">*</span>}</label>
            <input type="email" value={form.billing_email} onChange={e => set('billing_email', e.target.value)}
              placeholder="billing@company.com" disabled={!hasNewCols}
              className={`${inp} ${!hasNewCols ? 'opacity-40 cursor-not-allowed' : ''}`} />
          </div>
          <div>
            <label className={lbl}>Client Emails <span className="normal-case text-neutral-400">(comma separated, for presentation)</span></label>
            <input value={form.client_emails} onChange={e => set('client_emails', e.target.value)}
              placeholder="client@brand.com, client2@brand.com" className={inp} />
          </div>
          <div className="col-span-2">
            <label className={lbl}>Billing Address {!hasNewCols && <span className="text-amber-500">*</span>}</label>
            <input value={form.billing_address} onChange={e => set('billing_address', e.target.value)}
              placeholder="Street, City, State ZIP, Country" disabled={!hasNewCols}
              className={`${inp} ${!hasNewCols ? 'opacity-40 cursor-not-allowed' : ''}`} />
          </div>
          <div className="col-span-2">
            <label className={lbl}>Billing Notes {!hasNewCols && <span className="text-amber-500">*</span>}</label>
            <textarea value={form.billing_notes} onChange={e => set('billing_notes', e.target.value)} rows={2}
              placeholder="PO number, payment terms, etc." disabled={!hasNewCols}
              className={`w-full border-b border-neutral-200 bg-transparent py-2 text-sm focus:outline-none focus:border-black resize-none placeholder:text-neutral-300 ${!hasNewCols ? 'opacity-40 cursor-not-allowed' : ''}`} />
          </div>
        </div>
      </div>

      {/* Presentation Rounds */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs tracking-widest uppercase font-medium">Presentation Rounds</p>
          <button type="button" onClick={addRound}
            className="flex items-center gap-1 text-xs tracking-widest uppercase text-neutral-400 hover:text-black transition-colors">
            <Plus size={12} /> Add Round
          </button>
        </div>
        {form.presentation_rounds.length === 0 && (
          <p className="text-xs text-neutral-400">No rounds — click + Add Round to schedule presentation dates.</p>
        )}
        <div className="space-y-3">
          {form.presentation_rounds.map((r, i) => (
            <div key={i} className="flex items-center gap-3">
              <input value={r.label} onChange={e => updateRound(i, 'label', e.target.value)}
                className="border-b border-neutral-200 py-2 text-sm focus:outline-none focus:border-black bg-transparent w-32 placeholder:text-neutral-300" placeholder="Round 1" />
              <input type="date" value={r.date} onChange={e => updateRound(i, 'date', e.target.value)}
                className="border-b border-neutral-200 py-2 text-sm focus:outline-none focus:border-black bg-transparent flex-1" />
              <button type="button" onClick={() => removeRound(i)} className="text-neutral-300 hover:text-red-400 transition-colors">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
