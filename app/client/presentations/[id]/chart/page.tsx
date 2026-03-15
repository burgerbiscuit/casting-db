import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { PrintButton } from '@/components/PrintButton'
import ConfirmationChartTable from '@/components/ConfirmationChartTable'

export default async function ConfirmationChartPage({ params, searchParams }: { params: { id: string }; searchParams: { hidden?: string } }) {
  const { id } = params
  const hiddenCols = new Set((searchParams.hidden || '').split(',').filter(Boolean))
  const showCol = (col: string) => !hiddenCols.has(col)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const cookieStore = await cookies()
  const hasShareAccess = cookieStore.get(`share_${id}`)?.value === 'true'
  const hasDemoAccess = cookieStore.get('demo_access')?.value === 'true'
  if (!user && !hasShareAccess && !hasDemoAccess) redirect('/client/login')

  const serviceSupabase = await createServiceClient()

  const { data: presentation } = await serviceSupabase
    .from('presentations')
    .select('*, projects(id, name, shoot_date, photographer, stylist, usage, model_rate, location)')
    .eq('id', id)
    .single()


  if (!presentation) return <div className="p-8 text-sm text-neutral-400">Presentation not found.</div>

  const project = presentation.projects as any

  // Access check — share-cookie guests bypass all checks
  let isMember = false
  if (user) {
    const { data: member } = await serviceSupabase.from('team_members').select('id').eq('user_id', user.id).single()
    isMember = !!member
    if (!isMember) {
      const { data: access } = await serviceSupabase
        .from('client_projects').select('id')
        .eq('client_id', user.id).eq('project_id', project.id).single()
      if (!access) redirect('/client')
      // Non-team members: only show if chart is approved
      if (!(presentation as any).chart_approved) {
        return (
          <div className="max-w-3xl mx-auto text-center py-20">
            <p className="text-xs tracking-widest uppercase text-neutral-300 mb-3">Not yet available</p>
            <p className="text-sm text-neutral-400">The confirmation chart for this project isn&apos;t ready yet. Check back soon.</p>
            <a href="/client" className="mt-6 inline-block text-[11px] tracking-widest uppercase text-neutral-400 hover:text-black">← Back to Projects</a>
          </div>
        )
      }
    }
  }

  // Confirmed models
  const { data: projectModels } = await serviceSupabase
    .from('project_models')
    .select('*, models(id, first_name, last_name, agency, height_ft, height_in, bust, waist, hips, shoe_size, dress_size, instagram_handle, portfolio_url)')
    .eq('project_id', project.id)
    .eq('admin_confirmed', true)
    .eq('chart_hidden', false)

  const confirmed = projectModels || []
  const modelIds = confirmed.map((pm: any) => pm.models?.id).filter(Boolean)

  const { data: photos } = modelIds.length > 0 ? await serviceSupabase
    .from('model_media').select('model_id, public_url')
    .in('model_id', modelIds).eq('is_visible', true).eq('type', 'photo').order('display_order') : { data: [] }
  const photoMap: Record<string, string> = {}
  ;(photos || []).forEach((p: any) => { if (!photoMap[p.model_id]) photoMap[p.model_id] = p.public_url })

  // Agent contacts
  const agencies = [...new Set(confirmed.map((pm: any) => pm.models?.agency).filter(Boolean))] as string[]
  const { data: agentContacts } = agencies.length > 0 ? await serviceSupabase
    .from('agency_contacts').select('agency_name, agent_name, email, cell_phone, office_phone, is_main_contact')
    .in('agency_name', agencies).eq('contact_type', 'model')
    .order('is_main_contact', { ascending: false }) : { data: [] }
  const agentMap: Record<string, any> = {}
  ;(agentContacts || []).forEach((ac: any) => {
    const key = (ac.agency_name || '').toLowerCase()
    if (!agentMap[key] || ac.is_main_contact) agentMap[key] = ac
  })

  const shootDate = project.shoot_date
    ? new Date(project.shoot_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  const projectLabel = [project.name, shootDate, project.location].filter(Boolean).join(' / ').toUpperCase()

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          @page { size: landscape; margin: 0; }
          .no-print { display: none !important; }
          body { font-size: 10px; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; }
          .print-wrap { padding: 10mm 12mm; }
        }
      `}</style>

      <div className="print-wrap max-w-[1400px] mx-auto">
        {/* Nav */}
        <div className="no-print flex items-center justify-between mb-6">
          <Link href="/client" className="text-[11px] tracking-widest uppercase text-neutral-400 hover:text-black">← Projects</Link>
          <div className="flex items-center gap-3">
            <Link href={`/client/presentations/${id}`} className="text-[11px] tracking-widest uppercase text-neutral-400 hover:text-black">← Presentation</Link>
            <PrintButton label="Print / Save PDF" />
          </div>
        </div>

        {/* Project label */}
        <div className="mb-3 text-center">
          <p className="text-[11px] tracking-widest uppercase font-semibold text-neutral-700">{projectLabel}</p>
        </div>

        {/* Editable chart table */}
        <ConfirmationChartTable
          rows={confirmed}
          photoMap={photoMap}
          agentMap={agentMap}
          projectRate={project.model_rate || null}
          projectUsage={project.usage || null}
          projectDate={project.shoot_date || null}
          shootDate={shootDate}
          showCol={showCol}
          isMember={isMember || hasShareAccess}
        />


        {/* Footer */}
        <div className="no-print mt-12 pt-6 border-t border-neutral-100 text-center">
          <p className="text-xs text-neutral-300 tracking-wider">
            Tasha Tongpreecha Casting &middot;{' '}
            <a href="https://www.tashatongpreecha.com" target="_blank" rel="noopener noreferrer"
              className="hover:text-neutral-400 transition-colors">tashatongpreecha.com</a>
          </p>
        </div>
      </div>
    </>
  )
}
