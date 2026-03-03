import { createClient, createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ClientDashboard() {
  const supabase = await createClient()
  const serviceSupabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  // Use service client to bypass RLS for team member check
  const { data: isMember } = await serviceSupabase.from('team_members').select('id').eq('user_id', user?.id).single()

  let projectsWithPresentations: any[] = []

  if (isMember) {
    // Team members see all active projects with presentations
    const { data: allProjects } = await serviceSupabase
      .from('projects')
      .select('id, name, status, presentations(id, name)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    projectsWithPresentations = (allProjects || []).map(p => ({
      project: p,
      presentations: p.presentations || [],
    })).filter(p => p.presentations.length > 0)
  } else {
    // Clients see only assigned ACTIVE projects
    const { data: clientProjects } = await serviceSupabase
      .from('client_projects')
      .select('*, projects(id, name, status, presentations(id, name))')
      .eq('client_id', user?.id)
    projectsWithPresentations = (clientProjects || [])
      .filter(cp => (cp.projects as any)?.status === 'active')
      .map(cp => ({
        project: cp.projects as any,
        presentations: ((cp.projects as any)?.presentations || []),
      }))
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-light tracking-widest uppercase mb-10">Your Projects</h1>
      {!projectsWithPresentations.length && <p className="text-sm text-neutral-400">No projects available.</p>}
      <div className="space-y-8">
        {projectsWithPresentations.map(({ project, presentations }) => (
          <div key={project?.id} className="border border-neutral-200 p-6">
            <h2 className="text-sm font-medium tracking-widest uppercase mb-4">{project?.name}</h2>
            <div className="space-y-2">
              {presentations.map((pres: any) => (
                <Link key={pres.id} href={`/client/presentations/${pres.id}`}
                  className="flex items-center justify-between py-3 border-b border-neutral-100 hover:bg-neutral-50 -mx-2 px-2 transition-colors">
                  <span className="text-sm">{pres.name}</span>
                  <span className="text-xs tracking-wider uppercase text-neutral-400">View →</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
