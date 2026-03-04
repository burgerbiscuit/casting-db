'use client'
import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const ALL_COLS = ['photo','contact','rate','date','size','usage','notes','w9'] as const
type ColKey = typeof ALL_COLS[number]
const COL_LABELS: Record<ColKey, string> = {
  photo: 'Photo', contact: 'Agent Contact', rate: 'Rate',
  date: 'Date', size: 'Size', usage: 'Usage', notes: 'Notes', w9: 'W-9',
}

type ModelEntry = {
  pmId: string
  modelId: string
  firstName: string
  lastName: string
  phone: string
  email: string
  agency: string
  photo: string | null
  agentName: string
  agentEmail: string
  agentPhone: string
  agentOffice: string
  pmRate: string
  pmOption: string
  confirmedDate: string
  confirmedUsage: string
  confirmedDays: string
  confirmedNotes: string
  w9Status: string
  chartHidden: boolean
}

type ProjectData = {
  id: string
  name: string
  shootDate: string
  modelRate: string
  usage: string
  photographer: string
  stylist: string
  location: string
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  } catch { return dateStr }
}

export function ConfirmationChartEditor({ models, project, presId }: { models: ModelEntry[]; project: ProjectData; presId?: string }) {
  const supabase = createClient()

  const storageKey = presId ? `chart-hidden-cols-${presId}` : null
  const [hiddenCols, setHiddenCols] = useState<Set<ColKey>>(new Set())
  useEffect(() => {
    if (!storageKey) return
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) setHiddenCols(new Set(JSON.parse(saved) as ColKey[]))
    } catch {}
  }, [storageKey])

  const toggleCol = (col: ColKey) => {
    setHiddenCols(prev => {
      const next = new Set(prev)
      if (next.has(col)) next.delete(col); else next.add(col)
      if (storageKey) {
        try { localStorage.setItem(storageKey, JSON.stringify([...next])) } catch {}
      }
      return next
    })
  }

  const pdfUrl = presId
    ? `/api/confirmation-chart-pdf/${presId}${hiddenCols.size > 0 ? `?hidden=${[...hiddenCols].join(',')}` : ''}`
    : null

  type Fields = { pmRate: string; confirmedDate: string; confirmedUsage: string; confirmedDays: string; confirmedNotes: string; w9Status: string }
  const [fields, setFields] = useState<Record<string, Fields>>(() => {
    const map: Record<string, Fields> = {}
    models.forEach(m => {
      map[m.pmId] = {
        pmRate: m.pmRate || project.modelRate || '',
        confirmedDate: m.confirmedDate || formatDate(project.shootDate),
        confirmedUsage: m.confirmedUsage || project.usage || '',
        confirmedDays: m.confirmedDays || '',
        confirmedNotes: m.confirmedNotes || '',
        w9Status: m.w9Status || '',
      }
    })
    return map
  })
  const [hidden, setHidden] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {}
    models.forEach(m => { map[m.pmId] = m.chartHidden })
    return map
  })

  const [savingState, setSavingState] = useState<Record<string, 'idle' | 'saving' | 'saved'>>({})

  const toggleHidden = async (pmId: string) => {
    const next = !hidden[pmId]
    setHidden(h => ({ ...h, [pmId]: next }))
    await supabase.from('project_models').update({ chart_hidden: next }).eq('id', pmId)
  }

  const save = useCallback(async (pmId: string) => {
    setSavingState(s => ({ ...s, [pmId]: 'saving' }))
    const f = fields[pmId]
    await supabase.from('project_models').update({
      pm_rate: f.pmRate || null,
      confirmed_date: f.confirmedDate || null,
      confirmed_usage: f.confirmedUsage || null,
      confirmed_days: f.confirmedDays || null,
      confirmed_notes: f.confirmedNotes || null,
      w9_status: f.w9Status || null,
    }).eq('id', pmId)
    setSavingState(s => ({ ...s, [pmId]: 'saved' }))
    setTimeout(() => setSavingState(s => ({ ...s, [pmId]: 'idle' })), 2000)
  }, [fields])

  const upd = (pmId: string, key: keyof Fields, val: string) =>
    setFields(prev => ({ ...prev, [pmId]: { ...prev[pmId], [key]: val } }))

  const projectLabel = [project.name, formatDate(project.shootDate), project.location].filter(Boolean).join(' / ').toUpperCase()

  const show = (col: ColKey) => !hiddenCols.has(col)

  return (
    <div>
      {/* Column visibility toggles */}
      <div className="flex flex-wrap items-center gap-2 mb-4 pb-4 border-b border-neutral-200">
        <span className="text-[9px] tracking-widest uppercase text-neutral-400 mr-1">Show columns:</span>
        {ALL_COLS.map(col => (
          <button key={col} onClick={() => toggleCol(col)}
            className={`text-[9px] tracking-widest uppercase px-2.5 py-1 border transition-colors ${
              hiddenCols.has(col)
                ? 'border-neutral-200 text-neutral-300 line-through'
                : 'border-neutral-600 text-neutral-700'
            }`}>
            {COL_LABELS[col]}
          </button>
        ))}
        {pdfUrl && (
          <a href={pdfUrl} target="_blank"
            className="ml-auto text-[9px] tracking-widest uppercase px-3 py-1 border border-neutral-300 text-neutral-600 hover:border-black hover:text-black transition-colors">
            Download PDF ↗
          </a>
        )}
      </div>

    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[11px]" style={{ minWidth: 1100 }}>
        <thead>
          <tr>
            <td colSpan={9} className="border border-neutral-800 bg-neutral-900 text-white text-center py-2.5 px-4 tracking-widest uppercase text-[11px] font-semibold">
              {projectLabel}
            </td>
          </tr>
          <tr className="bg-neutral-100">
            {show('photo') && <th className="border border-neutral-300 px-2 py-2 text-[9px] tracking-widest uppercase font-semibold text-neutral-600 text-center whitespace-nowrap">PHOTO</th>}
            <th className="border border-neutral-300 px-2 py-2 text-[9px] tracking-widest uppercase font-semibold text-neutral-600 text-center whitespace-nowrap">NAME + CONTACT</th>
            {show('contact') && <th className="border border-neutral-300 px-2 py-2 text-[9px] tracking-widest uppercase font-semibold text-neutral-600 text-center whitespace-nowrap">AGENT CONTACT</th>}
            {show('rate') && <th className="border border-neutral-300 px-2 py-2 text-[9px] tracking-widest uppercase font-semibold text-neutral-600 text-center whitespace-nowrap">RATE</th>}
            {show('date') && <th className="border border-neutral-300 px-2 py-2 text-[9px] tracking-widest uppercase font-semibold text-neutral-600 text-center whitespace-nowrap">DATE</th>}
            {show('size') && <th className="border border-neutral-300 px-2 py-2 text-[9px] tracking-widest uppercase font-semibold text-neutral-600 text-center whitespace-nowrap">SIZE</th>}
            {show('usage') && <th className="border border-neutral-300 px-2 py-2 text-[9px] tracking-widest uppercase font-semibold text-neutral-600 text-center whitespace-nowrap">USAGE</th>}
            {show('notes') && <th className="border border-neutral-300 px-2 py-2 text-[9px] tracking-widest uppercase font-semibold text-neutral-600 text-center whitespace-nowrap">NOTES / ADD&apos;L USAGE</th>}
            {show('w9') && <th className="border border-neutral-300 px-2 py-2 text-[9px] tracking-widest uppercase font-semibold text-neutral-600 text-center whitespace-nowrap">W-9</th>}
            <th className="border border-neutral-300 px-2 py-2 text-[9px] tracking-widest uppercase font-semibold text-neutral-600 text-center whitespace-nowrap">HIDE</th>
          </tr>
        </thead>
        <tbody>
          {models.map(model => {
            const f = fields[model.pmId]
            const state = savingState[model.pmId] || 'idle'

            const heightFt = null // not in ModelEntry, handled server-side
            const sizing: string[] = []

            return (
              <tr key={model.pmId} className={`align-top border-b border-neutral-100 transition-opacity ${hidden[model.pmId] ? 'opacity-40' : ''}`}>
                {/* Photo */}
                {show('photo') && (
                <td className="border border-neutral-200 p-1.5" style={{ width: 64 }}>
                  <div className="w-14 h-[72px] bg-neutral-100 overflow-hidden shrink-0">
                    {model.photo ? (
                      <img src={model.photo} alt={`${model.firstName} ${model.lastName}`}
                        className="w-full h-full object-cover object-top" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-300 text-[8px]">—</div>
                    )}
                  </div>
                </td>
                )}

                {/* Name + model contact (always visible) */}
                <td className="border border-neutral-200 px-2.5 py-2" style={{ width: 130 }}>
                  <p className="font-semibold tracking-wide text-[11px] uppercase">
                    {model.firstName} {model.lastName}
                  </p>
                  {model.pmOption && <p className="text-[9px] text-neutral-400 tracking-widest uppercase">{model.pmOption}</p>}
                  {model.phone && <p className="text-[10px] text-neutral-500 mt-1">C: {model.phone}</p>}
                  {model.email && <p className="text-[10px] text-neutral-500">{model.email}</p>}
                </td>

                {/* Agent contact */}
                {show('contact') && (
                <td className="border border-neutral-200 px-2.5 py-2" style={{ width: 160 }}>
                  {model.agency && (
                    <p className="font-bold tracking-wide text-[11px] uppercase">{model.agency}</p>
                  )}
                  {model.agentName && <p className="text-[11px] mt-0.5">{model.agentName}</p>}
                  {model.agentEmail && <p className="text-[10px] text-neutral-600">{model.agentEmail}</p>}
                  {model.agentPhone && <p className="text-[10px] text-neutral-600">C: {model.agentPhone}</p>}
                  {model.agentOffice && <p className="text-[10px] text-neutral-600">O: {model.agentOffice}</p>}
                  {!model.agentName && !model.agentEmail && model.agency && (
                    <p className="text-[9px] text-neutral-300 italic">No contact on file</p>
                  )}
                </td>
                )}

                {/* Rate — editable */}
                {show('rate') && (
                <td className="border border-neutral-200 p-1" style={{ width: 110 }}>
                  <textarea
                    value={f.pmRate}
                    onChange={e => upd(model.pmId, 'pmRate', e.target.value)}
                    onBlur={() => save(model.pmId)}
                    placeholder={project.modelRate || 'Rate…'}
                    rows={3}
                    className="w-full text-[11px] px-1.5 py-1 border-0 focus:outline-none resize-none bg-transparent placeholder:text-neutral-300 leading-snug font-medium"
                  />
                </td>
                )}

                {/* Date — editable */}
                {show('date') && (
                <td className="border border-neutral-200 p-1" style={{ width: 90 }}>
                  <input
                    value={f.confirmedDate}
                    onChange={e => upd(model.pmId, 'confirmedDate', e.target.value)}
                    onBlur={() => save(model.pmId)}
                    placeholder={formatDate(project.shootDate) || 'Date…'}
                    className="w-full text-[11px] px-1.5 py-1 border-0 focus:outline-none bg-transparent placeholder:text-neutral-300"
                  />
                  <input
                    value={f.confirmedDays}
                    onChange={e => upd(model.pmId, 'confirmedDays', e.target.value)}
                    onBlur={() => save(model.pmId)}
                    placeholder="Days…"
                    className="w-full text-[10px] px-1.5 py-0.5 border-0 focus:outline-none bg-transparent placeholder:text-neutral-300 text-neutral-500"
                  />
                </td>
                )}

                {/* Size (read-only from model profile) */}
                {show('size') && (
                <td className="border border-neutral-200 px-2.5 py-2" style={{ width: 100 }}>
                  <SizeCell modelId={model.modelId} />
                </td>
                )}

                {/* Usage — editable (after size) */}
                {show('usage') && (
                <td className="border border-neutral-200 p-1" style={{ width: 120 }}>
                  <textarea
                    value={f.confirmedUsage}
                    onChange={e => upd(model.pmId, 'confirmedUsage', e.target.value)}
                    onBlur={() => save(model.pmId)}
                    placeholder={project.usage || 'Usage…'}
                    rows={3}
                    className="w-full text-[11px] px-1.5 py-1 border-0 focus:outline-none resize-none bg-transparent placeholder:text-neutral-300 leading-snug"
                  />
                </td>
                )}

                {/* Notes / Additional Usage — editable */}
                {show('notes') && (
                <td className="border border-neutral-200 p-1" style={{ width: 200 }}>
                  <textarea
                    value={f.confirmedNotes}
                    onChange={e => upd(model.pmId, 'confirmedNotes', e.target.value)}
                    onBlur={() => save(model.pmId)}
                    placeholder="Additional usage, buyout options, notes…"
                    rows={4}
                    className="w-full text-[11px] px-1.5 py-1 border-0 focus:outline-none resize-none bg-transparent placeholder:text-neutral-300 leading-snug"
                  />
                </td>
                )}

                {/* W-9 — dropdown */}
                {show('w9') && (
                <td className="border border-neutral-200 p-1.5 text-center align-middle" style={{ width: 80 }}>
                  <select
                    value={f.w9Status}
                    onChange={e => { upd(model.pmId, 'w9Status', e.target.value); }}
                    onBlur={() => save(model.pmId)}
                    className={`w-full text-[10px] tracking-widest uppercase text-center border border-neutral-200 py-1 focus:outline-none focus:border-black bg-white ${f.w9Status === 'RECEIVED' ? 'text-green-700 font-semibold' : 'text-neutral-500'}`}
                  >
                    <option value="">—</option>
                    <option value="RECEIVED">RECEIVED</option>
                    <option value="PENDING">PENDING</option>
                    <option value="N/A">N/A</option>
                  </select>
                  {state === 'saving' && <p className="text-[8px] text-neutral-400 mt-0.5">saving…</p>}
                  {state === 'saved' && <p className="text-[8px] text-green-600 mt-0.5">✓ saved</p>}
                </td>
                )}

                {/* Hide toggle */}
                <td className="border border-neutral-200 p-1.5 text-center align-middle" style={{ width: 56 }}>
                  <button
                    onClick={() => toggleHidden(model.pmId)}
                    title={hidden[model.pmId] ? 'Hidden from client — click to show' : 'Click to hide from client'}
                    className={`text-[9px] tracking-widest uppercase px-2 py-1 border transition-colors ${hidden[model.pmId] ? 'border-neutral-400 bg-neutral-100 text-neutral-500 hover:bg-neutral-200' : 'border-neutral-200 text-neutral-400 hover:border-neutral-400 hover:text-neutral-600'}`}
                  >
                    {hidden[model.pmId] ? 'Hidden' : 'Hide'}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <p className="mt-4 text-[10px] text-neutral-400 tracking-widest uppercase">
        All fields autosave on blur. Size data is pulled from model profiles.
      </p>
    </div>
    </div>
  )
}

// Loads sizing data for a single model client-side
function SizeCell({ modelId }: { modelId: string }) {
  const [sizing, setSizing] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)

  if (!loaded && modelId) {
    const sb = createClient()
    sb.from('models').select('height_ft, height_in, bust, waist, hips, shoe_size, dress_size').eq('id', modelId).single().then(({ data }) => {
      if (data) {
        const parts: string[] = []
        if (data.height_ft) parts.push(`${data.height_ft}'${data.height_in ?? 0}"`)
        if (data.bust) parts.push(`Bust: ${data.bust}`)
        if (data.waist) parts.push(`Waist: ${data.waist}`)
        if (data.hips) parts.push(`Hips: ${data.hips}`)
        if (data.shoe_size) parts.push(`Shoe: ${data.shoe_size}`)
        if (data.dress_size) parts.push(`Dress: ${data.dress_size}`)
        setSizing(parts)
      }
      setLoaded(true)
    })
  }

  if (!loaded) return <p className="text-[9px] text-neutral-300">…</p>
  if (sizing.length === 0) return <p className="text-neutral-300 text-[10px]">—</p>
  return (
    <div className="space-y-0.5">
      {sizing.map((s, i) => <p key={i} className="text-[10px] text-neutral-700">{s}</p>)}
    </div>
  )
}
