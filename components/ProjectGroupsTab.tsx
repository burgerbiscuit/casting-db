'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { X } from 'lucide-react'

interface Props {
  projectId: string
}

export function ProjectGroupsTab({ projectId }: Props) {
  const supabase = createClient()
  const [groups, setGroups] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadGroups = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('project_groups')
      .select('id, group_id, notes, groups(id, name, group_type, size, based_in, agency)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    setGroups(data || [])
    setLoading(false)
  }, [projectId])

  useEffect(() => { loadGroups() }, [loadGroups])

  const searchGroups = async (q: string) => {
    setSearch(q)
    if (q.length < 1) { setSearchResults([]); return }
    setSearchLoading(true)
    const { data } = await supabase
      .from('groups')
      .select('id, name, group_type, size, based_in, agency')
      .or(`name.ilike.%${q}%,group_type.ilike.%${q}%,based_in.ilike.%${q}%`)
      .limit(10)
    const existing = new Set(groups.map((g: any) => g.group_id))
    setSearchResults((data || []).filter((g: any) => !existing.has(g.id)))
    setSearchLoading(false)
  }

  const addGroup = async (group: any) => {
    const { data } = await supabase
      .from('project_groups')
      .insert({ project_id: projectId, group_id: group.id })
      .select('id, group_id, notes, groups(id, name, group_type, size, based_in, agency)')
      .single()
    if (data) setGroups(prev => [data, ...prev])
    setSearch('')
    setSearchResults([])
  }

  const removeGroup = async (pgId: string) => {
    await supabase.from('project_groups').delete().eq('id', pgId)
    setGroups(prev => prev.filter((g: any) => g.id !== pgId))
  }

  const updateNotes = async (pgId: string, notes: string) => {
    await supabase.from('project_groups').update({ notes }).eq('id', pgId)
    setGroups(prev => prev.map((g: any) => g.id === pgId ? { ...g, notes } : g))
  }

  return (
    <div>
      {/* Search to add */}
      <div className="relative mb-6">
        <input
          value={search}
          onChange={e => searchGroups(e.target.value)}
          placeholder="Search groups to add..."
          className="w-full border border-neutral-200 px-3 py-2 text-xs focus:outline-none focus:border-black placeholder:text-neutral-400"
        />
        {searchLoading && <span className="absolute right-3 top-2 text-[10px] text-neutral-400">searching...</span>}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-20 bg-white border border-neutral-200 border-t-0 shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map(g => (
              <button key={g.id} onClick={() => addGroup(g)}
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-neutral-50 text-left border-b border-neutral-100 last:border-0">
                <div>
                  <p className="text-xs font-medium tracking-wide">{g.name}</p>
                  <p className="text-[10px] text-neutral-400">
                    {g.group_type}{g.size ? ` · ${g.size}` : ''}{g.based_in ? ` · ${g.based_in}` : ''}
                  </p>
                </div>
                <span className="text-[10px] tracking-widest uppercase text-neutral-400 flex-shrink-0 ml-3">+ Add</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Groups count */}
      <p className="label mb-4">Groups ({groups.length})</p>

      {loading && <p className="text-xs text-neutral-400">Loading...</p>}

      {!loading && groups.length === 0 && (
        <p className="text-xs text-neutral-400">No groups added yet. Search above to add one.</p>
      )}

      {/* Group list */}
      <div className="space-y-2">
        {groups.map((pg: any) => {
          const g = pg.groups
          return (
            <div key={pg.id} className="border border-neutral-100 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Link href={`/admin/groups/${g?.id}`}
                      className="text-sm font-medium tracking-wide hover:underline">
                      {g?.name}
                    </Link>
                    {g?.group_type && (
                      <span className="text-[9px] tracking-widest uppercase text-neutral-400 border border-neutral-200 px-1.5 py-0.5">
                        {g.group_type}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-neutral-400">
                    {g?.size && `${g.size}`}
                    {g?.size && g?.based_in && ' · '}
                    {g?.based_in}
                    {g?.agency && ` · ${g.agency}`}
                  </p>
                  {/* Notes */}
                  <NoteField
                    value={pg.notes || ''}
                    onSave={(notes) => updateNotes(pg.id, notes)}
                  />
                </div>
                <button onClick={() => removeGroup(pg.id)}
                  className="text-neutral-300 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5">
                  <X size={14} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function NoteField({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [text, setText] = useState(value)
  const [editing, setEditing] = useState(false)

  useEffect(() => { setText(value) }, [value])

  return editing ? (
    <div className="mt-2 flex gap-2 items-start">
      <textarea
        autoFocus
        value={text}
        onChange={e => setText(e.target.value)}
        rows={2}
        className="flex-1 text-xs border border-neutral-200 p-1.5 focus:outline-none focus:border-black resize-none"
      />
      <div className="flex flex-col gap-1">
        <button onClick={() => { onSave(text); setEditing(false) }}
          className="text-[9px] tracking-widest uppercase bg-black text-white px-2 py-1">Save</button>
        <button onClick={() => { setText(value); setEditing(false) }}
          className="text-[9px] tracking-widest uppercase border border-neutral-300 px-2 py-1">Cancel</button>
      </div>
    </div>
  ) : (
    <button onClick={() => setEditing(true)}
      className="mt-1 text-[10px] text-neutral-400 hover:text-black transition-colors text-left">
      {text ? `"${text}"` : '+ Add note'}
    </button>
  )
}
