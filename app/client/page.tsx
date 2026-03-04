import { createClient, createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ClientDashboard() {
  const supabase = await createClient()
  const serviceSupabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: isMember } = await serviceSupabase.from('team_members').select('id').eq('user_id', user?.id).single()

  const { data: clientProfile } = await serviceSupabase.from('client_profiles').select('name').eq('user_id', user?.id).single()
  const firstName = isMember ? '' : ((clientProfile?.name || '').split(' ')[0] || '')

  type ProjectEntry = {
    project: any
    presentations: any[]
    hasConfirmed: boolean
  }

  let activeProjects: ProjectEntry[] = []
  let archivedProjects: ProjectEntry[] = []

  const buildEntries = async (rawProjects: any[]): Promise<ProjectEntry[]> => {
    const projectIds = rawProjects.map((p: any) => p.id)
    // Fetch which projects have at least one admin_confirmed model
    const { data: confirmedPms } = projectIds.length > 0
      ? await serviceSupabase
          .from('project_models')
          .select('project_id')
          .in('project_id', projectIds)
          .eq('admin_confirmed', true)
      : { data: [] }
    const confirmedSet = new Set((confirmedPms || []).map((pm: any) => pm.project_id))

    return rawProjects
      .filter((p: any) => ((p as any).presentations || []).length > 0)
      .map((p: any) => ({
        project: p,
        presentations: (p as any).presentations || [],
        hasConfirmed: confirmedSet.has(p.id),
      }))
  }

  if (isMember) {
    const { data: allProjects } = await serviceSupabase
      .from('projects')
      .select('id, name, status, shoot_date, presentations(id, name)')
      .order('created_at', { ascending: false })

    const active = (allProjects || []).filter((p: any) => p.status === 'active')
    const archived = (allProjects || []).filter((p: any) => p.status === 'archived')
    activeProjects = await buildEntries(active)
    archivedProjects = await buildEntries(archived)
  } else {
    const { data: clientProjects } = await serviceSupabase
      .from('client_projects')
      .select('*, projects(id, name, status, shoot_date, presentations(id, name))')
      .eq('client_id', user?.id)

    const active = (clientProjects || [])
      .filter((cp: any) => cp.projects?.status === 'active')
      .map((cp: any) => cp.projects)
    const archived = (clientProjects || [])
      .filter((cp: any) => cp.projects?.status === 'archived')
      .map((cp: any) => cp.projects)

    activeProjects = await buildEntries(active)
    archivedProjects = await buildEntries(archived)
  }

  const ProjectCard = ({ entry }: { entry: ProjectEntry }) => {
    const { project, presentations, hasConfirmed } = entry
    return (
      <div className="border border-neutral-200 hover:border-neutral-400 transition-colors">
        <div className="px-6 py-4 border-b border-neutral-100 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs tracking-widest uppercase font-medium">{project?.name}</p>
            {project?.shoot_date && (
              <p className="text-xs text-neutral-400 mt-0.5">
                {new Date(project.shoot_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            )}
          </div>
          {hasConfirmed && presentations[0] && (
            <Link
              href={`/client/presentations/${presentations[0].id}/chart`}
              className="shrink-0 text-[9px] tracking-widest uppercase border border-green-600 text-green-700 px-2 py-1 hover:bg-green-600 hover:text-white transition-colors"
            >
              ✓ Confirmation Chart
            </Link>
          )}
        </div>
        <div>
          {presentations.map((pres: any) => (
            <Link key={pres.id} href={`/client/presentations/${pres.id}`}
              className="flex items-center justify-between px-6 py-4 hover:bg-neutral-50 transition-colors border-b border-neutral-50 last:border-0">
              <span className="text-sm">{pres.name}</span>
              <span className="text-xs tracking-widest uppercase text-neutral-400">View Presentation &rarr;</span>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-12">
        <h1 className="text-2xl font-light tracking-widest uppercase mb-2">
          {firstName ? 'Welcome, ' + firstName : 'Your Castings'}
        </h1>
        <p className="text-sm text-neutral-400">
          {activeProjects.length === 0 && archivedProjects.length === 0
            ? "Your casting presentations will appear here once they're ready."
            : `${activeProjects.length} active project${activeProjects.length !== 1 ? 's' : ''}${archivedProjects.length > 0 ? `, ${archivedProjects.length} archived` : ''}.`}
        </p>
      </div>

      {activeProjects.length === 0 && archivedProjects.length === 0 && (
        <div className="border border-neutral-100 p-12 text-center">
          <p className="text-xs tracking-widest uppercase text-neutral-300 mb-3">Nothing here yet</p>
          <p className="text-sm text-neutral-400">Your casting director will share presentations with you here. Check back soon.</p>
        </div>
      )}

      {/* Active projects */}
      {activeProjects.length > 0 && (
        <div className="space-y-4 mb-10">
          {activeProjects.map(entry => (
            <ProjectCard key={entry.project?.id} entry={entry} />
          ))}
        </div>
      )}

      {/* Archived projects */}
      {archivedProjects.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <p className="text-[10px] tracking-widest uppercase text-neutral-400">Archived Projects</p>
            <div className="flex-1 border-t border-neutral-100" />
          </div>
          <div className="space-y-4 opacity-70">
            {archivedProjects.map(entry => (
              <ProjectCard key={entry.project?.id} entry={entry} />
            ))}
          </div>
        </div>
      )}

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
