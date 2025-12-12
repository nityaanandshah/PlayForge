package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PlayerStats struct {
	ID           uuid.UUID `json:"id"`
	UserID       uuid.UUID `json:"user_id"`
	GameType     string    `json:"game_type"`
	Wins         int       `json:"wins"`
	Losses       int       `json:"losses"`
	Draws        int       `json:"draws"`
	CurrentStreak int      `json:"current_streak"`
	BestStreak   int       `json:"best_streak"`
	TotalGames   int       `json:"total_games"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type StatsRepository struct {
	db *pgxpool.Pool
}

func NewStatsRepository(db *pgxpool.Pool) *StatsRepository {
	return &StatsRepository{db: db}
}

// GetOrCreateStats gets or creates player stats for a game type
func (r *StatsRepository) GetOrCreateStats(ctx context.Context, userID uuid.UUID, gameType string) (*PlayerStats, error) {
	// Try to get existing stats
	query := `
		SELECT id, user_id, game_type, wins, losses, draws, current_streak, best_streak, total_games, created_at, updated_at
		FROM player_stats
		WHERE user_id = $1 AND game_type = $2
	`

	var stats PlayerStats
	err := r.db.QueryRow(ctx, query, userID, gameType).Scan(
		&stats.ID,
		&stats.UserID,
		&stats.GameType,
		&stats.Wins,
		&stats.Losses,
		&stats.Draws,
		&stats.CurrentStreak,
		&stats.BestStreak,
		&stats.TotalGames,
		&stats.CreatedAt,
		&stats.UpdatedAt,
	)

	if err == nil {
		return &stats, nil
	}

	// If not found, create new stats
	insertQuery := `
		INSERT INTO player_stats (id, user_id, game_type, wins, losses, draws, current_streak, best_streak, total_games, created_at, updated_at)
		VALUES ($1, $2, $3, 0, 0, 0, 0, 0, 0, $4, $4)
		RETURNING id, user_id, game_type, wins, losses, draws, current_streak, best_streak, total_games, created_at, updated_at
	`

	now := time.Now()
	err = r.db.QueryRow(ctx, insertQuery, uuid.New(), userID, gameType, now).Scan(
		&stats.ID,
		&stats.UserID,
		&stats.GameType,
		&stats.Wins,
		&stats.Losses,
		&stats.Draws,
		&stats.CurrentStreak,
		&stats.BestStreak,
		&stats.TotalGames,
		&stats.CreatedAt,
		&stats.UpdatedAt,
	)

	return &stats, err
}

// UpdateStats updates player stats after a game
func (r *StatsRepository) UpdateStats(ctx context.Context, userID uuid.UUID, gameType string, won bool, draw bool) error {
	query := `
		UPDATE player_stats
		SET 
			wins = wins + $3,
			losses = losses + $4,
			draws = draws + $5,
			current_streak = CASE 
				WHEN $3 = 1 THEN current_streak + 1
				WHEN $4 = 1 THEN 0
				ELSE current_streak
			END,
			best_streak = CASE 
				WHEN $3 = 1 AND (current_streak + 1) > best_streak THEN current_streak + 1
				ELSE best_streak
			END,
			total_games = total_games + 1,
			updated_at = $6
		WHERE user_id = $1 AND game_type = $2
	`

	winInc := 0
	lossInc := 0
	drawInc := 0

	if draw {
		drawInc = 1
	} else if won {
		winInc = 1
	} else {
		lossInc = 1
	}

	_, err := r.db.Exec(ctx, query, userID, gameType, winInc, lossInc, drawInc, time.Now())
	return err
}

