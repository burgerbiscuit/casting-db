'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, Pencil, Trash2, X } from 'lucide-react'

export default function ReviewsPage() {
  const supabase = createClient()
  const [models, setModels] = useState<any[]>([])
  const [agents, setAgents] = useState<any[]>([])
  const [others, setOthers] = useState<any[]>([])
  const [tab, setTab] = useState<'models' | 'agents' | 'other'>('models')
  const [editItem, setEditItem] = useState<{ type: 'agent' | 'other', data: any } | null>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string, id: string, name: string } | null>(null)

  const load = async () => {
    const [{ data: m }, { data: a }, { data: o }] = await Promise.all([
      supabase.from('models').select('id, first_name, last_name, created_at, agency, instagram_handle, source').eq('reviewed', false).order('created_at', { ascending: false }),
      supabase.from('agent_submissions').select('*').eq('reviewed', false).order('created_at', { ascending: false }),
      supabase.from('other_submissions').select('*').eq('reviewed', false).order('created_at', { ascending: false }),
    ])
    setModels(m || [])
    setAgents(a || [])
    setOthers(o || [])
  }

  useEffect(() => { load() }, [])

  const markReviewed = async (table: string, id: string) => {
    await supabase.from(table).update({ reviewed: true }).eq('id', id)
    if (table === 'agent_submissions') {
      const submission = agents.find((a: any) => a.id === id)
      if (submission) {
        const email = submission.email?.toLowerCase() || null
        let existingId: string | null = null
        if (email) {
          const { data: existing } = await supabase.from('agency_contacts').select('id').eq('email', email).maybeSingle()
          existingId = existing?.id || null
        }
        if (existingId) {
          await supabase.from('agency_contacts').update({
            agent_name: `${submission.first_name} ${submission.last_name}`.trim(),
            agency_name: submission.agency_name,
            city: submission.city || null,
            board: submission.boards || null,
          }).eq('id', existingId)
        } else {
          await supabase.from('agency_contacts').insert({
            agent_name: `${submission.first_name} ${submission.last_name}`.trim(),
            agency_name: submission.agency_name,
            email: email,
            city: submission.city || null,
            contact_type: 'model',
            board: submission.boards || null,
          })
        }
      }
    }
    load()
  }

  const openEdit = (type: 'agent' | 'other', data: any) => {
    setEditItem({ type, data })
    setEditForm({ ...data })
  }

  const saveEdit = async () => {
    if (!editItem) return
    setSaving(true)
    const table = editItem.type === 'agent' ? 'agent_submissions' : 'other_submissions'
    const { error } = await supabase.from(table).update(editForm).eq('id', editItem.data.id)
    setSaving(false)
    if (!error) {
      setEditItem(null)
      load()
    }
  }

  const confirmDelete = (type: string, id: string, name: string) => {
    setDeleteConfirm({ type, id, name })
  }

  const executeDelete = async () => {
    if (!deleteConfirm) return
    const tableMap: Record<string, string> = {
      model: 'models',
      agent: 'agent_submissions',
      other: 'other_submissions',
    }
    await supabase.from(tableMap[deleteConfirm.type]).delete().eq('id', deleteConfirm.id)
    setDeleteConfirm(null)
    load()
  }

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const Field = ({ label, name, value, onChange }: any) => (
    <div>
      <label className="block text-[9px] tracking-widest uppercase text-neutral-400 mb-1">{label}</label>
      <input
        value={value || ''}
        onChange={e => onChange(name, e.target.value)}
        className="w-full border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-black"
      />
    </div>
  )

  const TabBtn = ({ id, label, count }: { id: any, label: string, count: number }) => (
    <button onClick={() => setTab(id)}
      className={`px-6 py-3 text-xs tracking-widest uppercase transition-colors border-b-2 -mb-[1px] ${tab === id ? 'border-black text-black' : 'border-transparent text-neutral-400 hover:text-black'}`}>
      {label} {count > 0 && <span className="ml-1 bg-black text-white text-[9px] px-1.5 py-0.5">{count}</span>}
    </button>
  )

  const set = (key: string, val: string) => setEditForm((f: any) => ({ ...f, [key]: val }))

  return (
    <div>
      <h1 className="text-2xl font-light tracking-widest uppercase mb-4">Pending Reviews</h1>

      <div className="flex border-b border-neutral-200 mb-4">
        <TabBtn id="models" label="Models" count={models.length} />
        <TabBtn id="agents" label="Agents" count={agents.length} />
        <TabBtn id="other" label="Other" count={others.length} />
      </div>

      {/* MODELS TAB */}
      {tab === 'models' && (
        <div className="divide-y divide-neutral-100">
          {models.length === 0 && <p className="text-xs text-neutral-400 py-4">All caught up</p>}
          {models.map(m => (
            <div key={m.id} className="flex items-center justify-between py-4">
              <div>
                <p className="text-sm font-medium">{m.first_name} {m.last_name}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{m.agency || '—'} · {m.instagram_handle ? `@${m.instagram_handle}` : '—'} · {m.source || 'scouting'} · Submitted {fmt(m.created_at)}</p>
              </div>
              <div className="flex items-center gap-2">
                <a href={`/admin/models/${m.id}`} className="text-[10px] tracking-widest uppercase text-neutral-400 hover:text-black border border-neutral-200 px-3 py-1.5 hover:border-black transition-colors">Edit Profile</a>
                <button onClick={() => confirmDelete('model', m.id, `${m.first_name} ${m.last_name}`)}
                  className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase text-red-500 border border-red-200 px-3 py-1.5 hover:bg-red-50 transition-colors">
                  <Trash2 size={10} /> Delete
                </button>
                <button onClick={() => markReviewed('models', m.id)} className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase bg-black text-white px-3 py-1.5 hover:bg-neutral-800 transition-colors">
                  <Check size={10} /> Mark Reviewed
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AGENTS TAB */}
      {tab === 'agents' && (
        <div className="divide-y divide-neutral-100">
          {agents.length === 0 && <p className="text-xs text-neutral-400 py-4">All caught up</p>}
          {agents.map(a => (
            <div key={a.id} className="flex items-center justify-between py-4">
              <div>
                <p className="text-sm font-medium">{a.first_name} {a.last_name} <span className="font-normal text-neutral-500">— {a.agency_name}</span></p>
                <p className="text-xs text-neutral-400 mt-0.5">{a.email} · {a.city || '—'} · {a.boards || '—'} · Submitted {fmt(a.created_at)}</p>
                {a.notes && <p className="text-xs text-neutral-500 mt-1 italic">"{a.notes}"</p>}
              </div>
              <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                <button onClick={() => openEdit('agent', a)}
                  className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase text-neutral-500 border border-neutral-200 px-3 py-1.5 hover:border-black hover:text-black transition-colors">
                  <Pencil size={10} /> Edit
                </button>
                <button onClick={() => confirmDelete('agent', a.id, `${a.first_name} ${a.last_name}`)}
                  className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase text-red-500 border border-red-200 px-3 py-1.5 hover:bg-red-50 transition-colors">
                  <Trash2 size={10} /> Delete
                </button>
                <button onClick={() => markReviewed('agent_submissions', a.id)} className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase bg-black text-white px-3 py-1.5 hover:bg-neutral-800 transition-colors">
                  <Check size={10} /> Mark Reviewed
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* OTHER TAB */}
      {tab === 'other' && (
        <div className="divide-y divide-neutral-100">
          {others.length === 0 && <p className="text-xs text-neutral-400 py-4">All caught up</p>}
          {others.map(o => (
            <div key={o.id} className="flex items-center justify-between py-4">
              <div>
                <p className="text-sm font-medium">{o.first_name} {o.last_name} <span className="font-normal text-neutral-500">— {o.role}{o.company ? `, ${o.company}` : ''}</span></p>
                <p className="text-xs text-neutral-400 mt-0.5">{o.email} · {o.city || '—'} · {o.instagram ? `@${o.instagram}` : '—'} · Submitted {fmt(o.created_at)}</p>
                {o.notes && <p className="text-xs text-neutral-500 mt-1 italic">"{o.notes}"</p>}
              </div>
              <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                <button onClick={() => openEdit('other', o)}
                  className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase text-neutral-500 border border-neutral-200 px-3 py-1.5 hover:border-black hover:text-black transition-colors">
                  <Pencil size={10} /> Edit
                </button>
                <button onClick={() => confirmDelete('other', o.id, `${o.first_name} ${o.last_name}`)}
                  className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase text-red-500 border border-red-200 px-3 py-1.5 hover:bg-red-50 transition-colors">
                  <Trash2 size={10} /> Delete
                </button>
                <button onClick={() => markReviewed('other_submissions', o.id)} className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase bg-black text-white px-3 py-1.5 hover:bg-neutral-800 transition-colors">
                  <Check size={10} /> Mark Reviewed
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EDIT MODAL */}
      {editItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
              <h2 className="text-xs tracking-widest uppercase font-medium">
                Edit {editItem.type === 'agent' ? 'Agent' : 'Submission'}
              </h2>
              <button onClick={() => setEditItem(null)} className="text-neutral-400 hover:text-black">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="First Name" name="first_name" value={editForm.first_name} onChange={set} />
                <Field label="Last Name" name="last_name" value={editForm.last_name} onChange={set} />
              </div>
              {editItem.type === 'agent' ? (
                <>
                  <Field label="Agency Name" name="agency_name" value={editForm.agency_name} onChange={set} />
                  <Field label="Boards" name="boards" value={editForm.boards} onChange={set} />
                </>
              ) : (
                <>
                  <Field label="Role" name="role" value={editForm.role} onChange={set} />
                  <Field label="Company" name="company" value={editForm.company} onChange={set} />
                </>
              )}
              <Field label="Email" name="email" value={editForm.email} onChange={set} />
              <Field label="Phone" name="phone" value={editForm.phone} onChange={set} />
              <Field label="City" name="city" value={editForm.city} onChange={set} />
              <Field label="Instagram" name="instagram" value={editForm.instagram} onChange={set} />
              <Field label="Website" name="website" value={editForm.website} onChange={set} />
              <div>
                <label className="block text-[9px] tracking-widest uppercase text-neutral-400 mb-1">Notes</label>
                <textarea
                  value={editForm.notes || ''}
                  onChange={e => set('notes', e.target.value)}
                  rows={3}
                  className="w-full border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-black resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-neutral-200">
              <button onClick={() => setEditItem(null)} className="text-[10px] tracking-widest uppercase text-neutral-400 hover:text-black border border-neutral-200 px-4 py-2 hover:border-black transition-colors">
                Cancel
              </button>
              <button onClick={saveEdit} disabled={saving} className="text-[10px] tracking-widest uppercase bg-black text-white px-4 py-2 hover:bg-neutral-800 transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm">
            <div className="px-6 py-5 border-b border-neutral-200">
              <h2 className="text-xs tracking-widest uppercase font-medium">Confirm Delete</h2>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-neutral-600">Delete <span className="font-medium text-black">{deleteConfirm.name}</span>? This cannot be undone.</p>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-neutral-200">
              <button onClick={() => setDeleteConfirm(null)} className="text-[10px] tracking-widest uppercase text-neutral-400 hover:text-black border border-neutral-200 px-4 py-2 hover:border-black transition-colors">
                Cancel
              </button>
              <button onClick={executeDelete} className="text-[10px] tracking-widest uppercase bg-red-600 text-white px-4 py-2 hover:bg-red-700 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
