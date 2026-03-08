'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RotateCcw, Trash2, Search, AlertCircle } from 'lucide-react'

export default function TrashPage() {
  const supabase = createClient()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState({ totalDeleted: 0, totalModels: 0, percentageDeleted: '0' })
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const loadTrash = useCallback(async () => {
    setLoading(true)
    
    // Get stats
    const statsRes = await fetch('/api/admin/trash/stats')
    const statsData = await statsRes.json()
    setStats(statsData)

    // Get trash items
    let url = `/api/admin/trash?limit=100`
    if (search) url += `&search=${encodeURIComponent(search)}`

    const res = await fetch(url)
    const data = await res.json()
    setItems(data.items || [])
    setLoading(false)
  }, [search])

  useEffect(() => {
    const timer = setTimeout(loadTrash, 300)
    return () => clearTimeout(timer)
  }, [loadTrash])

  const restore = async (id: string) => {
    await fetch('/api/admin/trash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    loadTrash()
  }

  const permanentlyDelete = async (id: string) => {
    if (!confirm('⚠️ This will permanently delete this model and all its media. This cannot be undone.')) return
    
    await fetch(`/api/admin/trash/${id}`, { method: 'DELETE' })
    loadTrash()
  }

  const bulkRestore = async () => {
    for (const id of selected) {
      await restore(id)
    }
    setSelected(new Set())
  }

  const bulkDelete = async () => {
    if (!confirm(`⚠️ Permanently delete ${selected.size} items? This cannot be undone.`)) return
    
    for (const id of selected) {
      await permanentlyDelete(id)
    }
    setSelected(new Set())
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-wider uppercase mb-2">Trash</h1>
        <p className="text-neutral-500">Items here are recoverable for 30 days, then permanently deleted.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-neutral-50 p-4 rounded">
          <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Deleted Items</p>
          <p className="text-2xl font-bold">{stats.totalDeleted}</p>
        </div>
        <div className="bg-neutral-50 p-4 rounded">
          <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Total Models</p>
          <p className="text-2xl font-bold">{stats.totalModels}</p>
        </div>
        <div className="bg-neutral-50 p-4 rounded">
          <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Percentage</p>
          <p className="text-2xl font-bold">{stats.percentageDeleted}%</p>
        </div>
      </div>

      {/* Search & Actions */}
      <div className="flex gap-4 mb-8 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search deleted models..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded text-sm"
          />
        </div>

        {selected.size > 0 && (
          <>
            <button
              onClick={bulkRestore}
              className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded hover:bg-green-100 text-sm font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              Restore {selected.size}
            </button>
            <button
              onClick={bulkDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded hover:bg-red-100 text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
              Delete {selected.size}
            </button>
          </>
        )}
      </div>

      {/* Trash List */}
      {loading ? (
        <div className="text-center py-8 text-neutral-400">Loading trash...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-neutral-400">No deleted items</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selected.size === items.length && items.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelected(new Set(items.map((i: any) => i.id)))
                      } else {
                        setSelected(new Set())
                      }
                    }}
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium uppercase tracking-wide text-xs text-neutral-600">Name</th>
                <th className="px-4 py-3 text-left font-medium uppercase tracking-wide text-xs text-neutral-600">Email</th>
                <th className="px-4 py-3 text-left font-medium uppercase tracking-wide text-xs text-neutral-600">Deleted</th>
                <th className="px-4 py-3 text-left font-medium uppercase tracking-wide text-xs text-neutral-600">Days Left</th>
                <th className="px-4 py-3 text-right font-medium uppercase tracking-wide text-xs text-neutral-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any) => (
                <tr key={item.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={(e) => {
                        const newSelected = new Set(selected)
                        if (e.target.checked) {
                          newSelected.add(item.id)
                        } else {
                          newSelected.delete(item.id)
                        }
                        setSelected(newSelected)
                      }}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium">{item.first_name} {item.last_name}</td>
                  <td className="px-4 py-3 text-neutral-600">{item.email || '—'}</td>
                  <td className="px-4 py-3 text-neutral-600">{new Date(item.deleted_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {item.daysUntilPurge <= 5 ? (
                      <div className="flex items-center gap-1 text-red-600 font-medium">
                        <AlertCircle className="w-4 h-4" />
                        {item.daysUntilPurge}d
                      </div>
                    ) : (
                      <span className="text-neutral-600">{item.daysUntilPurge}d</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right flex gap-2 justify-end">
                    <button
                      onClick={() => restore(item.id)}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 p-2 rounded transition-colors"
                      title="Restore"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => permanentlyDelete(item.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded transition-colors"
                      title="Permanently delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
