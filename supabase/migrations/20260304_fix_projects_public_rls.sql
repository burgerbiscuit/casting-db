-- Security fix: remove public read policies on projects table
-- The app routes all unauthenticated project lookups through server-side API routes
-- (e.g. /api/project-by-slug) that use the service role and limit exposed columns.
-- These policies were unnecessary and exposed sensitive fields (billing_contact, model_rate,
-- budget info, client PII, etc.) to anonymous users via the direct REST API.

DROP POLICY IF EXISTS "public_read_projects" ON projects;
DROP POLICY IF EXISTS "public_read_active_projects" ON projects;
