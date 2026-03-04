import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ConfirmationChartEditor } from '@/components/ConfirmationChartEditor'

export default async function AdminConfirmationChartPage({ params }: { params: { id: string } }) {
  const { id: projectId } = params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const serviceSupabase = await createServiceClient()

  const { data: project } = await serviceSupabase
    .from('projects')
    .select('id, name, shoot_date, model_rate, usage, photographer, stylist, description')
    .eq('id', projectId)
    .single()

  if (!project) return <div className="p-8 text-sm">Project not found.</div>

  // Get the main presentation for client chart link
  const { data: presentations } = await serviceSupabase
    .from('presentations').select('id').eq('project_id', projectId).order('created_at', { ascending: false }).limit(1)
  const presId = presentations?.[0]?.id

  // Confirmed models with full model data
  const { data: projectModels } = await serviceSupabase
    .from('project_models')
    .select(`
      id, model_id, pm_rate, pm_option, pm_location,
      confirmed_usage, confirmed_days, confirmed_date, confirmed_notes,
      models(id, first_name, last_name, phone, email, agency)
    `)
    .eq('project_id', projectId)
    .eq('admin_confirmed', true)

  const confirmed = projectModels || []
  const modelIds = confirmed.map((pm: any) => pm.models?.id).filter(Boolean)

  // Photos
  const { data: photos } = modelIds.length > 0 ? await serviceSupabase
    .from('model_media').select('model_id, public_url')
    .in('model_id', modelIds).eq('is_visible', true).eq('type', 'photo').order('display_order') : { data: [] }
  const photoMap: Record<string, string> = {}
  ;(photos || []).forEach((p: any) => { if (!photoMap[p.model_id]) photoMap[p.model_id] = p.public_url })

  // Collect unique agencies and fetch agent contacts
  const agencies = [...new Set(confirmed.map((pm: any) => pm.models?.agency).filter(Boolean))]
  const { data: agentContacts } = agencies.length > 0 ? await serviceSupabase
    .from('agency_contacts')
    .select('agency_name, agent_name, email, cell_phone, office_phone, is_main_contact')
    .in('agency_name', agencies)
    .eq('contact_type', 'model')
    .order('is_main_contact', { ascending: false }) : { data: [] }

  // Build agency → main contact map
  const agentMap: Record<string, any> = {}
  ;(agentContacts || []).forEach((ac: any) => {
    const key = ac.agency_name?.toLowerCase()
    if (!key) return
    if (!agentMap[key] || ac.is_main_contact) agentMap[key] = ac
  })

  const modelsData = confirmed.map((pm: any) => {
    const model = pm.models
    const agentKey = model?.agency?.toLowerCase()
    const agent = agentKey ? agentMap[agentKey] : null
    return {
      pmId: pm.id,
      modelId: model?.id,
      firstName: model?.first_name || '',
      lastName: model?.last_name || '',
      phone: model?.phone || '',
      email: model?.email || '',
      agency: model?.agency || '',
      photo: photoMap[model?.id] || null,
      agentName: agent?.agent_name || '',
      agentEmail: agent?.email || '',
      agentPhone: agent?.cell_phone || agent?.office_phone || '',
      pmRate: pm.pm_rate || '',
      pmOption: pm.pm_option || '',
      confirmedDate: pm.confirmed_date || '',
      confirmedUsage: pm.confirmed_usage || '',
      confirmedDays: pm.confirmed_days || '',
      confirmedNotes: pm.confirmed_notes || '',
    }
  })

  const projectData = {
    id: projectId,
    name: project.name,
    shootDate: project.shoot_date || '',
    modelRate: project.model_rate || '',
    usage: project.usage || '',
    photographer: project.photographer || '',
    stylist: project.stylist || '',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href={`/admin/projects/${projectId}`} className="label hover:text-black">← {project.name}</Link>
          <h1 className="text-2xl font-light tracking-widest uppercase mt-2">Confirmation Chart</h1>
          <p className="text-xs text-neutral-400 mt-1">Edit per-model confirmation details. Changes save automatically.</p>
        </div>
        <div className="flex items-center gap-3">
          {presId && (
            <Link href={`/client/presentations/${presId}/chart`} target="_blank"
              className="text-[11px] tracking-widest uppercase border border-neutral-300 px-4 py-2 hover:border-black transition-colors">
              Client View ↗
            </Link>
          )}
        </div>
      </div>

      {confirmed.length === 0 ? (
        <div className="border border-dashed border-neutral-200 p-12 text-center">
          <p className="text-xs tracking-widest uppercase text-neutral-300">No officially confirmed models yet</p>
          <p className="text-sm text-neutral-400 mt-2">Confirm talent from the Models tab first.</p>
        </div>
      ) : (
        <ConfirmationChartEditor models={modelsData} project={projectData} />
      )}
    </div>
  )
}
