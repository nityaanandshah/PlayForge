-- Fix tournament invitation constraint to allow re-inviting after decline/expiry
-- Drop the old constraint that prevents all duplicates
ALTER TABLE tournament_invitations DROP CONSTRAINT IF EXISTS tournament_invitations_tournament_id_invitee_id_key;

-- Create a partial unique index that only prevents duplicate PENDING invitations
-- This allows re-inviting someone who declined or whose invitation expired
CREATE UNIQUE INDEX IF NOT EXISTS idx_tournament_invitations_unique_pending 
ON tournament_invitations(tournament_id, invitee_id) 
WHERE status = 'pending';

-- This means:
-- ✅ Can send new invitation if previous was 'declined'
-- ✅ Can send new invitation if previous was 'expired'
-- ✅ Can send new invitation if previous was 'accepted' (though they're already in tournament)
-- ❌ Cannot send duplicate invitation if one is still 'pending'



