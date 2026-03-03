'use client'
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
  client_notes: string
  is_visible: boolean
  models: { first_name: string; last_name: string; agency: string }
}

interface Props {
  items: PresentationModel[]
  onChange: (items: PresentationModel[]) => void
  onRemove: (id: string) => void
  onFieldChange: (id: string, field: keyof PresentationModel, value: any) => void
  categories?: { id: string; name: string }[]
  onCategoryChange?: (pmId: string, categoryId: string | null) => void
}

function SortableItem({ item, onRemove, onFieldChange, categories, onCategoryChange }: {
  item: PresentationModel
  onRemove: (id: string) => void
  onFieldChange: (id: string, field: keyof PresentationModel, value: any) => void
  categories?: { id: string; name: string }[]
  onCategoryChange?: (pmId: string, categoryId: string | null) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const inp = 'w-full border-b border-neutral-200 bg-transparent py-1 text-xs focus:outline-none focus:border-black resize-none placeholder:text-neutral-300'

  return (
    <div ref={setNodeRef} style={style} className="border border-neutral-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <button {...attributes} {...listeners} className="mt-1 text-neutral-300 hover:text-neutral-600 cursor-grab active:cursor-grabbing">
          <GripVertical size={16} />
        </button>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium">{item.models.first_name} {item.models.last_name}</p>
              {item.models.agency && <p className="text-xs text-neutral-400">{item.models.agency}</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => onFieldChange(item.id, 'is_visible', !item.is_visible)} className={item.is_visible ? 'text-black' : 'text-neutral-300'}>
                {item.is_visible ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
              <button onClick={() => onRemove(item.id)} className="text-neutral-300 hover:text-red-500"><X size={14} /></button>
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
          {categories && categories.length > 0 && onCategoryChange && (
            <div className="mt-2 mb-1">
              <label className="text-[10px] tracking-wider uppercase text-neutral-400 block mb-0.5">Section</label>
              <select
                value={(item as any).category_id || ''}
                onChange={e => onCategoryChange(item.id, e.target.value || null)}
                className="w-full border-b border-neutral-200 bg-transparent py-1 text-xs focus:outline-none focus:border-black text-neutral-700">
                <option value="">— No section —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          {/* Client-visible notes */}
          <div className="space-y-2 border-t border-neutral-100 pt-3">
            <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-2">Client Notes (visible on slides)</p>
            <div className="grid grid-cols-2 gap-2">
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
        </div>
      </div>
    </div>
  )
}

export function SortableModelList({ items, onChange, onRemove, onFieldChange, categories, onCategoryChange }: Props) {
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
            <SortableItem key={item.id} item={item} onRemove={onRemove} onFieldChange={onFieldChange} categories={categories} onCategoryChange={onCategoryChange} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
