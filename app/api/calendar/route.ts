import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

function formatICSDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function makeUID(prefix: string, id: string): string {
  return `${prefix}-${id}@cast.tashatongpreecha.com`
}

function escape(str: string): string {
  return (str || '').replace(/[\\;,]/g, c => '\\' + c).replace(/\n/g, '\\n')
}

const VALID_TOKEN = process.env.CALENDAR_SECRET || 'tasha-casting-cal-2024'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (token !== VALID_TOKEN) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const supabase = await createServiceClient()
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, shoot_date, presentation_rounds, client_name, location, status')
    .eq('status', 'active')

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, deadline, assigned_to_name')
    .eq('status', 'open')
    .not('deadline', 'is', null)

  const { data: customEvents } = await supabase
    .from('calendar_events')
    .select('id, title, date, type, notes')

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Tasha Tongpreecha Casting//cast.tashatongpreecha.com//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Tasha Casting',
    'X-WR-TIMEZONE:America/New_York',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
  ]

  for (const p of projects || []) {
    if (p.shoot_date) {
      const start = formatICSDate(p.shoot_date)
      const summary = escape(`📸 Shoot: ${p.name}${p.client_name ? ' (' + p.client_name + ')' : ''}`)
      lines.push(
        'BEGIN:VEVENT',
        `UID:${makeUID('shoot', p.id)}`,
        `DTSTART:${start}`,
        `DTEND:${start}`,
        `SUMMARY:${summary}`,
        p.location ? `LOCATION:${escape(p.location)}` : '',
        'END:VEVENT',
      )
    }

    for (const round of (p.presentation_rounds || []) as any[]) {
      if (!round.date) continue
      const start = formatICSDate(round.date + 'T09:00:00')
      const summary = escape(`📋 ${round.label || 'Presentation'}: ${p.name}`)
      lines.push(
        'BEGIN:VEVENT',
        `UID:${makeUID('pres-' + (round.label || ''), p.id)}`,
        `DTSTART:${start}`,
        `DTEND:${start}`,
        `SUMMARY:${summary}`,
        'END:VEVENT',
      )
    }
  }

  for (const t of tasks || []) {
    if (!t.deadline) continue
    const start = formatICSDate(t.deadline)
    const summary = escape(`✅ Task: ${t.title}${t.assigned_to_name ? ' (' + t.assigned_to_name + ')' : ''}`)
    lines.push(
      'BEGIN:VEVENT',
      `UID:${makeUID('task', t.id)}`,
      `DTSTART:${start}`,
      `DTEND:${start}`,
      `SUMMARY:${summary}`,
      'END:VEVENT',
    )
  }

  const typeEmoji: Record<string, string> = { shoot: '📸', presentation: '📋', meeting: '🤝', deadline: '⚠️', callback: '📞', fitting: '👗', event: '📅' }
  for (const e of customEvents || []) {
    if (!e.date) continue
    const emoji = typeEmoji[e.type] || '📅'
    const start = formatICSDate(e.date + 'T09:00:00')
    lines.push(
      'BEGIN:VEVENT',
      `UID:${makeUID('custom', e.id)}`,
      `DTSTART;VALUE=DATE:${e.date.replace(/-/g, '')}`,
      `DTEND;VALUE=DATE:${e.date.replace(/-/g, '')}`,
      `SUMMARY:${escape(emoji + ' ' + e.title)}`,
      e.notes ? `DESCRIPTION:${escape(e.notes)}` : '',
      'END:VEVENT',
    )
  }

  lines.push('END:VCALENDAR')

  const ics = lines.filter(Boolean).join('\r\n')

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="casting.ics"',
      'Cache-Control': 'no-cache',
    },
  })
}
