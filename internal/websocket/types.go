package websocket

import (
	"time"

	"github.com/gofiber/websocket/v2"
	"github.com/google/uuid"
)

// MessageType defines the type of WebSocket message
type MessageType string

const (
	// Connection events
	MessageTypeConnected    MessageType = "connected"
	MessageTypeDisconnected MessageType = "disconnected"
	MessageTypeError        MessageType = "error"
	MessageTypePing         MessageType = "ping"
	MessageTypePong         MessageType = "pong"

	// Game events
	MessageTypeGameCreated MessageType = "game_created"
	MessageTypeGameJoined  MessageType = "game_joined"
	MessageTypeGameStarted MessageType = "game_started"
	MessageTypeGameMove    MessageType = "game_move"
	MessageTypeGameOver    MessageType = "game_over"
	MessageTypeGameState   MessageType = "game_state"

	// Player events
	MessageTypePlayerJoined MessageType = "player_joined"
	MessageTypePlayerLeft   MessageType = "player_left"

	// Game room events
	MessageTypeJoinGame MessageType = "join_game"

	// Matchmaking events
	MessageTypeMatchmakingQueued   MessageType = "matchmaking_queued"
	MessageTypeMatchmakingMatched  MessageType = "matchmaking_matched"
	MessageTypeMatchmakingCancelled MessageType = "matchmaking_cancelled"
	MessageTypeMatchmakingTimeout  MessageType = "matchmaking_timeout"

	// Room events
	MessageTypeRoomCreated       MessageType = "room_created"
	MessageTypeRoomJoined        MessageType = "room_joined"
	MessageTypeRoomLeft          MessageType = "room_left"
	MessageTypeRoomUpdated       MessageType = "room_updated"
	MessageTypeRoomClosed        MessageType = "room_closed"
	MessageTypeRoomParticipantReady MessageType = "room_participant_ready"
)

// Client represents a connected WebSocket client
type Client struct {
	ID       uuid.UUID
	UserID   uuid.UUID
	Username string
	Conn     *websocket.Conn
	Send     chan []byte
	GameID   *uuid.UUID // Current game the client is in
}

// Message represents a WebSocket message
type Message struct {
	Type      MessageType `json:"type"`
	Payload   interface{} `json:"payload,omitempty"`
	Timestamp time.Time   `json:"timestamp"`
}

// GameMoveMessage represents a player move
type GameMoveMessage struct {
	GameID   string      `json:"game_id"`
	PlayerID string      `json:"player_id"`
	Move     interface{} `json:"move"`
}

// JoinGameMessage represents a request to join a game room
type JoinGameMessage struct {
	GameID string `json:"game_id"`
}

// GameStateMessage represents the current game state
type GameStateMessage struct {
	GameID       string      `json:"game_id"`
	GameType     string      `json:"game_type"`
	State        interface{} `json:"state"`
	CurrentTurn  string      `json:"current_turn"`
	Status       string      `json:"status"`
	Player1ID    string      `json:"player1_id"`
	Player2ID    string      `json:"player2_id"`
	Player1Name  string      `json:"player1_name"`
	Player2Name  string      `json:"player2_name"`
	WinnerID     *string     `json:"winner_id,omitempty"`
}

// ErrorMessage represents an error message
type ErrorMessage struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

// MatchmakingQueueMessage represents a matchmaking queue request
type MatchmakingQueueMessage struct {
	GameType string `json:"game_type"`
}

// MatchmakingCancelMessage represents a matchmaking cancel request
type MatchmakingCancelMessage struct {
	QueueEntryID string `json:"queue_entry_id"`
}

// RoomJoinMessage represents a room join request
type RoomJoinMessage struct {
	RoomID   string `json:"room_id,omitempty"`
	JoinCode string `json:"join_code,omitempty"`
}

// RoomLeaveMessage represents a room leave request
type RoomLeaveMessage struct {
	RoomID string `json:"room_id"`
}

// RoomReadyMessage represents a player ready status
type RoomReadyMessage struct {
	RoomID  string `json:"room_id"`
	IsReady bool   `json:"is_ready"`
}

