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

// GameSettings represents customizable game settings
type GameSettings struct {
	// Tic-Tac-Toe settings
	TicTacToeGridSize int `json:"tictactoe_grid_size,omitempty"` // 3, 4, or 5
	TicTacToeWinLength int `json:"tictactoe_win_length,omitempty"` // How many in a row to win
	
	// Connect-4 settings
	Connect4Rows int `json:"connect4_rows,omitempty"` // 4-10
	Connect4Cols int `json:"connect4_cols,omitempty"` // 4-10
	Connect4WinLength int `json:"connect4_win_length,omitempty"` // 4, 5, etc.
	
	// RPS settings
	RPSBestOf int `json:"rps_best_of,omitempty"` // 3, 5, 7, 9
	
	// Dots & Boxes settings
	DotsGridSize int `json:"dots_grid_size,omitempty"` // 4, 5, 6 (creates (n-1)x(n-1) boxes)
}

// Room represents a game room
type Room struct {
	ID           uuid.UUID         `json:"id"`
	Type         RoomType          `json:"type"`
	Status       RoomStatus        `json:"status"`
	GameType     string            `json:"game_type"`
	GameSettings *GameSettings     `json:"game_settings,omitempty"`
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
	GameType     string        `json:"game_type" validate:"required,oneof=tictactoe connect4 rps dotsandboxes"`
	Type         RoomType      `json:"type" validate:"required,oneof=quickplay private ranked"`
	MaxPlayers   int           `json:"max_players" validate:"required,min=2,max=4"`
	GameSettings *GameSettings `json:"game_settings,omitempty"`
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

