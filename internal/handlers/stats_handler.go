package handlers

import (
	"github.com/arenamatch/playforge/internal/services"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type StatsHandler struct {
	statsService *services.StatsService
	authService  *services.AuthService
}

func NewStatsHandler(statsService *services.StatsService, authService *services.AuthService) *StatsHandler {
	return &StatsHandler{
		statsService: statsService,
		authService:  authService,
	}
}

// GetMyStats returns current user's stats across all game types
func (h *StatsHandler) GetMyStats(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)

	playerID, err := uuid.Parse(userID)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid user ID")
	}

	// For now, just get tictactoe stats
	// In the future, we can loop through all game types
	stats, err := h.statsService.GetPlayerStats(c.Context(), playerID, "tictactoe")
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to get stats")
	}

	return c.JSON(stats)
}

// GetStatsByGameType returns user's stats for a specific game type
func (h *StatsHandler) GetStatsByGameType(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	gameType := c.Params("game_type")

	playerID, err := uuid.Parse(userID)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid user ID")
	}

	stats, err := h.statsService.GetPlayerStats(c.Context(), playerID, gameType)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to get stats")
	}

	return c.JSON(stats)
}

