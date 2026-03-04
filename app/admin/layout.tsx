'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { KeyRound, LayoutDashboard, FolderOpen, Users, UserCheck, Settings, LogOut, Building2, Clapperboard, CalendarDays, ClipboardList, Menu, X, BarChart3, BookOpen } from 'lucide-react'
import { useEffect, useState } from 'react'

const TASHA_USER_ID = '328944d5-bf72-424d-874b-8f21b363464a'

const baseNav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/projects', label: 'Projects', icon: FolderOpen },
  { href: '/admin/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/admin/reviews', label: 'Reviews', icon: ClipboardList },
  { href: '/admin/models', label: 'Models', icon: Users },
  { href: '/admin/agencies/contacts', label: 'Model Agencies', icon: Building2 },
  { href: '/admin/clients', label: 'Clients', icon: UserCheck },
  { href: '/admin/billing', label: 'Billing', icon: BarChart3 },
  { href: '/admin/resources', label: 'Resources', icon: BookOpen },
  { href: '/admin/team', label: 'Team', icon: Settings },
]

const productionNav = { href: '/admin/agencies/production', label: 'Production', icon: Clapperboard }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isTasha, setIsTasha] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsTasha(user?.id === TASHA_USER_ID)
    })
  }, [])

  // Close mobile nav on route change
  useEffect(() => { setMobileOpen(false) }, [path])

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const nav = isTasha ? [...baseNav, productionNav] : baseNav

  const NavLinks = () => (
    <>
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
    </>
  )

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-52 border-r border-neutral-200 flex-col fixed inset-y-0 z-30">
        <div className="px-6 py-6 border-b border-neutral-100">
          <p className="text-xs font-medium tracking-widest uppercase">TTC</p>
          <p className="text-[10px] text-neutral-400 tracking-widest uppercase mt-1">Admin</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <NavLinks />
        </nav>
        <div className="px-3 py-4 border-t border-neutral-100 space-y-0.5">
          <a href="/admin/reset-password"
            className="flex items-center gap-3 px-3 py-2.5 w-full text-xs tracking-wider uppercase text-neutral-400 hover:text-black transition-colors">
            <KeyRound size={14} />
            Change Password
          </a>
          <button onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 w-full text-xs tracking-wider uppercase text-neutral-400 hover:text-black transition-colors">
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-neutral-200 flex items-center justify-between px-4 py-3">
        <p className="text-xs font-medium tracking-widest uppercase">TTC Admin</p>
        <button onClick={() => setMobileOpen(o => !o)}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-0 left-0 bottom-0 w-64 bg-white flex flex-col pt-14">
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
              <NavLinks />
            </nav>
            <div className="px-3 py-4 border-t border-neutral-100 space-y-0.5">
              <a href="/admin/reset-password"
                className="flex items-center gap-3 px-3 py-2.5 w-full text-xs tracking-wider uppercase text-neutral-400 hover:text-black transition-colors">
                <KeyRound size={14} /> Change Password
              </a>
              <button onClick={logout}
                className="flex items-center gap-3 px-3 py-2.5 w-full text-xs tracking-wider uppercase text-neutral-400 hover:text-black transition-colors">
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="md:ml-52 flex-1 min-h-screen pt-14 md:pt-0">
        <div className="p-4 md:p-8 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  )
}
