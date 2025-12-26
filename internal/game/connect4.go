package game

import (
	"encoding/json"
	"errors"

	"github.com/google/uuid"
)

const (
	DefaultConnect4Rows = 6
	DefaultConnect4Cols = 7
	DefaultConnect4WinLength = 4
)

// Connect4State represents the state of a Connect-4 game
type Connect4State struct {
	Board         [][]string `json:"board"` // Dynamic 2D slice: "R" (Red), "Y" (Yellow), or ""
	Player1ID     uuid.UUID  `json:"player1_id"`
	Player2ID     uuid.UUID  `json:"player2_id"`
	CurrentPlayer uuid.UUID  `json:"current_player"`
	MoveCount     int        `json:"move_count"`
	Rows          int        `json:"rows"`       // Number of rows (4-10)
	Cols          int        `json:"cols"`       // Number of columns (4-10)
	WinLength     int        `json:"win_length"` // Number in a row to win (4-6)
}

// Connect4Move represents a move in Connect-4
type Connect4Move struct {
	Column int `json:"column"` // Column to drop the piece (0-Cols-1)
}

// NewConnect4State creates a new Connect-4 game state with default 6x7 grid
func NewConnect4State(player1ID, player2ID uuid.UUID) *Connect4State {
	return NewConnect4StateWithSize(player1ID, player2ID, DefaultConnect4Rows, DefaultConnect4Cols, DefaultConnect4WinLength)
}

// NewConnect4StateWithSettings creates a new Connect-4 game state with custom settings
func NewConnect4StateWithSettings(player1ID, player2ID uuid.UUID, settings interface{}) *Connect4State {
	rows := DefaultConnect4Rows
	cols := DefaultConnect4Cols
	winLength := DefaultConnect4WinLength
	
	if settingsMap, ok := settings.(map[string]interface{}); ok {
		if val, exists := settingsMap["connect4_rows"]; exists {
			if rowsFloat, ok := val.(float64); ok {
				rows = int(rowsFloat)
			}
		}
		if val, exists := settingsMap["connect4_cols"]; exists {
			if colsFloat, ok := val.(float64); ok {
				cols = int(colsFloat)
			}
		}
		if val, exists := settingsMap["connect4_win_length"]; exists {
			if lengthFloat, ok := val.(float64); ok {
				winLength = int(lengthFloat)
			}
		}
	}
	
	return NewConnect4StateWithSize(player1ID, player2ID, rows, cols, winLength)
}

// NewConnect4StateWithSize creates a new Connect-4 game state with specified size
func NewConnect4StateWithSize(player1ID, player2ID uuid.UUID, rows, cols, winLength int) *Connect4State {
	// Validate dimensions
	if rows < 4 {
		rows = 4
	}
	if rows > 10 {
		rows = 10
	}
	if cols < 4 {
		cols = 4
	}
	if cols > 10 {
		cols = 10
	}
	
	// Validate win length
	if winLength < 4 {
		winLength = 4
	}
	if winLength > 6 {
		winLength = 6
	}
	// Win length can't be more than the smaller dimension
	if winLength > rows {
		winLength = rows
	}
	if winLength > cols {
		winLength = cols
	}
	
	// Create empty board
	board := make([][]string, rows)
	for i := range board {
		board[i] = make([]string, cols)
	}
	
	return &Connect4State{
		Board:         board,
		Player1ID:     player1ID,
		Player2ID:     player2ID,
		CurrentPlayer: player1ID, // Player 1 always starts
		MoveCount:     0,
		Rows:          rows,
		Cols:          cols,
		WinLength:     winLength,
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
	if connect4Move.Column < 0 || connect4Move.Column >= s.Cols {
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
	for row := s.Rows - 1; row >= 0; row-- {
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
	for row := 0; row < s.Rows; row++ {
		for col := 0; col <= s.Cols-s.WinLength; col++ {
			if s.checkLineFromPoint(row, col, 0, 1) {
				winnerID := s.getPlayerBySymbol(s.Board[row][col])
				return &winnerID, true
			}
		}
	}

	// Check vertical wins
	for col := 0; col < s.Cols; col++ {
		for row := 0; row <= s.Rows-s.WinLength; row++ {
			if s.checkLineFromPoint(row, col, 1, 0) {
				winnerID := s.getPlayerBySymbol(s.Board[row][col])
				return &winnerID, true
			}
		}
	}

	// Check diagonal wins (bottom-left to top-right)
	for row := s.WinLength - 1; row < s.Rows; row++ {
		for col := 0; col <= s.Cols-s.WinLength; col++ {
			if s.checkLineFromPoint(row, col, -1, 1) {
				winnerID := s.getPlayerBySymbol(s.Board[row][col])
				return &winnerID, true
			}
		}
	}

	// Check diagonal wins (top-left to bottom-right)
	for row := 0; row <= s.Rows-s.WinLength; row++ {
		for col := 0; col <= s.Cols-s.WinLength; col++ {
			if s.checkLineFromPoint(row, col, 1, 1) {
				winnerID := s.getPlayerBySymbol(s.Board[row][col])
				return &winnerID, true
			}
		}
	}

	// Check for draw (board full - all columns filled)
	boardFull := true
	for col := 0; col < s.Cols; col++ {
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

// checkLineFromPoint checks if there's a winning line of length WinLength starting from a specific point
func (s *Connect4State) checkLineFromPoint(startRow, startCol, dRow, dCol int) bool {
	symbol := s.Board[startRow][startCol]
	if symbol == "" {
		return false
	}
	
	for i := 1; i < s.WinLength; i++ {
		row := startRow + i*dRow
		col := startCol + i*dCol
		
		if row < 0 || row >= s.Rows || col < 0 || col >= s.Cols {
			return false
		}
		
		if s.Board[row][col] != symbol {
			return false
		}
	}
	
	return true
}

// GetCurrentPlayer returns the ID of the player whose turn it is
func (s *Connect4State) GetCurrentPlayer() uuid.UUID {
	return s.CurrentPlayer
}

// GetState returns the current game state for serialization
func (s *Connect4State) GetState() interface{} {
	// Defensive: Ensure board is never nil
	if s.Board == nil {
		s.Board = make([][]string, 6)
		for i := range s.Board {
			s.Board[i] = make([]string, 7)
		}
	}
	return s
}

// Clone creates a deep copy of the game state
func (s *Connect4State) Clone() GameState {
	newState := *s
	// Deep copy the board
	newState.Board = make([][]string, len(s.Board))
	for i := range s.Board {
		newState.Board[i] = make([]string, len(s.Board[i]))
		copy(newState.Board[i], s.Board[i])
	}
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
