import Link from 'next/link'
import Image from 'next/image'

export default function DatabaseLanding() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-neutral-100 px-8 py-5">
        <img src="/logo.jpg" alt="Tasha Tongpreecha Casting" className="h-6 w-auto" />
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-2">Database</p>
        <h1 className="text-2xl font-light tracking-widest uppercase mb-4 text-center">Who Are You?</h1>
        <p className="text-xs text-neutral-500 mb-16 text-center max-w-sm">Select the option that best describes you to get started.</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
          <Link href="/database/talent"
            className="group border border-neutral-200 hover:border-black transition-all p-10 flex flex-col items-center gap-4 text-center">
            <span className="text-3xl">✦</span>
            <div>
              <p className="text-xs font-medium tracking-widest uppercase mb-1">Model / Talent</p>
              <p className="text-[10px] text-neutral-400 leading-relaxed">I am a model or talent looking to be considered for castings</p>
            </div>
          </Link>

          <Link href="/database/agent"
            className="group border border-neutral-200 hover:border-black transition-all p-10 flex flex-col items-center gap-4 text-center">
            <span className="text-3xl">◈</span>
            <div>
              <p className="text-xs font-medium tracking-widest uppercase mb-1">Agent</p>
              <p className="text-[10px] text-neutral-400 leading-relaxed">I represent talent and want to add my contact information</p>
            </div>
          </Link>

          <Link href="/database/other"
            className="group border border-neutral-200 hover:border-black transition-all p-10 flex flex-col items-center gap-4 text-center">
            <span className="text-3xl">◎</span>
            <div>
              <p className="text-xs font-medium tracking-widest uppercase mb-1">Other</p>
              <p className="text-[10px] text-neutral-400 leading-relaxed">Photographer, stylist, production, or other creative professional</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}
