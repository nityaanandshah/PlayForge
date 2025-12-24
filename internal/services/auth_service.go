package services

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/arenamatch/playforge/internal/domain"
	"github.com/arenamatch/playforge/internal/repository"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	userRepo    *repository.UserRepository
	redisClient *redis.Client
	jwtSecret   string
}

type Claims struct {
	UserID   string `json:"user_id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	jwt.RegisteredClaims
}

func NewAuthService(userRepo *repository.UserRepository, redisClient *redis.Client, jwtSecret string) *AuthService {
	return &AuthService{
		userRepo:    userRepo,
		redisClient: redisClient,
		jwtSecret:   jwtSecret,
	}
}

func (s *AuthService) Signup(ctx context.Context, req *domain.SignupRequest) (*domain.AuthResponse, error) {
	// Validate input
	if err := s.validateSignupRequest(req); err != nil {
		return nil, err
	}

	// Check if user already exists
	existingUser, _ := s.userRepo.GetByEmail(ctx, req.Email)
	if existingUser != nil {
		return nil, domain.ErrUserAlreadyExists
	}

	existingUser, _ = s.userRepo.GetByUsername(ctx, req.Username)
	if existingUser != nil {
		return nil, errors.New("username already taken")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create user
	user := &domain.User{
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Generate tokens
	accessToken, refreshToken, err := s.generateTokens(user)
	if err != nil {
		return nil, err
	}

	// Store refresh token in Redis
	if err := s.storeRefreshToken(ctx, user.ID.String(), refreshToken); err != nil {
		return nil, err
	}

	return &domain.AuthResponse{
		User:         user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

func (s *AuthService) Login(ctx context.Context, req *domain.LoginRequest) (*domain.AuthResponse, error) {
	// Get user by email
	user, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		if errors.Is(err, domain.ErrUserNotFound) {
			return nil, domain.ErrInvalidCredentials
		}
		return nil, err
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, domain.ErrInvalidCredentials
	}

	// Generate tokens
	accessToken, refreshToken, err := s.generateTokens(user)
	if err != nil {
		return nil, err
	}

	// Store refresh token in Redis
	if err := s.storeRefreshToken(ctx, user.ID.String(), refreshToken); err != nil {
		return nil, err
	}

	return &domain.AuthResponse{
		User:         user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

func (s *AuthService) RefreshToken(ctx context.Context, refreshToken string) (*domain.AuthResponse, error) {
	// Parse and validate refresh token
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(refreshToken, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.jwtSecret), nil
	})

	if err != nil || !token.Valid {
		return nil, domain.ErrInvalidToken
	}

	// Check if refresh token exists in Redis
	storedToken, err := s.redisClient.Get(ctx, fmt.Sprintf("refresh_token:%s", claims.UserID)).Result()
	if err != nil || storedToken != refreshToken {
		return nil, domain.ErrInvalidToken
	}

	// Get user
	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		return nil, domain.ErrInvalidToken
	}

	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Generate new tokens
	newAccessToken, newRefreshToken, err := s.generateTokens(user)
	if err != nil {
		return nil, err
	}

	// Update refresh token in Redis
	if err := s.storeRefreshToken(ctx, user.ID.String(), newRefreshToken); err != nil {
		return nil, err
	}

	return &domain.AuthResponse{
		User:         user,
		AccessToken:  newAccessToken,
		RefreshToken: newRefreshToken,
	}, nil
}

func (s *AuthService) Logout(ctx context.Context, userID string) error {
	// Delete refresh token from Redis
	return s.redisClient.Del(ctx, fmt.Sprintf("refresh_token:%s", userID)).Err()
}

func (s *AuthService) GetUserByID(ctx context.Context, userID string) (*domain.User, error) {
	id, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %w", err)
	}
	
	return s.userRepo.GetByID(ctx, id)
}

func (s *AuthService) ValidateToken(tokenString string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.jwtSecret), nil
	})

	if err != nil || !token.Valid {
		return nil, domain.ErrInvalidToken
	}

	return claims, nil
}

func (s *AuthService) generateTokens(user *domain.User) (string, string, error) {
	// Access token (15 minutes)
	accessClaims := &Claims{
		UserID:   user.ID.String(),
		Username: user.Username,
		Email:    user.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessTokenString, err := accessToken.SignedString([]byte(s.jwtSecret))
	if err != nil {
		return "", "", fmt.Errorf("failed to sign access token: %w", err)
	}

	// Refresh token (7 days)
	refreshClaims := &Claims{
		UserID:   user.ID.String(),
		Username: user.Username,
		Email:    user.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshTokenString, err := refreshToken.SignedString([]byte(s.jwtSecret))
	if err != nil {
		return "", "", fmt.Errorf("failed to sign refresh token: %w", err)
	}

	return accessTokenString, refreshTokenString, nil
}

func (s *AuthService) storeRefreshToken(ctx context.Context, userID, token string) error {
	key := fmt.Sprintf("refresh_token:%s", userID)
	return s.redisClient.Set(ctx, key, token, 7*24*time.Hour).Err()
}

// UpdateProfile updates user profile information
func (s *AuthService) UpdateProfile(ctx context.Context, userID uuid.UUID, req *domain.UpdateProfileRequest) (*domain.User, error) {
	// Get current user
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Check if username is being changed and if it's already taken
	if req.Username != "" && req.Username != user.Username {
		existingUser, _ := s.userRepo.GetByUsername(ctx, req.Username)
		if existingUser != nil {
			return nil, errors.New("username already taken")
		}
		user.Username = req.Username
	}

	// Update user
	err = s.userRepo.Update(ctx, user)
	if err != nil {
		return nil, fmt.Errorf("failed to update profile: %w", err)
	}

	return user, nil
}

// ChangePassword changes user's password
func (s *AuthService) ChangePassword(ctx context.Context, userID uuid.UUID, req *domain.ChangePasswordRequest) error {
	// Get user
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return err
	}

	// Verify current password
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.CurrentPassword))
	if err != nil {
		return domain.ErrInvalidCredentials
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	// Update password
	user.PasswordHash = string(hashedPassword)
	err = s.userRepo.Update(ctx, user)
	if err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	return nil
}

// GetPublicProfile retrieves a user's public profile by username
func (s *AuthService) GetPublicProfile(ctx context.Context, username string) (*domain.PublicProfile, error) {
	user, err := s.userRepo.GetByUsername(ctx, username)
	if err != nil {
		return nil, err
	}

	return &domain.PublicProfile{
		UserID:    user.ID,
		Username:  user.Username,
		EloRating: user.EloRating,
	}, nil
}

func (s *AuthService) validateSignupRequest(req *domain.SignupRequest) error {
	if len(req.Username) < 3 || len(req.Username) > 20 {
		return errors.New("username must be between 3 and 20 characters")
	}

	if len(req.Email) < 5 || !isValidEmail(req.Email) {
		return errors.New("invalid email format")
	}

	if len(req.Password) < 8 {
		return errors.New("password must be at least 8 characters")
	}

	return nil
}

func isValidEmail(email string) bool {
	// Simple email validation
	return len(email) > 0 && len(email) < 255
}


