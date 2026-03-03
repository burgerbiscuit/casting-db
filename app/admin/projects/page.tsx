'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal'

const APP_URL = 'https://cast.tashatongpreecha.com'

export default function ProjectsPage() {
  const supabase = createClient()
  const [projects, setProjects] = useState<any[]>([])
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase.from('projects').select('*, presentations(id)').order('created_at', { ascending: false })
    setProjects(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const toggleArchive = async (p: any) => {
    const newStatus = p.status === 'active' ? 'archived' : 'active'
    await supabase.from('projects').update({ status: newStatus }).eq('id', p.id)
    load()
  }

  const deleteProject = async (p: any) => {
    // Cascade delete
    await supabase.from('presentation_models').delete().in('presentation_id',
      (p.presentations || []).map((pr: any) => pr.id)
    )
    await supabase.from('presentations').delete().eq('project_id', p.id)
    await supabase.from('project_models').delete().eq('project_id', p.id)
    await supabase.from('client_projects').delete().eq('project_id', p.id)
    await supabase.from('projects').delete().eq('id', p.id)
    setDeleteTarget(null)
    load()
  }

  const active = projects.filter(p => p.status === 'active')
  const archived = projects.filter(p => p.status !== 'active')

  const ProjectRow = ({ p }: { p: any }) => {
    const presId = (p.presentations as any)?.[0]?.id
    return (
      <div className="flex items-center justify-between py-4 group">
        <div>
          <span className="text-sm font-medium">{p.name}</span>
          {p.shoot_date && (
            <span className="ml-3 text-xs text-neutral-400">
              {new Date(p.shoot_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          )}
          {p.client_name && <span className="ml-3 text-xs text-neutral-400">{p.client_name}</span>}
        </div>
        <div className="flex items-center gap-2">
          <a href={`${APP_URL}/cast/${p.slug}`} target="_blank"
            className="text-[10px] tracking-widest uppercase text-neutral-400 hover:text-black transition-colors border border-neutral-200 px-3 py-1.5 hover:border-black whitespace-nowrap">
            Model Sign-In ↗
          </a>
          {presId && (
            <a href={`${APP_URL}/client/presentations/${presId}`} target="_blank"
              className="text-[10px] tracking-widest uppercase text-neutral-400 hover:text-black transition-colors border border-neutral-200 px-3 py-1.5 hover:border-black whitespace-nowrap">
              Client View ↗
            </a>
          )}
          <Link href={`/admin/projects/${p.id}`}
            className="text-[10px] tracking-widest uppercase text-neutral-400 hover:text-black transition-colors border border-neutral-200 px-3 py-1.5 hover:border-black">
            Manage
          </Link>
          <button onClick={() => toggleArchive(p)}
            className="text-[10px] tracking-widest uppercase text-neutral-400 hover:text-black transition-colors border border-neutral-200 px-3 py-1.5 hover:border-black">
            {p.status === 'active' ? 'Archive' : 'Restore'}
          </button>
          <button onClick={() => setDeleteTarget(p)}
            className="text-[10px] tracking-widest uppercase text-neutral-300 hover:text-red-500 transition-colors border border-neutral-100 hover:border-red-200 px-3 py-1.5 opacity-0 group-hover:opacity-100">
            Delete
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-2xl font-light tracking-widest uppercase">Projects</h1>
        <Link href="/admin/projects/new"><Button>New Project</Button></Link>
      </div>

      {loading && <p className="text-xs text-neutral-400">Loading...</p>}

      {active.length > 0 && (
        <div className="mb-10">
          <p className="label mb-2">Active ({active.length})</p>
          <div className="divide-y divide-neutral-100">
            {active.map(p => <ProjectRow key={p.id} p={p} />)}
          </div>
        </div>
      )}

      {archived.length > 0 && (
        <div>
          <p className="label mb-2 text-neutral-400">Archived ({archived.length})</p>
          <div className="divide-y divide-neutral-100 opacity-60">
            {archived.map(p => <ProjectRow key={p.id} p={p} />)}
          </div>
        </div>
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          title={`Delete "${deleteTarget.name}"?`}
          description="This will permanently delete the project, all its presentations, and model sign-in data. Media files on model profiles will remain."
          onConfirm={() => deleteProject(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
