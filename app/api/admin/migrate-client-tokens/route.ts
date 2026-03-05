import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST() {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const svc = await createServiceClient()
  const { data: member } = await svc.from('team_members').select('id').eq('user_id', user.id).single()
  if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Try inserting a dummy row to test if table exists
  const { error: testError } = await svc.from('client_tokens').select('id').limit(1)
  if (!testError) return NextResponse.json({ ok: true, message: 'Table already exists' })

  // Table doesn't exist — create via Supabase Management REST API
  // Note: requires SUPABASE_ACCESS_TOKEN env var (project access token from supabase.com/dashboard)
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)/)?.[1]
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN

  if (!accessToken || !projectRef) {
    return NextResponse.json({ 
      error: 'SUPABASE_ACCESS_TOKEN not set. Run this SQL in the Supabase dashboard:\n\ncreate table client_tokens (id uuid primary key default gen_random_uuid(), token uuid unique not null default gen_random_uuid(), name text not null, email text, password_display text not null, user_id uuid references auth.users(id) on delete cascade, project_ids uuid[] not null default \'{}\', created_at timestamptz default now());'
    }, { status: 500 })
  }

  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: `create table if not exists client_tokens (id uuid primary key default gen_random_uuid(), token uuid unique not null default gen_random_uuid(), name text not null, email text, password_display text not null, user_id uuid references auth.users(id) on delete cascade, project_ids uuid[] not null default '{}', created_at timestamptz default now());` })
  })
  
  const result = await res.json()
  return NextResponse.json({ ok: res.ok, result })
}
