# Security Audit: Data Exposure & Client-Side Security
**casting-db — Next.js 14 / Supabase**
Audit date: 2026-03-01

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 3 |
| HIGH     | 4 |
| MEDIUM   | 4 |
| LOW      | 2 |

---

## CRITICAL Findings

### C-1 · admin_notes Rendered Directly in Client Presentation View
**File:** `components/ModelCard.tsx`

```tsx
{presentationModel.admin_notes && (
  <p className="text-xs text-neutral-500 italic mb-3">{presentationModel.admin_notes}</p>
)}
```

The server fetches `presentation_models` with `select('*, models(*)')` — selecting every column including `admin_notes`. That full object is passed as props into `PresentationViewer` → `ModelCard`, which renders `admin_notes` directly in the client-facing UI. Casting clients will see internal admin notes about models.

**Fix:** Use explicit column select in `app/client/presentations/[id]/page.tsx` that omits `admin_notes`:
```ts
.select('id, model_id, show_sizing, show_instagram, show_portfolio, is_visible, display_order, location, rate, client_notes, models(id, first_name, last_name, agency, height_ft, height_in, bust, waist, hips, chest, suit_size, dress_size, shoe_size, portfolio_url, instagram_handle)')
```

---

### C-2 · PDF API Has No Auth Check AND Exposes admin_notes
**File:** `app/api/pdf/[id]/route.ts`

The `/api/pdf/[id]` route:
1. Uses `createServiceClient()` — bypasses ALL Supabase RLS
2. Has **no authentication check** — no `supabase.auth.getUser()` call
3. Renders `admin_notes` in the HTML output: `${pm.admin_notes ? '<div class="notes">' + pm.admin_notes + '</div>' : ''}`

Anyone who knows or guesses a presentation UUID can access the full PDF unauthenticated, and will see admin notes for every model.

**Fix:**
```ts
// Add near top of GET handler:
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
// Verify user has access to this presentation
// Remove admin_notes from HTML template entirely
```

---

### C-3 · /api/invite-client and /api/scout Have No Admin Auth Check
**Files:** `app/api/invite-client/route.ts`, `app/api/scout/route.ts`

Both routes use `createServiceClient()` (full admin DB access) but do NOT verify the caller is an authenticated admin. Any unauthenticated HTTP client can:
- `POST /api/invite-client` to create new Supabase user accounts (calls `supabase.auth.admin.createUser()`)
- `POST /api/scout` to insert arbitrary model records

**Fix for both routes:**
```ts
const userClient = await createClient()
const { data: { user } } = await userClient.auth.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
// Optionally verify user has admin role
```

---

## HIGH Findings

### H-1 · /cast/[slug] Allows Unauthenticated Model Enumeration & Impersonation
**File:** `app/cast/[slug]/page.tsx`

This public unauthenticated page:
- Queries `models` by first name for autocomplete — any visitor can enumerate model names
- When "Yes, This Is Me" is clicked, fetches `select('*')` on the model record — returning ALL fields including `email`, `phone`, `date_of_birth` to the browser
- Allows unauthenticated update of any model record (no identity verification — anyone can select another person's record and overwrite their data)
- Allows unauthenticated insert into `project_models` and `presentation_models`

**Fix:**
- Implement a verification step (PIN, magic link, or last-4 of phone) for returning models
- Limit autocomplete select to `id, first_name, last_name, agency` only
- Move model updates to a server action that validates identity server-side
- Add rate limiting

---

### H-2 · Client Presentation Access Not Explicitly Scoped
**File:** `app/client/presentations/[id]/page.tsx`

The middleware confirms a session exists for `/client/**` but does NOT check if that user is authorized to view a specific presentation. A client can bypass the dashboard and directly visit `/client/presentations/<any-uuid>`. The page code has no ownership check — it relies entirely on Supabase RLS.

**Fix:** Add explicit server-side access check:
```ts
const { data: access } = await supabase
  .from('client_projects')
  .select('id')
  .eq('client_id', user.id)
  .eq('project_id', presentation.project_id)
  .single()
if (!access) return notFound()
```

---

### H-3 · Shortlist Writes Rely Solely on RLS (client_id Supplied Client-Side)
**Files:** `components/ModelCard.tsx`, `components/PresentationViewer.tsx`

Shortlist mutations are done client-side with the anon Supabase client, passing `client_id` as a prop. If Supabase RLS does not enforce `client_id = auth.uid()` on `client_shortlists`, any authenticated user could write shortlist entries for other clients.

**Fix:** Ensure RLS policy:
```sql
CREATE POLICY "clients own shortlists" ON client_shortlists
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());
```
Or move mutation to a server action that always uses `user.id` from session.

---

### H-4 · PDF HTML Template Has XSS Risk (Unescaped User Content)
**File:** `app/api/pdf/[id]/route.ts`

Model data is interpolated directly into HTML strings without escaping:
```ts
`<div class="model-name">${model.first_name} ${model.last_name}</div>`
`${pm.admin_notes ? '<div class="notes">' + pm.admin_notes + '</div>' : ''}`
```

A model who enters `<script>alert(1)</script>` as their name at `/cast/[slug]` will cause that script to execute when the PDF HTML is opened in a browser.

**Fix:** HTML-escape all user content:
```ts
const esc = (s: string) => (s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
```

---

## MEDIUM Findings

### M-1 · Model PII (email, phone, DOB) Passed to Client Components
**File:** `app/client/presentations/[id]/page.tsx`

`select('*, models(*)')` returns full model records. The data — including `email`, `phone`, `date_of_birth` — is passed as JavaScript props to client components. Even though the UI doesn't render them, they're visible in React DevTools and browser memory.

**Fix:** Use explicit column selection excluding PII fields not needed for presentation display.

---

### M-2 · Media Storage URLs Are Fully Public
Storage uploads use `getPublicUrl()` — photos and videos are accessible to anyone with the URL, no authentication required. Model images can be hotlinked or scraped. Deleted files' URLs remain working if previously captured.

**Fix (if privacy required):** Switch to a private bucket and use Supabase signed URLs with expiry:
```ts
const { data } = supabase.storage.from('model-media').createSignedUrl(path, 3600)
```

---

### M-3 · No HTTP Security Headers
**File:** `next.config.mjs`

No `X-Frame-Options`, `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, or `Permissions-Policy` headers are set.

**Fix:** Add to `next.config.mjs`:
```js
async headers() {
  return [{
    source: '/(.*)',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ],
  }]
},
```

---

### M-4 · Middleware Has No Role Separation
**File:** `middleware.ts`

Middleware only checks for authenticated session — it doesn't verify whether a logged-in user is an admin vs client. Role security relies entirely on Supabase RLS. Consider adding role metadata to JWT claims or a custom header check in middleware for defense-in-depth.

---

## LOW Findings

### L-1 · Verify .env.local Is Not in Git History
**File:** `.env.local`

The file contains a live `SUPABASE_SERVICE_ROLE_KEY`. Confirm it is in `.gitignore` and has never been committed. If there's any doubt, rotate the key in the Supabase dashboard immediately.

**Positive:** The service role key is NOT prefixed with `NEXT_PUBLIC_` — it will never be exposed to the browser bundle. ✅

---

### L-2 · No Rate Limiting on /cast/[slug]
The public check-in page fires DB queries on every keystroke and allows unauthenticated model record writes. No rate limiting exists. Add Vercel rate limiting middleware or use Supabase's built-in rate limits.

---

## Environment Variable Summary

| Variable | Browser-Exposed | Risk |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes (intentional) | Low |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes (intentional) | Low — scoped by RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | No (server-only) | ✅ Correct |
| `PILOTERR_API_KEY` | No (server-only) | ✅ Correct |
| `NEXT_PUBLIC_APP_URL` | Yes (intentional) | Low |

No secrets accidentally prefixed with NEXT_PUBLIC_. ✅

---

## XSS Check

No `dangerouslySetInnerHTML` found in client-facing components. ✅

Server-side XSS risk exists in the PDF template (see H-4).

---

## Priority Fix List

1. **[C-1]** Remove `admin_notes` from client presentation query — use explicit column select
2. **[C-2]** Add auth + authorization to `/api/pdf/[id]` and remove `admin_notes` from output
3. **[C-3]** Add admin auth check to `/api/invite-client` and `/api/scout`
4. **[H-1]** Add identity verification to returning model flow in `/cast/[slug]`
5. **[H-2]** Add explicit presentation ownership check in `app/client/presentations/[id]/page.tsx`
6. **[H-4]** HTML-escape all user content in PDF template
7. **[H-3]** Verify/add RLS policy enforcing `client_id = auth.uid()` on `client_shortlists`
8. **[M-1]** Use explicit column selects to avoid sending PII to client components
9. **[M-3]** Add security headers to `next.config.mjs`
