package repository

import (
	"context"
	"errors"
	"time"

	"github.com/arenamatch/playforge/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UserRepository struct {
	db *pgxpool.Pool
}

func NewUserRepository(db *pgxpool.Pool) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(ctx context.Context, user *domain.User) error {
	query := `
		INSERT INTO users (id, username, email, password_hash, elo_rating, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`

	user.ID = uuid.New()
	user.EloRating = 1200 // Default starting ELO
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()

	_, err := r.db.Exec(ctx, query,
		user.ID,
		user.Username,
		user.Email,
		user.PasswordHash,
		user.EloRating,
		user.CreatedAt,
		user.UpdatedAt,
	)

	if err != nil {
		return err
	}

	return nil
}

func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	query := `
		SELECT id, username, email, password_hash, elo_rating, created_at, updated_at
		FROM users
		WHERE email = $1
	`

	var user domain.User
	err := r.db.QueryRow(ctx, query, email).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.PasswordHash,
		&user.EloRating,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrUserNotFound
		}
		return nil, err
	}

	return &user, nil
}

func (r *UserRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	query := `
		SELECT id, username, email, password_hash, elo_rating, created_at, updated_at
		FROM users
		WHERE id = $1
	`

	var user domain.User
	err := r.db.QueryRow(ctx, query, id).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.PasswordHash,
		&user.EloRating,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrUserNotFound
		}
		return nil, err
	}

	return &user, nil
}

func (r *UserRepository) GetByUsername(ctx context.Context, username string) (*domain.User, error) {
	query := `
		SELECT id, username, email, password_hash, elo_rating, created_at, updated_at
		FROM users
		WHERE username = $1
	`

	var user domain.User
	err := r.db.QueryRow(ctx, query, username).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.PasswordHash,
		&user.EloRating,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrUserNotFound
		}
		return nil, err
	}

	return &user, nil
}

func (r *UserRepository) UpdateEloRating(ctx context.Context, userID uuid.UUID, newRating int) error {
	query := `
		UPDATE users
		SET elo_rating = $1, updated_at = $2
		WHERE id = $3
	`

	_, err := r.db.Exec(ctx, query, newRating, time.Now(), userID)
	return err
}

func (r *UserRepository) Update(ctx context.Context, user *domain.User) error {
	query := `
		UPDATE users
		SET username = $1, email = $2, password_hash = $3, elo_rating = $4, updated_at = $5
		WHERE id = $6
	`

	user.UpdatedAt = time.Now()

	result, err := r.db.Exec(ctx, query,
		user.Username,
		user.Email,
		user.PasswordHash,
		user.EloRating,
		user.UpdatedAt,
		user.ID,
	)

	if err != nil {
		return err
	}

	if result.RowsAffected() == 0 {
		return domain.ErrUserNotFound
	}

	return nil
}


