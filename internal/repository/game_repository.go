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
) error {
	query := `
		INSERT INTO game_matches (id, game_type, player1_id, player2_id, winner_id, status, started_at, ended_at, created_at)
		VALUES ($1, $2, $3, $4, $5, 'completed', $6, $7, $8)
		ON CONFLICT (id) DO UPDATE SET
			winner_id = EXCLUDED.winner_id,
			status = EXCLUDED.status,
			ended_at = EXCLUDED.ended_at
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
	)

	return err
}

