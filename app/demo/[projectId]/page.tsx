import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'

const DEMO_PROJECT_ID = '7539e334-c3f1-4caf-a931-3b2f4929d78f'

export default async function DemoProjectPage({ params }: { params: { projectId: string } }) {
  const { projectId } = params

  // Guard: only the demo project is accessible here
  if (projectId !== DEMO_PROJECT_ID) redirect('/demo')

  // Guard: must have demo cookie
  const cookieStore = cookies()
  const demoAccess = cookieStore.get('demo_access')
  if (!demoAccess || demoAccess.value !== 'true') redirect('/demo')

  const supabase = await createServiceClient()

  // Fetch project
  const { data: project } = await supabase
    .from('projects')
    .select('id, name, shoot_date')
    .eq('id', projectId)
    .single()

  if (!project) redirect('/demo')

  // Fetch published presentations only
  const { data: presentations } = await supabase
    .from('presentations')
    .select('id, name')
    .eq('project_id', projectId)
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-neutral-100 px-8 py-5">
        <img src="/logo.jpg" alt="Tasha Tongpreecha Casting" className="h-6 w-auto" />
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <p className="text-[10px] tracking-widest uppercase text-neutral-300 mb-2">Demo</p>
          <h1 className="text-2xl font-light tracking-widest uppercase mb-1">{project.name}</h1>
          {project.shoot_date && (
            <p className="text-sm text-neutral-400">
              {new Date(project.shoot_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>

        {/* Presentations */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-[10px] tracking-widest uppercase text-neutral-500">Presentations</h2>
            <div className="flex-1 border-t border-neutral-100" />
          </div>

          {!presentations || presentations.length === 0 ? (
            <p className="text-sm text-neutral-400">No presentations available yet.</p>
          ) : (
            <div className="space-y-2">
              {presentations.map((pres: any) => (
                <Link
                  key={pres.id}
                  href={`/client/presentations/${pres.id}`}
                  className="flex items-center justify-between border border-neutral-200 px-5 py-3.5 hover:border-black transition-colors"
                >
                  <span className="text-sm">{pres.name}</span>
                  <span className="text-xs tracking-widest uppercase text-neutral-400">View &rarr;</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <div className="mt-16 pt-8 border-t border-neutral-100 text-center">
          <p className="text-xs text-neutral-300 tracking-wider">
            Tasha Tongpreecha Casting &middot;{' '}
            <a href="https://www.tashatongpreecha.com" target="_blank" rel="noopener noreferrer"
              className="hover:text-neutral-400 transition-colors">tashatongpreecha.com</a>
          </p>
        </div>
      </main>
    </div>
  )
}
