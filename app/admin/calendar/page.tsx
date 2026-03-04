'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, ChevronRight, Copy, Check, Plus, X, Trash2 } from 'lucide-react'
import Link from 'next/link'

const APP_URL = 'https://cast.tashatongpreecha.com'
const CAL_SECRET = 'tasha-casting-cal-2024'

const EVENT_TYPES = [
  { value: 'shoot',        label: 'Shoot',        color: 'bg-black text-white' },
  { value: 'presentation', label: 'Presentation', color: 'bg-neutral-600 text-white' },
  { value: 'meeting',      label: 'Meeting',      color: 'bg-blue-600 text-white' },
  { value: 'deadline',     label: 'Deadline',     color: 'bg-red-500 text-white' },
  { value: 'callback',     label: 'Callback',     color: 'bg-amber-500 text-white' },
  { value: 'fitting',      label: 'Fitting',      color: 'bg-purple-500 text-white' },
  { value: 'event',        label: 'Other',        color: 'bg-neutral-400 text-white' },
]

type CalEvent = {
  id?: string
  date: string
  label: string
  type: string
  projectId?: string
  color: string
  deletable?: boolean
}

type NewEvent = { title: string; date: string; type: string; notes: string }

export default function CalendarPage() {
  const supabase = createClient()
  const [events, setEvents] = useState<CalEvent[]>([])
  const [today] = useState(new Date())
  const [current, setCurrent] = useState(new Date())
  const [copied, setCopied] = useState(false)

  // Add event modal
  const [showModal, setShowModal] = useState(false)
  const [newEvent, setNewEvent] = useState<NewEvent>({ title: '', date: '', type: 'event', notes: '' })
  const [saving, setSaving] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const calUrl = `${APP_URL}/api/calendar?token=${CAL_SECRET}`

  useEffect(() => { load() }, [])

  const load = async () => {
    const [{ data: projects }, { data: tasks }, { data: customEvents }] = await Promise.all([
      supabase.from('projects').select('id, name, shoot_date, presentation_rounds, client_name').eq('status', 'active'),
      supabase.from('tasks').select('id, title, deadline').eq('status', 'open').not('deadline', 'is', null),
      supabase.from('calendar_events').select('id, title, date, type, notes').order('date'),
    ])

    const evs: CalEvent[] = []

    for (const p of projects || []) {
      if (p.shoot_date) evs.push({ date: p.shoot_date.slice(0, 10), label: `Shoot: ${p.name}${p.client_name ? ' · ' + p.client_name : ''}`, type: 'shoot', projectId: p.id, color: 'bg-black text-white' })
      for (const r of (p.presentation_rounds || []) as any[]) {
        if (r.date) evs.push({ date: r.date.slice(0, 10), label: `${r.label || 'Presentation'}: ${p.name}`, type: 'presentation', projectId: p.id, color: 'bg-neutral-600 text-white' })
      }
    }
    for (const t of tasks || []) {
      if (t.deadline) evs.push({ date: t.deadline.slice(0, 10), label: t.title, type: 'task', color: 'bg-red-500 text-white' })
    }
    for (const e of customEvents || []) {
      const et = EVENT_TYPES.find(t => t.value === e.type) || EVENT_TYPES[EVENT_TYPES.length - 1]
      evs.push({ id: e.id, date: e.date, label: e.title, type: e.type, color: et.color, deletable: true })
    }

    setEvents(evs)
  }

  const openModal = (dateStr?: string) => {
    setNewEvent({ title: '', date: dateStr || '', type: 'event', notes: '' })
    setShowModal(true)
  }

  const saveEvent = async () => {
    if (!newEvent.title || !newEvent.date) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('calendar_events').insert({
      title: newEvent.title,
      date: newEvent.date,
      type: newEvent.type,
      notes: newEvent.notes || null,
      created_by: user?.id,
    })
    setSaving(false)
    setShowModal(false)
    load()
  }

  const deleteEvent = async (id: string) => {
    await supabase.from('calendar_events').delete().eq('id', id)
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  const year = current.getFullYear()
  const month = current.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayStr = today.toISOString().slice(0, 10)
  const monthName = current.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const eventsForDate = (d: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    return events.filter(e => e.date === dateStr)
  }

  const upcoming = [...events]
    .filter(e => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 12)

  const copy = () => { navigator.clipboard.writeText(calUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-2xl font-light tracking-widest uppercase">Calendar</h1>
        <button onClick={() => openModal()}
          className="flex items-center gap-2 bg-black text-white text-xs tracking-widest uppercase px-4 py-2.5 hover:bg-neutral-800 transition-colors">
          <Plus size={12} /> Add Event
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Month view */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setCurrent(new Date(year, month - 1))}><ChevronLeft size={16} /></button>
            <span className="text-sm tracking-widest uppercase font-medium">{monthName}</span>
            <button onClick={() => setCurrent(new Date(year, month + 1))}><ChevronRight size={16} /></button>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} className="text-[10px] tracking-widest uppercase text-neutral-400 text-center pb-2">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px bg-neutral-100 border border-neutral-100">
            {Array.from({ length: firstDay }).map((_, i) => <div key={'e' + i} className="bg-white min-h-[80px]" />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
              const dayEvents = eventsForDate(d)
              const isToday = dateStr === todayStr
              return (
                <div key={d} className="bg-white min-h-[80px] p-1.5 group relative">
                  <div className="flex items-center justify-between mb-1">
                    <div className={`text-xs w-6 h-6 flex items-center justify-center ${isToday ? 'bg-black text-white rounded-full font-medium' : 'text-neutral-600'}`}>{d}</div>
                    <button
                      onClick={() => openModal(dateStr)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-300 hover:text-black"
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map((ev, i) => (
                      <div key={i} className={`text-[9px] px-1 py-0.5 truncate leading-tight rounded-sm ${ev.color}`}>{ev.label}</div>
                    ))}
                    {dayEvents.length > 2 && <div className="text-[9px] text-neutral-400">+{dayEvents.length - 2} more</div>}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4">
            {EVENT_TYPES.map(t => (
              <div key={t.value} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-sm ${t.color}`} />
                <span className="text-[10px] text-neutral-500">{t.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Upcoming */}
          <div>
            <p className="label mb-4">Upcoming</p>
            {upcoming.length === 0 && <p className="text-xs text-neutral-400">No upcoming events</p>}
            <div className="space-y-3">
              {upcoming.map((ev, i) => (
                <div key={i} className="flex gap-3 items-start group">
                  <div className="text-center min-w-[36px]">
                    <div className="text-[10px] text-neutral-400 uppercase">{new Date(ev.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' })}</div>
                    <div className="text-lg font-light leading-none">{new Date(ev.date + 'T12:00:00').getDate()}</div>
                  </div>
                  <div className="flex-1 border-t border-neutral-100 pt-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium leading-tight">{ev.label}</p>
                      {ev.deletable && ev.id && (
                        <button onClick={() => deleteEvent(ev.id!)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-300 hover:text-red-400 flex-shrink-0">
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                    {ev.projectId && (
                      <Link href={`/admin/projects/${ev.projectId}`} className="text-[10px] text-neutral-400 hover:text-black uppercase tracking-wider">View project →</Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* iCal subscribe */}
          <div className="border border-neutral-200 p-5">
            <p className="label mb-2">Subscribe to Calendar</p>
            <p className="text-xs text-neutral-500 mb-4">Add to Apple Calendar, Google Calendar, or Outlook. Updates automatically.</p>
            <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 px-3 py-2 mb-4">
              <span className="text-[10px] text-neutral-500 flex-1 truncate font-mono">{calUrl}</span>
              <button onClick={copy}>{copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} className="text-neutral-400 hover:text-black" />}</button>
            </div>
            <div className="space-y-2">
              <a href={`webcal://cast.tashatongpreecha.com/api/calendar?token=${CAL_SECRET}`}
                className="block w-full text-center border border-neutral-300 py-2 text-[10px] tracking-widest uppercase hover:border-black transition-colors">
                Add to Apple Calendar
              </a>
              <a href={`https://calendar.google.com/calendar/r?cid=webcal://cast.tashatongpreecha.com/api/calendar?token=${CAL_SECRET}`}
                target="_blank"
                className="block w-full text-center border border-neutral-300 py-2 text-[10px] tracking-widest uppercase hover:border-black transition-colors">
                Add to Google Calendar
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="bg-white w-full max-w-md p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-sm tracking-widest uppercase font-medium">Add Event</h2>
              <button onClick={() => setShowModal(false)}><X size={16} className="text-neutral-400 hover:text-black" /></button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="label mb-1 block">Event Title *</label>
                <input value={newEvent.title} onChange={e => setNewEvent(n => ({ ...n, title: e.target.value }))}
                  placeholder="e.g. Callback — VOGUE / Fitting — Adidas..."
                  autoFocus
                  className="w-full border-b border-neutral-200 py-2 text-sm focus:outline-none focus:border-black bg-transparent" />
              </div>

              <div>
                <label className="label mb-1 block">Date *</label>
                <input type="date" value={newEvent.date} onChange={e => setNewEvent(n => ({ ...n, date: e.target.value }))}
                  className="w-full border-b border-neutral-200 py-2 text-sm focus:outline-none focus:border-black bg-transparent" />
              </div>

              <div>
                <label className="label mb-2 block">Type</label>
                <div className="flex flex-wrap gap-2">
                  {EVENT_TYPES.map(t => (
                    <button key={t.value} type="button" onClick={() => setNewEvent(n => ({ ...n, type: t.value }))}
                      className={`text-[10px] tracking-widest uppercase px-3 py-1.5 border transition-colors ${newEvent.type === t.value ? 'bg-black text-white border-black' : 'border-neutral-200 hover:border-black'}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label mb-1 block">Notes</label>
                <textarea value={newEvent.notes} onChange={e => setNewEvent(n => ({ ...n, notes: e.target.value }))}
                  rows={2} placeholder="Optional"
                  className="w-full border-b border-neutral-200 py-2 text-sm focus:outline-none focus:border-black bg-transparent resize-none" />
              </div>

              <button onClick={saveEvent} disabled={saving || !newEvent.title || !newEvent.date}
                className="w-full py-3 bg-black text-white text-xs tracking-widest uppercase hover:bg-neutral-800 transition-colors disabled:opacity-40">
                {saving ? 'Saving...' : 'Add to Calendar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
