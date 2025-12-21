package game

import (
	"encoding/json"
	"errors"
	"fmt"

	"github.com/google/uuid"
)

const (
	DotsRows = 5 // 5x5 dots creates a 4x4 grid of boxes
	DotsCols = 5
)

// LineOrientation represents whether a line is horizontal or vertical
type LineOrientation string

const (
	LineHorizontal LineOrientation = "horizontal"
	LineVertical   LineOrientation = "vertical"
)

// Line represents a line between two dots
type Line struct {
	Row         int             `json:"row"`
	Col         int             `json:"col"`
	Orientation LineOrientation `json:"orientation"`
	OwnerID     uuid.UUID       `json:"owner_id"`
}

// Box represents a completed box
type Box struct {
	Row     int       `json:"row"`
	Col     int       `json:"col"`
	OwnerID uuid.UUID `json:"owner_id"`
}

// DotsAndBoxesState represents the state of a Dots & Boxes game
type DotsAndBoxesState struct {
	Player1ID     uuid.UUID       `json:"player1_id"`
	Player2ID     uuid.UUID       `json:"player2_id"`
	CurrentPlayer uuid.UUID       `json:"current_player"`
	Lines         []Line          `json:"lines"`           // All drawn lines
	Boxes         []Box           `json:"boxes"`           // All completed boxes
	Player1Score  int             `json:"player1_score"`   // Number of boxes owned by player 1
	Player2Score  int             `json:"player2_score"`   // Number of boxes owned by player 2
	TotalBoxes    int             `json:"total_boxes"`     // Total possible boxes (4x4 = 16)
	LastMoveBoxed bool            `json:"last_move_boxed"` // Did last move complete a box?
}

// DotsAndBoxesMove represents a move in Dots & Boxes
type DotsAndBoxesMove struct {
	Row         int             `json:"row"`
	Col         int             `json:"col"`
	Orientation LineOrientation `json:"orientation"`
}

// NewDotsAndBoxesState creates a new Dots & Boxes game state
func NewDotsAndBoxesState(player1ID, player2ID uuid.UUID) *DotsAndBoxesState {
	return &DotsAndBoxesState{
		Player1ID:     player1ID,
		Player2ID:     player2ID,
		CurrentPlayer: player1ID, // Player 1 always starts
		Lines:         []Line{},
		Boxes:         []Box{},
		Player1Score:  0,
		Player2Score:  0,
		TotalBoxes:    (DotsRows - 1) * (DotsCols - 1), // 4x4 = 16 boxes
		LastMoveBoxed: false,
	}
}

// ValidateMove checks if a move is valid
func (s *DotsAndBoxesState) ValidateMove(playerID uuid.UUID, move interface{}) error {
	// Check if it's the player's turn
	if playerID != s.CurrentPlayer {
		return ErrNotYourTurn
	}

	// Parse move
	dotsMove, err := parseDotsAndBoxesMove(move)
	if err != nil {
		return err
	}

	// Validate line position
	if dotsMove.Orientation == LineHorizontal {
		// Horizontal line: row can be 0 to DotsRows-1, col can be 0 to DotsCols-2
		if dotsMove.Row < 0 || dotsMove.Row >= DotsRows || dotsMove.Col < 0 || dotsMove.Col >= DotsCols-1 {
			return errors.New("line position out of bounds")
		}
	} else if dotsMove.Orientation == LineVertical {
		// Vertical line: row can be 0 to DotsRows-2, col can be 0 to DotsCols-1
		if dotsMove.Row < 0 || dotsMove.Row >= DotsRows-1 || dotsMove.Col < 0 || dotsMove.Col >= DotsCols {
			return errors.New("line position out of bounds")
		}
	} else {
		return errors.New("invalid line orientation")
	}

	// Check if line already exists
	for _, line := range s.Lines {
		if line.Row == dotsMove.Row && line.Col == dotsMove.Col && line.Orientation == dotsMove.Orientation {
			return errors.New("line already drawn")
		}
	}

	return nil
}

// ApplyMove applies a move to the game state
func (s *DotsAndBoxesState) ApplyMove(playerID uuid.UUID, move interface{}) error {
	// Validate first
	if err := s.ValidateMove(playerID, move); err != nil {
		return err
	}

	// Parse move
	dotsMove, err := parseDotsAndBoxesMove(move)
	if err != nil {
		return err
	}

	// Add the line
	newLine := Line{
		Row:         dotsMove.Row,
		Col:         dotsMove.Col,
		Orientation: dotsMove.Orientation,
		OwnerID:     playerID,
	}
	s.Lines = append(s.Lines, newLine)

	// Check if this line completes any boxes
	completedBoxes := s.checkCompletedBoxes(dotsMove.Row, dotsMove.Col, dotsMove.Orientation)
	
	if len(completedBoxes) > 0 {
		// Add completed boxes
		for _, box := range completedBoxes {
			s.Boxes = append(s.Boxes, box)
			if playerID == s.Player1ID {
				s.Player1Score++
			} else {
				s.Player2Score++
			}
		}
		s.LastMoveBoxed = true
		// Player gets another turn if they completed a box
	} else {
		s.LastMoveBoxed = false
		// Switch turn
		if s.CurrentPlayer == s.Player1ID {
			s.CurrentPlayer = s.Player2ID
		} else {
			s.CurrentPlayer = s.Player1ID
		}
	}

	return nil
}

// checkCompletedBoxes checks if the newly drawn line completes any boxes
func (s *DotsAndBoxesState) checkCompletedBoxes(row, col int, orientation LineOrientation) []Box {
	var completedBoxes []Box

	if orientation == LineHorizontal {
		// Check box above (if exists)
		if row > 0 {
			if s.isBoxComplete(row-1, col) {
				completedBoxes = append(completedBoxes, Box{
					Row:     row - 1,
					Col:     col,
					OwnerID: s.CurrentPlayer,
				})
			}
		}
		// Check box below (if exists)
		if row < DotsRows-1 {
			if s.isBoxComplete(row, col) {
				completedBoxes = append(completedBoxes, Box{
					Row:     row,
					Col:     col,
					OwnerID: s.CurrentPlayer,
				})
			}
		}
	} else { // Vertical
		// Check box to the left (if exists)
		if col > 0 {
			if s.isBoxComplete(row, col-1) {
				completedBoxes = append(completedBoxes, Box{
					Row:     row,
					Col:     col - 1,
					OwnerID: s.CurrentPlayer,
				})
			}
		}
		// Check box to the right (if exists)
		if col < DotsCols-1 {
			if s.isBoxComplete(row, col) {
				completedBoxes = append(completedBoxes, Box{
					Row:     row,
					Col:     col,
					OwnerID: s.CurrentPlayer,
				})
			}
		}
	}

	return completedBoxes
}

// isBoxComplete checks if a box at the given position has all 4 sides
func (s *DotsAndBoxesState) isBoxComplete(boxRow, boxCol int) bool {
	// Check if box already exists
	for _, box := range s.Boxes {
		if box.Row == boxRow && box.Col == boxCol {
			return false // Already counted
		}
	}

	// A box needs 4 lines:
	// Top: horizontal line at (boxRow, boxCol)
	// Bottom: horizontal line at (boxRow+1, boxCol)
	// Left: vertical line at (boxRow, boxCol)
	// Right: vertical line at (boxRow, boxCol+1)

	hasTop := false
	hasBottom := false
	hasLeft := false
	hasRight := false

	for _, line := range s.Lines {
		if line.Orientation == LineHorizontal {
			if line.Row == boxRow && line.Col == boxCol {
				hasTop = true
			}
			if line.Row == boxRow+1 && line.Col == boxCol {
				hasBottom = true
			}
		} else { // Vertical
			if line.Row == boxRow && line.Col == boxCol {
				hasLeft = true
			}
			if line.Row == boxRow && line.Col == boxCol+1 {
				hasRight = true
			}
		}
	}

	return hasTop && hasBottom && hasLeft && hasRight
}

// CheckWinner checks if there's a winner (all boxes filled)
func (s *DotsAndBoxesState) CheckWinner() (winner *uuid.UUID, gameOver bool) {
	// Game is over when all boxes are filled
	if len(s.Boxes) >= s.TotalBoxes {
		if s.Player1Score > s.Player2Score {
			return &s.Player1ID, true
		} else if s.Player2Score > s.Player1Score {
			return &s.Player2ID, true
		}
		// Draw
		return nil, true
	}

	return nil, false
}

// GetCurrentPlayer returns the ID of the player whose turn it is
func (s *DotsAndBoxesState) GetCurrentPlayer() uuid.UUID {
	return s.CurrentPlayer
}

// GetState returns the current game state for serialization
func (s *DotsAndBoxesState) GetState() interface{} {
	return s
}

// Clone creates a deep copy of the game state
func (s *DotsAndBoxesState) Clone() GameState {
	newState := *s
	// Deep copy slices
	newState.Lines = make([]Line, len(s.Lines))
	copy(newState.Lines, s.Lines)
	newState.Boxes = make([]Box, len(s.Boxes))
	copy(newState.Boxes, s.Boxes)
	return &newState
}

// parseDotsAndBoxesMove parses a move from various formats
func parseDotsAndBoxesMove(move interface{}) (*DotsAndBoxesMove, error) {
	// Try to parse as DotsAndBoxesMove struct
	if m, ok := move.(*DotsAndBoxesMove); ok {
		return m, nil
	}

	if m, ok := move.(DotsAndBoxesMove); ok {
		return &m, nil
	}

	// Try to parse from JSON
	jsonData, err := json.Marshal(move)
	if err != nil {
		return nil, fmt.Errorf("%w: failed to marshal move", ErrInvalidMove)
	}

	var dotsMove DotsAndBoxesMove
	if err := json.Unmarshal(jsonData, &dotsMove); err != nil {
		return nil, fmt.Errorf("%w: failed to unmarshal move", ErrInvalidMove)
	}

	return &dotsMove, nil
}

