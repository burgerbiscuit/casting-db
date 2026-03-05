import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { ProjectActions, PresentationDeleteButton } from './ProjectActions'

export default async function ProjectDashboard({ params }: { params: { projectId: string } }) {
  const { projectId } = params
  const supabase = await createClient()
  const serviceSupabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()

  const cookieStore = await cookies()
  const hasShareAccess = cookieStore.get(`share_project_${projectId}`)?.value === 'true'

  if (!user && !hasShareAccess) {
    redirect(`/client/login?redirect=/client/${projectId}`)
  }

  // Share-cookie guests get full visibility (same as team member) — they already authenticated with the password
  const isMember = hasShareAccess || (user ? !!(await serviceSupabase
    .from('team_members').select('id').eq('user_id', user.id).single()).data : false)

  // For real clients (not share guests), verify they have access to this project
  if (user && !isMember) {
    const { data: access } = await serviceSupabase
      .from('client_projects')
      .select('id')
      .eq('client_id', user.id)
      .eq('project_id', projectId)
      .single()

    if (!access) {
      redirect('/client')
    }
  }

  // Fetch project
  const { data: project } = await serviceSupabase
    .from('projects')
    .select('id, name, shoot_date, status')
    .eq('id', projectId)
    .single()

  if (!project) redirect('/client')

  // Fetch presentations
  const { data: presentations } = await serviceSupabase
    .from('presentations')
    .select('id, name, is_published, chart_approved')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  const visiblePresentations = isMember
    ? (presentations || [])
    : (presentations || []).filter((p: any) => p.is_published)

  // Fetch project_models to check for confirmation chart
  const { data: confirmedPms } = await serviceSupabase
    .from('project_models')
    .select('id')
    .eq('project_id', projectId)
    .eq('admin_confirmed', true)
  const hasConfirmed = (confirmedPms || []).length > 0
  const mainPres = visiblePresentations[0]
  const chartApproved = isMember
    ? hasConfirmed
    : (mainPres?.chart_approved === true && hasConfirmed)

  // Fetch estimates for this project
  const { data: estimates } = await serviceSupabase
    .from('estimates')
    .select('id, estimate_number, status, casting_fee, sign_token, signed_at, client_name, issue_date')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  // Fetch invoices for this project
  const { data: inv } = await serviceSupabase
    .from('invoices')
    .select('id, invoice_number, status, total, subtotal, due_date, client_name')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  const invoices: any[] = inv || []

  const signedEstimates = (estimates || []).filter((e: any) => e.status === 'signed' || e.signed_at)
  const unsignedEstimates = (estimates || []).filter((e: any) => e.status !== 'signed' && !e.signed_at && e.status !== 'draft')
  const outstandingInvoices = invoices.filter((i: any) => i.status === 'sent')
  const paidInvoices = invoices.filter((i: any) => i.status === 'paid')

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back */}
      <div className="mb-8">
        <Link href="/client" className="text-[10px] tracking-widest uppercase text-neutral-400 hover:text-black transition-colors">
          ← All Projects
        </Link>
      </div>

      {/* Header */}
      <div className="mb-12 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light tracking-widest uppercase mb-1">{project.name}</h1>
          {project.shoot_date && (
            <p className="text-sm text-neutral-400">
              {new Date(project.shoot_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>
        {isMember && (
          <ProjectActions projectId={projectId} projectStatus={project.status} />
        )}
      </div>

      {/* ── Presentations ── */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-[10px] tracking-widest uppercase text-neutral-500">Presentations</h2>
          <div className="flex-1 border-t border-neutral-100" />
        </div>

        {visiblePresentations.length === 0 ? (
          <p className="text-sm text-neutral-400">No presentations available yet.</p>
        ) : (
          <div className="space-y-2">
            {visiblePresentations.map((pres: any) => (
              <div key={pres.id} className="flex items-center border border-neutral-200 hover:border-neutral-400 transition-colors">
                <Link
                  href={`/client/presentations/${pres.id}`}
                  className="flex-1 flex items-center justify-between px-5 py-3.5"
                >
                  <span className="text-sm">{pres.name}</span>
                  <span className="text-xs tracking-widest uppercase text-neutral-400">View &rarr;</span>
                </Link>
                {isMember && (
                  <div className="border-l border-neutral-200 px-3 flex items-center gap-3">
                    <PresentationDeleteButton presId={pres.id} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Estimates ── */}
      {((estimates || []).length > 0 || isMember) && (
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-[10px] tracking-widest uppercase text-neutral-500">Estimates</h2>
            <div className="flex-1 border-t border-neutral-100" />
          </div>

          {(estimates || []).length === 0 ? (
            <p className="text-sm text-neutral-400">No estimates yet.</p>
          ) : (
            <div className="space-y-2">
              {/* Unsigned / awaiting signature */}
              {unsignedEstimates.map((est: any) => (
                <div key={est.id} className="flex items-center justify-between border border-amber-200 bg-amber-50/40 px-5 py-4">
                  <div>
                    <p className="text-xs tracking-widest uppercase font-medium">
                      {est.estimate_number || `Estimate`}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {fmt(est.casting_fee || 0)} &middot; Awaiting signature
                    </p>
                  </div>
                  <Link
                    href={`/sign/${est.sign_token}`}
                    className="text-[10px] tracking-widest uppercase bg-black text-white px-3 py-2 hover:opacity-70 transition-opacity"
                  >
                    Review & Sign
                  </Link>
                </div>
              ))}

              {/* Signed */}
              {signedEstimates.map((est: any) => (
                <div key={est.id} className="flex items-center justify-between border border-neutral-200 px-5 py-4">
                  <div>
                    <p className="text-xs tracking-widest uppercase font-medium flex items-center gap-2">
                      {est.estimate_number || `Estimate`}
                      <span className="text-green-600">✓ Signed</span>
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {fmt(est.casting_fee || 0)}
                      {est.signed_at && ` · ${new Date(est.signed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                    </p>
                  </div>
                  <Link
                    href={`/sign/${est.sign_token}`}
                    className="text-[10px] tracking-widest uppercase text-neutral-400 hover:text-black transition-colors"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Invoices ── */}
      {(invoices.length > 0 || isMember) && (
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-[10px] tracking-widest uppercase text-neutral-500">Invoices</h2>
            <div className="flex-1 border-t border-neutral-100" />
          </div>

          {invoices.length === 0 ? (
            <p className="text-sm text-neutral-400">No invoices yet.</p>
          ) : (
            <div className="space-y-2">
              {/* Outstanding */}
              {outstandingInvoices.map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between border border-neutral-300 px-5 py-4">
                  <div>
                    <p className="text-xs tracking-widest uppercase font-medium">
                      {inv.invoice_number || 'Invoice'}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {fmt(inv.total || inv.subtotal || 0)}
                      {inv.due_date && ` · Due ${new Date(inv.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                    </p>
                  </div>
                  <span className="text-[10px] tracking-widest uppercase text-neutral-500 border border-neutral-300 px-3 py-2">
                    Outstanding
                  </span>
                </div>
              ))}

              {/* Paid */}
              {paidInvoices.map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between border border-neutral-100 px-5 py-4 opacity-60">
                  <div>
                    <p className="text-xs tracking-widest uppercase font-medium flex items-center gap-2">
                      {inv.invoice_number || 'Invoice'}
                      <span className="text-green-600">✓ Paid</span>
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">{fmt(inv.total || inv.subtotal || 0)}</p>
                  </div>
                  <span className="text-[10px] tracking-widest uppercase text-neutral-300">Paid</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <div className="mt-16 pt-8 border-t border-neutral-100 text-center">
        <p className="text-xs text-neutral-300 tracking-wider">
          Tasha Tongpreecha Casting &middot;{' '}
          <a href="https://www.tashatongpreecha.com" target="_blank" rel="noopener noreferrer"
            className="hover:text-neutral-400 transition-colors">tashatongpreecha.com</a>
        </p>
      </div>
    </div>
  )
}


