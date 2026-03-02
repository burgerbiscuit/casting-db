import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ClientDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: clientProjects } = await supabase
    .from('client_projects')
    .select('*, projects(id, name, presentations(id, name, is_published))')
    .eq('client_id', user?.id)

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-light tracking-widest uppercase mb-10">Your Projects</h1>
      {!clientProjects?.length && <p className="text-sm text-neutral-400">No projects assigned yet.</p>}
      <div className="space-y-8">
        {clientProjects?.map(cp => {
          const project = cp.projects as any
          const presentations = (project?.presentations || []).filter((p: any) => p.is_published)
          return (
            <div key={cp.id} className="border border-neutral-200 p-6">
              <h2 className="text-sm font-medium tracking-widest uppercase mb-4">{project?.name}</h2>
              <div className="space-y-2">
                {presentations.map((pres: any) => (
                  <Link key={pres.id} href={`/client/presentations/${pres.id}`}
                    className="flex items-center justify-between py-3 border-b border-neutral-100 hover:bg-neutral-50 -mx-2 px-2 transition-colors">
                    <span className="text-sm">{pres.name}</span>
                    <span className="text-xs tracking-wider uppercase text-neutral-400">View →</span>
                  </Link>
                ))}
                {!presentations.length && <p className="text-xs text-neutral-400">No presentations published yet.</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
