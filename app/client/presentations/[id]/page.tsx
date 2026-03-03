import { createClient } from '@/lib/supabase/server'
import { PresentationViewer } from '@/components/PresentationViewer'
import Link from 'next/link'
import { Download } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function PresentationView({ params }: { params: { id: string } }) {
  const { id } = params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/client/login')

  const { data: presentation } = await supabase
    .from('presentations').select('*, projects(name, specs, status)').eq('id', id).single()

  if (!presentation) return <div>Presentation not found.</div>

  // IDOR fix: verify the logged-in client has access to this presentation's project
  const { data: access } = await supabase
    .from('client_projects')
    .select('id')
    .eq('client_id', user.id)
    .eq('project_id', presentation.project_id)
    .single()

  const isTeamMember = !!access || false
  let isMember = false
  if (!access) {
    const { data: member } = await supabase.from('team_members').select('id').eq('user_id', user.id).single()
    if (!member) redirect('/client')
    isMember = true
  }

  // Archived projects: only team members can still view
  const projectStatus = (presentation.projects as any)?.status
  if (projectStatus === 'archived' && !isMember) redirect('/client')

  const { data: presentationModels } = await supabase
    .from('presentation_models')
    .select('*, models(*)')
    .eq('presentation_id', id)
    .eq('is_visible', true)
    .order('display_order')

  const modelIds = (presentationModels || []).map((pm: any) => pm.model_id)
  const { data: allMedia } = await supabase
    .from('model_media').select('*').in('model_id', modelIds).order('display_order')

  const { data: clientProfile } = await supabase
    .from('client_profiles').select('name').eq('user_id', user.id).single()
  // Also check team_members for their name
  const { data: teamMember } = !clientProfile ? await supabase
    .from('team_members').select('name').eq('user_id', user.id).single() : { data: null }
  const clientFirstName = ((clientProfile?.name || teamMember?.name || '').split(' ')[0]) || ''

  const { data: categories } = await supabase
    .from('presentation_categories').select('*').eq('presentation_id', id).order('display_order')

  const { data: shortlists } = await supabase
    .from('client_shortlists').select('*').eq('presentation_id', id).eq('client_id', user?.id)

  const shortlistMap: Record<string, any> = {}
  ;(shortlists || []).forEach(s => { shortlistMap[s.model_id] = s })

  const confirmMap: Record<string, boolean> = {}
  ;(shortlists || []).filter(s => s.status === 'confirmed').forEach(s => { confirmMap[s.model_id] = true })

  const mediaByModel: Record<string, any[]> = {}
  ;(allMedia || []).forEach(m => {
    if (!mediaByModel[m.model_id]) mediaByModel[m.model_id] = []
    mediaByModel[m.model_id].push(m)
  })

  // admin_notes are team notes visible to clients on the presentation
  const sanitizedModels = presentationModels || []

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <Link href="/client" className="label hover:text-black">← Projects</Link>
          <h1 className="text-2xl font-light tracking-widest uppercase mt-2">{presentation.name}</h1>
          <p className="text-sm text-neutral-400">{(presentation.projects as any)?.name}</p>
        </div>
        <a href={`/api/pdf/${id}`} download
          className="flex items-center gap-2 text-xs tracking-widest uppercase border border-black px-4 py-3 hover:bg-black hover:text-white transition-colors">
          <Download size={12} /> Download PDF
        </a>
      </div>

      <PresentationViewer
        presentationModels={sanitizedModels}
        mediaByModel={mediaByModel}
        presentationId={id}
        clientId={user?.id || ''}
        clientFirstName={clientFirstName}
        categories={categories || []}
        shortlistMap={shortlistMap}
        confirmMap={confirmMap}
        presentationName={presentation.name}
        projectName={(presentation.projects as any)?.name || ''}
        projectSpecs={(presentation.projects as any)?.specs || ''}
      />
    </div>
  )
}
