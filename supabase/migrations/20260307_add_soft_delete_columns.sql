-- Add soft delete support to models table
ALTER TABLE models ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE models ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add soft delete support to model_media table
ALTER TABLE model_media ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE model_media ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_models_is_deleted ON models(is_deleted);
CREATE INDEX IF NOT EXISTS idx_model_media_is_deleted ON model_media(is_deleted);
