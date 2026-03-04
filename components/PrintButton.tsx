'use client'

export function PrintButton({ label = 'Print / Save PDF' }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="text-[11px] tracking-widest uppercase border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors print:hidden"
    >
      {label}
    </button>
  )
}
