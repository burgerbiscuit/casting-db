'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Mail, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ContactEditModal } from '@/components/ContactEditModal'

export default function ProductionContactsPage() {
  const supabase = createClient()
  const [contacts, setContacts] = useState<any[]>([])
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
        (c.email && c.email.toLowerCase().includes(q))
      )
    }
    
    if (city !== 'ALL') filtered = filtered.filter(c => c.city === city)
    if (board !== 'ALL') filtered = filtered.filter(c => c.board === board)
    if (section !== 'ALL') filtered = filtered.filter(c => c.section === section)
    if (gender !== 'ALL') filtered = filtered.filter(c => c.gender === gender)
    
    setContacts(filtered)
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
          <h1 className="text-2xl font-light tracking-widest uppercase mb-1">Agent Contacts</h1>
          <p className="text-sm text-neutral-400">{contacts.length} agents</p>
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
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left w-6 py-2"><input type="checkbox" 
                  checked={selected.size === contacts.length && contacts.length > 0}
                  onChange={() => {
                    if (selected.size === contacts.length) setSelected(new Set())
                    else setSelected(new Set(contacts.map(c => c.id)))
                  }} className="cursor-pointer" /></th>
                <th className="text-left label py-2 pr-6">Agency</th>
                <th className="text-left label py-2 pr-6">Agent</th>
                <th className="text-left label py-2 pr-6">Board</th>
                <th className="text-left label py-2 pr-6">City</th>
                <th className="text-left label py-2 pr-6">Email</th>
                <th className="text-left label py-2">Cell</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map(c => (
                <tr key={c.id} className={`border-b border-neutral-100 hover:bg-neutral-50 ${selected.has(c.id) ? 'bg-blue-50' : ''}`}>
                  <td className="py-2.5 px-2"><input type="checkbox" 
                    checked={selected.has(c.id)}
                    onChange={() => toggleSelect(c.id)}
                    className="cursor-pointer" /></td>
                  <td className="py-2.5 pr-6 font-medium text-xs">{c.agency_name}</td>
                  <td className="py-2.5 pr-6 text-neutral-600 text-xs">{c.agent_name || '—'}</td>
                  <td className="py-2.5 pr-6 text-neutral-500 text-xs">{c.board || '—'}</td>
                  <td className="py-2.5 pr-6 text-neutral-500 text-xs">{c.city || '—'}</td>
                  <td className="py-2.5 pr-6">
                    {c.email_invalid ? <span className="text-red-400 text-xs line-through">{c.email || 'invalid'}</span> : c.email ? <a href={`mailto:${c.email}`} className="underline underline-offset-2 hover:opacity-60 text-xs">{c.email}</a> : <span className="text-neutral-300 text-xs">—</span>}
                  </td>
                  <td className="py-2.5 text-neutral-500 text-xs">{c.cell_phone || '—'}</td>
                  <td className="py-2.5 text-right">
                    <button onClick={() => setEditTarget(c)} className="text-[10px] tracking-widest uppercase text-neutral-400 hover:text-black transition-colors">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
