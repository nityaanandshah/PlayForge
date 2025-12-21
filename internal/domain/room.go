package domain

import (
	"time"

	"github.com/google/uuid"
)

// RoomType represents the type of room
type RoomType string

const (
	RoomTypeQuickPlay RoomType = "quickplay"
	RoomTypePrivate   RoomType = "private"
	RoomTypeRanked    RoomType = "ranked"
)

// RoomStatus represents the current status of a room
type RoomStatus string

const (
	RoomStatusWaiting  RoomStatus = "waiting"  // Waiting for players
	RoomStatusReady    RoomStatus = "ready"    // All players ready
	RoomStatusActive   RoomStatus = "active"   // Game in progress
	RoomStatusComplete RoomStatus = "complete" // Game finished
	RoomStatusClosed   RoomStatus = "closed"   // Room closed
)

// ParticipantRole represents a participant's role in the room
type ParticipantRole string

const (
	ParticipantRoleHost      ParticipantRole = "host"
	ParticipantRolePlayer    ParticipantRole = "player"
	ParticipantRoleSpectator ParticipantRole = "spectator"
)

// Room represents a game room
type Room struct {
	ID           uuid.UUID         `json:"id"`
	Type         RoomType          `json:"type"`
	Status       RoomStatus        `json:"status"`
	GameType     string            `json:"game_type"`
	JoinCode     string            `json:"join_code"`
	HostID       uuid.UUID         `json:"host_id"`
	GameID       *uuid.UUID        `json:"game_id,omitempty"`
	MaxPlayers   int               `json:"max_players"`
	Participants []Participant     `json:"participants"`
	CreatedAt    time.Time         `json:"created_at"`
	UpdatedAt    time.Time         `json:"updated_at"`
	StartedAt    *time.Time        `json:"started_at,omitempty"`
	ExpiresAt    time.Time         `json:"expires_at"`
}

// Participant represents a room participant
type Participant struct {
	UserID    uuid.UUID       `json:"user_id"`
	Username  string          `json:"username"`
	Role      ParticipantRole `json:"role"`
	IsReady   bool            `json:"is_ready"`
	JoinedAt  time.Time       `json:"joined_at"`
}

// CreateRoomRequest represents a room creation request
type CreateRoomRequest struct {
	GameType   string   `json:"game_type" validate:"required,oneof=tictactoe connect4 rps dotsandboxes"`
	Type       RoomType `json:"type" validate:"required,oneof=quickplay private ranked"`
	MaxPlayers int      `json:"max_players" validate:"required,min=2,max=4"`
}

// JoinRoomRequest represents a room join request
type JoinRoomRequest struct {
	JoinCode string `json:"join_code" validate:"required,len=6"`
}

// RoomResponse is the API response for room operations
type RoomResponse struct {
	Room    *Room  `json:"room"`
	Message string `json:"message,omitempty"`
}

