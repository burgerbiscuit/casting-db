import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import ShareGate from './ShareGate'
import ShareViewer from './ShareViewer'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function SharePage({ params }: { params: { id: string } }) {
  const { id } = await Promise.resolve(params)
  const cookieStore = await cookies()
  const authed = cookieStore.get(`share_${id}`)?.value === 'true'

  // Fetch the presentation to verify it exists and has a share password
  const { data: presentation } = await supabase
    .from('presentations')
    .select('id, name, share_password, project_id')
    .eq('id', id)
    .single()

  if (!presentation || !presentation.share_password) {
    redirect('/')
  }

  if (!authed) {
    return <ShareGate presentationId={id} presentationName={presentation.name} />
  }

  // Already authed — send them to the full client presentation
  redirect(`/client/presentations/${id}`)

  // Fetch full presentation data (unreachable but needed for type safety)
  const [{ data: presModels }, { data: categories }, { data: project }] = await Promise.all([
    supabase
      .from('presentation_models')
      .select('*, models(*)')
      .eq('presentation_id', id)
      .eq('is_visible', true)
      .order('display_order'),
    supabase
      .from('presentation_categories')
      .select('*')
      .eq('presentation_id', id)
      .order('display_order'),
    supabase
      .from('projects')
      .select('name')
      .eq('id', presentation.project_id)
      .single(),
  ])

  // Attach media to each model
  const modelIds = (presModels || []).map((m: any) => m.model_id)
  const { data: allMedia } = modelIds.length
    ? await supabase.from('model_media').select('*').in('model_id', modelIds).order('display_order')
    : { data: [] }

  const mediaByModel: Record<string, any[]> = {}
  for (const media of allMedia || []) {
    if (!mediaByModel[media.model_id]) mediaByModel[media.model_id] = []
    mediaByModel[media.model_id].push(media)
  }

  const enriched = (presModels || []).map((m: any) => ({
    ...m,
    models: { ...m.models, model_media: mediaByModel[m.model_id] || [] },
  }))

  return (
    <ShareViewer
      presentationId={id}
      presentationName={presentation.name}
      projectName={project?.name || ''}
      presModels={enriched}
      categories={categories || []}
    />
  )
}
