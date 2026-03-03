import Link from 'next/link'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-neutral-100 px-4 md:px-8 py-4">
        <img src="/logo.jpg" alt="Tasha Tongpreecha Casting" className="h-5 w-auto" />
      </header>
      <main className="px-4 md:px-8 py-6 md:py-10">{children}</main>
    </div>
  )
}
