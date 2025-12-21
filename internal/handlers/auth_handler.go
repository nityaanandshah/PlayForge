package handlers

import (
	"errors"
	"strings"

	"github.com/arenamatch/playforge/internal/domain"
	"github.com/arenamatch/playforge/internal/services"
	"github.com/gofiber/fiber/v2"
)

type AuthHandler struct {
	authService *services.AuthService
}

func NewAuthHandler(authService *services.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
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

	if err := h.authService.Logout(c.Context(), userID.(string)); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Logout failed")
	}

	return c.JSON(fiber.Map{"message": "Logged out successfully"})
}

func (h *AuthHandler) GetMe(c *fiber.Ctx) error {
	userID := c.Locals("userID")
	if userID == nil {
		return fiber.NewError(fiber.StatusUnauthorized, "Unauthorized")
	}

	user, err := h.authService.GetUserByID(c.Context(), userID.(string))
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, "Failed to get user")
	}

	return c.JSON(user)
}


