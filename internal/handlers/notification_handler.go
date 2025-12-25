package handlers

import (
	"strconv"

	"github.com/arenamatch/playforge/internal/domain"
	"github.com/arenamatch/playforge/internal/services"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type NotificationHandler struct {
	service *services.NotificationService
}

func NewNotificationHandler(service *services.NotificationService) *NotificationHandler {
	return &NotificationHandler{
		service: service,
	}
}

// GetNotifications retrieves notifications for the authenticated user
// GET /api/v1/notifications
func (h *NotificationHandler) GetNotifications(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	// Get limit from query parameter (default: 10)
	limitStr := c.Query("limit", "10")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 10
	}
	if limit > 50 {
		limit = 50 // Max 50 notifications
	}

	response, err := h.service.GetUserNotifications(c.Context(), userID, limit)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to retrieve notifications",
		})
	}

	return c.JSON(response)
}

// MarkAsRead marks a notification as read
// POST /api/v1/notifications/:id/read
func (h *NotificationHandler) MarkAsRead(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	notificationID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid notification ID",
		})
	}

	err = h.service.MarkAsRead(c.Context(), notificationID, userID)
	if err != nil {
		if err == domain.ErrNotificationNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "notification not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to mark notification as read",
		})
	}

	return c.JSON(fiber.Map{
		"message": "notification marked as read",
	})
}

// MarkAllAsRead marks all notifications as read for the authenticated user
// POST /api/v1/notifications/read-all
func (h *NotificationHandler) MarkAllAsRead(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	err = h.service.MarkAllAsRead(c.Context(), userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to mark all notifications as read",
		})
	}

	return c.JSON(fiber.Map{
		"message": "all notifications marked as read",
	})
}

// DeleteNotification deletes a notification
// DELETE /api/v1/notifications/:id
func (h *NotificationHandler) DeleteNotification(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	notificationID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid notification ID",
		})
	}

	err = h.service.DeleteNotification(c.Context(), notificationID, userID)
	if err != nil {
		if err == domain.ErrNotificationNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "notification not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to delete notification",
		})
	}

	return c.JSON(fiber.Map{
		"message": "notification deleted",
	})
}



