'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { ModelCard } from '@/components/ModelCard'
import { LayoutGrid, ChevronLeft, ChevronRight, Heart, X } from 'lucide-react'

interface Props {
  presentationModels: any[]
  mediaByModel: Record<string, any[]>
  presentationId: string
  clientId: string
  shortlistMap: Record<string, any>
  confirmMap: Record<string, boolean>
  clientFirstName: string
  categories: any[]
  presentationName: string
  projectName: string
  projectSpecs: string
}

export function PresentationViewer({
  presentationModels, mediaByModel, presentationId, clientId, shortlistMap, confirmMap: initialConfirmMap, clientFirstName, categories, presentationName, projectName, projectSpecs
}: Props) {
  const supabase = (require('@/lib/supabase/client')).createClient()
  const [view, setView] = useState<'grid' | 'slides' | 'swipe'>('grid')
  const [swipeIndex, setSwipeIndex] = useState(0)
  const [slideIndex, setSlideIndex] = useState(0)
  const [followerCounts, setFollowerCounts] = useState<Record<string, string>>({})
  const [clientNotes, setClientNotes] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {}
    presentationModels.forEach(pm => { if (pm.client_notes) m[pm.model_id] = pm.client_notes })
    return m
  })
  const [mediaModal, setMediaModal] = useState<{ url: string; type: string } | null>(null)
  const clientNoteDebounce = useRef<any>(null)
  const swipeTouchStart = useRef<number>(0)

  const [isMobile, setIsMobile] = useState(false)
  const [isLandscape, setIsLandscape] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    const checkOrientation = () => {
      const landscape = window.innerWidth > window.innerHeight
      setIsLandscape(landscape)
      if (window.innerWidth < 768) {
        setView(landscape ? 'slides' : 'swipe')
      }
    }
    checkMobile()
    checkOrientation()
    window.addEventListener('resize', checkMobile)
    window.addEventListener('resize', checkOrientation)
    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('resize', checkOrientation)
    }
  }, [])

  useEffect(() => {
    // On mobile always lock scroll for app-like feel
    if (isMobile) {
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
    } else if (view === 'slides') {
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
      document.body.style.position = ''
    } else {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
      document.body.style.position = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
      document.body.style.position = ''
    }
  }, [view, isMobile])


  const [shortlists, setShortlists] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {}
    Object.keys(shortlistMap).forEach(k => { m[k] = true })
    return m
  })
  const [releases, setReleases] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {}
    Object.entries(shortlistMap).forEach(([k, v]) => { if ((v as any)?.is_released) m[k] = true })
    return m
  })
  // clientStatus: what the client has done (shortlisted / pending_confirmation)
  const [clientStatus, setClientStatus] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {}
    Object.entries(shortlistMap).forEach(([k, v]: any) => { if (v?.status) m[k] = v.status })
    return m
  })
  // adminConfirmed: only set by admin via project_models.admin_confirmed
  const [adminConfirmed, setAdminConfirmed] = useState<Record<string, boolean>>(initialConfirmMap || {})
  const [confirmModal, setConfirmModal] = useState<{ modelId: string; modelName: string } | null>(null)
  const [undoConfirmModal, setUndoConfirmModal] = useState<{ modelId: string; modelName: string } | null>(null)

  // Realtime: watch project_models for admin confirming
  useEffect(() => {
    let channel: any
    const setup = async () => {
      const supabase = (await import('@/lib/supabase/client')).createClient()
      channel = supabase.channel('admin-confirm-watch')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'project_models' }, async () => {
          const { data } = await supabase.from('project_models').select('model_id, admin_confirmed')
          if (data) {
            const m: Record<string, boolean> = {}
            data.filter((pm: any) => pm.admin_confirmed).forEach((pm: any) => { m[pm.model_id] = true })
            setAdminConfirmed(m)
          }
        })
        .subscribe()
    }
    setup()
    return () => { if (channel) channel.unsubscribe() }
  }, [])

  // Realtime: watch client_shortlists so count is always accurate
  useEffect(() => {
    let channel: any
    const setup = async () => {
      const supabase = (await import('@/lib/supabase/client')).createClient()
      channel = supabase.channel('shortlist-live-' + presentationId)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'client_shortlists',
          filter: `presentation_id=eq.${presentationId}`,
        }, async () => {
          // Refetch shortlists for this user + presentation
          const { data } = await supabase
            .from('client_shortlists')
            .select('model_id, status, is_released, notes, author_name')
            .eq('presentation_id', presentationId)
            .eq('client_id', clientId)
          const sl: Record<string, boolean> = {}
          const rl: Record<string, boolean> = {}
          const cs: Record<string, string> = {}
          ;(data || []).forEach((s: any) => {
            sl[s.model_id] = true
            if (s.is_released) rl[s.model_id] = true
            if (s.status) cs[s.model_id] = s.status
          })
          setShortlists(sl)
          setReleases(rl)
          setClientStatus(prev => ({ ...prev, ...cs }))
        })
        .subscribe()
    }
    setup()
    return () => { if (channel) channel.unsubscribe() }
  }, [presentationId, clientId])

  const [search, setSearch] = useState('')
  const [filterHeight, setFilterHeight] = useState<string>('')
  const [filterGender, setFilterGender] = useState<string>('')

  // All unique heights and genders for filter dropdowns
  const allHeights = [...new Set(presentationModels.map(pm => {
    const m = pm.models
    return m?.height_ft ? `${m.height_ft}'${m.height_in || 0}"` : ''
  }).filter(Boolean))].sort()

  const allGenders = [...new Set(presentationModels.map(pm => pm.models?.gender).filter(Boolean))].sort()

  const filtered = presentationModels.filter(pm => {
    const m = pm.models
    if (!m) return true
    const fullName = `${m.first_name} ${m.last_name}`.toLowerCase()
    const skills = (m.skills || []).join(' ').toLowerCase()
    const hobbies = (m.hobbies || []).join(' ').toLowerCase()
    const agency = (m.agency || '').toLowerCase()
    const q = search.toLowerCase()
    const heightStr = m.height_ft ? `${m.height_ft}'${m.height_in || 0}"` : ''

    if (search && !fullName.includes(q) && !skills.includes(q) && !hobbies.includes(q) && !agency.includes(q)) return false
    if (filterHeight && heightStr !== filterHeight) return false
    if (filterGender && m.gender !== filterGender) return false
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    const aR = !!releases[a.model_id]
    const bR = !!releases[b.model_id]
    const aC = (adminConfirmed[a.model_id] && clientStatus[a.model_id] === "pending_confirmation")
    const bC = (adminConfirmed[b.model_id] && clientStatus[b.model_id] === "pending_confirmation")
    const aS = !!shortlists[a.model_id]
    const bS = !!shortlists[b.model_id]
    if (aR && !bR) return 1
    if (!aR && bR) return -1
    if (aC && !bC) return -1
    if (!aC && bC) return 1
    if (aS && !bS) return -1
    if (!aS && bS) return 1
    // Alphabetical within same group
    const aName = ((a.models?.last_name || '') + (a.models?.first_name || '')).toLowerCase()
    const bName = ((b.models?.last_name || '') + (b.models?.first_name || '')).toLowerCase()
    return aName.localeCompare(bName)
  })

  useEffect(() => {
    const model = sorted[slideIndex]?.models
    if (!model?.instagram_handle) return
    const handle = model.instagram_handle
    if (followerCounts[handle]) return
    fetch('/api/instagram/' + handle)
      .then(r => r.json())
      .then(d => {
        if (d.follower_count) {
          const n = d.follower_count
          const fmt = n >= 1_000_000 ? (n/1_000_000).toFixed(1)+'M' : n >= 1_000 ? (n/1_000).toFixed(1)+'K' : String(n)
          setFollowerCounts(prev => ({ ...prev, [handle]: fmt }))
        }
      }).catch(() => {})
  }, [slideIndex, sorted])

  const current = sorted[slideIndex]
  const currentModel = current?.models
  const currentMedia = (mediaByModel[current?.model_id] || []).filter((m: any) => m.is_visible)
  const photoMedia = currentMedia.filter((m: any) => m.type !== 'video' && m.type !== 'digital')
  const videoMedia = currentMedia.filter((m: any) => m.type === 'video')
  const digitalMedia = currentMedia.filter((m: any) => m.type === 'digital')

  const prev = () => setSlideIndex(i => Math.max(0, i - 1))
  const next = () => setSlideIndex(i => Math.min(sorted.length - 1, i + 1))

  const touchStartX = useRef<number | null>(null)
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (dx < -50) next()
    else if (dx > 50) prev()
    touchStartX.current = null
  }

  const handleShortlistChange = useCallback((modelId: string, val: boolean) => {
    setShortlists(prev => ({ ...prev, [modelId]: val }))
    // Only set clientStatus if not already in a further-along state
    if (val) {
      setClientStatus(prev => {
        if (!prev[modelId]) return { ...prev, [modelId]: 'shortlisted' }
        return prev // preserve pending_confirmation or confirmed
      })
    } else {
      setClientStatus(prev => {
        const next = { ...prev }
        delete next[modelId]
        return next
      })
    }
  }, [])

  const saveClientNotes = async (modelId: string, notes: string) => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.from('presentation_models')
      .update({ client_notes: notes, client_notes_author: clientId || 'Client' })
      .eq('presentation_id', presentationId)
      .eq('model_id', modelId)
  }

  const handleClientNotesChange = (modelId: string, val: string) => {
    setClientNotes(prev => ({ ...prev, [modelId]: val }))
    clearTimeout(clientNoteDebounce.current)
    clientNoteDebounce.current = setTimeout(() => saveClientNotes(modelId, val), 800)
  }

  const handleConfirm = async (modelId: string) => {
    const supabase = (await import('@/lib/supabase/client')).createClient()
    setClientStatus(prev => ({ ...prev, [modelId]: 'pending_confirmation' }))
    setShortlists(prev => ({ ...prev, [modelId]: true }))
    await supabase.from('client_shortlists').upsert(
      { presentation_id: presentationId, model_id: modelId, client_id: clientId, status: 'pending_confirmation' },
      { onConflict: 'presentation_id,model_id,client_id' }
    )
  }

  const handleUndoConfirm = async (modelId: string) => {
    const supabase = (await import('@/lib/supabase/client')).createClient()
    setClientStatus(prev => ({ ...prev, [modelId]: 'shortlisted' }))
    await supabase.from('client_shortlists').upsert(
      { presentation_id: presentationId, model_id: modelId, client_id: clientId, status: 'shortlisted' },
      { onConflict: 'presentation_id,model_id,client_id' }
    )
  }

  const handleRelease = async (modelId: string) => {
    const next = !releases[modelId]
    setReleases(r => ({ ...r, [modelId]: next }))
    await supabase.from('client_shortlists').upsert({
      presentation_id: presentationId, model_id: modelId, client_id: clientId,
      is_released: next, status: 'shortlisted'
    }, { onConflict: 'presentation_id,model_id,client_id' })
  }

  const confirmedCount = Object.keys(adminConfirmed).filter(k => adminConfirmed[k] && clientStatus[k] === "pending_confirmation").length
  const shortlistedCount = Object.values(shortlists).filter(Boolean).length

    // Sort alphabetically by last name within a section
  const alphaSort = (a: any, b: any) => {
    const aName = ((a.models?.last_name || '') + (a.models?.first_name || '')).toLowerCase()
    const bName = ((b.models?.last_name || '') + (b.models?.first_name || '')).toLowerCase()
    return aName.localeCompare(bName)
  }

  // Group sorted (non-shortlisted) by category for section headers — alphabetical within each section
  const uncategorized = sorted.filter(pm => !pm.category_id && !shortlists[pm.model_id]).sort(alphaSort)
  const byCategory = categories.map(cat => ({
    ...cat,
    models: sorted.filter(pm => pm.category_id === cat.id && !shortlists[pm.model_id]).sort(alphaSort)
  })).filter(cat => cat.models.length > 0)

  const getSizingParts = (pm: any, model: any): string[] => {
    const parts: string[] = []
    if (model?.agency) parts.push(model.agency)
    if (pm?.show_sizing) {
      if (model?.height_ft) parts.push(`${model.height_ft}'${model.height_in}"`)
      if (model?.bust) parts.push(`Bust ${model.bust}`)
      if (model?.waist) parts.push(`Waist ${model.waist}`)
      if (model?.hips) parts.push(`Hips ${model.hips}`)
      if (model?.chest) parts.push(`Chest ${model.chest}`)
      if (model?.suit_size) parts.push(`Suit ${model.suit_size}`)
      if (model?.shoe_size) parts.push(`Shoe US ${model.shoe_size}`)
      if (model?.dress_size) parts.push(`Dress ${model.dress_size}`)
    }
    if (pm?.show_instagram && model?.instagram_handle) parts.push(`@${model.instagram_handle}`)
    return parts
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => setView('grid')}
          className={`flex items-center gap-2 px-4 py-2 text-xs tracking-widest uppercase border transition-colors ${view === 'grid' ? 'bg-black text-white border-black' : 'border-neutral-300 text-neutral-500 hover:border-black'}`}>
          <LayoutGrid size={12} /> Grid
        </button>
        <button onClick={() => { setView('slides'); setSlideIndex(0) }}
          className={`flex items-center gap-2 px-4 py-2 text-xs tracking-widest uppercase border transition-colors ${view === 'slides' ? 'bg-black text-white border-black' : 'border-neutral-300 text-neutral-500 hover:border-black'}`}>
          <span className="text-[10px]">▶</span> Slides
        </button>
        {shortlistedCount > 0 && (
          <span className="ml-auto flex items-center gap-1 text-xs tracking-widest uppercase text-neutral-500">
            <Heart size={12} className="fill-black text-black" /> {shortlistedCount} shortlisted
          </span>
        )}
      </div>

      {view === 'grid' && (
        <div className={isMobile ? 'fixed inset-0 bg-white flex flex-col overflow-hidden z-30' : ''}>
          {/* Mobile header */}
          {isMobile && (
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 flex-shrink-0">
              <img src="/logo.jpg" alt="Tasha Tongpreecha Casting" className="h-4 w-auto" />
              <p className="text-[10px] tracking-widest uppercase text-neutral-400">{presentationName}</p>
            </div>
          )}
          <div className={isMobile ? 'flex-1 overflow-y-auto overscroll-none' : ''}>
          {/* Search & filter bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6 flex-wrap items-end">
            <div className="relative w-full sm:flex-1 sm:min-w-[180px]">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search name, agency, skill, hobby..."
                className="w-full border-b border-neutral-300 py-2 text-sm focus:outline-none focus:border-black placeholder:text-neutral-300 bg-transparent pr-6"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-0 top-2 text-neutral-300 hover:text-black">
                  <X size={14} />
                </button>
              )}
            </div>
            <select value={filterHeight || ""} onChange={e => setFilterHeight(e.target.value)}
              className="text-xs border-b border-neutral-300 py-2 focus:outline-none focus:border-black bg-transparent pr-4 hidden sm:block">
              <option value="">All Heights</option>
              {allHeights.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <select value={filterGender || ""} onChange={e => setFilterGender(e.target.value)}
              className="text-xs border-b border-neutral-300 py-2 focus:outline-none focus:border-black bg-transparent pr-4 hidden sm:block">
              <option value="">All Genders</option>
              {allGenders.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            {(search || filterHeight || filterGender) && (
              <button onClick={() => { setSearch(''); setFilterHeight(''); setFilterGender('') }}
                className="text-xs tracking-widest uppercase text-neutral-400 hover:text-black">
                Clear
              </button>
            )}
            <span className="text-xs text-neutral-400">{filtered.length} shown</span>
          </div>

          {shortlistedCount > 0 && (
            <div className="mb-8">
              <p className="label mb-4 flex items-center gap-2"><Heart size={10} className="fill-black text-black" /> Shortlisted</p>
              <div className={`grid gap-3 ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'}`}>
                {sorted.filter(pm => shortlists[pm.model_id]).map(pm => (
                  <div key={pm.id} className="relative">
                    {(adminConfirmed[pm.model_id] && clientStatus[pm.model_id] === "pending_confirmation") && (
                      <div className="absolute top-2 left-2 z-10 bg-black text-white text-[9px] tracking-widest uppercase px-2 py-1">Officially Confirmed</div>
                    )}
                    <ModelCard presentationModel={pm} model={pm.models}
                      media={mediaByModel[pm.model_id] || []} presentationId={presentationId}
                      clientId={clientId} initialShortlisted={true}
                      initialNotes={shortlistMap[pm.model_id]?.notes || ''}
                      onShortlistChange={(v) => handleShortlistChange(pm.model_id, v)}
                      onCardClick={() => { setSlideIndex(sorted.findIndex(s => s.model_id === pm.model_id)); setView('slides') }} />
                    <button
                      onClick={() => {
                        if (clientStatus[pm.model_id] === "pending_confirmation" || (adminConfirmed[pm.model_id] && clientStatus[pm.model_id] === "pending_confirmation")) return
                        setConfirmModal({ modelId: pm.model_id, modelName: `${pm.models?.first_name} ${pm.models?.last_name}` })
                      }}
                      className={`w-full mt-1 py-1.5 text-[9px] tracking-widest uppercase transition-colors border ${(adminConfirmed[pm.model_id] && clientStatus[pm.model_id] === "pending_confirmation") ? 'bg-green-600 text-white border-green-600' : clientStatus[pm.model_id] === "pending_confirmation" ? 'bg-amber-400 text-white border-amber-400 cursor-default' : 'border-neutral-200 hover:border-black text-neutral-400 hover:text-black'}`}>
                      {(adminConfirmed[pm.model_id] && clientStatus[pm.model_id] === "pending_confirmation") ? '✓ Officially Confirmed' : clientStatus[pm.model_id] === "pending_confirmation" ? 'Confirmation Pending' : 'Request Confirmation'}
                    </button>
                    <button onClick={() => handleRelease(pm.model_id)}
                      className={`w-full mt-1 py-1.5 text-[9px] tracking-widest uppercase border transition-colors ${releases[pm.model_id] ? 'bg-neutral-800 text-white border-neutral-800' : 'border-neutral-200 text-neutral-300 hover:border-neutral-500 hover:text-neutral-500'}`}>
                      {releases[pm.model_id] ? '✓ OK to Release' : 'OK to Release'}
                    </button>
                  </div>
                ))}
              </div>
              <div className="border-t border-neutral-100 mt-8 mb-6" />
            </div>
          )}
          {/* Helper to render a model card */}
          {(() => {
            const renderCard = (pm: any) => (
              <div key={pm.id} className="relative">
                {(adminConfirmed[pm.model_id] && clientStatus[pm.model_id] === "pending_confirmation") && (
                  <div className="absolute top-2 left-2 z-10 bg-black text-white text-[9px] tracking-widest uppercase px-2 py-1">Officially Confirmed</div>
                )}
                <ModelCard presentationModel={pm} model={pm.models}
                  media={mediaByModel[pm.model_id] || []} presentationId={presentationId}
                  clientId={clientId} initialShortlisted={false}
                  initialNotes={shortlistMap[pm.model_id]?.notes || ''}
                  onShortlistChange={(v) => handleShortlistChange(pm.model_id, v)}
                  onCardClick={() => { setSlideIndex(sorted.findIndex(s => s.model_id === pm.model_id)); setView('slides') }} />
                <button
                  onClick={() => {
                    if (clientStatus[pm.model_id] === "pending_confirmation" || (adminConfirmed[pm.model_id] && clientStatus[pm.model_id] === "pending_confirmation")) return
                    setConfirmModal({ modelId: pm.model_id, modelName: `${pm.models?.first_name} ${pm.models?.last_name}` })
                  }}
                  className={`w-full mt-1 py-1.5 text-[9px] tracking-widest uppercase transition-colors border ${(adminConfirmed[pm.model_id] && clientStatus[pm.model_id] === "pending_confirmation") ? 'bg-green-600 text-white border-green-600' : (clientStatus[pm.model_id] === "pending_confirmation") ? 'bg-amber-400 text-white border-amber-400 cursor-default' : 'border-neutral-200 hover:border-black text-neutral-400 hover:text-black'}`}>
                  {(adminConfirmed[pm.model_id] && clientStatus[pm.model_id] === "pending_confirmation") ? '✓ Officially Confirmed' : (clientStatus[pm.model_id] === "pending_confirmation") ? 'Confirmation Pending' : 'Request Confirmation'}
                </button>
                <button onClick={() => handleRelease(pm.model_id)}
                  className={`w-full mt-1 py-1.5 text-[9px] tracking-widest uppercase border transition-colors ${releases[pm.model_id] ? 'bg-neutral-800 text-white border-neutral-800' : 'border-neutral-200 text-neutral-300 hover:border-neutral-500 hover:text-neutral-500'}`}>
                  {releases[pm.model_id] ? '✓ OK to Release' : 'OK to Release'}
                </button>
              </div>
            )
            const gridClass = `grid gap-3 ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'}`
            return (
              <>
                {byCategory.map(cat => (
                  <div key={cat.id} className="mb-8">
                    <p className="text-xs tracking-widest uppercase font-medium mb-4 pb-2 border-b border-black">{cat.name}</p>
                    <div className={gridClass}>{cat.models.map(renderCard)}</div>
                  </div>
                ))}
                {uncategorized.length > 0 && (
                  <div className={byCategory.length > 0 ? 'mb-8' : ''}>
                    {byCategory.length > 0 && <p className="text-xs tracking-widest uppercase text-neutral-400 mb-4 pb-2 border-b border-neutral-200">Other</p>}
                    <div className={gridClass}>{uncategorized.map(renderCard)}</div>
                  </div>
                )}
              </>
            )
          })()}
          {isMobile && !isLandscape && (
            <div className="flex-shrink-0 py-3 text-center border-t border-neutral-100">
              <p className="text-[9px] tracking-widest uppercase text-neutral-300">↻ Rotate for slide view</p>
            </div>
          )}
          </div>{/* end mobile scroll wrapper */}
        </div>
      )}


      {view === 'swipe' && isMobile && !isLandscape && (() => {
        const pm = sorted[swipeIndex]
        const model = pm?.models
        const photos = (mediaByModel[pm?.model_id] || []).filter((m: any) => m.type !== 'video')
        const photo = photos[0]
        const isShortlisted = shortlists[pm?.model_id]
        const isConfirmed = (adminConfirmed[pm?.model_id] && clientStatus[pm?.model_id] === "pending_confirmation")
        const sizing = getSizingParts(pm, model)
        return (
          <div className="fixed inset-0 bg-white z-30 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-neutral-100">
              <button onClick={() => setSwipeIndex(i => Math.max(0, i - 1))} disabled={swipeIndex === 0}
                className="p-2 disabled:opacity-20">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <div className="flex flex-col items-center">
                <img src="/logo.jpg" alt="" className="h-4 w-auto mb-0.5" />
                <span className="text-[9px] tracking-widest uppercase text-neutral-400">{swipeIndex + 1} / {sorted.length}</span>
              </div>
              <button onClick={() => setSwipeIndex(i => Math.min(sorted.length - 1, i + 1))} disabled={swipeIndex === sorted.length - 1}
                className="p-2 disabled:opacity-20">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>

            {/* Photo — fills remaining space */}
            <div className="flex-1 relative overflow-hidden bg-neutral-50">
              {photo
                ? <img src={photo.public_url} alt={model?.first_name} onClick={() => { setSlideIndex(swipeIndex); setView('slides') }} className="absolute inset-0 w-full h-full object-cover object-top cursor-pointer" />
                : <div className="absolute inset-0 flex items-center justify-center text-neutral-200 text-4xl font-light">?</div>
              }
              {isConfirmed && (
                <div className="absolute top-3 left-3 bg-black text-white text-[9px] tracking-widest uppercase px-2 py-1">Officially Confirmed</div>
              )}
            </div>

            {/* Bottom info panel */}
            <div className="flex-shrink-0 px-5 pt-4 pb-5 border-t border-neutral-100 bg-white">
              <h2 className="text-lg font-light tracking-widest uppercase leading-tight mb-0.5">{model?.first_name} {model?.last_name}</h2>
              {model?.agency && <p className="text-xs text-neutral-600 mb-0.5">{model.agency}</p>}
              {sizing.length > 0 && <p className="text-xs text-neutral-600 mb-0.5">{sizing.join(' · ')}</p>}
              {/* Rate + location from project_models via presentation_models */}
              {(pm?.rate || pm?.location) && (
                <p className="text-xs text-neutral-600 mb-0.5">
                  {[pm?.rate, pm?.location].filter(Boolean).join(' · ')}
                </p>
              )}
              {pm?.admin_notes && <p className="text-xs text-neutral-600 mb-1 italic">{pm.admin_notes}</p>}
              {/* Social / portfolio links */}
              <div className="flex gap-3 mb-2 flex-wrap">
                {model?.instagram_handle && (
                  <a href={"https://instagram.com/" + model.instagram_handle} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] tracking-widest uppercase underline underline-offset-2 text-neutral-500 hover:text-black">Instagram ↗</a>
                )}
                {model?.tiktok_handle && (
                  <a href={"https://tiktok.com/@" + model.tiktok_handle.replace('@','')} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] tracking-widest uppercase underline underline-offset-2 text-neutral-500 hover:text-black">TikTok ↗</a>
                )}
                {model?.portfolio_url && (
                  <a href={model.portfolio_url.startsWith('http') ? model.portfolio_url : 'https://' + model.portfolio_url} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] tracking-widest uppercase underline underline-offset-2 text-neutral-500 hover:text-black">Portfolio ↗</a>
                )}
              </div>
              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (clientStatus[pm.model_id] === "pending_confirmation" || (adminConfirmed[pm.model_id] && clientStatus[pm.model_id] === "pending_confirmation")) return
                    setConfirmModal({ modelId: pm.model_id, modelName: `${model?.first_name} ${model?.last_name}` })
                  }}
                  className={`flex-1 py-2.5 text-[10px] tracking-widest uppercase transition-colors border ${(adminConfirmed[pm.model_id] && clientStatus[pm.model_id] === "pending_confirmation") ? 'bg-green-600 text-white border-green-600' : (clientStatus[pm.model_id] === "pending_confirmation") ? 'bg-amber-400 text-white border-amber-400 cursor-default' : 'border-neutral-300 text-neutral-500 hover:border-black hover:text-black'}`}>
                  {(adminConfirmed[pm.model_id] && clientStatus[pm.model_id] === "pending_confirmation") ? '✓ Officially Confirmed' : (clientStatus[pm.model_id] === "pending_confirmation") ? 'Confirmation Pending' : 'Request Confirmation'}
                </button>
                <button
                  onClick={() => isShortlisted
                    ? supabase.from('client_shortlists').delete().eq('presentation_id', presentationId).eq('model_id', pm.model_id).eq('client_id', clientId).then(() => setShortlists(s => ({ ...s, [pm.model_id]: false })))
                    : supabase.from('client_shortlists').upsert({ presentation_id: presentationId, model_id: pm.model_id, client_id: clientId, status: 'shortlisted', author_name: clientFirstName }, { onConflict: 'presentation_id,model_id,client_id' }).then(() => setShortlists(s => ({ ...s, [pm.model_id]: true })))}
                  className={`px-4 py-2.5 border transition-colors flex items-center gap-1.5 text-[10px] tracking-widest uppercase ${isShortlisted ? 'bg-black text-white border-black' : 'border-neutral-300 text-neutral-500 hover:border-black'}`}>
                  <Heart size={13} className={isShortlisted ? 'fill-white text-white' : ''} />
                  {isShortlisted ? 'Shortlisted' : 'Shortlist'}
                </button>
              </div>
              {/* OK to Release — always visible, lets client cut models they don't want */}
              <button
                onClick={() => handleRelease(pm.model_id)}
                className={`w-full mt-2 py-2 text-[10px] tracking-widest uppercase border transition-colors ${releases[pm.model_id] ? 'bg-neutral-800 text-white border-neutral-800' : 'border-neutral-200 text-neutral-400 hover:border-neutral-500 hover:text-neutral-600'}`}>
                {releases[pm.model_id] ? '✓ OK to Release' : 'OK to Release'}
              </button>
            </div>
          </div>
        )
      })()}

      {view === 'slides' && current && currentModel && (
        <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} className="fixed inset-0 bg-white z-40 flex flex-col overflow-hidden">

          {/* Header — single compact row in landscape, taller in portrait/desktop */}
          <div className="flex-shrink-0 border-b border-neutral-100">
            <div className="flex items-center gap-3 px-4 py-2.5">
              {/* Logo — hidden on mobile landscape to save space */}
              <img src="/logo.jpg" alt="" className="h-3 w-auto opacity-50 hidden landscape:hidden md:block" />
              {/* Name + sizing */}
              <div className="flex-1 min-w-0">
                <h2 className="text-base md:text-2xl font-light tracking-[0.12em] uppercase truncate">
                  {currentModel.first_name} {currentModel.last_name}
                </h2>
                <p className="text-xs text-neutral-500 tracking-wide truncate">
                  {getSizingParts(current, currentModel).join(' · ')}
                </p>
              </div>
              {/* Action buttons — always in header, compact */}
              <button
                onClick={() => {
                  const modelName = `${currentModel?.first_name} ${currentModel?.last_name}`
                  const isOfficiallyConfirmed = adminConfirmed[current.model_id] && clientStatus[current.model_id] === "pending_confirmation"
                  const isPending = clientStatus[current.model_id] === "pending_confirmation"
                  if (isOfficiallyConfirmed) return
                  if (isPending) { setUndoConfirmModal({ modelId: current.model_id, modelName }); return }
                  setConfirmModal({ modelId: current.model_id, modelName })
                }}
                className={`flex-shrink-0 text-xs tracking-widest uppercase border px-3 py-2 transition-colors whitespace-nowrap ${(adminConfirmed[current.model_id] && clientStatus[current.model_id] === "pending_confirmation") ? 'bg-green-600 text-white border-green-600 cursor-default' : (clientStatus[current.model_id] === "pending_confirmation") ? 'bg-amber-400 text-white border-amber-400 hover:bg-amber-500' : 'border-neutral-300 text-neutral-500 hover:border-black hover:text-black'}`}>
                {(adminConfirmed[current.model_id] && clientStatus[current.model_id] === "pending_confirmation") ? '✓ Confirmed' : (clientStatus[current.model_id] === "pending_confirmation") ? '⏳ Pending ✕' : 'Confirm'}
              </button>
              <SlideActions presentationId={presentationId} modelId={current.model_id} clientId={clientId}
                initialShortlisted={!!shortlists[current.model_id]} initialNotes={shortlistMap[current.model_id]?.notes || ""} initialAuthor={shortlistMap[current.model_id]?.author_name || ''}
                onShortlistChange={(v) => handleShortlistChange(current.model_id, v)} compact={true} model={currentModel} projectName={projectName} clientFirstName={clientFirstName} />
              <button onClick={() => setView('grid')} className="flex-shrink-0 text-neutral-400 hover:text-black transition-colors text-lg leading-none">✕</button>
            </div>
          </div>

          {/* Body: photos left + right panel */}
          <div className="flex flex-1 min-h-0 overflow-hidden">

            {/* Photos flush left */}
            <div className="flex flex-1 min-w-0 gap-2 pt-4 pb-0 pl-0 pr-0 overflow-hidden">
              {currentMedia.length === 0 && (
                <div className="bg-neutral-200 flex items-center justify-center text-neutral-400 text-xs flex-1">No photos</div>
              )}
              {photoMedia.slice(0, 2).map((m: any, i: number) => (
                <div key={m.id} className="bg-neutral-200 overflow-hidden flex-1" style={{maxWidth:'calc(50% - 4px)'}}>
                  {m.type === 'video'
                    ? <video src={m.public_url} className="w-full h-full object-cover" controls />
                    : <img src={m.public_url} alt="" className="w-full h-full object-cover object-top" />}
                </div>
              ))}
            </div>

            {/* Right panel: sidebar on desktop, bottom strip on mobile landscape */}
            <div className={`flex-shrink-0 flex flex-col ${isMobile ? 'w-36 px-3 py-3' : 'w-48 xl:w-56 px-5 py-5'}`}>
              <div className="flex-1 flex flex-col items-center justify-center space-y-4 text-center">
                {current.admin_notes && (
                  <p className="text-sm text-neutral-700 italic leading-relaxed">{current.admin_notes}</p>
                )}
                {current.rate && (
                  <p className="text-base font-medium tracking-wider">{current.rate}</p>
                )}
                {current.location && (
                  <p className="text-sm text-neutral-700 tracking-wider">{current.location}</p>
                )}
              </div>

              {/* Client notes + links at bottom */}
              <div className="space-y-3">
                <textarea
                  value={clientNotes[current.model_id] || ''}
                  onChange={e => handleClientNotesChange(current.model_id, e.target.value)}
                  placeholder="Your notes..."
                  rows={3}
                  className="w-full text-sm bg-transparent resize-none focus:outline-none placeholder:text-neutral-300 leading-relaxed border-b border-neutral-200 pb-2"
                />
                <div className="space-y-1.5">
                  {current.show_portfolio && currentModel.portfolio_url && (
                    <a href={currentModel.portfolio_url.startsWith('http') ? currentModel.portfolio_url : 'https://' + currentModel.portfolio_url}
                      target="_blank" rel="noopener noreferrer"
                      className="block text-xs tracking-widest uppercase underline underline-offset-2 hover:opacity-60 transition-opacity">
                      Portfolio ↗
                    </a>
                  )}
                  {current.show_instagram && currentModel.instagram_handle && (
                    <a href={"https://instagram.com/" + currentModel.instagram_handle}
                      target="_blank" rel="noopener noreferrer"
                      className="block text-xs tracking-widest uppercase underline underline-offset-2 hover:opacity-60 transition-opacity">
                      Instagram ↗
                    </a>
                  )}
                  {videoMedia.length > 0 && (
                    <button onClick={() => setMediaModal({ url: videoMedia[0].public_url, type: 'video' })}
                      className="block text-xs tracking-widest uppercase underline underline-offset-2 hover:opacity-60 transition-opacity">
                      ▶ Video
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Prev / Next bottom bar */}
          <div className="flex items-center justify-between px-8 py-3 border-t border-neutral-100 flex-shrink-0">
            <button onClick={prev} disabled={slideIndex === 0}
              className="flex items-center gap-2 text-xs tracking-widest uppercase disabled:opacity-20 hover:opacity-60 transition-opacity">
              <ChevronLeft size={14} /> Prev
            </button>
            <span className="text-xs text-neutral-400">{slideIndex + 1} / {sorted.length}</span>
            <button onClick={next} disabled={slideIndex === sorted.length - 1}
              className="flex items-center gap-2 text-xs tracking-widest uppercase disabled:opacity-20 hover:opacity-60 transition-opacity">
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {mediaModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8">
          <button onClick={() => setMediaModal(null)} className="absolute top-4 right-4 text-white hover:opacity-60">
            <X size={24} />
          </button>
          {mediaModal.type === 'video'
            ? <video src={mediaModal.url} controls autoPlay className="max-w-full max-h-full" />
            : <img src={mediaModal.url} alt="" className="max-w-full max-h-full object-contain" />}
        </div>
      )}

      {/* Confirm talent modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
          <div className="bg-white max-w-sm w-full p-8">
            <h3 className="text-sm tracking-widest uppercase font-medium mb-2">Confirm Talent</h3>
            <p className="text-sm text-neutral-600 mb-6">
              Request confirmation for <strong>{confirmModal.modelName}</strong>? Your casting director will be notified.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { handleConfirm(confirmModal.modelId); setConfirmModal(null) }}
                className="flex-1 py-3 text-xs tracking-widest uppercase bg-black text-white hover:bg-neutral-800 transition-colors">
                Yes, Confirm
              </button>
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-3 text-xs tracking-widest uppercase border border-neutral-300 hover:border-black transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Undo confirmation modal */}
      {undoConfirmModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
          <div className="bg-white max-w-sm w-full p-8">
            <h3 className="text-sm tracking-widest uppercase font-medium mb-2">Undo Confirmation</h3>
            <p className="text-sm text-neutral-600 mb-6">
              Cancel the confirmation request for <strong>{undoConfirmModal.modelName}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { handleUndoConfirm(undoConfirmModal.modelId); setUndoConfirmModal(null) }}
                className="flex-1 py-3 text-xs tracking-widest uppercase bg-black text-white hover:bg-neutral-800 transition-colors">
                Yes, Undo
              </button>
              <button
                onClick={() => setUndoConfirmModal(null)}
                className="flex-1 py-3 text-xs tracking-widest uppercase border border-neutral-300 hover:border-black transition-colors">
                Keep
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SlideActions({ presentationId, modelId, clientId, initialShortlisted, initialNotes, initialAuthor, onShortlistChange, compact, model, projectName, clientFirstName }: {
  presentationId: string, modelId: string, clientId: string, initialShortlisted: boolean, initialNotes: string, initialAuthor?: string, onShortlistChange?: (v: boolean) => void, compact?: boolean, model?: any, projectName?: string, clientFirstName?: string
}) {
  const [shortlisted, setShortlisted] = useState(initialShortlisted)
  const [notes, setNotes] = useState(initialNotes)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const toggle = async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const next = !shortlisted
    setShortlisted(next)
    onShortlistChange?.(next)
    if (next) {
      await supabase.from('client_shortlists').upsert({ presentation_id: presentationId, model_id: modelId, client_id: clientId, notes })
    } else {
      await supabase.from('client_shortlists').delete().eq('presentation_id', presentationId).eq('model_id', modelId).eq('client_id', clientId)
    }
  }

  const saveNotes = async (val: string) => {
    setNotes(val)
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.from('client_shortlists').upsert(
      { presentation_id: presentationId, model_id: modelId, client_id: clientId, notes: val, author_name: clientFirstName || null },
      { onConflict: 'presentation_id,model_id,client_id' }
    )
  }


  if (compact) return (
    <div className="flex items-center gap-2 relative">
      {toast && (
        <div className="absolute -top-8 right-0 bg-black text-white text-[10px] px-2 py-1 whitespace-nowrap tracking-wider">{toast}</div>
      )}
      <button onClick={toggle}
        className={[`flex items-center gap-1.5 px-3 py-2 text-xs tracking-widest uppercase border transition-colors`, shortlisted ? 'bg-black text-white border-black' : 'border-neutral-300 hover:border-black'].join(' ')}>
        <Heart size={11} className={shortlisted ? 'fill-white text-white' : ''} />
        {shortlisted ? 'Shortlisted' : 'Shortlist'}
      </button>
    </div>
  )

  return (
    <div className="space-y-3 relative">
      {toast && (
        <div className="absolute -top-8 left-0 right-0 bg-black text-white text-[10px] px-2 py-1 text-center tracking-wider">{toast}</div>
      )}
      <button onClick={toggle}
        className={[`w-full py-3 text-xs tracking-widest uppercase border transition-colors flex items-center justify-center gap-2`, shortlisted ? 'bg-black text-white border-black' : 'border-neutral-300 hover:border-black'].join(' ')}>
        <Heart size={12} className={shortlisted ? 'fill-white text-white' : ''} />
        {shortlisted ? 'Shortlisted' : 'Add to Shortlist'}
      </button>
      {notes && initialAuthor && (
        <p className="text-[10px] text-neutral-400 tracking-wider">{initialAuthor}</p>
      )}
      <textarea value={notes} onChange={e => saveNotes(e.target.value)} placeholder="Your notes..." 
        rows={2} className="w-full text-sm border-b border-neutral-200 bg-transparent py-2 focus:outline-none focus:border-black resize-none placeholder:text-neutral-300" />
    </div>
  )
}
