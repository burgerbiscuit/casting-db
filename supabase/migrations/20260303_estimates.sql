-- Estimates table
CREATE TABLE IF NOT EXISTS estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id),
  estimate_number text,
  client_name text,
  client_email text,
  issue_date date DEFAULT CURRENT_DATE,
  valid_until date,
  casting_fee numeric DEFAULT 0,
  talent_budget numeric DEFAULT 0,
  expenses numeric DEFAULT 0,
  subtotal numeric DEFAULT 0,
  notes text,
  status text DEFAULT 'draft',
  sign_token uuid DEFAULT gen_random_uuid(),
  signature_data text,
  signed_at timestamptz,
  signed_pdf_url text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS estimate_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id uuid REFERENCES estimates(id) ON DELETE CASCADE,
  description text,
  quantity numeric DEFAULT 1,
  rate numeric DEFAULT 0,
  amount numeric DEFAULT 0
);

ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_items ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='estimates' AND policyname='estimates_team_all') THEN
    CREATE POLICY estimates_team_all ON estimates
      USING (EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='estimates' AND policyname='estimates_public_select') THEN
    CREATE POLICY estimates_public_select ON estimates FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='estimate_items' AND policyname='estimate_items_team_all') THEN
    CREATE POLICY estimate_items_team_all ON estimate_items
      USING (EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='estimate_items' AND policyname='estimate_items_public_select') THEN
    CREATE POLICY estimate_items_public_select ON estimate_items FOR SELECT USING (true);
  END IF;
END $$;
