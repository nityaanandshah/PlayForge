package domain

import (
	"time"

	"github.com/google/uuid"
)

// NotificationType represents the type of notification
type NotificationType string

const (
	NotificationTypeInvitationReceived NotificationType = "invitation_received" // You received a tournament invitation
	NotificationTypeTournamentStarted  NotificationType = "tournament_started"  // Tournament you're in has started
	NotificationTypePlayerJoined       NotificationType = "player_joined"       // Player joined tournament you're in
	NotificationTypeInvitationAccepted NotificationType = "invitation_accepted" // Your invitation was accepted
	NotificationTypeInvitationDeclined NotificationType = "invitation_declined" // Your invitation was declined
)

// Notification represents a user notification
type Notification struct {
	ID        uuid.UUID        `json:"id"`
	UserID    uuid.UUID        `json:"user_id"`
	Type      NotificationType `json:"type"`
	Title     string           `json:"title"`
	Message   string           `json:"message"`
	Data      map[string]interface{} `json:"data,omitempty"` // Additional context (tournament_id, invitation_id, etc.)
	Read      bool             `json:"read"`
	CreatedAt time.Time        `json:"created_at"`
}

// CreateNotificationRequest represents a request to create a notification
type CreateNotificationRequest struct {
	UserID  uuid.UUID              `json:"user_id" validate:"required"`
	Type    NotificationType       `json:"type" validate:"required"`
	Title   string                 `json:"title" validate:"required,min=1,max=200"`
	Message string                 `json:"message" validate:"required,min=1,max=500"`
	Data    map[string]interface{} `json:"data,omitempty"`
}

// NotificationResponse represents the response for notification actions
type NotificationResponse struct {
	Notification *Notification `json:"notification"`
	Message      string        `json:"message,omitempty"`
}

// NotificationListResponse represents the response for listing notifications
type NotificationListResponse struct {
	Notifications []Notification `json:"notifications"`
	Total         int            `json:"total"`
	Unread        int            `json:"unread"`
}


