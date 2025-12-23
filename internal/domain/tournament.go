package domain

import (
	"time"

	"github.com/google/uuid"
)

// TournamentType represents the tournament format
type TournamentType string

const (
	TournamentTypeSingleElimination TournamentType = "single_elimination"
	TournamentTypeDoubleElimination TournamentType = "double_elimination"
	TournamentTypeRoundRobin        TournamentType = "round_robin"
)

// TournamentStatus represents the current status of a tournament
type TournamentStatus string

const (
	TournamentStatusPending    TournamentStatus = "pending"    // Waiting for participants
	TournamentStatusReady      TournamentStatus = "ready"      // Ready to start
	TournamentStatusInProgress TournamentStatus = "in_progress" // Tournament running
	TournamentStatusComplete   TournamentStatus = "complete"   // Tournament finished
	TournamentStatusCancelled  TournamentStatus = "cancelled"  // Tournament cancelled
)

// TournamentMatchStatus represents the status of a tournament match
type TournamentMatchStatus string

const (
	TournamentMatchStatusPending    TournamentMatchStatus = "pending"    // Waiting for players
	TournamentMatchStatusReady      TournamentMatchStatus = "ready"      // Players assigned
	TournamentMatchStatusInProgress TournamentMatchStatus = "in_progress" // Match playing
	TournamentMatchStatusComplete   TournamentMatchStatus = "complete"   // Match finished
)

// Tournament represents a tournament
type Tournament struct {
	ID              uuid.UUID        `json:"id"`
	RoomID          uuid.UUID        `json:"room_id"`
	Name            string           `json:"name"`
	GameType        string           `json:"game_type"`
	TournamentType  TournamentType   `json:"tournament_type"`
	Status          TournamentStatus `json:"status"`
	MaxParticipants int              `json:"max_participants"`
	IsPrivate       bool             `json:"is_private"`
	JoinCode        string           `json:"join_code,omitempty"`
	BracketData     *BracketData     `json:"bracket_data,omitempty"`
	WinnerID        *uuid.UUID       `json:"winner_id,omitempty"`
	CreatedBy       uuid.UUID        `json:"created_by"`
	StartedAt       *time.Time       `json:"started_at,omitempty"`
	EndedAt         *time.Time       `json:"ended_at,omitempty"`
	CreatedAt       time.Time        `json:"created_at"`
	UpdatedAt       time.Time        `json:"updated_at"`
	Participants    []TournamentParticipant `json:"participants"`
	CurrentRound    int              `json:"current_round"`
	TotalRounds     int              `json:"total_rounds"`
}

// TournamentParticipant represents a tournament participant
type TournamentParticipant struct {
	UserID      uuid.UUID  `json:"user_id"`
	Username    string     `json:"username"`
	Seed        int        `json:"seed"`
	EloRating   int        `json:"elo_rating"`
	IsEliminated bool      `json:"is_eliminated"`
	JoinedAt    time.Time  `json:"joined_at"`
}

// BracketData represents the tournament bracket structure
type BracketData struct {
	Rounds []BracketRound `json:"rounds"`
}

// BracketRound represents a single round in the tournament
type BracketRound struct {
	RoundNumber int            `json:"round_number"`
	RoundName   string         `json:"round_name"` // "Round 1", "Semifinals", "Finals"
	Matches     []BracketMatch `json:"matches"`
}

// BracketMatch represents a match in the bracket
type BracketMatch struct {
	MatchNumber   int                   `json:"match_number"`
	MatchID       *uuid.UUID            `json:"match_id,omitempty"`
	Player1ID     *uuid.UUID            `json:"player1_id,omitempty"`
	Player1Name   string                `json:"player1_name,omitempty"`
	Player2ID     *uuid.UUID            `json:"player2_id,omitempty"`
	Player2Name   string                `json:"player2_name,omitempty"`
	WinnerID      *uuid.UUID            `json:"winner_id,omitempty"`
	Status        TournamentMatchStatus `json:"status"`
	AdvancesToMatch *int                `json:"advances_to_match,omitempty"` // Which match the winner advances to
}

// TournamentMatch represents a match in the tournament (database model)
type TournamentMatch struct {
	ID           uuid.UUID             `json:"id"`
	TournamentID uuid.UUID             `json:"tournament_id"`
	MatchID      *uuid.UUID            `json:"match_id,omitempty"` // Link to game_matches table
	Round        int                   `json:"round"`
	MatchNumber  int                   `json:"match_number"`
	Player1ID    *uuid.UUID            `json:"player1_id,omitempty"`
	Player2ID    *uuid.UUID            `json:"player2_id,omitempty"`
	WinnerID     *uuid.UUID            `json:"winner_id,omitempty"`
	Status       TournamentMatchStatus `json:"status"`
	CreatedAt    time.Time             `json:"created_at"`
	UpdatedAt    time.Time             `json:"updated_at"`
}

// CreateTournamentRequest represents a tournament creation request
type CreateTournamentRequest struct {
	Name            string         `json:"name" validate:"required,min=3,max=100"`
	GameType        string         `json:"game_type" validate:"required,oneof=tictactoe connect4 rps dotsandboxes"`
	TournamentType  TournamentType `json:"tournament_type" validate:"required,oneof=single_elimination"`
	MaxParticipants int            `json:"max_participants" validate:"required,min=4,max=32"`
	IsPrivate       bool           `json:"is_private"`
	GameSettings    *GameSettings  `json:"game_settings,omitempty"`
}

// JoinTournamentRequest represents a tournament join request
type JoinTournamentRequest struct {
	JoinCode string `json:"join_code"`
}

// StartTournamentRequest represents a tournament start request
type StartTournamentRequest struct {
	TournamentID string `json:"tournament_id" validate:"required,uuid"`
}

// TournamentResponse is the API response for tournament operations
type TournamentResponse struct {
	Tournament *Tournament `json:"tournament"`
	Message    string      `json:"message,omitempty"`
}

// TournamentListResponse is the API response for listing tournaments
type TournamentListResponse struct {
	Tournaments []Tournament `json:"tournaments"`
	Total       int          `json:"total"`
}


