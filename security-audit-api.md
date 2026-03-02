# Security Audit – API Routes
**Scope:** `app/api/**` — casting-db (Next.js 14 / Supabase)  
**Date:** 2026-03-01  
**Auditor:** Automated subagent review

---

## Executive Summary

Five API routes were reviewed. **Two CRITICAL issues** were found (unauthenticated admin-level routes), along with HIGH/MEDIUM issues including spam/flooding risk, XSS via unsanitized HTML generation, and error message leakage. No raw SQL injection risks (Supabase client used throughout). No file upload routes exist.

---

## Routes Reviewed

| Route | Method | Auth Required? | Auth Enforced? |
|---|---|---|---|
| `/api/scout` | POST | No (public) | N/A |
| `/api/instagram/[handle]` | GET | Should be admin | ❌ No |
| `/api/invite-client` | POST | Must be admin | ❌ No |
| `/api/invite-team` | POST | Must be admin | ❌ No |
| `/api/pdf/[id]` | GET | Should require auth | ❌ No |

---

## Findings

---

### [CRITICAL] `/api/invite-client` and `/api/invite-team` — No Authentication

**Files:** `app/api/invite-client/route.ts`, `app/api/invite-team/route.ts`

Both routes call `supabase.auth.admin.createUser()` using the **service role key**, which bypasses all RLS. They are completely unauthenticated — anyone on the internet can:

- Create arbitrary Supabase auth users
- Flood the `client_profiles` or `team_members` tables
- Enumerate valid email addresses (error responses differ for duplicates)
- Promote themselves to `admin` role (`invite-team` accepts `role` from request body with no validation)

**Current code (invite-team):**
```ts
const { email, name, role } = await request.json()
// role is NEVER validated — attacker can pass role: "admin"
await supabase.from('team_members').insert({ ..., role: role || 'member' })
```

**Fix — Add session check and validate role:**
```ts
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  // 1. Verify caller is an authenticated admin
  const supabase = await createClient() // user-scoped, not service
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 2. Check admin role
  const { data: member } = await supabase
    .from('team_members')
    .select('role')
    .eq('user_id', user.id)
    .single()
  if (member?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 3. Validate inputs — whitelist role values
  const { email, name, role } = await request.json()
  const ALLOWED_ROLES = ['admin', 'member', 'viewer']
  const safeRole = ALLOWED_ROLES.includes(role) ? role : 'member'

  // Now use serviceClient for the actual user creation
  const serviceSupabase = await createServiceClient()
  // ... rest of logic using safeRole
}
```

---

### [CRITICAL] `/api/pdf/[id]` — Unauthenticated Export + Stored XSS

**File:** `app/api/pdf/[id]/route.ts`

**Issue 1 — No Auth.** Any person with a presentation UUID can download the full HTML export of any presentation, including model sizing, portfolio links, Instagram handles, and admin notes. The middleware only protects `/admin/*` and `/client/*` — API routes are excluded entirely.

**Issue 2 — Stored XSS in generated HTML.** Model data is interpolated directly into an HTML string without escaping:
```ts
// DANGEROUS — admin_notes or names could contain <script> tags
`<div class="notes">${pm.admin_notes}</div>`
`<div class="model-name">${model.first_name} ${model.last_name}</div>`
`<a href="${model.portfolio_url}">${model.portfolio_url}</a>`
```
If any `portfolio_url` contains `javascript:` or a name contains `<script>`, the downloaded HTML executes it when opened.

**Fix:**
```ts
// Add auth check at top of handler:
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

// HTML escape function:
function esc(s: string | null | undefined): string {
  if (!s) return ''
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
         .replace(/"/g,'&quot;').replace(/'/g,'&#39;')
}

// URL validation:
function safeUrl(url: string | null): string {
  if (!url) return '#'
  try {
    const u = new URL(url)
    if (!['http:', 'https:'].includes(u.protocol)) return '#'
    return esc(url)
  } catch { return '#' }
}

// Usage in template:
`<div class="notes">${esc(pm.admin_notes)}</div>`
`<div class="model-name">${esc(model.first_name)} ${esc(model.last_name)}</div>`
`<a href="${safeUrl(model.portfolio_url)}">${esc(model.portfolio_url)}</a>`
```

---

### [HIGH] `/api/scout` — No Rate Limiting, No Input Validation

**File:** `app/api/scout/route.ts`

Intentionally public, but has several exploitable gaps:

**Issue 1 — No rate limiting.** Anyone can POST thousands of fake model records in seconds, flooding the `models` table with garbage data and inflating storage costs.

**Issue 2 — No input validation.** Fields are inserted directly without format or bounds checking:
- `height_ft`/`height_in`: `parseInt()` called but never bounds-checked (e.g., `height_ft: 999999`)
- `email`: Not validated as a real email format
- `portfolio_url`/`website_url`: Not validated as URLs — can store `javascript:alert(1)`
- `notes`, `agency`, etc.: No length caps

**Issue 3 — DB error message leaked to client:**
```ts
return NextResponse.json({ error: error.message }, { status: 500 })
// Exposes table names, column names, constraint details
```

**Issue 4 — No CAPTCHA or honeypot.**

**Fix — Add Zod validation:**
```ts
import { z } from 'zod'

const ScoutSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  email: z.string().email().max(255).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  instagram_handle: z.string().max(60).regex(/^[a-zA-Z0-9._]+$/).optional().nullable(),
  portfolio_url: z.string().url().max(500).optional().nullable(),
  website_url: z.string().url().max(500).optional().nullable(),
  height_ft: z.number().int().min(0).max(8).optional().nullable(),
  height_in: z.number().int().min(0).max(11).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  languages: z.array(z.string().max(50)).max(20).default([]),
  skills: z.array(z.string().max(100)).max(50).default([]),
  hobbies: z.array(z.string().max(100)).max(50).default([]),
  // ... other fields with appropriate limits
})

export async function POST(req: Request) {
  const raw = await req.json()
  const parsed = ScoutSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }
  // ... insert parsed.data
  if (error) {
    console.error('Scout insert error:', error) // log internally
    return NextResponse.json({ error: 'Submission failed. Please try again.' }, { status: 500 })
  }
}
```

**Fix — Add rate limiting (Upstash Redis):**
```ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '10 m'), // 5 per 10 min per IP
})

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const { success } = await ratelimit.limit(ip)
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  // ...
}
```

---

### [HIGH] `/api/instagram/[handle]` — Unauthenticated Paid API Trigger

**File:** `app/api/instagram/[handle]/route.ts`

**Issue 1 — No auth check.** Anyone can call this with arbitrary handles, triggering paid Piloterr API calls. An automated script could iterate millions of handles and drain your API credit.

**Issue 2 — No handle validation.** The handle is used directly in a fetch URL with no character or length validation.

**Issue 3 — No negative caching.** If a handle isn't in cache, every request always hits the live API — even for non-existent accounts.

**Fix:**
```ts
export async function GET(request: NextRequest, { params }) {
  // Require authentication
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Validate handle format
  const handle = params.handle
  if (!handle || !/^[a-zA-Z0-9._]{1,60}$/.test(handle)) {
    return NextResponse.json({ error: 'Invalid handle' }, { status: 400 })
  }
  // ... rest of logic
}
```

---

### [MEDIUM] Middleware Does Not Protect API Routes

**File:** `middleware.ts`

```ts
matcher: ['/admin/:path*', '/client/:path*']
```

API routes are entirely outside middleware scope. All per-route auth must be self-enforced. Currently, only `/api/scout` is intentionally public — the other four are not.

**Fix:** Implement per-route auth checks as shown above (preferred over middleware for API routes, since some need to remain public).

---

### [MEDIUM] Error Messages Leak Internal Details

**Affected routes:** `/api/scout`, `/api/invite-client`, `/api/invite-team`

```ts
return NextResponse.json({ error: error.message }, { status: 500 })
```

Supabase errors expose table names, column constraints, and foreign key relationships.

**Fix:** Log internally, return generic message:
```ts
console.error('[scout] DB error:', error)
return NextResponse.json({ error: 'Submission failed. Please try again.' }, { status: 500 })
```

---

### [LOW] Weak Temporary Password Generation

**Affected:** `/api/invite-client`, `/api/invite-team`

```ts
password: Math.random().toString(36).slice(-12) // Not cryptographically secure
```

**Fix:**
```ts
import { randomBytes } from 'crypto'
const tempPassword = randomBytes(16).toString('base64url')
```

---

### [LOW] No CORS Configuration

No routes set CORS headers. Next.js defaults to same-origin, which is fine for now. If you ever expose routes to a mobile app or third-party client, explicitly configure CORS rather than using a wildcard.

---

### [INFO] No SQL Injection Risk ✅

All DB interactions use the Supabase JS client with parameterized queries. No raw SQL strings found.

### [INFO] No File Upload Routes ✅

No file upload API endpoints exist. Files presumably go directly to Supabase Storage from the client.

---

## Summary & Priority

| Priority | Severity | Finding |
|---|---|---|
| 1 | 🔴 CRITICAL | Add auth to `/api/invite-client` and `/api/invite-team` — currently anyone can create users |
| 2 | 🔴 CRITICAL | Add auth to `/api/pdf/[id]` + escape HTML in PDF template |
| 3 | 🟠 HIGH | Add rate limiting + Zod validation to `/api/scout` |
| 4 | 🟠 HIGH | Add auth to `/api/instagram/[handle]` + validate handle format |
| 5 | 🟡 MEDIUM | Validate `role` whitelist in `/api/invite-team` |
| 6 | 🟡 MEDIUM | Replace leaked DB error messages with generic responses |
| 7 | 🔵 LOW | Use `crypto.randomBytes` instead of `Math.random` for temp passwords |
| 8 | 🔵 LOW | Define CORS policy before any public API exposure |
