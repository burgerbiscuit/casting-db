import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-api-key')
  
  // Protect with secret key
  if (secret !== process.env.CALENDAR_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { Client } = require('pg')
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'No DATABASE_URL set' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
  
  try {
    await client.connect()
    
    const sqls = [
      'ALTER TABLE models ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;',
      'ALTER TABLE models ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;',
      'CREATE INDEX IF NOT EXISTS idx_models_is_deleted ON models(is_deleted);',
    ]

    for (const sql of sqls) {
      console.log('Executing:', sql)
      await client.query(sql)
    }

    await client.end()
    return NextResponse.json({ ok: true, message: 'Soft-delete columns added successfully' })
  } catch (e: any) {
    console.error('Migration error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
