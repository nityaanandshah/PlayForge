package services

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"math/rand"
	"time"

	"github.com/arenamatch/playforge/internal/domain"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

const (
	// Queue keys
	queueKeyPrefix       = "matchmaking:queue:"      // matchmaking:queue:{game_type}
	queueEntryKeyPrefix  = "matchmaking:entry:"      // matchmaking:entry:{entry_id}
	userQueueKeyPrefix   = "matchmaking:user:"       // matchmaking:user:{user_id}
	
	// Matchmaking settings
	queueTimeout         = 5 * time.Minute           // Max time in queue
	matchmakingInterval  = 2 * time.Second           // How often to check for matches
	ratingRange          = 200                       // Initial ELO range for matching
	ratingRangeIncrease  = 50                        // Increase range every 30 seconds
)

type MatchmakingService struct {
	redisClient *redis.Client
	roomService *RoomService
}

func NewMatchmakingService(redisClient *redis.Client, roomService *RoomService) *MatchmakingService {
	return &MatchmakingService{
		redisClient: redisClient,
		roomService: roomService,
	}
}

// JoinQueue adds a player to the matchmaking queue
func (s *MatchmakingService) JoinQueue(ctx context.Context, userID uuid.UUID, username string, gameType string, rating int) (*domain.QueueEntry, error) {
	// Check if user is already in a queue
	existingEntryID, err := s.redisClient.Get(ctx, userQueueKey(userID)).Result()
	if err == nil && existingEntryID != "" {
		// User already in queue, return existing entry
		return s.GetQueueEntry(ctx, uuid.MustParse(existingEntryID))
	}

	// Create new queue entry
	entry := &domain.QueueEntry{
		ID:        uuid.New(),
		UserID:    userID,
		Username:  username,
		GameType:  gameType,
		Rating:    rating,
		Status:    domain.MatchmakingStatusQueued,
		QueuedAt:  time.Now(),
		ExpiresAt: time.Now().Add(queueTimeout),
	}

	// Serialize entry
	entryJSON, err := json.Marshal(entry)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal queue entry: %w", err)
	}

	// Store entry in Redis
	pipe := s.redisClient.Pipeline()
	
	// Store full entry data
	pipe.Set(ctx, queueEntryKey(entry.ID), entryJSON, queueTimeout)
	
	// Add to game type queue (sorted by rating for easier matching)
	pipe.ZAdd(ctx, queueKey(gameType), redis.Z{
		Score:  float64(rating),
		Member: entry.ID.String(),
	})
	
	// Store user -> entry mapping
	pipe.Set(ctx, userQueueKey(userID), entry.ID.String(), queueTimeout)
	
	_, err = pipe.Exec(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to add to queue: %w", err)
	}

	return entry, nil
}

// LeaveQueue removes a player from the matchmaking queue
func (s *MatchmakingService) LeaveQueue(ctx context.Context, userID uuid.UUID) error {
	// Get user's queue entry
	entryIDStr, err := s.redisClient.Get(ctx, userQueueKey(userID)).Result()
	if err == redis.Nil {
		return fmt.Errorf("user not in queue")
	}
	if err != nil {
		return fmt.Errorf("failed to get queue entry: %w", err)
	}

	entryID := uuid.MustParse(entryIDStr)

	// Get entry to find game type
	entry, err := s.GetQueueEntry(ctx, entryID)
	if err != nil {
		return err
	}

	// Remove from queue
	pipe := s.redisClient.Pipeline()
	pipe.Del(ctx, queueEntryKey(entryID))
	pipe.ZRem(ctx, queueKey(entry.GameType), entryID.String())
	pipe.Del(ctx, userQueueKey(userID))
	_, err = pipe.Exec(ctx)
	
	if err != nil {
		return fmt.Errorf("failed to leave queue: %w", err)
	}

	return nil
}

// GetQueueEntry retrieves a queue entry by ID
func (s *MatchmakingService) GetQueueEntry(ctx context.Context, entryID uuid.UUID) (*domain.QueueEntry, error) {
	entryJSON, err := s.redisClient.Get(ctx, queueEntryKey(entryID)).Result()
	if err == redis.Nil {
		return nil, fmt.Errorf("queue entry not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get queue entry: %w", err)
	}

	var entry domain.QueueEntry
	if err := json.Unmarshal([]byte(entryJSON), &entry); err != nil {
		return nil, fmt.Errorf("failed to unmarshal queue entry: %w", err)
	}

	return &entry, nil
}

// GetUserQueueStatus checks if a user is in queue and returns their entry
func (s *MatchmakingService) GetUserQueueStatus(ctx context.Context, userID uuid.UUID) (*domain.QueueEntry, error) {
	entryIDStr, err := s.redisClient.Get(ctx, userQueueKey(userID)).Result()
	if err == redis.Nil {
		return nil, nil // Not in queue
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get queue status: %w", err)
	}

	entryID := uuid.MustParse(entryIDStr)
	return s.GetQueueEntry(ctx, entryID)
}

// FindMatches runs the matchmaking algorithm to pair players
// This should be called periodically by a background worker
func (s *MatchmakingService) FindMatches(ctx context.Context, gameType string) error {
	// Get all entries in queue for this game type
	entries, err := s.redisClient.ZRangeWithScores(ctx, queueKey(gameType), 0, -1).Result()
	if err != nil {
		return fmt.Errorf("failed to get queue: %w", err)
	}

	if len(entries) < 2 {
		return nil // Not enough players
	}

	// Try to match players
	matched := make(map[string]bool)

	for i := 0; i < len(entries); i++ {
		if matched[entries[i].Member.(string)] {
			continue
		}

		entry1ID := uuid.MustParse(entries[i].Member.(string))
		entry1, err := s.GetQueueEntry(ctx, entry1ID)
		if err != nil {
			continue
		}

		// Check if entry has expired
		if time.Now().After(entry1.ExpiresAt) {
			s.handleTimeout(ctx, entry1)
			continue
		}

		// Calculate current acceptable rating range
		timeInQueue := time.Since(entry1.QueuedAt)
		rangeMultiplier := int(timeInQueue.Seconds() / 30)
		currentRange := ratingRange + (rangeMultiplier * ratingRangeIncrease)

		// Find a suitable opponent
		for j := i + 1; j < len(entries); j++ {
			if matched[entries[j].Member.(string)] {
				continue
			}

			entry2ID := uuid.MustParse(entries[j].Member.(string))
			entry2, err := s.GetQueueEntry(ctx, entry2ID)
			if err != nil {
				continue
			}

			// Check if entry has expired
			if time.Now().After(entry2.ExpiresAt) {
				s.handleTimeout(ctx, entry2)
				continue
			}

			// Check if ratings are within acceptable range
			ratingDiff := int(math.Abs(float64(entry1.Rating - entry2.Rating)))
			if ratingDiff <= currentRange {
				// Match found!
				err := s.createMatch(ctx, entry1, entry2)
				if err != nil {
					fmt.Printf("Failed to create match: %v\n", err)
					continue
				}

				matched[entry1.ID.String()] = true
				matched[entry2.ID.String()] = true
				break
			}
		}
	}

	return nil
}

// createMatch creates a room for matched players
func (s *MatchmakingService) createMatch(ctx context.Context, entry1, entry2 *domain.QueueEntry) error {
	// Create a quick play room
	room, err := s.roomService.CreateRoom(ctx, entry1.UserID, entry1.Username, domain.CreateRoomRequest{
		GameType:   entry1.GameType,
		Type:       domain.RoomTypeQuickPlay,
		MaxPlayers: 2,
	})
	if err != nil {
		return fmt.Errorf("failed to create room: %w", err)
	}

	// Add second player to room
	err = s.roomService.JoinRoom(ctx, room.ID, entry2.UserID, entry2.Username)
	if err != nil {
		return fmt.Errorf("failed to add second player: %w", err)
	}

	// Update queue entries
	entry1.Status = domain.MatchmakingStatusMatched
	entry1.MatchedRoomID = &room.ID
	entry2.Status = domain.MatchmakingStatusMatched
	entry2.MatchedRoomID = &room.ID

	// Save updated entries
	pipe := s.redisClient.Pipeline()
	
	entry1JSON, _ := json.Marshal(entry1)
	entry2JSON, _ := json.Marshal(entry2)
	
	pipe.Set(ctx, queueEntryKey(entry1.ID), entry1JSON, 5*time.Minute)
	pipe.Set(ctx, queueEntryKey(entry2.ID), entry2JSON, 5*time.Minute)
	
	// Remove from active queue
	pipe.ZRem(ctx, queueKey(entry1.GameType), entry1.ID.String())
	pipe.ZRem(ctx, queueKey(entry2.GameType), entry2.ID.String())
	
	// Keep user mappings for a bit so they can retrieve match info
	pipe.Expire(ctx, userQueueKey(entry1.UserID), 5*time.Minute)
	pipe.Expire(ctx, userQueueKey(entry2.UserID), 5*time.Minute)
	
	_, err = pipe.Exec(ctx)
	if err != nil {
		return fmt.Errorf("failed to update queue entries: %w", err)
	}

	// Publish match found event (for WebSocket notification)
	matchFoundData := map[string]interface{}{
		"entry1_id": entry1.ID.String(),
		"entry2_id": entry2.ID.String(),
		"room_id":   room.ID.String(),
		"join_code": room.JoinCode,
	}
	matchFoundJSON, _ := json.Marshal(matchFoundData)
	s.redisClient.Publish(ctx, "matchmaking:match_found", matchFoundJSON)

	return nil
}

// handleTimeout handles a queue entry timeout
func (s *MatchmakingService) handleTimeout(ctx context.Context, entry *domain.QueueEntry) {
	entry.Status = domain.MatchmakingStatusTimeout
	
	// Update entry
	entryJSON, _ := json.Marshal(entry)
	s.redisClient.Set(ctx, queueEntryKey(entry.ID), entryJSON, 5*time.Minute)
	
	// Remove from queue
	s.redisClient.ZRem(ctx, queueKey(entry.GameType), entry.ID.String())
	s.redisClient.Expire(ctx, userQueueKey(entry.UserID), 5*time.Minute)
	
	// Publish timeout event
	timeoutData := map[string]interface{}{
		"entry_id": entry.ID.String(),
		"user_id":  entry.UserID.String(),
	}
	timeoutJSON, _ := json.Marshal(timeoutData)
	s.redisClient.Publish(ctx, "matchmaking:timeout", timeoutJSON)
}

// StartMatchmakingWorker starts a background worker that runs matchmaking periodically
func (s *MatchmakingService) StartMatchmakingWorker(ctx context.Context) {
	ticker := time.NewTicker(matchmakingInterval)
	defer ticker.Stop()

	gameTypes := []string{"tictactoe", "connect4", "rps", "dotsandboxes"}

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			// Run matchmaking for each game type
			for _, gameType := range gameTypes {
				err := s.FindMatches(ctx, gameType)
				if err != nil {
					fmt.Printf("Matchmaking error for %s: %v\n", gameType, err)
				}
			}
		}
	}
}

// Helper functions for Redis keys
func queueKey(gameType string) string {
	return fmt.Sprintf("%s%s", queueKeyPrefix, gameType)
}

func queueEntryKey(entryID uuid.UUID) string {
	return fmt.Sprintf("%s%s", queueEntryKeyPrefix, entryID.String())
}

func userQueueKey(userID uuid.UUID) string {
	return fmt.Sprintf("%s%s", userQueueKeyPrefix, userID.String())
}

// GenerateJoinCode generates a random 6-character alphanumeric code
func GenerateJoinCode() string {
	const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Excluding ambiguous characters
	code := make([]byte, 6)
	for i := range code {
		code[i] = charset[rand.Intn(len(charset))]
	}
	return string(code)
}

