'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function ProjectActions({ projectId, projectStatus }: { projectId: string; projectStatus: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const archiveProject = async () => {
    if (!confirm('Archive this project? It will be hidden from active views but not deleted.')) return
    setLoading(true)
    const newStatus = projectStatus === 'archived' ? 'active' : 'archived'
    const { error } = await supabase.from('projects').update({ status: newStatus }).eq('id', projectId)
    if (error) { alert('Error: ' + error.message); setLoading(false); return }
    router.refresh()
    setLoading(false)
  }

  const deletePresentation = async (presId: string) => {
    if (!confirm('Delete this presentation? This cannot be undone.')) return
    const { error } = await supabase.from('presentations').delete().eq('id', presId)
    if (error) { alert('Error: ' + error.message); return }
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        onClick={archiveProject}
        disabled={loading}
        className="text-[10px] tracking-widest uppercase border border-neutral-300 text-neutral-500 px-3 py-2 hover:border-black hover:text-black transition-colors disabled:opacity-40"
      >
        {projectStatus === 'archived' ? 'Unarchive' : 'Archive'}
      </button>
    </div>
  )
}

export function PresentationDeleteButton({ presId }: { presId: string }) {
  const supabase = createClient()
  const router = useRouter()

  const del = async () => {
    if (!confirm('Delete this presentation? This cannot be undone.')) return
    const { error } = await supabase.from('presentations').delete().eq('id', presId)
    if (error) { alert('Error: ' + error.message); return }
    router.refresh()
  }

  return (
    <button
      onClick={del}
      className="text-[10px] tracking-widest uppercase text-red-400 hover:text-red-600 transition-colors"
    >
      Delete
    </button>
  )
}
