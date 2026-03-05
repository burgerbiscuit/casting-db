'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type ChartRow = {
  id: string // project_models.id
  model_id: string
  confirmed_date: string | null
  pm_rate: string | null
  confirmed_usage: string | null
  confirmed_notes: string | null
  w9_status: string | null
  chart_hidden: boolean
  models: {
    id: string
    first_name: string
    last_name: string
    agency: string | null
    height_ft: number | null
    height_in: number | null
    bust: string | null
    waist: string | null
    hips: string | null
    shoe_size: string | null
    dress_size: string | null
    instagram_handle: string | null
    portfolio_url: string | null
  }
}

type Props = {
  rows: ChartRow[]
  photoMap: Record<string, string>
  agentMap: Record<string, any>
  projectRate: string | null
  projectUsage: string | null
  projectDate: string | null
  shootDate: string | null
  showCol: (col: string) => boolean
  isMember: boolean
}

const W9_OPTIONS = ['', 'REQUESTED', 'RECEIVED']

export default function ConfirmationChartTable({
  rows: initialRows, photoMap, agentMap, projectRate, projectUsage, projectDate, shootDate, showCol, isMember
}: Props) {
  const supabase = createClient()
  const [editing, setEditing] = useState(false)
  const [rows, setRows] = useState(initialRows)
  const [saving, setSaving] = useState<string | null>(null)

  const updateRow = (rowId: string, field: string, value: string) => {
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, [field]: value || null } : r))
  }

  const saveField = async (rowId: string, field: string, value: string) => {
    setSaving(rowId + field)
    await supabase.from('project_models').update({ [field]: value || null }).eq('id', rowId)
    setSaving(null)
  }

  const toggleHidden = async (rowId: string, hidden: boolean) => {
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, chart_hidden: !hidden } : r))
    await supabase.from('project_models').update({ chart_hidden: !hidden }).eq('id', rowId)
  }

  const visibleRows = editing ? rows : rows.filter(r => !r.chart_hidden)

  return (
    <>
      {/* Edit toggle — admin/member only, no-print */}
      {isMember && (
        <div className="no-print flex justify-end mb-4">
          <button
            onClick={() => setEditing(!editing)}
            className={`text-[10px] tracking-widest uppercase px-4 py-2 border transition-colors ${
              editing ? 'bg-black text-white border-black' : 'border-neutral-300 text-neutral-500 hover:border-black hover:text-black'
            }`}>
            {editing ? 'Done Editing' : 'Edit Chart'}
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[11px]" style={{ minWidth: 900 }}>
          <thead>
            <tr>
              <td
                colSpan={editing ? 10 : 9}
                className="border border-neutral-800 bg-neutral-900 text-white text-center py-2.5 px-4 tracking-widest uppercase text-[11px] font-semibold">
                CONFIRMATION CHART
              </td>
            </tr>
            <tr className="bg-neutral-100">
              {editing && (
                <th className="border border-neutral-300 px-2 py-2 text-[9px] tracking-widest uppercase font-semibold text-neutral-600 text-center whitespace-nowrap">
                  SHOW
                </th>
              )}
              {[
                { key: 'photo', label: 'PHOTO' },
                { key: '__name', label: 'NAME' },
                { key: 'contact', label: 'CONTACT' },
                { key: 'rate', label: 'RATE' },
                { key: 'date', label: 'DATE' },
                { key: 'size', label: 'SIZE' },
                { key: 'usage', label: 'USAGE' },
                { key: 'notes', label: 'ADDITIONAL USAGE' },
                { key: 'w9', label: 'W-9' },
              ].filter(c => c.key === '__name' || showCol(c.key)).map(({ label: col }) => (
                <th key={col} className="border border-neutral-300 px-2 py-2 text-[9px] tracking-widest uppercase font-semibold text-neutral-600 text-center whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 && (
              <tr>
                <td colSpan={editing ? 10 : 9} className="border border-neutral-200 text-center py-8 text-neutral-400 text-xs tracking-widest uppercase">
                  No confirmed talent yet
                </td>
              </tr>
            )}
            {visibleRows.map((pm) => {
              const model = pm.models
              const photo = photoMap[model?.id]
              const agent = agentMap[(model?.agency || '').toLowerCase()]
              const heightFt = model?.height_ft
              const heightIn = model?.height_in ?? 0
              const height = heightFt ? `${heightFt}'${heightIn}"` : null
              const sizing = [
                height ? `Height: ${height}` : null,
                model?.bust ? `Bust: ${model.bust}` : null,
                model?.waist ? `Waist: ${model.waist}` : null,
                model?.hips ? `Hips: ${model.hips}` : null,
                model?.shoe_size ? `Shoe: ${model.shoe_size}` : null,
                model?.dress_size ? `Dress: ${model.dress_size}` : null,
              ].filter(Boolean)
              const displayDate = pm.confirmed_date || projectDate || shootDate
              const displayRate = pm.pm_rate || projectRate
              const displayUsage = pm.confirmed_usage || projectUsage
              const igHandle = (model?.instagram_handle || '').replace('@', '')
              const profileUrl = model?.portfolio_url
                ? (model.portfolio_url.startsWith('http') ? model.portfolio_url : `https://${model.portfolio_url}`)
                : igHandle ? `https://www.instagram.com/${igHandle}/` : null

              const isSavingRow = saving?.startsWith(pm.id)

              return (
                <tr key={pm.id} className={`border-b border-neutral-200 align-top ${pm.chart_hidden && editing ? 'opacity-40' : ''}`}>
                  {/* Show/hide toggle (edit mode only) */}
                  {editing && (
                    <td className="border border-neutral-200 px-2 py-2.5 text-center align-middle">
                      <button
                        onClick={() => toggleHidden(pm.id, pm.chart_hidden)}
                        className={`text-[9px] tracking-widest uppercase px-2 py-1 border transition-colors ${
                          pm.chart_hidden
                            ? 'border-neutral-200 text-neutral-300 hover:border-black hover:text-black'
                            : 'bg-black text-white border-black hover:bg-neutral-700'
                        }`}>
                        {pm.chart_hidden ? 'Hidden' : 'Shown'}
                      </button>
                    </td>
                  )}

                  {/* Photo */}
                  {showCol('photo') && (
                    <td className="border border-neutral-200 p-0" style={{ width: 64, height: 80 }}>
                      {photo ? (
                        <img src={photo} alt={`${model?.first_name} ${model?.last_name}`}
                          className="block w-full h-full object-cover object-top"
                          style={{ width: 64, height: 80, display: 'block' }} />
                      ) : (
                        <div className="w-full h-full bg-neutral-100 flex items-center justify-center text-neutral-300 text-[8px]"
                          style={{ width: 64, height: 80 }}>—</div>
                      )}
                    </td>
                  )}

                  {/* Name */}
                  <td className="border border-neutral-200 px-3 py-2.5 text-center align-middle" style={{ width: 90 }}>
                    {profileUrl ? (
                      <a href={profileUrl} target="_blank" rel="noopener noreferrer"
                        className="text-[11px] tracking-wide text-neutral-800 underline font-medium hover:text-black">
                        {model?.first_name?.toUpperCase()}
                        {model?.last_name ? <><br />{model.last_name.toUpperCase()}</> : null}
                      </a>
                    ) : (
                      <p className="text-[11px] tracking-wide text-neutral-800 font-medium">
                        {model?.first_name?.toUpperCase()}
                        {model?.last_name ? <><br />{model.last_name.toUpperCase()}</> : null}
                      </p>
                    )}
                  </td>

                  {/* Contact */}
                  {showCol('contact') && (
                    <td className="border border-neutral-200 px-3 py-2.5" style={{ width: 160 }}>
                      {model?.agency && <p className="font-bold tracking-wide text-[11px] uppercase">{model.agency}</p>}
                      {agent?.agent_name && <p className="text-[11px] mt-0.5">{agent.agent_name}</p>}
                      {agent?.email && <p className="text-[10px] text-neutral-600">{agent.email}</p>}
                      {agent?.cell_phone && <p className="text-[10px] text-neutral-600">C: {agent.cell_phone}</p>}
                      {agent?.office_phone && <p className="text-[10px] text-neutral-600">O: {agent.office_phone}</p>}
                      {!agent && !model?.agency && <p className="text-neutral-300 text-[10px]">—</p>}
                    </td>
                  )}

                  {/* Rate */}
                  {showCol('rate') && (
                    <td className="border border-neutral-200 px-2 py-2.5 text-center align-middle" style={{ width: 110 }}>
                      {editing ? (
                        <input
                          className="w-full text-[11px] text-center bg-neutral-50 border-b border-neutral-300 focus:outline-none focus:border-black py-0.5"
                          value={pm.pm_rate || ''}
                          placeholder={projectRate || '—'}
                          onChange={e => updateRow(pm.id, 'pm_rate', e.target.value)}
                          onBlur={e => saveField(pm.id, 'pm_rate', e.target.value)}
                        />
                      ) : (
                        <p className="text-[11px]">{displayRate || '—'}</p>
                      )}
                    </td>
                  )}

                  {/* Date */}
                  {showCol('date') && (
                    <td className="border border-neutral-200 px-2 py-2.5 text-center align-middle" style={{ width: 120 }}>
                      {editing ? (
                        <input
                          type="date"
                          className="w-full text-[11px] text-center bg-neutral-50 border-b border-neutral-300 focus:outline-none focus:border-black py-0.5"
                          value={pm.confirmed_date || ''}
                          onChange={e => updateRow(pm.id, 'confirmed_date', e.target.value)}
                          onBlur={e => saveField(pm.id, 'confirmed_date', e.target.value)}
                        />
                      ) : (
                        <p className="text-[11px]">{displayDate || '—'}</p>
                      )}
                    </td>
                  )}

                  {/* Size */}
                  {showCol('size') && (
                    <td className="border border-neutral-200 px-3 py-2.5 align-top" style={{ width: 110 }}>
                      {sizing.length > 0 ? (
                        <div className="space-y-0.5">
                          {sizing.map((s, i) => <p key={i} className="text-[10px] text-neutral-700">{s}</p>)}
                        </div>
                      ) : <p className="text-neutral-300 text-[10px]">—</p>}
                    </td>
                  )}

                  {/* Usage */}
                  {showCol('usage') && (
                    <td className="border border-neutral-200 px-2 py-2.5 text-center align-middle" style={{ width: 110 }}>
                      {editing ? (
                        <input
                          className="w-full text-[11px] text-center bg-neutral-50 border-b border-neutral-300 focus:outline-none focus:border-black py-0.5"
                          value={pm.confirmed_usage || ''}
                          placeholder={projectUsage || '—'}
                          onChange={e => updateRow(pm.id, 'confirmed_usage', e.target.value)}
                          onBlur={e => saveField(pm.id, 'confirmed_usage', e.target.value)}
                        />
                      ) : (
                        <p className="text-[11px]">{displayUsage || '—'}</p>
                      )}
                    </td>
                  )}

                  {/* Additional Usage / Notes */}
                  {showCol('notes') && (
                    <td className="border border-neutral-200 px-2 py-2.5 align-top" style={{ width: 200 }}>
                      {editing ? (
                        <textarea
                          className="w-full text-[10px] bg-neutral-50 border-b border-neutral-300 focus:outline-none focus:border-black py-0.5 resize-none"
                          rows={3}
                          value={pm.confirmed_notes || ''}
                          onChange={e => updateRow(pm.id, 'confirmed_notes', e.target.value)}
                          onBlur={e => saveField(pm.id, 'confirmed_notes', e.target.value)}
                        />
                      ) : (
                        <p className="text-[10px] text-neutral-700 whitespace-pre-line">{pm.confirmed_notes || '—'}</p>
                      )}
                    </td>
                  )}

                  {/* W-9 */}
                  {showCol('w9') && (
                    <td className="border border-neutral-200 px-2 py-2.5 text-center align-middle" style={{ width: 90 }}>
                      {editing ? (
                        <select
                          className="w-full text-[10px] text-center bg-neutral-50 border-b border-neutral-300 focus:outline-none focus:border-black py-0.5 uppercase tracking-widest"
                          value={pm.w9_status || ''}
                          onChange={e => { updateRow(pm.id, 'w9_status', e.target.value); saveField(pm.id, 'w9_status', e.target.value) }}>
                          {W9_OPTIONS.map(o => <option key={o} value={o}>{o || '—'}</option>)}
                        </select>
                      ) : pm.w9_status ? (
                        <p className={`text-[10px] tracking-widest uppercase font-semibold ${pm.w9_status === 'RECEIVED' ? 'text-green-700' : 'text-neutral-500'}`}>
                          {pm.w9_status}
                        </p>
                      ) : (
                        <p className="text-neutral-300 text-[10px]">—</p>
                      )}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
