package game

import (
	"encoding/json"
	"errors"
	"fmt"

	"github.com/google/uuid"
)

// Default grid size (can be overridden with custom settings)
const (
	DefaultDotsRows = 5 // 5x5 dots creates a 4x4 grid of boxes
	DefaultDotsCols = 5
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
	GridRows      int             `json:"grid_rows"`       // Number of rows of dots
	GridCols      int             `json:"grid_cols"`       // Number of columns of dots
}

// DotsAndBoxesMove represents a move in Dots & Boxes
type DotsAndBoxesMove struct {
	Row         int             `json:"row"`
	Col         int             `json:"col"`
	Orientation LineOrientation `json:"orientation"`
}

// NewDotsAndBoxesState creates a new Dots & Boxes game state with default 5x5 grid
func NewDotsAndBoxesState(player1ID, player2ID uuid.UUID) *DotsAndBoxesState {
	return NewDotsAndBoxesStateWithGridSize(player1ID, player2ID, DefaultDotsRows, DefaultDotsCols)
}

// NewDotsAndBoxesStateWithSettings creates a new Dots & Boxes game state with custom settings
func NewDotsAndBoxesStateWithSettings(player1ID, player2ID uuid.UUID, settings interface{}) *DotsAndBoxesState {
	gridSize := DefaultDotsRows // default
	
	if settingsMap, ok := settings.(map[string]interface{}); ok {
		if val, exists := settingsMap["dots_grid_size"]; exists {
			if sizeFloat, ok := val.(float64); ok {
				gridSize = int(sizeFloat)
			}
		}
	}
	
	return NewDotsAndBoxesStateWithGridSize(player1ID, player2ID, gridSize, gridSize)
}

// NewDotsAndBoxesStateWithGridSize creates a new Dots & Boxes game state with specified grid size
func NewDotsAndBoxesStateWithGridSize(player1ID, player2ID uuid.UUID, rows, cols int) *DotsAndBoxesState {
	// Validate grid size
	if rows < 4 {
		rows = 4
	}
	if rows > 8 {
		rows = 8
	}
	if cols < 4 {
		cols = 4
	}
	if cols > 8 {
		cols = 8
	}
	
	return &DotsAndBoxesState{
		Player1ID:     player1ID,
		Player2ID:     player2ID,
		CurrentPlayer: player1ID, // Player 1 always starts
		Lines:         []Line{},
		Boxes:         []Box{},
		Player1Score:  0,
		Player2Score:  0,
		TotalBoxes:    (rows - 1) * (cols - 1),
		LastMoveBoxed: false,
		GridRows:      rows,
		GridCols:      cols,
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
		// Horizontal line: row can be 0 to GridRows-1, col can be 0 to GridCols-2
		if dotsMove.Row < 0 || dotsMove.Row >= s.GridRows || dotsMove.Col < 0 || dotsMove.Col >= s.GridCols-1 {
			return errors.New("line position out of bounds")
		}
	} else if dotsMove.Orientation == LineVertical {
		// Vertical line: row can be 0 to GridRows-2, col can be 0 to GridCols-1
		if dotsMove.Row < 0 || dotsMove.Row >= s.GridRows-1 || dotsMove.Col < 0 || dotsMove.Col >= s.GridCols {
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
	
	// Check if this line would only border already-claimed boxes (useless move)
	if s.isLineUseless(dotsMove.Row, dotsMove.Col, dotsMove.Orientation) {
		return errors.New("this line only borders already-claimed boxes")
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

	// Check if this line completes any squares of any size
	pointsScored, completedBoxes := s.checkCompletedSquares()
	
	if pointsScored > 0 {
		// Award points and claim boxes
		if playerID == s.Player1ID {
			s.Player1Score += pointsScored
		} else {
			s.Player2Score += pointsScored
		}
		
		// Add all newly claimed 1×1 boxes
		s.Boxes = append(s.Boxes, completedBoxes...)
		s.LastMoveBoxed = true
		
		fmt.Printf("Player %s completed square(s) and scored %d points!\n", playerID, pointsScored)
		// Player gets another turn if they completed a square
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

// checkCompletedSquares checks if any squares of any size are now complete
// Returns total points scored and all 1×1 boxes that should be claimed
// Awards points for ALL squares of the LARGEST size completed in this move
func (s *DotsAndBoxesState) checkCompletedSquares() (int, []Box) {
	maxSquareSize := s.GridRows - 1
	if s.GridCols-1 < maxSquareSize {
		maxSquareSize = s.GridCols - 1
	}
	
	// Check from largest squares to smallest
	// Find the largest size that has completed squares
	for size := maxSquareSize; size >= 1; size-- {
		var foundSquares []struct {
			row, col int
		}
		
		// Find ALL complete squares of this size
		for row := 0; row <= s.GridRows-1-size; row++ {
			for col := 0; col <= s.GridCols-1-size; col++ {
				if s.isSquareComplete(row, col, size) {
					foundSquares = append(foundSquares, struct{ row, col int }{row, col})
				}
			}
		}
		
		// If we found any squares of this size, award points for ALL of them
		if len(foundSquares) > 0 {
			totalPoints := 0
			var claimedBoxes []Box
			
			for _, sq := range foundSquares {
				points := size * size
				totalPoints += points
				
				fmt.Printf("Found complete %d×%d square at (%d,%d) = %d points\n", size, size, sq.row, sq.col, points)
				
				// Claim all 1×1 boxes inside this square
				for r := sq.row; r < sq.row+size; r++ {
					for c := sq.col; c < sq.col+size; c++ {
						claimedBoxes = append(claimedBoxes, Box{
							Row:     r,
							Col:     c,
							OwnerID: s.CurrentPlayer,
						})
					}
				}
			}
			
			fmt.Printf("Total points awarded: %d from %d square(s) of size %d×%d\n", totalPoints, len(foundSquares), size, size)
			return totalPoints, claimedBoxes
		}
	}
	
	// No squares completed
	return 0, nil
}

// isSquareComplete checks if a square of given size at position (row, col) is complete
// A square is complete if all its edges are drawn AND all 1×1 boxes inside are unclaimed
func (s *DotsAndBoxesState) isSquareComplete(startRow, startCol, size int) bool {
	// First check if all internal 1×1 boxes are unclaimed
	for r := startRow; r < startRow+size; r++ {
		for c := startCol; c < startCol+size; c++ {
			if s.isBoxClaimed(r, c) {
				return false // At least one internal box is already claimed
			}
		}
	}
	
	// Now check if all edges of the square are drawn
	
	// Check top edge (horizontal lines)
	for c := startCol; c < startCol+size; c++ {
		if !s.hasLine(startRow, c, LineHorizontal) {
			return false
		}
	}
	
	// Check bottom edge (horizontal lines)
	for c := startCol; c < startCol+size; c++ {
		if !s.hasLine(startRow+size, c, LineHorizontal) {
			return false
		}
	}
	
	// Check left edge (vertical lines)
	for r := startRow; r < startRow+size; r++ {
		if !s.hasLine(r, startCol, LineVertical) {
			return false
		}
	}
	
	// Check right edge (vertical lines)
	for r := startRow; r < startRow+size; r++ {
		if !s.hasLine(r, startCol+size, LineVertical) {
			return false
		}
	}
	
	return true
}

// isBoxClaimed checks if a 1×1 box is already owned by a player
func (s *DotsAndBoxesState) isBoxClaimed(boxRow, boxCol int) bool {
	for _, box := range s.Boxes {
		if box.Row == boxRow && box.Col == boxCol {
			return true
		}
	}
	return false
}

// hasLine checks if a line exists at the given position
func (s *DotsAndBoxesState) hasLine(row, col int, orientation LineOrientation) bool {
	for _, line := range s.Lines {
		if line.Row == row && line.Col == col && line.Orientation == orientation {
			return true
		}
	}
	return false
}

// isLineUseless checks if a line would only border already-claimed boxes
// Returns true if the line touches no unclaimed boxes (making it a useless move)
func (s *DotsAndBoxesState) isLineUseless(row, col int, orientation LineOrientation) bool {
	adjacentBoxes := s.getAdjacentBoxes(row, col, orientation)
	
	// If there are no adjacent boxes, the line is on the edge (not useless)
	if len(adjacentBoxes) == 0 {
		return false
	}
	
	// Check if ALL adjacent boxes are already claimed
	allClaimed := true
	for _, box := range adjacentBoxes {
		if !s.isBoxClaimed(box.Row, box.Col) {
			allClaimed = false
			break
		}
	}
	
	return allClaimed
}

// getAdjacentBoxes returns the 1×1 boxes that border this line
func (s *DotsAndBoxesState) getAdjacentBoxes(row, col int, orientation LineOrientation) []struct{ Row, Col int } {
	var boxes []struct{ Row, Col int }
	
	if orientation == LineHorizontal {
		// Horizontal line can border a box above and/or below
		// Box above: (row-1, col)
		if row > 0 && row-1 < s.GridRows-1 && col < s.GridCols-1 {
			boxes = append(boxes, struct{ Row, Col int }{row - 1, col})
		}
		// Box below: (row, col)
		if row < s.GridRows-1 && col < s.GridCols-1 {
			boxes = append(boxes, struct{ Row, Col int }{row, col})
		}
	} else { // Vertical
		// Vertical line can border a box to the left and/or right
		// Box to left: (row, col-1)
		if col > 0 && row < s.GridRows-1 && col-1 < s.GridCols-1 {
			boxes = append(boxes, struct{ Row, Col int }{row, col - 1})
		}
		// Box to right: (row, col)
		if col < s.GridCols-1 && row < s.GridRows-1 {
			boxes = append(boxes, struct{ Row, Col int }{row, col})
		}
	}
	
	return boxes
}

// CheckWinner checks if there's a winner
// Game ends when:
// 1. A player has more than half the boxes (mathematically won)
// 2. All boxes are filled
func (s *DotsAndBoxesState) CheckWinner() (winner *uuid.UUID, gameOver bool) {
	halfBoxes := s.TotalBoxes / 2
	
	// Check if either player has won by getting more than half the boxes
	if s.Player1Score > halfBoxes {
		fmt.Printf("Player 1 wins with %d boxes (more than half of %d)\n", s.Player1Score, s.TotalBoxes)
		return &s.Player1ID, true
	}
	if s.Player2Score > halfBoxes {
		fmt.Printf("Player 2 wins with %d boxes (more than half of %d)\n", s.Player2Score, s.TotalBoxes)
		return &s.Player2ID, true
	}
	
	// Game is over when all boxes are filled
	if len(s.Boxes) >= s.TotalBoxes {
		if s.Player1Score > s.Player2Score {
			return &s.Player1ID, true
		} else if s.Player2Score > s.Player1Score {
			return &s.Player2ID, true
		}
		// Draw (exactly half each)
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
	// Defensive: Ensure slices are never nil
	if s.Lines == nil {
		s.Lines = []Line{}
	}
	if s.Boxes == nil {
		s.Boxes = []Box{}
	}
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


