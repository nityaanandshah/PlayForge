package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"sort"
	"time"

	"github.com/arenamatch/playforge/internal/domain"
	"github.com/arenamatch/playforge/internal/repository"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

const (
	tournamentKeyPrefix = "tournament:" // tournament:{tournament_id}
	tournamentTTL       = 24 * time.Hour // Tournaments expire after 24 hours
)

type TournamentService struct {
	tournamentRepo *repository.TournamentRepository
	userRepo       *repository.UserRepository
	roomService    *RoomService
	gameService    *GameService
	redisClient    *redis.Client
}

func NewTournamentService(
	tournamentRepo *repository.TournamentRepository,
	userRepo *repository.UserRepository,
	roomService *RoomService,
	gameService *GameService,
	redisClient *redis.Client,
) *TournamentService {
	return &TournamentService{
		tournamentRepo: tournamentRepo,
		userRepo:       userRepo,
		roomService:    roomService,
		gameService:    gameService,
		redisClient:    redisClient,
	}
}

// CreateTournament creates a new tournament
func (s *TournamentService) CreateTournament(ctx context.Context, userID uuid.UUID, username string, req domain.CreateTournamentRequest) (*domain.Tournament, error) {
	// Validate max participants (must be power of 2 for single elimination)
	if req.TournamentType == domain.TournamentTypeSingleElimination {
		if !isPowerOfTwo(req.MaxParticipants) {
			return nil, fmt.Errorf("max participants must be a power of 2 for single elimination (4, 8, 16, 32)")
		}
	}

	// Create a room for the tournament
	roomReq := domain.CreateRoomRequest{
		GameType:     req.GameType,
		Type:         domain.RoomTypePrivate,
		MaxPlayers:   req.MaxParticipants,
		GameSettings: req.GameSettings,
	}

	room, err := s.roomService.CreateRoom(ctx, userID, username, roomReq)
	if err != nil {
		return nil, fmt.Errorf("failed to create tournament room: %w", err)
	}

	// Get creator's user info
	creator, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get creator info: %w", err)
	}

	// Generate join code for private tournaments
	joinCode := ""
	if req.IsPrivate {
		joinCode = room.JoinCode // Use the room's join code for the tournament
	}

	// Create tournament with creator as first participant
	tournament := &domain.Tournament{
		RoomID:          room.ID,
		Name:            req.Name,
		GameType:        req.GameType,
		TournamentType:  req.TournamentType,
		Status:          domain.TournamentStatusPending,
		MaxParticipants: req.MaxParticipants,
		IsPrivate:       req.IsPrivate,
		JoinCode:        joinCode,
		CreatedBy:       userID,
		Participants: []domain.TournamentParticipant{
			{
				UserID:       userID,
				Username:     username,
				Seed:         1,
				EloRating:    creator.EloRating,
				IsEliminated: false,
				JoinedAt:     time.Now(),
			},
		},
		CurrentRound: 0,
	}

	// Calculate total rounds for single elimination
	if req.TournamentType == domain.TournamentTypeSingleElimination {
		tournament.TotalRounds = int(math.Log2(float64(req.MaxParticipants)))
	}

	err = s.tournamentRepo.Create(ctx, tournament)
	if err != nil {
		fmt.Printf("TournamentRepo.Create error: %v\n", err)
		return nil, fmt.Errorf("failed to create tournament: %w", err)
	}

	// Cache tournament in Redis
	err = s.saveTournamentToCache(ctx, tournament)
	if err != nil {
		fmt.Printf("saveTournamentToCache error: %v\n", err)
		return nil, fmt.Errorf("failed to cache tournament: %w", err)
	}

	return tournament, nil
}

// JoinTournament allows a user to join a tournament
func (s *TournamentService) JoinTournament(ctx context.Context, tournamentID uuid.UUID, userID uuid.UUID, joinCode string) (*domain.Tournament, error) {
	tournament, err := s.GetTournament(ctx, tournamentID)
	if err != nil {
		return nil, err
	}

	// Check if tournament has already started
	if tournament.Status != domain.TournamentStatusPending {
		return nil, domain.ErrTournamentAlreadyStarted
	}

	// Validate join code for private tournaments
	if tournament.IsPrivate {
		if joinCode == "" || joinCode != tournament.JoinCode {
			return nil, fmt.Errorf("invalid join code")
		}
	}

	// Get room to check capacity
	room, err := s.roomService.GetRoom(ctx, tournament.RoomID)
	if err != nil {
		return nil, err
	}

	// Check if already joined
	for _, p := range tournament.Participants {
		if p.UserID == userID {
			return tournament, nil // Already joined
		}
	}

	// Check if full
	if len(room.Participants) >= room.MaxPlayers {
		return nil, domain.ErrTournamentFull
	}

	// Get user info
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Join the room first
	err = s.roomService.JoinRoom(ctx, room.ID, userID, user.Username)
	if err != nil {
		return nil, err
	}

	// Add participant to tournament
	participant := domain.TournamentParticipant{
		UserID:       userID,
		Username:     user.Username,
		Seed:         len(tournament.Participants) + 1,
		EloRating:    user.EloRating,
		IsEliminated: false,
		JoinedAt:     time.Now(),
	}

	tournament.Participants = append(tournament.Participants, participant)

	// Save to cache
	err = s.saveTournamentToCache(ctx, tournament)
	if err != nil {
		return nil, err
	}

	return tournament, nil
}

// StartTournament starts the tournament and generates bracket
func (s *TournamentService) StartTournament(ctx context.Context, tournamentID uuid.UUID, userID uuid.UUID) (*domain.Tournament, error) {
	tournament, err := s.GetTournament(ctx, tournamentID)
	if err != nil {
		return nil, err
	}

	// Check if user is the host
	if tournament.CreatedBy != userID {
		return nil, domain.ErrNotTournamentHost
	}

	// Check if already started
	if tournament.Status != domain.TournamentStatusPending {
		return nil, domain.ErrTournamentAlreadyStarted
	}

	// Check if tournament is full
	if len(tournament.Participants) < tournament.MaxParticipants {
		return nil, fmt.Errorf("tournament is not full yet (%d/%d participants)", len(tournament.Participants), tournament.MaxParticipants)
	}

	// For single elimination, must have power of 2 participants
	if tournament.TournamentType == domain.TournamentTypeSingleElimination {
		if !isPowerOfTwo(len(tournament.Participants)) {
			return nil, fmt.Errorf("must have a power of 2 participants (current: %d)", len(tournament.Participants))
		}
	}

	// Generate bracket
	bracket, err := s.generateBracket(ctx, tournament)
	if err != nil {
		return nil, fmt.Errorf("failed to generate bracket: %w", err)
	}

	tournament.BracketData = bracket
	tournament.Status = domain.TournamentStatusInProgress
	tournament.CurrentRound = 1
	now := time.Now()
	tournament.StartedAt = &now

	// Update in database
	err = s.tournamentRepo.Update(ctx, tournament)
	if err != nil {
		return nil, fmt.Errorf("failed to update tournament: %w", err)
	}

	// Update cache
	err = s.saveTournamentToCache(ctx, tournament)
	if err != nil {
		return nil, err
	}

	// Create database records for all matches
	err = s.createTournamentMatches(ctx, tournament)
	if err != nil {
		return nil, fmt.Errorf("failed to create tournament matches: %w", err)
	}

	return tournament, nil
}

// generateBracket generates the tournament bracket based on tournament type
func (s *TournamentService) generateBracket(ctx context.Context, tournament *domain.Tournament) (*domain.BracketData, error) {
	switch tournament.TournamentType {
	case domain.TournamentTypeSingleElimination:
		return s.generateSingleEliminationBracket(tournament)
	default:
		return nil, fmt.Errorf("unsupported tournament type: %s", tournament.TournamentType)
	}
}

// generateSingleEliminationBracket generates a single elimination bracket
func (s *TournamentService) generateSingleEliminationBracket(tournament *domain.Tournament) (*domain.BracketData, error) {
	participants := tournament.Participants
	numParticipants := len(participants)
	
	// Sort participants by seed (already assigned in order of joining, but can be reseeded by ELO)
	sort.Slice(participants, func(i, j int) bool {
		return participants[i].Seed < participants[j].Seed
	})

	totalRounds := int(math.Log2(float64(numParticipants)))
	bracket := &domain.BracketData{
		Rounds: make([]domain.BracketRound, totalRounds),
	}

	// Generate all rounds
	for round := 0; round < totalRounds; round++ {
		roundNumber := round + 1
		matchesInRound := int(math.Pow(2, float64(totalRounds-round-1)))
		
		roundName := getRoundName(roundNumber, totalRounds)
		
		bracket.Rounds[round] = domain.BracketRound{
			RoundNumber: roundNumber,
			RoundName:   roundName,
			Matches:     make([]domain.BracketMatch, matchesInRound),
		}

		for matchIdx := 0; matchIdx < matchesInRound; matchIdx++ {
			match := domain.BracketMatch{
				MatchNumber: matchIdx + 1,
				Status:      domain.TournamentMatchStatusPending,
			}

			// First round: assign participants
			if round == 0 {
				player1Idx := matchIdx * 2
				player2Idx := matchIdx*2 + 1

				if player1Idx < numParticipants {
					match.Player1ID = &participants[player1Idx].UserID
					match.Player1Name = participants[player1Idx].Username
				}
				if player2Idx < numParticipants {
					match.Player2ID = &participants[player2Idx].UserID
					match.Player2Name = participants[player2Idx].Username
				}

				// If both players assigned, match is ready
				if match.Player1ID != nil && match.Player2ID != nil {
					match.Status = domain.TournamentMatchStatusReady
				}
			}

			// Calculate which match the winner advances to
			if round < totalRounds-1 {
				nextMatchNumber := (matchIdx / 2) + 1
				match.AdvancesToMatch = &nextMatchNumber
			}

			bracket.Rounds[round].Matches[matchIdx] = match
		}
	}

	return bracket, nil
}

// createTournamentMatches creates database records for all tournament matches
func (s *TournamentService) createTournamentMatches(ctx context.Context, tournament *domain.Tournament) error {
	if tournament.BracketData == nil {
		return domain.ErrInvalidBracket
	}

	for _, round := range tournament.BracketData.Rounds {
		for _, bracketMatch := range round.Matches {
			match := &domain.TournamentMatch{
				TournamentID: tournament.ID,
				Round:        round.RoundNumber,
				MatchNumber:  bracketMatch.MatchNumber,
				Player1ID:    bracketMatch.Player1ID,
				Player2ID:    bracketMatch.Player2ID,
				Status:       bracketMatch.Status,
			}

			err := s.tournamentRepo.CreateMatch(ctx, match)
			if err != nil {
				return err
			}
		}
	}

	return nil
}

// AdvanceWinner advances the winner to the next round
func (s *TournamentService) AdvanceWinner(ctx context.Context, tournamentID uuid.UUID, matchID uuid.UUID, winnerID uuid.UUID) error {
	tournament, err := s.GetTournament(ctx, tournamentID)
	if err != nil {
		return err
	}

	if tournament.BracketData == nil {
		return domain.ErrInvalidBracket
	}

	// Find the match and update winner
	var currentRound int
	var currentMatchNumber int
	var advancesToMatch *int
	found := false

	for roundIdx, round := range tournament.BracketData.Rounds {
		for matchIdx, match := range round.Matches {
			if match.MatchID != nil && *match.MatchID == matchID {
				tournament.BracketData.Rounds[roundIdx].Matches[matchIdx].WinnerID = &winnerID
				tournament.BracketData.Rounds[roundIdx].Matches[matchIdx].Status = domain.TournamentMatchStatusComplete
				currentRound = round.RoundNumber
				currentMatchNumber = match.MatchNumber
				advancesToMatch = match.AdvancesToMatch
				found = true
				break
			}
		}
		if found {
			break
		}
	}

	if !found {
		return fmt.Errorf("match not found in bracket")
	}

	// If there's a next match, advance the winner
	if advancesToMatch != nil && currentRound < len(tournament.BracketData.Rounds) {
		nextRoundIdx := currentRound // 0-indexed
		nextMatchIdx := *advancesToMatch - 1

		// Determine if winner goes to player1 or player2 slot
		if currentMatchNumber%2 == 1 {
			// Odd match number -> player 1 of next match
			tournament.BracketData.Rounds[nextRoundIdx].Matches[nextMatchIdx].Player1ID = &winnerID
			for _, p := range tournament.Participants {
				if p.UserID == winnerID {
					tournament.BracketData.Rounds[nextRoundIdx].Matches[nextMatchIdx].Player1Name = p.Username
					break
				}
			}
		} else {
			// Even match number -> player 2 of next match
			tournament.BracketData.Rounds[nextRoundIdx].Matches[nextMatchIdx].Player2ID = &winnerID
			for _, p := range tournament.Participants {
				if p.UserID == winnerID {
					tournament.BracketData.Rounds[nextRoundIdx].Matches[nextMatchIdx].Player2Name = p.Username
					break
				}
			}
		}

		// Check if next match is now ready
		nextMatch := &tournament.BracketData.Rounds[nextRoundIdx].Matches[nextMatchIdx]
		if nextMatch.Player1ID != nil && nextMatch.Player2ID != nil {
			nextMatch.Status = domain.TournamentMatchStatusReady
		}
	} else if advancesToMatch == nil {
		// This was the final match
		tournament.WinnerID = &winnerID
		tournament.Status = domain.TournamentStatusComplete
		now := time.Now()
		tournament.EndedAt = &now
	}

	// Update in database
	err = s.tournamentRepo.Update(ctx, tournament)
	if err != nil {
		return err
	}

	// Update cache
	err = s.saveTournamentToCache(ctx, tournament)
	if err != nil {
		return err
	}

	return nil
}

// GetTournament retrieves a tournament by ID (checks cache first, then DB)
func (s *TournamentService) GetTournament(ctx context.Context, tournamentID uuid.UUID) (*domain.Tournament, error) {
	// Try cache first
	tournament, err := s.getTournamentFromCache(ctx, tournamentID)
	if err == nil && tournament != nil {
		return tournament, nil
	}

	// Fallback to database
	tournament, err = s.tournamentRepo.GetByID(ctx, tournamentID)
	if err != nil {
		log.Printf("Failed to get tournament from DB: %v", err)
		return nil, err
	}

	// Initialize participants to empty slice if nil
	if tournament.Participants == nil {
		tournament.Participants = []domain.TournamentParticipant{}
	}

	// Populate participants from room
	room, err := s.roomService.GetRoom(ctx, tournament.RoomID)
	if err == nil {
		for _, roomParticipant := range room.Participants {
			// Check if participant already in tournament
			found := false
			for _, tournamentParticipant := range tournament.Participants {
				if tournamentParticipant.UserID == roomParticipant.UserID {
					found = true
					break
				}
			}
			if !found {
				user, err := s.userRepo.GetByID(ctx, roomParticipant.UserID)
				if err == nil {
					tournament.Participants = append(tournament.Participants, domain.TournamentParticipant{
						UserID:       roomParticipant.UserID,
						Username:     roomParticipant.Username,
						Seed:         len(tournament.Participants) + 1,
						EloRating:    user.EloRating,
						IsEliminated: false,
						JoinedAt:     roomParticipant.JoinedAt,
					})
				}
			}
		}
	} else {
		log.Printf("Warning: Failed to get room for tournament %s: %v", tournamentID, err)
	}

	// Cache it
	s.saveTournamentToCache(ctx, tournament)

	return tournament, nil
}

// ListTournaments retrieves all tournaments
func (s *TournamentService) ListTournaments(ctx context.Context, status *domain.TournamentStatus, limit int) ([]domain.Tournament, error) {
	tournaments, err := s.tournamentRepo.List(ctx, status, limit)
	if err != nil {
		return nil, err
	}

	// Load participants for each tournament from cache
	for i := range tournaments {
		// Initialize participants to empty slice if nil
		if tournaments[i].Participants == nil {
			tournaments[i].Participants = []domain.TournamentParticipant{}
		}
		
		// Try to get from cache first (which has participants)
		cachedTournament, err := s.getTournamentFromCache(ctx, tournaments[i].ID)
		if err == nil && cachedTournament != nil && cachedTournament.Participants != nil {
			tournaments[i].Participants = cachedTournament.Participants
		}
	}

	return tournaments, nil
}

// saveTournamentToCache saves tournament to Redis cache
func (s *TournamentService) saveTournamentToCache(ctx context.Context, tournament *domain.Tournament) error {
	key := tournamentKeyPrefix + tournament.ID.String()
	data, err := json.Marshal(tournament)
	if err != nil {
		return err
	}

	return s.redisClient.Set(ctx, key, data, tournamentTTL).Err()
}

// getTournamentFromCache retrieves tournament from Redis cache
func (s *TournamentService) getTournamentFromCache(ctx context.Context, tournamentID uuid.UUID) (*domain.Tournament, error) {
	key := tournamentKeyPrefix + tournamentID.String()
	data, err := s.redisClient.Get(ctx, key).Bytes()
	if err != nil {
		return nil, err
	}

	var tournament domain.Tournament
	err = json.Unmarshal(data, &tournament)
	if err != nil {
		return nil, err
	}

	return &tournament, nil
}

// Helper functions

func isPowerOfTwo(n int) bool {
	return n > 0 && (n&(n-1)) == 0
}

func getRoundName(roundNumber int, totalRounds int) string {
	if roundNumber == totalRounds {
		return "Finals"
	}
	if roundNumber == totalRounds-1 {
		return "Semifinals"
	}
	if roundNumber == totalRounds-2 {
		return "Quarterfinals"
	}
	return fmt.Sprintf("Round %d", roundNumber)
}

