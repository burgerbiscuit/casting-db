-- Security fix: remove public_read_projects policy
-- The app routes all unauthenticated project lookups through server-side API routes
-- (e.g. /api/project-by-slug) that use the service role and limit exposed columns.
-- This policy is unnecessary and exposes sensitive fields (billing_contact, model_rate,
-- descriptions with budget info, etc.) to anonymous users via the REST API.

DROP POLICY IF EXISTS "public_read_projects" ON projects;
