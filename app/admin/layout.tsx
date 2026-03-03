'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, FolderOpen, Users, UserCheck, Settings, LogOut, Building2, Clapperboard, CalendarDays } from 'lucide-react'
import { useEffect, useState } from 'react'

const TASHA_USER_ID = 'f5fe2bb4-f429-4978-a052-6f00cc614ff8'

const baseNav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/projects', label: 'Projects', icon: FolderOpen },
  { href: '/admin/calendar', label: 'Calendar', icon: Calendar },
  { href: '/admin/models', label: 'Models', icon: Users },
  { href: '/admin/agencies/contacts', label: 'Model Agencies', icon: Building2 },
  { href: '/admin/clients', label: 'Clients', icon: UserCheck },
  { href: '/admin/team', label: 'Team', icon: Settings },
]

const productionNav = { href: '/admin/agencies/production', label: 'Production Contacts', icon: Clapperboard }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isTasha, setIsTasha] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsTasha(user?.id === TASHA_USER_ID)
    })
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const nav = isTasha ? [...baseNav, productionNav] : baseNav

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r border-neutral-200 flex flex-col fixed inset-y-0">
        <div className="px-6 py-8 border-b border-neutral-100">
          <p className="text-xs font-medium tracking-widest uppercase">TTC</p>
          <p className="text-[10px] text-neutral-400 tracking-widest uppercase mt-1">Admin</p>
        </div>
        <nav className="flex-1 px-3 py-6 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = path === href || (href !== '/admin' && path.startsWith(href))
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 text-xs tracking-wider uppercase transition-colors ${active ? 'bg-black text-white' : 'text-neutral-500 hover:text-black hover:bg-neutral-50'}`}>
                <Icon size={14} />
                {label}
              </Link>
            )
          })}
        </nav>
        <div className="px-3 py-6 border-t border-neutral-100">
          <button onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 w-full text-xs tracking-wider uppercase text-neutral-400 hover:text-black transition-colors">
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>
      <main className="ml-56 flex-1 p-10 min-h-screen">
        {children}
      </main>
    </div>
  )
}
