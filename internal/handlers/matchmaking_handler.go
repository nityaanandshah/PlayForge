package handlers

import (
	"github.com/arenamatch/playforge/internal/domain"
	"github.com/arenamatch/playforge/internal/services"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type MatchmakingHandler struct {
	matchmakingService *services.MatchmakingService
}

func NewMatchmakingHandler(matchmakingService *services.MatchmakingService) *MatchmakingHandler {
	return &MatchmakingHandler{
		matchmakingService: matchmakingService,
	}
}

// JoinQueue handles joining the matchmaking queue
// POST /api/v1/matchmaking/queue
func (h *MatchmakingHandler) JoinQueue(c *fiber.Ctx) error {
	// Get user from context (set by auth middleware)
	userIDStr := c.Locals("userID").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}
	
	username, ok := c.Locals("username").(string)
	if !ok {
		username = "Unknown"
	}

	// Parse request
	var req domain.MatchmakingRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validate game type
	validGameTypes := map[string]bool{
		"tictactoe":     true,
		"connect4":      true,
		"rps":           true,
		"dotsandboxes":  true,
	}
	if !validGameTypes[req.GameType] {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid game type",
		})
	}

	// Get user rating (TODO: fetch from database, for now use default)
	rating := 1200

	// Join queue
	entry, err := h.matchmakingService.JoinQueue(c.Context(), userID, username, req.GameType, rating)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(domain.MatchmakingResponse{
		QueueEntry: entry,
		Message:    "Successfully joined matchmaking queue",
	})
}

// LeaveQueue handles leaving the matchmaking queue
// DELETE /api/v1/matchmaking/queue
func (h *MatchmakingHandler) LeaveQueue(c *fiber.Ctx) error {
	userIDStr := c.Locals("userID").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	err = h.matchmakingService.LeaveQueue(c.Context(), userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Successfully left matchmaking queue",
	})
}

// GetQueueStatus returns the user's current queue status
// GET /api/v1/matchmaking/status
func (h *MatchmakingHandler) GetQueueStatus(c *fiber.Ctx) error {
	userIDStr := c.Locals("userID").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	entry, err := h.matchmakingService.GetUserQueueStatus(c.Context(), userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	if entry == nil {
		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"in_queue": false,
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"in_queue":    true,
		"queue_entry": entry,
	})
}

