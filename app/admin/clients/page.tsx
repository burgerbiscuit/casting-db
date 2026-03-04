'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ChevronDown, ChevronUp, Bell } from 'lucide-react'

export default function ClientsPage() {
  const supabase = createClient()
  const [clients, setClients] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviting, setInviting] = useState(false)
  const [message, setMessage] = useState('')
  const [inviteProjectIds, setInviteProjectIds] = useState<string[]>([])
  const [inviteNote, setInviteNote] = useState('')
  const [resending, setResending] = useState<string | null>(null)
  const [editingClient, setEditingClient] = useState<any>(null)

  const load = useCallback(async () => {
    const [clientsRes, { data: projs }, { data: reqs }] = await Promise.all([
      fetch('/api/admin/clients').then(r => r.json()),
      supabase.from('projects').select('id, name, status').order('created_at', { ascending: false }),
      supabase.from('client_requests').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
    ])
    setClients(Array.isArray(clientsRes) ? clientsRes : [])
    setProjects(projs || [])
    setRequests(reqs || [])
  }, [])

  useEffect(() => { load() }, [load])

  const invite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviting(true)
    const res = await fetch('/api/invite-client', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: inviteEmail, name: inviteName, projectIds: inviteProjectIds, note: inviteNote }) })
    const data = await res.json()
    if (data.error) setMessage(`Error: ${data.error}`)
    else { setMessage('Invite sent! They will receive an email with a sign-in link.'); setInviteEmail(''); setInviteName(''); setInviteProjectIds([]); setInviteNote(''); load() }
    setInviting(false)
    setTimeout(() => setMessage(''), 3000)
  }

  const approveRequest = async (req: any) => {
    // Invite them
    const res = await fetch('/api/invite-client', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: req.email, name: req.name }) })
    await supabase.from('client_requests').update({ status: 'approved' }).eq('id', req.id)
    load()
  }

  const rejectRequest = async (req: any) => {
    await supabase.from('client_requests').update({ status: 'rejected' }).eq('id', req.id)
    load()
  }

  const resendInvite = async (client: any) => {
    setResending(client.id)
    const res = await fetch('/api/invite-client', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: client.email, name: client.name }) })
    const data = await res.json()
    setResending(null)
    if (data.error) alert('Error: ' + data.error)
    else alert('Invite resent to ' + client.email)
  }

  const toggleProjectAccess = async (clientUserId: string, projectId: string, hasAccess: boolean) => {
    if (hasAccess) await supabase.from('client_projects').delete().eq('client_id', clientUserId).eq('project_id', projectId)
    else await supabase.from('client_projects').insert({ client_id: clientUserId, project_id: projectId })
    load()
  }

  const saveClientEdit = async () => {
    if (!editingClient) return
    await supabase.from('client_profiles').update({
      name: editingClient.name,
      company: editingClient.company,
      additional_emails: editingClient.additional_emails,
      billing_name: editingClient.billing_name,
      billing_email: editingClient.billing_email,
      billing_address: editingClient.billing_address,
      billing_notes: editingClient.billing_notes,
      notes: editingClient.notes,
    }).eq('id', editingClient.id)
    setEditingClient(null)
    load()
  }

  const activeProjects = projects.filter(p => p.status === 'active')
  const archivedProjects = projects.filter(p => p.status === 'archived')

  return (
    <div>
      <h1 className="text-2xl font-light tracking-widest uppercase mb-10">Clients</h1>

      {/* Pending requests */}
      {requests.length > 0 && (
        <div className="mb-10 border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={14} className="text-amber-500" />
            <p className="text-xs tracking-widest uppercase font-medium text-amber-700">{requests.length} Pending Access Request{requests.length > 1 ? 's' : ''}</p>
          </div>
          <div className="space-y-3">
            {requests.map(r => (
              <div key={r.id} className="flex items-center justify-between bg-white p-4 border border-amber-100">
                <div>
                  <p className="text-sm font-medium">{r.name}</p>
                  <p className="text-xs text-neutral-400">{r.email}{r.company ? ` · ${r.company}` : ''}</p>
                  {r.message && <p className="text-xs text-neutral-500 mt-1 italic">"{r.message}"</p>}
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => approveRequest(r)} size="sm">Approve & Invite</Button>
                  <Button variant="ghost" size="sm" onClick={() => rejectRequest(r)}>Decline</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-10 mb-12">
        {/* Invite form */}
        <section>
          <p className="label mb-4">Invite Client Directly</p>
          <form onSubmit={invite} className="space-y-4">
            <Input label="Name" value={inviteName} onChange={e => setInviteName(e.target.value)} required />
            <Input label="Email" type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required />
            {/* Project access */}
            {activeProjects.length > 0 && (
              <div>
                <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-2">Grant Access To</p>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {activeProjects.map(p => (
                    <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox"
                        checked={inviteProjectIds.includes(p.id)}
                        onChange={e => setInviteProjectIds(prev => e.target.checked ? [...prev, p.id] : prev.filter(id => id !== p.id))}
                        className="w-3 h-3" />
                      <span className="text-xs">{p.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            {/* Personal note */}
            <div>
              <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-1">Personal Note <span className="normal-case text-neutral-300">(optional — included in invite email)</span></p>
              <textarea value={inviteNote} onChange={e => setInviteNote(e.target.value)} rows={2}
                placeholder="e.g. Hi Sarah, here's the Walking on Water casting for your review."
                className="w-full border-b border-neutral-300 py-1.5 text-xs focus:outline-none focus:border-black bg-transparent resize-none placeholder:text-neutral-300" />
            </div>
            {message && <p className="text-xs text-green-600">{message}</p>}
            <Button type="submit" disabled={inviting}>{inviting ? 'Sending...' : 'Send Invite'}</Button>
          </form>
        </section>
      </div>

      {/* Client list */}
      <section>
        <p className="label mb-4">Client Accounts ({clients.length})</p>
        <div className="space-y-2">
          {[...clients].sort((a, b) => {
            const aHas = (a.client_projects || []).length > 0
            const bHas = (b.client_projects || []).length > 0
            if (!aHas && bHas) return -1
            if (aHas && !bHas) return 1
            return 0
          }).map(c => {
            const clientProjectIds = new Set((c.client_projects || []).map((cp: any) => cp.project_id))
            const isExpanded = expanded === c.id
            const isEditing = editingClient?.id === c.id
            const hasProjects = clientProjectIds.size > 0

            return (
              <div key={c.id} className={`border ${!hasProjects ? 'border-amber-200' : 'border-neutral-200'}`}>
                <button onClick={() => setExpanded(isExpanded ? null : c.id)}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-neutral-50 transition-colors text-left">
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-neutral-400">{c.email}{c.company ? ` · ${c.company}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {!hasProjects
                      ? <span className="text-[10px] tracking-widest uppercase bg-amber-100 text-amber-700 border border-amber-200 px-2 py-1">No Projects Assigned</span>
                      : <span className="text-xs text-neutral-400">{clientProjectIds.size} project{clientProjectIds.size !== 1 ? 's' : ''}</span>
                    }
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-neutral-100 px-6 py-6">
                    <div className="flex justify-end mb-4">
                      <button onClick={() => resendInvite(c)}
                        disabled={resending === c.id}
                        className="text-[10px] tracking-widest uppercase border border-neutral-200 px-3 py-1.5 hover:border-black transition-colors disabled:opacity-40">
                        {resending === c.id ? 'Sending...' : 'Resend Invite Email'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      {/* Projects */}
                      <div>
                        <p className="label mb-3">Project Access</p>
                        {activeProjects.length > 0 && (
                          <>
                            <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-2">Active</p>
                            <div className="space-y-1.5 mb-4">
                              {activeProjects.map(p => (
                                <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" checked={clientProjectIds.has(p.id)}
                                    onChange={() => toggleProjectAccess(c.user_id, p.id, clientProjectIds.has(p.id))}
                                    className="w-3 h-3" />
                                  <span className="text-xs text-neutral-600">{p.name}</span>
                                </label>
                              ))}
                            </div>
                          </>
                        )}
                        {archivedProjects.length > 0 && (
                          <>
                            <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-2">Archived</p>
                            <div className="space-y-1.5">
                              {archivedProjects.map(p => (
                                <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                                  <input type="checkbox" checked={clientProjectIds.has(p.id)}
                                    onChange={() => toggleProjectAccess(c.user_id, p.id, clientProjectIds.has(p.id))}
                                    className="w-3 h-3" />
                                  <span className="text-xs text-neutral-400">{p.name}</span>
                                </label>
                              ))}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Edit details */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <p className="label">Client Details</p>
                          {!isEditing
                            ? <button onClick={() => setEditingClient({ ...c, additional_emails: c.additional_emails || [] })} className="text-xs underline tracking-wider uppercase">Edit</button>
                            : <div className="flex gap-2">
                                <button onClick={saveClientEdit} className="text-xs underline tracking-wider uppercase">Save</button>
                                <button onClick={() => setEditingClient(null)} className="text-xs text-neutral-400 tracking-wider uppercase">Cancel</button>
                              </div>
                          }
                        </div>

                        {isEditing ? (
                          <div className="space-y-3">
                            <Input label="Name" value={editingClient.name} onChange={e => setEditingClient((ec: any) => ({ ...ec, name: e.target.value }))} />
                            <Input label="Company" value={editingClient.company || ''} onChange={e => setEditingClient((ec: any) => ({ ...ec, company: e.target.value }))} />
                            <div>
                              <label className="label block mb-1">Additional Emails</label>
                              <p className="text-xs text-neutral-400 mb-2">One per line</p>
                              <textarea
                                value={(editingClient.additional_emails || []).join('\n')}
                                onChange={e => setEditingClient((ec: any) => ({ ...ec, additional_emails: e.target.value.split('\n').filter(Boolean) }))}
                                rows={3} className="w-full border border-neutral-200 p-2 text-xs focus:outline-none resize-none" />
                            </div>
                            <p className="label text-[10px] mt-4">BILLING</p>
                            <Input label="Billing Name" value={editingClient.billing_name || ''} onChange={e => setEditingClient((ec: any) => ({ ...ec, billing_name: e.target.value }))} />
                            <Input label="Billing Email" value={editingClient.billing_email || ''} onChange={e => setEditingClient((ec: any) => ({ ...ec, billing_email: e.target.value }))} />
                            <div>
                              <label className="label block mb-1">Billing Address</label>
                              <textarea value={editingClient.billing_address || ''} onChange={e => setEditingClient((ec: any) => ({ ...ec, billing_address: e.target.value }))}
                                rows={2} className="w-full border border-neutral-200 p-2 text-xs focus:outline-none resize-none" />
                            </div>
                            <div>
                              <label className="label block mb-1">Billing Notes</label>
                              <textarea value={editingClient.billing_notes || ''} onChange={e => setEditingClient((ec: any) => ({ ...ec, billing_notes: e.target.value }))}
                                rows={2} className="w-full border border-neutral-200 p-2 text-xs focus:outline-none resize-none" />
                            </div>
                            <div>
                              <label className="label block mb-1">Internal Notes</label>
                              <textarea value={editingClient.notes || ''} onChange={e => setEditingClient((ec: any) => ({ ...ec, notes: e.target.value }))}
                                rows={2} className="w-full border border-neutral-200 p-2 text-xs focus:outline-none resize-none" />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 text-sm">
                            {c.company && <p className="text-xs text-neutral-500">{c.company}</p>}
                            {(c.additional_emails || []).length > 0 && (
                              <div><p className="label text-[10px]">Additional Emails</p>{(c.additional_emails || []).map((e: string) => <p key={e} className="text-xs text-neutral-500">{e}</p>)}</div>
                            )}
                            {c.billing_name && <div><p className="label text-[10px]">Billing</p><p className="text-xs text-neutral-500">{c.billing_name}{c.billing_email ? ` · ${c.billing_email}` : ''}</p></div>}
                            {c.billing_address && <p className="text-xs text-neutral-400 whitespace-pre-line">{c.billing_address}</p>}
                            {c.billing_notes && <p className="text-xs text-neutral-400 italic">{c.billing_notes}</p>}
                            {c.notes && <div><p className="label text-[10px]">Notes</p><p className="text-xs text-neutral-500">{c.notes}</p></div>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          {!clients.length && <p className="text-sm text-neutral-400 py-4">No clients yet.</p>}
        </div>
      </section>
    </div>
  )
}
