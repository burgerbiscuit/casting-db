'use client'
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Trash2 } from 'lucide-react'

export default function TeamPage() {
  const supabase = createClient()
  const [members, setMembers] = useState<any[]>([])
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('member')
  const [inviting, setInviting] = useState(false)
  const [message, setMessage] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{id: string, name: string} | null>(null)

  const load = useCallback(async () => {
    const { data } = await supabase.from('team_members').select('*').order('created_at')
    setMembers(data || [])
  }, [])

  useEffect(() => { load() }, [load])

  const invite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviting(true)
    const res = await fetch('/api/invite-team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, role }),
    })
    const data = await res.json()
    if (data.error) setMessage(`Error: ${data.error}`)
    else { setMessage('Invite sent!'); setEmail(''); setName(''); load() }
    setInviting(false)
    setTimeout(() => setMessage(''), 3000)
  }

  const remove = async (id: string) => {
    if (!confirm('Remove this team member?')) return
    await supabase.from('team_members').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <h1 className="text-2xl font-light tracking-widest uppercase mb-10">Team</h1>
      <div className="grid grid-cols-2 gap-10">
        <section>
          <p className="label mb-4">Invite Team Member</p>
          <form onSubmit={invite} className="space-y-4">
            <Input label="Name" value={name} onChange={e => setName(e.target.value)} required />
            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <div>
              <label className="label block mb-2">Role</label>
              <select value={role} onChange={e => setRole(e.target.value)}
                className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none">
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {message && <p className="text-xs text-neutral-500">{message}</p>}
            <Button type="submit" disabled={inviting}>{inviting ? 'Sending...' : 'Send Invite'}</Button>
          </form>
        </section>

        <section>
          <p className="label mb-4">Team Members</p>
          <div className="divide-y divide-neutral-100">
            {members.map(m => (
              <div key={m.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm">{m.name}</p>
                  <p className="text-xs text-neutral-400">{m.email} · <Badge>{m.role}</Badge></p>
                </div>
                <button onClick={() => remove(m.id)} className="text-neutral-300 hover:text-red-500"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </section>
      </div>
      {deleteTarget && (
        <DeleteConfirmModal
          title={`Remove ${deleteTarget.name} from the team?`}
          description="They will lose access to the admin panel immediately."
          onConfirm={() => { remove(deleteTarget.id); setDeleteTarget(null) }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
