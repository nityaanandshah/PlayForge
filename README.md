# PlayForge

A scalable, authoritative multiplayer game platform for real-time turn-based matches and casual tournaments.

## Features

- 4 Games: Tic-Tac-Toe, Connect-4, Rock-Paper-Scissors, and Dots & Boxes
- Real-time multiplayer with WebSockets
- ELO rating system
- Quick Play matchmaking
- Private rooms with tournament support
- Server-authoritative game logic
- Reconnection support
- In-game chat and presence
- Kubernetes-ready architecture

## Tech Stack

**Backend:**
- Go 1.21+ with Fiber framework
- PostgreSQL 15+ for persistent data
- Redis 7+ for ephemeral state
- JWT authentication
- WebSockets (gorilla/websocket)

**Frontend:**
- React 18 + TypeScript
- Vite build tool
- TailwindCSS
- React Router v6

## Quick Start

### Prerequisites

- Go 1.21+
- Docker & Docker Compose
- Node.js 18+ (for frontend)

### Development Setup

1. **Clone the repository**

```bash
git clone <repo-url>
cd ArenaMatch
```

2. **Start infrastructure with Docker Compose**

```bash
docker-compose up -d postgres redis
```

This will start PostgreSQL and Redis. The database will be automatically initialized with the schema.

3. **Run the backend**

```bash
# Install Go dependencies
go mod download

# Run the API server
make dev
# or
go run cmd/api/main.go
```

The API will be available at `http://localhost:8080`

4. **Run the frontend** (see frontend/README.md)

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`

### API Endpoints

**Health Check:**
- `GET /health` - Server health status

**Authentication:**
- `POST /api/v1/auth/signup` - Create new account
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout

**Games (Protected):**
- `POST /api/v1/games/create` - Create new game
- `POST /api/v1/games/join` - Join existing game
- `GET /api/v1/games/:id` - Get game state

**WebSocket:**
- `GET /ws` - WebSocket connection for real-time gameplay

## Project Structure

```
.
├── cmd/
│   └── api/
│       └── main.go           # Application entry point
├── internal/
│   ├── config/               # Configuration management
│   ├── database/             # Database connections
│   ├── domain/               # Domain models and errors
│   ├── handlers/             # HTTP handlers
│   ├── middleware/           # HTTP middleware
│   ├── repository/           # Data access layer
│   └── services/             # Business logic
├── migrations/               # Database migrations
├── frontend/                 # React frontend
├── docker-compose.yml        # Local development setup
├── Dockerfile               # Production container
└── Makefile                 # Common commands
```

## Project Status

### Week 1 ✅ Complete
- Go project structure with clean architecture
- PostgreSQL schema (users, stats, matches, rooms, tournaments)
- Redis client setup
- JWT authentication (signup, login, refresh, logout)
- Fiber HTTP server with basic routes
- Docker Compose for local development
- React frontend with auth pages and dashboard

### Week 2 ✅ Complete
- WebSocket infrastructure with gorilla/websocket
- Connection manager for tracking clients
- Tic-Tac-Toe game engine with validation
- Real-time gameplay with move synchronization
- Game state persistence in Redis
- Interactive game UI with turn indicators
- Win/draw detection
- WebSocket reconnection support

### Week 3 🔄 Next
- Matchmaking queue system
- Private room creation
- Room join by code
- Multiple participants per room

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
PORT=8080
DATABASE_URL=postgres://playforge:playforge@localhost:5432/playforge?sslmode=disable
REDIS_URL=localhost:6379
JWT_SECRET=your-secret-key-change-in-production
CORS_ORIGINS=http://localhost:5173
ENVIRONMENT=development
```

## License

MIT


