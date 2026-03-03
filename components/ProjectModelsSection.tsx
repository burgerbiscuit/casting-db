'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { LayoutGrid, List } from 'lucide-react'

interface Props {
  projectId: string
  modelsWithPhotos: any[]
  mainPres: any | null
  presModelIds: string[]
}

function getInitials(model: any) {
  return ((model?.first_name?.[0] || '') + (model?.last_name?.[0] || '')).toUpperCase()
}

const STATUS_ORDER: Record<string, number> = { confirmed: 0, pending_confirmation: 1, shortlisted: 2, none: 3 }
const STATUS_LABEL: Record<string, string> = { confirmed: 'Confirmed', pending_confirmation: 'Pending Confirmation', shortlisted: 'Shortlisted' }
const STATUS_COLOR: Record<string, string> = { confirmed: 'bg-green-600 text-white', pending_confirmation: 'bg-amber-400 text-white', shortlisted: 'bg-neutral-200 text-neutral-700' }

export function ProjectModelsSection({ projectId, modelsWithPhotos, mainPres, presModelIds: initialPresModelIds }: Props) {
  const supabase = createClient()
  const [view, setView] = useState<'list' | 'grid'>('list')
  const [presModels, setPresModels] = useState<Record<string, any>>({}) // keyed by model_id
  const [shortlistStatus, setShortlistStatus] = useState<Record<string, string>>({}) // model_id → 'confirmed'|'pending_confirmation'|'shortlisted'
  const [adminConfirmed, setAdminConfirmed] = useState<Record<string, boolean>>({}) // project_model_id → admin_confirmed
  const [presModelIds, setPresModelIds] = useState<Set<string>>(new Set(initialPresModelIds))

  const load = useCallback(async () => {
    if (!mainPres?.id) return
    const [{ data: pm }, { data: sl }] = await Promise.all([
      supabase.from('presentation_models')
        .select('id, model_id, admin_notes, is_visible, rate, location, pm_option')
        .eq('presentation_id', mainPres.id),
      supabase.from('client_shortlists')
        .select('model_id, status')
        .eq('presentation_id', mainPres.id),
    ])
    const pmMap: Record<string, any> = {}
    ;(pm || []).forEach((m: any) => { pmMap[m.model_id] = m })
    setPresModels(pmMap)
    setPresModelIds(new Set(Object.keys(pmMap)))

    const { data: pmData } = await supabase.from('project_models').select('model_id, admin_confirmed').eq('project_id', projectId)
    const statusMap: Record<string, string> = {}
    ;(sl || []).forEach((s: any) => { statusMap[s.model_id] = s.status || 'shortlisted' })
    setShortlistStatus(statusMap)
    const adminMap: Record<string, boolean> = {}
    ;(pmData || []).forEach((pm: any) => { if (pm.admin_confirmed) adminMap[pm.model_id] = true })
    setAdminConfirmed(adminMap)
  }, [mainPres?.id])

  useEffect(() => { load() }, [load])

  const savePresNotes = async (modelId: string, notes: string) => {
    const pm = presModels[modelId]
    if (!pm) return
    await supabase.from('presentation_models').update({ admin_notes: notes }).eq('id', pm.id)
    setPresModels(prev => ({ ...prev, [modelId]: { ...prev[modelId], admin_notes: notes } }))
  }

  const savePmField = async (pmId: string, field: string, value: string) => {
    await supabase.from('project_models').update({ [field]: value }).eq('id', pmId)
  }

  const togglePresentation = async (modelId: string, displayOrder: number) => {
    if (!mainPres?.id) return
    const included = presModelIds.has(modelId)
    if (included) {
      await supabase.from('presentation_models').delete().eq('presentation_id', mainPres.id).eq('model_id', modelId)
      setPresModelIds(prev => { const s = new Set(prev); s.delete(modelId); return s })
      setPresModels(prev => { const m = { ...prev }; delete m[modelId]; return m })
    } else {
      const { data } = await supabase.from('presentation_models').insert({
        presentation_id: mainPres.id, model_id: modelId, display_order: displayOrder,
        show_sizing: true, show_instagram: true, is_visible: true
      }).select().single()
      if (data) {
        setPresModelIds(prev => new Set([...prev, modelId]))
        setPresModels(prev => ({ ...prev, [modelId]: data }))
      }
    }
  }

  const officialConfirm = async (modelId: string) => {
    const next = !adminConfirmed[modelId]
    setAdminConfirmed(r => ({ ...r, [modelId]: next }))
    // Update project_models
    await supabase.from('project_models').update({ admin_confirmed: next, status: next ? 'confirmed' : 'pending' })
      .eq('project_id', projectId).eq('model_id', modelId)
    // Update client_shortlists to reflect official confirmation
    await supabase.from('client_shortlists')
      .update({ status: next ? 'confirmed' : 'pending_confirmation' })
      .eq('model_id', modelId)
  }

  // Sort: confirmed → shortlisted → other
  const sorted = [...modelsWithPhotos].sort((a, b) => {
    const as = STATUS_ORDER[shortlistStatus[a.models?.id] || 'none']
    const bs = STATUS_ORDER[shortlistStatus[b.models?.id] || 'none']
    return as - bs
  })

  // Group for list view
  const pending = sorted.filter(pm => shortlistStatus[pm.models?.id] === 'pending_confirmation')
  const confirmed = sorted.filter(pm => shortlistStatus[pm.models?.id] === 'confirmed' || adminConfirmed[pm.models?.id])
  const shortlisted = sorted.filter(pm => shortlistStatus[pm.models?.id] === 'shortlisted')
  const others = sorted.filter(pm => !shortlistStatus[pm.models?.id])

  const ModelListRow = ({ pm, i }: { pm: any; i: number }) => {
    const model = pm.models
    const mid = model?.id
    const status = shortlistStatus[mid]
    const presModel = presModels[mid]
    const [notes, setNotes] = useState(presModel?.admin_notes || '')
    const [option, setOption] = useState(pm.pm_option || '')
    const [rate, setRate] = useState(pm.pm_rate || '')
    const [location, setLocation] = useState(pm.pm_location || '')
    const [expanded, setExpanded] = useState(false)

    useEffect(() => { setNotes(presModels[mid]?.admin_notes || '') }, [presModels[mid]?.admin_notes])

    return (
      <div className={`border border-neutral-100 ${expanded ? 'mb-1' : ''}`}>
        <div className="flex items-center gap-3 px-3 py-2">
          {mainPres && (
            <button onClick={() => togglePresentation(mid, i)}
              className={`w-4 h-4 border-2 flex-shrink-0 flex items-center justify-center transition-colors ${presModelIds.has(mid) ? 'bg-black border-black' : 'border-neutral-300 hover:border-black'}`}>
              {presModelIds.has(mid) && <span className="text-white text-[9px]">✓</span>}
            </button>
          )}
          {pm.photo ? <img src={pm.photo} className="w-8 h-10 object-cover object-top flex-shrink-0" alt="" />
            : <div className="w-8 h-10 bg-neutral-100 flex items-center justify-center text-neutral-300 text-[9px]">{getInitials(model)}</div>}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium">{model?.first_name} {model?.last_name}</p>
              {status && <span className={`text-[8px] tracking-widest uppercase px-1.5 py-0.5 ${STATUS_COLOR[status]}`}>{STATUS_LABEL[status]}</span>}
              {status === 'pending_confirmation' && (
                <button onClick={() => officialConfirm(mid)}
                  className="text-[8px] tracking-widest uppercase px-2 py-0.5 border border-green-500 text-green-600 hover:bg-green-600 hover:text-white transition-colors ml-1">
                  ✓ Officially Confirm
                </button>
              )}
              {adminConfirmed[mid] && status !== 'pending_confirmation' && (
                <span className="text-[8px] tracking-widest uppercase px-1.5 py-0.5 bg-green-600 text-white ml-1">✓ Confirmed</span>
              )}
            </div>
            {model?.agency && <p className="text-[10px] text-neutral-400">{model?.agency}</p>}
          </div>
          <button onClick={() => setExpanded(!expanded)} className="text-[10px] text-neutral-300 hover:text-black transition-colors px-2">
            {expanded ? '▲' : '▼'}
          </button>
          <Link href={`/admin/models/${mid}`} className="text-[10px] text-neutral-300 hover:text-black transition-colors">→</Link>
        </div>

        {expanded && (
          <div className="px-3 pb-3 pt-1 border-t border-neutral-50 grid grid-cols-2 gap-3">
            <input className="text-[10px] border-b border-neutral-200 bg-transparent py-1 focus:outline-none focus:border-black placeholder:text-neutral-300"
              placeholder="Option" value={option} onChange={e => setOption(e.target.value)}
              onBlur={e => savePmField(pm.id, 'pm_option', e.target.value)} />
            <input className="text-[10px] border-b border-neutral-200 bg-transparent py-1 focus:outline-none focus:border-black placeholder:text-neutral-300"
              placeholder="Rate" value={rate} onChange={e => setRate(e.target.value)}
              onBlur={e => savePmField(pm.id, 'pm_rate', e.target.value)} />
            <input className="text-[10px] border-b border-neutral-200 bg-transparent py-1 focus:outline-none focus:border-black placeholder:text-neutral-300 col-span-2"
              placeholder="Location" value={location} onChange={e => setLocation(e.target.value)}
              onBlur={e => savePmField(pm.id, 'pm_location', e.target.value)} />
            <div className="col-span-2">
              <p className="text-[9px] text-neutral-400 tracking-widest uppercase mb-1">Notes for client presentation</p>
              <textarea className="w-full text-[10px] border-b border-neutral-200 bg-transparent py-1 focus:outline-none focus:border-black resize-none placeholder:text-neutral-300"
                placeholder={presModelIds.has(mid) ? 'Notes visible to client in presentation...' : 'Add to presentation to enable notes'}
                rows={2} disabled={!presModelIds.has(mid)}
                value={notes} onChange={e => setNotes(e.target.value)}
                onBlur={e => savePresNotes(mid, e.target.value)} />
            </div>
          </div>
        )}
      </div>
    )
  }

  const ModelGridCard = ({ pm, i }: { pm: any; i: number }) => {
    const model = pm.models
    const mid = model?.id
    const status = shortlistStatus[mid]
    const presModel = presModels[mid]
    const [notes, setNotes] = useState(presModel?.admin_notes || '')
    const [option, setOption] = useState(pm.pm_option || '')
    const [rate, setRate] = useState(pm.pm_rate || '')
    const [location, setLocation] = useState(pm.pm_location || '')

    useEffect(() => { setNotes(presModels[mid]?.admin_notes || '') }, [presModels[mid]?.admin_notes])

    return (
      <div className="border border-neutral-100 flex flex-col">
        <div className="relative" style={{ aspectRatio: '3/4' }}>
          {pm.photo ? <img src={pm.photo} alt="" className="w-full h-full object-cover object-top" />
            : <div className="w-full h-full bg-neutral-100 flex items-center justify-center text-neutral-300 text-sm">{getInitials(model)}</div>}
          {status && (
            <div className={`absolute top-2 left-2 text-[8px] tracking-widest uppercase px-1.5 py-0.5 ${STATUS_COLOR[status]}`}>{STATUS_LABEL[status]}</div>
          )}
          {mainPres && (
            <button onClick={() => togglePresentation(mid, i)}
              className={`absolute top-2 right-2 w-5 h-5 border-2 flex items-center justify-center transition-colors ${presModelIds.has(mid) ? 'bg-black border-black' : 'bg-white border-neutral-300 hover:border-black'}`}>
              {presModelIds.has(mid) && <span className="text-white text-[9px]">✓</span>}
            </button>
          )}
        </div>
        <div className="p-2 flex flex-col gap-1.5">
          <p className="text-xs font-medium truncate">{model?.first_name} {model?.last_name}</p>
          {model?.agency && <p className="text-[10px] text-neutral-400 truncate">{model?.agency}</p>}
          <input className="w-full text-[10px] border-b border-neutral-200 bg-transparent py-0.5 focus:outline-none focus:border-black placeholder:text-neutral-300"
            placeholder="Option" value={option} onChange={e => setOption(e.target.value)} onBlur={e => savePmField(pm.id, 'pm_option', e.target.value)} />
          <input className="w-full text-[10px] border-b border-neutral-200 bg-transparent py-0.5 focus:outline-none focus:border-black placeholder:text-neutral-300"
            placeholder="Rate" value={rate} onChange={e => setRate(e.target.value)} onBlur={e => savePmField(pm.id, 'pm_rate', e.target.value)} />
          <input className="w-full text-[10px] border-b border-neutral-200 bg-transparent py-0.5 focus:outline-none focus:border-black placeholder:text-neutral-300"
            placeholder="Location" value={location} onChange={e => setLocation(e.target.value)} onBlur={e => savePmField(pm.id, 'pm_location', e.target.value)} />
          <textarea className="w-full text-[10px] border-b border-neutral-200 bg-transparent py-0.5 focus:outline-none focus:border-black resize-none placeholder:text-neutral-300"
            placeholder={presModelIds.has(mid) ? 'Notes for presentation...' : 'Add to presentation first'}
            rows={2} disabled={!presModelIds.has(mid)}
            value={notes} onChange={e => setNotes(e.target.value)} onBlur={e => savePresNotes(mid, e.target.value)} />
        </div>
      </div>
    )
  }

  const renderGroup = (group: any[], label?: string) => {
    if (!group.length) return null
    return (
      <div className="mb-4">
        {label && <p className="text-[10px] tracking-widest uppercase font-medium mb-2 pb-1 border-b border-neutral-200 text-neutral-500">{label} ({group.length})</p>}
        {view === 'list'
          ? <div className="space-y-1">{group.map((pm, i) => <ModelListRow key={pm.id} pm={pm} i={i} />)}</div>
          : <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">{group.map((pm, i) => <ModelGridCard key={pm.id} pm={pm} i={i} />)}</div>
        }
      </div>
    )
  }

  const hasGroups = confirmed.length > 0 || pending.length > 0 || shortlisted.length > 0

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="label">Models Signed In ({modelsWithPhotos.length})</p>
        <div className="flex items-center gap-2">
          {mainPres && <p className="text-[10px] text-neutral-400 tracking-wider uppercase mr-2">✓ = on presentation</p>}
          {modelsWithPhotos.length > 0 && (
            <div className="flex border border-neutral-200 overflow-hidden">
              <button onClick={() => setView('list')}
                className={`flex items-center gap-1 px-2 py-1 text-[10px] tracking-widest uppercase transition-colors ${view === 'list' ? 'bg-black text-white' : 'text-neutral-500 hover:bg-neutral-50'}`}>
                <List size={10} /> List
              </button>
              <button onClick={() => setView('grid')}
                className={`flex items-center gap-1 px-2 py-1 text-[10px] tracking-widest uppercase border-l border-neutral-200 transition-colors ${view === 'grid' ? 'bg-black text-white' : 'text-neutral-500 hover:bg-neutral-50'}`}>
                <LayoutGrid size={10} /> Grid
              </button>
            </div>
          )}
        </div>
      </div>

      {modelsWithPhotos.length === 0 ? (
        <div className="border border-dashed border-neutral-200 p-8 text-center">
          <p className="text-sm text-neutral-400">No models signed in yet.</p>
        </div>
      ) : (
        <>
          {hasGroups ? (
            <>
              {pending.length > 0 && renderGroup(pending, 'Pending Confirmation ⏳')}
              {renderGroup(confirmed, 'Officially Confirmed ✓')}
              {renderGroup(shortlisted, 'Shortlisted')}
              {renderGroup(others, others.length && hasGroups ? 'Other' : undefined)}
            </>
          ) : renderGroup(sorted)}
        </>
      )}
    </div>
  )
}
