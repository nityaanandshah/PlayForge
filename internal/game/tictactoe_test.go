package game

import (
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

// TestNewTicTacToeState tests creating a new Tic-Tac-Toe game
func TestNewTicTacToeState(t *testing.T) {
	player1 := uuid.New()
	player2 := uuid.New()

	t.Run("Create New Game", func(t *testing.T) {
		state := NewTicTacToeState(player1, player2)

		assert.NotNil(t, state)
		assert.Equal(t, 3, state.GridSize)
		assert.Equal(t, 3, state.WinLength)
		assert.Equal(t, player1, state.Player1ID)
		assert.Equal(t, player2, state.Player2ID)
		assert.Equal(t, player1, state.CurrentPlayer)
		assert.Equal(t, 0, state.MoveCount)
		assert.Len(t, state.Board, 3)
		assert.Len(t, state.Board[0], 3)
	})

	t.Run("Create Custom Size Game", func(t *testing.T) {
		settings := map[string]interface{}{
			"tictactoe_grid_size": float64(5),
			"tictactoe_win_length": float64(4),
		}
		state := NewTicTacToeStateWithSettings(player1, player2, settings)

		assert.Equal(t, 5, state.GridSize)
		assert.Equal(t, 4, state.WinLength)
		assert.Len(t, state.Board, 5)
	})
}

// TestTicTacToeValidateMove tests move validation
func TestTicTacToeValidateMove(t *testing.T) {
	player1 := uuid.New()
	player2 := uuid.New()
	state := NewTicTacToeState(player1, player2)

	t.Run("Valid Move", func(t *testing.T) {
		move := TicTacToeMove{Row: 0, Col: 0}
		err := state.ValidateMove(player1, move)
		assert.NoError(t, err)
	})

	t.Run("Wrong Player Turn", func(t *testing.T) {
		move := TicTacToeMove{Row: 0, Col: 0}
		err := state.ValidateMove(player2, move)
		assert.Error(t, err)
		assert.Equal(t, ErrNotYourTurn, err)
	})

	t.Run("Out of Bounds Row", func(t *testing.T) {
		move := TicTacToeMove{Row: 5, Col: 0}
		err := state.ValidateMove(player1, move)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "out of bounds")
	})

	t.Run("Out of Bounds Col", func(t *testing.T) {
		move := TicTacToeMove{Row: 0, Col: 5}
		err := state.ValidateMove(player1, move)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "out of bounds")
	})

	t.Run("Cell Already Occupied", func(t *testing.T) {
		state.Board[1][1] = "X"
		move := TicTacToeMove{Row: 1, Col: 1}
		err := state.ValidateMove(player1, move)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "occupied")
	})
}

// TestTicTacToeApplyMove tests applying moves
func TestTicTacToeApplyMove(t *testing.T) {
	player1 := uuid.New()
	player2 := uuid.New()
	state := NewTicTacToeState(player1, player2)

	t.Run("Apply First Move", func(t *testing.T) {
		move := TicTacToeMove{Row: 0, Col: 0}
		err := state.ApplyMove(player1, move)

		assert.NoError(t, err)
		assert.Equal(t, "X", state.Board[0][0])
		assert.Equal(t, player2, state.CurrentPlayer)
		assert.Equal(t, 1, state.MoveCount)
	})

	t.Run("Apply Second Move", func(t *testing.T) {
		move := TicTacToeMove{Row: 1, Col: 1}
		err := state.ApplyMove(player2, move)

		assert.NoError(t, err)
		assert.Equal(t, "O", state.Board[1][1])
		assert.Equal(t, player1, state.CurrentPlayer)
		assert.Equal(t, 2, state.MoveCount)
	})
}

// TestTicTacToeCheckWinner tests win detection
func TestTicTacToeCheckWinner(t *testing.T) {
	player1 := uuid.New()
	player2 := uuid.New()

	t.Run("Horizontal Win", func(t *testing.T) {
		state := NewTicTacToeState(player1, player2)
		state.Board[0][0] = "X"
		state.Board[0][1] = "X"
		state.Board[0][2] = "X"

		winner, gameOver := state.CheckWinner()

		assert.True(t, gameOver)
		assert.NotNil(t, winner)
		assert.Equal(t, player1, *winner)
	})

	t.Run("Vertical Win", func(t *testing.T) {
		state := NewTicTacToeState(player1, player2)
		state.Board[0][0] = "O"
		state.Board[1][0] = "O"
		state.Board[2][0] = "O"

		winner, gameOver := state.CheckWinner()

		assert.True(t, gameOver)
		assert.NotNil(t, winner)
		assert.Equal(t, player2, *winner)
	})

	t.Run("Diagonal Win (Top-Left to Bottom-Right)", func(t *testing.T) {
		state := NewTicTacToeState(player1, player2)
		state.Board[0][0] = "X"
		state.Board[1][1] = "X"
		state.Board[2][2] = "X"

		winner, gameOver := state.CheckWinner()

		assert.True(t, gameOver)
		assert.NotNil(t, winner)
		assert.Equal(t, player1, *winner)
	})

	t.Run("Diagonal Win (Top-Right to Bottom-Left)", func(t *testing.T) {
		state := NewTicTacToeState(player1, player2)
		state.Board[0][2] = "O"
		state.Board[1][1] = "O"
		state.Board[2][0] = "O"

		winner, gameOver := state.CheckWinner()

		assert.True(t, gameOver)
		assert.NotNil(t, winner)
		assert.Equal(t, player2, *winner)
	})

	t.Run("Draw Game", func(t *testing.T) {
		state := NewTicTacToeState(player1, player2)
		// Fill board with no winner
		state.Board = [][]string{
			{"X", "O", "X"},
			{"X", "O", "X"},
			{"O", "X", "O"},
		}
		state.MoveCount = 9

		winner, gameOver := state.CheckWinner()

		assert.True(t, gameOver)
		assert.Nil(t, winner)
	})

	t.Run("Game In Progress", func(t *testing.T) {
		state := NewTicTacToeState(player1, player2)
		state.Board[0][0] = "X"
		state.Board[1][1] = "O"
		state.MoveCount = 2

		winner, gameOver := state.CheckWinner()

		assert.False(t, gameOver)
		assert.Nil(t, winner)
	})
}

// TestTicTacToeFullGame tests a complete game scenario
func TestTicTacToeFullGame(t *testing.T) {
	player1 := uuid.New()
	player2 := uuid.New()
	state := NewTicTacToeState(player1, player2)

	moves := []struct {
		player uuid.UUID
		move   TicTacToeMove
	}{
		{player1, TicTacToeMove{0, 0}}, // X
		{player2, TicTacToeMove{1, 0}}, // O
		{player1, TicTacToeMove{0, 1}}, // X
		{player2, TicTacToeMove{1, 1}}, // O
		{player1, TicTacToeMove{0, 2}}, // X wins
	}

	for i, m := range moves {
		err := state.ApplyMove(m.player, m.move)
		assert.NoError(t, err, "Move %d failed", i)

		if i == len(moves)-1 {
			// Last move should win
			winner, gameOver := state.CheckWinner()
			assert.True(t, gameOver)
			assert.Equal(t, player1, *winner)
		}
	}
}

// TestTicTacToeClone tests state cloning
func TestTicTacToeClone(t *testing.T) {
	player1 := uuid.New()
	player2 := uuid.New()
	state := NewTicTacToeState(player1, player2)

	state.Board[0][0] = "X"
	state.MoveCount = 1

	cloned := state.Clone()
	clonedState := cloned.(*TicTacToeState)

	assert.Equal(t, state.Board[0][0], clonedState.Board[0][0])
	assert.Equal(t, state.MoveCount, clonedState.MoveCount)

	// Modify clone
	clonedState.Board[1][1] = "O"

	// Original should be unchanged
	assert.Empty(t, state.Board[1][1])
	assert.Equal(t, "O", clonedState.Board[1][1])
}

