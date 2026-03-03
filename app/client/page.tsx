import { createClient, createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ClientDashboard() {
  const supabase = await createClient()
  const serviceSupabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: isMember } = await serviceSupabase.from('team_members').select('id').eq('user_id', user?.id).single()

  const { data: clientProfile } = await serviceSupabase.from('client_profiles').select('name').eq('user_id', user?.id).single()
  const firstName = isMember ? '' : ((clientProfile?.name || '').split(' ')[0] || '')

  let projectsWithPresentations: any[] = []

  if (isMember) {
    const { data: allProjects } = await serviceSupabase
      .from('projects')
      .select('id, name, status, shoot_date, presentations(id, name)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    projectsWithPresentations = (allProjects || []).map(p => ({
      project: p,
      presentations: (p as any).presentations || [],
    })).filter(p => p.presentations.length > 0)
  } else {
    const { data: clientProjects } = await serviceSupabase
      .from('client_projects')
      .select('*, projects(id, name, status, shoot_date, presentations(id, name))')
      .eq('client_id', user?.id)
    projectsWithPresentations = (clientProjects || [])
      .filter(cp => (cp.projects as any)?.status === 'active')
      .map(cp => ({
        project: cp.projects as any,
        presentations: ((cp.projects as any)?.presentations || []),
      }))
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-12">
        <h1 className="text-2xl font-light tracking-widest uppercase mb-2">
          {firstName ? 'Welcome, ' + firstName : 'Your Castings'}
        </h1>
        <p className="text-sm text-neutral-400">
          {projectsWithPresentations.length === 0
            ? "Your casting presentations will appear here once they're ready."
            : projectsWithPresentations.length + ' active project' + (projectsWithPresentations.length !== 1 ? 's' : '') + ' available for review.'}
        </p>
      </div>

      {projectsWithPresentations.length === 0 && (
        <div className="border border-neutral-100 p-12 text-center">
          <p className="text-xs tracking-widest uppercase text-neutral-300 mb-3">Nothing here yet</p>
          <p className="text-sm text-neutral-400">Your casting director will share presentations with you here. Check back soon.</p>
        </div>
      )}

      <div className="space-y-4">
        {projectsWithPresentations.map(({ project, presentations }) => (
          <div key={project?.id} className="border border-neutral-200 hover:border-neutral-400 transition-colors">
            <div className="px-6 py-5 border-b border-neutral-100">
              <p className="text-xs tracking-widest uppercase font-medium">{project?.name}</p>
              {project?.shoot_date && (
                <p className="text-xs text-neutral-400 mt-0.5">
                  {new Date(project.shoot_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </div>
            <div>
              {presentations.map((pres: any) => (
                <Link key={pres.id} href={'/client/presentations/' + pres.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-neutral-50 transition-colors border-b border-neutral-50 last:border-0">
                  <span className="text-sm">{pres.name}</span>
                  <span className="text-xs tracking-widest uppercase text-neutral-400">View Presentation &rarr;</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 pt-8 border-t border-neutral-100 text-center">
        <p className="text-xs text-neutral-300 tracking-wider">
          Tasha Tongpreecha Casting &middot;{' '}
          <a href="https://www.tashatongpreecha.com" target="_blank" rel="noopener noreferrer"
            className="hover:text-neutral-400 transition-colors">tashatongpreecha.com</a>
        </p>
      </div>
    </div>
  )
}
