package game

import (
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
)

// GameType represents the type of game
type GameType string

const (
	GameTypeTicTacToe      GameType = "tictactoe"
	GameTypeConnect4       GameType = "connect4"
	GameTypeRockPaperScissors GameType = "rps"
	GameTypeDotsAndBoxes   GameType = "dotsandboxes"
)

// GameStatus represents the current status of a game
type GameStatus string

const (
	GameStatusWaiting   GameStatus = "waiting"
	GameStatusActive    GameStatus = "active"
	GameStatusCompleted GameStatus = "completed"
	GameStatusAbandoned GameStatus = "abandoned"
)

// Game represents a game instance
type Game struct {
	ID          uuid.UUID       `json:"id"`
	Type        GameType        `json:"type"`
	Status      GameStatus      `json:"status"`
	Player1ID   uuid.UUID       `json:"player1_id"`
	Player2ID   uuid.UUID       `json:"player2_id"`
	Player1Name string          `json:"player1_name"`
	Player2Name string          `json:"player2_name"`
	CurrentTurn uuid.UUID       `json:"current_turn"`
	WinnerID    *uuid.UUID      `json:"winner_id,omitempty"`
	State       GameState       `json:"-"` // Excluded from JSON
	StateData   json.RawMessage `json:"state"` // Raw JSON for serialization
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`
	StartedAt   *time.Time      `json:"started_at,omitempty"`
	EndedAt     *time.Time      `json:"ended_at,omitempty"`
}

// GameState is an interface that all game implementations must satisfy
type GameState interface {
	// ValidateMove checks if a move is valid
	ValidateMove(playerID uuid.UUID, move interface{}) error

	// ApplyMove applies a move to the game state
	ApplyMove(playerID uuid.UUID, move interface{}) error

	// CheckWinner checks if there's a winner
	CheckWinner() (winner *uuid.UUID, gameOver bool)

	// GetCurrentPlayer returns the ID of the player whose turn it is
	GetCurrentPlayer() uuid.UUID

	// GetState returns the current game state for serialization
	GetState() interface{}

	// Clone creates a deep copy of the game state
	Clone() GameState
}

// Common errors
var (
	ErrInvalidMove      = errors.New("invalid move")
	ErrNotYourTurn      = errors.New("not your turn")
	ErrGameNotActive    = errors.New("game is not active")
	ErrGameAlreadyEnded = errors.New("game has already ended")
	ErrInvalidPlayer    = errors.New("invalid player")
)

