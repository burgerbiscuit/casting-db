import { createClient } from '@/lib/supabase/server'
import { PresentationViewer } from '@/components/PresentationViewer'
import Link from 'next/link'
import { Download } from 'lucide-react'

export default async function PresentationView({ params }: { params: { id: string } }) {
  const { id } = params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: presentation } = await supabase
    .from('presentations').select('*, projects(name)').eq('id', id).single()

  const { data: presentationModels } = await supabase
    .from('presentation_models')
    .select('*, models(*)')
    .eq('presentation_id', id)
    .eq('is_visible', true)
    .order('display_order')

  const modelIds = (presentationModels || []).map((pm: any) => pm.model_id)
  const { data: allMedia } = await supabase
    .from('model_media').select('*').in('model_id', modelIds).order('display_order')

  const { data: shortlists } = await supabase
    .from('client_shortlists').select('*').eq('presentation_id', id).eq('client_id', user?.id)

  const shortlistMap: Record<string, any> = {}
  ;(shortlists || []).forEach(s => { shortlistMap[s.model_id] = s })

  const mediaByModel: Record<string, any[]> = {}
  ;(allMedia || []).forEach(m => {
    if (!mediaByModel[m.model_id]) mediaByModel[m.model_id] = []
    mediaByModel[m.model_id].push(m)
  })

  if (!presentation) return <div>Presentation not found.</div>

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <Link href="/client" className="label hover:text-black">← Projects</Link>
          <h1 className="text-2xl font-light tracking-widest uppercase mt-2">{presentation.name}</h1>
          <p className="text-sm text-neutral-400">{(presentation.projects as any)?.name}</p>
        </div>
        <a href={`/api/pdf/${id}`} download
          className="flex items-center gap-2 text-xs tracking-widest uppercase border border-black px-4 py-3 hover:bg-black hover:text-white transition-colors">
          <Download size={12} /> Download PDF
        </a>
      </div>

      <PresentationViewer
        presentationModels={presentationModels || []}
        mediaByModel={mediaByModel}
        presentationId={id}
        clientId={user?.id || ''}
        shortlistMap={shortlistMap}
        presentationName={presentation.name}
        projectName={(presentation.projects as any)?.name || ''}
      />
    </div>
  )
}
