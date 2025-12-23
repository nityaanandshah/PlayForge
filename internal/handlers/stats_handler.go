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
	userID := c.Locals("userID").(uuid.UUID)

	// Get aggregated stats across all game types
	aggregatedStats, err := h.statsService.GetAggregatedStats(c.Context(), userID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to get stats")
	}

	return c.JSON(aggregatedStats)
}

// GetStatsByGameType returns user's stats for a specific game type
func (h *StatsHandler) GetStatsByGameType(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uuid.UUID)
	gameType := c.Params("game_type")

	stats, err := h.statsService.GetPlayerStats(c.Context(), userID, gameType)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to get stats")
	}

	return c.JSON(stats)
}

// GetLeaderboard returns the leaderboard for a game type or globally
func (h *StatsHandler) GetLeaderboard(c *fiber.Ctx) error {
	gameType := c.Query("game_type", "all")
	limit := c.QueryInt("limit", 50)

	leaderboard, err := h.statsService.GetLeaderboard(c.Context(), gameType, limit)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to get leaderboard")
	}

	return c.JSON(fiber.Map{
		"game_type": gameType,
		"entries":   leaderboard,
	})
}

// GetMyMatchHistory returns current user's match history
func (h *StatsHandler) GetMyMatchHistory(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uuid.UUID)
	gameType := c.Query("game_type", "all")
	limit := c.QueryInt("limit", 50)

	history, err := h.statsService.GetMatchHistory(c.Context(), userID, gameType, limit)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to get match history")
	}

	return c.JSON(fiber.Map{
		"game_type": gameType,
		"matches":   history,
	})
}

