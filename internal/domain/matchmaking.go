package domain

import (
	"time"

	"github.com/google/uuid"
)

// MatchmakingStatus represents the status of a matchmaking request
type MatchmakingStatus string

const (
	MatchmakingStatusQueued  MatchmakingStatus = "queued"
	MatchmakingStatusMatched MatchmakingStatus = "matched"
	MatchmakingStatusTimeout MatchmakingStatus = "timeout"
	MatchmakingStatusCancelled MatchmakingStatus = "cancelled"
)

// QueueEntry represents a player in the matchmaking queue
type QueueEntry struct {
	ID            uuid.UUID         `json:"id"`
	UserID        uuid.UUID         `json:"user_id"`
	Username      string            `json:"username"`
	GameType      string            `json:"game_type"`
	Rating        int               `json:"rating"`
	Status        MatchmakingStatus `json:"status"`
	QueuedAt      time.Time         `json:"queued_at"`
	MatchedRoomID *uuid.UUID        `json:"matched_room_id,omitempty"`
	ExpiresAt     time.Time         `json:"expires_at"`
}

// MatchmakingRequest represents a matchmaking request
type MatchmakingRequest struct {
	GameType string `json:"game_type" validate:"required,oneof=tictactoe connect4 rps dotsandboxes"`
}

// MatchmakingResponse is the API response for matchmaking
type MatchmakingResponse struct {
	QueueEntry *QueueEntry `json:"queue_entry"`
	Message    string      `json:"message,omitempty"`
}

// MatchFoundResponse represents a match found notification
type MatchFoundResponse struct {
	RoomID   uuid.UUID `json:"room_id"`
	JoinCode string    `json:"join_code"`
	Message  string    `json:"message"`
}

