import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ClientPortalLanding() {
  const supabase = await createClient()
  const serviceSupabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isMember = false
  let clientProjectIds: string[] = []

  if (user) {
    const { data: member } = await serviceSupabase
      .from('team_members').select('id').eq('user_id', user.id).single()
    isMember = !!member

    if (!isMember) {
      // Client: get their assigned projects
      const { data: cp } = await serviceSupabase
        .from('client_projects').select('project_id').eq('client_id', user.id)
      clientProjectIds = (cp || []).map((r: any) => r.project_id)

      // If client has exactly one project, go straight there
      if (clientProjectIds.length === 1) {
        redirect(`/client/${clientProjectIds[0]}`)
      }
    }
  }

  // Fetch active projects
  const { data: projects } = await serviceSupabase
    .from('projects')
    .select('id, name, shoot_date, status')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  // For clients, filter to only their projects
  const visibleProjects = isMember
    ? (projects || [])
    : (projects || []).filter((p: any) => clientProjectIds.includes(p.id))

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-12">
        <h1 className="text-2xl font-light tracking-widest uppercase mb-2">Client Portal</h1>
        <p className="text-sm text-neutral-400">Select your project to continue.</p>
      </div>

      {visibleProjects.length === 0 && (
        <div className="border border-neutral-100 p-12 text-center">
          <p className="text-xs tracking-widest uppercase text-neutral-300 mb-3">No active projects</p>
          {!user && (
            <p className="text-sm text-neutral-400">
              <Link href="/client/login" className="underline underline-offset-2 hover:opacity-60">Sign in</Link> to view your assigned projects.
            </p>
          )}
        </div>
      )}

      <div className="space-y-3">
        {visibleProjects.map((project: any) => {
          const href = user
            ? `/client/${project.id}`
            : `/client/login?redirect=/client/${project.id}`

          return (
            <Link
              key={project.id}
              href={href}
              className="flex items-center justify-between border border-neutral-200 px-6 py-5 hover:border-black transition-colors group"
            >
              <div>
                <p className="text-sm tracking-widest uppercase font-medium">{project.name}</p>
                {project.shoot_date && (
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {new Date(project.shoot_date).toLocaleDateString('en-US', {
                      month: 'long', day: 'numeric', year: 'numeric'
                    })}
                  </p>
                )}
              </div>
              <span className="text-xs tracking-widest uppercase text-neutral-400 group-hover:text-black transition-colors">
                Enter &rarr;
              </span>
            </Link>
          )
        })}
      </div>

      {!user && visibleProjects.length > 0 && (
        <p className="mt-8 text-xs text-neutral-400 text-center">
          Already have an account?{' '}
          <Link href="/client/login" className="underline underline-offset-2 hover:text-black transition-colors">
            Sign in
          </Link>
        </p>
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
