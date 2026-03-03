import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function PresentationRedirect({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: pres } = await supabase.from('presentations').select('project_id').eq('id', params.id).single()
  if (pres?.project_id) redirect(`/admin/projects/${pres.project_id}?tab=presentation`)
  redirect('/admin/projects')
}
