'use client'
import { useState } from 'react'
import { X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal'

interface Contact {
  id?: string
  agency_name: string | null
  agent_name: string | null
  email: string | null
  board: string | null
  city: string | null
  section: string | null
  office_phone: string | null
  cell_phone: string | null
  contact_type: string
  website: string | null
  instagram: string | null
  description: string | null
}

interface Props {
  contact: Contact
  onClose: () => void
  onSaved: () => void
  onDeleted: () => void
}

export function ContactEditModal({ contact, onClose, onSaved, onDeleted }: Props) {
  const supabase = createClient()
  const [form, setForm] = useState({ ...contact })
  const [saving, setSaving] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  const setField = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    setSaving(true)
    const payload = {
      agency_name: form.agency_name || null,
      agent_name: form.agent_name || null,
      email: form.email ? form.email.toLowerCase() : null,
      board: form.board || null,
      city: form.city || null,
      section: form.section || null,
      office_phone: form.office_phone || null,
      cell_phone: form.cell_phone || null,
      website: form.website || null,
      instagram: form.instagram || null,
      description: form.description || null,
      contact_type: form.contact_type || 'model',
    }
    if (contact.id) {
      await supabase.from('agency_contacts').update(payload).eq('id', contact.id)
    } else {
      await supabase.from('agency_contacts').insert(payload)
    }
    setSaving(false)
    onSaved()
  }

  const handleDelete = async () => {
    await supabase.from('agency_contacts').delete().eq('id', contact.id)
    onDeleted()
  }

  const Field = ({ label, k }: { label: string; k: keyof typeof form }) => (
    <div>
      <label className="label text-[10px] block mb-1">{label}</label>
      <input
        value={(form[k] as string) || ''}
        onChange={e => setField(k as string, e.target.value)}
        className="w-full border-b border-neutral-200 bg-transparent py-1.5 text-sm focus:outline-none focus:border-black"
      />
    </div>
  )

  return (
    <>
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-medium tracking-widest uppercase">{contact.id ? 'Edit Contact' : 'Add Contact'}</h3>
            <button onClick={onClose}><X size={14} className="text-neutral-400 hover:text-black" /></button>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-6">
            <Field label="Company" k="agency_name" />
            <Field label="Contact Name" k="agent_name" />
            <Field label="Role / Title" k="section" />
            <Field label="City" k="city" />
            <Field label="Email" k="email" />
            <Field label="Phone" k="office_phone" />
            <Field label="Website" k="website" />
            <Field label="Instagram" k="instagram" />
          </div>
          <div className="mb-8">
            <label className="label text-[10px] block mb-1">Description / Notable Work</label>
            <textarea
              value={(form.description as string) || ''}
              onChange={e => setField('description', e.target.value)}
              rows={3}
              placeholder="Clients, brands, projects they've worked on..."
              className="w-full border border-neutral-200 bg-transparent p-2 text-sm focus:outline-none focus:border-black resize-none"
            />
          </div>
          <div className="flex items-center justify-between">
            {contact.id ? (
              <button onClick={() => setShowDelete(true)}
                className="text-[10px] tracking-widest uppercase text-red-400 hover:text-red-600 transition-colors">
                Delete Contact
              </button>
            ) : <div />}
            <div className="flex gap-3">
              <button onClick={onClose}
                className="border border-neutral-300 px-5 py-2.5 text-xs tracking-widest uppercase hover:border-black transition-colors">
                Cancel
              </button>
              <button onClick={save} disabled={saving}
                className="bg-black text-white px-5 py-2.5 text-xs tracking-widest uppercase hover:bg-neutral-800 transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : contact.id ? 'Save' : 'Add Contact'}
              </button>
            </div>
          </div>
        </div>
      </div>
      {showDelete && (
        <DeleteConfirmModal
          title={"Delete " + (form.agent_name || form.agency_name || 'this contact') + "?"}
          description="This contact will be permanently removed."
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </>
  )
}
