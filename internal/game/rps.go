package game

import (
	"encoding/json"
	"errors"

	"github.com/google/uuid"
)

// RPSChoice represents a player's choice in Rock-Paper-Scissors
type RPSChoice string

const (
	RPSChoiceRock     RPSChoice = "rock"
	RPSChoicePaper    RPSChoice = "paper"
	RPSChoiceScissors RPSChoice = "scissors"
	RPSChoiceNone     RPSChoice = "" // No choice made yet
)

// RPSRound represents a single round in the game
type RPSRound struct {
	RoundNumber     int       `json:"round_number"`
	Player1Choice   RPSChoice `json:"player1_choice"`
	Player2Choice   RPSChoice `json:"player2_choice"`
	WinnerID        *uuid.UUID `json:"winner_id,omitempty"` // nil for draw
	Player1Revealed bool      `json:"player1_revealed"`
	Player2Revealed bool      `json:"player2_revealed"`
}

// RPSState represents the state of a Rock-Paper-Scissors game
type RPSState struct {
	Player1ID       uuid.UUID  `json:"player1_id"`
	Player2ID       uuid.UUID  `json:"player2_id"`
	CurrentRound    int        `json:"current_round"`    // 1-5
	Player1Score    int        `json:"player1_score"`    // Rounds won
	Player2Score    int        `json:"player2_score"`    // Rounds won
	Rounds          []RPSRound `json:"rounds"`           // History of all rounds
	Player1Choice   RPSChoice  `json:"player1_choice"`   // Current round choice
	Player2Choice   RPSChoice  `json:"player2_choice"`   // Current round choice
	BothRevealed    bool       `json:"both_revealed"`    // Both players made choice
	MaxRounds       int        `json:"max_rounds"`       // Best of 5 = 5 rounds max
	WinsNeeded      int        `json:"wins_needed"`      // 3 wins needed
}

// RPSMove represents a move in Rock-Paper-Scissors
type RPSMove struct {
	Choice RPSChoice `json:"choice"`
}

// NewRPSState creates a new Rock-Paper-Scissors game state with default settings (best of 5)
func NewRPSState(player1ID, player2ID uuid.UUID) *RPSState {
	return NewRPSStateWithBestOf(player1ID, player2ID, 5)
}

// NewRPSStateWithSettings creates a new RPS game state with custom settings
func NewRPSStateWithSettings(player1ID, player2ID uuid.UUID, settings interface{}) *RPSState {
	bestOf := 5 // default
	
	if settingsMap, ok := settings.(map[string]interface{}); ok {
		if val, exists := settingsMap["rps_best_of"]; exists {
			if bestOfFloat, ok := val.(float64); ok {
				bestOf = int(bestOfFloat)
			}
		}
	}
	
	return NewRPSStateWithBestOf(player1ID, player2ID, bestOf)
}

// NewRPSStateWithBestOf creates a new RPS game state with specified best-of rounds
func NewRPSStateWithBestOf(player1ID, player2ID uuid.UUID, bestOf int) *RPSState {
	// Ensure bestOf is odd and within valid range
	if bestOf < 3 {
		bestOf = 3
	}
	if bestOf > 9 {
		bestOf = 9
	}
	if bestOf%2 == 0 {
		bestOf++ // Make it odd
	}
	
	winsNeeded := (bestOf / 2) + 1
	
	return &RPSState{
		Player1ID:     player1ID,
		Player2ID:     player2ID,
		CurrentRound:  1,
		Player1Score:  0,
		Player2Score:  0,
		Rounds:        []RPSRound{},
		Player1Choice: RPSChoiceNone,
		Player2Choice: RPSChoiceNone,
		BothRevealed:  false,
		MaxRounds:     bestOf,
		WinsNeeded:    winsNeeded,
	}
}

// ValidateMove checks if a move is valid
func (s *RPSState) ValidateMove(playerID uuid.UUID, move interface{}) error {
	// Check if player is valid
	if playerID != s.Player1ID && playerID != s.Player2ID {
		return ErrInvalidPlayer
	}

	// SAFETY CHECK: Game should already be over if someone reached WinsNeeded
	if s.Player1Score >= s.WinsNeeded || s.Player2Score >= s.WinsNeeded {
		return ErrGameAlreadyEnded
	}

	// Parse move
	rpsMove, err := parseRPSMove(move)
	if err != nil {
		return err
	}

	// Validate choice
	if rpsMove.Choice != RPSChoiceRock && rpsMove.Choice != RPSChoicePaper && rpsMove.Choice != RPSChoiceScissors {
		return errors.New("invalid choice: must be rock, paper, or scissors")
	}

	// Check if player already made a choice this round
	if playerID == s.Player1ID && s.Player1Choice != RPSChoiceNone {
		return errors.New("you have already made a choice this round")
	}
	if playerID == s.Player2ID && s.Player2Choice != RPSChoiceNone {
		return errors.New("you have already made a choice this round")
	}

	return nil
}

// ApplyMove applies a move to the game state
func (s *RPSState) ApplyMove(playerID uuid.UUID, move interface{}) error {
	// Validate first
	if err := s.ValidateMove(playerID, move); err != nil {
		return err
	}

	// Parse move
	rpsMove, err := parseRPSMove(move)
	if err != nil {
		return err
	}

	// Record the choice
	if playerID == s.Player1ID {
		s.Player1Choice = rpsMove.Choice
	} else {
		s.Player2Choice = rpsMove.Choice
	}

	// Check if both players have made their choices
	if s.Player1Choice != RPSChoiceNone && s.Player2Choice != RPSChoiceNone {
		s.BothRevealed = true
		s.resolveRound()
	}

	return nil
}

// resolveRound determines the winner of the current round
func (s *RPSState) resolveRound() {
	var roundWinnerID *uuid.UUID

	// Determine winner
	if s.Player1Choice == s.Player2Choice {
		// Draw
		roundWinnerID = nil
	} else if (s.Player1Choice == RPSChoiceRock && s.Player2Choice == RPSChoiceScissors) ||
		(s.Player1Choice == RPSChoicePaper && s.Player2Choice == RPSChoiceRock) ||
		(s.Player1Choice == RPSChoiceScissors && s.Player2Choice == RPSChoicePaper) {
		// Player 1 wins
		roundWinnerID = &s.Player1ID
		s.Player1Score++
	} else {
		// Player 2 wins
		roundWinnerID = &s.Player2ID
		s.Player2Score++
	}

	// Record the round
	round := RPSRound{
		RoundNumber:     s.CurrentRound,
		Player1Choice:   s.Player1Choice,
		Player2Choice:   s.Player2Choice,
		WinnerID:        roundWinnerID,
		Player1Revealed: true,
		Player2Revealed: true,
	}
	s.Rounds = append(s.Rounds, round)

	// Log round result (helpful for debugging early termination)
	// fmt.Printf("RPS Round %d complete: Score now %d-%d (need %d to win)\n", 
	//	s.CurrentRound, s.Player1Score, s.Player2Score, s.WinsNeeded)

	// Reset for next round
	s.Player1Choice = RPSChoiceNone
	s.Player2Choice = RPSChoiceNone
	s.BothRevealed = false
	s.CurrentRound++
}

// CheckWinner checks if there's a winner
// Game ends immediately when a player reaches the required wins (e.g., 3 in Best of 5)
func (s *RPSState) CheckWinner() (winner *uuid.UUID, gameOver bool) {
	// EARLY TERMINATION: Check if someone has won enough rounds (majority)
	// Best of 5 = need 3 wins, Best of 7 = need 4 wins, etc.
	if s.Player1Score >= s.WinsNeeded {
		return &s.Player1ID, true
	}
	if s.Player2Score >= s.WinsNeeded {
		return &s.Player2ID, true
	}

	// Check if max rounds reached (shouldn't happen with early termination, but safety check)
	if s.CurrentRound > s.MaxRounds {
		// Determine winner by score
		if s.Player1Score > s.Player2Score {
			return &s.Player1ID, true
		} else if s.Player2Score > s.Player1Score {
			return &s.Player2ID, true
		}
		// Draw (unlikely in best of odd number, but possible)
		return nil, true
	}

	return nil, false
}

// GetCurrentPlayer returns the ID of the player whose turn it is
// For RPS, both players play simultaneously, so we return a placeholder
func (s *RPSState) GetCurrentPlayer() uuid.UUID {
	// In RPS, both players move simultaneously
	// We'll return Player1ID by default, but the game logic should allow both to move
	return s.Player1ID
}

// GetState returns the current game state for serialization
func (s *RPSState) GetState() interface{} {
	// Defensive: Ensure Rounds is never nil
	if s.Rounds == nil {
		s.Rounds = []RPSRound{}
	}
	return s
}

// Clone creates a deep copy of the game state
func (s *RPSState) Clone() GameState {
	newState := *s
	// Deep copy rounds slice
	newState.Rounds = make([]RPSRound, len(s.Rounds))
	copy(newState.Rounds, s.Rounds)
	return &newState
}

// parseRPSMove parses a move from various formats
func parseRPSMove(move interface{}) (*RPSMove, error) {
	// Try to parse as RPSMove struct
	if m, ok := move.(*RPSMove); ok {
		return m, nil
	}

	if m, ok := move.(RPSMove); ok {
		return &m, nil
	}

	// Try to parse from JSON
	jsonData, err := json.Marshal(move)
	if err != nil {
		return nil, ErrInvalidMove
	}

	var rpsMove RPSMove
	if err := json.Unmarshal(jsonData, &rpsMove); err != nil {
		return nil, ErrInvalidMove
	}

	return &rpsMove, nil
}


