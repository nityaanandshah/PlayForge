package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/arenamatch/playforge/internal/domain"
	"github.com/arenamatch/playforge/internal/game"
	"github.com/arenamatch/playforge/internal/repository"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

type GameService struct {
	redisClient        *redis.Client
	statsService       *StatsService
	gameRepo           *repository.GameRepository
	tournamentService  TournamentServiceInterface // Interface to avoid circular dependency
}

// TournamentServiceInterface defines the methods game service needs from tournament service
type TournamentServiceInterface interface {
	AdvanceWinner(ctx context.Context, tournamentID uuid.UUID, matchID uuid.UUID, winnerID uuid.UUID) error
	CreateGamesForNextRound(ctx context.Context, tournamentID uuid.UUID) error
	ListTournaments(ctx context.Context, status *domain.TournamentStatus, limit int) ([]domain.Tournament, error)
}

func NewGameService(redisClient *redis.Client, statsService *StatsService, gameRepo *repository.GameRepository) *GameService {
	return &GameService{
		redisClient:  redisClient,
		statsService: statsService,
		gameRepo:     gameRepo,
	}
}

// SetTournamentService sets the tournament service (called after initialization to avoid circular dependency)
func (s *GameService) SetTournamentService(tournamentService TournamentServiceInterface) {
	s.tournamentService = tournamentService
}

// CreateGame creates a new game with default settings
func (s *GameService) CreateGame(ctx context.Context, gameType game.GameType, player1ID uuid.UUID, player1Name string) (*game.Game, error) {
	return s.CreateGameWithSettings(ctx, gameType, player1ID, player1Name, nil)
}

// CreateGameWithSettings creates a new game with custom settings
func (s *GameService) CreateGameWithSettings(ctx context.Context, gameType game.GameType, player1ID uuid.UUID, player1Name string, settings interface{}) (*game.Game, error) {
	gameID := uuid.New()
	now := time.Now()

	// Convert settings to map for easier access in game constructors
	var settingsMap map[string]interface{}
	if settings != nil {
		// Marshal and unmarshal to convert struct to map
		settingsJSON, err := json.Marshal(settings)
		if err == nil {
			json.Unmarshal(settingsJSON, &settingsMap)
			fmt.Printf("Game settings received: %+v\n", settingsMap)
		}
	}

	var gameState game.GameState
	switch gameType {
	case game.GameTypeTicTacToe:
		if settingsMap != nil {
			gameState = game.NewTicTacToeStateWithSettings(player1ID, uuid.Nil, settingsMap)
		} else {
			gameState = game.NewTicTacToeState(player1ID, uuid.Nil)
		}
	case game.GameTypeConnect4:
		if settingsMap != nil {
			gameState = game.NewConnect4StateWithSettings(player1ID, uuid.Nil, settingsMap)
		} else {
			gameState = game.NewConnect4State(player1ID, uuid.Nil)
		}
	case game.GameTypeRockPaperScissors:
		if settingsMap != nil {
			gameState = game.NewRPSStateWithSettings(player1ID, uuid.Nil, settingsMap)
		} else {
			gameState = game.NewRPSState(player1ID, uuid.Nil)
		}
	case game.GameTypeDotsAndBoxes:
		if settingsMap != nil {
			gameState = game.NewDotsAndBoxesStateWithSettings(player1ID, uuid.Nil, settingsMap)
		} else {
			gameState = game.NewDotsAndBoxesState(player1ID, uuid.Nil)
		}
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
		Spectators:  []game.Spectator{}, // Initialize as empty slice, not nil
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

// CreateGameForTournament creates a game with both players already assigned for tournament matches
func (s *GameService) CreateGameForTournament(ctx context.Context, gameID uuid.UUID, gameType game.GameType, player1ID uuid.UUID, player1Name string, player2ID uuid.UUID, player2Name string, tournamentID uuid.UUID, tournamentRound int) (*game.Game, error) {
	log.Printf("CreateGameForTournament called: gameID=%s, type=%s, player1=%s(%s), player2=%s(%s), tournament=%s, round=%d",
		gameID, gameType, player1Name, player1ID, player2Name, player2ID, tournamentID, tournamentRound)
	
	now := time.Now()

	var gameState game.GameState
	switch gameType {
	case game.GameTypeTicTacToe:
		gameState = game.NewTicTacToeState(player1ID, player2ID)
	case game.GameTypeConnect4:
		gameState = game.NewConnect4State(player1ID, player2ID)
	case game.GameTypeRockPaperScissors:
		gameState = game.NewRPSState(player1ID, player2ID)
	case game.GameTypeDotsAndBoxes:
		gameState = game.NewDotsAndBoxesState(player1ID, player2ID)
	default:
		return nil, fmt.Errorf("unsupported game type: %s", gameType)
	}

	g := &game.Game{
		ID:              gameID,
		Type:            gameType,
		Status:          game.GameStatusActive, // Both players assigned, ready to play
		Player1ID:       player1ID,
		Player1Name:     player1Name,
		Player2ID:       player2ID,
		Player2Name:     player2Name,
		CurrentTurn:     player1ID, // Player 1 goes first
		State:           gameState,
		Spectators:      []game.Spectator{}, // Initialize as empty slice, not nil
		TournamentID:    &tournamentID,
		TournamentRound: tournamentRound,
		CreatedAt:       now,
		UpdatedAt:       now,
	}

	// Save to Redis
	if err := s.SaveGame(ctx, g); err != nil {
		return nil, fmt.Errorf("failed to save tournament game to Redis: %w", err)
	}

	// Save to database for persistence
	gameStateObj := gameState.GetState()
	if gameStateObj == nil {
		log.Printf("WARNING: Game state is nil during creation for game %s (type: %s)", gameID, gameType)
	}
	
	stateData, err := json.Marshal(gameStateObj)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal game state: %w", err)
	}
	
	if len(stateData) == 0 {
		log.Printf("WARNING: Marshaled game state is empty during creation for game %s", gameID)
	}

	if err := s.gameRepo.CreateGame(ctx, gameID, string(gameType), player1ID, player2ID, now, stateData); err != nil {
		log.Printf("ERROR: Failed to save tournament game to database: %v", err)
		// Don't fail if DB save fails - Redis is the primary store
	} else {
		log.Printf("Successfully saved initial game state for %s (%d bytes)", gameID, len(stateData))
	}

	log.Printf("Created tournament game %s: %s vs %s (saved to Redis and DB)", gameID, player1Name, player2Name)

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
	case *game.Connect4State:
		state.Player2ID = player2ID
	case *game.RPSState:
		state.Player2ID = player2ID
	case *game.DotsAndBoxesState:
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

	// Validate player is a participant in this game
	if playerID != g.Player1ID && playerID != g.Player2ID {
		return nil, fmt.Errorf("you are not a participant in this game - spectators cannot make moves")
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
			// Check if this is a tournament game
			if g.TournamentID != nil && g.TournamentRound > 0 {
				// Tournament game - use progressive bonuses
				if err := s.statsService.UpdateTournamentGameStats(ctx, string(g.Type), g.Player1ID, g.Player2ID, g.WinnerID, g.TournamentRound); err != nil {
					fmt.Printf("Error updating tournament game stats: %v\n", err)
					// Don't fail the move if stats update fails
				}
			} else {
				// Regular casual game
				if err := s.statsService.UpdateGameStats(ctx, string(g.Type), g.Player1ID, g.Player2ID, g.WinnerID); err != nil {
					fmt.Printf("Error updating game stats: %v\n", err)
					// Don't fail the move if stats update fails
				}
			}
		}

		// Save completed game to database for match history
		if s.gameRepo != nil {
			// Serialize the game state to JSON
			gameState := g.State.GetState()
			if gameState == nil {
				log.Printf("CRITICAL ERROR: Game state is nil for completed game %s (type: %s)", g.ID, g.Type)
				// This should never happen - log detailed debug info
				log.Printf("Game details - Player1: %s, Player2: %s, Winner: %v, Status: %s", 
					g.Player1ID, g.Player2ID, g.WinnerID, g.Status)
			} else {
				gameStateData, err := json.Marshal(gameState)
				if err != nil {
					log.Printf("CRITICAL ERROR: Failed to marshal game state for game %s: %v", g.ID, err)
					log.Printf("Game state type: %T, value: %+v", gameState, gameState)
				} else if len(gameStateData) == 0 {
					log.Printf("CRITICAL ERROR: Marshaled game state is empty for game %s", g.ID)
				} else {
					log.Printf("Saving completed game %s to database with %d bytes of game state", g.ID, len(gameStateData))
					
					// Retry logic: Try to save 3 times before giving up
					var saveErr error
					for attempt := 1; attempt <= 3; attempt++ {
						saveErr = s.gameRepo.SaveCompletedGame(ctx, g.ID, string(g.Type), g.Player1ID, g.Player2ID, g.WinnerID, g.CreatedAt, g.EndedAt, gameStateData)
						if saveErr == nil {
							log.Printf("Successfully saved completed game %s to database on attempt %d", g.ID, attempt)
							break
						}
						log.Printf("ERROR: Failed to save completed game %s to database (attempt %d/3): %v", g.ID, attempt, saveErr)
						if attempt < 3 {
							time.Sleep(time.Millisecond * 100 * time.Duration(attempt)) // Exponential backoff
						}
					}
					
					if saveErr != nil {
						log.Printf("CRITICAL ERROR: Failed to save game state to database after 3 attempts for game %s", g.ID)
					}
				}
			}
		}

		// Tournament game: Advance winner to next round
		// AdvanceWinner will automatically create games for the next round if ready
		if g.TournamentID != nil && g.WinnerID != nil && s.tournamentService != nil {
			log.Printf("Tournament game completed - advancing winner %s to next round", g.WinnerID.String())
			if err := s.tournamentService.AdvanceWinner(ctx, *g.TournamentID, g.ID, *g.WinnerID); err != nil {
				log.Printf("Error advancing tournament winner: %v", err)
				// Don't fail the move if advancement fails
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

// GetGame retrieves a game from Redis or falls back to the database
func (s *GameService) GetGame(ctx context.Context, gameID uuid.UUID) (*game.Game, error) {
	key := fmt.Sprintf("game:%s", gameID.String())
	fmt.Printf("Getting game from Redis with key: %s\n", key)
	data, err := s.redisClient.Get(ctx, key).Result()
	if err != nil {
		if err == redis.Nil {
			fmt.Printf("Game not found in Redis, checking database...\n")
			// Fall back to database for completed games
			if s.gameRepo != nil {
				return s.getGameFromDatabase(ctx, gameID)
			}
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
	if err := s.deserializeGameState(&g); err != nil {
		return nil, err
	}

	// Ensure Spectators is never nil (initialize as empty slice if nil)
	if g.Spectators == nil {
		g.Spectators = []game.Spectator{}
	}

	fmt.Printf("Returning game %s\n", g.ID.String())
	return &g, nil
}

// getGameFromDatabase retrieves a completed game from the database
func (s *GameService) getGameFromDatabase(ctx context.Context, gameID uuid.UUID) (*game.Game, error) {
	log.Printf("Attempting to retrieve game %s from database...", gameID)
	dbGame, err := s.gameRepo.GetByID(ctx, gameID)
	if err != nil {
		log.Printf("Game %s not found in database: %v", gameID, err)
		return nil, fmt.Errorf("game not found")
	}
	log.Printf("Game %s found in database", gameID)
	log.Printf("Reconstructing game object from database fields...")

	// Debug: Print all field types
	for key, value := range dbGame {
		log.Printf("  Field %s: type=%T, value=%v", key, value, value)
	}

	// Helper function to convert time fields (handles both time.Time and *time.Time)
	getTimePtr := func(field interface{}) *time.Time {
		if field == nil {
			return nil
		}
		switch v := field.(type) {
		case *time.Time:
			return v
		case time.Time:
			return &v
		default:
			return nil
		}
	}

	// Reconstruct game object
	g := &game.Game{
		ID:          dbGame["id"].(uuid.UUID),
		Type:        game.GameType(dbGame["game_type"].(string)),
		Status:      game.GameStatus(dbGame["status"].(string)),
		Player1ID:   dbGame["player1_id"].(uuid.UUID),
		Player1Name: dbGame["player1_name"].(string),
		Player2ID:   dbGame["player2_id"].(uuid.UUID),
		Player2Name: dbGame["player2_name"].(string),
		CurrentTurn: dbGame["player1_id"].(uuid.UUID), // Default to player1 for completed games
		CreatedAt:   dbGame["created_at"].(time.Time),
		StartedAt:   getTimePtr(dbGame["started_at"]),
		EndedAt:     getTimePtr(dbGame["ended_at"]),
		Spectators:  []game.Spectator{},
	}
	log.Printf("Game object reconstructed successfully")

	// Set winner ID if present
	if winnerID, ok := dbGame["winner_id"].(*uuid.UUID); ok && winnerID != nil {
		g.WinnerID = winnerID
	}

	// Deserialize game state
	if gameStateData, ok := dbGame["game_state"].([]byte); ok && len(gameStateData) > 0 {
		g.StateData = gameStateData
		if err := s.deserializeGameState(g); err != nil {
			return nil, err
		}
	}

	fmt.Printf("Returning game from database: %s\n", g.ID.String())
	return g, nil
}

// deserializeGameState deserializes the game state based on game type
func (s *GameService) deserializeGameState(g *game.Game) error {
	switch g.Type {
	case game.GameTypeTicTacToe:
		fmt.Printf("Deserializing TicTacToe state from %d bytes...\n", len(g.StateData))
		var state game.TicTacToeState
		if err := json.Unmarshal(g.StateData, &state); err != nil {
			fmt.Printf("Error unmarshaling TicTacToe state: %v\n", err)
			return fmt.Errorf("failed to unmarshal game state: %w", err)
		}
		g.State = &state
		fmt.Printf("TicTacToe state deserialized successfully\n")
	case game.GameTypeConnect4:
		fmt.Printf("Deserializing Connect4 state from %d bytes...\n", len(g.StateData))
		var state game.Connect4State
		if err := json.Unmarshal(g.StateData, &state); err != nil {
			fmt.Printf("Error unmarshaling Connect4 state: %v\n", err)
			return fmt.Errorf("failed to unmarshal game state: %w", err)
		}
		g.State = &state
		fmt.Printf("Connect4 state deserialized successfully\n")
	case game.GameTypeRockPaperScissors:
		fmt.Printf("Deserializing RPS state from %d bytes...\n", len(g.StateData))
		var state game.RPSState
		if err := json.Unmarshal(g.StateData, &state); err != nil {
			fmt.Printf("Error unmarshaling RPS state: %v\n", err)
			return fmt.Errorf("failed to unmarshal game state: %w", err)
		}
		g.State = &state
		fmt.Printf("RPS state deserialized successfully\n")
	case game.GameTypeDotsAndBoxes:
		fmt.Printf("Deserializing DotsAndBoxes state from %d bytes...\n", len(g.StateData))
		var state game.DotsAndBoxesState
		if err := json.Unmarshal(g.StateData, &state); err != nil {
			fmt.Printf("Error unmarshaling DotsAndBoxes state: %v\n", err)
			return fmt.Errorf("failed to unmarshal game state: %w", err)
		}
		g.State = &state
		fmt.Printf("DotsAndBoxes state deserialized successfully\n")
	}
	return nil
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

// AddSpectator adds a spectator to a game
func (s *GameService) AddSpectator(ctx context.Context, gameID, userID uuid.UUID, username string) (*game.Game, error) {
	g, err := s.GetGame(ctx, gameID)
	if err != nil {
		return nil, err
	}

	// Check if user is already a player
	if userID == g.Player1ID || userID == g.Player2ID {
		return nil, fmt.Errorf("players cannot spectate their own game")
	}

	// Check if already spectating
	for _, spec := range g.Spectators {
		if spec.UserID == userID {
			return g, nil // Already spectating, return current state
		}
	}

	// Add new spectator
	spectator := game.Spectator{
		UserID:   userID,
		Username: username,
		JoinedAt: time.Now(),
	}
	g.Spectators = append(g.Spectators, spectator)
	g.UpdatedAt = time.Now()

	// Save to Redis
	if err := s.SaveGame(ctx, g); err != nil {
		return nil, err
	}

	// Publish spectator joined event
	s.PublishGameEvent(ctx, gameID, "spectator_joined", map[string]interface{}{
		"spectator": spectator,
		"count":     len(g.Spectators),
	})

	log.Printf("User %s (%s) joined game %s as spectator", username, userID, gameID)

	return g, nil
}

// RemoveSpectator removes a spectator from a game
func (s *GameService) RemoveSpectator(ctx context.Context, gameID, userID uuid.UUID) (*game.Game, error) {
	g, err := s.GetGame(ctx, gameID)
	if err != nil {
		return nil, err
	}

	// Find and remove spectator
	found := false
	newSpectators := make([]game.Spectator, 0)
	for _, spec := range g.Spectators {
		if spec.UserID != userID {
			newSpectators = append(newSpectators, spec)
		} else {
			found = true
		}
	}

	if !found {
		return g, nil // Not spectating, return current state
	}

	g.Spectators = newSpectators
	g.UpdatedAt = time.Now()

	// Save to Redis
	if err := s.SaveGame(ctx, g); err != nil {
		return nil, err
	}

	// Publish spectator left event
	s.PublishGameEvent(ctx, gameID, "spectator_left", map[string]interface{}{
		"user_id": userID.String(),
		"count":   len(g.Spectators),
	})

	return g, nil
}

// GetSpectators returns the list of spectators for a game
func (s *GameService) GetSpectators(ctx context.Context, gameID uuid.UUID) ([]game.Spectator, error) {
	g, err := s.GetGame(ctx, gameID)
	if err != nil {
		return nil, err
	}
	return g.Spectators, nil
}

// IsSpectator checks if a user is spectating a game
func (s *GameService) IsSpectator(ctx context.Context, gameID, userID uuid.UUID) (bool, error) {
	g, err := s.GetGame(ctx, gameID)
	if err != nil {
		return false, err
	}

	for _, spec := range g.Spectators {
		if spec.UserID == userID {
			return true, nil
		}
	}
	return false, nil
}

