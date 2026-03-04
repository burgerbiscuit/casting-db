import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClientLoginForm from './ClientLoginForm'

export default async function ClientLoginPage({
  searchParams,
}: {
  searchParams: { redirect?: string }
}) {
  const redirectTo = searchParams.redirect || '/client'

  const supabase = await createClient()
  const serviceSupabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Team members bypass — go directly to the intended destination
    const { data: member } = await serviceSupabase
      .from('team_members').select('id').eq('user_id', user.id).single()
    if (member) redirect(redirectTo)

    // Client already logged in — verify access if redirecting to a project
    redirect(redirectTo)
  }

  return <ClientLoginForm redirectTo={redirectTo} />
}
