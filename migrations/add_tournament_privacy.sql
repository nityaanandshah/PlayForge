-- Add privacy and max participants to tournaments table
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS max_participants INTEGER NOT NULL DEFAULT 8,
ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS join_code VARCHAR(10);

-- Update existing tournaments to have max_participants based on their room
UPDATE tournaments t
SET max_participants = r.max_players
FROM rooms r
WHERE t.room_id = r.id AND t.max_participants = 8;

