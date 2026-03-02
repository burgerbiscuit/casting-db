'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Search, Plus } from 'lucide-react'

export default function AgenciesPage() {
  const supabase = createClient()
  const [agencies, setAgencies] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [filterCity, setFilterCity] = useState('')
  const [cities, setCities] = useState<string[]>([])

  const load = useCallback(async (q: string, city: string) => {
    setLoading(true)
    let query = supabase.from('agencies').select('*').order('name').limit(200)
    if (q) query = query.ilike('name', `%${q}%`)
    if (city) query = query.eq('city', city)
    const { data } = await query
    setAgencies(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    supabase.from('agencies').select('city').not('city','is',null).order('city').then(({ data }) => {
      setCities([...new Set((data||[]).map((r:any) => r.city).filter(Boolean))])
    })
    load('', '')
  }, [load])

  useEffect(() => {
    const t = setTimeout(() => load(search, filterCity), 250)
    return () => clearTimeout(t)
  }, [search, filterCity, load])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-light tracking-widest uppercase">Agencies</h1>
        <Link href="/admin/agencies/new"
          className="flex items-center gap-2 text-xs tracking-widest uppercase border border-black px-4 py-3 hover:bg-black hover:text-white transition-colors">
          <Plus size={12} /> Add Agency
        </Link>
      </div>

      <div className="flex gap-4 mb-8">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search agencies..." className="w-full pl-9 border-b border-neutral-300 py-2 text-sm focus:outline-none focus:border-black bg-transparent" />
        </div>
        <select value={filterCity} onChange={e => setFilterCity(e.target.value)}
          className="border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none px-2 min-w-[140px]">
          <option value="">All Cities</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <p className="label mb-4">{agencies.length} agencies</p>

      <div className="divide-y divide-neutral-100">
        {loading && <p className="text-sm text-neutral-400 py-4">Loading...</p>}
        {!loading && agencies.length === 0 && <p className="text-sm text-neutral-400 py-4">No agencies found.</p>}
        {agencies.map(a => (
          <Link key={a.id} href={`/admin/agencies/${a.id}`}
            className="flex items-center justify-between py-4 hover:bg-neutral-50 px-2 -mx-2 transition-colors group">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium tracking-wide">{a.name}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{[a.city, a.country].filter(Boolean).join(', ')}</p>
            </div>
            <div className="flex items-center gap-6 text-xs text-neutral-400 flex-shrink-0">
              {a.email && <span className="hidden md:block truncate max-w-[200px]">{a.email}</span>}
              {a.phone && <span className="hidden lg:block">{a.phone}</span>}
              {a.markets?.length > 0 && (
                <div className="hidden xl:flex gap-1">
                  {a.markets.slice(0,3).map((m:string) => (
                    <span key={m} className="px-2 py-0.5 border border-neutral-200 text-[10px] tracking-wider">{m}</span>
                  ))}
                </div>
              )}
              {a.instagram && (
                <a href={`https://instagram.com/${a.instagram}`} target="_blank" rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()} className="hover:text-black transition-colors">@{a.instagram}</a>
              )}
              <span className="text-neutral-300 group-hover:text-neutral-600 transition-colors">→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
