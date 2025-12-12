package websocket

import (
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
)

// Hub maintains the set of active clients and broadcasts messages
type Hub struct {
	// Registered clients
	clients map[uuid.UUID]*Client

	// Clients by game ID
	gameClients map[uuid.UUID]map[uuid.UUID]*Client

	// Register requests from clients
	register chan *Client

	// Unregister requests from clients
	unregister chan *Client

	// Broadcast message to all clients in a game
	broadcast chan *BroadcastMessage

	// Mutex for thread-safe operations
	mu sync.RWMutex
}

// BroadcastMessage represents a message to broadcast to a game
type BroadcastMessage struct {
	GameID  uuid.UUID
	Message []byte
	Exclude *uuid.UUID // Exclude this client from broadcast
}

// NewHub creates a new Hub instance
func NewHub() *Hub {
	return &Hub{
		clients:     make(map[uuid.UUID]*Client),
		gameClients: make(map[uuid.UUID]map[uuid.UUID]*Client),
		register:    make(chan *Client),
		unregister:  make(chan *Client),
		broadcast:   make(chan *BroadcastMessage, 256),
	}
}

// Run starts the hub's main loop
func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.registerClient(client)

		case client := <-h.unregister:
			h.unregisterClient(client)

		case message := <-h.broadcast:
			h.broadcastToGame(message)
		}
	}
}

func (h *Hub) registerClient(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	h.clients[client.ID] = client
	log.Printf("Client registered: %s (User: %s)", client.ID, client.Username)

	// Send connection confirmation
	msg := Message{
		Type: MessageTypeConnected,
		Payload: map[string]string{
			"client_id": client.ID.String(),
			"user_id":   client.UserID.String(),
			"username":  client.Username,
		},
		Timestamp: time.Now(),
	}

	if data, err := json.Marshal(msg); err == nil {
		select {
		case client.Send <- data:
		default:
			close(client.Send)
			delete(h.clients, client.ID)
		}
	}
}

func (h *Hub) unregisterClient(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if _, ok := h.clients[client.ID]; ok {
		// Remove from clients map
		delete(h.clients, client.ID)

		// Remove from game clients if in a game
		if client.GameID != nil {
			if gameClients, exists := h.gameClients[*client.GameID]; exists {
				delete(gameClients, client.ID)
				if len(gameClients) == 0 {
					delete(h.gameClients, *client.GameID)
				}
			}
		}

		close(client.Send)
		log.Printf("Client unregistered: %s (User: %s)", client.ID, client.Username)
	}
}

func (h *Hub) broadcastToGame(broadcast *BroadcastMessage) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	gameClients, exists := h.gameClients[broadcast.GameID]
	if !exists {
		return
	}

	for clientID, client := range gameClients {
		// Skip excluded client
		if broadcast.Exclude != nil && clientID == *broadcast.Exclude {
			continue
		}

		select {
		case client.Send <- broadcast.Message:
		default:
			// Client's send channel is full, close and remove
			close(client.Send)
			delete(h.clients, client.ID)
			delete(gameClients, clientID)
		}
	}
}

// AddClientToGame adds a client to a game room
func (h *Hub) AddClientToGame(clientID, gameID uuid.UUID) {
	h.mu.Lock()
	defer h.mu.Unlock()

	client, exists := h.clients[clientID]
	if !exists {
		return
	}

	// Remove from old game if any
	if client.GameID != nil {
		if gameClients, exists := h.gameClients[*client.GameID]; exists {
			delete(gameClients, clientID)
		}
	}

	// Add to new game
	client.GameID = &gameID
	if _, exists := h.gameClients[gameID]; !exists {
		h.gameClients[gameID] = make(map[uuid.UUID]*Client)
	}
	h.gameClients[gameID][clientID] = client

	log.Printf("Client %s added to game %s", clientID, gameID)
}

// RemoveClientFromGame removes a client from a game room
func (h *Hub) RemoveClientFromGame(clientID, gameID uuid.UUID) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if gameClients, exists := h.gameClients[gameID]; exists {
		delete(gameClients, clientID)
		if len(gameClients) == 0 {
			delete(h.gameClients, gameID)
		}
	}

	if client, exists := h.clients[clientID]; exists {
		client.GameID = nil
	}

	log.Printf("Client %s removed from game %s", clientID, gameID)
}

// GetClient returns a client by ID
func (h *Hub) GetClient(clientID uuid.UUID) (*Client, bool) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	client, exists := h.clients[clientID]
	return client, exists
}

// GetGameClients returns all clients in a game
func (h *Hub) GetGameClients(gameID uuid.UUID) []*Client {
	h.mu.RLock()
	defer h.mu.RUnlock()

	gameClients, exists := h.gameClients[gameID]
	if !exists {
		return nil
	}

	clients := make([]*Client, 0, len(gameClients))
	for _, client := range gameClients {
		clients = append(clients, client)
	}
	return clients
}

// BroadcastToGame sends a message to all clients in a game
func (h *Hub) BroadcastToGame(gameID uuid.UUID, message []byte, exclude *uuid.UUID) {
	h.broadcast <- &BroadcastMessage{
		GameID:  gameID,
		Message: message,
		Exclude: exclude,
	}
}

// SendToClient sends a message to a specific client
func (h *Hub) SendToClient(clientID uuid.UUID, message []byte) error {
	h.mu.RLock()
	defer h.mu.RUnlock()

	client, exists := h.clients[clientID]
	if !exists {
		return ErrClientNotFound
	}

	select {
	case client.Send <- message:
		return nil
	default:
		return ErrClientSendBufferFull
	}
}

// ClientCount returns the number of connected clients
func (h *Hub) ClientCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}

