'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'
import { Search, Mail, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ContactEditModal } from '@/components/ContactEditModal'

export default function ProductionContactsPage() {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/admin'); return }
      const { data: member } = await supabase.from('team_members').select('id').eq('user_id', user.id).single()
      if (!member) router.replace('/admin')
    })
  }, [])

  // Needs Review = any contact flagged by AI import (needs_review=true in DB)

  const [contacts, setContacts] = useState<any[]>([])
  const [reviewContacts, setReviewContacts] = useState<any[]>([])
  const [allContacts, setAllContacts] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('ALL')
  const [board, setBoard] = useState('ALL')
  const [section, setSection] = useState('ALL')
  const [gender, setGender] = useState('ALL')
  const [cities, setCities] = useState<string[]>([])
  const [boards, setBoards] = useState<string[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [editTarget, setEditTarget] = useState<any>(null)
  const [showComposer, setShowComposer] = useState(false)
  const [copied, setCopied] = useState(false)
  const [emailDraft, setEmailDraft] = useState({ subject: '', message: '' })
  const [reviewCollapsed, setReviewCollapsed] = useState(false)

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    filterContacts()
  }, [search, city, board, section, gender, allContacts])

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/agency-contacts?type=production')
    if (res.status === 403) { window.location.href = '/admin'; return }
    const data = await res.json()
    if (Array.isArray(data)) {
      setAllContacts(data)
      const uniqueCities = [...new Set(data.map((c: any) => c.city).filter(Boolean))].sort()
      const uniqueBoards = [...new Set(data.map((c: any) => c.board).filter(Boolean))].sort()
      setCities(uniqueCities as string[])
      setBoards(uniqueBoards as string[])
    }
    setLoading(false)
  }

  const filterContacts = () => {
    let filtered = allContacts
    
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(c => 
        c.agency_name.toLowerCase().includes(q) ||
        (c.agent_name && c.agent_name.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.board && c.board.toLowerCase().includes(q))
      )
    }
    
    if (city !== 'ALL') filtered = filtered.filter(c => c.city === city)
    if (board !== 'ALL') filtered = filtered.filter(c => c.board === board)
    if (section !== 'ALL') filtered = filtered.filter(c => c.section === section)
    if (gender !== 'ALL') filtered = filtered.filter(c => c.gender === gender)

    const review = filtered.filter(c => c.needs_review === true)
    const rest = filtered.filter(c => !c.needs_review)
    
    setReviewContacts(review)
    setContacts(rest)
  }

  const toggleSelect = (id: string) => {
    const newSet = new Set(selected)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelected(newSet)
  }

  const selectedContacts = contacts.filter(c => selected.has(c.id))
  const selectedEmails = selectedContacts.map(c => c.email).filter(Boolean)

  const sendEmails = async () => {
    if (!selectedEmails.length || !emailDraft.subject) {
      alert('Select agents and enter a subject')
      return
    }

    // Create mailto link with BCC
    const subject = encodeURIComponent(emailDraft.subject)
    const body = encodeURIComponent(emailDraft.message)
    const bcc = encodeURIComponent(selectedEmails.join(','))
    
    // Open mailto (most email clients support this)
    window.location.href = `mailto:?bcc=${bcc}&subject=${subject}&body=${body}`
    setShowComposer(false)
    setSelected(new Set())
  }

  const sections = ['ALL', 'WOMEN NY', 'MENS NY', 'WOMEN PARIS', 'MENS PARIS', 'WOMEN LONDON', 'MENS LONDON', 'WOMEN LA', 'MEN LA', 'TOKYO', 'MIAMI', 'SPAIN', 'MILAN', 'ITALY', 'MEXICO', 'TEXAS', 'GERMANY', 'MISC', 'CELEB', 'NY PRODUCTION', 'PARIS PRODUCTION', 'PRODUCTION ', 'DANCE ATHLETE', 'SPORTS', 'KIDS', 'PHOTOGRAPHERS', 'STYLIST', 'ART DIRECTORS', 'CASTING CALLS', 'MUSIC']

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-light tracking-widest uppercase mb-1">Production Contacts</h1>
          <p className="text-sm text-neutral-400">{contacts.length + reviewContacts.length} agents</p>
        </div>
        {selected.size > 0 && (
          <button onClick={() => setShowComposer(true)}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-sm text-xs tracking-widest uppercase hover:opacity-80 transition-opacity">
            <Mail size={14} /> Email {selected.size}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div>
          <label className="label text-[10px] block mb-1">GENDER</label>
          <select value={gender} onChange={e => setGender(e.target.value)}
            className="text-xs border border-neutral-300 px-3 py-1.5 focus:outline-none focus:border-black">
            <option value="ALL">ALL</option>
            <option value="Women">Women</option>
            <option value="Men">Men</option>
          </select>
        </div>

        <div>
          <label className="label text-[10px] block mb-1">SECTION</label>
          <select value={section} onChange={e => setSection(e.target.value)}
            className="text-xs border border-neutral-300 px-3 py-1.5 focus:outline-none focus:border-black">
            {sections.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        
        <div>
          <label className="label text-[10px] block mb-1">CITY</label>
          <select value={city} onChange={e => setCity(e.target.value)}
            className="text-xs border border-neutral-300 px-3 py-1.5 focus:outline-none focus:border-black">
            <option value="ALL">ALL CITIES</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="label text-[10px] block mb-1">BOARD</label>
          <select value={board} onChange={e => setBoard(e.target.value)}
            className="text-xs border border-neutral-300 px-3 py-1.5 focus:outline-none focus:border-black max-w-xs">
            <option value="ALL">ALL BOARDS</option>
            {boards.slice(0, 50).map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search size={14} className="absolute left-0 top-3 text-neutral-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search agency, agent, email..."
          className="w-full pl-5 border-b border-neutral-300 bg-transparent py-2 text-sm focus:outline-none focus:border-black placeholder:text-neutral-400" />
      </div>

      {/* Contacts table */}
      {loading ? <p className="text-xs text-neutral-400">Loading...</p> : (
        <>
          {/* NEEDS REVIEW section */}
          {reviewContacts.length > 0 && (
            <div className="mb-8">
              <button
                onClick={() => setReviewCollapsed(v => !v)}
                className="flex items-center gap-3 w-full mb-3 group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] tracking-widest uppercase font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-sm">
                    ⚠ Needs Review
                  </span>
                  <span className="text-[10px] text-neutral-400">{reviewContacts.length} contacts added by AI — verify before use</span>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <button
                    onClick={async (e) => {
                      e.stopPropagation()
                      const ids = selected.size > 0
                        ? reviewContacts.filter(c => selected.has(c.id)).map(c => c.id)
                        : reviewContacts.map(c => c.id)
                      await Promise.all(ids.map(id => supabase.from('agency_contacts').update({ needs_review: false }).eq('id', id)))
                      setSelected(new Set())
                      load()
                    }}
                    className="text-[9px] tracking-widest uppercase px-2 py-1 border border-amber-300 text-amber-700 hover:bg-amber-100 transition-colors">
                    {selected.size > 0 ? `✓ Mark ${selected.size} Reviewed` : '✓ Mark All Reviewed'}
                  </button>
                  <span className="text-[10px] text-neutral-400 group-hover:text-black transition-colors">
                    {reviewCollapsed ? '▼ Show' : '▲ Hide'}
                  </span>
                </div>
              </button>

              {!reviewCollapsed && (
                <div className="space-y-0 border border-amber-100">
                  {reviewContacts.map((c, i) => (
                    <div key={c.id} className={`flex items-start gap-4 px-4 py-3 border-b border-amber-50 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-amber-50/20'}`}>
                      {/* Info */}
                      <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-5 gap-x-5 gap-y-0.5">
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate">{c.agency_name}</p>
                          {c.agent_name && c.agent_name !== c.agency_name && (
                            <p className="text-[11px] text-neutral-500 truncate">{c.agent_name}</p>
                          )}
                          {c.city && <p className="text-[10px] text-neutral-400">{c.city}</p>}
                        </div>
                        <div className="min-w-0 md:col-span-2">
                          {c.section && <p className="text-[11px] text-neutral-600 truncate">{c.section}</p>}
                          {c.description && <p className="text-[10px] text-neutral-400 line-clamp-2">{c.description}</p>}
                          {!c.section && !c.description && c.board && <p className="text-[10px] text-neutral-400 truncate">{c.board}</p>}
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          {c.email ? (
                            <a href={`mailto:${c.email}`} className="text-[11px] underline underline-offset-2 hover:opacity-60 truncate block">{c.email}</a>
                          ) : <span className="text-[11px] text-neutral-300">No email</span>}
                          {(c.office_phone || (c.cell_phone && !c.cell_phone.startsWith('@'))) && (
                            <p className="text-[11px] text-neutral-500">{c.office_phone || c.cell_phone}</p>
                          )}
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          {c.website && (
                            <a href={c.website.startsWith('http') ? c.website : `https://${c.website}`} target="_blank" rel="noopener noreferrer"
                              className="text-[11px] underline underline-offset-2 hover:opacity-60 truncate block">
                              {c.website.replace(/^https?:\/\/(www\.)?/, '')}
                            </a>
                          )}
                          {(c.instagram || c.cell_phone?.startsWith('@')) && (
                            <a href={`https://instagram.com/${(c.instagram || c.cell_phone).replace('@','')}`} target="_blank" rel="noopener noreferrer"
                              className="text-[11px] text-neutral-500 hover:opacity-60 truncate block">
                              {(c.instagram || c.cell_phone).startsWith('@') ? (c.instagram || c.cell_phone) : `@${c.instagram || c.cell_phone}`}
                            </a>
                          )}
                        </div>
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={async () => {
                            await supabase.from('agency_contacts').update({ needs_review: false }).eq('id', c.id)
                            setReviewContacts(prev => prev.filter(x => x.id !== c.id))
                            setContacts(prev => [...prev, { ...c, needs_review: false }])
                          }}
                          className="text-[10px] tracking-widest uppercase px-3 py-1.5 bg-black text-white hover:bg-neutral-700 transition-colors whitespace-nowrap">
                          ✓ Keep
                        </button>
                        <button
                          onClick={async () => {
                            await supabase.from('agency_contacts').delete().eq('id', c.id)
                            setReviewContacts(prev => prev.filter(x => x.id !== c.id))
                          }}
                          className="text-[10px] tracking-widest uppercase px-3 py-1.5 border border-red-200 text-red-400 hover:bg-red-50 transition-colors whitespace-nowrap">
                          ✗ Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  {reviewContacts.length === 0 && (
                    <p className="text-xs text-neutral-400 px-4 py-6 text-center">All contacts reviewed ✓</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Main contacts list */}
          {contacts.length > 0 && (
            <div className="border border-neutral-200 divide-y divide-neutral-100">
              {contacts.map((c, i) => {
                const igHandle = c.instagram || (c.cell_phone?.startsWith('@') ? c.cell_phone : null)
                const phone = c.office_phone || (!c.cell_phone?.startsWith('@') ? c.cell_phone : null)
                return (
                  <div key={c.id} className={`flex items-start gap-3 px-4 py-3 ${selected.has(c.id) ? 'bg-blue-50' : i % 2 === 0 ? 'bg-white' : 'bg-neutral-50/40'}`}>
                    <input type="checkbox"
                      checked={selected.has(c.id)}
                      onChange={() => toggleSelect(c.id)}
                      className="cursor-pointer mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-5 gap-x-5 gap-y-0.5">
                      {/* Col 1: Company + Name */}
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{c.agency_name}</p>
                        {c.agent_name && <p className="text-[11px] text-neutral-500 truncate">{c.agent_name}</p>}
                        {c.city && <p className="text-[10px] text-neutral-400">{c.city}</p>}
                      </div>
                      {/* Col 2: Role + Description */}
                      <div className="min-w-0 md:col-span-2">
                        {c.section && <p className="text-[11px] text-neutral-600 truncate">{c.section}</p>}
                        {c.description && <p className="text-[10px] text-neutral-400 line-clamp-2">{c.description}</p>}
                        {!c.section && !c.description && c.board && <p className="text-[10px] text-neutral-400 truncate">{c.board}</p>}
                      </div>
                      {/* Col 3: Contact info */}
                      <div className="min-w-0 space-y-0.5">
                        {c.email && (
                          c.email_invalid
                            ? <p className="text-[11px] text-red-400 line-through truncate">{c.email}</p>
                            : <a href={`mailto:${c.email}`} className="text-[11px] underline underline-offset-2 hover:opacity-60 truncate block">{c.email}</a>
                        )}
                        {phone && <p className="text-[11px] text-neutral-500">{phone}</p>}
                      </div>
                      {/* Col 4: Web + Instagram */}
                      <div className="min-w-0 space-y-0.5">
                        {c.website && (
                          <a href={c.website.startsWith('http') ? c.website : `https://${c.website}`} target="_blank" rel="noopener noreferrer"
                            className="text-[11px] underline underline-offset-2 hover:opacity-60 truncate block">
                            {c.website.replace(/^https?:\/\/(www\.)?/, '')}
                          </a>
                        )}
                        {igHandle && (
                          <a href={`https://instagram.com/${igHandle.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                            className="text-[11px] text-neutral-500 hover:opacity-60 truncate block">
                            {igHandle.startsWith('@') ? igHandle : `@${igHandle}`}
                          </a>
                        )}
                      </div>
                    </div>
                    <button onClick={() => setEditTarget(c)}
                      className="text-[10px] tracking-widest uppercase text-neutral-400 hover:text-black transition-colors flex-shrink-0 mt-0.5">
                      Edit
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {editTarget && (
        <ContactEditModal
          contact={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => { setEditTarget(null); load() }}
          onDeleted={() => { setEditTarget(null); load() }}
        />
      )}

      {/* Email composer modal */}
      {showComposer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-light tracking-widest uppercase">Email {selected.size} Agents</h2>
              <button onClick={() => setShowComposer(false)} className="text-neutral-400 hover:text-black">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="label block mb-2">TO (Read-only)</label>
                <div className="bg-neutral-50 border border-neutral-200 p-3 rounded text-xs text-neutral-600 max-h-24 overflow-y-auto">
                  {selectedEmails.join('; ')}
                </div>
              </div>

              <div>
                <label className="label block mb-2">SUBJECT</label>
                <input type="text" value={emailDraft.subject} onChange={e => setEmailDraft(d => ({ ...d, subject: e.target.value }))}
                  placeholder="Email subject line"
                  className="w-full border-b border-neutral-300 py-2 text-sm focus:outline-none focus:border-black" />
              </div>

              <div>
                <label className="label block mb-2">MESSAGE</label>
                <textarea value={emailDraft.message} onChange={e => setEmailDraft(d => ({ ...d, message: e.target.value }))}
                  placeholder="Your message..."
                  rows={8}
                  className="w-full border border-neutral-300 p-3 text-sm focus:outline-none focus:border-black resize-none" />
              </div>

              <p className="text-xs text-neutral-400 italic">
                Clicking Send will open your default email client. Review the message before sending.
              </p>

              <div className="flex gap-3">
                <Button onClick={sendEmails}>Send Emails</Button>
                <Button variant="ghost" onClick={() => setShowComposer(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
