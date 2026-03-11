'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Search, Plus } from 'lucide-react'

const GROUP_TYPES = ['Dance', 'Music', 'Sports', 'Acrobatics', 'Comedy', 'Cheer', 'Theater', 'Other']

export default function GroupsPage() {
  const supabase = createClient()
  const [pending, setPending] = useState<any[]>([])
  const [reviewed, setReviewed] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('groups')
      .select('id, name, group_type, size, based_in, agency, reviewed, created_at')
      .order('name', { ascending: true })

    if (search) {
      query = query.or(`name.ilike.%${search}%,based_in.ilike.%${search}%,agency.ilike.%${search}%,group_type.ilike.%${search}%`)
    }
    if (typeFilter) query = query.eq('group_type', typeFilter)

    const { data: groupData } = await query
    if (!groupData) { setLoading(false); return }

    const groupIds = new Set(groupData.map(g => g.id))
    const { data: allMedia } = await supabase
      .from('group_media')
      .select('group_id, public_url, is_cover, is_visible')
      .eq('is_visible', true)

    const coverMap = new Map<string, string>()
    ;(allMedia || []).forEach((m: any) => {
      if (!groupIds.has(m.group_id)) return
      if (m.is_cover && !coverMap.has(m.group_id)) {
        coverMap.set(m.group_id, m.public_url)
      } else if (!coverMap.has(m.group_id)) {
        coverMap.set(m.group_id, m.public_url)
      }
    })

    const enriched = groupData.map(g => ({ ...g, photo: coverMap.get(g.id) || null }))
    const pend = enriched.filter(g => !g.reviewed)
    pend.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    setPending(pend)
    setReviewed(enriched.filter(g => g.reviewed))
    setLoading(false)
  }, [search, typeFilter])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  const GroupCard = ({ g }: { g: any }) => (
    <Link href={`/admin/groups/${g.id}`} className="group">
      <div className="aspect-[3/4] bg-neutral-100 overflow-hidden mb-2 relative">
        {g.photo ? (
          <img src={g.photo} alt={g.name}
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-neutral-300">
            <div className="w-12 h-12 border border-neutral-200 flex items-center justify-center text-lg font-light mb-2">
              {g.name?.[0]}
            </div>
          </div>
        )}
      </div>
      <p className="text-xs font-medium tracking-wider uppercase truncate">{g.name}</p>
      {g.group_type && <p className="text-[10px] text-neutral-400 truncate">{g.group_type}</p>}
      <p className="text-[10px] text-neutral-400">
        {g.size || ''}
        {g.size && g.based_in ? ' · ' : ''}
        {g.based_in || ''}
      </p>
    </Link>
  )

  const total = pending.length + reviewed.length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-light tracking-widest uppercase">Groups</h1>
          <p className="text-sm text-neutral-400 mt-1">{total} groups</p>
        </div>
        <Link href="/admin/groups/new"
          className="flex items-center gap-2 bg-black text-white px-4 py-2.5 text-xs tracking-widest uppercase hover:bg-neutral-800 transition-colors">
          <Plus size={12} /> New Group
        </Link>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-0 top-3 text-neutral-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, city..."
            className="w-full pl-5 border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none focus:border-black placeholder:text-neutral-400" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="text-xs border border-neutral-300 px-3 py-1.5 focus:outline-none focus:border-black">
          <option value="">All Types</option>
          {GROUP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {loading && <div className="text-xs text-neutral-400">Loading...</div>}

      {!loading && (
        <>
          {pending.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-6 pb-3 border-b border-amber-200">
                <span className="text-amber-500 text-sm">⚠</span>
                <h2 className="text-xs tracking-widest uppercase font-medium text-amber-600">
                  Pending Review ({pending.length})
                </h2>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
                {pending.map(g => <GroupCard key={g.id} g={g} />)}
              </div>
            </div>
          )}

          {reviewed.length > 0 && (
            <div>
              {pending.length > 0 && (
                <h2 className="text-xs tracking-widest uppercase mb-6 pb-3 border-b border-neutral-100 text-neutral-500">
                  All Groups ({reviewed.length})
                </h2>
              )}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
                {reviewed.map(g => <GroupCard key={g.id} g={g} />)}
              </div>
            </div>
          )}

          {total === 0 && (
            <div className="text-center py-20">
              <p className="text-sm text-neutral-400 mb-4">No groups yet.</p>
              <Link href="/admin/groups/new"
                className="text-xs tracking-widest uppercase underline underline-offset-4 hover:text-neutral-600 transition-colors">
                Add your first group
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  )
}
