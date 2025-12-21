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

// NewRPSState creates a new Rock-Paper-Scissors game state
func NewRPSState(player1ID, player2ID uuid.UUID) *RPSState {
	return &RPSState{
		Player1ID:    player1ID,
		Player2ID:    player2ID,
		CurrentRound: 1,
		Player1Score: 0,
		Player2Score: 0,
		Rounds:       []RPSRound{},
		Player1Choice: RPSChoiceNone,
		Player2Choice: RPSChoiceNone,
		BothRevealed: false,
		MaxRounds:    5,
		WinsNeeded:   3,
	}
}

// ValidateMove checks if a move is valid
func (s *RPSState) ValidateMove(playerID uuid.UUID, move interface{}) error {
	// Check if player is valid
	if playerID != s.Player1ID && playerID != s.Player2ID {
		return ErrInvalidPlayer
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

	// Reset for next round
	s.Player1Choice = RPSChoiceNone
	s.Player2Choice = RPSChoiceNone
	s.BothRevealed = false
	s.CurrentRound++
}

// CheckWinner checks if there's a winner (first to 3 rounds)
func (s *RPSState) CheckWinner() (winner *uuid.UUID, gameOver bool) {
	// Check if someone has won 3 rounds
	if s.Player1Score >= s.WinsNeeded {
		return &s.Player1ID, true
	}
	if s.Player2Score >= s.WinsNeeded {
		return &s.Player2ID, true
	}

	// Check if max rounds reached
	if s.CurrentRound > s.MaxRounds {
		// Determine winner by score
		if s.Player1Score > s.Player2Score {
			return &s.Player1ID, true
		} else if s.Player2Score > s.Player1Score {
			return &s.Player2ID, true
		}
		// Draw (unlikely in best of 5, but possible if we change rules)
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

