'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Search, SlidersHorizontal, X } from 'lucide-react'

export default function ModelsPage() {
  const supabase = createClient()
  const [pending, setPending] = useState<any[]>([])
  const [reviewed, setReviewed] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [agency, setAgency] = useState('')
  const [heightFt, setHeightFt] = useState('')
  const [city, setCity] = useState('')
  const [keyword, setKeyword] = useState('')
  const [gender, setGender] = useState('')
  const [ageMin, setAgeMin] = useState('')
  const [ageMax, setAgeMax] = useState('')

  const hasFilters = search || agency || heightFt || city || keyword || gender || ageMin || ageMax

  const load = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('models')
      .select('id, first_name, last_name, agency, height_ft, height_in, based_in, gender, date_of_birth, skills, hobbies, reviewed, notes, created_at, ethnicity_broad, ethnicity_specific')
      .order('last_name', { ascending: true }).order('first_name', { ascending: true })

    if (search) query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,agency.ilike.%${search}%,ethnicity_broad.ilike.%${search}%,ethnicity_specific.ilike.%${search}%,based_in.ilike.%${search}%`)
    if (agency) query = query.ilike('agency', `%${agency}%`)
    if (heightFt) query = query.eq('height_ft', parseInt(heightFt))
    if (city) query = query.ilike('based_in', `%${city}%`)
    if (gender) query = query.ilike('gender', `%${gender}%`)
    if (keyword) query = query.or(`skills.cs.{${keyword}},hobbies.cs.{${keyword}},agency.ilike.%${keyword}%,based_in.ilike.%${keyword}%,ethnicity_broad.ilike.%${keyword}%,ethnicity_specific.ilike.%${keyword}%`)

    const { data: modelData } = await query
    if (!modelData) { setLoading(false); return }

    // Age filter client-side
    let filtered = modelData
    if (ageMin || ageMax) {
      const now = new Date()
      filtered = filtered.filter(m => {
        if (!m.date_of_birth) return false
        const age = Math.floor((now.getTime() - new Date(m.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        if (ageMin && age < parseInt(ageMin)) return false
        if (ageMax && age > parseInt(ageMax)) return false
        return true
      })
    }

    const ids = filtered.map(m => m.id)
    if (!ids.length) { setPending([]); setReviewed([]); setLoading(false); return }

    const { data: media } = await supabase
      .from('model_media')
      .select('*')
      .in('model_id', ids)

    const photoMap = new Map<string, string>()
    ;(media || []).forEach((m: any) => { 
      if (m.is_visible && !photoMap.has(m.model_id)) photoMap.set(m.model_id, m.public_url) 
    })

    const enriched = filtered.map(m => ({ ...m, photo: photoMap.get(m.id) || null }))
    const pending = enriched.filter(m => !m.reviewed)
    // Sort pending by newest submission first (most recent created_at)
    pending.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    setPending(pending)
    // Reviewed/approved stay alphabetically sorted (already sorted by DB query)
    setReviewed(enriched.filter(m => m.reviewed))
    setLoading(false)
  }, [search, agency, heightFt, city, keyword, gender, ageMin, ageMax])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  const clearFilters = () => { setSearch(''); setAgency(''); setHeightFt(''); setCity(''); setKeyword(''); setGender(''); setAgeMin(''); setAgeMax('') }

  const ModelCard = ({ m }: { m: any }) => {
    const age = m.date_of_birth ? Math.floor((Date.now() - new Date(m.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null
    return (
      <Link href={`/admin/models/${m.id}`} className="group">
        <div className="aspect-[3/4] bg-neutral-100 overflow-hidden mb-2 relative">
          {m.photo ? (
            <img src={m.photo} alt={`${m.first_name} ${m.last_name}`}
              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-neutral-300">
              <div className="w-12 h-12 border border-neutral-200 flex items-center justify-center text-lg font-light mb-2">
                {m.first_name?.[0]}{m.last_name?.[0]}
              </div>
            </div>
          )}
        </div>
        <p className="text-xs font-medium tracking-wider uppercase truncate">{m.first_name} {m.last_name}</p>
        {m.agency && <p className="text-[10px] text-neutral-400 truncate">{m.agency}</p>}
        <p className="text-[10px] text-neutral-400">
          {m.height_ft ? `${m.height_ft}'${m.height_in}"` : ''}
          {m.height_ft && (m.based_in || age) ? ' · ' : ''}
          {m.based_in || ''}
          {age ? (m.based_in ? ` · ` : '') + `${age}y` : ''}
        </p>
      </Link>
    )
  }

  const total = pending.length + reviewed.length

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-light tracking-widest uppercase">Models</h1>
        <div className="flex items-center gap-4">
          <Link href="/admin/trash" className="text-xs text-neutral-500 hover:text-black transition-colors tracking-widest uppercase">
            🗑️ Trash
          </Link>
          <span className="text-xs text-neutral-400">{total} shown</span>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-0 top-3 text-neutral-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name..."
            className="w-full pl-5 border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none focus:border-black placeholder:text-neutral-400" />
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 text-xs tracking-widest uppercase border px-4 py-2 transition-colors ${showFilters || hasFilters ? 'bg-black text-white border-black' : 'border-neutral-300 hover:border-black'}`}>
          <SlidersHorizontal size={12} /> Filters {hasFilters ? '·' : ''}
        </button>
        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-neutral-400 hover:text-black transition-colors">
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-5 bg-neutral-50 border border-neutral-100">
          <div>
            <label className="label text-[10px] block mb-1">AGENCY</label>
            <input value={agency} onChange={e => setAgency(e.target.value)} placeholder="Any agency"
              className="w-full border-b border-neutral-300 bg-transparent py-1.5 text-sm focus:outline-none focus:border-black placeholder:text-neutral-300" />
          </div>
          <div>
            <label className="label text-[10px] block mb-1">CITY / BASED IN</label>
            <input value={city} onChange={e => setCity(e.target.value)} placeholder="Any city"
              className="w-full border-b border-neutral-300 bg-transparent py-1.5 text-sm focus:outline-none focus:border-black placeholder:text-neutral-300" />
          </div>
          <div>
            <label className="label text-[10px] block mb-1">HEIGHT (FT)</label>
            <select value={heightFt} onChange={e => setHeightFt(e.target.value)}
              className="w-full border-b border-neutral-300 bg-transparent py-1.5 text-sm focus:outline-none focus:border-black">
              <option value="">Any</option>
              {[4,5,6,7].map(h => <option key={h} value={h}>{h} ft</option>)}
            </select>
          </div>
          <div>
            <label className="label text-[10px] block mb-1">GENDER</label>
            <select value={gender} onChange={e => setGender(e.target.value)}
              className="w-full border-b border-neutral-300 bg-transparent py-1.5 text-sm focus:outline-none focus:border-black">
              <option value="">Any</option>
              <option>Female</option>
              <option>Male</option>
              <option>Non-binary</option>
            </select>
          </div>
          <div>
            <label className="label text-[10px] block mb-1">AGE MIN</label>
            <input type="number" value={ageMin} onChange={e => setAgeMin(e.target.value)} placeholder="e.g. 18"
              className="w-full border-b border-neutral-300 bg-transparent py-1.5 text-sm focus:outline-none focus:border-black placeholder:text-neutral-300" />
          </div>
          <div>
            <label className="label text-[10px] block mb-1">AGE MAX</label>
            <input type="number" value={ageMax} onChange={e => setAgeMax(e.target.value)} placeholder="e.g. 35"
              className="w-full border-b border-neutral-300 bg-transparent py-1.5 text-sm focus:outline-none focus:border-black placeholder:text-neutral-300" />
          </div>
          <div className="col-span-2">
            <label className="label text-[10px] block mb-1">KEYWORD (skill, hobby, etc.)</label>
            <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="e.g. Dancing, Swimming..."
              className="w-full border-b border-neutral-300 bg-transparent py-1.5 text-sm focus:outline-none focus:border-black placeholder:text-neutral-300" />
          </div>
        </div>
      )}

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
                <span className="text-[10px] text-neutral-400 ml-2">Click a model to review &amp; approve</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
                {pending.map(m => <ModelCard key={m.id} m={m} />)}
              </div>
            </div>
          )}

          {reviewed.length > 0 && (
            <div>
              {pending.length > 0 && (
                <h2 className="text-xs tracking-widest uppercase mb-6 pb-3 border-b border-neutral-100 text-neutral-500">
                  All Models ({reviewed.length})
                </h2>
              )}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
                {reviewed.map(m => <ModelCard key={m.id} m={m} />)}
              </div>
            </div>
          )}

          {total === 0 && <p className="text-sm text-neutral-400">No models found.</p>}
        </>
      )}
    </div>
  )
}
