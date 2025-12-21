package websocket

import (
	"context"
	"encoding/json"
	"log"
	"strings"
	"time"

	"github.com/arenamatch/playforge/internal/services"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
	"github.com/google/uuid"
)

const (
	// Time allowed to write a message to the peer
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer
	pongWait = 60 * time.Second

	// Send pings to peer with this period (must be less than pongWait)
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer
	maxMessageSize = 512 * 1024 // 512 KB
)

// Handler handles WebSocket connections
type Handler struct {
	hub                *Hub
	authService        *services.AuthService
	gameService        *services.GameService
	roomService        *services.RoomService
	matchmakingService *services.MatchmakingService
}

// NewHandler creates a new WebSocket handler
func NewHandler(hub *Hub, authService *services.AuthService, gameService *services.GameService, roomService *services.RoomService, matchmakingService *services.MatchmakingService) *Handler {
	return &Handler{
		hub:                hub,
		authService:        authService,
		gameService:        gameService,
		roomService:        roomService,
		matchmakingService: matchmakingService,
	}
}

// HandleConnection handles WebSocket upgrade and client connection
func (h *Handler) HandleConnection(c *fiber.Ctx) error {
	// Extract JWT token from query param or Authorization header
	token := c.Query("token")
	if token == "" {
		authHeader := c.Get("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			token = strings.TrimPrefix(authHeader, "Bearer ")
		}
	}

	if token == "" {
		return fiber.NewError(fiber.StatusUnauthorized, "Missing authentication token")
	}

	// Validate token
	claims, err := h.authService.ValidateToken(token)
	if err != nil {
		return fiber.NewError(fiber.StatusUnauthorized, "Invalid token")
	}

	// Parse user ID
	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid user ID")
	}

	// Check if it's a websocket upgrade request
	if websocket.IsWebSocketUpgrade(c) {
		return websocket.New(func(conn *websocket.Conn) {
			// Create client
			client := &Client{
				ID:       uuid.New(),
				UserID:   userID,
				Username: claims.Username,
				Conn:     conn,
				Send:     make(chan []byte, 256),
			}

			// Register client with hub
			h.hub.register <- client

			// Start client goroutines
			go h.writePump(client)
			h.readPump(client) // Run readPump in current goroutine
		})(c)
	}

	return fiber.NewError(fiber.StatusBadRequest, "Expected WebSocket connection")
}

// readPump pumps messages from the WebSocket connection to the hub
func (h *Handler) readPump(client *Client) {
	defer func() {
		h.hub.unregister <- client
		client.Conn.Close()
	}()

	for {
		_, message, err := client.Conn.ReadMessage()
		if err != nil {
			log.Printf("WebSocket read error: %v", err)
			break
		}

		// Parse message
		var msg Message
		if err := json.Unmarshal(message, &msg); err != nil {
			log.Printf("Invalid message format: %v", err)
			h.sendError(client, "Invalid message format")
			continue
		}

		// Handle message based on type
		h.handleMessage(client, &msg)
	}
}

// writePump pumps messages from the hub to the WebSocket connection
func (h *Handler) writePump(client *Client) {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		client.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-client.Send:
			if !ok {
				// Hub closed the channel
				client.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := client.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
				return
			}

		case <-ticker.C:
			if err := client.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// handleMessage handles incoming messages from clients
func (h *Handler) handleMessage(client *Client, msg *Message) {
	switch msg.Type {
	case MessageTypePing:
		h.sendPong(client)

	case MessageTypeJoinGame:
		h.handleJoinGame(client, msg)

	case MessageTypeGameMove:
		h.handleGameMove(client, msg)

	case MessageTypeRoomJoined:
		h.handleRoomJoin(client, msg)

	case MessageTypeRoomLeft:
		h.handleRoomLeave(client, msg)

	case MessageTypeRoomParticipantReady:
		h.handleRoomReady(client, msg)

	default:
		log.Printf("Unknown message type: %s", msg.Type)
	}
}

// handleJoinGame adds a client to a game room
func (h *Handler) handleJoinGame(client *Client, msg *Message) {
	payload, ok := msg.Payload.(map[string]interface{})
	if !ok {
		h.sendError(client, "Invalid join game payload")
		return
	}

	gameIDStr, ok := payload["game_id"].(string)
	if !ok {
		h.sendError(client, "Missing game_id")
		return
	}

	gameID, err := uuid.Parse(gameIDStr)
	if err != nil {
		h.sendError(client, "Invalid game_id")
		return
	}

	// Add client to game room
	h.hub.AddClientToGame(client.ID, gameID)
	log.Printf("Client %s joined game %s", client.ID, gameID)

	// Send confirmation
	confirmMsg := Message{
		Type: MessageTypeGameJoined,
		Payload: map[string]string{
			"game_id": gameID.String(),
		},
		Timestamp: time.Now(),
	}

	if data, err := json.Marshal(confirmMsg); err == nil {
		select {
		case client.Send <- data:
		default:
		}
	}
}

// handleGameMove processes a game move from a client
func (h *Handler) handleGameMove(client *Client, msg *Message) {
	ctx := context.Background()
	
	payload, ok := msg.Payload.(map[string]interface{})
	if !ok {
		h.sendError(client, "Invalid game move payload")
		return
	}

	gameIDStr, ok := payload["game_id"].(string)
	if !ok {
		h.sendError(client, "Missing game_id")
		return
	}

	playerIDStr, ok := payload["player_id"].(string)
	if !ok {
		h.sendError(client, "Missing player_id")
		return
	}

	move, ok := payload["move"]
	if !ok {
		h.sendError(client, "Missing move")
		return
	}

	// Parse IDs
	gameID, err := uuid.Parse(gameIDStr)
	if err != nil {
		h.sendError(client, "Invalid game_id")
		return
	}

	playerID, err := uuid.Parse(playerIDStr)
	if err != nil {
		h.sendError(client, "Invalid player_id")
		return
	}

	// Verify player ID matches client
	if playerID != client.UserID {
		h.sendError(client, "Unauthorized: player_id doesn't match")
		return
	}

	log.Printf("Processing move from client %s (User: %s) for game %s: %v", client.ID, client.Username, gameID, move)

	// Make move
	g, err := h.gameService.MakeMove(ctx, gameID, playerID, move)
	if err != nil {
		log.Printf("Error making move: %v", err)
		h.sendError(client, err.Error())
		return
	}

	log.Printf("Move successful! New game status: %s", g.Status)

	// The move event will be broadcast via Redis pub/sub, 
	// so we don't need to broadcast here - it's handled by the game handler's Redis listener
}

// sendError sends an error message to a client
func (h *Handler) sendError(client *Client, message string) {
	msg := Message{
		Type: MessageTypeError,
		Payload: ErrorMessage{
			Code:    400,
			Message: message,
		},
		Timestamp: time.Now(),
	}

	if data, err := json.Marshal(msg); err == nil {
		select {
		case client.Send <- data:
		default:
		}
	}
}

// sendPong sends a pong message to a client
func (h *Handler) sendPong(client *Client) {
	msg := Message{
		Type:      MessageTypePong,
		Timestamp: time.Now(),
	}

	if data, err := json.Marshal(msg); err == nil {
		select {
		case client.Send <- data:
		default:
		}
	}
}

// handleRoomJoin handles joining a room via WebSocket
func (h *Handler) handleRoomJoin(client *Client, msg *Message) {
	ctx := context.Background()
	
	payload, ok := msg.Payload.(map[string]interface{})
	if !ok {
		h.sendError(client, "Invalid room join payload")
		return
	}

	// Try to get room by ID or join code
	var room interface{}
	var err error

	if roomIDStr, ok := payload["room_id"].(string); ok {
		roomID, parseErr := uuid.Parse(roomIDStr)
		if parseErr != nil {
			h.sendError(client, "Invalid room_id")
			return
		}
		room, err = h.roomService.GetRoom(ctx, roomID)
	} else if joinCode, ok := payload["join_code"].(string); ok {
		room, err = h.roomService.JoinRoomByCode(ctx, joinCode, client.UserID, client.Username)
	} else {
		h.sendError(client, "Missing room_id or join_code")
		return
	}

	if err != nil {
		h.sendError(client, err.Error())
		return
	}

	// Send confirmation
	confirmMsg := Message{
		Type:      MessageTypeRoomJoined,
		Payload:   room,
		Timestamp: time.Now(),
	}

	if data, err := json.Marshal(confirmMsg); err == nil {
		select {
		case client.Send <- data:
		default:
		}
	}
}

// handleRoomLeave handles leaving a room via WebSocket
func (h *Handler) handleRoomLeave(client *Client, msg *Message) {
	ctx := context.Background()
	
	payload, ok := msg.Payload.(map[string]interface{})
	if !ok {
		h.sendError(client, "Invalid room leave payload")
		return
	}

	roomIDStr, ok := payload["room_id"].(string)
	if !ok {
		h.sendError(client, "Missing room_id")
		return
	}

	roomID, err := uuid.Parse(roomIDStr)
	if err != nil {
		h.sendError(client, "Invalid room_id")
		return
	}

	err = h.roomService.LeaveRoom(ctx, roomID, client.UserID)
	if err != nil {
		h.sendError(client, err.Error())
		return
	}

	// Send confirmation
	confirmMsg := Message{
		Type: MessageTypeRoomLeft,
		Payload: map[string]string{
			"room_id": roomID.String(),
		},
		Timestamp: time.Now(),
	}

	if data, err := json.Marshal(confirmMsg); err == nil {
		select {
		case client.Send <- data:
		default:
		}
	}
}

// handleRoomReady handles ready status change via WebSocket
func (h *Handler) handleRoomReady(client *Client, msg *Message) {
	ctx := context.Background()
	
	payload, ok := msg.Payload.(map[string]interface{})
	if !ok {
		h.sendError(client, "Invalid ready payload")
		return
	}

	roomIDStr, ok := payload["room_id"].(string)
	if !ok {
		h.sendError(client, "Missing room_id")
		return
	}

	isReady, ok := payload["is_ready"].(bool)
	if !ok {
		h.sendError(client, "Missing is_ready")
		return
	}

	roomID, err := uuid.Parse(roomIDStr)
	if err != nil {
		h.sendError(client, "Invalid room_id")
		return
	}

	err = h.roomService.SetParticipantReady(ctx, roomID, client.UserID, isReady)
	if err != nil {
		h.sendError(client, err.Error())
		return
	}

	// Get updated room
	room, err := h.roomService.GetRoom(ctx, roomID)
	if err != nil {
		h.sendError(client, err.Error())
		return
	}

	// Send confirmation
	confirmMsg := Message{
		Type:      MessageTypeRoomUpdated,
		Payload:   room,
		Timestamp: time.Now(),
	}

	if data, err := json.Marshal(confirmMsg); err == nil {
		select {
		case client.Send <- data:
		default:
		}
	}
}

