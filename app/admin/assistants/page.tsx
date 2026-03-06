'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, ExternalLink, Search, ChevronDown, X } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-50 text-blue-700 border-blue-200',
  reviewed: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  contacted: 'bg-green-50 text-green-700 border-green-200',
  archived: 'bg-neutral-50 text-neutral-400 border-neutral-200',
}

const EXP_LABEL: Record<string, string> = {
  entry: 'Entry (0–2yr)',
  mid: 'Mid (2–5yr)',
  senior: 'Senior (5–10yr)',
  director: 'Director (10yr+)',
}

function ResumePreviewModal({ url, name, onClose }: { url: string; name: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/80" onClick={onClose}>
      <div className="flex items-center justify-between px-6 py-3 bg-black text-white flex-shrink-0" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <FileText size={14} />
          <span className="text-xs tracking-widest uppercase">{name} — Resume</span>
        </div>
        <div className="flex items-center gap-4">
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase text-neutral-400 hover:text-white transition-colors">
            <ExternalLink size={11} /> Open in new tab
          </a>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0" onClick={e => e.stopPropagation()}>
        <iframe
          src={url}
          className="w-full h-full border-0"
          title={`${name} Resume`}
        />
      </div>
    </div>
  )
}

export default function AssistantsPage() {
  const supabase = createClient()
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('ALL')
  const [expFilter, setExpFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [cities, setCities] = useState<string[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('assistant_submissions')
      .select('*')
      .order('created_at', { ascending: false })
    setSubmissions(data || [])
    const allCities = [...new Set((data || []).map((s: any) => s.city).filter(Boolean))].sort()
    setCities(allCities)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Close preview on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setPreview(null) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('assistant_submissions').update({ status }).eq('id', id)
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status } : s))
  }

  const filtered = submissions.filter(s => {
    if (cityFilter !== 'ALL' && s.city !== cityFilter) return false
    if (expFilter !== 'ALL' && s.experience_level !== expFilter) return false
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.city || '').toLowerCase().includes(q) ||
        (s.based_in || '').toLowerCase().includes(q)
      )
    }
    return true
  })

  const newCount = submissions.filter(s => s.status === 'new').length

  const ResumeBtn = ({ s, compact = false }: { s: any; compact?: boolean }) =>
    s.resume_url ? (
      <button
        onClick={() => setPreview({ url: s.resume_url, name: `${s.first_name} ${s.last_name}` })}
        className={`flex items-center gap-1.5 text-[10px] tracking-widest uppercase border border-neutral-200 hover:border-black transition-colors ${compact ? 'px-3 py-1.5' : 'px-4 py-2.5'}`}>
        <FileText size={compact ? 11 : 14} /> Resume
      </button>
    ) : null

  return (
    <div>
      {preview && (
        <ResumePreviewModal url={preview.url} name={preview.name} onClose={() => setPreview(null)} />
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-light tracking-widest uppercase">Assistant Resumes</h1>
          <p className="text-sm text-neutral-400 mt-1">{submissions.length} total · {newCount} new</p>
        </div>
        <a href="/assistant" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs tracking-widest uppercase border border-neutral-200 px-4 py-2 hover:border-black transition-colors">
          <ExternalLink size={12} /> View Form
        </a>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, city..."
            className="pl-8 pr-4 py-2 border border-neutral-200 text-xs focus:outline-none focus:border-black w-52 bg-transparent" />
        </div>

        <select value={cityFilter} onChange={e => setCityFilter(e.target.value)}
          className="border border-neutral-200 text-xs px-3 py-2 focus:outline-none focus:border-black bg-white">
          <option value="ALL">All Cities</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select value={expFilter} onChange={e => setExpFilter(e.target.value)}
          className="border border-neutral-200 text-xs px-3 py-2 focus:outline-none focus:border-black bg-white">
          <option value="ALL">All Experience</option>
          {Object.entries(EXP_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>

        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-neutral-200 text-xs px-3 py-2 focus:outline-none focus:border-black bg-white">
          <option value="ALL">All Statuses</option>
          {['new', 'reviewed', 'contacted', 'archived'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {loading && <p className="text-sm text-neutral-400">Loading...</p>}

      {!loading && filtered.length === 0 && (
        <div className="border border-dashed border-neutral-200 p-12 text-center">
          <p className="text-xs text-neutral-400 tracking-widest uppercase">No submissions yet</p>
          <p className="text-sm text-neutral-400 mt-2">Share <a href="/assistant" className="underline">/assistant</a> to start receiving applications.</p>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(s => (
          <div key={s.id} className={`border ${s.status === 'new' ? 'border-blue-200' : 'border-neutral-200'}`}>
            {/* Row */}
            <div className="flex items-center gap-4 px-5 py-4">
              <button onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                className="flex-1 flex items-center gap-4 text-left">
                <ChevronDown size={14} className={`text-neutral-400 flex-shrink-0 transition-transform ${expanded === s.id ? 'rotate-180' : ''}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{s.first_name} {s.last_name}</p>
                  <p className="text-xs text-neutral-400">
                    {[s.city, s.country].filter(Boolean).join(', ')}
                    {s.opportunity_type && ` · ${s.opportunity_type}`}
                    {s.opportunity_type === 'Internship' && s.school_credit !== null && ` (school credit: ${s.school_credit ? 'yes' : 'no'})`}
                    {s.experience_level && ` · ${EXP_LABEL[s.experience_level] || s.experience_level}`}
                    {s.years_experience && ` · ${s.years_experience}yr`}
                  </p>
                </div>
              </button>

              <div className="flex items-center gap-3 flex-shrink-0">
                <ResumeBtn s={s} compact />

                <select value={s.status} onChange={e => updateStatus(s.id, e.target.value)}
                  className={`text-[10px] tracking-widest uppercase border px-2 py-1.5 focus:outline-none cursor-pointer ${STATUS_COLORS[s.status] || ''}`}>
                  <option value="new">New</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="contacted">Contacted</option>
                  <option value="archived">Archived</option>
                </select>

                <span className="text-[10px] text-neutral-300 whitespace-nowrap">
                  {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Expanded detail */}
            {expanded === s.id && (
              <div className="border-t border-neutral-100 px-5 py-5 bg-neutral-50/50 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
                  {s.email && (
                    <div>
                      <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-0.5">Email</p>
                      <a href={`mailto:${s.email}`} className="text-sm underline underline-offset-2 hover:opacity-60">{s.email}</a>
                    </div>
                  )}
                  {s.phone && (
                    <div>
                      <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-0.5">Phone</p>
                      <p className="text-sm">{s.phone}</p>
                    </div>
                  )}
                  {s.instagram_handle && (
                    <div>
                      <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-0.5">Instagram</p>
                      <a href={`https://instagram.com/${s.instagram_handle}`} target="_blank" rel="noopener noreferrer"
                        className="text-sm underline underline-offset-2 hover:opacity-60">@{s.instagram_handle}</a>
                    </div>
                  )}
                  {s.website_url && (
                    <div>
                      <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-0.5">Website</p>
                      <a href={s.website_url.startsWith('http') ? s.website_url : `https://${s.website_url}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-sm underline underline-offset-2 hover:opacity-60 flex items-center gap-1">
                        Portfolio <ExternalLink size={10} />
                      </a>
                    </div>
                  )}
                </div>

                {s.languages?.length > 0 && (
                  <div>
                    <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-1.5">Languages</p>
                    <div className="flex flex-wrap gap-1.5">{s.languages.map((l: string) => <span key={l} className="text-xs bg-white border border-neutral-200 px-2 py-1">{l}</span>)}</div>
                  </div>
                )}

                {s.software?.length > 0 && (
                  <div>
                    <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-1.5">Software</p>
                    <div className="flex flex-wrap gap-1.5">{s.software.map((sw: string) => <span key={sw} className="text-xs bg-white border border-neutral-200 px-2 py-1">{sw}</span>)}</div>
                  </div>
                )}

                {s.skills?.length > 0 && (
                  <div>
                    <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-1.5">Skills</p>
                    <div className="flex flex-wrap gap-1.5">{s.skills.map((sk: string) => <span key={sk} className="text-xs bg-white border border-neutral-200 px-2 py-1">{sk}</span>)}</div>
                  </div>
                )}

                {s.notes && (
                  <div>
                    <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-1">Notes</p>
                    <p className="text-sm text-neutral-600 whitespace-pre-wrap">{s.notes}</p>
                  </div>
                )}

                {s.resume_url && (
                  <div>
                    <p className="text-[10px] tracking-widest uppercase text-neutral-400 mb-2">Resume</p>
                    <ResumeBtn s={s} />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
