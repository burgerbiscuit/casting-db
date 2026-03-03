'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, Check, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal'

const PRIORITIES = ['low', 'normal', 'high', 'urgent']
const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-neutral-400',
  normal: 'text-blue-500',
  high: 'text-amber-500',
  urgent: 'text-red-500',
}

export function TasksPanel() {
  const supabase = createClient()
  const [tasks, setTasks] = useState<any[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [showDone, setShowDone] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', description: '', assigned_to: '', deadline: '', priority: 'normal' })

  const load = useCallback(async () => {
    const [{ data: user }, { data: t }, { data: members }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('team_members').select('user_id, name, email').order('name'),
    ])
    setCurrentUser(user?.user)
    setTasks(t || [])
    setTeamMembers(members || [])
  }, [])

  useEffect(() => { load() }, [load])

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault()
    const member = teamMembers.find(m => m.user_id === form.assigned_to)
    const { data: { user } } = await supabase.auth.getUser()
    const meMember = teamMembers.find(m => m.user_id === user?.id)
    await supabase.from('tasks').insert({
      title: form.title,
      description: form.description || null,
      assigned_to: form.assigned_to || null,
      assigned_to_name: member?.name || null,
      created_by: user?.id,
      created_by_name: meMember?.name || user?.email?.split('@')[0] || 'Admin',
      deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      priority: form.priority,
      status: 'open',
    })
    setForm({ title: '', description: '', assigned_to: '', deadline: '', priority: 'normal' })
    setShowForm(false)
    load()
  }

  const toggleStatus = async (task: any) => {
    const next = task.status === 'open' ? 'done' : 'open'
    await supabase.from('tasks').update({ status: next, updated_at: new Date().toISOString() }).eq('id', task.id)
    load()
  }

  const deleteTask = async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id)
    load()
  }

  const isOverdue = (t: any) => t.deadline && new Date(t.deadline) < new Date() && t.status === 'open'

  const open = tasks.filter(t => t.status === 'open')
  const done = tasks.filter(t => t.status === 'done')

  const fmtDeadline = (d: string) => {
    const date = new Date(d)
    const now = new Date()
    const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (diff < 0) return `${label} (${Math.abs(diff)}d overdue)`
    if (diff === 0) return `${label} (today)`
    if (diff === 1) return `${label} (tomorrow)`
    return `${label} (${diff}d)`
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs tracking-widest uppercase font-medium">Tasks</h2>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 text-xs tracking-widest uppercase text-neutral-400 hover:text-black transition-colors">
          <Plus size={12} /> New
        </button>
      </div>

      {showForm && (
        <form onSubmit={createTask} className="border border-neutral-200 p-4 mb-4 space-y-3">
          <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Task title..."
            className="w-full border-b border-neutral-300 bg-transparent py-1.5 text-sm focus:outline-none focus:border-black placeholder:text-neutral-300" />
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Description (optional)..."
            rows={2} className="w-full border-b border-neutral-300 bg-transparent py-1.5 text-sm focus:outline-none focus:border-black resize-none placeholder:text-neutral-300" />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] tracking-widest uppercase text-neutral-400 block mb-1">Assign to</label>
              <select value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
                className="w-full border-b border-neutral-300 bg-transparent py-1 text-xs focus:outline-none focus:border-black">
                <option value="">Anyone</option>
                {teamMembers.map(m => <option key={m.user_id} value={m.user_id}>{m.name || m.email}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] tracking-widest uppercase text-neutral-400 block mb-1">Deadline</label>
              <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                className="w-full border-b border-neutral-300 bg-transparent py-1 text-xs focus:outline-none focus:border-black" />
            </div>
            <div>
              <label className="text-[10px] tracking-widest uppercase text-neutral-400 block mb-1">Priority</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                className="w-full border-b border-neutral-300 bg-transparent py-1 text-xs focus:outline-none focus:border-black">
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={() => setShowForm(false)} className="text-xs text-neutral-400 tracking-widest uppercase hover:text-black">Cancel</button>
            <button type="submit" className="text-xs tracking-widest uppercase bg-black text-white px-4 py-1.5 hover:opacity-70 transition-opacity">Create</button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {open.length === 0 && !showForm && <p className="text-xs text-neutral-400 py-2">No open tasks.</p>}
        {open.map(task => (
          <div key={task.id} className={`flex items-start gap-3 p-3 border group ${isOverdue(task) ? 'border-red-100 bg-red-50' : 'border-neutral-100'}`}>
            <button onClick={() => toggleStatus(task)}
              className={`mt-0.5 w-4 h-4 flex-shrink-0 border-2 rounded-sm flex items-center justify-center transition-colors ${task.status === 'done' ? 'bg-black border-black' : 'border-neutral-300 hover:border-black'}`}>
              {task.status === 'done' && <Check size={10} className="text-white" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium leading-snug">{task.title}</p>
              {task.description && <p className="text-[10px] text-neutral-400 mt-0.5 truncate">{task.description}</p>}
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {task.priority !== 'normal' && (
                  <span className={`text-[9px] tracking-widest uppercase font-medium ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                )}
                {task.assigned_to_name && (
                  <span className="text-[9px] tracking-wider text-neutral-500">→ {task.assigned_to_name.split(' ')[0]}</span>
                )}
                {task.deadline && (
                  <span className={`text-[9px] tracking-wider flex items-center gap-1 ${isOverdue(task) ? 'text-red-500' : 'text-neutral-400'}`}>
                    <Clock size={9} />{fmtDeadline(task.deadline)}
                  </span>
                )}
                <span className="text-[9px] text-neutral-300">by {task.created_by_name}</span>
              </div>
            </div>
            <button onClick={() => setDeleteTarget(task.id)}
              className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-black transition-all flex-shrink-0">
              <X size={12} />
            </button>
          </div>
        ))}
      </div>

      {done.length > 0 && (
        <div className="mt-4">
          <button onClick={() => setShowDone(!showDone)}
            className="flex items-center gap-1 text-[10px] tracking-widest uppercase text-neutral-400 hover:text-black transition-colors mb-2">
            {showDone ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            Completed ({done.length})
          </button>
          {showDone && (
            <div className="space-y-1.5">
              {done.map(task => (
                <div key={task.id} className="flex items-start gap-3 p-3 border border-neutral-100 opacity-50 group">
                  <button onClick={() => toggleStatus(task)}
                    className="mt-0.5 w-4 h-4 flex-shrink-0 border-2 border-black bg-black rounded-sm flex items-center justify-center">
                    <Check size={10} className="text-white" />
                  </button>
                  <p className="text-xs line-through text-neutral-400 flex-1">{task.title}</p>
                  <button onClick={() => setDeleteTarget(task.id)}
                    className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-black transition-all">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          title="Delete this task?"
          onConfirm={() => { deleteTask(deleteTarget); setDeleteTarget(null) }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
