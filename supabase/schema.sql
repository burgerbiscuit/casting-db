-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Projects
create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  status text not null default 'active',
  slug text unique not null,
  created_at timestamptz default now()
);

-- Models
create table models (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  agency text,
  ethnicity text,
  height_ft int,
  height_in int,
  bust text,
  waist text,
  hips text,
  shoe_size text,
  dress_size text,
  instagram_handle text,
  portfolio_url text,
  skills text[] default '{}',
  hobbies text[] default '{}',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Project <-> Model join
create table project_models (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  model_id uuid references models(id) on delete cascade,
  signed_in_at timestamptz default now(),
  unique(project_id, model_id)
);

-- Model media (photos/videos)
create table model_media (
  id uuid primary key default gen_random_uuid(),
  model_id uuid references models(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  storage_path text not null,
  public_url text not null,
  type text not null default 'photo',
  is_visible bool not null default true,
  is_pdf_primary bool not null default false,
  is_pdf_secondary bool not null default false,
  display_order int not null default 0,
  uploaded_at timestamptz default now()
);

-- Presentations
create table presentations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  is_published bool not null default false,
  created_at timestamptz default now()
);

-- Presentation <-> Model join with display settings
create table presentation_models (
  id uuid primary key default gen_random_uuid(),
  presentation_id uuid references presentations(id) on delete cascade,
  model_id uuid references models(id) on delete cascade,
  display_order int not null default 0,
  show_sizing bool not null default true,
  show_instagram bool not null default true,
  show_portfolio bool not null default true,
  admin_notes text,
  is_visible bool not null default true,
  unique(presentation_id, model_id)
);

-- Client <-> Project access
create table client_projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references auth.users(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  unique(client_id, project_id)
);

-- Client shortlists & notes
create table client_shortlists (
  id uuid primary key default gen_random_uuid(),
  presentation_id uuid references presentations(id) on delete cascade,
  model_id uuid references models(id) on delete cascade,
  client_id uuid references auth.users(id) on delete cascade,
  notes text,
  created_at timestamptz default now(),
  unique(presentation_id, model_id, client_id)
);

-- Team members (admin users)
create table team_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  name text,
  email text not null,
  role text not null default 'member',
  created_at timestamptz default now()
);

-- Instagram follower cache
create table instagram_cache (
  id uuid primary key default gen_random_uuid(),
  handle text unique not null,
  follower_count bigint,
  cached_at timestamptz default now()
);

-- Client user metadata (separate from team_members)
create table client_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  name text,
  email text not null,
  created_at timestamptz default now()
);

-- RLS Policies
alter table projects enable row level security;
alter table models enable row level security;
alter table project_models enable row level security;
alter table model_media enable row level security;
alter table presentations enable row level security;
alter table presentation_models enable row level security;
alter table client_projects enable row level security;
alter table client_shortlists enable row level security;
alter table team_members enable row level security;
alter table instagram_cache enable row level security;
alter table client_profiles enable row level security;

-- Helper: is current user a team member?
create or replace function is_team_member()
returns bool language sql security definer as $$
  select exists (select 1 from team_members where user_id = auth.uid())
$$;

-- Helper: is current user a client for this project?
create or replace function is_client_for_project(p_project_id uuid)
returns bool language sql security definer as $$
  select exists (select 1 from client_projects where client_id = auth.uid() and project_id = p_project_id)
$$;

-- Projects: team can do anything; clients can read active ones they have access to
create policy "team_all_projects" on projects for all using (is_team_member());
create policy "client_read_projects" on projects for select using (
  status = 'active' and exists (
    select 1 from client_projects where client_id = auth.uid() and project_id = projects.id
  )
);
-- Public read for cast sign-in
create policy "public_read_projects" on projects for select using (status = 'active');

-- Models: team full access; public insert (sign-in flow)
create policy "team_all_models" on models for all using (is_team_member());
create policy "public_insert_models" on models for insert with check (true);
create policy "public_read_models" on models for select using (true);
create policy "public_update_models" on models for update using (true);

-- project_models: team full; public insert
create policy "team_all_pm" on project_models for all using (is_team_member());
create policy "public_insert_pm" on project_models for insert with check (true);
create policy "public_read_pm" on project_models for select using (true);

-- model_media: team full; clients can see visible media for their projects
create policy "team_all_media" on model_media for all using (is_team_member());
create policy "client_read_media" on model_media for select using (
  is_visible = true and (
    project_id is null or is_client_for_project(project_id) or is_team_member()
  )
);

-- presentations: team full; clients can read published ones for their projects
create policy "team_all_pres" on presentations for all using (is_team_member());
create policy "client_read_pres" on presentations for select using (
  is_published = true and exists (
    select 1 from client_projects cp
    join projects p on p.id = cp.project_id
    where cp.client_id = auth.uid() and p.id = presentations.project_id
  )
);

-- presentation_models: team full; clients can read
create policy "team_all_pm2" on presentation_models for all using (is_team_member());
create policy "client_read_pm2" on presentation_models for select using (
  exists (
    select 1 from presentations pres
    join client_projects cp on cp.project_id = pres.project_id
    where cp.client_id = auth.uid() and pres.id = presentation_models.presentation_id
  )
);

-- client_projects: team full
create policy "team_all_cp" on client_projects for all using (is_team_member());
create policy "client_read_own_cp" on client_projects for select using (client_id = auth.uid());

-- client_shortlists: clients manage their own
create policy "client_own_shortlists" on client_shortlists for all using (client_id = auth.uid());
create policy "team_read_shortlists" on client_shortlists for select using (is_team_member());

-- team_members: team can read all; admins can write
create policy "team_read_team" on team_members for select using (is_team_member());
create policy "public_read_team_check" on team_members for select using (user_id = auth.uid());

-- instagram_cache: anyone can read; service role writes
create policy "public_read_ig" on instagram_cache for select using (true);

-- client_profiles: team full; client reads own
create policy "team_all_cp2" on client_profiles for all using (is_team_member());
create policy "client_read_own_profile" on client_profiles for select using (user_id = auth.uid());

-- Storage bucket (run in Supabase dashboard):
-- Create bucket named "model-media" with public access
