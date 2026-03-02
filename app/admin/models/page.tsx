'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Search } from 'lucide-react'

export default function ModelsPage() {
  const supabase = createClient()
  const [models, setModels] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (q: string) => {
    setLoading(true)
    let query = supabase
      .from('models')
      .select('id, first_name, last_name, agency, ethnicity_broad, ethnicity_specific, height_ft, height_in, skills')
      .order('last_name')
      .limit(100)

    if (q) {
      query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,agency.ilike.%${q}%,ethnicity_broad.ilike.%${q}%,ethnicity_specific.ilike.%${q}%`)
    }

    const { data: modelData } = await query

    // Get first visible photo for each model
    if (modelData && modelData.length > 0) {
      const ids = modelData.map(m => m.id)
      const { data: media } = await supabase
        .from('model_media')
        .select('model_id, public_url')
        .in('model_id', ids)
        .eq('is_visible', true)
        .eq('type', 'photo')
        .order('display_order')

      const photoMap = new Map<string, string>()
      ;(media || []).forEach(m => {
        if (!photoMap.has(m.model_id)) photoMap.set(m.model_id, m.public_url)
      })

      setModels(modelData.map(m => ({ ...m, photo: photoMap.get(m.id) || null })))
    } else {
      setModels([])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => load(search), 300)
    return () => clearTimeout(t)
  }, [search, load])

  return (
    <div>
      <h1 className="text-2xl font-light tracking-widest uppercase mb-10">Models</h1>

      <div className="relative mb-8 max-w-md">
        <Search size={14} className="absolute left-0 top-3 text-neutral-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, agency, ethnicity..."
          className="w-full pl-5 border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none focus:border-black placeholder:text-neutral-400"
        />
      </div>

      {loading && <div className="text-xs text-neutral-400">Loading...</div>}

      {!loading && models.length === 0 && (
        <p className="text-sm text-neutral-400">No models found.</p>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
        {models.map(m => (
          <Link key={m.id} href={`/admin/models/${m.id}`} className="group">
            <div className="aspect-[3/4] bg-neutral-100 overflow-hidden mb-2 relative">
              {m.photo ? (
                <img
                  src={m.photo}
                  alt={`${m.first_name} ${m.last_name}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-neutral-300">
                  <div className="w-12 h-12 rounded-full border-2 border-neutral-200 flex items-center justify-center text-lg font-light mb-2">
                    {m.first_name?.[0]}{m.last_name?.[0]}
                  </div>
                  <p className="text-[10px] tracking-wider uppercase">No photo</p>
                </div>
              )}
            </div>
            <p className="text-xs font-medium tracking-wider uppercase truncate">
              {m.first_name} {m.last_name}
            </p>
            {m.agency && <p className="text-[10px] text-neutral-400 truncate">{m.agency}</p>}
            {(m.height_ft) && (
              <p className="text-[10px] text-neutral-400">{m.height_ft}&apos;{m.height_in}&quot;</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
