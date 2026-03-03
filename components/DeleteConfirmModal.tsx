'use client'
import { useState } from 'react'
import { X } from 'lucide-react'

interface Props {
  title: string
  description?: string
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirmModal({ title, description, onConfirm, onCancel }: Props) {
  const [typed, setTyped] = useState('')
  const ready = typed === 'DELETE'

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white max-w-sm w-full p-8">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-sm font-medium tracking-widest uppercase">Confirm Delete</h3>
          <button onClick={onCancel}><X size={14} className="text-neutral-400 hover:text-black" /></button>
        </div>
        <p className="text-sm text-neutral-600 mb-1">{title}</p>
        {description && <p className="text-xs text-neutral-400 mb-6">{description}</p>}
        <div className="border border-red-100 bg-red-50 p-3 mb-6">
          <p className="text-xs text-red-600">This action cannot be undone.</p>
        </div>
        <label className="label text-[10px] block mb-2">Type <strong>DELETE</strong> to confirm</label>
        <input
          value={typed}
          onChange={e => setTyped(e.target.value)}
          placeholder="DELETE"
          autoFocus
          className="w-full border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none focus:border-black mb-6 tracking-widest"
        />
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={!ready}
            className={`flex-1 py-2.5 text-xs tracking-widest uppercase transition-colors ${ready ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-neutral-100 text-neutral-300 cursor-not-allowed'}`}>
            Delete
          </button>
          <button onClick={onCancel}
            className="flex-1 border border-neutral-300 py-2.5 text-xs tracking-widest uppercase hover:border-black transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
