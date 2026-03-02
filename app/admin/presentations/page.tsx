import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export default async function PresentationsPage() {
  const supabase = await createClient()
  const { data: presentations } = await supabase
    .from('presentations')
    .select('*, projects(name)')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-2xl font-light tracking-widest uppercase">Presentations</h1>
        <Link href="/admin/presentations/new"><Button>New Presentation</Button></Link>
      </div>
      <div className="divide-y divide-neutral-100">
        {presentations?.map(p => (
          <div key={p.id} className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-medium">{p.name}</p>
              <p className="text-xs text-neutral-400">{(p.projects as any)?.name} · <Badge>{p.is_published ? 'Published' : 'Draft'}</Badge></p>
            </div>
            <div className="flex gap-4">
              <Link href={`/client/presentations/${p.id}`} target="_blank" className="text-xs tracking-wider uppercase text-neutral-400 underline">Preview</Link>
              <Link href={`/admin/presentations/${p.id}`} className="text-xs tracking-wider uppercase underline">Edit</Link>
            </div>
          </div>
        ))}
        {!presentations?.length && <p className="py-8 text-sm text-neutral-400">No presentations yet.</p>}
      </div>
    </div>
  )
}
