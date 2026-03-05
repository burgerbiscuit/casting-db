import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import ProjectShareGate from './ProjectShareGate'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function ProjectSharePage({ params }: { params: { id: string } }) {
  const { id } = await Promise.resolve(params)
  const cookieStore = await cookies()
  const authed = cookieStore.get(`share_project_${id}`)?.value === 'true'

  const { data: project } = await supabase
    .from('projects')
    .select('id, name, share_password')
    .eq('id', id)
    .single()

  if (!project || !project.share_password) redirect('/')

  if (authed) redirect(`/client/${id}`)

  return <ProjectShareGate projectId={id} projectName={project.name} />
}
