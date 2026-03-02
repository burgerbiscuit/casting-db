'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function ClientsPage() {
  const supabase = createClient()
  const [clients, setClients] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviting, setInviting] = useState(false)
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    const { data: clientProfiles } = await supabase
      .from('client_profiles')
      .select('*, client_projects(project_id, projects(name))')
      .order('created_at', { ascending: false })
    setClients(clientProfiles || [])

    const { data: projs } = await supabase.from('projects').select('id, name').eq('status', 'active')
    setProjects(projs || [])
  }, [])

  useEffect(() => { load() }, [load])

  const invite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviting(true)
    const res = await fetch('/api/invite-client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, name: inviteName }),
    })
    const data = await res.json()
    if (data.error) setMessage(`Error: ${data.error}`)
    else { setMessage('Invite sent!'); setInviteEmail(''); setInviteName(''); load() }
    setInviting(false)
    setTimeout(() => setMessage(''), 3000)
  }

  const toggleProjectAccess = async (clientId: string, projectId: string, hasAccess: boolean) => {
    if (hasAccess) {
      await supabase.from('client_projects').delete().eq('client_id', clientId).eq('project_id', projectId)
    } else {
      await supabase.from('client_projects').insert({ client_id: clientId, project_id: projectId })
    }
    load()
  }

  return (
    <div>
      <h1 className="text-2xl font-light tracking-widest uppercase mb-10">Clients</h1>

      <div className="grid grid-cols-2 gap-10">
        <section>
          <p className="label mb-4">Invite Client</p>
          <form onSubmit={invite} className="space-y-4">
            <Input label="Name" value={inviteName} onChange={e => setInviteName(e.target.value)} required />
            <Input label="Email" type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required />
            {message && <p className="text-xs text-neutral-500">{message}</p>}
            <Button type="submit" disabled={inviting}>{inviting ? 'Sending...' : 'Send Invite'}</Button>
          </form>
        </section>

        <section>
          <p className="label mb-4">Client Accounts</p>
          <div className="divide-y divide-neutral-100">
            {clients.map(c => {
              const clientProjectIds = new Set((c.client_projects || []).map((cp: any) => cp.project_id))
              return (
                <div key={c.id} className="py-4">
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-neutral-400 mb-3">{c.email}</p>
                  <div className="space-y-1">
                    {projects.map(p => (
                      <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={clientProjectIds.has(p.id)}
                          onChange={() => toggleProjectAccess(c.user_id, p.id, clientProjectIds.has(p.id))}
                          className="w-3 h-3"
                        />
                        <span className="text-xs text-neutral-600">{p.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )
            })}
            {!clients.length && <p className="text-sm text-neutral-400 py-4">No clients yet.</p>}
          </div>
        </section>
      </div>
    </div>
  )
}
