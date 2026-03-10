'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { SortableModelList } from '@/components/SortableModelList'
import { Copy, ExternalLink, Plus, Trash2, GripVertical } from 'lucide-react'

interface Props {
  projectId: string
  presentationId: string | null
  isPublished: boolean
}

export function ProjectPresentationTab({ projectId, presentationId: initialPresId, isPublished: initialPublished }: Props) {
  const supabase = createClient()
  const [presId, setPresId] = useState<string | null>(initialPresId)
  const [presentationModels, setPresentationModels] = useState<any[]>([])
  const [availableModels, setAvailableModels] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [newCatName, setNewCatName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [creating, setCreating] = useState(false)
  const [modelSearch, setModelSearch] = useState('')

  const load = useCallback(async () => {
    if (!presId) return
    const [{ data: pm }, { data: cats }] = await Promise.all([
      supabase.from('presentation_models').select('*, models(first_name, last_name, agency, model_media(public_url, display_order, is_visible))').eq('presentation_id', presId).order('display_order'),
      supabase.from('presentation_categories').select('*').eq('presentation_id', presId).order('display_order'),
    ])
    setPresentationModels(pm || [])
    setCategories(cats || [])
    const alreadyIn = new Set((pm || []).map((m: any) => m.model_id))
    // Load ALL models for the add-model picker (search across full DB)
    const { data: allModels } = await supabase
      .from('models')
      .select('id, first_name, last_name, agency, model_media(public_url, display_order, is_visible)')
      .order('last_name')
    setAvailableModels((allModels || []).filter((m: any) => !alreadyIn.has(m.id)))
  }, [presId, projectId])

  useEffect(() => { load() }, [load])

  // Auto-refresh every 30s to pick up new sign-ins
  useEffect(() => {
    const interval = setInterval(load, 30_000)
    return () => clearInterval(interval)
  }, [load])

  const createPresentation = async () => {
    setCreating(true)
    const { data: project } = await supabase.from('projects').select('name').eq('id', projectId).single()
    const { data: pres } = await supabase.from('presentations').insert({
      project_id: projectId,
      name: `${project?.name || 'Project'} Presentation`,
      is_published: false,
    }).select().single()
    if (pres) {
      setPresId(pres.id)
      // Fetch confirmed state so is_visible reflects admin_confirmed from the start
      const { data: projectModels } = await supabase
        .from('project_models').select('model_id, admin_confirmed').eq('project_id', projectId)
      if (projectModels?.length) {
        await supabase.from('presentation_models').insert(
          projectModels.map((pm: any, i: number) => ({
            presentation_id: pres.id,
            model_id: pm.model_id,
            display_order: i,
            is_visible: true,
          }))
        )
      }
      load()
    }
    setCreating(false)
  }

  const addModel = async (model: any) => {
    if (!presId) return
    const maxOrder = Math.max(0, ...presentationModels.map(m => m.display_order))
    // Check if model is confirmed in project before making visible
    const { data: pm } = await supabase
      .from('project_models').select('admin_confirmed').eq('project_id', projectId).eq('model_id', model.id).single()
    await supabase.from('presentation_models').insert({
      presentation_id: presId, model_id: model.id, display_order: maxOrder + 1,
      is_visible: true,
    })
    load()
  }

  const removeModel = async (pmId: string) => {
    const pm = presentationModels.find(m => m.id === pmId)
    if (!pm) return
    // Delete both presentation_models and orphaned client_shortlists
    await Promise.all([
      supabase.from('presentation_models').delete().eq('id', pmId),
      supabase.from('client_shortlists').delete().eq('presentation_id', pm.presentation_id).eq('model_id', pm.model_id),
    ])
    load()
  }

  const onFieldChange = (pmId: string, field: string, value: any) => {
    setPresentationModels(prev => prev.map(m => m.id === pmId ? { ...m, [field]: value } : m))
  }

  const toggleVisible = async (pmId: string, visible: boolean) => {
    // Optimistic update + auto-save immediately — no Save button needed
    setPresentationModels(prev => prev.map(m => m.id === pmId ? { ...m, is_visible: visible } : m))
    await supabase.from('presentation_models').update({ is_visible: visible }).eq('id', pmId)
  }

  const assignCategory = async (pmId: string, categoryId: string | null) => {
    await supabase.from('presentation_models').update({ category_id: categoryId || null }).eq('id', pmId)
    setPresentationModels(prev => prev.map(m => m.id === pmId ? { ...m, category_id: categoryId } : m))
  }

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!presId || !newCatName.trim()) return
    const maxOrder = Math.max(-1, ...categories.map(c => c.display_order))
    await supabase.from('presentation_categories').insert({ presentation_id: presId, name: newCatName.trim(), display_order: maxOrder + 1 })
    setNewCatName('')
    load()
  }

  const addCategoryByName = async (name: string) => {
    if (!presId || !name.trim()) return
    const maxOrder = Math.max(-1, ...categories.map(c => c.display_order))
    await supabase.from('presentation_categories').insert({ presentation_id: presId, name: name.trim(), display_order: maxOrder + 1 })
    await load()
  }

  const deleteCategory = async (catId: string) => {
    await supabase.from('presentation_models').update({ category_id: null }).eq('category_id', catId)
    await supabase.from('presentation_categories').delete().eq('id', catId)
    load()
  }

  const moveCategoryUp = async (index: number) => {
    if (index === 0) return
    const updated = [...categories]
    const [a, b] = [updated[index - 1], updated[index]]
    await supabase.from('presentation_categories').update({ display_order: b.display_order }).eq('id', a.id)
    await supabase.from('presentation_categories').update({ display_order: a.display_order }).eq('id', b.id)
    load()
  }

  const moveCategoryDown = async (index: number) => {
    if (index === categories.length - 1) return
    const updated = [...categories]
    const [a, b] = [updated[index], updated[index + 1]]
    await supabase.from('presentation_categories').update({ display_order: b.display_order }).eq('id', a.id)
    await supabase.from('presentation_categories').update({ display_order: a.display_order }).eq('id', b.id)
    load()
  }

  const save = async () => {
    setSaving(true)
    for (let i = 0; i < presentationModels.length; i++) {
      const m = presentationModels[i]
      await supabase.from('presentation_models').update({
        display_order: i, show_sizing: m.show_sizing, show_instagram: m.show_instagram,
        show_portfolio: m.show_portfolio, admin_notes: m.admin_notes,
        location: m.location || '', rate: m.rate || '', option: m.option || '', client_notes: m.client_notes || '',
        is_visible: m.is_visible, category_id: m.category_id || null,
      }).eq('id', m.id)
    }
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const [emailStatus, setEmailStatus] = useState('')
  const [showEmailPicker, setShowEmailPicker] = useState(false)

  const sendEmail = async (fromEmail: string) => {
    if (!presId) return
    setShowEmailPicker(false); setEmailStatus('Sending...')
    try {
      const res = await fetch('/api/send-presentation-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ presentationId: presId, fromEmail }) })
      const data = await res.json()
      setEmailStatus(data.sent > 0 ? `✓ Email sent to ${data.sent} client${data.sent > 1 ? 's' : ''}` : '⚠ No clients assigned to this project')
    } catch { setEmailStatus('⚠ Email failed') }
    setTimeout(() => setEmailStatus(''), 5000)
  }

  const copyLink = () => {
    if (!presId) return
    navigator.clipboard.writeText(`${window.location.origin}/client/presentations/${presId}`)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  // Group models by category for display — alphabetical within each section
  const alphaSort = (a: any, b: any) => {
    const aName = ((a.models?.first_name || '') + (a.models?.last_name || '')).toLowerCase()
    const bName = ((b.models?.first_name || '') + (b.models?.last_name || '')).toLowerCase()
    return aName.localeCompare(bName)
  }
  const uncategorized = presentationModels.filter(pm => !pm.category_id).sort(alphaSort)
  const byCategory = categories.map(cat => ({
    ...cat,
    models: presentationModels.filter(pm => pm.category_id === cat.id).sort(alphaSort)
  }))

  if (!presId) return (
    <div className="border border-dashed border-neutral-200 p-12 text-center">
      <p className="text-sm text-neutral-400 mb-4">No presentation yet for this project.</p>
      <Button onClick={createPresentation} disabled={creating}>{creating ? 'Creating...' : 'Create Presentation'}</Button>
    </div>
  )

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <p className="text-xs text-neutral-400">
          {presentationModels.filter(m => m.is_visible).length} visible · {presentationModels.filter(m => !m.is_visible).length} hidden · {categories.length} section{categories.length !== 1 ? 's' : ''}
        </p>
        <div className="flex gap-3 items-center flex-wrap">
          {emailStatus && <span className="text-xs text-neutral-500 tracking-wider">{emailStatus}</span>}
          <button onClick={load} title="Refresh"
            className="text-xs px-3 py-3 border tracking-widest uppercase border-neutral-300 hover:border-black transition-colors">
            ↻
          </button>
          <button onClick={() => setShowEmailPicker(true)}
            className="text-xs px-4 py-3 border tracking-widest uppercase border-neutral-300 hover:border-black transition-colors">
            ✉ Notify Clients
          </button>
          <Button variant="secondary" size="sm" onClick={copyLink}>{copied ? '✓ Copied' : <><Copy size={12} className="mr-1" />Copy Link</>}</Button>
          <a href={`/client/presentations/${presId}`} target="_blank"><Button variant="ghost" size="sm"><ExternalLink size={12} className="mr-1" />Preview</Button></a>
          <a href={`/api/pdf/${presId}`} target="_blank"><Button variant="ghost" size="sm">↓ PDF</Button></a>
          <Button onClick={save} disabled={saving} size="sm">{saving ? 'Saving...' : saved ? '✓ Saved' : 'Save'}</Button>
        </div>
      </div>

      {showEmailPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 max-w-sm w-full mx-4">
            <h3 className="text-sm font-medium tracking-widest uppercase mb-6">Send From</h3>
            <div className="space-y-3 mb-8">
              {['tasha@tashatongpreecha.com', 'hi@tashatongpreecha.com'].map(email => (
                <button key={email} onClick={() => sendEmail(email)}
                  className="w-full text-left px-4 py-3 border border-neutral-200 hover:border-black transition-colors text-sm">{email}</button>
              ))}
            </div>
            <button onClick={() => setShowEmailPicker(false)} className="text-xs text-neutral-400 tracking-widest uppercase hover:text-black">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-8">
        {/* Left: Add models + Sections */}
        <div className="space-y-8">
          <div>
            <p className="label mb-2">Add Models</p>
            <input
              value={modelSearch}
              onChange={e => setModelSearch(e.target.value)}
              placeholder="Search name..."
              className="w-full border-b border-neutral-200 bg-transparent py-1.5 text-xs focus:outline-none focus:border-black placeholder:text-neutral-300 mb-2"
            />
            {availableModels.length === 0 && !modelSearch && (
              <p className="text-xs text-neutral-400">All models added.</p>
            )}
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {availableModels
                .filter(m => !modelSearch || `${m.first_name} ${m.last_name} ${m.agency || ''}`.toLowerCase().includes(modelSearch.toLowerCase()))
                .slice(0, 40)
                .map(m => {
                  const photo = [...(m.model_media || [])].filter((x: any) => x.is_visible !== false).sort((a: any, b: any) => a.display_order - b.display_order)[0]?.public_url
                  return (
                    <div key={m.id} className="flex items-center gap-2 border border-neutral-100 px-2 py-1.5 hover:border-neutral-300 transition-colors">
                      {photo
                        ? <img src={photo} className="w-7 h-9 object-cover object-top flex-shrink-0" alt="" />
                        : <div className="w-7 h-9 bg-neutral-100 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{m.first_name} {m.last_name}</p>
                        {m.agency && <p className="text-[10px] text-neutral-400 truncate">{m.agency}</p>}
                      </div>
                      <button onClick={() => addModel(m)} className="text-[10px] tracking-wider uppercase text-neutral-400 hover:text-black flex-shrink-0">+ Add</button>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Sections / Categories */}
          <div>
            <p className="label mb-3">Sections</p>
            <div className="space-y-1.5 mb-3">
              {categories.map((cat, idx) => (
                <div key={cat.id} className="flex items-center justify-between border border-neutral-100 px-3 py-2 group">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{cat.name}</p>
                    <p className="text-[10px] text-neutral-400">{byCategory.find(b => b.id === cat.id)?.models.length || 0} models</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => moveCategoryUp(idx)} disabled={idx === 0}
                      className="text-neutral-300 hover:text-black disabled:opacity-20 transition-colors text-xs px-1">▲</button>
                    <button onClick={() => moveCategoryDown(idx)} disabled={idx === categories.length - 1}
                      className="text-neutral-300 hover:text-black disabled:opacity-20 transition-colors text-xs px-1">▼</button>
                    <button onClick={() => deleteCategory(cat.id)} className="opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-400 transition-all ml-1"><Trash2 size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={addCategory} className="flex gap-2">
              <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="New section..."
                className="flex-1 border-b border-neutral-300 bg-transparent py-1.5 text-xs focus:outline-none focus:border-black placeholder:text-neutral-300" />
              <button type="submit" className="text-neutral-400 hover:text-black transition-colors"><Plus size={14} /></button>
            </form>

            {/* Fill in option space */}
            <div className="mt-6 pt-6 border-t border-neutral-100">
              <p className="label mb-3">Additional Options</p>
              <input
                type="text"
                placeholder="Add option..."
                className="w-full border-b border-neutral-300 bg-transparent py-1.5 text-xs focus:outline-none focus:border-black placeholder:text-neutral-300"
              />
              <p className="text-[10px] text-neutral-400 mt-2">Use this space to fill in any additional presentation options or notes.</p>
            </div>
          </div>
        </div>

        {/* Right: Model list grouped by category */}
        <div className="col-span-3">
          <p className="label mb-4">Presentation Order — assign sections using the dropdown on each model</p>

          {/* Uncategorized */}
          {uncategorized.length > 0 && (
            <div className="mb-6">
              <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-2 pb-1 border-b border-neutral-100">
                Uncategorized ({uncategorized.filter(m => m.is_visible).length} visible{uncategorized.filter(m => !m.is_visible).length > 0 ? `, ${uncategorized.filter(m => !m.is_visible).length} hidden` : ''})
              </p>
              <SortableModelList
                items={uncategorized}
                onChange={(items) => setPresentationModels(prev => [...items, ...prev.filter(m => m.category_id)])}
                onRemove={removeModel}
                onFieldChange={onFieldChange}
                onToggleVisible={toggleVisible}
                categories={categories}
                onCategoryChange={assignCategory}
                onCreateCategory={async (name) => { await addCategoryByName(name) }}
              />
            </div>
          )}

          {byCategory.map(cat => (
            <div key={cat.id} className="mb-6">
              <p className="text-[10px] tracking-widest uppercase font-medium mb-2 pb-1 border-b border-black">
                {cat.name} ({cat.models.filter((m: any) => m.is_visible).length} visible{cat.models.filter((m: any) => !m.is_visible).length > 0 ? `, ${cat.models.filter((m: any) => !m.is_visible).length} hidden` : ''})
              </p>
              {cat.models.length === 0 && <p className="text-xs text-neutral-300 py-2">No models in this section yet.</p>}
              <SortableModelList
                items={cat.models}
                onChange={(items) => setPresentationModels(prev => [...prev.filter(m => m.category_id !== cat.id), ...items])}
                onRemove={removeModel}
                onFieldChange={onFieldChange}
                onToggleVisible={toggleVisible}
                categories={categories}
                onCategoryChange={assignCategory}
                onCreateCategory={async (name) => { await addCategoryByName(name) }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
