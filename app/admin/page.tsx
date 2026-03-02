import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ExternalLink, Users } from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: projects } = await supabase
    .from('projects')
    .select('*, project_models(count)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  const { data: archived } = await supabase
    .from('projects')
    .select('id, name, created_at')
    .eq('status', 'archived')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <div>
          <img src="/logo.jpg" alt="Tasha Tongpreecha Casting" className="h-6 w-auto" />
          <h1 className="text-2xl font-light tracking-widest uppercase">Dashboard</h1>
        </div>
        <Link href="/admin/projects/new"><Button>New Project</Button></Link>
      </div>

      <section>
        <p className="label mb-6">Active Projects</p>
        {!projects?.length && (
          <div className="border border-dashed border-neutral-200 p-12 text-center text-sm text-neutral-400">
            No active projects. <Link href="/admin/projects/new" className="underline">Create one.</Link>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects?.map(p => {
            const modelCount = (p.project_models as any)?.[0]?.count || 0
            return (
              <div key={p.id} className="border border-neutral-200 p-6 hover:border-black transition-colors">
                <h3 className="text-sm font-medium tracking-wider uppercase mb-1">{p.name}</h3>
                {p.description && <p className="text-xs text-neutral-400 mb-4 line-clamp-2">{p.description}</p>}
                <div className="flex items-center gap-1 text-xs text-neutral-400 mb-4">
                  <Users size={12} /><span>{modelCount} models</span>
                </div>
                <div className="flex gap-3">
                  <Link href={`/admin/projects/${p.id}`} className="text-xs tracking-wider uppercase underline">Manage</Link>
                  <a href={`/cast/${p.slug}`} target="_blank" className="text-xs tracking-wider uppercase text-neutral-400 flex items-center gap-1 hover:text-black">
                    Cast Link <ExternalLink size={10} />
                  </a>
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
                <Link href={`/admin/projects/${p.id}`} className="text-xs tracking-wider uppercase text-neutral-400 underline">View</Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
