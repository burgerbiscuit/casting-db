import Link from 'next/link'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-neutral-100 px-8 py-5">
        <p className="text-xs font-medium tracking-widest uppercase">Tasha Tongpreecha Casting</p>
      </header>
      <main className="px-8 py-10">{children}</main>
    </div>
  )
}
