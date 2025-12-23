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
	
	// Tournament ELO multipliers - progressive bonuses for advancing
	TournamentRound1Multiplier  = 0.8  // Round 1: 80% normal (encourages participation)
	TournamentRound2Multiplier  = 1.2  // Quarterfinals: 120% normal
	TournamentRound3Multiplier  = 1.5  // Semifinals: 150% normal
	TournamentFinalsMultiplier  = 2.0  // Finals: 200% normal (double stakes!)
	
	// Tournament loss reduction - losers lose less ELO
	TournamentLossPenalty = 0.5  // Tournament losses only cost 50% normal ELO
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
	return s.updateGameStatsWithContext(ctx, gameType, player1ID, player2ID, winnerID, false, 0)
}

// UpdateTournamentGameStats updates player stats with tournament-specific bonuses
func (s *StatsService) UpdateTournamentGameStats(ctx context.Context, gameType string, player1ID, player2ID uuid.UUID, winnerID *uuid.UUID, tournamentRound int) error {
	return s.updateGameStatsWithContext(ctx, gameType, player1ID, player2ID, winnerID, true, tournamentRound)
}

// updateGameStatsWithContext is the internal implementation that handles both casual and tournament games
func (s *StatsService) updateGameStatsWithContext(ctx context.Context, gameType string, player1ID, player2ID uuid.UUID, winnerID *uuid.UUID, isTournament bool, tournamentRound int) error {
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
	var player1NewElo, player2NewElo int
	if isTournament {
		// Tournament games with progressive bonuses
		player1NewElo, player2NewElo = s.calculateTournamentEloChange(
			player1.EloRating,
			player2.EloRating,
			player1Won,
			player2Won,
			isDraw,
			tournamentRound,
		)
	} else {
		// Regular casual games
		player1NewElo, player2NewElo = s.calculateEloChange(
			player1.EloRating,
			player2.EloRating,
			player1Won,
			player2Won,
			isDraw,
		)
	}

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
	if err := s.statsRepo.UpdateStats(ctx, player1ID, gameType, player1Won, isDraw); err != nil {
		return fmt.Errorf("failed to update player1 stats: %w", err)
	}

	if err := s.statsRepo.UpdateStats(ctx, player2ID, gameType, player2Won, isDraw); err != nil {
		return fmt.Errorf("failed to update player2 stats: %w", err)
	}

	if isTournament {
		roundName := getTournamentRoundName(tournamentRound)
		fmt.Printf("Tournament %s - Stats updated - Player1: %d->%d ELO (%+d), Player2: %d->%d ELO (%+d)\n",
			roundName,
			player1.EloRating, player1NewElo, player1NewElo-player1.EloRating,
			player2.EloRating, player2NewElo, player2NewElo-player2.EloRating)
	} else {
		fmt.Printf("Casual game - Stats updated - Player1: %d->%d ELO, Player2: %d->%d ELO\n",
			player1.EloRating, player1NewElo, player2.EloRating, player2NewElo)
	}

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

// calculateTournamentEloChange calculates ELO for tournament games with progressive bonuses
func (s *StatsService) calculateTournamentEloChange(player1Elo, player2Elo int, player1Won, player2Won, isDraw bool, tournamentRound int) (int, int) {
	// Calculate expected scores (same as regular)
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

	// Get tournament multiplier based on round
	multiplier := getTournamentMultiplier(tournamentRound)

	// Calculate base ELO changes
	player1Change := EloKFactor * (player1Score - player1Expected)
	player2Change := EloKFactor * (player2Score - player2Expected)

	// Apply tournament multipliers
	// Winners get bonus, losers get reduced penalty
	if player1Score > player2Score {
		// Player 1 won
		player1Change *= multiplier           // Bonus for winner
		player2Change *= TournamentLossPenalty // Reduced loss for loser
	} else if player2Score > player1Score {
		// Player 2 won
		player2Change *= multiplier           // Bonus for winner
		player1Change *= TournamentLossPenalty // Reduced loss for loser
	} else {
		// Draw - apply moderate multiplier
		player1Change *= (multiplier + 1.0) / 2.0
		player2Change *= (multiplier + 1.0) / 2.0
	}

	// Calculate new ratings
	player1NewElo := player1Elo + int(math.Round(player1Change))
	player2NewElo := player2Elo + int(math.Round(player2Change))

	// Ensure ratings don't go below 100
	if player1NewElo < 100 {
		player1NewElo = 100
	}
	if player2NewElo < 100 {
		player2NewElo = 100
	}

	return player1NewElo, player2NewElo
}

// getTournamentMultiplier returns the ELO multiplier based on tournament round
func getTournamentMultiplier(round int) float64 {
	switch round {
	case 1:
		return TournamentRound1Multiplier // 0.8x - encourages entry
	case 2:
		return TournamentRound2Multiplier // 1.2x - quarterfinals
	case 3:
		return TournamentRound3Multiplier // 1.5x - semifinals
	case 4:
		return TournamentFinalsMultiplier // 2.0x - finals
	default:
		if round >= 5 {
			return TournamentFinalsMultiplier // Any round 5+ is finals
		}
		return 1.0 // Default
	}
}

// getTournamentRoundName returns a human-readable name for the round
func getTournamentRoundName(round int) string {
	switch round {
	case 1:
		return "Round 1"
	case 2:
		return "Quarterfinals"
	case 3:
		return "Semifinals"
	case 4:
		return "Finals"
	default:
		return fmt.Sprintf("Round %d", round)
	}
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

// GetLeaderboard retrieves the leaderboard for a specific game type or globally
func (s *StatsService) GetLeaderboard(ctx context.Context, gameType string, limit int) ([]repository.LeaderboardEntry, error) {
	if limit <= 0 || limit > 100 {
		limit = 50 // Default to 50, max 100
	}
	return s.statsRepo.GetLeaderboard(ctx, gameType, limit)
}

// GetMatchHistory retrieves match history for a user
func (s *StatsService) GetMatchHistory(ctx context.Context, userID uuid.UUID, gameType string, limit int) ([]repository.MatchHistoryEntry, error) {
	if limit <= 0 || limit > 100 {
		limit = 50 // Default to 50, max 100
	}
	return s.statsRepo.GetMatchHistory(ctx, userID, gameType, limit)
}

