package domain

import "errors"

var (
	ErrUserNotFound      = errors.New("user not found")
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrUserAlreadyExists = errors.New("user already exists")
	ErrInvalidToken      = errors.New("invalid token")
	ErrTokenExpired      = errors.New("token expired")
	ErrUnauthorized      = errors.New("unauthorized")
	
	// Tournament errors
	ErrTournamentNotFound       = errors.New("tournament not found")
	ErrTournamentFull           = errors.New("tournament is full")
	ErrTournamentAlreadyStarted = errors.New("tournament has already started")
	ErrTournamentNotReady       = errors.New("tournament is not ready to start")
	ErrNotTournamentHost        = errors.New("only the tournament host can perform this action")
	ErrTournamentMatchNotFound  = errors.New("tournament match not found")
	ErrInvalidBracket           = errors.New("invalid tournament bracket")
	
	// Invitation errors
	ErrInvitationNotFound     = errors.New("invitation not found")
	ErrInvitationExpired      = errors.New("invitation has expired")
	ErrInvitationAlreadyExists = errors.New("invitation already exists")
	ErrCannotInviteSelf       = errors.New("cannot invite yourself")
	ErrInvitationNotPending   = errors.New("invitation is not pending")
)


