package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/arenamatch/playforge/internal/domain"
	"github.com/arenamatch/playforge/internal/game"
	"github.com/arenamatch/playforge/internal/repository"
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
	roomRepo    RoomRepository
}

// RoomRepository interface for database operations
type RoomRepository interface {
	Create(ctx context.Context, room *repository.RoomDB) error
	GetByID(ctx context.Context, id uuid.UUID) (*repository.RoomDB, error)
	Update(ctx context.Context, room *repository.RoomDB) error
	Delete(ctx context.Context, id uuid.UUID) error
}

func NewRoomService(redisClient *redis.Client, roomRepo RoomRepository) *RoomService {
	return &RoomService{
		redisClient: redisClient,
		roomRepo:    roomRepo,
	}
}

// CreateRoom creates a new game room
func (s *RoomService) CreateRoom(ctx context.Context, hostID uuid.UUID, hostUsername string, req domain.CreateRoomRequest) (*domain.Room, error) {
	fmt.Printf("RoomService.CreateRoom: GameType=%s, GameSettings=%+v\n", req.GameType, req.GameSettings)
	
	// Apply default settings if not provided
	gameSettings := req.GameSettings
	if gameSettings == nil {
		fmt.Printf("No game settings provided, using defaults\n")
		gameSettings = getDefaultGameSettings(req.GameType)
	} else {
		fmt.Printf("Game settings provided: %+v\n", gameSettings)
		// Validate and apply defaults for missing fields
		gameSettings = validateAndFillGameSettings(req.GameType, gameSettings)
	}
	
	fmt.Printf("Final game settings after validation: %+v\n", gameSettings)
	
	room := &domain.Room{
		ID:           uuid.New(),
		Type:         req.Type,
		Status:       domain.RoomStatusWaiting,
		GameType:     req.GameType,
		GameSettings: gameSettings,
		JoinCode:     GenerateJoinCode(),
		HostID:       hostID,
		MaxPlayers:   req.MaxPlayers,
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

	// Save to database if this is a tournament room (has room repository)
	if s.roomRepo != nil {
		roomDB := &repository.RoomDB{
			ID:           room.ID,
			Code:         room.JoinCode,
			HostID:       room.HostID,
			GameType:     room.GameType,
			MaxPlayers:   room.MaxPlayers,
			Status:       string(room.Status),
			IsTournament: true, // Rooms with DB persistence are tournament rooms
		}
		
		err = s.roomRepo.Create(ctx, roomDB)
		if err != nil {
			fmt.Printf("Failed to save room to database: %v\n", err)
			return nil, fmt.Errorf("failed to save room to database: %w", err)
		}
		fmt.Printf("Room saved to database: %s\n", room.ID)
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
		fmt.Printf("JoinRoom: failed to get room %s: %v\n", roomID, err)
		return err
	}

	// Check if room is closed or complete
	if room.Status == domain.RoomStatusClosed || room.Status == domain.RoomStatusComplete {
		return fmt.Errorf("room is closed")
	}

	// Check if user is already in room
	for _, p := range room.Participants {
		if p.UserID == userID {
			fmt.Printf("JoinRoom: user %s already in room %s, returning success\n", userID, roomID)
			return nil // Already joined - idempotent operation
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
	fmt.Printf("JoinRoom: adding user %s to room %s\n", username, roomID)
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

	// Create the actual game with custom settings
	player1 := room.Participants[0]
	player2 := room.Participants[1]
	
	fmt.Printf("StartGame: Creating game with settings: %+v\n", room.GameSettings)
	game, err := gameService.CreateGameWithSettings(ctx, game.GameType(room.GameType), player1.UserID, player1.Username, room.GameSettings)
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

// getDefaultGameSettings returns default settings for each game type
func getDefaultGameSettings(gameType string) *domain.GameSettings {
	settings := &domain.GameSettings{}
	
	switch gameType {
	case "tictactoe":
		settings.TicTacToeGridSize = 3
		settings.TicTacToeWinLength = 3
	case "connect4":
		settings.Connect4Rows = 6
		settings.Connect4Cols = 7
		settings.Connect4WinLength = 4
	case "rps":
		settings.RPSBestOf = 5
	case "dotsandboxes":
		settings.DotsGridSize = 5
	}
	
	return settings
}

// validateAndFillGameSettings validates settings and fills in defaults for missing values
func validateAndFillGameSettings(gameType string, settings *domain.GameSettings) *domain.GameSettings {
	defaults := getDefaultGameSettings(gameType)
	
	switch gameType {
	case "tictactoe":
		if settings.TicTacToeGridSize < 3 || settings.TicTacToeGridSize > 5 {
			settings.TicTacToeGridSize = defaults.TicTacToeGridSize
		}
		if settings.TicTacToeWinLength == 0 || settings.TicTacToeWinLength > settings.TicTacToeGridSize {
			settings.TicTacToeWinLength = settings.TicTacToeGridSize
		}
	case "connect4":
		if settings.Connect4Rows < 4 || settings.Connect4Rows > 10 {
			settings.Connect4Rows = defaults.Connect4Rows
		}
		if settings.Connect4Cols < 4 || settings.Connect4Cols > 10 {
			settings.Connect4Cols = defaults.Connect4Cols
		}
		if settings.Connect4WinLength < 4 || settings.Connect4WinLength > 6 {
			settings.Connect4WinLength = defaults.Connect4WinLength
		}
	case "rps":
		if settings.RPSBestOf < 3 || settings.RPSBestOf > 9 || settings.RPSBestOf%2 == 0 {
			settings.RPSBestOf = defaults.RPSBestOf
		}
	case "dotsandboxes":
		if settings.DotsGridSize < 4 || settings.DotsGridSize > 8 {
			settings.DotsGridSize = defaults.DotsGridSize
		}
	}
	
	return settings
}

