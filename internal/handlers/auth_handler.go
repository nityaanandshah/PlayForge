package handlers

import (
	"errors"
	"strings"

	"github.com/arenamatch/playforge/internal/domain"
	"github.com/arenamatch/playforge/internal/services"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type AuthHandler struct {
	authService *services.AuthService
}

func NewAuthHandler(authService *services.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

// Helper function to get user ID from fiber context
func getUserIDFromContext(c *fiber.Ctx) (uuid.UUID, error) {
	userID := c.Locals("userID")
	if userID == nil {
		return uuid.Nil, errors.New("user ID not found in context")
	}

	userUUID, ok := userID.(uuid.UUID)
	if !ok {
		return uuid.Nil, errors.New("invalid user ID format")
	}

	return userUUID, nil
}

func (h *AuthHandler) Signup(c *fiber.Ctx) error {
	var req domain.SignupRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid request body")
	}

	resp, err := h.authService.Signup(c.Context(), &req)
	if err != nil {
		if errors.Is(err, domain.ErrUserAlreadyExists) || strings.Contains(err.Error(), "already taken") {
			return fiber.NewError(fiber.StatusConflict, err.Error())
		}
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	return c.Status(fiber.StatusCreated).JSON(resp)
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req domain.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid request body")
	}

	resp, err := h.authService.Login(c.Context(), &req)
	if err != nil {
		if errors.Is(err, domain.ErrInvalidCredentials) {
			return fiber.NewError(fiber.StatusUnauthorized, "Invalid credentials")
		}
		return fiber.NewError(fiber.StatusInternalServerError, "Login failed")
	}

	return c.JSON(resp)
}

func (h *AuthHandler) RefreshToken(c *fiber.Ctx) error {
	var req domain.RefreshTokenRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid request body")
	}

	resp, err := h.authService.RefreshToken(c.Context(), req.RefreshToken)
	if err != nil {
		if errors.Is(err, domain.ErrInvalidToken) {
			return fiber.NewError(fiber.StatusUnauthorized, "Invalid refresh token")
		}
		return fiber.NewError(fiber.StatusInternalServerError, "Token refresh failed")
	}

	return c.JSON(resp)
}

func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	// Extract user ID from JWT claims (middleware should set this)
	userID := c.Locals("userID")
	if userID == nil {
		return fiber.NewError(fiber.StatusUnauthorized, "Unauthorized")
	}

	userUUID, ok := userID.(uuid.UUID)
	if !ok {
		return fiber.NewError(fiber.StatusUnauthorized, "Invalid user ID")
	}

	if err := h.authService.Logout(c.Context(), userUUID.String()); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Logout failed")
	}

	return c.JSON(fiber.Map{"message": "Logged out successfully"})
}

func (h *AuthHandler) GetMe(c *fiber.Ctx) error {
	userID := c.Locals("userID")
	if userID == nil {
		return fiber.NewError(fiber.StatusUnauthorized, "Unauthorized")
	}

	userUUID, ok := userID.(uuid.UUID)
	if !ok {
		return fiber.NewError(fiber.StatusUnauthorized, "Invalid user ID")
	}

	user, err := h.authService.GetUserByID(c.Context(), userUUID.String())
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to get user")
	}

	return c.JSON(user)
}

// UpdateProfile updates user profile
func (h *AuthHandler) UpdateProfile(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	var req domain.UpdateProfileRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	user, err := h.authService.UpdateProfile(c.Context(), userID, &req)
	if err != nil {
		if strings.Contains(err.Error(), "already taken") {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": err.Error(),
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to update profile",
		})
	}

	return c.JSON(fiber.Map{
		"user":    user,
		"message": "profile updated successfully",
	})
}

// ChangePassword changes user password
func (h *AuthHandler) ChangePassword(c *fiber.Ctx) error {
	userID, err := getUserIDFromContext(c)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "unauthorized",
		})
	}

	var req domain.ChangePasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "invalid request body",
		})
	}

	err = h.authService.ChangePassword(c.Context(), userID, &req)
	if err != nil {
		if errors.Is(err, domain.ErrInvalidCredentials) {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "current password is incorrect",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to change password",
		})
	}

	return c.JSON(fiber.Map{
		"message": "password changed successfully",
	})
}

// GetPublicProfile retrieves a user's public profile
func (h *AuthHandler) GetPublicProfile(c *fiber.Ctx) error {
	username := c.Params("username")
	if username == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "username is required",
		})
	}

	profile, err := h.authService.GetPublicProfile(c.Context(), username)
	if err != nil {
		if errors.Is(err, domain.ErrUserNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "user not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "failed to get profile",
		})
	}

	return c.JSON(profile)
}


