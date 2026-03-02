'use client'
import { useState, useEffect, useCallback, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { SortableModelList } from '@/components/SortableModelList'
import Link from 'next/link'
import { Copy, ExternalLink } from 'lucide-react'

export default function PresentationBuilder({ params }: { params: { id: string } }) {
  const { id } = params
  const supabase = createClient()
  const [presentation, setPresentation] = useState<any>(null)
  const [presentationModels, setPresentationModels] = useState<any[]>([])
  const [availableModels, setAvailableModels] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    const { data: pres } = await supabase.from('presentations').select('*, projects(id, name)').eq('id', id).single()
    setPresentation(pres)

    const { data: pm } = await supabase
      .from('presentation_models')
      .select('*, models(first_name, last_name, agency)')
      .eq('presentation_id', id)
      .order('display_order')
    setPresentationModels(pm || [])

    if (pres?.projects) {
      const { data: projectModels } = await supabase
        .from('project_models')
        .select('models(id, first_name, last_name, agency)')
        .eq('project_id', (pres.projects as any).id)
      const alreadyIn = new Set((pm || []).map((m: any) => m.model_id))
      const available = (projectModels || [])
        .map((pm: any) => pm.models)
        .filter((m: any) => !alreadyIn.has(m.id))
      setAvailableModels(available)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const addModel = async (model: any) => {
    const maxOrder = Math.max(0, ...presentationModels.map(m => m.display_order))
    await supabase.from('presentation_models').insert({
      presentation_id: id,
      model_id: model.id,
      display_order: maxOrder + 1,
    })
    load()
  }

  const removeModel = async (pmId: string) => {
    await supabase.from('presentation_models').delete().eq('id', pmId)
    load()
  }

  const onFieldChange = (pmId: string, field: string, value: any) => {
    setPresentationModels(prev => prev.map(m => m.id === pmId ? { ...m, [field]: value } : m))
  }

  const save = async () => {
    setSaving(true)
    for (let i = 0; i < presentationModels.length; i++) {
      const m = presentationModels[i]
      await supabase.from('presentation_models').update({
        display_order: i,
        show_sizing: m.show_sizing,
        show_instagram: m.show_instagram,
        show_portfolio: m.show_portfolio,
        admin_notes: m.admin_notes,
        location: m.location || null,
        rate: m.rate || null,
        client_notes: m.client_notes || null,
        location: m.location || '',
        rate: m.rate || '',
        client_notes: m.client_notes || '',
        is_visible: m.is_visible,
      }).eq('id', m.id)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const togglePublish = async () => {
    const newVal = !presentation?.is_published
    await supabase.from('presentations').update({ is_published: newVal }).eq('id', id)
    setPresentation({ ...presentation, is_published: newVal })
  }

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/client/presentations/${id}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!presentation) return <div className="flex items-center justify-center h-64"><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <div>
          <Link href="/admin/presentations" className="label hover:text-black">← Presentations</Link>
          <h1 className="text-2xl font-light tracking-widest uppercase mt-2">{presentation.name}</h1>
          <p className="text-sm text-neutral-400">{(presentation.projects as any)?.name}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={togglePublish} className={`text-xs px-4 py-3 border tracking-widest uppercase transition-colors ${presentation.is_published ? 'bg-black text-white border-black' : 'border-neutral-300 hover:border-black'}`}>
            {presentation.is_published ? 'Published' : 'Publish'}
          </button>
          <Button variant="secondary" size="sm" onClick={copyLink}>
            {copied ? '✓ Copied' : <><Copy size={12} className="mr-1" />Copy Link</>}
          </Button>
          <Link href={`/client/presentations/${id}`} target="_blank">
            <Button variant="ghost" size="sm"><ExternalLink size={12} className="mr-1" />Preview</Button>
          </Link>
          <Button onClick={save} disabled={saving} size="sm">
            {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Add models panel */}
        <div>
          <p className="label mb-4">Add Models</p>
          {availableModels.length === 0 && <p className="text-xs text-neutral-400">All project models added.</p>}
          <div className="space-y-2">
            {availableModels.map(m => (
              <div key={m.id} className="flex items-center justify-between border border-neutral-100 px-3 py-2">
                <div>
                  <p className="text-xs font-medium">{m.first_name} {m.last_name}</p>
                  {m.agency && <p className="text-[10px] text-neutral-400">{m.agency}</p>}
                </div>
                <button onClick={() => addModel(m)} className="text-[10px] tracking-wider uppercase underline text-neutral-500 hover:text-black">Add</button>
              </div>
            ))}
          </div>
        </div>

        {/* Sortable list */}
        <div className="col-span-2">
          <p className="label mb-4">Presentation Order ({presentationModels.length} models)</p>
          {presentationModels.length === 0 && (
            <div className="border border-dashed border-neutral-200 p-8 text-center text-sm text-neutral-400">
              Add models from the left panel.
            </div>
          )}
          <SortableModelList
            items={presentationModels}
            onChange={setPresentationModels}
            onRemove={removeModel}
            onFieldChange={onFieldChange}
          />
        </div>
      </div>
    </div>
  )
}
