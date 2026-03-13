'use client'
import { useState } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, X, Eye, EyeOff } from 'lucide-react'

interface PresentationModel {
  id: string
  model_id: string
  display_order: number
  show_sizing: boolean
  show_instagram: boolean
  show_portfolio: boolean
  admin_notes: string
  location: string
  rate: string
  option: string
  client_notes: string
  is_visible: boolean
  models: { first_name: string; last_name: string; agency: string; model_media?: { url: string; display_order: number }[] }
}

interface Props {
  items: PresentationModel[]
  onChange: (items: PresentationModel[]) => void
  onRemove: (id: string) => void
  onFieldChange: (id: string, field: keyof PresentationModel, value: any) => void
  onToggleVisible: (id: string, visible: boolean) => void
  onSaveModel?: (id: string) => Promise<void>
  categories?: { id: string; name: string }[]
  onCategoryChange?: (pmId: string, categoryId: string | null) => void
  onCreateCategory?: (name: string) => Promise<void>
}


function SectionPicker({ categoryId, categories, onCategoryChange, onCreateCategory }: {
  categoryId: string | null
  categories: { id: string; name: string }[]
  onCategoryChange: (catId: string | null) => void
  onCreateCategory?: (name: string) => Promise<void>
}) {
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !onCreateCategory) return
    await onCreateCategory(newName.trim())
    setNewName('')
    setCreating(false)
  }

  return (
    <div className="mt-2 mb-1">
      <label className="text-[10px] tracking-wider uppercase text-neutral-400 block mb-0.5">Section</label>
      {creating ? (
        <form onSubmit={handleCreate} className="flex gap-2 items-center">
          <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="Section name..." 
            className="flex-1 border-b border-neutral-300 bg-transparent py-1 text-xs focus:outline-none focus:border-black placeholder:text-neutral-300" />
          <button type="submit" className="text-[10px] tracking-widest uppercase text-black hover:opacity-60">Add</button>
          <button type="button" onClick={() => setCreating(false)} className="text-[10px] tracking-widest uppercase text-neutral-400 hover:text-black">Cancel</button>
        </form>
      ) : (
        <div className="flex gap-2 items-center">
          <select
            value={categoryId || ''}
            onChange={e => onCategoryChange(e.target.value || null)}
            className="flex-1 border-b border-neutral-200 bg-transparent py-1 text-xs focus:outline-none focus:border-black text-neutral-700">
            <option value="">— No section —</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {onCreateCategory && (
            <button type="button" onClick={() => setCreating(true)}
              className="text-[10px] tracking-widest uppercase text-neutral-400 hover:text-black whitespace-nowrap">
              + Create
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function SortableItem({ item, onRemove, onFieldChange, onToggleVisible, onSaveModel, categories, onCategoryChange, onCreateCategory }: {
  item: PresentationModel
  onRemove: (id: string) => void
  onFieldChange: (id: string, field: keyof PresentationModel, value: any) => void
  onToggleVisible: (id: string, visible: boolean) => void
  onSaveModel?: (id: string) => Promise<void>
  categories?: { id: string; name: string }[]
  onCategoryChange?: (pmId: string, categoryId: string | null) => void
  onCreateCategory?: (name: string) => Promise<void>
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const inp = 'w-full border-b border-neutral-200 bg-transparent py-1 text-xs focus:outline-none focus:border-black resize-none placeholder:text-neutral-300'
  const hidden = !item.is_visible
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    if (!onSaveModel) return
    setSaving(true)
    await onSaveModel(item.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div ref={setNodeRef} style={style} className={`border p-4 transition-colors ${hidden ? 'border-neutral-100 bg-neutral-50 opacity-60' : 'border-neutral-200 bg-white'}`}>
      <div className="flex items-start gap-3">
        <button {...attributes} {...listeners} className="mt-1 text-neutral-300 hover:text-neutral-600 cursor-grab active:cursor-grabbing">
          <GripVertical size={16} />
        </button>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {(() => {
                const sorted = [...(item.models.model_media || [])].filter((m: any) => m.is_visible !== false).sort((a: any, b: any) => a.display_order - b.display_order)
                const photo = sorted[0]?.public_url
                return photo
                  ? <img src={photo} className={`w-10 h-12 object-cover object-top flex-shrink-0 ${hidden ? 'grayscale' : ''}`} alt="" />
                  : <div className="w-10 h-12 bg-neutral-100 flex-shrink-0" />
              })()}
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{item.models.first_name} {item.models.last_name}</p>
                  {hidden && <span className="text-[9px] tracking-widest uppercase bg-neutral-200 text-neutral-500 px-1.5 py-0.5">Hidden</span>}
                </div>
                {item.models.agency && <p className="text-xs text-neutral-400">{item.models.agency}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Visibility toggle — auto-saves immediately */}
              <button
                onClick={() => onToggleVisible(item.id, !item.is_visible)}
                title={hidden ? 'Show on client presentation' : 'Hide from client (keep on back end)'}
                className={`flex items-center gap-1 px-2 py-1 text-[10px] tracking-widest uppercase border transition-colors ${hidden ? 'border-neutral-300 text-neutral-400 hover:border-black hover:text-black' : 'border-black text-black hover:bg-neutral-100'}`}>
                {hidden ? <><EyeOff size={11} /> Show</> : <><Eye size={11} /> Visible</>}
              </button>
              <button onClick={() => onRemove(item.id)} title="Remove from presentation entirely" className="text-neutral-300 hover:text-red-500 ml-1"><X size={14} /></button>
            </div>
          </div>

          {/* Visibility toggles */}
          <div className="flex gap-3 mb-4">
            {(['show_sizing', 'show_instagram', 'show_portfolio'] as const).map(field => (
              <label key={field} className="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={item[field] as boolean} onChange={e => onFieldChange(item.id, field, e.target.checked)} className="w-3 h-3" />
                <span className="text-[10px] tracking-wider uppercase text-neutral-500">{field.replace('show_', '')}</span>
              </label>
            ))}
          </div>

          {/* Section assignment */}
          {onCategoryChange && (
            <SectionPicker
              categoryId={(item as any).category_id || null}
              categories={categories || []}
              onCategoryChange={(catId) => onCategoryChange(item.id, catId)}
              onCreateCategory={onCreateCategory}
            />
          )}

          {/* Client-visible notes */}
          <div className="space-y-2 border-t border-neutral-100 pt-3">
            <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-2">Client Notes (visible on slides)</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] tracking-wider uppercase text-neutral-400 block mb-0.5">Location</label>
                <input value={item.location || ''} onChange={e => onFieldChange(item.id, 'location', e.target.value)}
                  placeholder="e.g. Bangkok, NYC" className={inp} />
              </div>
              <div>
                <label className="text-[10px] tracking-wider uppercase text-neutral-400 block mb-0.5">Rate</label>
                <input value={item.rate || ''} onChange={e => onFieldChange(item.id, 'rate', e.target.value)}
                  placeholder="e.g. $5,000/day" className={inp} />
              </div>
              <div>
                <label className="text-[10px] tracking-wider uppercase text-neutral-400 block mb-0.5">Option</label>
                <input value={item.option || ''} onChange={e => onFieldChange(item.id, 'option', e.target.value)}
                  placeholder="e.g. Option A" className={inp} />
              </div>
            </div>
            <div>
              <label className="text-[10px] tracking-wider uppercase text-neutral-400 block mb-0.5">Notes</label>
              <textarea value={item.client_notes || ''} onChange={e => onFieldChange(item.id, 'client_notes', e.target.value)}
                placeholder="Notes visible to client on slides..." rows={2} className={inp} />
            </div>
          </div>

          {/* Private admin notes */}
          <div className="mt-3 pt-3 border-t border-neutral-100">
            <label className="text-[10px] tracking-wider uppercase text-neutral-400 block mb-0.5">Private Admin Notes (not shown to client)</label>
            <textarea value={item.admin_notes || ''} onChange={e => onFieldChange(item.id, 'admin_notes', e.target.value)}
              placeholder="Internal notes only..." rows={2} className={inp} />
          </div>

          {/* Save button */}
          {onSaveModel && (
            <div className="mt-4 pt-3 border-t border-neutral-100 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className={`text-[10px] tracking-widest uppercase px-4 py-2 transition-colors ${saved ? 'bg-neutral-100 text-neutral-500' : 'bg-black text-white hover:bg-neutral-800'} disabled:opacity-50`}
              >
                {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function SortableModelList({ items, onChange, onRemove, onFieldChange, onToggleVisible, onSaveModel, categories, onCategoryChange, onCreateCategory }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(i => i.id === active.id)
      const newIndex = items.findIndex(i => i.id === over.id)
      onChange(arrayMove(items, oldIndex, newIndex))
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map(item => (
            <SortableItem key={item.id} item={item} onRemove={onRemove} onFieldChange={onFieldChange} onToggleVisible={onToggleVisible} onSaveModel={onSaveModel} categories={categories} onCategoryChange={onCategoryChange} onCreateCategory={onCreateCategory} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
