package game

import (
	"encoding/json"
	"errors"

	"github.com/google/uuid"
)

// TicTacToeState represents the state of a Tic-Tac-Toe game
type TicTacToeState struct {
	Board         [3][3]string `json:"board"` // "X", "O", or ""
	Player1ID     uuid.UUID    `json:"player1_id"`
	Player2ID     uuid.UUID    `json:"player2_id"`
	CurrentPlayer uuid.UUID    `json:"current_player"`
	MoveCount     int          `json:"move_count"`
}

// TicTacToeMove represents a move in Tic-Tac-Toe
type TicTacToeMove struct {
	Row int `json:"row"`
	Col int `json:"col"`
}

// NewTicTacToeState creates a new Tic-Tac-Toe game state
func NewTicTacToeState(player1ID, player2ID uuid.UUID) *TicTacToeState {
	return &TicTacToeState{
		Board:         [3][3]string{},
		Player1ID:     player1ID,
		Player2ID:     player2ID,
		CurrentPlayer: player1ID, // Player 1 always starts
		MoveCount:     0,
	}
}

// ValidateMove checks if a move is valid
func (s *TicTacToeState) ValidateMove(playerID uuid.UUID, move interface{}) error {
	// Check if it's the player's turn
	if playerID != s.CurrentPlayer {
		return ErrNotYourTurn
	}

	// Parse move
	ticTacToeMove, err := parseTicTacToeMove(move)
	if err != nil {
		return err
	}

	// Check if position is within bounds
	if ticTacToeMove.Row < 0 || ticTacToeMove.Row > 2 || ticTacToeMove.Col < 0 || ticTacToeMove.Col > 2 {
		return errors.New("position out of bounds")
	}

	// Check if position is already occupied
	if s.Board[ticTacToeMove.Row][ticTacToeMove.Col] != "" {
		return errors.New("position already occupied")
	}

	return nil
}

// ApplyMove applies a move to the game state
func (s *TicTacToeState) ApplyMove(playerID uuid.UUID, move interface{}) error {
	// Validate first
	if err := s.ValidateMove(playerID, move); err != nil {
		return err
	}

	// Parse move
	ticTacToeMove, err := parseTicTacToeMove(move)
	if err != nil {
		return err
	}

	// Determine symbol
	symbol := "X"
	if playerID == s.Player2ID {
		symbol = "O"
	}

	// Apply move
	s.Board[ticTacToeMove.Row][ticTacToeMove.Col] = symbol
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
func (s *TicTacToeState) CheckWinner() (winner *uuid.UUID, gameOver bool) {
	// Check rows
	for row := 0; row < 3; row++ {
		if s.Board[row][0] != "" &&
			s.Board[row][0] == s.Board[row][1] &&
			s.Board[row][1] == s.Board[row][2] {
			winnerID := s.getPlayerBySymbol(s.Board[row][0])
			return &winnerID, true
		}
	}

	// Check columns
	for col := 0; col < 3; col++ {
		if s.Board[0][col] != "" &&
			s.Board[0][col] == s.Board[1][col] &&
			s.Board[1][col] == s.Board[2][col] {
			winnerID := s.getPlayerBySymbol(s.Board[0][col])
			return &winnerID, true
		}
	}

	// Check diagonals
	if s.Board[0][0] != "" &&
		s.Board[0][0] == s.Board[1][1] &&
		s.Board[1][1] == s.Board[2][2] {
		winnerID := s.getPlayerBySymbol(s.Board[0][0])
		return &winnerID, true
	}

	if s.Board[0][2] != "" &&
		s.Board[0][2] == s.Board[1][1] &&
		s.Board[1][1] == s.Board[2][0] {
		winnerID := s.getPlayerBySymbol(s.Board[0][2])
		return &winnerID, true
	}

	// Check for draw (board full)
	if s.MoveCount >= 9 {
		return nil, true // Draw
	}

	return nil, false // Game still ongoing
}

// GetCurrentPlayer returns the ID of the player whose turn it is
func (s *TicTacToeState) GetCurrentPlayer() uuid.UUID {
	return s.CurrentPlayer
}

// GetState returns the current game state for serialization
func (s *TicTacToeState) GetState() interface{} {
	return s
}

// Clone creates a deep copy of the game state
func (s *TicTacToeState) Clone() GameState {
	newState := *s
	return &newState
}

// getPlayerBySymbol returns the player ID for a given symbol
func (s *TicTacToeState) getPlayerBySymbol(symbol string) uuid.UUID {
	if symbol == "X" {
		return s.Player1ID
	}
	return s.Player2ID
}

// parseTicTacToeMove parses a move from various formats
func parseTicTacToeMove(move interface{}) (*TicTacToeMove, error) {
	// Try to parse as TicTacToeMove struct
	if m, ok := move.(*TicTacToeMove); ok {
		return m, nil
	}

	if m, ok := move.(TicTacToeMove); ok {
		return &m, nil
	}

	// Try to parse from JSON
	jsonData, err := json.Marshal(move)
	if err != nil {
		return nil, ErrInvalidMove
	}

	var ticTacToeMove TicTacToeMove
	if err := json.Unmarshal(jsonData, &ticTacToeMove); err != nil {
		return nil, ErrInvalidMove
	}

	return &ticTacToeMove, nil
}

