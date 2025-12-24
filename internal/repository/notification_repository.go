package repository

import (
	"context"
	"encoding/json"
	"time"

	"github.com/arenamatch/playforge/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type NotificationRepository struct {
	db *pgxpool.Pool
}

func NewNotificationRepository(db *pgxpool.Pool) *NotificationRepository {
	return &NotificationRepository{db: db}
}

// CreateNotification creates a new notification
func (r *NotificationRepository) CreateNotification(ctx context.Context, req *domain.CreateNotificationRequest) (*domain.Notification, error) {
	notification := &domain.Notification{
		ID:        uuid.New(),
		UserID:    req.UserID,
		Type:      req.Type,
		Title:     req.Title,
		Message:   req.Message,
		Data:      req.Data,
		Read:      false,
		CreatedAt: time.Now(),
	}

	// Convert data map to JSONB
	var dataJSON []byte
	var err error
	if req.Data != nil {
		dataJSON, err = json.Marshal(req.Data)
		if err != nil {
			return nil, err
		}
	}

	query := `
		INSERT INTO notifications (id, user_id, type, title, message, data, read, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`

	_, err = r.db.Exec(ctx, query,
		notification.ID,
		notification.UserID,
		notification.Type,
		notification.Title,
		notification.Message,
		dataJSON,
		notification.Read,
		notification.CreatedAt,
	)

	if err != nil {
		return nil, err
	}

	return notification, nil
}

// GetUserNotifications retrieves notifications for a user
func (r *NotificationRepository) GetUserNotifications(ctx context.Context, userID uuid.UUID, limit int) ([]domain.Notification, error) {
	if limit <= 0 {
		limit = 10 // Default limit
	}

	query := `
		SELECT id, user_id, type, title, message, data, read, created_at
		FROM notifications
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2
	`

	rows, err := r.db.Query(ctx, query, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notifications []domain.Notification
	for rows.Next() {
		var n domain.Notification
		var dataJSON []byte

		err := rows.Scan(
			&n.ID,
			&n.UserID,
			&n.Type,
			&n.Title,
			&n.Message,
			&dataJSON,
			&n.Read,
			&n.CreatedAt,
		)
		if err != nil {
			return nil, err
		}

		// Parse JSONB data
		if len(dataJSON) > 0 {
			var data map[string]interface{}
			if err := json.Unmarshal(dataJSON, &data); err == nil {
				n.Data = data
			}
		}

		notifications = append(notifications, n)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return notifications, nil
}

// GetUnreadCount returns the count of unread notifications for a user
func (r *NotificationRepository) GetUnreadCount(ctx context.Context, userID uuid.UUID) (int, error) {
	query := `
		SELECT COUNT(*)
		FROM notifications
		WHERE user_id = $1 AND read = FALSE
	`

	var count int
	err := r.db.QueryRow(ctx, query, userID).Scan(&count)
	if err != nil {
		return 0, err
	}

	return count, nil
}

// MarkAsRead marks a notification as read
func (r *NotificationRepository) MarkAsRead(ctx context.Context, notificationID uuid.UUID, userID uuid.UUID) error {
	query := `
		UPDATE notifications
		SET read = TRUE
		WHERE id = $1 AND user_id = $2
	`

	result, err := r.db.Exec(ctx, query, notificationID, userID)
	if err != nil {
		return err
	}

	if result.RowsAffected() == 0 {
		return domain.ErrNotificationNotFound
	}

	return nil
}

// MarkAllAsRead marks all notifications as read for a user
func (r *NotificationRepository) MarkAllAsRead(ctx context.Context, userID uuid.UUID) error {
	query := `
		UPDATE notifications
		SET read = TRUE
		WHERE user_id = $1 AND read = FALSE
	`

	_, err := r.db.Exec(ctx, query, userID)
	return err
}

// DeleteNotification deletes a notification
func (r *NotificationRepository) DeleteNotification(ctx context.Context, notificationID uuid.UUID, userID uuid.UUID) error {
	query := `
		DELETE FROM notifications
		WHERE id = $1 AND user_id = $2
	`

	result, err := r.db.Exec(ctx, query, notificationID, userID)
	if err != nil {
		return err
	}

	if result.RowsAffected() == 0 {
		return domain.ErrNotificationNotFound
	}

	return nil
}

// DeleteOldNotifications deletes notifications older than the specified duration
func (r *NotificationRepository) DeleteOldNotifications(ctx context.Context, olderThan time.Duration) error {
	query := `
		DELETE FROM notifications
		WHERE created_at < $1
	`

	cutoffTime := time.Now().Add(-olderThan)
	_, err := r.db.Exec(ctx, query, cutoffTime)
	return err
}

