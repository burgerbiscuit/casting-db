import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: projects } = await supabase
    .from('projects')
    .select('*, presentations(id)')
    .order('created_at', { ascending: false })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cast.tashatongpreecha.com'

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-2xl font-light tracking-widest uppercase">Projects</h1>
        <Link href="/admin/projects/new"><Button>New Project</Button></Link>
      </div>
      <div className="divide-y divide-neutral-100">
        {projects?.map(p => (
          <div key={p.id} className="flex items-center justify-between py-5">
            <div>
              <span className="text-sm font-medium">{p.name}</span>
              <span className="ml-3"><Badge>{p.status}</Badge></span>
              {p.shoot_date && <span className="ml-3 text-xs text-neutral-400">{new Date(p.shoot_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
            </div>
            <div className="flex items-center gap-4">
              <a href={`${appUrl}/cast/${p.slug}`} target="_blank"
                className="text-[10px] tracking-widest uppercase text-neutral-400 hover:text-black transition-colors border border-neutral-200 px-3 py-1.5 hover:border-black">
                Model Sign-In ↗
              </a>
              {(p.presentations as any)?.[0]?.id && (
                <a href={`${appUrl}/client/presentations/${(p.presentations as any)[0].id}`} target="_blank"
                  className="text-[10px] tracking-widest uppercase text-neutral-400 hover:text-black transition-colors border border-neutral-200 px-3 py-1.5 hover:border-black">
                  Client View ↗
                </a>
              )}
              <Link href={`/admin/projects/${p.id}`} className="text-[10px] tracking-widest uppercase text-neutral-400 hover:text-black transition-colors border border-neutral-200 px-3 py-1.5 hover:border-black">
                Manage
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
