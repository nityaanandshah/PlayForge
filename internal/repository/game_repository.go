package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type GameRepository struct {
	db *pgxpool.Pool
}

func NewGameRepository(db *pgxpool.Pool) *GameRepository {
	return &GameRepository{db: db}
}

// SaveCompletedGame saves a completed game to the database
func (r *GameRepository) SaveCompletedGame(
	ctx context.Context,
	gameID uuid.UUID,
	gameType string,
	player1ID uuid.UUID,
	player2ID uuid.UUID,
	winnerID *uuid.UUID,
	startedAt time.Time,
	endedAt *time.Time,
	gameState []byte,
) error {
	query := `
		INSERT INTO game_matches (id, game_type, player1_id, player2_id, winner_id, status, started_at, ended_at, created_at, game_state)
		VALUES ($1, $2, $3, $4, $5, 'completed', $6, $7, $8, $9)
		ON CONFLICT (id) DO UPDATE SET
			winner_id = EXCLUDED.winner_id,
			status = EXCLUDED.status,
			ended_at = EXCLUDED.ended_at,
			game_state = EXCLUDED.game_state
	`

	_, err := r.db.Exec(
		ctx,
		query,
		gameID,
		gameType,
		player1ID,
		player2ID,
		winnerID,
		startedAt,
		endedAt,
		startedAt,
		gameState,
	)

	return err
}

// GetByID retrieves a game from the database by ID
func (r *GameRepository) GetByID(ctx context.Context, gameID uuid.UUID) (map[string]interface{}, error) {
	query := `
		SELECT 
			gm.id, gm.game_type, gm.player1_id, u1.username, gm.player2_id, u2.username,
			gm.winner_id, gm.status, gm.started_at, gm.ended_at, gm.game_state, gm.created_at
		FROM game_matches gm
		INNER JOIN users u1 ON gm.player1_id = u1.id
		INNER JOIN users u2 ON gm.player2_id = u2.id
		WHERE gm.id = $1
	`

	var (
		id, player1ID, player2ID           uuid.UUID
		gameType, status                   string
		player1Name, player2Name           string
		winnerID                           *uuid.UUID
		startedAt, createdAt               time.Time
		endedAt                            *time.Time
		gameState                          []byte
	)

	err := r.db.QueryRow(ctx, query, gameID).Scan(
		&id, &gameType, &player1ID, &player1Name, &player2ID, &player2Name,
		&winnerID, &status, &startedAt, &endedAt, &gameState, &createdAt,
	)
	if err != nil {
		return nil, err
	}

	result := map[string]interface{}{
		"id":           id,
		"game_type":    gameType,
		"player1_id":   player1ID,
		"player1_name": player1Name,
		"player2_id":   player2ID,
		"player2_name": player2Name,
		"winner_id":    winnerID,
		"status":       status,
		"started_at":   startedAt,
		"ended_at":     endedAt,
		"game_state":   gameState,
		"created_at":   createdAt,
	}

	return result, nil
}

