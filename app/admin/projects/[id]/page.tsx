import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { revalidatePath } from 'next/cache'
import { CopyButton } from '@/components/CopyButton'
import { ProjectModelManager } from '@/components/ProjectModelManager'
import { ProjectModelToggle } from '@/components/ProjectModelToggle'

async function archiveProject(id: string, status: string) {
  'use server'
  const supabase = await createClient()
  await supabase.from('projects').update({ status: status === 'active' ? 'archived' : 'active' }).eq('id', id)
  revalidatePath(`/admin/projects/${id}`)
}

export default async function ProjectDetail({ params }: { params: { id: string } }) {
  const { id } = params
  const supabase = await createClient()

  const { data: project } = await supabase.from('projects').select('*').eq('id', id).single()
  const { data: projectModels } = await supabase
    .from('project_models')
    .select('*, models(id, first_name, last_name, agency, gender, height_ft, height_in)')
    .eq('project_id', id)
    .order('signed_in_at', { ascending: false })
  const { data: presentations } = await supabase
    .from('presentations').select('*').eq('project_id', id).order('created_at', { ascending: false })
  const mainPres = presentations?.[0]
  const { data: presModels } = mainPres ? await supabase
    .from('presentation_models').select('model_id').eq('presentation_id', mainPres.id) : { data: [] }
  const presModelIds = new Set((presModels || []).map((pm: any) => pm.model_id))

  // Get first photo for each model
  const modelIds = (projectModels || []).map((pm: any) => pm.models?.id).filter(Boolean)
  const { data: photos } = modelIds.length > 0 ? await supabase
    .from('model_media').select('model_id, public_url')
    .in('model_id', modelIds).eq('is_visible', true).eq('type', 'photo').order('display_order') : { data: [] }
  const photoMap = new Map<string, string>()
  ;(photos || []).forEach((p: any) => { if (!photoMap.has(p.model_id)) photoMap.set(p.model_id, p.public_url) })

  if (!project) return <div>Project not found</div>

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const modelLink = `${appUrl}/cast/${project.slug}`
  const publishedPres = presentations?.find(p => p.is_published)
  const latestPres = presentations?.[0]
  const clientLink = publishedPres
    ? `${appUrl}/client/presentations/${publishedPres.id}`
    : latestPres ? `${appUrl}/client/presentations/${latestPres.id}` : null

  const modelsWithPhotos = (projectModels || []).map((pm: any) => ({
    ...pm,
    photo: photoMap.get(pm.models?.id) || null
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <div>
          <Link href="/admin/projects" className="label hover:text-black">← Projects</Link>
          <h1 className="text-2xl font-light tracking-widest uppercase mt-2">{project.name}</h1>
          {project.description && <p className="text-sm text-neutral-400 mt-1">{project.description}</p>}
        </div>
        <form action={archiveProject.bind(null, id, project.status)}>
          <Button variant="ghost" size="sm" type="submit">
            {project.status === 'active' ? 'Archive' : 'Restore'}
          </Button>
        </form>
      </div>

      {/* Two key links */}
      <div className="grid grid-cols-2 gap-4 mb-12">
        <div className="border border-neutral-200 p-6">
          <p className="label mb-1">Model Sign-In Link</p>
          <p className="text-xs text-neutral-400 mb-4">Share with models so they can check in.</p>
          <div className="bg-neutral-50 px-3 py-2 text-xs text-neutral-500 mb-3 break-all">{modelLink}</div>
          <div className="flex gap-4">
            <a href={modelLink} target="_blank" className="text-xs tracking-widest uppercase underline">Open ↗</a>
            <CopyButton text={modelLink} />
          </div>
        </div>

        <div className="border border-neutral-200 p-6">
          <p className="label mb-1">Client Presentation Link</p>
          <p className="text-xs text-neutral-400 mb-4">Share with clients to view the presentation.</p>
          {clientLink ? (
            <>
              <div className="bg-neutral-50 px-3 py-2 text-xs text-neutral-500 mb-3 break-all">{clientLink}</div>
              <div className="flex gap-4 items-center">
                <a href={clientLink} target="_blank" className="text-xs tracking-widest uppercase underline">Open ↗</a>
                <CopyButton text={clientLink} />
                {!publishedPres && latestPres && (
                  <span className="text-[10px] text-amber-600 uppercase tracking-wider">Draft — publish to activate</span>
                )}
              </div>
            </>
          ) : (
            <div>
              <p className="text-xs text-neutral-400 italic mb-3">No presentation yet.</p>
              <Link href={`/admin/presentations/new?project=${id}`}>
                <Button size="sm">Create Presentation</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-10">
        {/* Models with select/deselect */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <p className="label">Models Signed In ({modelsWithPhotos.length})</p>
            {mainPres && <p className="text-[10px] text-neutral-400 tracking-wider uppercase">✓ = on client presentation</p>}
          </div>
          {modelsWithPhotos.length === 0 ? (
            <div className="border border-dashed border-neutral-200 p-8 text-center">
              <p className="text-sm text-neutral-400">No models signed in yet.</p>
              <p className="text-xs text-neutral-300 mt-2">Share the model sign-in link above.</p>
            </div>
          ) : mainPres ? (
            <div className="space-y-2">
              {modelsWithPhotos.map((pm: any, i: number) => (
                <div key={pm.id} className="flex items-center gap-3 border border-neutral-100 px-3 py-2">
                  <ProjectModelToggle
                    presentationId={mainPres.id}
                    model={pm.models}
                    isInPresentation={presModelIds.has(pm.models?.id)}
                    displayOrder={i}
                  />
                  {pm.photo && <img src={pm.photo} className="w-8 h-8 object-cover rounded-sm flex-shrink-0" alt="" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">{pm.models?.first_name} {pm.models?.last_name}</p>
                    {pm.models?.agency && <p className="text-[10px] text-neutral-400">{pm.models?.agency}</p>}
                  </div>
                  <Link href={`/admin/models/${pm.models?.id}`} className="text-[10px] text-neutral-300 hover:text-black transition-colors">View →</Link>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <ProjectModelManager projectId={id} initialModels={modelsWithPhotos} />
              <p className="text-xs text-neutral-400 mt-3">Create a presentation to enable the toggle view.</p>
            </div>
          )}
        </section>

        {/* Presentations */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <p className="label">Presentations</p>
            <Link href={`/admin/presentations/new?project=${id}`}><Button size="sm">New</Button></Link>
          </div>
          <div className="divide-y divide-neutral-100">
            {presentations?.map(pres => (
              <div key={pres.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm">{pres.name}</p>
                  <p className="text-xs text-neutral-400">{pres.is_published ? '● Published' : '○ Draft'}</p>
                </div>
                <Link href={`/admin/presentations/${pres.id}`} className="text-xs text-neutral-400 underline">Edit</Link>
              </div>
            ))}
            {!presentations?.length && <p className="text-sm text-neutral-400 py-4">No presentations yet.</p>}
          </div>
        </section>
      </div>
    </div>
  )
}
