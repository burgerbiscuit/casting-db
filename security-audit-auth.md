# Security Audit: Auth & Access Control
**Date:** 2026-03-01  
**Scope:** casting-db Next.js 14 app  
**Focus:** Authentication, Authorization, Access Control

---

## Executive Summary

The app has **4 critical vulnerabilities** that need immediate attention before going to production. The most severe issues are unprotected API routes using the service role key (anyone on the internet can create admin accounts or download any presentation), and an RLS policy that lets anyone update any model's data.

---

## Findings

---

### 🔴 CRITICAL — `/api/invite-client` and `/api/invite-team` have zero authentication

**Files:** `app/api/invite-client/route.ts`, `app/api/invite-team/route.ts`

Both routes use `createServiceClient()` (full admin/service-role Supabase access) but perform **no authentication or authorization check** before executing. Any unauthenticated person on the internet can:

- `POST /api/invite-client` → create arbitrary Supabase auth users
- `POST /api/invite-team` → create those users as team members (admins)

This is the worst vulnerability in the app. An attacker could create themselves a team member account and gain full admin access.

**Fix:**
```ts
// At the top of both route handlers, before touching the service client:
const anonSupabase = await createClient() // regular anon client
const { data: { user } } = await anonSupabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

const { data: tm } = await anonSupabase.from('team_members').select('id').eq('user_id', user.id).single()
if (!tm) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

// Now safe to use service client
const supabase = await createServiceClient()
```

---

### 🔴 CRITICAL — `/api/pdf/[id]` exposes any presentation without auth

**File:** `app/api/pdf/[id]/route.ts`

This route serves full presentation HTML (model photos, sizing, notes) using the service role client with **no authentication check**. Anyone who knows a presentation UUID can download it — bypassing all client access controls.

**Fix:** Add auth + access verification before serving:
```ts
const anonSupabase = await createClient()
const { data: { user } } = await anonSupabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

// Verify user is team member OR has client_projects access to this presentation
const { data: teamCheck } = await anonSupabase.from('team_members').select('id').eq('user_id', user.id).single()
if (!teamCheck) {
  // Check client access
  const { data: pres } = await anonSupabase.from('presentations').select('project_id').eq('id', id).single()
  if (!pres) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { data: access } = await anonSupabase.from('client_projects')
    .select('id').eq('client_id', user.id).eq('project_id', pres.project_id).single()
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
// Proceed with service client
```

---

### 🔴 CRITICAL — RLS `public_update_models` lets anyone update any model record

**File:** `supabase/schema.sql`

```sql
create policy "public_update_models" on models for update using (true);
```

This allows **any unauthenticated user** to update **any model's data**. Since the `cast/[slug]` sign-in uses the anon key client-side, a malicious user can:

1. Enumerate model IDs via the also-public read policy
2. Call `supabase.from('models').update({...}).eq('id', anyModelId)` directly from the browser console
3. Overwrite any model's measurements, contact info, Instagram handle, etc.

The "confirm identity" UI step in the cast form is trivially bypassed.

**Fix:**
```sql
-- Remove blanket public update
drop policy "public_update_models" on models;

-- Team members can update
-- (already covered by "team_all_models" policy)

-- For the cast sign-in flow: move handleSubmit to a server action/API route
-- that validates the project slug server-side, then uses the service client
```

---

### 🔴 CRITICAL — `public_read_models` exposes all model PII to unauthenticated users

**File:** `supabase/schema.sql`

```sql
create policy "public_read_models" on models for select using (true);
```

The entire `models` table — including email, phone, date of birth, Instagram handles — is readable by anyone without an account. This is a GDPR/privacy liability and an enumeration risk.

The cast autocomplete only needs `first_name`, `last_name`, `agency`. Full PII should not be public.

**Fix:**
```sql
drop policy "public_read_models" on models;

-- Clients can only see models in their assigned projects
create policy "client_read_models" on models for select using (
  exists (
    select 1 from project_models pm
    join client_projects cp on cp.project_id = pm.project_id
    where pm.model_id = models.id and cp.client_id = auth.uid()
  )
);

-- For cast autocomplete: create a Postgres function/view that returns
-- only safe fields (id, first_name, last_name, agency) with SECURITY DEFINER
-- and call it via RPC instead of direct table query.
```

---

### 🔴 HIGH — Client can access any presentation by UUID (IDOR)

**File:** `app/client/presentations/[id]/page.tsx`

The presentation page fetches by ID without verifying the client has access to that project:

```ts
const { data: presentation } = await supabase
  .from('presentations').select('*, projects(name)').eq('id', id).single()
```

A logged-in client can visit `/client/presentations/<any-uuid>` and view another client's presentation. The RLS policy for `client_read_pres` *should* block this, but the app layer should not rely solely on RLS — defense in depth requires both layers to enforce access.

**Fix:**
```ts
if (!presentation) return notFound()

// Verify this client has access to the presentation's project
const { data: access } = await supabase
  .from('client_projects')
  .select('id')
  .eq('client_id', user?.id)
  .eq('project_id', (presentation as any).project_id)
  .single()

if (!access) return notFound()
```

---

### 🟠 HIGH — Middleware checks authentication but not role (clients can visit /admin/*)

**File:** `middleware.ts`

```ts
if (path.startsWith('/admin') && path !== '/admin/login') {
  if (!user) return NextResponse.redirect(new URL('/admin/login', request.url))
}
```

Only checks that a user is logged in — not that they're a team member. A client account can navigate to `/admin/*` and see the admin sidebar/layout. RLS blocks their data fetches, but they can see the admin UI structure.

**Fix:**
```ts
if (path.startsWith('/admin') && path !== '/admin/login') {
  if (!user) return NextResponse.redirect(new URL('/admin/login', request.url))
  const { data: tm } = await supabase.from('team_members').select('id').eq('user_id', user.id).single()
  if (!tm) return NextResponse.redirect(new URL('/client', request.url))
}
```

Alternative with less DB overhead: store role in Supabase JWT app_metadata at user creation time and read from `user.app_metadata.role` in the middleware.

---

### 🟠 HIGH — `/api/scout` is unauthenticated and uses service role

**File:** `app/api/scout/route.ts`

Uses `createServiceClient()` (bypasses all RLS) with no auth check. Publicly accessible. Anyone can insert model records into the database.

**Fix:** Add the same team-member auth check as the invite routes.

---

### 🟡 MEDIUM — `public_insert_pm` on `project_models` allows arbitrary linking

**File:** `supabase/schema.sql`

```sql
create policy "public_insert_pm" on project_models for insert with check (true);
```

Anyone can insert a row linking any model to any project. The cast sign-in adds models to projects client-side, but so can anyone with the anon key.

**Fix:** Move `project_models` insert in the cast flow to a server action. Remove the public insert policy and replace with a service-role-only path.

---

### 🟡 MEDIUM — `/api/instagram/[handle]` is unauthenticated

**File:** `app/api/instagram/[handle]/route.ts`

No auth check. Anyone can hit this endpoint to:
- Trigger Instagram lookups, burning Piloterr API quota
- Enumerate which handles are cached

**Fix:** Add team member auth check or rate limiting.

---

### 🟡 MEDIUM — cast/[slug] `handleSubmit` can be intercepted to target other projects

The submit flow reads `project.id` from client-side state. A user could modify the project_id in the request to target a different project. Since project selection happens client-side with no server-side re-validation of the slug→project mapping at submit time, the association could be manipulated.

**Fix:** Move `handleSubmit` to a Next.js server action that accepts the `slug` param, re-fetches the project server-side, and uses the service client for writes. Never trust the project_id from client state.

---

### 🟢 LOW — `model_media` client policy exposes all null-project media to any client

**File:** `supabase/schema.sql`

```sql
create policy "client_read_media" on model_media for select using (
  is_visible = true and (
    project_id is null or is_client_for_project(project_id) or is_team_member()
  )
);
```

When `project_id IS NULL`, any authenticated user (all clients) can read those media records regardless of project assignment.

**Fix:**
```sql
-- Replace the null branch:
project_id is null and is_team_member()
-- or drop the null branch entirely if media should always be project-scoped
```

---

### 🟢 LOW — Admin layout is a client component with no server-side fallback auth gate

**File:** `app/admin/layout.tsx`

The layout is `'use client'` with no server-side auth. Auth is enforced only by middleware. If middleware is ever misconfigured, the admin UI renders with no fallback.

**Fix:** Wrap with a server component parent that validates auth:
```ts
// app/admin/layout.tsx (server component wrapper)
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayoutWrapper({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')
  // ... render client layout
}
```

---

### 🟢 LOW — No rate limiting on public endpoints

No rate limiting on model autocomplete, cast form submission, PDF downloads, or Instagram lookups. Potential for enumeration, quota exhaustion, and data scraping.

**Fix:** Add Vercel Edge rate limiting or use `@upstash/ratelimit` for public-facing routes.

---

## Environment / Secrets Assessment

`.env.local` variables (values redacted):
- `NEXT_PUBLIC_SUPABASE_URL` — ✅ public-safe
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — ✅ public-safe (but see RLS issues)
- `SUPABASE_SERVICE_ROLE_KEY` — ✅ server-only, correctly not prefixed with `NEXT_PUBLIC_`
- `PILOTERR_API_KEY` — ✅ server-only, correctly scoped
- `NEXT_PUBLIC_APP_URL` — ✅ public-safe

**No hardcoded secrets found in source files.** ✅

---

## No `/api/migrate` Route Found

✅ No migration endpoint exists.

---

## Priority Fix Order

| Priority | Issue | Effort |
|----------|-------|--------|
| 🔴 1 | Auth gate on `/api/invite-client` + `/api/invite-team` | ~30 min |
| 🔴 2 | Auth gate on `/api/pdf/[id]` | ~30 min |
| 🔴 3 | Remove `public_update_models` RLS; move cast submit to server action | ~2-3h |
| 🔴 4 | Restrict `public_read_models` (stop exposing PII) | ~1-2h |
| 🔴 5 | Add IDOR check in `/client/presentations/[id]` | ~15 min |
| 🔴 6 | Add role check (team member) to admin middleware | ~30 min |
| 🟠 7 | Auth gate on `/api/scout` | ~15 min |
| 🟡 8 | Move project_models insert to server action | ~1h |
| 🟡 9 | Fix `model_media` null project_id leak | ~5 min |
| 🟢 10 | Rate limiting on public routes | Varies |
