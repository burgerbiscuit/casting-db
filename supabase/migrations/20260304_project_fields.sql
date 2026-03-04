-- Hyperlink fields for project credits
ALTER TABLE projects ADD COLUMN IF NOT EXISTS photographer_url text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS stylist_url text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_url text;

-- Expanded billing
ALTER TABLE projects ADD COLUMN IF NOT EXISTS billing_name text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS billing_email text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS billing_address text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS billing_notes text;
