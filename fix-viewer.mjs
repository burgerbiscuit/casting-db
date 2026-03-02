import { readFileSync, writeFileSync } from 'fs'

let c = readFileSync('/Users/tasha/Projects/casting-db/components/PresentationViewer.tsx', 'utf8')

c = c.replace(
  `        <div className="flex flex-col items-center" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          {/* Progress + shortlist indicator */}
          <div className="flex items-center justify-between w-full max-w-2xl mb-4">
            <p className="label">{slideIndex + 1} / {sorted.length}</p>
            {shortlists[current.model_id] && (
              <span className="flex items-center gap-1 text-xs tracking-widest uppercase">
                <Heart size={10} className="fill-black text-black" /> Shortlisted
              </span>
            )}
          </div>

          <div className="w-full max-w-2xl">`,
  `        <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <p className="label mb-4">{slideIndex + 1} / {sorted.length}</p>
          <div className="w-full">`
)

writeFileSync('/Users/tasha/Projects/casting-db/components/PresentationViewer.tsx', c)
console.log('step1 done')
