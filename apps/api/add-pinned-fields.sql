-- Add isPinned field to links table
ALTER TABLE links ADD COLUMN is_pinned INTEGER DEFAULT 0 NOT NULL;

-- Add isPinned field to credentials table
ALTER TABLE credentials ADD COLUMN is_pinned INTEGER DEFAULT 0 NOT NULL;
