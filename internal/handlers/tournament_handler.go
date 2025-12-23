package handlers

import (
	"errors"
	"fmt"
	"log"

	"github.com/arenamatch/playforge/internal/domain"
	"github.com/arenamatch/playforge/internal/services"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type TournamentHandler struct {
	tournamentService *services.TournamentService
}

func NewTournamentHandler(tournamentService *services.TournamentService) *TournamentHandler {
	return &TournamentHandler{
		tournamentService: tournamentService,
	}
}

// CreateTournament creates a new tournament
// POST /api/v1/tournaments/create
func (h *TournamentHandler) CreateTournament(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uuid.UUID)
	username, ok := c.Locals("username").(string)
	if !ok || username == "" {
		return fiber.NewError(fiber.StatusUnauthorized, "Username not found in token")
	}

	var req domain.CreateTournamentRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid request body")
	}

	tournament, err := h.tournamentService.CreateTournament(c.Context(), userID, username, req)
	if err != nil {
		// Log the actual error for debugging
		log.Printf("Failed to create tournament: %v", err)
		return fiber.NewError(fiber.StatusInternalServerError, fmt.Sprintf("Failed to create tournament: %v", err))
	}

	return c.Status(fiber.StatusCreated).JSON(domain.TournamentResponse{
		Tournament: tournament,
		Message:    "Tournament created successfully",
	})
}

// GetTournament retrieves a tournament by ID
// GET /api/v1/tournaments/:id
func (h *TournamentHandler) GetTournament(c *fiber.Ctx) error {
	tournamentID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid tournament ID")
	}

	tournament, err := h.tournamentService.GetTournament(c.Context(), tournamentID)
	if err != nil {
		if errors.Is(err, domain.ErrTournamentNotFound) {
			return fiber.NewError(fiber.StatusNotFound, "Tournament not found")
		}
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to get tournament")
	}

	return c.JSON(domain.TournamentResponse{
		Tournament: tournament,
	})
}

// ListTournaments retrieves all tournaments
// GET /api/v1/tournaments
func (h *TournamentHandler) ListTournaments(c *fiber.Ctx) error {
	// Optional status filter
	statusStr := c.Query("status")
	var status *domain.TournamentStatus
	if statusStr != "" {
		s := domain.TournamentStatus(statusStr)
		status = &s
	}

	// Default limit
	limit := 50
	if limitQuery := c.QueryInt("limit", 50); limitQuery > 0 && limitQuery <= 100 {
		limit = limitQuery
	}

	tournaments, err := h.tournamentService.ListTournaments(c.Context(), status, limit)
	if err != nil {
		log.Printf("Failed to list tournaments: %v", err)
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to list tournaments")
	}

	if tournaments == nil {
		tournaments = []domain.Tournament{}
	}

	return c.JSON(domain.TournamentListResponse{
		Tournaments: tournaments,
		Total:       len(tournaments),
	})
}

// JoinTournament allows a user to join a tournament
// POST /api/v1/tournaments/:id/join
func (h *TournamentHandler) JoinTournament(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uuid.UUID)

	tournamentID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid tournament ID")
	}

	// Parse request body for join code (optional for public tournaments)
	var req domain.JoinTournamentRequest
	_ = c.BodyParser(&req) // Don't fail if no body provided

	tournament, err := h.tournamentService.JoinTournament(c.Context(), tournamentID, userID, req.JoinCode)
	if err != nil {
		log.Printf("Failed to join tournament %s for user %s: %v", tournamentID, userID, err)
		if errors.Is(err, domain.ErrTournamentNotFound) {
			return fiber.NewError(fiber.StatusNotFound, "Tournament not found")
		}
		if errors.Is(err, domain.ErrTournamentFull) {
			return fiber.NewError(fiber.StatusConflict, "Tournament is full")
		}
		if errors.Is(err, domain.ErrTournamentAlreadyStarted) {
			return fiber.NewError(fiber.StatusConflict, "Tournament has already started")
		}
		if err.Error() == "invalid join code" {
			return fiber.NewError(fiber.StatusForbidden, "Invalid join code for private tournament")
		}
		return fiber.NewError(fiber.StatusInternalServerError, fmt.Sprintf("Failed to join tournament: %v", err))
	}

	return c.JSON(domain.TournamentResponse{
		Tournament: tournament,
		Message:    "Joined tournament successfully",
	})
}

// StartTournament starts the tournament and generates bracket
// POST /api/v1/tournaments/:id/start
func (h *TournamentHandler) StartTournament(c *fiber.Ctx) error {
	userID := c.Locals("userID").(uuid.UUID)

	tournamentID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid tournament ID")
	}

	tournament, err := h.tournamentService.StartTournament(c.Context(), tournamentID, userID)
	if err != nil {
		if errors.Is(err, domain.ErrTournamentNotFound) {
			return fiber.NewError(fiber.StatusNotFound, "Tournament not found")
		}
		if errors.Is(err, domain.ErrNotTournamentHost) {
			return fiber.NewError(fiber.StatusForbidden, "Only the tournament host can start the tournament")
		}
		if errors.Is(err, domain.ErrTournamentAlreadyStarted) {
			return fiber.NewError(fiber.StatusConflict, "Tournament has already started")
		}
		if errors.Is(err, domain.ErrTournamentNotReady) {
			return fiber.NewError(fiber.StatusConflict, "Tournament is not ready to start")
		}
		// Check if it's a "not full" error or power of 2 error
		errMsg := err.Error()
		if len(errMsg) > 0 && (errMsg[:10] == "tournament" || errMsg[:4] == "must") {
			return fiber.NewError(fiber.StatusConflict, errMsg)
		}
		return fiber.NewError(fiber.StatusInternalServerError, fmt.Sprintf("Failed to start tournament: %v", err))
	}

	return c.JSON(domain.TournamentResponse{
		Tournament: tournament,
		Message:    "Tournament started successfully",
	})
}

