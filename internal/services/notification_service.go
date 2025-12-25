package services

import (
	"context"
	"fmt"
	"time"

	"github.com/arenamatch/playforge/internal/domain"
	"github.com/arenamatch/playforge/internal/repository"
	"github.com/google/uuid"
)

type NotificationService struct {
	repo *repository.NotificationRepository
}

func NewNotificationService(repo *repository.NotificationRepository) *NotificationService {
	return &NotificationService{
		repo: repo,
	}
}

// SendNotification creates and sends a notification to a user
func (s *NotificationService) SendNotification(ctx context.Context, req *domain.CreateNotificationRequest) (*domain.Notification, error) {
	return s.repo.CreateNotification(ctx, req)
}

// GetUserNotifications retrieves recent notifications for a user
func (s *NotificationService) GetUserNotifications(ctx context.Context, userID uuid.UUID, limit int) (*domain.NotificationListResponse, error) {
	notifications, err := s.repo.GetUserNotifications(ctx, userID, limit)
	if err != nil {
		return nil, err
	}

	unreadCount, err := s.repo.GetUnreadCount(ctx, userID)
	if err != nil {
		return nil, err
	}

	return &domain.NotificationListResponse{
		Notifications: notifications,
		Total:         len(notifications),
		Unread:        unreadCount,
	}, nil
}

// MarkAsRead marks a notification as read
func (s *NotificationService) MarkAsRead(ctx context.Context, notificationID uuid.UUID, userID uuid.UUID) error {
	return s.repo.MarkAsRead(ctx, notificationID, userID)
}

// MarkAllAsRead marks all notifications as read for a user
func (s *NotificationService) MarkAllAsRead(ctx context.Context, userID uuid.UUID) error {
	return s.repo.MarkAllAsRead(ctx, userID)
}

// DeleteNotification deletes a notification
func (s *NotificationService) DeleteNotification(ctx context.Context, notificationID uuid.UUID, userID uuid.UUID) error {
	return s.repo.DeleteNotification(ctx, notificationID, userID)
}

// Helper methods for creating specific notification types

// NotifyInvitationReceived sends a notification when a user receives a tournament invitation
func (s *NotificationService) NotifyInvitationReceived(ctx context.Context, inviteeID uuid.UUID, inviterName string, tournamentName string, tournamentID uuid.UUID, invitationID uuid.UUID) error {
	req := &domain.CreateNotificationRequest{
		UserID:  inviteeID,
		Type:    domain.NotificationTypeInvitationReceived,
		Title:   "Tournament Invitation",
		Message: fmt.Sprintf("%s invited you to '%s'", inviterName, tournamentName),
		Data: map[string]interface{}{
			"tournament_id":  tournamentID.String(),
			"invitation_id":  invitationID.String(),
			"inviter_name":   inviterName,
			"tournament_name": tournamentName,
		},
	}

	_, err := s.repo.CreateNotification(ctx, req)
	return err
}

// NotifyTournamentStarted sends notifications to all participants when a tournament starts
func (s *NotificationService) NotifyTournamentStarted(ctx context.Context, participantIDs []uuid.UUID, tournamentName string, tournamentID uuid.UUID) error {
	for _, participantID := range participantIDs {
		req := &domain.CreateNotificationRequest{
			UserID:  participantID,
			Type:    domain.NotificationTypeTournamentStarted,
			Title:   "Tournament Started",
			Message: fmt.Sprintf("'%s' has started! Round 1 is ready.", tournamentName),
			Data: map[string]interface{}{
				"tournament_id":   tournamentID.String(),
				"tournament_name": tournamentName,
			},
		}

		_, err := s.repo.CreateNotification(ctx, req)
		if err != nil {
			// Log error but continue notifying other participants
			continue
		}
	}

	return nil
}

// NotifyPlayerJoined sends notifications to all participants when a new player joins
func (s *NotificationService) NotifyPlayerJoined(ctx context.Context, participantIDs []uuid.UUID, newPlayerName string, tournamentName string, tournamentID uuid.UUID, currentCount int, maxCount int) error {
	for _, participantID := range participantIDs {
		req := &domain.CreateNotificationRequest{
			UserID:  participantID,
			Type:    domain.NotificationTypePlayerJoined,
			Title:   "Player Joined Tournament",
			Message: fmt.Sprintf("%s joined '%s' (%d/%d players)", newPlayerName, tournamentName, currentCount, maxCount),
			Data: map[string]interface{}{
				"tournament_id":    tournamentID.String(),
				"tournament_name":  tournamentName,
				"player_name":      newPlayerName,
				"current_count":    currentCount,
				"max_count":        maxCount,
			},
		}

		_, err := s.repo.CreateNotification(ctx, req)
		if err != nil {
			// Log error but continue notifying other participants
			continue
		}
	}

	return nil
}

// NotifyInvitationAccepted sends a notification when someone accepts your invitation
func (s *NotificationService) NotifyInvitationAccepted(ctx context.Context, inviterID uuid.UUID, inviteeName string, tournamentName string, tournamentID uuid.UUID) error {
	req := &domain.CreateNotificationRequest{
		UserID:  inviterID,
		Type:    domain.NotificationTypeInvitationAccepted,
		Title:   "Invitation Accepted",
		Message: fmt.Sprintf("%s accepted your invitation to '%s'", inviteeName, tournamentName),
		Data: map[string]interface{}{
			"tournament_id":   tournamentID.String(),
			"tournament_name": tournamentName,
			"invitee_name":    inviteeName,
		},
	}

	_, err := s.repo.CreateNotification(ctx, req)
	return err
}

// NotifyInvitationDeclined sends a notification when someone declines your invitation
func (s *NotificationService) NotifyInvitationDeclined(ctx context.Context, inviterID uuid.UUID, inviteeName string, tournamentName string, tournamentID uuid.UUID) error {
	req := &domain.CreateNotificationRequest{
		UserID:  inviterID,
		Type:    domain.NotificationTypeInvitationDeclined,
		Title:   "Invitation Declined",
		Message: fmt.Sprintf("%s declined your invitation to '%s'", inviteeName, tournamentName),
		Data: map[string]interface{}{
			"tournament_id":   tournamentID.String(),
			"tournament_name": tournamentName,
			"invitee_name":    inviteeName,
		},
	}

	_, err := s.repo.CreateNotification(ctx, req)
	return err
}

// CleanupOldNotifications removes notifications older than 30 days
func (s *NotificationService) CleanupOldNotifications(ctx context.Context) error {
	return s.repo.DeleteOldNotifications(ctx, 30*24*time.Hour)
}



