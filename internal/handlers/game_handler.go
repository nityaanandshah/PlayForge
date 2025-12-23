package handlers

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/arenamatch/playforge/internal/game"
	"github.com/arenamatch/playforge/internal/services"
	ws "github.com/arenamatch/playforge/internal/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type GameHandler struct {
	gameService *services.GameService
	hub         *ws.Hub
}

func NewGameHandler(gameService *services.GameService, hub *ws.Hub) *GameHandler {
	handler := &GameHandler{
		gameService: gameService,
		hub:         hub,
	}
	// Start Redis event listener
	go handler.listenToGameEvents()
	return handler
}

// listenToGameEvents subscribes to all game events via Redis pub/sub pattern
func (h *GameHandler) listenToGameEvents() {
	ctx := context.Background()
	pubsub := h.gameService.SubscribeToGamePattern(ctx, "game:*")
	defer pubsub.Close()

	ch := pubsub.Channel()
	log.Println("Started listening to game events...")

	for msg := range ch {
		h.handleRedisEvent(msg.Payload)
	}
}

// handleRedisEvent processes a Redis pub/sub event and forwards to WebSocket clients
func (h *GameHandler) handleRedisEvent(payload string) {
	var eventData map[string]interface{}
	if err := json.Unmarshal([]byte(payload), &eventData); err != nil {
		log.Printf("Error unmarshaling Redis event: %v", err)
		return
	}

	event, _ := eventData["event"].(string)
	gameIDStr, _ := eventData["game_id"].(string)
	gameID, err := uuid.Parse(gameIDStr)
	if err != nil {
		log.Printf("Invalid game ID in event: %s", gameIDStr)
		return
	}

	log.Printf("Received game event: %s for game %s", event, gameID)

	switch event {
	case "game_started":
		h.handleGameStartedEvent(gameID, eventData)
	case "game_move":
		h.handleGameMoveEvent(gameID, eventData)
	}
}

// handleGameStartedEvent broadcasts game start to all players
func (h *GameHandler) handleGameStartedEvent(gameID uuid.UUID, eventData map[string]interface{}) {
	payloadData, ok := eventData["payload"].(map[string]interface{})
	if !ok {
		log.Printf("Invalid payload in game_started event")
		return
	}

	// Create WebSocket message
	wsMsg := ws.Message{
		Type:      ws.MessageTypeGameState,
		Payload:   payloadData,
		Timestamp: time.Now(),
	}

	data, err := json.Marshal(wsMsg)
	if err != nil {
		log.Printf("Error marshaling game_started message: %v", err)
		return
	}

	// Broadcast to all players in the game
	h.hub.BroadcastToGame(gameID, data, nil)
	log.Printf("Broadcasted game_started event to game %s", gameID)
}

// handleGameMoveEvent broadcasts game moves to all players
func (h *GameHandler) handleGameMoveEvent(gameID uuid.UUID, eventData map[string]interface{}) {
	payloadData, ok := eventData["payload"].(map[string]interface{})
	if !ok {
		log.Printf("Invalid payload in game_move event")
		return
	}

	// Create WebSocket message
	wsMsg := ws.Message{
		Type:      ws.MessageTypeGameState,
		Payload:   payloadData,
		Timestamp: time.Now(),
	}

	data, err := json.Marshal(wsMsg)
	if err != nil {
		log.Printf("Error marshaling game_move message: %v", err)
		return
	}

	// Broadcast to all players in the game
	h.hub.BroadcastToGame(gameID, data, nil)
}

type CreateGameRequest struct {
	GameType string `json:"game_type"`
}

type JoinGameRequest struct {
	GameID string `json:"game_id"`
}

type MakeMoveRequest struct {
	GameID string      `json:"game_id"`
	Move   interface{} `json:"move"`
}

// CreateGame creates a new game
func (h *GameHandler) CreateGame(c *fiber.Ctx) error {
	// Get user from context (set by auth middleware)
	userID := c.Locals("userID").(uuid.UUID)
	username := c.Locals("username").(string)

	var req CreateGameRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid request body")
	}

	// Parse game type
	gameType := game.GameType(req.GameType)

	// Create game
	g, err := h.gameService.CreateGame(c.Context(), gameType, userID, username)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	return c.Status(fiber.StatusCreated).JSON(g)
}

// JoinGame allows a player to join a game
func (h *GameHandler) JoinGame(c *fiber.Ctx) error {
	// Get user from context
	userID := c.Locals("userID").(uuid.UUID)
	username := c.Locals("username").(string)

	var req JoinGameRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid request body")
	}

	// Parse game ID
	gameID, err := uuid.Parse(req.GameID)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid game ID")
	}

	// Join game
	g, err := h.gameService.JoinGame(c.Context(), gameID, userID, username)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	return c.JSON(g)
}

// GetGame retrieves a game by ID
func (h *GameHandler) GetGame(c *fiber.Ctx) error {
	gameID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid game ID")
	}

	g, err := h.gameService.GetGame(c.Context(), gameID)
	if err != nil {
		return fiber.NewError(fiber.StatusNotFound, "Game not found")
	}

	return c.JSON(g)
}

// HandleGameMessage processes WebSocket game messages
func (h *GameHandler) HandleGameMessage(ctx context.Context, client *ws.Client, msg *ws.Message) error {
	switch msg.Type {
	case ws.MessageTypeGameMove:
		return h.handleGameMove(ctx, client, msg)
	default:
		return nil
	}
}

func (h *GameHandler) handleGameMove(ctx context.Context, client *ws.Client, msg *ws.Message) error {
	// Parse move message
	var moveMsg ws.GameMoveMessage
	msgData, err := json.Marshal(msg.Payload)
	if err != nil {
		return err
	}

	if err := json.Unmarshal(msgData, &moveMsg); err != nil {
		return err
	}

	// Parse game ID and player ID
	gameID, err := uuid.Parse(moveMsg.GameID)
	if err != nil {
		return err
	}

	playerID, err := uuid.Parse(moveMsg.PlayerID)
	if err != nil {
		return err
	}

	// Verify player ID matches client
	if playerID != client.UserID {
		return ws.ErrUnauthorized
	}

	// Make move
	g, err := h.gameService.MakeMove(ctx, gameID, playerID, moveMsg.Move)
	if err != nil {
		return err
	}

	// Broadcast game state to all players
	stateMsg := ws.Message{
		Type: ws.MessageTypeGameState,
		Payload: ws.GameStateMessage{
			GameID:      g.ID.String(),
			GameType:    string(g.Type),
			State:       g.State.GetState(),
			CurrentTurn: g.CurrentTurn.String(),
			Status:      string(g.Status),
			Player1ID:   g.Player1ID.String(),
			Player2ID:   g.Player2ID.String(),
			Player1Name: g.Player1Name,
			Player2Name: g.Player2Name,
			WinnerID:    uuidToStringPtr(g.WinnerID),
		},
	}

	data, _ := json.Marshal(stateMsg)
	h.hub.BroadcastToGame(gameID, data, nil)

	return nil
}

func uuidToStringPtr(id *uuid.UUID) *string {
	if id == nil {
		return nil
	}
	s := id.String()
	return &s
}

