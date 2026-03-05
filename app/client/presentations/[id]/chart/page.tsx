import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { PrintButton } from '@/components/PrintButton'

export default async function ConfirmationChartPage({ params, searchParams }: { params: { id: string }; searchParams: { hidden?: string } }) {
  const { id } = params
  const hiddenCols = new Set((searchParams.hidden || '').split(',').filter(Boolean))
  const showCol = (col: string) => !hiddenCols.has(col)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const cookieStore = await cookies()
  const hasShareAccess = cookieStore.get(`share_${id}`)?.value === 'true'
  if (!user && !hasShareAccess) redirect('/client/login')

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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[11px]" style={{ minWidth: 900 }}>
            {/* Project header */}
            <thead>
              <tr>
                <td colSpan={9} className="border border-neutral-800 bg-neutral-900 text-white text-center py-2.5 px-4 tracking-widest uppercase text-[11px] font-semibold">
                  {projectLabel}
                </td>
              </tr>
              <tr className="bg-neutral-100">
                {[
                  { key: 'photo', label: 'PHOTO' },
                  { key: '__name', label: 'NAME' },
                  { key: 'contact', label: 'CONTACT' },
                  { key: 'rate', label: 'RATE' },
                  { key: 'date', label: 'DATE' },
                  { key: 'size', label: 'SIZE' },
                  { key: 'usage', label: 'USAGE' },
                  { key: 'notes', label: "ADDITIONAL USAGE" },
                  { key: 'w9', label: 'W-9' },
                ].filter(c => c.key === '__name' || showCol(c.key)).map(({ label: col }) => (
                  <th key={col} className="border border-neutral-300 px-2 py-2 text-[9px] tracking-widest uppercase font-semibold text-neutral-600 text-center whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {confirmed.length === 0 && (
                <tr>
                  <td colSpan={9} className="border border-neutral-200 text-center py-8 text-neutral-400 text-xs tracking-widest uppercase">
                    No confirmed talent yet
                  </td>
                </tr>
              )}
              {confirmed.map((pm: any) => {
                const model = pm.models
                const photo = photoMap[model?.id]
                const agent = agentMap[(model?.agency || '').toLowerCase()]

                const heightFt = model?.height_ft
                const heightIn = model?.height_in ?? 0
                const height = heightFt ? `${heightFt}'${heightIn}"` : null
                const sizing = [
                  height ? `Height: ${height}` : null,
                  model?.bust ? `Bust: ${model.bust}` : null,
                  model?.waist ? `Waist: ${model.waist}` : null,
                  model?.hips ? `Hips: ${model.hips}` : null,
                  model?.shoe_size ? `Shoe: ${model.shoe_size}` : null,
                  model?.dress_size ? `Dress: ${model.dress_size}` : null,
                ].filter(Boolean)

                const displayDate = pm.confirmed_date || shootDate
                const displayRate = pm.pm_rate || project.model_rate
                const displayUsage = pm.confirmed_usage || project.usage
                const igHandle = (model?.instagram_handle || '').replace('@', '')
                const profileUrl = model?.portfolio_url
                  ? (model.portfolio_url.startsWith('http') ? model.portfolio_url : `https://${model.portfolio_url}`)
                  : igHandle ? `https://www.instagram.com/${igHandle}/` : null

                return (
                  <tr key={pm.id} className="border-b border-neutral-200 align-top">
                    {/* Photo — full bleed */}
                    {showCol('photo') && <td className="border border-neutral-200 p-0" style={{ width: 64, height: 80 }}>
                      {photo ? (
                        <img src={photo} alt={`${model?.first_name} ${model?.last_name}`}
                          className="block w-full h-full object-cover object-top"
                          style={{ width: 64, height: 80, display: 'block' }} />
                      ) : (
                        <div className="w-full h-full bg-neutral-100 flex items-center justify-center text-neutral-300 text-[8px]"
                          style={{ width: 64, height: 80 }}>—</div>
                      )}
                    </td>}

                    {/* Name — linked to portfolio or instagram */}
                    <td className="border border-neutral-200 px-3 py-2.5 text-center align-middle" style={{ width: 90 }}>
                      {profileUrl ? (
                        <a href={profileUrl} target="_blank" rel="noopener noreferrer"
                          className="text-[11px] tracking-wide text-neutral-800 underline font-medium hover:text-black">
                          {model?.first_name?.toUpperCase()}
                          {model?.last_name ? <><br />{model.last_name.toUpperCase()}</> : null}
                        </a>
                      ) : (
                        <p className="text-[11px] tracking-wide text-neutral-800 font-medium">
                          {model?.first_name?.toUpperCase()}
                          {model?.last_name ? <><br />{model.last_name.toUpperCase()}</> : null}
                        </p>
                      )}
                    </td>

                    {/* Contact */}
                    {showCol('contact') && <td className="border border-neutral-200 px-3 py-2.5" style={{ width: 160 }}>
                      {model?.agency && (
                        <p className="font-bold tracking-wide text-[11px] uppercase">{model.agency}</p>
                      )}
                      {agent?.agent_name && (
                        <p className="text-[11px] mt-0.5">{agent.agent_name}</p>
                      )}
                      {agent?.email && (
                        <p className="text-[10px] text-neutral-600">{agent.email}</p>
                      )}
                      {agent?.cell_phone && (
                        <p className="text-[10px] text-neutral-600">C: {agent.cell_phone}</p>
                      )}
                      {agent?.office_phone && (
                        <p className="text-[10px] text-neutral-600">O: {agent.office_phone}</p>
                      )}
                      {!agent && !model?.agency && (
                        <p className="text-neutral-300 text-[10px]">—</p>
                      )}
                    </td>}

                    {/* Rate */}
                    {showCol('rate') && <td className="border border-neutral-200 px-3 py-2.5 text-center align-middle font-medium" style={{ width: 110 }}>
                      <p className="text-[11px]">{displayRate || '—'}</p>
                    </td>}

                    {/* Date */}
                    {showCol('date') && <td className="border border-neutral-200 px-3 py-2.5 text-center align-middle" style={{ width: 80 }}>
                      <p className="text-[11px]">{displayDate || '—'}</p>
                    </td>}

                    {/* Size */}
                    {showCol('size') && <td className="border border-neutral-200 px-3 py-2.5 align-top" style={{ width: 110 }}>
                      {sizing.length > 0 ? (
                        <div className="space-y-0.5">
                          {sizing.map((s, i) => (
                            <p key={i} className="text-[10px] text-neutral-700">{s}</p>
                          ))}
                        </div>
                      ) : <p className="text-neutral-300 text-[10px]">—</p>}
                    </td>}

                    {/* Usage (after Size) */}
                    {showCol('usage') && <td className="border border-neutral-200 px-3 py-2.5 text-center align-middle" style={{ width: 110 }}>
                      <p className="text-[11px]">{displayUsage || '—'}</p>
                    </td>}

                    {/* Additional Usage / Notes */}
                    {showCol('notes') && <td className="border border-neutral-200 px-3 py-2.5 align-top" style={{ width: 200 }}>
                      <p className="text-[10px] text-neutral-700 whitespace-pre-line">{pm.confirmed_notes || '—'}</p>
                    </td>}

                    {/* W-9 */}
                    {showCol('w9') && <td className="border border-neutral-200 px-3 py-2.5 text-center align-middle" style={{ width: 70 }}>
                      {pm.w9_status ? (
                        <p className={`text-[10px] tracking-widest uppercase font-semibold ${pm.w9_status === 'RECEIVED' ? 'text-green-700' : 'text-neutral-500'}`}>
                          {pm.w9_status}
                        </p>
                      ) : (
                        <p className="text-neutral-300 text-[10px]">—</p>
                      )}
                    </td>}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

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
