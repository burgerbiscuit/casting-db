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


function SectionField({ modelId, presModelId, categoryId, categories, presModelIds, onCategoryChange, onCategoryCreated, presentationId, supabase }: any) {
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  if (!presModelIds.has(modelId)) return null

  const handleAssign = async (catId: string | null) => {
    onCategoryChange(catId)
    if (presModelId) await supabase.from('presentation_models').update({ category_id: catId || null }).eq('id', presModelId)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !presentationId) return
    const maxOrder = Math.max(-1, ...categories.map((c: any) => c.display_order || 0))
    const { data } = await supabase.from('presentation_categories').insert({ presentation_id: presentationId, name: newName.trim(), display_order: maxOrder + 1 }).select().single()
    await onCategoryCreated()
    if (data) await handleAssign(data.id)
    setNewName(''); setCreating(false)
  }

  return (
    <div className="mb-1">
      <p className="text-[9px] text-neutral-400 tracking-widest uppercase mb-1">Section</p>
      {creating ? (
        <form onSubmit={handleCreate} className="flex gap-2 items-center">
          <input autoFocus value={newName} onChange={e => setNewName(e.target.value)} placeholder="Section name..."
            className="flex-1 text-[10px] border-b border-neutral-300 bg-transparent py-1 focus:outline-none focus:border-black placeholder:text-neutral-300" />
          <button type="submit" className="text-[9px] tracking-widest uppercase text-black hover:opacity-60">Add</button>
          <button type="button" onClick={() => setCreating(false)} className="text-[9px] tracking-widest uppercase text-neutral-400 hover:text-black">Cancel</button>
        </form>
      ) : (
        <div className="flex gap-2 items-center">
          <select value={categoryId || ''} onChange={e => handleAssign(e.target.value || null)}
            className="flex-1 text-[10px] border-b border-neutral-200 bg-transparent py-1 focus:outline-none focus:border-black text-neutral-700">
            <option value="">— No section —</option>
            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button type="button" onClick={() => setCreating(true)} className="text-[9px] tracking-widest uppercase text-neutral-400 hover:text-black whitespace-nowrap">+ Create</button>
        </div>
      )}
    </div>
  )
}

export function ProjectModelsSection({ projectId, modelsWithPhotos, mainPres, presModelIds: initialPresModelIds }: Props) {
  const supabase = createClient()
  const [view, setView] = useState<'list' | 'grid'>('list')
  const [presModels, setPresModels] = useState<Record<string, any>>({}) // keyed by model_id
  const [shortlistStatus, setShortlistStatus] = useState<Record<string, string>>({}) // model_id → 'confirmed'|'pending_confirmation'|'shortlisted'
  const [adminConfirmed, setAdminConfirmed] = useState<Record<string, boolean>>({}) // project_model_id → admin_confirmed
  const [categories, setCategories] = useState<{id:string;name:string}[]>([])
  const [presModelCategories, setPresModelCategories] = useState<Record<string,string|null>>({}) // model_id → category_id
  const [presModelIds, setPresModelIds] = useState<Set<string>>(new Set(initialPresModelIds))

  const load = useCallback(async () => {
    if (!mainPres?.id) return
    const [{ data: pm }, { data: sl }] = await Promise.all([
      supabase.from('presentation_models')
        .select('id, model_id, admin_notes, is_visible, rate, location, pm_option, category_id')
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
    if (mainPres?.id) {
      const { data: cats } = await supabase.from('presentation_categories').select('id, name').eq('presentation_id', mainPres.id).order('display_order')
      setCategories(cats || [])
    }
    // Track category per model from presentation_models
    const catMap: Record<string,string|null> = {}
    ;(pm || []).forEach((m: any) => { catMap[m.model_id] = m.category_id || null })
    setPresModelCategories(catMap)
    const statusMap: Record<string, string> = {}
    ;(sl || []).forEach((s: any) => { statusMap[s.model_id] = s.status || 'shortlisted' })
    setShortlistStatus(statusMap)
    const adminMap: Record<string, boolean> = {}
    ;(pmData || []).forEach((pm: any) => { if (pm.admin_confirmed) adminMap[pm.model_id] = true })
    setAdminConfirmed(adminMap)
  }, [mainPres?.id])

  useEffect(() => { load() }, [load])

  // Realtime: re-load when client_shortlists changes (client shortlists/requests confirmation)
  useEffect(() => {
    const channel = supabase
      .channel('admin-shortlist-watch-' + projectId)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'client_shortlists',
      }, () => { load() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [projectId])


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


  const addAllToPresentation = async () => {
    if (!mainPres?.id) return
    const missing = models.filter(pm => !presModelIds.has(pm.models?.id))
    for (let i = 0; i < missing.length; i++) {
      const pm = missing[i]
      const modelId = pm.models?.id
      if (!modelId) continue
      const { data } = await supabase.from('presentation_models').upsert({
        presentation_id: mainPres.id, model_id: modelId,
        display_order: presModelIds.size + i, show_sizing: true, show_instagram: true, is_visible: true
      }, { onConflict: 'presentation_id,model_id' }).select().single()
      if (data) {
        setPresModelIds(prev => new Set([...prev, modelId]))
        setPresModels(prev => ({ ...prev, [modelId]: data }))
      }
    }
  }

  const officialConfirm = async (modelId: string) => {
    const next = !adminConfirmed[modelId]
    setAdminConfirmed(r => ({ ...r, [modelId]: next }))
    setShortlistStatus(r => ({ ...r, [modelId]: next ? 'confirmed' : 'pending_confirmation' }))
    // Update project_models
    await supabase.from('project_models').update({ admin_confirmed: next, status: next ? 'confirmed' : 'pending' })
      .eq('project_id', projectId).eq('model_id', modelId)
    // Update client_shortlists to reflect official confirmation
    await supabase.from('client_shortlists')
      .update({ status: next ? 'confirmed' : 'pending_confirmation' })
      .eq('model_id', modelId)
  }

  const setClientStatus = async (modelId: string, newStatus: string | null) => {
    setShortlistStatus(r => {
      const next = { ...r }
      if (newStatus) next[modelId] = newStatus
      else delete next[modelId]
      return next
    })
    // If clearing status, remove from client_shortlists
    if (!newStatus) {
      await supabase.from('client_shortlists').delete().eq('model_id', modelId)
      return
    }
    // Upsert client_shortlists
    const { data: existing } = await supabase.from('client_shortlists').select('id').eq('model_id', modelId).maybeSingle()
    if (existing) {
      await supabase.from('client_shortlists').update({ status: newStatus }).eq('model_id', modelId)
    } else {
      // Find presentation_model_id
      const { data: pm } = await supabase.from('presentation_models')
        .select('id').eq('model_id', modelId).maybeSingle()
      await supabase.from('client_shortlists').insert({ model_id: modelId, status: newStatus, presentation_model_id: pm?.id || null })
    }
  }

  const [models, setModels] = useState(modelsWithPhotos)
  const [addSearch, setAddSearch] = useState('')
  const [showNewModel, setShowNewModel] = useState(false)
  const [newModelForm, setNewModelForm] = useState({ first_name: '', last_name: '', agency: '', email: '', phone: '', instagram_handle: '' })
  const [creating, setCreating] = useState(false)
  const [addResults, setAddResults] = useState<any[]>([])
  const [addLoading, setAddLoading] = useState(false)
  useEffect(() => setModels(modelsWithPhotos), [modelsWithPhotos])

  const createNewModel = async () => {
    if (!newModelForm.first_name || !newModelForm.last_name) return
    setCreating(true)
    const { data: model, error } = await supabase.from('models').insert({
      ...newModelForm, reviewed: false, source: 'admin'
    }).select('id, first_name, last_name, agency').single()
    if (model) {
      await addModelToProject(model)
      setNewModelForm({ first_name: '', last_name: '', agency: '', email: '', phone: '', instagram_handle: '' })
      setShowNewModel(false)
    }
    setCreating(false)
  }

  const searchToAdd = async (q: string) => {
    setAddSearch(q)
    if (q.length < 2) { setAddResults([]); return }
    setAddLoading(true)
    const res = await fetch('/api/model-search?q=' + encodeURIComponent(q))
    const data = await res.json()
    // Filter out models already in project
    const existing = new Set(models.map((m: any) => m.models?.id))
    setAddResults((data || []).filter((m: any) => !existing.has(m.id)))
    setAddLoading(false)
  }

  const addModelToProject = async (model: any) => {
    // Add to project_models
    await supabase.from('project_models').upsert({ project_id: projectId, model_id: model.id }, { onConflict: 'project_id,model_id' })
    // Add to presentation if exists
    if (mainPres?.id) {
      const { data: existing } = await supabase.from('presentation_models').select('id').eq('presentation_id', mainPres.id).eq('model_id', model.id).single()
      if (!existing) {
        const { data: last } = await supabase.from('presentation_models').select('display_order').eq('presentation_id', mainPres.id).order('display_order', { ascending: false }).limit(1).single()
        await supabase.from('presentation_models').insert({ presentation_id: mainPres.id, model_id: model.id, display_order: (last?.display_order ?? -1) + 1, show_sizing: true, show_instagram: true, show_portfolio: true, is_visible: true })
      }
    }
    // Add to local state
    setModels(prev => [...prev, { id: model.id, models: model, photo: null }])
    setAddSearch('')
    setAddResults([])
  }

  const removeFromProject = async (modelId: string, modelName: string) => {
    if (!confirm(`Remove ${modelName} from this project? They will still be in the models database.`)) return
    await supabase.from('presentation_models').delete()
      .eq('model_id', modelId)
      .in('presentation_id', mainPres?.id ? [mainPres.id] : [])
    await supabase.from('project_models').delete()
      .eq('project_id', projectId).eq('model_id', modelId)
    setModels(prev => prev.filter(pm => pm.models?.id !== modelId))
    setPresModelIds(prev => { const s = new Set(prev); s.delete(modelId); return s })
  }

  // Sort: confirmed → shortlisted → other
  // ------ UI ------
  const sorted = [...models].sort((a, b) => {
    const as = STATUS_ORDER[shortlistStatus[a.models?.id] || 'none']
    const bs = STATUS_ORDER[shortlistStatus[b.models?.id] || 'none']
    return as - bs
  })

  // Group for list view
  const confirmed = sorted.filter(pm => adminConfirmed[pm.models?.id])
  const pending = sorted.filter(pm => !adminConfirmed[pm.models?.id] && shortlistStatus[pm.models?.id] === 'pending_confirmation')
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
              {/* Admin action: only officially confirm */}
              {adminConfirmed[mid] ? (
                <span className="text-[8px] tracking-widest uppercase px-1.5 py-0.5 bg-green-600 text-white">✓ Confirmed</span>
              ) : status === 'pending_confirmation' ? (
                <>
                  <span className={`text-[8px] tracking-widest uppercase px-1.5 py-0.5 ${STATUS_COLOR['pending_confirmation']}`}>Confirmation Requested</span>
                  <button onClick={() => officialConfirm(mid)}
                    className="text-[8px] tracking-widest uppercase px-2 py-0.5 border border-green-500 text-green-600 hover:bg-green-600 hover:text-white transition-colors">
                    ✓ Officially Confirm
                  </button>
                </>
              ) : status ? (
                <span className={`text-[8px] tracking-widest uppercase px-1.5 py-0.5 ${STATUS_COLOR[status] || 'bg-neutral-100 text-neutral-500'}`}>{STATUS_LABEL[status]}</span>
              ) : null}
            </div>
            {model?.agency && <p className="text-[10px] text-neutral-400">{model?.agency}</p>}
          </div>
          <button onClick={() => setExpanded(!expanded)} className="text-[10px] text-neutral-300 hover:text-black transition-colors px-2">
            {expanded ? '▲' : '▼'}
          </button>
          <Link href={`/admin/models/${mid}`} className="text-[10px] text-neutral-300 hover:text-black transition-colors">→</Link>
          <button onClick={() => removeFromProject(mid, `${model?.first_name} ${model?.last_name}`)}
            title="Remove from project"
            className="text-[10px] text-neutral-200 hover:text-red-500 transition-colors flex-shrink-0">✕</button>
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
              <SectionField
                modelId={mid}
                presModelId={presModels[mid]?.id}
                categoryId={presModelCategories[mid] || null}
                categories={categories}
                presModelIds={presModelIds}
                onCategoryChange={(catId: string | null) => setPresModelCategories(prev => ({...prev, [mid]: catId}))}
                onCategoryCreated={async () => {
                  if (!mainPres?.id) return
                  const { data: cats } = await supabase.from('presentation_categories').select('id, name').eq('presentation_id', mainPres.id).order('display_order')
                  setCategories(cats || [])
                }}
                presentationId={mainPres?.id}
                supabase={supabase}
              />
            </div>
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
          <div className="flex items-start justify-between gap-1">
            <p className="text-xs font-medium truncate flex-1">{model?.first_name} {model?.last_name}</p>
            <button onClick={() => removeFromProject(mid, `${model?.first_name} ${model?.last_name}`)}
              title="Remove from project"
              className="text-neutral-200 hover:text-red-500 transition-colors flex-shrink-0 text-sm leading-none mt-0.5">✕</button>
          </div>
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

  const renderGroup = (group: any[], label?: string, color?: string) => {
    if (!group.length) return null
    const barColor = color || 'bg-neutral-200'
    const textColor = color ? 'text-white' : 'text-neutral-600'
    return (
      <div className="mb-5">
        {label && (
          <div className={`flex items-center gap-2 mb-2 px-2 py-1.5 ${barColor}`}>
            <p className={`text-[10px] tracking-widest uppercase font-semibold ${textColor}`}>{label}</p>
            <span className={`text-[10px] font-bold ${textColor} opacity-70`}>{group.length}</span>
          </div>
        )}
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
      {/* New model modal */}
      {showNewModel && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-6">
            <h3 className="text-sm tracking-widest uppercase font-medium mb-4">New Model</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-1">First Name *</p>
                <input value={newModelForm.first_name} onChange={e => setNewModelForm(p => ({...p, first_name: e.target.value}))}
                  className="w-full border-b border-neutral-300 py-1.5 text-sm focus:outline-none focus:border-black" autoFocus />
              </div>
              <div>
                <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-1">Last Name *</p>
                <input value={newModelForm.last_name} onChange={e => setNewModelForm(p => ({...p, last_name: e.target.value}))}
                  className="w-full border-b border-neutral-300 py-1.5 text-sm focus:outline-none focus:border-black" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-1">Agency</p>
                <input value={newModelForm.agency} onChange={e => setNewModelForm(p => ({...p, agency: e.target.value}))}
                  className="w-full border-b border-neutral-300 py-1.5 text-sm focus:outline-none focus:border-black" />
              </div>
              <div>
                <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-1">Instagram</p>
                <input value={newModelForm.instagram_handle} onChange={e => setNewModelForm(p => ({...p, instagram_handle: e.target.value}))}
                  placeholder="@handle" className="w-full border-b border-neutral-300 py-1.5 text-sm focus:outline-none focus:border-black" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div>
                <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-1">Email</p>
                <input type="email" value={newModelForm.email} onChange={e => setNewModelForm(p => ({...p, email: e.target.value}))}
                  className="w-full border-b border-neutral-300 py-1.5 text-sm focus:outline-none focus:border-black" />
              </div>
              <div>
                <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-1">Phone</p>
                <input value={newModelForm.phone} onChange={e => setNewModelForm(p => ({...p, phone: e.target.value}))}
                  className="w-full border-b border-neutral-300 py-1.5 text-sm focus:outline-none focus:border-black" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={createNewModel} disabled={creating || !newModelForm.first_name || !newModelForm.last_name}
                className="flex-1 py-2.5 text-xs tracking-widest uppercase bg-black text-white hover:bg-neutral-800 disabled:opacity-40 transition-colors">
                {creating ? 'Creating...' : 'Create & Add to Project'}
              </button>
              <button onClick={() => setShowNewModel(false)}
                className="px-4 py-2.5 text-xs tracking-widest uppercase border border-neutral-300 hover:border-black transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add model search */}
      <div className="relative mb-4">
        <input
          value={addSearch}
          onChange={e => searchToAdd(e.target.value)}
          placeholder="Search database to add a model..."
          className="w-full border border-neutral-200 px-3 py-2 text-xs focus:outline-none focus:border-black placeholder:text-neutral-400"
        />
        <button onClick={() => setShowNewModel(true)}
          className="absolute right-2 top-1 text-[10px] tracking-widest uppercase border border-neutral-300 px-2 py-1 hover:border-black transition-colors bg-white">
          + New
        </button>
        {addResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-20 bg-white border border-neutral-200 border-t-0 shadow-lg max-h-48 overflow-y-auto">
            {addResults.map(m => (
              <button key={m.id} onClick={() => addModelToProject(m)}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-neutral-50 text-left border-b border-neutral-100 last:border-0">
                <div>
                  <p className="text-xs font-medium">{m.first_name} {m.last_name}</p>
                  {m.agency && <p className="text-[10px] text-neutral-400">{m.agency}</p>}
                </div>
                <span className="text-[10px] tracking-widest uppercase text-neutral-400">+ Add</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between mb-4">
        <p className="label">Models Signed In ({modelsWithPhotos.length})</p>
        <div className="flex items-center gap-2">
          {mainPres && (
            <button onClick={addAllToPresentation}
              className="text-[10px] tracking-widest uppercase border border-neutral-300 px-2 py-1 hover:border-black transition-colors">
              Add All to Presentation
            </button>
          )}
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
              {renderGroup(confirmed, 'Officially Confirmed ✓', 'bg-green-600')}
              {renderGroup(pending, 'Confirmation Requested', 'bg-amber-400')}
              {renderGroup(shortlisted, 'Shortlisted by Client', 'bg-neutral-700')}
              {renderGroup(others, others.length && hasGroups ? 'Signed In' : undefined)}
            </>
          ) : renderGroup(sorted)}
        </>
      )}
    </div>
  )
}
