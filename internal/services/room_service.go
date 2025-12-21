package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/arenamatch/playforge/internal/domain"
	"github.com/arenamatch/playforge/internal/game"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

const (
	roomKeyPrefix     = "room:"           // room:{room_id}
	roomCodeKeyPrefix = "room:code:"      // room:code:{join_code}
	roomTTL           = 2 * time.Hour     // Rooms expire after 2 hours
)

type RoomService struct {
	redisClient *redis.Client
}

func NewRoomService(redisClient *redis.Client) *RoomService {
	return &RoomService{
		redisClient: redisClient,
	}
}

// CreateRoom creates a new game room
func (s *RoomService) CreateRoom(ctx context.Context, hostID uuid.UUID, hostUsername string, req domain.CreateRoomRequest) (*domain.Room, error) {
	room := &domain.Room{
		ID:         uuid.New(),
		Type:       req.Type,
		Status:     domain.RoomStatusWaiting,
		GameType:   req.GameType,
		JoinCode:   GenerateJoinCode(),
		HostID:     hostID,
		MaxPlayers: req.MaxPlayers,
		Participants: []domain.Participant{
			{
				UserID:   hostID,
				Username: hostUsername,
				Role:     domain.ParticipantRoleHost,
				IsReady:  false,
				JoinedAt: time.Now(),
			},
		},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		ExpiresAt: time.Now().Add(roomTTL),
	}

	// Save room to Redis
	err := s.saveRoom(ctx, room)
	if err != nil {
		return nil, err
	}

	// Publish room created event
	s.publishRoomEvent(ctx, "room_created", room)

	return room, nil
}

// GetRoom retrieves a room by ID
func (s *RoomService) GetRoom(ctx context.Context, roomID uuid.UUID) (*domain.Room, error) {
	roomJSON, err := s.redisClient.Get(ctx, roomKey(roomID)).Result()
	if err == redis.Nil {
		return nil, fmt.Errorf("room not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get room: %w", err)
	}

	var room domain.Room
	if err := json.Unmarshal([]byte(roomJSON), &room); err != nil {
		return nil, fmt.Errorf("failed to unmarshal room: %w", err)
	}

	return &room, nil
}

// GetRoomByCode retrieves a room by join code
func (s *RoomService) GetRoomByCode(ctx context.Context, joinCode string) (*domain.Room, error) {
	roomIDStr, err := s.redisClient.Get(ctx, roomCodeKey(joinCode)).Result()
	if err == redis.Nil {
		return nil, fmt.Errorf("room not found with code: %s", joinCode)
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get room by code: %w", err)
	}

	roomID := uuid.MustParse(roomIDStr)
	return s.GetRoom(ctx, roomID)
}

// JoinRoom adds a player to a room
func (s *RoomService) JoinRoom(ctx context.Context, roomID uuid.UUID, userID uuid.UUID, username string) error {
	room, err := s.GetRoom(ctx, roomID)
	if err != nil {
		return err
	}

	// Check if room is closed or complete
	if room.Status == domain.RoomStatusClosed || room.Status == domain.RoomStatusComplete {
		return fmt.Errorf("room is closed")
	}

	// Check if user is already in room
	for _, p := range room.Participants {
		if p.UserID == userID {
			return fmt.Errorf("user already in room")
		}
	}

	// Check if room is full
	if len(room.Participants) >= room.MaxPlayers {
		return fmt.Errorf("room is full")
	}

	// Add participant
	participant := domain.Participant{
		UserID:   userID,
		Username: username,
		Role:     domain.ParticipantRolePlayer,
		IsReady:  false,
		JoinedAt: time.Now(),
	}
	room.Participants = append(room.Participants, participant)
	room.UpdatedAt = time.Now()

	// If room is full, mark as ready
	if len(room.Participants) == room.MaxPlayers {
		room.Status = domain.RoomStatusReady
	}

	// Save updated room
	err = s.saveRoom(ctx, room)
	if err != nil {
		return err
	}

	// Publish room joined event
	s.publishRoomEvent(ctx, "room_joined", room)

	return nil
}

// JoinRoomByCode joins a room using a join code
func (s *RoomService) JoinRoomByCode(ctx context.Context, joinCode string, userID uuid.UUID, username string) (*domain.Room, error) {
	room, err := s.GetRoomByCode(ctx, joinCode)
	if err != nil {
		return nil, err
	}

	err = s.JoinRoom(ctx, room.ID, userID, username)
	if err != nil {
		return nil, err
	}

	return s.GetRoom(ctx, room.ID)
}

// LeaveRoom removes a player from a room
func (s *RoomService) LeaveRoom(ctx context.Context, roomID uuid.UUID, userID uuid.UUID) error {
	room, err := s.GetRoom(ctx, roomID)
	if err != nil {
		return err
	}

	// Find and remove participant
	participantIndex := -1
	for i, p := range room.Participants {
		if p.UserID == userID {
			participantIndex = i
			break
		}
	}

	if participantIndex == -1 {
		return fmt.Errorf("user not in room")
	}

	// Remove participant
	room.Participants = append(room.Participants[:participantIndex], room.Participants[participantIndex+1:]...)
	room.UpdatedAt = time.Now()

	// If no participants left, close the room
	if len(room.Participants) == 0 {
		room.Status = domain.RoomStatusClosed
		s.saveRoom(ctx, room)
		s.publishRoomEvent(ctx, "room_closed", room)
		return nil
	}

	// If host left, assign new host
	if room.HostID == userID && len(room.Participants) > 0 {
		room.HostID = room.Participants[0].UserID
		room.Participants[0].Role = domain.ParticipantRoleHost
	}

	// Update room status if no longer full
	if room.Status == domain.RoomStatusReady && len(room.Participants) < room.MaxPlayers {
		room.Status = domain.RoomStatusWaiting
	}

	// Save updated room
	err = s.saveRoom(ctx, room)
	if err != nil {
		return err
	}

	// Publish room left event
	s.publishRoomEvent(ctx, "room_left", room)

	return nil
}

// SetParticipantReady sets a participant's ready status
func (s *RoomService) SetParticipantReady(ctx context.Context, roomID uuid.UUID, userID uuid.UUID, isReady bool) error {
	room, err := s.GetRoom(ctx, roomID)
	if err != nil {
		return err
	}

	// Find participant
	found := false
	for i, p := range room.Participants {
		if p.UserID == userID {
			room.Participants[i].IsReady = isReady
			found = true
			break
		}
	}

	if !found {
		return fmt.Errorf("user not in room")
	}

	room.UpdatedAt = time.Now()

	// Save updated room
	err = s.saveRoom(ctx, room)
	if err != nil {
		return err
	}

	// Publish ready event
	s.publishRoomEvent(ctx, "participant_ready", room)

	return nil
}

// StartGame starts the game for a room
func (s *RoomService) StartGame(ctx context.Context, roomID uuid.UUID, hostID uuid.UUID, gameService *GameService) (*domain.Room, error) {
	room, err := s.GetRoom(ctx, roomID)
	if err != nil {
		return nil, err
	}

	// Check if user is host
	if room.HostID != hostID {
		return nil, fmt.Errorf("only host can start the game")
	}

	// Check if room has enough players
	if len(room.Participants) < 2 {
		return nil, fmt.Errorf("not enough players")
	}

	// Check if all participants are ready
	allReady := true
	for _, p := range room.Participants {
		if !p.IsReady {
			allReady = false
			break
		}
	}

	if !allReady {
		return nil, fmt.Errorf("not all participants are ready")
	}

	// Create the actual game
	player1 := room.Participants[0]
	player2 := room.Participants[1]
	
	game, err := gameService.CreateGame(ctx, game.GameType(room.GameType), player1.UserID, player1.Username)
	if err != nil {
		return nil, fmt.Errorf("failed to create game: %w", err)
	}
	
	// Join player 2 to the game
	_, err = gameService.JoinGame(ctx, game.ID, player2.UserID, player2.Username)
	if err != nil {
		return nil, fmt.Errorf("failed to join player 2: %w", err)
	}

	// Update room status and game ID
	now := time.Now()
	room.Status = domain.RoomStatusActive
	room.GameID = &game.ID
	room.StartedAt = &now
	room.UpdatedAt = now

	// Save updated room
	err = s.saveRoom(ctx, room)
	if err != nil {
		return nil, err
	}

	// Publish game started event
	s.publishRoomEvent(ctx, "game_started", room)

	return room, nil
}

// CloseRoom closes a room
func (s *RoomService) CloseRoom(ctx context.Context, roomID uuid.UUID) error {
	room, err := s.GetRoom(ctx, roomID)
	if err != nil {
		return err
	}

	room.Status = domain.RoomStatusClosed
	room.UpdatedAt = time.Now()

	err = s.saveRoom(ctx, room)
	if err != nil {
		return err
	}

	// Publish room closed event
	s.publishRoomEvent(ctx, "room_closed", room)

	return nil
}

// saveRoom saves a room to Redis
func (s *RoomService) saveRoom(ctx context.Context, room *domain.Room) error {
	roomJSON, err := json.Marshal(room)
	if err != nil {
		return fmt.Errorf("failed to marshal room: %w", err)
	}

	pipe := s.redisClient.Pipeline()
	
	// Save room data
	pipe.Set(ctx, roomKey(room.ID), roomJSON, roomTTL)
	
	// Save join code mapping
	pipe.Set(ctx, roomCodeKey(room.JoinCode), room.ID.String(), roomTTL)
	
	_, err = pipe.Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to save room: %w", err)
	}

	return nil
}

// publishRoomEvent publishes a room event to Redis pub/sub
func (s *RoomService) publishRoomEvent(ctx context.Context, eventType string, room *domain.Room) {
	eventData := map[string]interface{}{
		"type": eventType,
		"room": room,
	}
	eventJSON, _ := json.Marshal(eventData)
	s.redisClient.Publish(ctx, fmt.Sprintf("room:%s", room.ID.String()), eventJSON)
}

// Helper functions for Redis keys
func roomKey(roomID uuid.UUID) string {
	return fmt.Sprintf("%s%s", roomKeyPrefix, roomID.String())
}

func roomCodeKey(joinCode string) string {
	return fmt.Sprintf("%s%s", roomCodeKeyPrefix, joinCode)
}

