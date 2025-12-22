package game

import (
	"encoding/json"
	"errors"
	"fmt"

	"github.com/google/uuid"
)

// TicTacToeState represents the state of a Tic-Tac-Toe game
type TicTacToeState struct {
	Board         [][]string `json:"board"` // Dynamic 2D slice: "X", "O", or ""
	Player1ID     uuid.UUID  `json:"player1_id"`
	Player2ID     uuid.UUID  `json:"player2_id"`
	CurrentPlayer uuid.UUID  `json:"current_player"`
	MoveCount     int        `json:"move_count"`
	GridSize      int        `json:"grid_size"`  // Size of the grid (3, 4, or 5)
	WinLength     int        `json:"win_length"` // Number in a row to win
}

// TicTacToeMove represents a move in Tic-Tac-Toe
type TicTacToeMove struct {
	Row int `json:"row"`
	Col int `json:"col"`
}

// NewTicTacToeState creates a new Tic-Tac-Toe game state with default 3x3 grid
func NewTicTacToeState(player1ID, player2ID uuid.UUID) *TicTacToeState {
	return NewTicTacToeStateWithSize(player1ID, player2ID, 3, 3)
}

// NewTicTacToeStateWithSettings creates a new Tic-Tac-Toe game state with custom settings
func NewTicTacToeStateWithSettings(player1ID, player2ID uuid.UUID, settings interface{}) *TicTacToeState {
	gridSize := 3     // default
	winLength := 3    // default
	
	fmt.Printf("NewTicTacToeStateWithSettings called with settings: %+v\n", settings)
	
	if settingsMap, ok := settings.(map[string]interface{}); ok {
		fmt.Printf("Settings is a map: %+v\n", settingsMap)
		if val, exists := settingsMap["tictactoe_grid_size"]; exists {
			fmt.Printf("Found tictactoe_grid_size: %+v (type: %T)\n", val, val)
			if sizeFloat, ok := val.(float64); ok {
				gridSize = int(sizeFloat)
				fmt.Printf("Set gridSize to: %d\n", gridSize)
			}
		}
		if val, exists := settingsMap["tictactoe_win_length"]; exists {
			if lengthFloat, ok := val.(float64); ok {
				winLength = int(lengthFloat)
			}
		}
	} else {
		fmt.Printf("Settings is NOT a map, type is: %T\n", settings)
	}
	
	return NewTicTacToeStateWithSize(player1ID, player2ID, gridSize, winLength)
}

// NewTicTacToeStateWithSize creates a new Tic-Tac-Toe game state with specified size
func NewTicTacToeStateWithSize(player1ID, player2ID uuid.UUID, gridSize, winLength int) *TicTacToeState {
	// Validate grid size (3-5)
	if gridSize < 3 {
		gridSize = 3
	}
	if gridSize > 5 {
		gridSize = 5
	}
	
	// Validate win length (must be <= gridSize)
	if winLength <= 0 || winLength > gridSize {
		winLength = gridSize
	}
	
	// Create empty board
	board := make([][]string, gridSize)
	for i := range board {
		board[i] = make([]string, gridSize)
	}
	
	fmt.Printf("Creating TicTacToe game with gridSize=%d, winLength=%d\n", gridSize, winLength)
	
	return &TicTacToeState{
		Board:         board,
		Player1ID:     player1ID,
		Player2ID:     player2ID,
		CurrentPlayer: player1ID, // Player 1 always starts
		MoveCount:     0,
		GridSize:      gridSize,
		WinLength:     winLength,
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
	if ticTacToeMove.Row < 0 || ticTacToeMove.Row >= s.GridSize || ticTacToeMove.Col < 0 || ticTacToeMove.Col >= s.GridSize {
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
	for row := 0; row < s.GridSize; row++ {
		if s.checkLine(row, 0, 0, 1) {
			winnerID := s.getPlayerBySymbol(s.Board[row][0])
			return &winnerID, true
		}
	}

	// Check columns
	for col := 0; col < s.GridSize; col++ {
		if s.checkLine(0, col, 1, 0) {
			winnerID := s.getPlayerBySymbol(s.Board[0][col])
			return &winnerID, true
		}
	}

	// Check diagonals (top-left to bottom-right)
	for row := 0; row <= s.GridSize-s.WinLength; row++ {
		for col := 0; col <= s.GridSize-s.WinLength; col++ {
			if s.checkLineFromPoint(row, col, 1, 1) {
				winnerID := s.getPlayerBySymbol(s.Board[row][col])
				return &winnerID, true
			}
		}
	}

	// Check diagonals (top-right to bottom-left)
	for row := 0; row <= s.GridSize-s.WinLength; row++ {
		for col := s.WinLength - 1; col < s.GridSize; col++ {
			if s.checkLineFromPoint(row, col, 1, -1) {
				winnerID := s.getPlayerBySymbol(s.Board[row][col])
				return &winnerID, true
			}
		}
	}

	// Check for draw (board full)
	if s.MoveCount >= s.GridSize*s.GridSize {
		return nil, true // Draw
	}

	return nil, false // Game still ongoing
}

// checkLine checks if there's a winning line starting from (startRow, startCol) in direction (dRow, dCol)
// This checks the entire row or column
func (s *TicTacToeState) checkLine(startRow, startCol, dRow, dCol int) bool {
	if startRow < 0 || startRow >= s.GridSize || startCol < 0 || startCol >= s.GridSize {
		return false
	}
	
	symbol := s.Board[startRow][startCol]
	if symbol == "" {
		return false
	}
	
	// Check if we have WinLength consecutive symbols
	count := 0
	row, col := startRow, startCol
	
	for row >= 0 && row < s.GridSize && col >= 0 && col < s.GridSize {
		if s.Board[row][col] == symbol {
			count++
			if count >= s.WinLength {
				return true
			}
		} else {
			count = 0
			if s.Board[row][col] != "" {
				symbol = s.Board[row][col]
				count = 1
			}
		}
		row += dRow
		col += dCol
	}
	
	return count >= s.WinLength
}

// checkLineFromPoint checks if there's a winning line of length WinLength starting from a specific point
func (s *TicTacToeState) checkLineFromPoint(startRow, startCol, dRow, dCol int) bool {
	symbol := s.Board[startRow][startCol]
	if symbol == "" {
		return false
	}
	
	for i := 1; i < s.WinLength; i++ {
		row := startRow + i*dRow
		col := startCol + i*dCol
		
		if row < 0 || row >= s.GridSize || col < 0 || col >= s.GridSize {
			return false
		}
		
		if s.Board[row][col] != symbol {
			return false
		}
	}
	
	return true
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
	// Deep copy the board
	newState.Board = make([][]string, len(s.Board))
	for i := range s.Board {
		newState.Board[i] = make([]string, len(s.Board[i]))
		copy(newState.Board[i], s.Board[i])
	}
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
