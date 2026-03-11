'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check } from 'lucide-react'

export default function ReviewsPage() {
  const supabase = createClient()
  const [models, setModels] = useState<any[]>([])
  const [agents, setAgents] = useState<any[]>([])
  const [others, setOthers] = useState<any[]>([])
  const [tab, setTab] = useState<'models' | 'agents' | 'other'>('models')

  const load = async () => {
    const [{ data: m }, { data: a }, { data: o }] = await Promise.all([
      supabase.from('models').select('id, first_name, last_name, created_at, agency, instagram_handle, source').eq('reviewed', false).order('created_at', { ascending: false }),
      supabase.from('agent_submissions').select('*').eq('reviewed', false).order('created_at', { ascending: false }),
      supabase.from('other_submissions').select('*').eq('reviewed', false).order('created_at', { ascending: false }),
    ])
    setModels(m || [])
    setAgents(a || [])
    setOthers(o || [])
  }

  useEffect(() => { load() }, [])

  const markReviewed = async (table: string, id: string) => {
    await supabase.from(table).update({ reviewed: true }).eq('id', id)
    // If approving an agent submission, also add to agency_contacts
    if (table === 'agent_submissions') {
      const submission = agents.find((a: any) => a.id === id)
      if (submission) {
        // Check if this email already exists to avoid duplicates
        const email = submission.email?.toLowerCase() || null
        let existingId: string | null = null
        if (email) {
          const { data: existing } = await supabase.from('agency_contacts').select('id').eq('email', email).maybeSingle()
          existingId = existing?.id || null
        }
        if (existingId) {
          // Update existing contact
          await supabase.from('agency_contacts').update({
            agent_name: `${submission.first_name} ${submission.last_name}`.trim(),
            agency_name: submission.agency_name,
            city: submission.city || null,
            board: submission.boards || null,
          }).eq('id', existingId)
        } else {
          // Insert new contact
          await supabase.from('agency_contacts').insert({
            agent_name: `${submission.first_name} ${submission.last_name}`.trim(),
            agency_name: submission.agency_name,
            email: email,
            city: submission.city || null,
            contact_type: 'model',
            board: submission.boards || null,
          })
        }
      }
    }
    load()
  }

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const TabBtn = ({ id, label, count }: { id: any, label: string, count: number }) => (
    <button onClick={() => setTab(id)}
      className={`px-6 py-3 text-xs tracking-widest uppercase transition-colors border-b-2 -mb-[1px] ${tab === id ? 'border-black text-black' : 'border-transparent text-neutral-400 hover:text-black'}`}>
      {label} {count > 0 && <span className="ml-1 bg-black text-white text-[9px] px-1.5 py-0.5">{count}</span>}
    </button>
  )

  return (
    <div>
      <h1 className="text-2xl font-light tracking-widest uppercase mb-4">Pending Reviews</h1>

      <div className="flex border-b border-neutral-200 mb-4">
        <TabBtn id="models" label="Models" count={models.length} />
        <TabBtn id="agents" label="Agents" count={agents.length} />
        <TabBtn id="other" label="Other" count={others.length} />
      </div>

      {tab === 'models' && (
        <div className="divide-y divide-neutral-100">
          {models.length === 0 && <p className="text-xs text-neutral-400 py-4">All caught up</p>}
          {models.map(m => (
            <div key={m.id} className="flex items-center justify-between py-4">
              <div>
                <p className="text-sm font-medium">{m.first_name} {m.last_name}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{m.agency || '—'} · {m.instagram_handle ? `@${m.instagram_handle}` : '—'} · {m.source || 'scouting'} · Submitted {fmt(m.created_at)}</p>
              </div>
              <div className="flex items-center gap-3">
                <a href={`/admin/models/${m.id}`} className="text-[10px] tracking-widest uppercase text-neutral-400 hover:text-black border border-neutral-200 px-3 py-1.5 hover:border-black transition-colors">View Profile</a>
                <button onClick={() => markReviewed('models', m.id)} className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase bg-black text-white px-3 py-1.5 hover:bg-neutral-800 transition-colors">
                  <Check size={10} /> Mark Reviewed
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'agents' && (
        <div className="divide-y divide-neutral-100">
          {agents.length === 0 && <p className="text-xs text-neutral-400 py-4">All caught up</p>}
          {agents.map(a => (
            <div key={a.id} className="flex items-center justify-between py-4">
              <div>
                <p className="text-sm font-medium">{a.first_name} {a.last_name} <span className="font-normal text-neutral-500">— {a.agency_name}</span></p>
                <p className="text-xs text-neutral-400 mt-0.5">{a.email} · {a.city || '—'} · {a.boards || '—'} · Submitted {fmt(a.created_at)}</p>
                {a.notes && <p className="text-xs text-neutral-500 mt-1 italic">"{a.notes}"</p>}
              </div>
              <button onClick={() => markReviewed('agent_submissions', a.id)} className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase bg-black text-white px-3 py-1.5 hover:bg-neutral-800 transition-colors ml-4 flex-shrink-0">
                <Check size={10} /> Mark Reviewed
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'other' && (
        <div className="divide-y divide-neutral-100">
          {others.length === 0 && <p className="text-xs text-neutral-400 py-4">All caught up</p>}
          {others.map(o => (
            <div key={o.id} className="flex items-center justify-between py-4">
              <div>
                <p className="text-sm font-medium">{o.first_name} {o.last_name} <span className="font-normal text-neutral-500">— {o.role}{o.company ? `, ${o.company}` : ''}</span></p>
                <p className="text-xs text-neutral-400 mt-0.5">{o.email} · {o.city || '—'} · {o.instagram ? `@${o.instagram}` : '—'} · Submitted {fmt(o.created_at)}</p>
                {o.notes && <p className="text-xs text-neutral-500 mt-1 italic">"{o.notes}"</p>}
              </div>
              <button onClick={() => markReviewed('other_submissions', o.id)} className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase bg-black text-white px-3 py-1.5 hover:bg-neutral-800 transition-colors ml-4 flex-shrink-0">
                <Check size={10} /> Mark Reviewed
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
