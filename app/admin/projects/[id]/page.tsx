import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { revalidatePath } from 'next/cache'
import { CopyButton } from '@/components/CopyButton'
import { ProjectModelsSection } from '@/components/ProjectModelsSection'
import { ProjectPresentationTab } from '@/components/ProjectPresentationTab'

async function archiveProject(id: string, status: string) {
  'use server'
  const supabase = await createClient()
  await supabase.from('projects').update({ status: status === 'active' ? 'archived' : 'active' }).eq('id', id)
  revalidatePath(`/admin/projects/${id}`)
}

export default async function ProjectDetail({ params, searchParams }: { params: { id: string }, searchParams: { tab?: string } }) {
  const { id } = params
  const tab = searchParams?.tab || 'models'
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
  const presModelIdsList = (presModels || []).map((pm: any) => pm.model_id)

  const modelIds = (projectModels || []).map((pm: any) => pm.models?.id).filter(Boolean)
  const { data: photos } = modelIds.length > 0 ? await supabase
    .from('model_media').select('model_id, public_url')
    .in('model_id', modelIds).eq('is_visible', true).eq('type', 'photo').order('display_order') : { data: [] }
  const photoMap = new Map<string, string>()
  ;(photos || []).forEach((p: any) => { if (!photoMap.has(p.model_id)) photoMap.set(p.model_id, p.public_url) })

  if (!project) return <div>Project not found</div>

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const modelLink = `${appUrl}/cast/${project.slug}`
  const clientLink = presentations?.[0] ? `${appUrl}/client/presentations/${presentations[0].id}` : null

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

      {(project.shoot_date || project.client_name || project.location || project.specs || (project.presentation_rounds?.length > 0)) && (
        <div className="border border-neutral-100 p-6 mb-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {project.client_name && <div><p className="label mb-1">Client</p><p className="text-sm">{project.client_name}</p></div>}
          {project.location && <div><p className="label mb-1">Location</p><p className="text-sm">{project.location}</p></div>}
          {project.shoot_date && <div><p className="label mb-1">Shoot Date</p><p className="text-sm">{new Date(project.shoot_date).toLocaleDateString('en-US', {month:'long',day:'numeric',year:'numeric'})}</p></div>}
          {project.presentation_rounds?.length > 0 && (
            <div><p className="label mb-1">Presentation Rounds</p>
              {project.presentation_rounds.map((r: any, i: number) => (
                <p key={i} className="text-sm">{r.label}: {new Date(r.date).toLocaleDateString('en-US', {month:'short',day:'numeric'})}</p>
              ))}
            </div>
          )}
          {project.specs && <div className="col-span-2 md:col-span-4"><p className="label mb-1">Specs</p><p className="text-sm text-neutral-600 whitespace-pre-wrap">{project.specs}</p></div>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-10">
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

              </div>
            </>
          ) : (
<p className="text-xs text-neutral-400 italic">Go to the Presentation tab to set up the client view.</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 mb-8">
        <Link href={`/admin/projects/${id}?tab=models`}
          className={`px-6 py-3 text-xs tracking-widest uppercase transition-colors border-b-2 -mb-[1px] ${tab !== 'presentation' ? 'border-black text-black' : 'border-transparent text-neutral-400 hover:text-black'}`}>
          Models ({projectModels?.length || 0})
        </Link>
        <Link href={`/admin/projects/${id}?tab=presentation`}
          className={`px-6 py-3 text-xs tracking-widest uppercase transition-colors border-b-2 -mb-[1px] ${tab === 'presentation' ? 'border-black text-black' : 'border-transparent text-neutral-400 hover:text-black'}`}>
          Presentation
        </Link>
      </div>

      {tab !== 'presentation' && (
        <ProjectModelsSection
          projectId={id}
          modelsWithPhotos={modelsWithPhotos}
          mainPres={mainPres || null}
          presModelIds={presModelIdsList}
        />
      )}

      {tab === 'presentation' && (
        <ProjectPresentationTab
          projectId={id}
          presentationId={mainPres?.id || null}
          isPublished={mainPres?.is_published || false}
        />
      )}
    </div>
  )
}
