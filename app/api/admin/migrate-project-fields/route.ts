import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// One-time migration: adds URL + billing columns to projects table
// DELETE this file after running once
export async function POST(req: NextRequest) {
  const { secret } = await req.json()
  if (secret !== process.env.CALENDAR_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { Client } = require('pg')
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL
  if (!dbUrl) return NextResponse.json({ error: 'No DATABASE_URL set. Add it to Vercel env vars.' }, { status: 500 })

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
  await client.connect()
  const sqls = [
    'ALTER TABLE projects ADD COLUMN IF NOT EXISTS photographer_url text',
    'ALTER TABLE projects ADD COLUMN IF NOT EXISTS stylist_url text',
    'ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_url text',
    'ALTER TABLE projects ADD COLUMN IF NOT EXISTS billing_name text',
    'ALTER TABLE projects ADD COLUMN IF NOT EXISTS billing_email text',
    'ALTER TABLE projects ADD COLUMN IF NOT EXISTS billing_address text',
    'ALTER TABLE projects ADD COLUMN IF NOT EXISTS billing_notes text',
  ]
  for (const sql of sqls) await client.query(sql)
  await client.end()
  return NextResponse.json({ ok: true, message: 'Migration complete. You can delete this endpoint.' })
}
