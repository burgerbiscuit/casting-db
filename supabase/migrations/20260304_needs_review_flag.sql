-- Add needs_review flag to agency_contacts
ALTER TABLE agency_contacts ADD COLUMN IF NOT EXISTS needs_review boolean DEFAULT false;

-- Mark the 415 contacts added by the AI scraper (Art + Commerce, Streeters, The Wall Group, LGA Management)
UPDATE agency_contacts
SET needs_review = true
WHERE agency_name IN ('Art + Commerce', 'Streeters', 'The Wall Group', 'LGA Management')
  AND contact_type = 'production';
