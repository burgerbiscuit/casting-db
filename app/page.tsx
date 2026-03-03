import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <img src="/logo.jpg" alt="Tasha Tongpreecha Casting" className="h-8 w-auto mx-auto mb-16" />

        <div className="space-y-4">
          <Link href="/admin"
            className="block w-full py-4 px-8 bg-black text-white text-xs tracking-[0.2em] uppercase hover:opacity-70 transition-opacity">
            Casting Team
          </Link>
          <Link href="/client/login"
            className="block w-full py-4 px-8 border border-black text-xs tracking-[0.2em] uppercase hover:bg-black hover:text-white transition-colors">
            Client Login
          </Link>
        </div>
      </div>
    </main>
  )
}
