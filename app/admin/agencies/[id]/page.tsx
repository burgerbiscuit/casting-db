'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'

const MARKET_OPTIONS = ['Women','Men','Plus/Curve','Commercial','Runway','Editorial','Fitness','Kids','Influencer']

export default function AgencyPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const router = useRouter()
  const isNew = params.id === 'new'
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    name: '', city: '', country: '', email: '', phone: '',
    website: '', instagram: '', markets: [] as string[], notes: ''
  })

  useEffect(() => {
    if (isNew) return
    supabase.from('agencies').select('*').eq('id', params.id).single().then(({ data }) => {
      if (data) setForm({
        name: data.name || '', city: data.city || '', country: data.country || '',
        email: data.email || '', phone: data.phone || '', website: data.website || '',
        instagram: data.instagram || '', markets: data.markets || [], notes: data.notes || ''
      })
    })
  }, [params.id])

  const save = async () => {
    setSaving(true)
    const payload = { ...form, updated_at: new Date().toISOString() }
    if (isNew) {
      const { data } = await supabase.from('agencies').insert(payload).select('id').single()
      if (data) router.push(`/admin/agencies/${data.id}`)
    } else {
      await supabase.from('agencies').update(payload).eq('id', params.id)
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  const del = async () => {
    if (!confirm('Delete this agency?')) return
    await supabase.from('agencies').delete().eq('id', params.id)
    router.push('/admin/agencies')
  }

  const inp = 'w-full border-b border-neutral-200 py-2 text-sm focus:outline-none focus:border-black bg-transparent'
  const lbl = 'label block mb-1'

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/agencies" className="text-neutral-400 hover:text-black transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <h1 className="text-2xl font-light tracking-widest uppercase">{isNew ? 'New Agency' : form.name || 'Agency'}</h1>
      </div>

      <div className="space-y-6">
        <div>
          <label className={lbl}>Agency Name *</label>
          <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className={inp} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lbl}>City</label>
            <input value={form.city} onChange={e => setForm(f => ({...f, city: e.target.value}))} className={inp} />
          </div>
          <div>
            <label className={lbl}>Country</label>
            <input value={form.country} onChange={e => setForm(f => ({...f, country: e.target.value}))} className={inp} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Email</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} className={inp} />
          </div>
          <div>
            <label className={lbl}>Phone</label>
            <input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} className={inp} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Website</label>
            <input type="url" value={form.website} onChange={e => setForm(f => ({...f, website: e.target.value}))} className={inp} placeholder="https://..." />
          </div>
          <div>
            <label className={lbl}>Instagram</label>
            <input value={form.instagram} onChange={e => setForm(f => ({...f, instagram: e.target.value.replace('@','')}))} className={inp} placeholder="handle" />
          </div>
        </div>

        <div>
          <p className={lbl}>Markets</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {MARKET_OPTIONS.map(m => (
              <button key={m} type="button"
                onClick={() => setForm(f => ({...f, markets: f.markets.includes(m) ? f.markets.filter(x=>x!==m) : [...f.markets, m]}))}
                className={`text-xs px-3 py-2 border transition-colors ${form.markets.includes(m) ? 'bg-black text-white border-black' : 'border-neutral-300 hover:border-black'}`}>
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={lbl}>Notes</label>
          <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={3}
            className="w-full border-b border-neutral-200 py-2 text-sm focus:outline-none focus:border-black bg-transparent resize-none" />
        </div>

        <div className="flex items-center justify-between pt-4">
          {!isNew && (
            <button onClick={del} className="flex items-center gap-2 text-xs text-red-400 hover:text-red-600 transition-colors">
              <Trash2 size={12} /> Delete
            </button>
          )}
          <button onClick={save} disabled={saving}
            className="ml-auto px-6 py-3 bg-black text-white text-xs tracking-widest uppercase hover:bg-neutral-800 transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : saved ? 'Saved ✓' : isNew ? 'Create Agency' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
