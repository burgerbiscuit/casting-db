'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Trash2, ShieldAlert } from 'lucide-react'

const TASHA_USER_ID = 'f5fe2bb4-f429-4978-a052-6f00cc614ff8'

export default function TeamPage() {
  const supabase = createClient()
  const [members, setMembers] = useState<any[]>([])
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('member')
  const [inviting, setInviting] = useState(false)
  const [message, setMessage] = useState('')
  const [isTasha, setIsTasha] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState<any | null>(null)
  const [confirmInput, setConfirmInput] = useState('')
  const [removing, setRemoving] = useState(false)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setIsTasha(user?.id === TASHA_USER_ID)
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
    if (data.error) setMessage('Error: ' + data.error)
    else { setMessage('Invite sent!'); setEmail(''); setName(''); load() }
    setInviting(false)
    setTimeout(() => setMessage(''), 3000)
  }

  const remove = async () => {
    if (!confirmRemove || confirmInput !== confirmRemove.name) return
    setRemoving(true)
    const res = await fetch('/api/remove-team-member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: confirmRemove.id }),
    })
    const data = await res.json()
    if (data.error) alert('Error: ' + data.error)
    setRemoving(false)
    setConfirmRemove(null)
    setConfirmInput('')
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
                {isTasha && m.user_id !== TASHA_USER_ID && (
                  <button onClick={() => { setConfirmRemove(m); setConfirmInput('') }}
                    className="text-neutral-300 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
                {!isTasha && (
                  <span title="Only Tasha can remove team members">
                    <ShieldAlert size={14} className="text-neutral-200" />
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Confirm remove modal */}
      {confirmRemove && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6">
          <div className="bg-white max-w-sm w-full p-8">
            <h3 className="text-sm tracking-widest uppercase font-medium mb-2">Remove Team Member</h3>
            <p className="text-sm text-neutral-600 mb-4">
              This will revoke <strong>{confirmRemove.name}</strong>'s access immediately. Type their name to confirm.
            </p>
            <input
              value={confirmInput}
              onChange={e => setConfirmInput(e.target.value)}
              placeholder={confirmRemove.name}
              className="w-full border-b border-neutral-300 py-2 text-sm focus:outline-none focus:border-black mb-5 bg-transparent"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={remove}
                disabled={removing || confirmInput !== confirmRemove.name}
                className="flex-1 py-2.5 text-xs tracking-widest uppercase bg-red-600 text-white hover:bg-red-700 disabled:opacity-30 transition-colors">
                {removing ? 'Removing...' : 'Remove'}
              </button>
              <button onClick={() => { setConfirmRemove(null); setConfirmInput('') }}
                className="flex-1 py-2.5 text-xs tracking-widest uppercase border border-neutral-300 hover:border-black transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
