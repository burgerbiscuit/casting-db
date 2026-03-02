export function Badge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-block text-[10px] tracking-widest uppercase font-medium px-2 py-1 bg-neutral-100 text-neutral-600 ${className}`}>
      {children}
    </span>
  )
}
