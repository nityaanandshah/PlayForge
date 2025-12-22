package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type RoomRepository struct {
	db *pgxpool.Pool
}

func NewRoomRepository(db *pgxpool.Pool) *RoomRepository {
	return &RoomRepository{db: db}
}

// Create creates a room in the database
func (r *RoomRepository) Create(ctx context.Context, room *RoomDB) error {
	query := `
		INSERT INTO rooms (id, code, host_id, game_type, max_players, status, is_tournament, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`

	room.CreatedAt = time.Now()
	room.UpdatedAt = time.Now()

	_, err := r.db.Exec(ctx, query,
		room.ID,
		room.Code,
		room.HostID,
		room.GameType,
		room.MaxPlayers,
		room.Status,
		room.IsTournament,
		room.CreatedAt,
		room.UpdatedAt,
	)

	return err
}

// GetByID retrieves a room by ID
func (r *RoomRepository) GetByID(ctx context.Context, id uuid.UUID) (*RoomDB, error) {
	query := `
		SELECT id, code, host_id, game_type, max_players, status, is_tournament, created_at, updated_at
		FROM rooms
		WHERE id = $1
	`

	var room RoomDB
	err := r.db.QueryRow(ctx, query, id).Scan(
		&room.ID,
		&room.Code,
		&room.HostID,
		&room.GameType,
		&room.MaxPlayers,
		&room.Status,
		&room.IsTournament,
		&room.CreatedAt,
		&room.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &room, nil
}

// Update updates a room
func (r *RoomRepository) Update(ctx context.Context, room *RoomDB) error {
	query := `
		UPDATE rooms
		SET status = $1, updated_at = $2
		WHERE id = $3
	`

	room.UpdatedAt = time.Now()

	_, err := r.db.Exec(ctx, query,
		room.Status,
		room.UpdatedAt,
		room.ID,
	)

	return err
}

// Delete deletes a room
func (r *RoomRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM rooms WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}

// RoomDB represents a room in the database
type RoomDB struct {
	ID           uuid.UUID
	Code         string
	HostID       uuid.UUID
	GameType     string
	MaxPlayers   int
	Status       string
	IsTournament bool
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

