'use client'
import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check } from 'lucide-react'

type ModelEntry = {
  pmId: string
  modelId: string
  firstName: string
  lastName: string
  phone: string
  email: string
  agency: string
  photo: string | null
  agentName: string
  agentEmail: string
  agentPhone: string
  pmRate: string
  pmOption: string
  confirmedDate: string
  confirmedUsage: string
  confirmedDays: string
  confirmedNotes: string
}

type ProjectData = {
  id: string
  name: string
  shootDate: string
  modelRate: string
  usage: string
  photographer: string
  stylist: string
}

type FieldMap = Record<string, {
  confirmedDate: string
  confirmedUsage: string
  confirmedDays: string
  confirmedNotes: string
  pmRate: string
}>

export function ConfirmationChartEditor({ models, project }: { models: ModelEntry[]; project: ProjectData }) {
  const supabase = createClient()

  // Per-model field state
  const [fields, setFields] = useState<FieldMap>(() => {
    const map: FieldMap = {}
    models.forEach(m => {
      map[m.pmId] = {
        confirmedDate: m.confirmedDate || formatDate(project.shootDate),
        confirmedUsage: m.confirmedUsage || project.usage,
        confirmedDays: m.confirmedDays || '',
        confirmedNotes: m.confirmedNotes || '',
        pmRate: m.pmRate || project.modelRate,
      }
    })
    return map
  })

  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  const save = useCallback(async (pmId: string) => {
    setSaving(s => ({ ...s, [pmId]: true }))
    const f = fields[pmId]
    await supabase.from('project_models').update({
      confirmed_date: f.confirmedDate || null,
      confirmed_usage: f.confirmedUsage || null,
      confirmed_days: f.confirmedDays || null,
      confirmed_notes: f.confirmedNotes || null,
      pm_rate: f.pmRate || null,
    }).eq('id', pmId)
    setSaving(s => ({ ...s, [pmId]: false }))
    setSaved(s => ({ ...s, [pmId]: true }))
    setTimeout(() => setSaved(s => ({ ...s, [pmId]: false })), 2000)
  }, [fields])

  const update = (pmId: string, field: keyof FieldMap[string], value: string) => {
    setFields(prev => ({ ...prev, [pmId]: { ...prev[pmId], [field]: value } }))
  }

  return (
    <div className="space-y-6">
      {models.map(model => {
        const f = fields[model.pmId]
        const isSaving = saving[model.pmId]
        const isSaved = saved[model.pmId]
        return (
          <div key={model.pmId} className="border border-neutral-200">
            {/* Model header */}
            <div className="flex items-center gap-4 p-4 border-b border-neutral-100 bg-neutral-50">
              <div className="w-12 h-16 bg-neutral-200 shrink-0 overflow-hidden">
                {model.photo && (
                  <img src={model.photo} alt={`${model.firstName} ${model.lastName}`}
                    className="w-full h-full object-cover object-top" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium tracking-wide">
                  {model.firstName} {model.lastName}
                  {model.pmOption && <span className="ml-2 text-[10px] text-neutral-400 tracking-widest uppercase">{model.pmOption}</span>}
                </p>
                {model.agency && <p className="text-xs text-neutral-500 mt-0.5">{model.agency}</p>}
              </div>
              <div className="flex items-center gap-2">
                {isSaving && <span className="text-[10px] tracking-widest uppercase text-neutral-400">Saving…</span>}
                {isSaved && (
                  <span className="flex items-center gap-1 text-[10px] tracking-widest uppercase text-green-600">
                    <Check size={10} /> Saved
                  </span>
                )}
                <button onClick={() => save(model.pmId)} disabled={isSaving}
                  className="text-[10px] tracking-widest uppercase border border-black px-3 py-1.5 hover:bg-black hover:text-white transition-colors disabled:opacity-40">
                  Save
                </button>
              </div>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Contact details */}
              <div className="space-y-4">
                <p className="text-[9px] tracking-widest uppercase text-neutral-400 border-b border-neutral-100 pb-2">Contact Details</p>

                {/* Model contacts */}
                <div>
                  <p className="text-[9px] tracking-widest uppercase text-neutral-500 mb-2 font-medium">Model</p>
                  <div className="space-y-1.5">
                    <ContactRow label="Phone" value={model.phone} />
                    <ContactRow label="Email" value={model.email} />
                  </div>
                </div>

                {/* Agent contacts */}
                {(model.agentName || model.agentEmail || model.agentPhone) && (
                  <div>
                    <p className="text-[9px] tracking-widest uppercase text-neutral-500 mb-2 font-medium">
                      Agent {model.agency ? `· ${model.agency}` : ''}
                    </p>
                    <div className="space-y-1.5">
                      {model.agentName && <ContactRow label="Name" value={model.agentName} />}
                      <ContactRow label="Phone" value={model.agentPhone} />
                      <ContactRow label="Email" value={model.agentEmail} />
                    </div>
                  </div>
                )}
                {!model.agentName && !model.agentEmail && !model.agentPhone && model.agency && (
                  <div>
                    <p className="text-[9px] tracking-widest uppercase text-neutral-500 mb-1 font-medium">Agent · {model.agency}</p>
                    <p className="text-[10px] text-neutral-300 italic">No agent contact found in database</p>
                  </div>
                )}
              </div>

              {/* Right: Confirmation details */}
              <div className="space-y-4">
                <p className="text-[9px] tracking-widest uppercase text-neutral-400 border-b border-neutral-100 pb-2">Confirmation Details</p>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Confirmed Rate"
                    value={f.pmRate}
                    onChange={v => update(model.pmId, 'pmRate', v)}
                    onBlur={() => save(model.pmId)}
                    placeholder={project.modelRate || 'e.g. $1,500 + 20% AF'} />
                  <Field label="Confirmed Date"
                    value={f.confirmedDate}
                    onChange={v => update(model.pmId, 'confirmedDate', v)}
                    onBlur={() => save(model.pmId)}
                    placeholder={project.shootDate ? formatDate(project.shootDate) : 'e.g. March 27, 2026'} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Usage"
                    value={f.confirmedUsage}
                    onChange={v => update(model.pmId, 'confirmedUsage', v)}
                    onBlur={() => save(model.pmId)}
                    placeholder={project.usage || 'e.g. 6 months, web + social'} />
                  <Field label="Days / Option"
                    value={f.confirmedDays}
                    onChange={v => update(model.pmId, 'confirmedDays', v)}
                    onBlur={() => save(model.pmId)}
                    placeholder="e.g. 1 day" />
                </div>

                <div>
                  <p className="text-[9px] tracking-widest uppercase text-neutral-400 mb-1">Notes</p>
                  <textarea
                    value={f.confirmedNotes}
                    onChange={e => update(model.pmId, 'confirmedNotes', e.target.value)}
                    onBlur={() => save(model.pmId)}
                    placeholder="Any additional notes for this confirmation…"
                    rows={3}
                    className="w-full border border-neutral-200 px-3 py-2 text-xs focus:outline-none focus:border-black resize-none placeholder:text-neutral-300"
                  />
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ContactRow({ label, value }: { label: string; value: string }) {
  if (!value) return <p className="text-[10px] text-neutral-300">{label}: —</p>
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[9px] tracking-widest uppercase text-neutral-400 w-10 shrink-0">{label}</span>
      <span className="text-xs text-neutral-700">{value}</span>
    </div>
  )
}

function Field({ label, value, onChange, onBlur, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; onBlur: () => void; placeholder?: string
}) {
  return (
    <div>
      <p className="text-[9px] tracking-widest uppercase text-neutral-400 mb-1">{label}</p>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className="w-full border-b border-neutral-200 py-1.5 text-xs focus:outline-none focus:border-black placeholder:text-neutral-300"
      />
    </div>
  )
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  } catch { return dateStr }
}
