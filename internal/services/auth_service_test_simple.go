package services

import (
	"testing"

	"github.com/arenamatch/playforge/internal/domain"
	"github.com/stretchr/testify/assert"
	"golang.org/x/crypto/bcrypt"
)

// TestPasswordHashingSimple tests password hashing without mocks
func TestPasswordHashingSimple(t *testing.T) {
	t.Run("Hash and Verify Password", func(t *testing.T) {
		password := "securepassword123"

		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)

		assert.NoError(t, err)
		assert.NotEmpty(t, hashedPassword)
		assert.NotEqual(t, password, string(hashedPassword))

		// Verify correct password
		err = bcrypt.CompareHashAndPassword(hashedPassword, []byte(password))
		assert.NoError(t, err)

		// Verify wrong password
		err = bcrypt.CompareHashAndPassword(hashedPassword, []byte("wrongpassword"))
		assert.Error(t, err)
	})

	t.Run("Different Hashes for Same Password", func(t *testing.T) {
		password := "testpassword"

		hash1, err1 := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		hash2, err2 := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)

		assert.NoError(t, err1)
		assert.NoError(t, err2)
		assert.NotEqual(t, hash1, hash2) // Bcrypt adds salt, so hashes differ
	})
}

// TestValidateSignupRequest tests signup validation logic
func TestValidateSignupRequest(t *testing.T) {
	authService := &AuthService{}

	t.Run("Short Username", func(t *testing.T) {
		err := authService.validateSignupRequest(&domain.SignupRequest{
			Username: "ab",
			Email:    "test@example.com",
			Password: "password123",
		})
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "username")
	})

	t.Run("Short Password", func(t *testing.T) {
		err := authService.validateSignupRequest(&domain.SignupRequest{
			Username: "testuser",
			Email:    "test@example.com",
			Password: "short",
		})
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "password")
	})
}

