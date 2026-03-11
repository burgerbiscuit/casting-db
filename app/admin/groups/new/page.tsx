'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const GROUP_TYPES = ['Climbing', 'Dance', 'Music', 'Sports', 'Acrobatics', 'Comedy', 'Cheer', 'Theater', 'Other']

export default function NewGroupPage() {
  const supabase = createClient()
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    group_type: '',
    size: '',
    based_in: '',
    contact_name: '',
    contact_email: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Group name is required'); return }
    setSaving(true)
    const { data, error: err } = await supabase.from('groups').insert({
      name: form.name.trim(),
      group_type: form.group_type || null,
      size: form.size || null,
      based_in: form.based_in || null,
      contact_name: form.contact_name || null,
      contact_email: form.contact_email || null,
    }).select('id').single()

    if (err || !data) {
      setError(err?.message || 'Failed to create group')
      setSaving(false)
      return
    }
    router.push(`/admin/groups/${data.id}`)
  }

  return (
    <div className="max-w-lg">
      <div className="mb-8">
        <Link href="/admin/groups" className="text-[10px] tracking-widest uppercase text-neutral-400 hover:text-black transition-colors">
          ← Groups
        </Link>
      </div>

      <h1 className="text-2xl font-light tracking-widest uppercase mb-10">New Group</h1>

      <form onSubmit={submit} className="space-y-6">
        <div>
          <label className="label text-[10px] block mb-1">GROUP NAME *</label>
          <input required value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="e.g. The Flyers, Step Squad NYC"
            className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none focus:border-black placeholder:text-neutral-300" />
        </div>

        <div>
          <label className="label text-[10px] block mb-1">GROUP TYPE</label>
          <select value={form.group_type} onChange={e => set('group_type', e.target.value)}
            className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none focus:border-black">
            <option value="">Select type...</option>
            {GROUP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="label text-[10px] block mb-1">SIZE</label>
            <input value={form.size} onChange={e => set('size', e.target.value)}
              placeholder="e.g. Duo, Trio, 4–6"
              className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none focus:border-black placeholder:text-neutral-300" />
          </div>
          <div>
            <label className="label text-[10px] block mb-1">BASED IN</label>
            <input value={form.based_in} onChange={e => set('based_in', e.target.value)}
              placeholder="City"
              className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none focus:border-black placeholder:text-neutral-300" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="label text-[10px] block mb-1">CONTACT NAME</label>
            <input value={form.contact_name} onChange={e => set('contact_name', e.target.value)}
              className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none focus:border-black" />
          </div>
          <div>
            <label className="label text-[10px] block mb-1">CONTACT EMAIL</label>
            <input type="email" value={form.contact_email} onChange={e => set('contact_email', e.target.value)}
              className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none focus:border-black" />
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="bg-black text-white px-8 py-3 text-xs tracking-widest uppercase hover:bg-neutral-800 transition-colors disabled:opacity-50">
            {saving ? 'Creating...' : 'Create Group'}
          </button>
          <Link href="/admin/groups"
            className="border border-neutral-300 px-8 py-3 text-xs tracking-widest uppercase hover:border-black transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
