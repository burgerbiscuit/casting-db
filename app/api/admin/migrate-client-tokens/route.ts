import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createServiceClient()
  // Create client_tokens table via raw RPC isn't possible, use Supabase JS to insert into pg_catalog
  // Instead, we'll use the REST API directly
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_ddl`,
    {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql: `
        create table if not exists client_tokens (
          id uuid primary key default gen_random_uuid(),
          token uuid unique not null default gen_random_uuid(),
          name text not null,
          email text,
          password_display text not null,
          user_id uuid references auth.users(id) on delete cascade,
          project_ids uuid[] not null default '{}',
          created_at timestamptz default now()
        );
      `})
    }
  )
  return NextResponse.json({ ok: true })
}
