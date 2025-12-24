package game

import (
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestNewRPSState(t *testing.T) {
	player1 := uuid.New()
	player2 := uuid.New()

	t.Run("Create Default Game", func(t *testing.T) {
		state := NewRPSState(player1, player2)

		assert.NotNil(t, state)
		assert.Equal(t, 5, state.MaxRounds)
		assert.Equal(t, 3, state.WinsNeeded)
		assert.Equal(t, 0, state.Player1Score)
		assert.Equal(t, 0, state.Player2Score)
		assert.Equal(t, 1, state.CurrentRound)
	})

	t.Run("Create Best of 7", func(t *testing.T) {
		settings := map[string]interface{}{
			"rps_best_of": float64(7),
		}
		state := NewRPSStateWithSettings(player1, player2, settings)

		assert.Equal(t, 7, state.MaxRounds)
		assert.Equal(t, 4, state.WinsNeeded)
	})
}

func TestRPSValidateMove(t *testing.T) {
	player1 := uuid.New()
	player2 := uuid.New()
	state := NewRPSState(player1, player2)

	t.Run("Valid Rock Choice", func(t *testing.T) {
		move := RPSMove{Choice: RPSChoiceRock}
		err := state.ValidateMove(player1, move)
		assert.NoError(t, err)
	})

	t.Run("Valid Paper Choice", func(t *testing.T) {
		move := RPSMove{Choice: RPSChoicePaper}
		err := state.ValidateMove(player1, move)
		assert.NoError(t, err)
	})

	t.Run("Valid Scissors Choice", func(t *testing.T) {
		move := RPSMove{Choice: RPSChoiceScissors}
		err := state.ValidateMove(player1, move)
		assert.NoError(t, err)
	})

	t.Run("Invalid Empty Choice", func(t *testing.T) {
		move := RPSMove{Choice: ""}
		err := state.ValidateMove(player1, move)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "invalid choice")
	})

	t.Run("Invalid Invalid Choice", func(t *testing.T) {
		move := RPSMove{Choice: "lizard"}
		err := state.ValidateMove(player1, move)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "invalid choice")
	})
}

func TestRPSApplyMove(t *testing.T) {
	player1 := uuid.New()
	player2 := uuid.New()
	state := NewRPSState(player1, player2)

	t.Run("Player1 Chooses First", func(t *testing.T) {
		move := RPSMove{Choice: RPSChoiceRock}
		err := state.ApplyMove(player1, move)

		assert.NoError(t, err)
		assert.Equal(t, RPSChoiceRock, state.Player1Choice)
		assert.Empty(t, state.Player2Choice)
		assert.False(t, state.BothRevealed)
	})

	t.Run("Player2 Chooses - Round Resolves", func(t *testing.T) {
		move := RPSMove{Choice: RPSChoiceScissors}
		err := state.ApplyMove(player2, move)

		assert.NoError(t, err)
		// After round resolves, choices are reset for next round
		// Rock beats Scissors, so player1 wins
		assert.Equal(t, 1, state.Player1Score)
		assert.Equal(t, 0, state.Player2Score)
		assert.Equal(t, 2, state.CurrentRound)
	})
}

// TestRPSDetermineWinner tests win logic through ApplyMove
// Note: We test the win determination logic indirectly through game flow
// since determineWinner is a private method
func TestRPSWinLogic(t *testing.T) {
	testCases := []struct {
		name            string
		player1Choice   RPSChoice
		player2Choice   RPSChoice
		expectedWinner  string // "player1", "player2", or "draw"
	}{
		{"Rock beats Scissors", RPSChoiceRock, RPSChoiceScissors, "player1"},
		{"Scissors beats Paper", RPSChoiceScissors, RPSChoicePaper, "player1"},
		{"Paper beats Rock", RPSChoicePaper, RPSChoiceRock, "player1"},
		{"Scissors loses to Rock", RPSChoiceScissors, RPSChoiceRock, "player2"},
		{"Paper loses to Scissors", RPSChoicePaper, RPSChoiceScissors, "player2"},
		{"Rock loses to Paper", RPSChoiceRock, RPSChoicePaper, "player2"},
		{"Rock draws Rock", RPSChoiceRock, RPSChoiceRock, "draw"},
		{"Paper draws Paper", RPSChoicePaper, RPSChoicePaper, "draw"},
		{"Scissors draws Scissors", RPSChoiceScissors, RPSChoiceScissors, "draw"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			player1 := uuid.New()
			player2 := uuid.New()
			state := NewRPSState(player1, player2)

			// Apply both moves
			err := state.ApplyMove(player1, RPSMove{Choice: tc.player1Choice})
			assert.NoError(t, err)

			initialP1Score := state.Player1Score
			initialP2Score := state.Player2Score

			err = state.ApplyMove(player2, RPSMove{Choice: tc.player2Choice})
			assert.NoError(t, err)

			// Check scores updated correctly
			switch tc.expectedWinner {
			case "player1":
				assert.Equal(t, initialP1Score+1, state.Player1Score)
				assert.Equal(t, initialP2Score, state.Player2Score)
			case "player2":
				assert.Equal(t, initialP1Score, state.Player1Score)
				assert.Equal(t, initialP2Score+1, state.Player2Score)
			case "draw":
				assert.Equal(t, initialP1Score, state.Player1Score)
				assert.Equal(t, initialP2Score, state.Player2Score)
			}
		})
	}
}

func TestRPSCheckWinner(t *testing.T) {
	player1 := uuid.New()
	player2 := uuid.New()

	t.Run("Game In Progress", func(t *testing.T) {
		state := NewRPSState(player1, player2)
		state.Player1Score = 1
		state.Player2Score = 1

		winner, gameOver := state.CheckWinner()

		assert.False(t, gameOver)
		assert.Nil(t, winner)
	})

	t.Run("Player1 Wins", func(t *testing.T) {
		state := NewRPSState(player1, player2)
		state.Player1Score = 3
		state.Player2Score = 1

		winner, gameOver := state.CheckWinner()

		assert.True(t, gameOver)
		assert.Equal(t, player1, *winner)
	})

	t.Run("Player2 Wins", func(t *testing.T) {
		state := NewRPSState(player1, player2)
		state.Player1Score = 2
		state.Player2Score = 3

		winner, gameOver := state.CheckWinner()

		assert.True(t, gameOver)
		assert.Equal(t, player2, *winner)
	})
}

func TestRPSFullGame(t *testing.T) {
	player1 := uuid.New()
	player2 := uuid.New()
	state := NewRPSState(player1, player2)

	// Play 3 rounds - player1 wins 3-0
	rounds := []struct {
		p1Choice RPSChoice
		p2Choice RPSChoice
	}{
		{RPSChoiceRock, RPSChoiceScissors},     // P1 wins
		{RPSChoicePaper, RPSChoiceRock},        // P1 wins
		{RPSChoiceScissors, RPSChoicePaper},    // P1 wins
	}

	for i, round := range rounds {
		// Player 1 chooses
		err := state.ApplyMove(player1, RPSMove{Choice: round.p1Choice})
		assert.NoError(t, err)

		// Player 2 chooses
		err = state.ApplyMove(player2, RPSMove{Choice: round.p2Choice})
		assert.NoError(t, err)

		if i == len(rounds)-1 {
			// Game should be over
			winner, gameOver := state.CheckWinner()
			assert.True(t, gameOver)
			assert.Equal(t, player1, *winner)
			assert.Equal(t, 3, state.Player1Score)
		}
	}
}

