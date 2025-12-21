package handlers

import (
	"github.com/arenamatch/playforge/internal/domain"
	"github.com/arenamatch/playforge/internal/services"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type RoomHandler struct {
	roomService *services.RoomService
	gameService *services.GameService
}

func NewRoomHandler(roomService *services.RoomService, gameService *services.GameService) *RoomHandler {
	return &RoomHandler{
		roomService: roomService,
		gameService: gameService,
	}
}

// CreateRoom handles room creation
// POST /api/v1/rooms/create
func (h *RoomHandler) CreateRoom(c *fiber.Ctx) error {
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

	var req domain.CreateRoomRequest
	if err = c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validate game type
	validGameTypes := map[string]bool{
		"tictactoe":    true,
		"connect4":     true,
		"rps":          true,
		"dotsandboxes": true,
	}
	if !validGameTypes[req.GameType] {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid game type",
		})
	}

	// Validate max players
	if req.MaxPlayers < 2 || req.MaxPlayers > 4 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Max players must be between 2 and 4",
		})
	}

	room, err := h.roomService.CreateRoom(c.Context(), userID, username, req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(domain.RoomResponse{
		Room:    room,
		Message: "Room created successfully",
	})
}

// GetRoom retrieves a room by ID
// GET /api/v1/rooms/:id
func (h *RoomHandler) GetRoom(c *fiber.Ctx) error {
	roomIDStr := c.Params("id")
	roomID, err := uuid.Parse(roomIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid room ID",
		})
	}

	room, err := h.roomService.GetRoom(c.Context(), roomID)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(room)
}

// JoinRoom handles joining a room
// POST /api/v1/rooms/:id/join
func (h *RoomHandler) JoinRoom(c *fiber.Ctx) error {
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

	roomIDStr := c.Params("id")
	roomID, err := uuid.Parse(roomIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid room ID",
		})
	}

	err = h.roomService.JoinRoom(c.Context(), roomID, userID, username)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	room, _ := h.roomService.GetRoom(c.Context(), roomID)

	return c.Status(fiber.StatusOK).JSON(domain.RoomResponse{
		Room:    room,
		Message: "Joined room successfully",
	})
}

// JoinRoomByCode handles joining a room via join code
// POST /api/v1/rooms/join
func (h *RoomHandler) JoinRoomByCode(c *fiber.Ctx) error {
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

	var req domain.JoinRoomRequest
	if err = c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if len(req.JoinCode) != 6 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Join code must be 6 characters",
		})
	}

	room, err := h.roomService.JoinRoomByCode(c.Context(), req.JoinCode, userID, username)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(domain.RoomResponse{
		Room:    room,
		Message: "Joined room successfully",
	})
}

// LeaveRoom handles leaving a room
// POST /api/v1/rooms/:id/leave
func (h *RoomHandler) LeaveRoom(c *fiber.Ctx) error {
	userIDStr := c.Locals("userID").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	roomIDStr := c.Params("id")
	roomID, err := uuid.Parse(roomIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid room ID",
		})
	}

	err = h.roomService.LeaveRoom(c.Context(), roomID, userID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Left room successfully",
	})
}

// SetReady sets participant ready status
// POST /api/v1/rooms/:id/ready
func (h *RoomHandler) SetReady(c *fiber.Ctx) error {
	userIDStr := c.Locals("userID").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	roomIDStr := c.Params("id")
	roomID, err := uuid.Parse(roomIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid room ID",
		})
	}

	var req struct {
		IsReady bool `json:"is_ready"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	err = h.roomService.SetParticipantReady(c.Context(), roomID, userID, req.IsReady)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	room, _ := h.roomService.GetRoom(c.Context(), roomID)

	return c.Status(fiber.StatusOK).JSON(domain.RoomResponse{
		Room:    room,
		Message: "Ready status updated",
	})
}

// StartGame starts the game
// POST /api/v1/rooms/:id/start
func (h *RoomHandler) StartGame(c *fiber.Ctx) error {
	userIDStr := c.Locals("userID").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	roomIDStr := c.Params("id")
	roomID, err := uuid.Parse(roomIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid room ID",
		})
	}

	room, err := h.roomService.StartGame(c.Context(), roomID, userID, h.gameService)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(domain.RoomResponse{
		Room:    room,
		Message: "Game started",
	})
}

