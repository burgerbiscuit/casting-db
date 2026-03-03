'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ExternalLink, Users, Archive } from 'lucide-react'
import { TasksPanel } from '@/components/TasksPanel'

export default function AdminDashboard() {
  const supabase = createClient()
  const [projects, setProjects] = useState<any[]>([])
  const [archived, setArchived] = useState<any[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const [{ data: active }, { data: arch }, { count }] = await Promise.all([
      supabase.from('projects').select('*, project_models(count)').eq('status', 'active').order('created_at', { ascending: false }),
      supabase.from('projects').select('id, name, created_at').eq('status', 'archived').order('created_at', { ascending: false }),
      supabase.from('models').select('*', { count: 'exact', head: true }).eq('reviewed', false),
    ])
    setProjects(active || [])
    setArchived(arch || [])
    setPendingCount(count || 0)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const archiveProject = async (id: string) => {
    await supabase.from('projects').update({ status: 'archived' }).eq('id', id)
    load()
  }

  const unarchiveProject = async (id: string) => {
    await supabase.from('projects').update({ status: 'active' }).eq('id', id)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <div>
          <img src="/logo.jpg" alt="Tasha Tongpreecha Casting" className="h-6 w-auto" />
          <h1 className="text-2xl font-light tracking-widest uppercase">Dashboard</h1>
        </div>
        <Link href="/admin/projects/new"><Button>New Project</Button></Link>
      </div>

      {pendingCount > 0 && (
        <div className="mb-8 border border-amber-200 bg-amber-50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-amber-500">⚠️</span>
            <span className="text-sm text-amber-800 tracking-wide">
              <span className="font-medium">{pendingCount} model{pendingCount > 1 ? 's' : ''}</span> pending review
            </span>
          </div>
          <Link href="/admin/models" className="text-xs tracking-widest uppercase underline text-amber-700 hover:text-amber-900">Review Now →</Link>
        </div>
      )}

      <section>
        <p className="label mb-6">Active Projects</p>
        {!loading && !projects.length && (
          <div className="border border-dashed border-neutral-200 p-12 text-center text-sm text-neutral-400">
            No active projects. <Link href="/admin/projects/new" className="underline">Create one.</Link>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => {
            const modelCount = (p.project_models as any)?.[0]?.count || 0
            return (
              <div key={p.id} className="border border-neutral-200 p-6 hover:border-neutral-400 transition-colors">
                <h3 className="text-sm font-medium tracking-wider uppercase mb-1">{p.name}</h3>
                {p.description && <p className="text-xs text-neutral-400 mb-4 line-clamp-2">{p.description}</p>}
                <div className="flex items-center gap-1 text-xs text-neutral-400 mb-4">
                  <Users size={12} /><span>{modelCount} models</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-3">
                    <Link href={`/admin/projects/${p.id}`} className="text-xs tracking-wider uppercase underline">Manage</Link>
                    <a href={`/cast/${p.slug}`} target="_blank" className="text-xs tracking-wider uppercase text-neutral-400 flex items-center gap-1 hover:text-black">
                      Cast Link <ExternalLink size={10} />
                    </a>
                  </div>
                  <button onClick={() => archiveProject(p.id)}
                    className="flex items-center gap-1 text-xs text-neutral-300 hover:text-neutral-600 transition-colors"
                    title="Archive project">
                    <Archive size={12} /> Archive
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {archived && archived.length > 0 && (
        <section className="mt-12">
          <p className="label mb-4">Archived</p>
          <div className="space-y-2">
            {archived.map(p => (
              <div key={p.id} className="flex items-center justify-between py-3 border-b border-neutral-100">
                <span className="text-sm text-neutral-400">{p.name}</span>
                <div className="flex gap-4">
                  <Link href={`/admin/projects/${p.id}`} className="text-xs tracking-wider uppercase text-neutral-400 underline">View</Link>
                  <button onClick={() => unarchiveProject(p.id)} className="text-xs tracking-wider uppercase text-neutral-400 hover:text-black transition-colors">
                    Restore
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      {/* Tasks */}
      <div className="mt-12 border-t border-neutral-100 pt-10">
        <TasksPanel />
      </div>
    </div>
  )
}
