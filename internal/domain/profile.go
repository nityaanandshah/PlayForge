package domain

import "github.com/google/uuid"

// UpdateProfileRequest represents a profile update request
type UpdateProfileRequest struct {
	Username string `json:"username" validate:"omitempty,min=3,max=20"`
}

// ChangePasswordRequest represents a password change request
type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" validate:"required"`
	NewPassword     string `json:"new_password" validate:"required,min=8"`
}

// PublicProfile represents a user's public profile
type PublicProfile struct {
	UserID    uuid.UUID `json:"user_id"`
	Username  string    `json:"username"`
	EloRating int       `json:"elo_rating"`
	// Stats will be included from stats service
}





