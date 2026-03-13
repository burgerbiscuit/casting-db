import { createClient, createServiceClient } from '@/lib/supabase/server'
import { PresentationViewer } from '@/components/PresentationViewer'
import Link from 'next/link'
import { Download } from 'lucide-react'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

// Fixed demo client UUID — used for share-link guests so shortlisting writes somewhere
const DEMO_CLIENT_ID = '00000000-0000-0000-0000-000000000000'

export default async function PresentationView({ params }: { params: { id: string } }) {
  const { id } = params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Check if they have share-cookie access (no login required)
  const cookieStore = await cookies()
  const hasShareAccess = cookieStore.get(`share_${id}`)?.value === 'true'

  if (!user && !hasShareAccess) redirect('/client/login')

  // Share-cookie guests use service client — no user session means RLS blocks all reads
  const serviceSupabase = await createServiceClient()
  const db = hasShareAccess && !user ? serviceSupabase : supabase

  const { data: presentation } = await db
    .from('presentations').select('*, projects(name, specs, status)').eq('id', id).single()

  if (!presentation) return <div>Presentation not found.</div>

  // Share-link guests skip all access checks — they're viewing a pre-approved public presentation
  let isMember = false
  if (user) {
    // IDOR fix: verify the logged-in client has access to this presentation's project
    const { data: access } = await supabase
      .from('client_projects')
      .select('id')
      .eq('client_id', user.id)
      .eq('project_id', presentation.project_id)
      .single()

    if (!access) {
      const supabaseSvc = await createServiceClient()
      const { data: member } = await supabaseSvc.from('team_members').select('id').eq('user_id', user.id).single()
      if (!member) redirect('/client')
      isMember = true
    }

    // Archived projects: only team members can still view
    const projectStatus = (presentation.projects as any)?.status
    if (projectStatus === 'archived' && !isMember) redirect('/client')
  }

  const { data: presentationModels } = await db
    .from('presentation_models')
    .select('*, models(*)')
    .eq('presentation_id', id)
    .eq('is_visible', true)
    .order('display_order')

  const modelIds = (presentationModels || []).map((pm: any) => pm.model_id)
  const { data: allMedia } = await db
    .from('model_media').select('*').in('model_id', modelIds).order('is_pdf_primary', { ascending: false }).order('is_pdf_secondary', { ascending: false }).order('display_order')

  let clientFirstName = 'Guest'
  if (user) {
    const { data: clientProfile } = await supabase
      .from('client_profiles').select('name').eq('user_id', user.id).single()
    const { data: teamMember } = !clientProfile ? await supabase
      .from('team_members').select('name').eq('user_id', user.id).single() : { data: null }
    clientFirstName = ((clientProfile?.name || teamMember?.name || '').split(' ')[0]) || ''
  }

  const { data: categories } = await db
    .from('presentation_categories').select('*').eq('presentation_id', id).order('display_order')

  const effectiveClientId = user?.id || DEMO_CLIENT_ID

  const { data: shortlists } = await db
    .from('client_shortlists').select('*').eq('presentation_id', id).eq('client_id', effectiveClientId)

  const shortlistMap: Record<string, any> = {}
  ;(shortlists || []).forEach(s => { shortlistMap[s.model_id] = s })

  // confirmMap: fetch admin_confirmed by model_id (not project_id) so it works regardless of which project the presentation belongs to
  const presModelIds = (presentationModels || []).map((pm: any) => pm.model_id).filter(Boolean)
  const { data: projectModelsData } = presModelIds.length > 0
    ? await db.from('project_models').select('model_id, admin_confirmed').in('model_id', presModelIds)
    : { data: [] }
  const confirmMap: Record<string, boolean> = {}
  ;(projectModelsData || []).filter((pm: any) => pm.admin_confirmed).forEach((pm: any) => {
    confirmMap[pm.model_id] = true
  })

  const mediaByModel: Record<string, any[]> = {}
  ;(allMedia || []).forEach(m => {
    if (!mediaByModel[m.model_id]) mediaByModel[m.model_id] = []
    mediaByModel[m.model_id].push(m)
  })

  // Load project groups with cover photos
  const { data: projectGroupsRaw } = await db
    .from('project_groups')
    .select('id, notes, groups(id, name, group_type, size, based_in, description)')
    .eq('project_id', presentation.project_id)
    .order('created_at')
  const groupIds = (projectGroupsRaw || []).map((pg: any) => pg.groups?.id).filter(Boolean)
  const { data: groupMediaRaw } = groupIds.length > 0
    ? await db.from('group_media').select('group_id, public_url, media_type').in('group_id', groupIds).eq('is_visible', true)
    : { data: [] }
  const groupCoverMap: Record<string, string> = {}
  ;(groupMediaRaw || []).forEach((m: any) => {
    if (!groupCoverMap[m.group_id]) groupCoverMap[m.group_id] = m.public_url
  })
  const projectGroups = (projectGroupsRaw || []).map((pg: any) => ({
    ...pg,
    coverPhoto: groupCoverMap[pg.groups?.id] || null,
  }))

  // Sort alphabetically by last name, first name within each category
  const sanitizedModels = (presentationModels || []).sort((a: any, b: any) => {
    const aName = ((a.models?.first_name || '') + (a.models?.last_name || '')).toLowerCase()
    const bName = ((b.models?.first_name || '') + (b.models?.last_name || '')).toLowerCase()
    return aName.localeCompare(bName)
  })

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-10 gap-4">
        <div>
          <Link href="/client" className="label hover:text-black">← Projects</Link>
          <h1 className="text-2xl font-light tracking-widest uppercase mt-2">{presentation.name}</h1>
          <p className="text-sm text-neutral-400">{(presentation.projects as any)?.name}</p>
        </div>
        <div className="flex items-center gap-3 self-start">
          <Link href={`/client/presentations/${id}/chart`}
            className="flex items-center gap-2 text-xs tracking-widest uppercase border border-neutral-300 px-4 py-2.5 hover:border-black transition-colors">
            Confirmation Chart
          </Link>
          <a href={`/api/pdf/${id}`} target="_blank"
            className="flex items-center gap-2 text-xs tracking-widest uppercase border border-black px-4 py-2.5 hover:bg-black hover:text-white transition-colors">
            <Download size={12} /> Download PDF
          </a>
        </div>
      </div>

      <PresentationViewer
        presentationModels={sanitizedModels}
        mediaByModel={mediaByModel}
        presentationId={id}
        clientId={effectiveClientId}
        clientFirstName={clientFirstName}
        categories={categories || []}
        shortlistMap={shortlistMap}
        confirmMap={confirmMap}
        presentationName={presentation.name}
        projectName={(presentation.projects as any)?.name || ''}
        projectSpecs={(presentation.projects as any)?.specs || ''}
      />

      {projectGroups.length > 0 && (
        <div className="mt-12 pt-8 border-t border-neutral-200">
          <p className="text-xs tracking-widest uppercase text-neutral-400 mb-6">Groups</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {projectGroups.map((pg: any) => (
              <div key={pg.id} className="group">
                <div className="aspect-[3/4] overflow-hidden bg-neutral-100 mb-2">
                  {pg.coverPhoto ? (
                    <img src={pg.coverPhoto} alt={pg.groups?.name} className="w-full h-full object-cover object-top" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-300 text-xs tracking-widest uppercase">No Photo</div>
                  )}
                </div>
                <p className="text-xs font-medium tracking-widest uppercase">{pg.groups?.name}</p>
                {pg.groups?.group_type && <p className="text-[10px] text-neutral-400 mt-0.5">{pg.groups.group_type}</p>}
                {pg.groups?.size && <p className="text-[10px] text-neutral-400">{pg.groups.size}</p>}
                {pg.notes && <p className="text-[10px] text-neutral-500 mt-1">{pg.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
