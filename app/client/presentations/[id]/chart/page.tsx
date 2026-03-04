import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PrintButton } from '@/components/PrintButton'

export default async function ConfirmationChartPage({ params }: { params: { id: string } }) {
  const { id } = params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/client/login')

  const serviceSupabase = await createServiceClient()

  const { data: presentation } = await serviceSupabase
    .from('presentations')
    .select('*, projects(id, name, shoot_date, photographer, stylist, usage, model_rate)')
    .eq('id', id)
    .single()

  if (!presentation) return <div className="p-8 text-sm text-neutral-400">Presentation not found.</div>

  const project = presentation.projects as any

  // Access check: team member OR has client_projects access
  const { data: member } = await serviceSupabase.from('team_members').select('id').eq('user_id', user.id).single()
  if (!member) {
    const { data: access } = await serviceSupabase
      .from('client_projects')
      .select('id')
      .eq('client_id', user.id)
      .eq('project_id', project.id)
      .single()
    if (!access) redirect('/client')
  }

  // Fetch confirmed models (admin_confirmed = true) for this project
  const { data: projectModels } = await serviceSupabase
    .from('project_models')
    .select('*, models(id, first_name, last_name, agency, height_ft, height_in, bust, waist, hips, shoe_size)')
    .eq('project_id', project.id)
    .eq('admin_confirmed', true)

  const confirmed = projectModels || []
  const modelIds = confirmed.map((pm: any) => pm.models?.id).filter(Boolean)

  const { data: photos } = modelIds.length > 0 ? await serviceSupabase
    .from('model_media')
    .select('model_id, public_url')
    .in('model_id', modelIds)
    .eq('is_visible', true)
    .eq('type', 'photo')
    .order('display_order') : { data: [] }

  const photoMap = new Map<string, string>()
  ;(photos || []).forEach((p: any) => { if (!photoMap.has(p.model_id)) photoMap.set(p.model_id, p.public_url) })

  const shootDate = project.shoot_date
    ? new Date(project.shoot_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-10 print:mb-6">
        <Link href="/client" className="text-[11px] tracking-widest uppercase text-neutral-400 hover:text-black print:hidden">
          ← Projects
        </Link>
        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] tracking-widest uppercase text-neutral-400 mb-1">{project.name}</p>
            <h1 className="text-2xl font-light tracking-widest uppercase">Confirmation Chart</h1>
            {shootDate && <p className="text-sm text-neutral-400 mt-1">{shootDate}</p>}
          </div>
          <div className="flex items-center gap-3 print:hidden">
            <Link href={`/client/presentations/${id}`}
              className="text-[11px] tracking-widest uppercase text-neutral-400 hover:text-black">
              ← Presentation
            </Link>
            <PrintButton />
          </div>
        </div>

        {/* Project specs row */}
        {(project.photographer || project.stylist || project.usage || project.model_rate) && (
          <div className="mt-5 pt-5 border-t border-neutral-100 flex flex-wrap gap-6">
            {project.photographer && (
              <div>
                <p className="text-[9px] tracking-widest uppercase text-neutral-400">Photographer</p>
                <p className="text-xs mt-0.5">{project.photographer}</p>
              </div>
            )}
            {project.stylist && (
              <div>
                <p className="text-[9px] tracking-widest uppercase text-neutral-400">Stylist</p>
                <p className="text-xs mt-0.5">{project.stylist}</p>
              </div>
            )}
            {project.usage && (
              <div>
                <p className="text-[9px] tracking-widest uppercase text-neutral-400">Usage</p>
                <p className="text-xs mt-0.5">{project.usage}</p>
              </div>
            )}
            {project.model_rate && (
              <div>
                <p className="text-[9px] tracking-widest uppercase text-neutral-400">Rate</p>
                <p className="text-xs mt-0.5">{project.model_rate}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmed count */}
      {confirmed.length > 0 && (
        <p className="text-[11px] tracking-widest uppercase text-neutral-400 mb-5">
          {confirmed.length} Confirmed Talent
        </p>
      )}

      {/* Model grid */}
      {confirmed.length === 0 ? (
        <div className="border border-dashed border-neutral-200 p-12 text-center">
          <p className="text-xs tracking-widest uppercase text-neutral-300">No confirmed talent yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {confirmed.map((pm: any) => {
            const model = pm.models
            const photo = photoMap.get(model?.id)
            const heightFt = model?.height_ft
            const heightIn = model?.height_in ?? 0
            const height = heightFt ? `${heightFt}'${heightIn}"` : null
            const sizing = [model?.bust, model?.waist, model?.hips].filter(Boolean).join(' / ')

            return (
              <div key={pm.id} className="border border-neutral-100">
                {/* Photo */}
                <div className="aspect-[3/4] bg-neutral-50 relative overflow-hidden">
                  {photo ? (
                    <img
                      src={photo}
                      alt={`${model?.first_name} ${model?.last_name}`}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-[10px] tracking-widest uppercase text-neutral-300">No Photo</span>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 bg-green-600 text-white text-[8px] tracking-widest uppercase px-1.5 py-0.5">
                    ✓ Confirmed
                  </div>
                </div>

                {/* Details */}
                <div className="p-3 space-y-0.5">
                  <p className="text-xs font-medium tracking-wide">
                    {model?.first_name} {model?.last_name}
                  </p>
                  {model?.agency && (
                    <p className="text-[10px] text-neutral-500">{model.agency}</p>
                  )}
                  {height && (
                    <p className="text-[10px] text-neutral-400 mt-1">{height}</p>
                  )}
                  {sizing && (
                    <p className="text-[10px] text-neutral-400">{sizing}</p>
                  )}
                  {pm.pm_option && (
                    <p className="text-[10px] text-neutral-500 mt-1.5 pt-1.5 border-t border-neutral-100">
                      {pm.pm_option}
                    </p>
                  )}
                  {pm.pm_rate && (
                    <p className="text-[10px] text-neutral-500">{pm.pm_rate}</p>
                  )}
                  {pm.pm_location && (
                    <p className="text-[10px] text-neutral-400">{pm.pm_location}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Footer */}
      <div className="mt-16 pt-8 border-t border-neutral-100 text-center">
        <p className="text-xs text-neutral-300 tracking-wider">
          Tasha Tongpreecha Casting &middot;{' '}
          <a href="https://www.tashatongpreecha.com" target="_blank" rel="noopener noreferrer"
            className="hover:text-neutral-400 transition-colors">
            tashatongpreecha.com
          </a>
        </p>
      </div>
    </div>
  )
}
