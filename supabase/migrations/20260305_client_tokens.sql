-- Token-based client access: no account creation needed
-- Tasha generates a link + password per client in admin, sends it directly
create table if not exists client_tokens (
  id uuid primary key default gen_random_uuid(),
  token uuid unique not null default gen_random_uuid(),
  name text not null,
  email text,
  password_display text not null,   -- stored plain so admin can see/reshare it
  user_id uuid references auth.users(id) on delete cascade,  -- backing Supabase auth user
  project_ids uuid[] not null default '{}',
  created_at timestamptz default now()
);
