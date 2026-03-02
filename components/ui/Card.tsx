export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-neutral-200 ${className}`}>
      {children}
    </div>
  )
}
