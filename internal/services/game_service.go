package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/arenamatch/playforge/internal/game"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

type GameService struct {
	redisClient  *redis.Client
	statsService *StatsService
}

func NewGameService(redisClient *redis.Client, statsService *StatsService) *GameService {
	return &GameService{
		redisClient:  redisClient,
		statsService: statsService,
	}
}

// CreateGame creates a new game
func (s *GameService) CreateGame(ctx context.Context, gameType game.GameType, player1ID uuid.UUID, player1Name string) (*game.Game, error) {
	gameID := uuid.New()
	now := time.Now()

	var gameState game.GameState
	switch gameType {
	case game.GameTypeTicTacToe:
		gameState = game.NewTicTacToeState(player1ID, uuid.Nil) // Player 2 will join later
	default:
		return nil, fmt.Errorf("unsupported game type: %s", gameType)
	}

	g := &game.Game{
		ID:          gameID,
		Type:        gameType,
		Status:      game.GameStatusWaiting,
		Player1ID:   player1ID,
		Player1Name: player1Name,
		CurrentTurn: player1ID,
		State:       gameState,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	// Save to Redis
	fmt.Printf("Saving game %s to Redis...\n", gameID.String())
	if err := s.SaveGame(ctx, g); err != nil {
		fmt.Printf("Error saving game: %v\n", err)
		return nil, err
	}
	fmt.Printf("Game %s saved successfully\n", gameID.String())

	return g, nil
}

// JoinGame allows a second player to join a waiting game
func (s *GameService) JoinGame(ctx context.Context, gameID, player2ID uuid.UUID, player2Name string) (*game.Game, error) {
	g, err := s.GetGame(ctx, gameID)
	if err != nil {
		return nil, err
	}

	if g.Status != game.GameStatusWaiting {
		return nil, fmt.Errorf("game is not waiting for players")
	}

	// Update game with player 2
	g.Player2ID = player2ID
	g.Player2Name = player2Name
	g.Status = game.GameStatusActive
	now := time.Now()
	g.StartedAt = &now
	g.UpdatedAt = now

	// Update game state with player 2
	switch state := g.State.(type) {
	case *game.TicTacToeState:
		state.Player2ID = player2ID
	}

	// Save to Redis
	if err := s.SaveGame(ctx, g); err != nil {
		return nil, err
	}

	// Publish game started event
	s.PublishGameEvent(ctx, gameID, "game_started", g)

	return g, nil
}

// MakeMove processes a player's move
func (s *GameService) MakeMove(ctx context.Context, gameID, playerID uuid.UUID, move interface{}) (*game.Game, error) {
	g, err := s.GetGame(ctx, gameID)
	if err != nil {
		return nil, err
	}

	if g.Status != game.GameStatusActive {
		return nil, game.ErrGameNotActive
	}

	// Apply move
	if err := g.State.ApplyMove(playerID, move); err != nil {
		return nil, err
	}

	// Check for winner
	winner, gameOver := g.State.CheckWinner()
	if gameOver {
		g.Status = game.GameStatusCompleted
		g.WinnerID = winner
		now := time.Now()
		g.EndedAt = &now

		// Update player stats and ELO ratings
		if s.statsService != nil {
			if err := s.statsService.UpdateGameStats(ctx, string(g.Type), g.Player1ID, g.Player2ID, g.WinnerID); err != nil {
				fmt.Printf("Error updating game stats: %v\n", err)
				// Don't fail the move if stats update fails
			}
		}
	}

	// Update current turn
	g.CurrentTurn = g.State.GetCurrentPlayer()
	g.UpdatedAt = time.Now()

	// Save to Redis
	if err := s.SaveGame(ctx, g); err != nil {
		return nil, err
	}

	// Publish move event
	s.PublishGameEvent(ctx, gameID, "game_move", g)

	return g, nil
}

// GetGame retrieves a game from Redis
func (s *GameService) GetGame(ctx context.Context, gameID uuid.UUID) (*game.Game, error) {
	key := fmt.Sprintf("game:%s", gameID.String())
	fmt.Printf("Getting game from Redis with key: %s\n", key)
	data, err := s.redisClient.Get(ctx, key).Result()
	if err != nil {
		if err == redis.Nil {
			fmt.Printf("Game not found in Redis for key: %s\n", key)
			return nil, fmt.Errorf("game not found")
		}
		fmt.Printf("Redis error: %v\n", err)
		return nil, err
	}
	fmt.Printf("Game found in Redis: %d bytes\n", len(data))

	var g game.Game
	if err := json.Unmarshal([]byte(data), &g); err != nil {
		fmt.Printf("Error unmarshaling game: %v\n", err)
		return nil, fmt.Errorf("failed to unmarshal game: %w", err)
	}
	fmt.Printf("Game unmarshaled successfully, Type: %s, Status: %s\n", g.Type, g.Status)

	// Deserialize game state based on type
	switch g.Type {
	case game.GameTypeTicTacToe:
		fmt.Printf("Deserializing TicTacToe state from %d bytes...\n", len(g.StateData))
		var state game.TicTacToeState
		if err := json.Unmarshal(g.StateData, &state); err != nil {
			fmt.Printf("Error unmarshaling TicTacToe state: %v\n", err)
			return nil, fmt.Errorf("failed to unmarshal game state: %w", err)
		}
		g.State = &state
		fmt.Printf("TicTacToe state deserialized successfully\n")
	}

	fmt.Printf("Returning game %s\n", g.ID.String())
	return &g, nil
}

// SaveGame saves a game to Redis
func (s *GameService) SaveGame(ctx context.Context, g *game.Game) error {
	key := fmt.Sprintf("game:%s", g.ID.String())
	
	// Serialize the state to JSON
	if g.State != nil {
		stateData, err := json.Marshal(g.State.GetState())
		if err != nil {
			return fmt.Errorf("failed to marshal game state: %w", err)
		}
		g.StateData = stateData
	}
	
	data, err := json.Marshal(g)
	if err != nil {
		return err
	}

	// Set with 4 hour expiration
	return s.redisClient.Set(ctx, key, data, 4*time.Hour).Err()
}

// PublishGameEvent publishes a game event to Redis pub/sub
func (s *GameService) PublishGameEvent(ctx context.Context, gameID uuid.UUID, event string, payload interface{}) error {
	channel := fmt.Sprintf("game:%s", gameID.String())
	
	eventData := map[string]interface{}{
		"event":     event,
		"game_id":   gameID.String(),
		"payload":   payload,
		"timestamp": time.Now(),
	}

	data, err := json.Marshal(eventData)
	if err != nil {
		return err
	}

	return s.redisClient.Publish(ctx, channel, data).Err()
}

// SubscribeToGame subscribes to game events
func (s *GameService) SubscribeToGame(ctx context.Context, gameID uuid.UUID) *redis.PubSub {
	channel := fmt.Sprintf("game:%s", gameID.String())
	return s.redisClient.Subscribe(ctx, channel)
}

// SubscribeToGamePattern subscribes to game events using a pattern
func (s *GameService) SubscribeToGamePattern(ctx context.Context, pattern string) *redis.PubSub {
	return s.redisClient.PSubscribe(ctx, pattern)
}

