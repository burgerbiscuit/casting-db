-- Add payment_link to invoices (if not exists)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_link text;
