-- Tournament Invitations table
CREATE TABLE IF NOT EXISTS tournament_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invitee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days'),
    UNIQUE(tournament_id, invitee_id) -- Prevent duplicate invitations
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tournament_invitations_tournament_id ON tournament_invitations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_invitations_invitee_id ON tournament_invitations(invitee_id);
CREATE INDEX IF NOT EXISTS idx_tournament_invitations_status ON tournament_invitations(status);

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_tournament_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tournament_invitations_updated_at
    BEFORE UPDATE ON tournament_invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_tournament_invitations_updated_at();



