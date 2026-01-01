-- Add current_round column to tournaments table
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS current_round INTEGER NOT NULL DEFAULT 0;

