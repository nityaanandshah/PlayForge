package game

import (
	"encoding/json"
	"errors"

	"github.com/google/uuid"
)

const (
	Connect4Rows = 6
	Connect4Cols = 7
)

// Connect4State represents the state of a Connect-4 game
type Connect4State struct {
	Board         [Connect4Rows][Connect4Cols]string `json:"board"` // "R" (Red), "Y" (Yellow), or ""
	Player1ID     uuid.UUID                          `json:"player1_id"`
	Player2ID     uuid.UUID                          `json:"player2_id"`
	CurrentPlayer uuid.UUID                          `json:"current_player"`
	MoveCount     int                                `json:"move_count"`
}

// Connect4Move represents a move in Connect-4
type Connect4Move struct {
	Column int `json:"column"` // Column to drop the piece (0-6)
}

// NewConnect4State creates a new Connect-4 game state
func NewConnect4State(player1ID, player2ID uuid.UUID) *Connect4State {
	return &Connect4State{
		Board:         [Connect4Rows][Connect4Cols]string{},
		Player1ID:     player1ID,
		Player2ID:     player2ID,
		CurrentPlayer: player1ID, // Player 1 always starts
		MoveCount:     0,
	}
}

// ValidateMove checks if a move is valid
func (s *Connect4State) ValidateMove(playerID uuid.UUID, move interface{}) error {
	// Check if it's the player's turn
	if playerID != s.CurrentPlayer {
		return ErrNotYourTurn
	}

	// Parse move
	connect4Move, err := parseConnect4Move(move)
	if err != nil {
		return err
	}

	// Check if column is within bounds
	if connect4Move.Column < 0 || connect4Move.Column >= Connect4Cols {
		return errors.New("column out of bounds")
	}

	// Check if column is not full (top row is empty)
	if s.Board[0][connect4Move.Column] != "" {
		return errors.New("column is full")
	}

	return nil
}

// ApplyMove applies a move to the game state
func (s *Connect4State) ApplyMove(playerID uuid.UUID, move interface{}) error {
	// Validate first
	if err := s.ValidateMove(playerID, move); err != nil {
		return err
	}

	// Parse move
	connect4Move, err := parseConnect4Move(move)
	if err != nil {
		return err
	}

	// Determine symbol
	symbol := "R" // Red for Player 1
	if playerID == s.Player2ID {
		symbol = "Y" // Yellow for Player 2
	}

	// Find the lowest available row in the column (gravity)
	for row := Connect4Rows - 1; row >= 0; row-- {
		if s.Board[row][connect4Move.Column] == "" {
			s.Board[row][connect4Move.Column] = symbol
			break
		}
	}

	s.MoveCount++

	// Switch turn
	if s.CurrentPlayer == s.Player1ID {
		s.CurrentPlayer = s.Player2ID
	} else {
		s.CurrentPlayer = s.Player1ID
	}

	return nil
}

// CheckWinner checks if there's a winner or if the game is a draw
func (s *Connect4State) CheckWinner() (winner *uuid.UUID, gameOver bool) {
	// Check horizontal wins
	for row := 0; row < Connect4Rows; row++ {
		for col := 0; col <= Connect4Cols-4; col++ {
			if s.Board[row][col] != "" &&
				s.Board[row][col] == s.Board[row][col+1] &&
				s.Board[row][col] == s.Board[row][col+2] &&
				s.Board[row][col] == s.Board[row][col+3] {
				winnerID := s.getPlayerBySymbol(s.Board[row][col])
				return &winnerID, true
			}
		}
	}

	// Check vertical wins
	for col := 0; col < Connect4Cols; col++ {
		for row := 0; row <= Connect4Rows-4; row++ {
			if s.Board[row][col] != "" &&
				s.Board[row][col] == s.Board[row+1][col] &&
				s.Board[row][col] == s.Board[row+2][col] &&
				s.Board[row][col] == s.Board[row+3][col] {
				winnerID := s.getPlayerBySymbol(s.Board[row][col])
				return &winnerID, true
			}
		}
	}

	// Check diagonal wins (bottom-left to top-right)
	for row := 3; row < Connect4Rows; row++ {
		for col := 0; col <= Connect4Cols-4; col++ {
			if s.Board[row][col] != "" &&
				s.Board[row][col] == s.Board[row-1][col+1] &&
				s.Board[row][col] == s.Board[row-2][col+2] &&
				s.Board[row][col] == s.Board[row-3][col+3] {
				winnerID := s.getPlayerBySymbol(s.Board[row][col])
				return &winnerID, true
			}
		}
	}

	// Check diagonal wins (top-left to bottom-right)
	for row := 0; row <= Connect4Rows-4; row++ {
		for col := 0; col <= Connect4Cols-4; col++ {
			if s.Board[row][col] != "" &&
				s.Board[row][col] == s.Board[row+1][col+1] &&
				s.Board[row][col] == s.Board[row+2][col+2] &&
				s.Board[row][col] == s.Board[row+3][col+3] {
				winnerID := s.getPlayerBySymbol(s.Board[row][col])
				return &winnerID, true
			}
		}
	}

	// Check for draw (board full - all columns filled)
	boardFull := true
	for col := 0; col < Connect4Cols; col++ {
		if s.Board[0][col] == "" {
			boardFull = false
			break
		}
	}

	if boardFull {
		return nil, true // Draw
	}

	return nil, false // Game still ongoing
}

// GetCurrentPlayer returns the ID of the player whose turn it is
func (s *Connect4State) GetCurrentPlayer() uuid.UUID {
	return s.CurrentPlayer
}

// GetState returns the current game state for serialization
func (s *Connect4State) GetState() interface{} {
	return s
}

// Clone creates a deep copy of the game state
func (s *Connect4State) Clone() GameState {
	newState := *s
	return &newState
}

// getPlayerBySymbol returns the player ID for a given symbol
func (s *Connect4State) getPlayerBySymbol(symbol string) uuid.UUID {
	if symbol == "R" {
		return s.Player1ID
	}
	return s.Player2ID
}

// parseConnect4Move parses a move from various formats
func parseConnect4Move(move interface{}) (*Connect4Move, error) {
	// Try to parse as Connect4Move struct
	if m, ok := move.(*Connect4Move); ok {
		return m, nil
	}

	if m, ok := move.(Connect4Move); ok {
		return &m, nil
	}

	// Try to parse from JSON
	jsonData, err := json.Marshal(move)
	if err != nil {
		return nil, ErrInvalidMove
	}

	var connect4Move Connect4Move
	if err := json.Unmarshal(jsonData, &connect4Move); err != nil {
		return nil, ErrInvalidMove
	}

	return &connect4Move, nil
}


