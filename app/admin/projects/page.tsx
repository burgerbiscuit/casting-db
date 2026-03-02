import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-2xl font-light tracking-widest uppercase">Projects</h1>
        <Link href="/admin/projects/new"><Button>New Project</Button></Link>
      </div>
      <div className="divide-y divide-neutral-100">
        {projects?.map(p => (
          <div key={p.id} className="flex items-center justify-between py-4">
            <div>
              <span className="text-sm font-medium">{p.name}</span>
              <span className="ml-3"><Badge>{p.status}</Badge></span>
              <p className="text-xs text-neutral-400 mt-1">/cast/{p.slug}</p>
            </div>
            <Link href={`/admin/projects/${p.id}`} className="text-xs tracking-wider uppercase underline">Manage</Link>
          </div>
        ))}
      </div>
    </div>
  )
}
