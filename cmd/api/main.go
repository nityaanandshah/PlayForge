package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/arenamatch/playforge/internal/config"
	"github.com/arenamatch/playforge/internal/database"
	"github.com/arenamatch/playforge/internal/handlers"
	"github.com/arenamatch/playforge/internal/middleware"
	"github.com/arenamatch/playforge/internal/repository"
	"github.com/arenamatch/playforge/internal/services"
	ws "github.com/arenamatch/playforge/internal/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize database connections
	ctx := context.Background()
	
	pgPool, err := database.NewPostgresPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to PostgreSQL: %v", err)
	}
	defer pgPool.Close()

	redisClient := database.NewRedisClient(cfg.RedisURL)
	defer redisClient.Close()

	// Initialize repositories
	userRepo := repository.NewUserRepository(pgPool)
	statsRepo := repository.NewStatsRepository(pgPool)

	// Initialize services
	authService := services.NewAuthService(userRepo, redisClient, cfg.JWTSecret)
	statsService := services.NewStatsService(statsRepo, userRepo)
	gameService := services.NewGameService(redisClient, statsService)
	roomService := services.NewRoomService(redisClient)
	matchmakingService := services.NewMatchmakingService(redisClient, roomService)

	// Start matchmaking worker
	matchmakingCtx, cancelMatchmaking := context.WithCancel(ctx)
	defer cancelMatchmaking()
	go matchmakingService.StartMatchmakingWorker(matchmakingCtx)

	// Initialize WebSocket hub
	hub := ws.NewHub()
	go hub.Run()

	// Initialize WebSocket handler
	wsHandler := ws.NewHandler(hub, authService, gameService, roomService, matchmakingService)

	// Initialize Fiber app
	app := fiber.New(fiber.Config{
		ErrorHandler: handlers.CustomErrorHandler,
		ReadTimeout:  time.Second * 10,
		WriteTimeout: time.Second * 10,
	})

	// Middleware
	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.CORSOrigins,
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization",
		AllowCredentials: true,
	}))

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService)
	gameHandler := handlers.NewGameHandler(gameService, hub)
	statsHandler := handlers.NewStatsHandler(statsService, authService)
	roomHandler := handlers.NewRoomHandler(roomService, gameService)
	matchmakingHandler := handlers.NewMatchmakingHandler(matchmakingService)

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status": "ok",
			"time":   time.Now().Format(time.RFC3339),
		})
	})

	// API routes
	api := app.Group("/api/v1")
	
	// Auth routes
	auth := api.Group("/auth")
	auth.Post("/signup", authHandler.Signup)
	auth.Post("/login", authHandler.Login)
	auth.Post("/refresh", authHandler.RefreshToken)
	auth.Post("/logout", authHandler.Logout)
	auth.Get("/me", middleware.AuthRequired(authService), authHandler.GetMe)

	// Game routes (protected)
	games := api.Group("/games", middleware.AuthRequired(authService))
	games.Post("/create", gameHandler.CreateGame)
	games.Post("/join", gameHandler.JoinGame)
	games.Get("/:id", gameHandler.GetGame)

	// Stats routes (protected)
	stats := api.Group("/stats", middleware.AuthRequired(authService))
	stats.Get("/", statsHandler.GetMyStats)
	stats.Get("/:game_type", statsHandler.GetStatsByGameType)

	// Matchmaking routes (protected)
	matchmaking := api.Group("/matchmaking", middleware.AuthRequired(authService))
	matchmaking.Post("/queue", matchmakingHandler.JoinQueue)
	matchmaking.Delete("/queue", matchmakingHandler.LeaveQueue)
	matchmaking.Get("/status", matchmakingHandler.GetQueueStatus)

	// Room routes (protected)
	rooms := api.Group("/rooms", middleware.AuthRequired(authService))
	rooms.Post("/create", roomHandler.CreateRoom)
	rooms.Post("/join", roomHandler.JoinRoomByCode)
	rooms.Get("/:id", roomHandler.GetRoom)
	rooms.Post("/:id/join", roomHandler.JoinRoom)
	rooms.Post("/:id/leave", roomHandler.LeaveRoom)
	rooms.Post("/:id/ready", roomHandler.SetReady)
	rooms.Post("/:id/start", roomHandler.StartGame)

	// WebSocket route
	app.Get("/ws", wsHandler.HandleConnection)

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-quit
		log.Println("Shutting down server...")
		_ = app.Shutdown()
	}()

	// Start server
	log.Printf("Server starting on port %s", cfg.Port)
	if err := app.Listen(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}


