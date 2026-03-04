CREATE TABLE IF NOT EXISTS assistant_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  city text,
  country text,
  based_in text, -- combined city, country
  experience_level text, -- 'entry', 'mid', 'senior', 'director'
  years_experience int,
  languages text[],
  skills text[],
  software text[], -- Casting Networks, Spotlight, etc.
  instagram_handle text,
  website_url text,
  resume_url text,
  resume_storage_path text,
  notes text,
  status text DEFAULT 'new', -- new, reviewed, contacted, archived
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE assistant_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY assistant_insert ON assistant_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY assistant_team_all ON assistant_submissions FOR ALL USING (
  EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid())
);
