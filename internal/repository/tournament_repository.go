package repository

import (
	"context"
	"encoding/json"
	"time"

	"github.com/arenamatch/playforge/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type TournamentRepository struct {
	db *pgxpool.Pool
}

func NewTournamentRepository(db *pgxpool.Pool) *TournamentRepository {
	return &TournamentRepository{db: db}
}

// Create creates a new tournament
func (r *TournamentRepository) Create(ctx context.Context, tournament *domain.Tournament) error {
	query := `
		INSERT INTO tournaments (id, room_id, name, game_type, tournament_type, status, max_participants, is_private, join_code, created_by, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
	`

	tournament.ID = uuid.New()
	tournament.CreatedAt = time.Now()
	tournament.UpdatedAt = time.Now()
	tournament.Status = domain.TournamentStatusPending

	_, err := r.db.Exec(ctx, query,
		tournament.ID,
		tournament.RoomID,
		tournament.Name,
		tournament.GameType,
		tournament.TournamentType,
		tournament.Status,
		tournament.MaxParticipants,
		tournament.IsPrivate,
		tournament.JoinCode,
		tournament.CreatedBy,
		tournament.CreatedAt,
		tournament.UpdatedAt,
	)

	return err
}

// GetByID retrieves a tournament by ID
func (r *TournamentRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.Tournament, error) {
	query := `
		SELECT id, room_id, name, game_type, tournament_type, status, max_participants, is_private, join_code,
		       bracket_data, winner_id, created_by, started_at, ended_at, created_at, updated_at
		FROM tournaments
		WHERE id = $1
	`

	var tournament domain.Tournament
	var bracketDataJSON []byte
	var winnerID *uuid.UUID
	var startedAt, endedAt *time.Time
	var joinCode *string

	err := r.db.QueryRow(ctx, query, id).Scan(
		&tournament.ID,
		&tournament.RoomID,
		&tournament.Name,
		&tournament.GameType,
		&tournament.TournamentType,
		&tournament.Status,
		&tournament.MaxParticipants,
		&tournament.IsPrivate,
		&joinCode,
		&bracketDataJSON,
		&winnerID,
		&tournament.CreatedBy,
		&startedAt,
		&endedAt,
		&tournament.CreatedAt,
		&tournament.UpdatedAt,
	)

	if err == pgx.ErrNoRows {
		return nil, domain.ErrTournamentNotFound
	}
	if err != nil {
		return nil, err
	}

	tournament.StartedAt = startedAt
	tournament.EndedAt = endedAt
	if winnerID != nil {
		tournament.WinnerID = winnerID
	}
	if joinCode != nil {
		tournament.JoinCode = *joinCode
	}

	if len(bracketDataJSON) > 0 {
		var bracketData domain.BracketData
		if err := json.Unmarshal(bracketDataJSON, &bracketData); err != nil {
			return nil, err
		}
		tournament.BracketData = &bracketData
	}

	return &tournament, nil
}

// GetByRoomID retrieves a tournament by room ID
func (r *TournamentRepository) GetByRoomID(ctx context.Context, roomID uuid.UUID) (*domain.Tournament, error) {
	query := `
		SELECT id, room_id, name, game_type, tournament_type, status, max_participants, is_private, join_code,
		       bracket_data, winner_id, created_by, started_at, ended_at, created_at, updated_at
		FROM tournaments
		WHERE room_id = $1
	`

	var tournament domain.Tournament
	var bracketDataJSON []byte
	var winnerID *uuid.UUID
	var startedAt, endedAt *time.Time
	var joinCode *string

	err := r.db.QueryRow(ctx, query, roomID).Scan(
		&tournament.ID,
		&tournament.RoomID,
		&tournament.Name,
		&tournament.GameType,
		&tournament.TournamentType,
		&tournament.Status,
		&tournament.MaxParticipants,
		&tournament.IsPrivate,
		&joinCode,
		&bracketDataJSON,
		&winnerID,
		&tournament.CreatedBy,
		&startedAt,
		&endedAt,
		&tournament.CreatedAt,
		&tournament.UpdatedAt,
	)

	if err == pgx.ErrNoRows {
		return nil, domain.ErrTournamentNotFound
	}
	if err != nil {
		return nil, err
	}

	tournament.StartedAt = startedAt
	tournament.EndedAt = endedAt
	if winnerID != nil {
		tournament.WinnerID = winnerID
	}
	if joinCode != nil {
		tournament.JoinCode = *joinCode
	}

	if len(bracketDataJSON) > 0 {
		var bracketData domain.BracketData
		if err := json.Unmarshal(bracketDataJSON, &bracketData); err != nil {
			return nil, err
		}
		tournament.BracketData = &bracketData
	}

	return &tournament, nil
}

// List retrieves all tournaments with optional filters
func (r *TournamentRepository) List(ctx context.Context, status *domain.TournamentStatus, limit int) ([]domain.Tournament, error) {
	query := `
		SELECT id, room_id, name, game_type, tournament_type, status, max_participants, is_private, join_code,
		       bracket_data, winner_id, created_by, started_at, ended_at, created_at, updated_at
		FROM tournaments
	`

	args := []interface{}{}
	if status != nil {
		query += " WHERE status = $1"
		args = append(args, *status)
		query += " ORDER BY created_at DESC LIMIT $2"
		args = append(args, limit)
	} else {
		query += " ORDER BY created_at DESC LIMIT $1"
		args = append(args, limit)
	}

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tournaments []domain.Tournament
	for rows.Next() {
		var tournament domain.Tournament
		var bracketDataJSON []byte
		var winnerID *uuid.UUID
		var startedAt, endedAt *time.Time
		var joinCode *string

		err := rows.Scan(
			&tournament.ID,
			&tournament.RoomID,
			&tournament.Name,
			&tournament.GameType,
			&tournament.TournamentType,
			&tournament.Status,
			&tournament.MaxParticipants,
			&tournament.IsPrivate,
			&joinCode,
			&bracketDataJSON,
			&winnerID,
			&tournament.CreatedBy,
			&startedAt,
			&endedAt,
			&tournament.CreatedAt,
			&tournament.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		tournament.StartedAt = startedAt
		tournament.EndedAt = endedAt
		if winnerID != nil {
			tournament.WinnerID = winnerID
		}
		if joinCode != nil {
			tournament.JoinCode = *joinCode
		}

		if len(bracketDataJSON) > 0 {
			var bracketData domain.BracketData
			if err := json.Unmarshal(bracketDataJSON, &bracketData); err != nil {
				return nil, err
			}
			tournament.BracketData = &bracketData
		}

		tournaments = append(tournaments, tournament)
	}

	return tournaments, nil
}

// Update updates a tournament
func (r *TournamentRepository) Update(ctx context.Context, tournament *domain.Tournament) error {
	var bracketDataJSON []byte
	var err error

	if tournament.BracketData != nil {
		bracketDataJSON, err = json.Marshal(tournament.BracketData)
		if err != nil {
			return err
		}
	}

	query := `
		UPDATE tournaments
		SET status = $1, bracket_data = $2, winner_id = $3, started_at = $4, ended_at = $5, updated_at = $6
		WHERE id = $7
	`

	tournament.UpdatedAt = time.Now()

	_, err = r.db.Exec(ctx, query,
		tournament.Status,
		bracketDataJSON,
		tournament.WinnerID,
		tournament.StartedAt,
		tournament.EndedAt,
		tournament.UpdatedAt,
		tournament.ID,
	)

	return err
}

// CreateMatch creates a tournament match
func (r *TournamentRepository) CreateMatch(ctx context.Context, match *domain.TournamentMatch) error {
	query := `
		INSERT INTO tournament_matches (id, tournament_id, match_id, round, match_number, player1_id, player2_id, winner_id, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`

	match.ID = uuid.New()
	match.CreatedAt = time.Now()
	match.UpdatedAt = time.Now()
	match.Status = domain.TournamentMatchStatusPending

	_, err := r.db.Exec(ctx, query,
		match.ID,
		match.TournamentID,
		match.MatchID,
		match.Round,
		match.MatchNumber,
		match.Player1ID,
		match.Player2ID,
		match.WinnerID,
		match.Status,
		match.CreatedAt,
		match.UpdatedAt,
	)

	return err
}

// GetMatches retrieves all matches for a tournament
func (r *TournamentRepository) GetMatches(ctx context.Context, tournamentID uuid.UUID) ([]domain.TournamentMatch, error) {
	query := `
		SELECT id, tournament_id, match_id, round, match_number, player1_id, player2_id, winner_id, status, created_at, updated_at
		FROM tournament_matches
		WHERE tournament_id = $1
		ORDER BY round ASC, match_number ASC
	`

	rows, err := r.db.Query(ctx, query, tournamentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var matches []domain.TournamentMatch
	for rows.Next() {
		var match domain.TournamentMatch
		err := rows.Scan(
			&match.ID,
			&match.TournamentID,
			&match.MatchID,
			&match.Round,
			&match.MatchNumber,
			&match.Player1ID,
			&match.Player2ID,
			&match.WinnerID,
			&match.Status,
			&match.CreatedAt,
			&match.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		matches = append(matches, match)
	}

	return matches, nil
}

// UpdateMatch updates a tournament match
func (r *TournamentRepository) UpdateMatch(ctx context.Context, match *domain.TournamentMatch) error {
	query := `
		UPDATE tournament_matches
		SET match_id = $1, player1_id = $2, player2_id = $3, winner_id = $4, status = $5, updated_at = $6
		WHERE id = $7
	`

	match.UpdatedAt = time.Now()

	_, err := r.db.Exec(ctx, query,
		match.MatchID,
		match.Player1ID,
		match.Player2ID,
		match.WinnerID,
		match.Status,
		match.UpdatedAt,
		match.ID,
	)

	return err
}

// GetMatch retrieves a tournament match by ID
func (r *TournamentRepository) GetMatch(ctx context.Context, matchID uuid.UUID) (*domain.TournamentMatch, error) {
	query := `
		SELECT id, tournament_id, match_id, round, match_number, player1_id, player2_id, winner_id, status, created_at, updated_at
		FROM tournament_matches
		WHERE id = $1
	`

	var match domain.TournamentMatch
	err := r.db.QueryRow(ctx, query, matchID).Scan(
		&match.ID,
		&match.TournamentID,
		&match.MatchID,
		&match.Round,
		&match.MatchNumber,
		&match.Player1ID,
		&match.Player2ID,
		&match.WinnerID,
		&match.Status,
		&match.CreatedAt,
		&match.UpdatedAt,
	)

	if err == pgx.ErrNoRows {
		return nil, domain.ErrTournamentMatchNotFound
	}
	if err != nil {
		return nil, err
	}

	return &match, nil
}

// Delete deletes a tournament (and all related matches via CASCADE)
func (r *TournamentRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM tournaments WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}

