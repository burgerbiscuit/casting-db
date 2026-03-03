'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, ChevronRight, Copy, Check } from 'lucide-react'
import Link from 'next/link'

const APP_URL = 'https://cast.tashatongpreecha.com'
const CAL_SECRET = 'tasha-casting-cal-2024'

type CalEvent = {
  date: string
  label: string
  type: 'shoot' | 'presentation' | 'task'
  projectName?: string
  projectId?: string
  color: string
}

export default function CalendarPage() {
  const supabase = createClient()
  const [events, setEvents] = useState<CalEvent[]>([])
  const [today] = useState(new Date())
  const [current, setCurrent] = useState(new Date())
  const [copied, setCopied] = useState(false)

  const calUrl = `${APP_URL}/api/calendar?token=${CAL_SECRET}`

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const [{ data: projects }, { data: tasks }] = await Promise.all([
      supabase.from('projects').select('id, name, shoot_date, presentation_rounds, client_name').eq('status', 'active'),
      supabase.from('tasks').select('id, title, deadline').eq('status', 'open').not('deadline', 'is', null),
    ])

    const evs: CalEvent[] = []

    for (const p of projects || []) {
      if (p.shoot_date) {
        evs.push({ date: p.shoot_date.slice(0, 10), label: `Shoot: ${p.name}${p.client_name ? ' · ' + p.client_name : ''}`, type: 'shoot', projectId: p.id, projectName: p.name, color: 'bg-black text-white' })
      }
      for (const r of (p.presentation_rounds || []) as any[]) {
        if (r.date) evs.push({ date: r.date.slice(0, 10), label: `${r.label || 'Presentation'}: ${p.name}`, type: 'presentation', projectId: p.id, projectName: p.name, color: 'bg-neutral-200 text-black' })
      }
    }
    for (const t of tasks || []) {
      if (t.deadline) evs.push({ date: t.deadline.slice(0, 10), label: `Task: ${t.title}`, type: 'task', color: 'bg-neutral-400 text-white' })
    }

    setEvents(evs)
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
    .slice(0, 10)

  const copy = () => {
    navigator.clipboard.writeText(calUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-2xl font-light tracking-widest uppercase">Calendar</h1>
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
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={'e' + i} className="bg-white min-h-[80px]" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
              const dayEvents = eventsForDate(d)
              const isToday = dateStr === todayStr
              return (
                <div key={d} className="bg-white min-h-[80px] p-1.5">
                  <div className={`text-xs w-6 h-6 flex items-center justify-center mb-1 ${isToday ? 'bg-black text-white rounded-full font-medium' : 'text-neutral-600'}`}>{d}</div>
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
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Upcoming */}
          <div>
            <p className="label mb-4">Upcoming</p>
            {upcoming.length === 0 && <p className="text-xs text-neutral-400">No upcoming events</p>}
            <div className="space-y-3">
              {upcoming.map((ev, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="text-center min-w-[36px]">
                    <div className="text-[10px] text-neutral-400 uppercase">{new Date(ev.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' })}</div>
                    <div className="text-lg font-light leading-none">{new Date(ev.date + 'T12:00:00').getDate()}</div>
                  </div>
                  <div className="flex-1 border-t border-neutral-100 pt-1">
                    <p className="text-xs font-medium leading-tight">{ev.label}</p>
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
              <button onClick={copy} className="flex-shrink-0">{copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} className="text-neutral-400 hover:text-black" />}</button>
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
    </div>
  )
}
