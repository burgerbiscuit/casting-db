'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search } from 'lucide-react'

export default function AgencyContactsPage() {
  const supabase = createClient()
  const [contacts, setContacts] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [section, setSection] = useState('ALL')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true)
      let q = supabase.from('agency_contacts').select('*').order('agency_name').limit(500)
      if (search) q = q.or(`agency_name.ilike.%${search}%,agent_name.ilike.%${search}%,email.ilike.%${search}%,board.ilike.%${search}%`)
      if (section !== 'ALL') q = q.eq('section', section)
      const { data } = await q
      setContacts(data || [])
      setLoading(false)
    }, 300)
    return () => clearTimeout(t)
  }, [search, section])

  const sections = ['ALL', 'MAIN', 'MATURE', 'PLUS', 'COMMERCIAL', 'STREET SCOUTING']

  return (
    <div>
      <h1 className="text-2xl font-light tracking-widest uppercase mb-2">Agent Contacts</h1>
      <p className="text-sm text-neutral-400 mb-8">{contacts.length} contacts</p>

      <div className="flex gap-4 mb-6 flex-wrap">
        {sections.map(s => (
          <button key={s} onClick={() => setSection(s)}
            className={`text-xs tracking-widest uppercase px-3 py-1.5 border transition-colors ${section === s ? 'bg-black text-white border-black' : 'border-neutral-300 hover:border-black'}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="relative mb-6 max-w-md">
        <Search size={14} className="absolute left-0 top-3 text-neutral-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search agency, agent, board..."
          className="w-full pl-5 border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none focus:border-black placeholder:text-neutral-400" />
      </div>

      {loading ? <p className="text-xs text-neutral-400">Loading...</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left label py-2 pr-6">Agency</th>
                <th className="text-left label py-2 pr-6">Agent</th>
                <th className="text-left label py-2 pr-6">Board</th>
                <th className="text-left label py-2 pr-6">Email</th>
                <th className="text-left label py-2 pr-6">Cell</th>
                <th className="text-left label py-2">Section</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map(c => (
                <tr key={c.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                  <td className="py-2.5 pr-6 font-medium">{c.agency_name}</td>
                  <td className="py-2.5 pr-6 text-neutral-600">{c.agent_name || '—'}</td>
                  <td className="py-2.5 pr-6 text-neutral-500 text-xs">{c.board || '—'}</td>
                  <td className="py-2.5 pr-6">
                    {c.email ? <a href={`mailto:${c.email}`} className="underline underline-offset-2 hover:opacity-60">{c.email}</a> : '—'}
                  </td>
                  <td className="py-2.5 pr-6 text-neutral-500">{c.cell_phone || '—'}</td>
                  <td className="py-2.5 text-xs text-neutral-400">{c.section}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
