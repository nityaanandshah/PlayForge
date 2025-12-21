package services

import (
	"context"
	"fmt"
	"math"

	"github.com/arenamatch/playforge/internal/repository"
	"github.com/google/uuid"
)

const (
	// K-factor for ELO rating calculation
	EloKFactor = 32
)

type StatsService struct {
	statsRepo *repository.StatsRepository
	userRepo  *repository.UserRepository
}

func NewStatsService(statsRepo *repository.StatsRepository, userRepo *repository.UserRepository) *StatsService {
	return &StatsService{
		statsRepo: statsRepo,
		userRepo:  userRepo,
	}
}

// UpdateGameStats updates player stats and ELO ratings after a game completes
func (s *StatsService) UpdateGameStats(ctx context.Context, gameType string, player1ID, player2ID uuid.UUID, winnerID *uuid.UUID) error {
	// Get both players
	player1, err := s.userRepo.GetByID(ctx, player1ID)
	if err != nil {
		return fmt.Errorf("failed to get player1: %w", err)
	}

	player2, err := s.userRepo.GetByID(ctx, player2ID)
	if err != nil {
		return fmt.Errorf("failed to get player2: %w", err)
	}

	// Determine game result
	var player1Won, player2Won bool
	var isDraw bool

	if winnerID == nil {
		// Draw
		isDraw = true
	} else if *winnerID == player1ID {
		player1Won = true
	} else if *winnerID == player2ID {
		player2Won = true
	}

	// Calculate new ELO ratings
	player1NewElo, player2NewElo := s.calculateEloChange(
		player1.EloRating,
		player2.EloRating,
		player1Won,
		player2Won,
		isDraw,
	)

	// Update ELO ratings
	if err := s.userRepo.UpdateEloRating(ctx, player1ID, player1NewElo); err != nil {
		return fmt.Errorf("failed to update player1 ELO: %w", err)
	}

	if err := s.userRepo.UpdateEloRating(ctx, player2ID, player2NewElo); err != nil {
		return fmt.Errorf("failed to update player2 ELO: %w", err)
	}

	// Ensure stats records exist
	if _, err := s.statsRepo.GetOrCreateStats(ctx, player1ID, gameType); err != nil {
		return fmt.Errorf("failed to get/create player1 stats: %w", err)
	}

	if _, err := s.statsRepo.GetOrCreateStats(ctx, player2ID, gameType); err != nil {
		return fmt.Errorf("failed to get/create player2 stats: %w", err)
	}

	// Update player stats
	fmt.Printf("Updating player1 stats: won=%v, draw=%v, gameType=%s\n", player1Won, isDraw, gameType)
	if err := s.statsRepo.UpdateStats(ctx, player1ID, gameType, player1Won, isDraw); err != nil {
		fmt.Printf("ERROR updating player1 stats: %v\n", err)
		return fmt.Errorf("failed to update player1 stats: %w", err)
	}
	fmt.Printf("Player1 stats updated successfully\n")

	fmt.Printf("Updating player2 stats: won=%v, draw=%v, gameType=%s\n", player2Won, isDraw, gameType)
	if err := s.statsRepo.UpdateStats(ctx, player2ID, gameType, player2Won, isDraw); err != nil {
		fmt.Printf("ERROR updating player2 stats: %v\n", err)
		return fmt.Errorf("failed to update player2 stats: %w", err)
	}
	fmt.Printf("Player2 stats updated successfully\n")

	fmt.Printf("Stats updated - Player1: %d->%d ELO, Player2: %d->%d ELO\n",
		player1.EloRating, player1NewElo, player2.EloRating, player2NewElo)

	return nil
}

// calculateEloChange calculates new ELO ratings for both players
func (s *StatsService) calculateEloChange(player1Elo, player2Elo int, player1Won, player2Won, isDraw bool) (int, int) {
	// Calculate expected scores
	player1Expected := 1.0 / (1.0 + math.Pow(10, float64(player2Elo-player1Elo)/400.0))
	player2Expected := 1.0 / (1.0 + math.Pow(10, float64(player1Elo-player2Elo)/400.0))

	// Determine actual scores
	var player1Score, player2Score float64
	if isDraw {
		player1Score = 0.5
		player2Score = 0.5
	} else if player1Won {
		player1Score = 1.0
		player2Score = 0.0
	} else if player2Won {
		player1Score = 0.0
		player2Score = 1.0
	}

	// Calculate new ratings
	player1NewElo := player1Elo + int(math.Round(EloKFactor*(player1Score-player1Expected)))
	player2NewElo := player2Elo + int(math.Round(EloKFactor*(player2Score-player2Expected)))

	// Ensure ratings don't go below 100
	if player1NewElo < 100 {
		player1NewElo = 100
	}
	if player2NewElo < 100 {
		player2NewElo = 100
	}

	return player1NewElo, player2NewElo
}

// GetPlayerStats retrieves player statistics for a specific game type
func (s *StatsService) GetPlayerStats(ctx context.Context, userID uuid.UUID, gameType string) (*repository.PlayerStats, error) {
	return s.statsRepo.GetOrCreateStats(ctx, userID, gameType)
}

// GetAggregatedStats retrieves aggregated player statistics across all game types
func (s *StatsService) GetAggregatedStats(ctx context.Context, userID uuid.UUID) (*repository.PlayerStats, error) {
	// Get stats for all game types
	gameTypes := []string{"tictactoe", "connect4", "rps", "dotsandboxes"}
	
	aggregated := &repository.PlayerStats{
		ID:            uuid.New(),
		UserID:        userID,
		GameType:      "all",
		Wins:          0,
		Losses:        0,
		Draws:         0,
		CurrentStreak: 0,
		BestStreak:    0,
		TotalGames:    0,
	}
	
	for _, gameType := range gameTypes {
		stats, err := s.statsRepo.GetOrCreateStats(ctx, userID, gameType)
		if err != nil {
			continue // Skip if stats don't exist yet
		}
		
		aggregated.Wins += stats.Wins
		aggregated.Losses += stats.Losses
		aggregated.Draws += stats.Draws
		aggregated.TotalGames += stats.TotalGames
		
		// Take the highest streak values
		if stats.CurrentStreak > aggregated.CurrentStreak {
			aggregated.CurrentStreak = stats.CurrentStreak
		}
		if stats.BestStreak > aggregated.BestStreak {
			aggregated.BestStreak = stats.BestStreak
		}
	}
	
	return aggregated, nil
}

