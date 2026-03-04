'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'

type Item = { id: string; type: 'template' | 'lingo'; label: string; body: string; display_order: number }

export default function ResourcesPage() {
  const supabase = createClient()
  const [templates, setTemplates] = useState<Item[]>([])
  const [lingo, setLingo] = useState<Item[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState<Item | null>(null)
  const [adding, setAdding] = useState<'template' | 'lingo' | null>(null)
  const [newLabel, setNewLabel] = useState('')
  const [newBody, setNewBody] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const { data } = await supabase.from('resource_items').select('*').order('display_order')
    setTemplates((data || []).filter(d => d.type === 'template'))
    setLingo((data || []).filter(d => d.type === 'lingo'))
  }

  useEffect(() => { load() }, [])
  useEffect(() => { if (templates.length && !activeId) setActiveId(templates[0]?.id) }, [templates])

  const activeTemplate = templates.find(t => t.id === activeId)

  const copy = () => {
    if (!activeTemplate) return
    navigator.clipboard.writeText(activeTemplate.body)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const startEdit = (item: Item) => {
    setEditing({ ...item })
    setAdding(null)
  }

  const saveEdit = async () => {
    if (!editing) return
    setSaving(true)
    await supabase.from('resource_items').update({ label: editing.label, body: editing.body }).eq('id', editing.id)
    setEditing(null)
    setSaving(false)
    load()
  }

  const deleteItem = async (item: Item) => {
    await supabase.from('resource_items').delete().eq('id', item.id)
    if (activeId === item.id) setActiveId(null)
    load()
  }

  const saveNew = async () => {
    if (!adding || !newLabel) return
    setSaving(true)
    const order = (adding === 'template' ? templates : lingo).length
    await supabase.from('resource_items').insert({ type: adding, label: newLabel, body: newBody, display_order: order })
    setAdding(null); setNewLabel(''); setNewBody('')
    setSaving(false)
    load()
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-light tracking-widest uppercase mb-8">Resources</h1>

      {/* Email Templates */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs tracking-widest uppercase text-neutral-400">Email Templates</h2>
          <button onClick={() => { setAdding('template'); setEditing(null); setNewLabel(''); setNewBody('') }}
            className="flex items-center gap-1 text-[10px] tracking-widest uppercase border border-neutral-200 px-3 py-1 hover:border-black transition-colors">
            <Plus size={10} /> Add Template
          </button>
        </div>

        {adding === 'template' && (
          <div className="border border-black p-4 mb-4">
            <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Template name"
              className="w-full border-b border-neutral-300 py-1.5 text-xs mb-3 focus:outline-none focus:border-black bg-transparent" autoFocus />
            <textarea value={newBody} onChange={e => setNewBody(e.target.value)} rows={6} placeholder="Email body..."
              className="w-full border border-neutral-200 p-3 text-xs font-mono resize-none focus:outline-none focus:border-black mb-3" />
            <div className="flex gap-2">
              <button onClick={saveNew} disabled={saving || !newLabel}
                className="px-4 py-2 text-[10px] tracking-widest uppercase bg-black text-white disabled:opacity-40">
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setAdding(null)} className="px-4 py-2 text-[10px] tracking-widest uppercase border border-neutral-300 hover:border-black">
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            {templates.map(t => (
              <div key={t.id} className="group flex items-center gap-1">
                <button onClick={() => { setActiveId(t.id); setEditing(null); setCopied(false) }}
                  className={"flex-1 text-left px-3 py-2 text-xs tracking-wide transition-colors " + (activeId === t.id ? 'bg-black text-white' : 'hover:bg-neutral-100')}>
                  {t.label}
                </button>
                <button onClick={() => startEdit(t)} className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-black transition-opacity">
                  <Pencil size={11} />
                </button>
                <button onClick={() => deleteItem(t)} className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-500 transition-opacity">
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>

          <div className="md:col-span-3">
            {editing && editing.type === 'template' ? (
              <div className="border border-black p-4">
                <input value={editing.label} onChange={e => setEditing(p => p ? {...p, label: e.target.value} : null)}
                  className="w-full border-b border-neutral-300 py-1 text-xs font-medium mb-3 focus:outline-none focus:border-black bg-transparent" />
                <textarea value={editing.body} onChange={e => setEditing(p => p ? {...p, body: e.target.value} : null)}
                  rows={12} className="w-full border border-neutral-200 p-3 text-xs font-mono resize-none focus:outline-none focus:border-black mb-3" />
                <div className="flex gap-2">
                  <button onClick={saveEdit} disabled={saving} className="px-4 py-2 text-[10px] tracking-widest uppercase bg-black text-white disabled:opacity-40">
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => setEditing(null)} className="px-4 py-2 text-[10px] tracking-widest uppercase border border-neutral-300 hover:border-black">Cancel</button>
                </div>
              </div>
            ) : activeTemplate ? (
              <div className="relative">
                <div className="bg-neutral-50 border border-neutral-200 p-4 text-xs leading-relaxed font-sans text-neutral-700 min-h-48 space-y-2">
                  {activeTemplate.body.split('\n').map((line: string, i: number) => {
                    const imgMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/)
                    if (imgMatch) return <img key={i} src={imgMatch[2]} alt={imgMatch[1]} className="max-w-full my-2 border border-neutral-200" style={{maxHeight: 320}} />
                    if (line.trim() === '---') return <hr key={i} className="border-neutral-200 my-2" />
                    const urlMatch = line.match(/^(https?:\/\/\S+)$/)
                    if (urlMatch) return <a key={i} href={urlMatch[1]} target="_blank" rel="noopener noreferrer" className="block text-xs underline text-neutral-600 hover:text-black tracking-wide">{urlMatch[1]}</a>
                    return <div key={i} className="whitespace-pre-wrap">{line}</div>
                  })}
                </div>
                <div className="absolute top-3 right-3 flex gap-2">
                  <button onClick={() => startEdit(activeTemplate)}
                    className="text-[10px] tracking-widest uppercase px-3 py-1 border bg-white border-neutral-300 hover:border-black transition-colors">
                    Edit
                  </button>
                  <button onClick={copy}
                    className={"text-[10px] tracking-widest uppercase px-3 py-1 border transition-colors " + (copied ? 'bg-black text-white border-black' : 'bg-white border-neutral-300 hover:border-black')}>
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Casting Lingo */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs tracking-widest uppercase text-neutral-400">Casting Lingo</h2>
          <button onClick={() => { setAdding('lingo'); setEditing(null); setNewLabel(''); setNewBody('') }}
            className="flex items-center gap-1 text-[10px] tracking-widest uppercase border border-neutral-200 px-3 py-1 hover:border-black transition-colors">
            <Plus size={10} /> Add Term
          </button>
        </div>

        {adding === 'lingo' && (
          <div className="border border-black p-4 mb-4 grid grid-cols-3 gap-4">
            <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Term"
              className="border-b border-neutral-300 py-1.5 text-xs focus:outline-none focus:border-black bg-transparent" autoFocus />
            <div className="col-span-2 flex gap-2 items-start">
              <input value={newBody} onChange={e => setNewBody(e.target.value)} placeholder="Definition"
                className="flex-1 border-b border-neutral-300 py-1.5 text-xs focus:outline-none focus:border-black bg-transparent" />
              <button onClick={saveNew} disabled={saving || !newLabel} className="p-1.5 bg-black text-white disabled:opacity-40"><Check size={12} /></button>
              <button onClick={() => setAdding(null)} className="p-1.5 border border-neutral-300 hover:border-black"><X size={12} /></button>
            </div>
          </div>
        )}

        <div className="divide-y divide-neutral-100 border border-neutral-100">
          {lingo.map(l => (
            <div key={l.id} className="group grid grid-cols-3 px-4 py-3 gap-4 items-center hover:bg-neutral-50">
              {editing?.id === l.id ? (
                <>
                  <input value={editing.label} onChange={e => setEditing(p => p ? {...p, label: e.target.value} : null)}
                    className="border-b border-neutral-400 py-0.5 text-xs font-medium focus:outline-none bg-transparent" autoFocus />
                  <div className="col-span-2 flex gap-2 items-center">
                    <input value={editing.body || ''} onChange={e => setEditing(p => p ? {...p, body: e.target.value} : null)}
                      className="flex-1 border-b border-neutral-400 py-0.5 text-xs focus:outline-none bg-transparent" />
                    <button onClick={saveEdit} disabled={saving} className="p-1.5 bg-black text-white disabled:opacity-40"><Check size={12} /></button>
                    <button onClick={() => setEditing(null)} className="p-1.5 border border-neutral-300"><X size={12} /></button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs font-medium tracking-wide">{l.label}</p>
                  <p className="col-span-2 text-xs text-neutral-600 leading-relaxed">{l.body}</p>
                  <div className="hidden group-hover:flex absolute right-4 gap-1">
                    <button onClick={() => startEdit(l)} className="p-1 text-neutral-400 hover:text-black"><Pencil size={11} /></button>
                    <button onClick={() => deleteItem(l)} className="p-1 text-neutral-400 hover:text-red-500"><Trash2 size={11} /></button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Lingo edit buttons on hover — positioned version */}
        <style>{'.group:hover .lingo-actions { display: flex; }'}</style>
      </section>
    </div>
  )
}
