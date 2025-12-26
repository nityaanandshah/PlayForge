package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/arenamatch/playforge/internal/game"
	"github.com/arenamatch/playforge/internal/services"
	ws "github.com/arenamatch/playforge/internal/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type GameHandler struct {
	gameService       *services.GameService
	tournamentService *services.TournamentService
	hub               *ws.Hub
}

func NewGameHandler(gameService *services.GameService, tournamentService *services.TournamentService, hub *ws.Hub) *GameHandler {
	handler := &GameHandler{
		gameService:       gameService,
		tournamentService: tournamentService,
		hub:               hub,
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

type SpectatorJoinRequest struct {
	GameID string `json:"game_id"`
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

// GetGame retrieves a game by ID (creates it on-demand if it's a tournament match)
func (h *GameHandler) GetGame(c *fiber.Ctx) error {
	gameID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid game ID")
	}

	g, err := h.gameService.GetGame(c.Context(), gameID)
	if err != nil {
		log.Printf("Game %s not found (error: %v), attempting to create tournament game...", gameID, err)
		
		// Try to create this tournament game on-demand
		if h.tournamentService != nil {
			// Get all active tournaments and search for this match_id
			tournaments, err := h.tournamentService.ListTournaments(c.Context(), nil, 100)
			log.Printf("Found %d tournaments to search for match_id %s", len(tournaments), gameID)
			if err == nil {
				for _, tournament := range tournaments {
					log.Printf("Checking tournament %s (status: %s, has bracket: %v)", tournament.ID, tournament.Status, tournament.BracketData != nil)
					if tournament.BracketData != nil {
						// Search through all rounds and matches
						for roundIdx, round := range tournament.BracketData.Rounds {
							for matchIdx, match := range round.Matches {
								log.Printf("  Round %d, Match %d: match_id=%v", roundIdx+1, matchIdx+1, match.MatchID)
								if match.MatchID != nil && *match.MatchID == gameID {
									// Found it! This game belongs to this tournament
									log.Printf("✓ Found match_id %s in tournament %s, creating game now...", gameID, tournament.ID)
									
									// Create games for this tournament
									err := h.tournamentService.CreateGamesForNextRound(c.Context(), tournament.ID)
									if err != nil {
										log.Printf("ERROR creating tournament games: %v", err)
										return fiber.NewError(fiber.StatusInternalServerError, fmt.Sprintf("Failed to create game: %v", err))
									}
									
									// Try fetching the game again
									g, err = h.gameService.GetGame(c.Context(), gameID)
									if err == nil {
										log.Printf("✓ Successfully created and fetched game %s", gameID)
										return c.JSON(g)
									} else {
										log.Printf("ERROR: Game %s still not found after creation: %v", gameID, err)
										return fiber.NewError(fiber.StatusInternalServerError, "Game created but could not be retrieved")
									}
								}
							}
						}
					}
				}
			} else {
				log.Printf("ERROR listing tournaments: %v", err)
			}
		}
		
		log.Printf("Game %s not found and could not be created", gameID)
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

	// Convert spectators to interface slice
	spectators := make([]interface{}, len(g.Spectators))
	for i, spec := range g.Spectators {
		spectators[i] = map[string]interface{}{
			"user_id":   spec.UserID.String(),
			"username":  spec.Username,
			"joined_at": spec.JoinedAt,
		}
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
			Spectators:  spectators,
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

// JoinAsSpectator allows a user to join a game as a spectator
func (h *GameHandler) JoinAsSpectator(c *fiber.Ctx) error {
	// Get user from context
	userID := c.Locals("userID").(uuid.UUID)
	username := c.Locals("username").(string)

	// Parse game ID from URL params
	gameID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid game ID")
	}

	// Add spectator
	g, err := h.gameService.AddSpectator(c.Context(), gameID, userID, username)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	// Broadcast spectator joined event via WebSocket
	spectatorMsg := ws.Message{
		Type: ws.MessageTypeSpectatorJoined,
		Payload: map[string]interface{}{
			"game_id": gameID.String(),
			"spectator": map[string]interface{}{
				"user_id":  userID.String(),
				"username": username,
			},
			"count": len(g.Spectators),
		},
		Timestamp: time.Now(),
	}

	data, _ := json.Marshal(spectatorMsg)
	h.hub.BroadcastToGame(gameID, data, nil)

	return c.JSON(fiber.Map{
		"message":    "Joined as spectator",
		"game":       g,
		"spectators": g.Spectators,
	})
}

// LeaveAsSpectator allows a user to stop spectating a game
func (h *GameHandler) LeaveAsSpectator(c *fiber.Ctx) error {
	// Get user from context
	userID := c.Locals("userID").(uuid.UUID)

	// Parse game ID from URL params
	gameID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid game ID")
	}

	// Remove spectator
	g, err := h.gameService.RemoveSpectator(c.Context(), gameID, userID)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	// Broadcast spectator left event via WebSocket
	spectatorMsg := ws.Message{
		Type: ws.MessageTypeSpectatorLeft,
		Payload: map[string]interface{}{
			"game_id": gameID.String(),
			"user_id": userID.String(),
			"count":   len(g.Spectators),
		},
		Timestamp: time.Now(),
	}

	data, _ := json.Marshal(spectatorMsg)
	h.hub.BroadcastToGame(gameID, data, nil)

	return c.JSON(fiber.Map{
		"message": "Left as spectator",
		"count":   len(g.Spectators),
	})
}

// GetSpectators returns the list of spectators for a game
func (h *GameHandler) GetSpectators(c *fiber.Ctx) error {
	// Parse game ID from URL params
	gameID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid game ID")
	}

	// Get spectators
	spectators, err := h.gameService.GetSpectators(c.Context(), gameID)
	if err != nil {
		return fiber.NewError(fiber.StatusNotFound, "Game not found")
	}

	return c.JSON(fiber.Map{
		"spectators": spectators,
		"count":      len(spectators),
	})
}

