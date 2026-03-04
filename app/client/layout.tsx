import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const serviceSupabase = await createServiceClient()
  const { data: isMember } = user
    ? await serviceSupabase.from('team_members').select('id').eq('user_id', user.id).single()
    : { data: null }

  return (
    <div className="min-h-screen bg-white">
      <header className="print:hidden border-b border-neutral-100 px-4 md:px-8 py-4 flex items-center justify-between">
        <img src="/logo.jpg" alt="Tasha Tongpreecha Casting" className="h-5 w-auto" />
        {isMember && (
          <Link href="/admin" className="text-[10px] tracking-widest uppercase text-neutral-400 hover:text-black transition-colors">
            ← Admin
          </Link>
        )}
      </header>
      <main className="px-4 md:px-8 py-6 md:py-10">{children}</main>
    </div>
  )
}
