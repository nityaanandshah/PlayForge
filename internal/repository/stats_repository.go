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

// LeaderboardEntry represents a player on the leaderboard
type LeaderboardEntry struct {
	UserID      uuid.UUID `json:"user_id"`
	Username    string    `json:"username"`
	EloRating   int       `json:"elo_rating"`
	Wins        int       `json:"wins"`
	Losses      int       `json:"losses"`
	Draws       int       `json:"draws"`
	TotalGames  int       `json:"total_games"`
}

// GetLeaderboard gets top players by ELO rating, optionally filtered by game type
func (r *StatsRepository) GetLeaderboard(ctx context.Context, gameType string, limit int) ([]LeaderboardEntry, error) {
	var query string
	var args []interface{}

	if gameType == "" || gameType == "all" {
		// Global leaderboard - by overall ELO rating
		query = `
			SELECT u.id, u.username, u.elo_rating, 
				   COALESCE(SUM(ps.wins), 0) as wins, 
				   COALESCE(SUM(ps.losses), 0) as losses,
				   COALESCE(SUM(ps.draws), 0) as draws,
				   COALESCE(SUM(ps.total_games), 0) as total_games
			FROM users u
			LEFT JOIN player_stats ps ON u.id = ps.user_id
			GROUP BY u.id, u.username, u.elo_rating
			HAVING COALESCE(SUM(ps.total_games), 0) > 0
			ORDER BY u.elo_rating DESC
			LIMIT $1
		`
		args = []interface{}{limit}
	} else {
		// Game-specific leaderboard - by ELO rating with game stats
		query = `
			SELECT u.id, u.username, u.elo_rating, 
				   ps.wins, ps.losses, ps.draws, ps.total_games
			FROM users u
			INNER JOIN player_stats ps ON u.id = ps.user_id
			WHERE ps.game_type = $1 AND ps.total_games > 0
			ORDER BY u.elo_rating DESC, ps.wins DESC
			LIMIT $2
		`
		args = []interface{}{gameType, limit}
	}

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []LeaderboardEntry
	for rows.Next() {
		var entry LeaderboardEntry
		err := rows.Scan(
			&entry.UserID,
			&entry.Username,
			&entry.EloRating,
			&entry.Wins,
			&entry.Losses,
			&entry.Draws,
			&entry.TotalGames,
		)
		if err != nil {
			return nil, err
		}
		entries = append(entries, entry)
	}

	return entries, rows.Err()
}

// MatchHistoryEntry represents a match in user's history
type MatchHistoryEntry struct {
	ID          uuid.UUID  `json:"id"`
	GameType    string     `json:"game_type"`
	Player1ID   uuid.UUID  `json:"player1_id"`
	Player1Name string     `json:"player1_name"`
	Player2ID   uuid.UUID  `json:"player2_id"`
	Player2Name string     `json:"player2_name"`
	WinnerID    *uuid.UUID `json:"winner_id"`
	Status      string     `json:"status"`
	StartedAt   time.Time  `json:"started_at"`
	EndedAt     *time.Time `json:"ended_at"`
}

// GetMatchHistory retrieves match history for a user, optionally filtered by game type
func (r *StatsRepository) GetMatchHistory(ctx context.Context, userID uuid.UUID, gameType string, limit int) ([]MatchHistoryEntry, error) {
	var query string
	var args []interface{}

	if gameType == "" || gameType == "all" {
		query = `
			SELECT gm.id, gm.game_type, gm.player1_id, u1.username, gm.player2_id, u2.username,
				   gm.winner_id, gm.status, gm.started_at, gm.ended_at
			FROM game_matches gm
			INNER JOIN users u1 ON gm.player1_id = u1.id
			INNER JOIN users u2 ON gm.player2_id = u2.id
			WHERE (gm.player1_id = $1 OR gm.player2_id = $1) AND gm.status = 'completed'
			ORDER BY gm.started_at DESC
			LIMIT $2
		`
		args = []interface{}{userID, limit}
	} else {
		query = `
			SELECT gm.id, gm.game_type, gm.player1_id, u1.username, gm.player2_id, u2.username,
				   gm.winner_id, gm.status, gm.started_at, gm.ended_at
			FROM game_matches gm
			INNER JOIN users u1 ON gm.player1_id = u1.id
			INNER JOIN users u2 ON gm.player2_id = u2.id
			WHERE (gm.player1_id = $1 OR gm.player2_id = $1) 
			  AND gm.game_type = $2 
			  AND gm.status = 'completed'
			ORDER BY gm.started_at DESC
			LIMIT $3
		`
		args = []interface{}{userID, gameType, limit}
	}

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []MatchHistoryEntry
	for rows.Next() {
		var entry MatchHistoryEntry
		err := rows.Scan(
			&entry.ID,
			&entry.GameType,
			&entry.Player1ID,
			&entry.Player1Name,
			&entry.Player2ID,
			&entry.Player2Name,
			&entry.WinnerID,
			&entry.Status,
			&entry.StartedAt,
			&entry.EndedAt,
		)
		if err != nil {
			return nil, err
		}
		entries = append(entries, entry)
	}

	return entries, rows.Err()
}

