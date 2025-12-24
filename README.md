# ArenaMatch 🎮

<div align="center">

**A scalable, real-time multiplayer gaming platform with competitive tournaments, matchmaking, and social features**

[![Go](https://img.shields.io/badge/Go-1.21+-00ADD8?style=flat&logo=go)](https://golang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7+-DC382D?style=flat&logo=redis)](https://redis.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [API Documentation](#-api-documentation)
- [Games](#-games)
- [Screenshots](#-screenshots)
- [Project Structure](#-project-structure)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**ArenaMatch** is a modern, feature-rich multiplayer gaming platform built from the ground up with scalability, real-time performance, and competitive gaming in mind. Players can compete in multiple classic games, join tournaments, track their stats, and climb leaderboards—all in real-time.

### What Makes ArenaMatch Special?

- **🎮 Four Complete Games**: Tic-Tac-Toe, Connect-4, Rock-Paper-Scissors, and Dots & Boxes
- **⚡ Real-Time Gameplay**: WebSocket-powered instant multiplayer action
- **🏆 Tournament System**: Single-elimination brackets with automatic advancement
- **🎯 Smart Matchmaking**: ELO-based rating system with intelligent player pairing
- **👥 Private Rooms**: Create custom games with friends using join codes
- **📊 Comprehensive Stats**: Detailed leaderboards, match history, and performance tracking
- **🔔 Live Notifications**: Real-time updates for invitations, tournaments, and matches
- **👁️ Spectator Mode**: Watch any ongoing match in real-time
- **📈 Activity Tracking**: GitHub-style contribution graph showing your gaming streaks
- **⚙️ Custom Game Settings**: Configurable board sizes, rounds, and rules

---

## ✨ Features

### 🎮 Gameplay Features

- **Multiple Game Modes**
  - Quick Play matchmaking with ELO-based pairing
  - Private rooms with customizable settings
  - Tournament competitions with brackets
- **Real-Time Multiplayer**
  - WebSocket-powered instant updates
  - Automatic reconnection handling
  - Low-latency move synchronization
  - Live spectator viewing
- **Four Unique Games**
  - **Tic-Tac-Toe**: 3×3, 4×4, or 5×5 grids
  - **Connect-4**: Customizable 4-10 rows/columns with gravity
  - **Rock-Paper-Scissors**: Best of 3, 5, 7, or 9 rounds
  - **Dots & Boxes**: 4×4 to 8×8 dot grids with bonus turns

### 🏆 Competitive Features

- **ELO Rating System**: Dynamic skill-based rankings for fair matchmaking
- **Tournament System**
  - Single-elimination brackets (4-32 players)
  - Smart seeding based on ELO ratings
  - Automatic winner advancement
  - Real-time bracket updates
  - Private tournaments with invitations
  - Public and private tournament modes
- **Matchmaking Queue**
  - Rating-based player pairing
  - Dynamic range expansion over time
  - 5-minute timeout with notifications
  - Per-game-type queues

### 📊 Social & Stats Features

- **Comprehensive Statistics**
  - Global and per-game leaderboards
  - Win/loss/draw tracking
  - Win rate calculations
  - Current and longest streaks
  - GitHub-style activity heatmap (52-week view)
- **Match History**
  - Complete game records
  - Filter by game type
  - Opponent information
  - Detailed timestamps
- **Notifications System**
  - Tournament invitations
  - Match ready alerts
  - Player join notifications
  - Invitation responses
  - Real-time auto-refresh
- **Profile & Settings**
  - Customizable usernames
  - Password management
  - Public player profiles
  - Achievement tracking
  - Activity streaks and badges

### 🔐 Platform Features

- **Authentication & Security**
  - JWT-based authentication
  - Secure password hashing (bcrypt)
  - Token refresh mechanism
  - Protected API routes
  - CORS protection
- **User Experience**
  - Responsive design (mobile, tablet, desktop)
  - Dark theme optimized for gaming
  - Real-time loading states
  - Comprehensive error handling
  - Smooth animations and transitions
- **Infrastructure**
  - Horizontal scaling with Redis pub/sub
  - PostgreSQL for data persistence
  - Redis for session management and caching
  - Docker-ready deployment
  - Production-optimized build

---

## 🛠️ Tech Stack

### Backend

| Technology            | Purpose                                  |
| --------------------- | ---------------------------------------- |
| **Go 1.21+**          | High-performance backend language        |
| **Fiber**             | Fast HTTP framework                      |
| **PostgreSQL 15+**    | Relational database for persistent data  |
| **Redis 7+**          | Caching, sessions, and pub/sub messaging |
| **gorilla/websocket** | WebSocket connections                    |
| **JWT**               | Stateless authentication                 |
| **bcrypt**            | Password hashing                         |
| **pq**                | PostgreSQL driver                        |
| **go-redis**          | Redis client                             |

### Frontend

| Technology          | Purpose                        |
| ------------------- | ------------------------------ |
| **React 18**        | UI library                     |
| **TypeScript 5**    | Type-safe JavaScript           |
| **Vite**            | Fast build tool and dev server |
| **TailwindCSS**     | Utility-first CSS framework    |
| **React Router v6** | Client-side routing            |
| **Axios**           | HTTP client                    |
| **Zustand**         | Lightweight state management   |

### DevOps

| Technology                | Purpose                         |
| ------------------------- | ------------------------------- |
| **Docker**                | Containerization                |
| **Docker Compose**        | Local development orchestration |
| **PostgreSQL Migrations** | Database schema management      |
| **Make**                  | Build automation                |

---

## 🏗️ Architecture

ArenaMatch follows a **clean architecture** pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Pages      │  │  Components  │  │   Contexts   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  API Client  │  │  WebSocket   │  │    Types     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │ HTTP/WS
┌─────────────────────────────────────────────────────────┐
│                    Backend (Go)                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │              HTTP Handlers                       │  │
│  │  Auth │ Game │ Match │ Room │ Tournament │ Stats│  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Services (Business Logic)           │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Repositories (Data Access)          │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Domain Models                       │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
┌───────▼──────────┐            ┌──────────▼─────────┐
│   PostgreSQL     │            │       Redis        │
│                  │            │                    │
│  - Users         │            │  - Sessions        │
│  - Games         │            │  - Game State      │
│  - Tournaments   │            │  - Queues          │
│  - Stats         │            │  - Pub/Sub         │
└──────────────────┘            └────────────────────┘
```

### Key Design Patterns

- **Repository Pattern**: Data access abstraction
- **Service Layer**: Business logic encapsulation
- **Clean Architecture**: Domain-driven design with dependency inversion
- **WebSocket Hub**: Centralized connection management
- **Redis Pub/Sub**: Cross-instance event broadcasting
- **JWT Middleware**: Authentication layer

---

## 🚀 Quick Start

### Prerequisites

Ensure you have the following installed:

- **Go** 1.21 or higher ([Download](https://golang.org/dl/))
- **Node.js** 18 or higher ([Download](https://nodejs.org/))
- **Docker** and **Docker Compose** ([Download](https://www.docker.com/get-started))
- **PostgreSQL** 15+ (via Docker)
- **Redis** 7+ (via Docker)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/ArenaMatch.git
cd ArenaMatch
```

2. **Start infrastructure services**

```bash
docker-compose up -d postgres redis
```

This starts PostgreSQL on port `5432` and Redis on port `6379`.

3. **Set up environment variables**

```bash
cp .env.example .env
# Edit .env with your configuration
```

Example `.env`:

```bash
PORT=8080
DATABASE_URL=postgres://playforge:playforge@localhost:5432/playforge?sslmode=disable
REDIS_URL=localhost:6379
JWT_SECRET=your-secret-key-change-in-production
CORS_ORIGINS=http://localhost:5173
ENVIRONMENT=development
```

4. **Run database migrations**

The database will auto-initialize on first run, or you can manually run:

```bash
docker exec -i arenamatch-postgres-1 psql -U playforge -d playforge < migrations/init.sql
```

5. **Start the backend server**

```bash
# Using Make
make dev

# Or directly with Go
go run cmd/api/main.go
```

Backend will be available at `http://localhost:8080`

6. **Start the frontend** (in a new terminal)

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at `http://localhost:5173`

7. **Open your browser and play!**

Navigate to `http://localhost:5173`, sign up, and start playing!

### Using Make Commands

```bash
make help        # Show all available commands
make dev         # Run backend in development mode
make build       # Build production binary
make test        # Run tests
make lint        # Run linters
make docker-up   # Start all services with Docker Compose
make docker-down # Stop all services
```

---

## 📚 API Documentation

### Base URL

```
http://localhost:8080/api/v1
```

### Authentication Endpoints

| Method | Endpoint        | Description            | Auth Required |
| ------ | --------------- | ---------------------- | ------------- |
| `POST` | `/auth/signup`  | Create new account     | ❌            |
| `POST` | `/auth/login`   | Login with credentials | ❌            |
| `POST` | `/auth/refresh` | Refresh access token   | ❌            |
| `POST` | `/auth/logout`  | Logout user            | ✅            |

### Game Endpoints

| Method   | Endpoint                | Description        | Auth Required |
| -------- | ----------------------- | ------------------ | ------------- |
| `POST`   | `/games/create`         | Create new game    | ✅            |
| `POST`   | `/games/join`           | Join existing game | ✅            |
| `GET`    | `/games/:id`            | Get game state     | ✅            |
| `POST`   | `/games/:id/spectate`   | Join as spectator  | ✅            |
| `DELETE` | `/games/:id/spectate`   | Leave as spectator | ✅            |
| `GET`    | `/games/:id/spectators` | Get spectator list | ✅            |

### Matchmaking Endpoints

| Method   | Endpoint              | Description            | Auth Required |
| -------- | --------------------- | ---------------------- | ------------- |
| `POST`   | `/matchmaking/queue`  | Join matchmaking queue | ✅            |
| `DELETE` | `/matchmaking/queue`  | Leave queue            | ✅            |
| `GET`    | `/matchmaking/status` | Get queue status       | ✅            |

### Room Endpoints

| Method | Endpoint           | Description            | Auth Required |
| ------ | ------------------ | ---------------------- | ------------- |
| `POST` | `/rooms/create`    | Create new room        | ✅            |
| `POST` | `/rooms/join`      | Join room by code      | ✅            |
| `GET`  | `/rooms/:id`       | Get room details       | ✅            |
| `POST` | `/rooms/:id/join`  | Join room by ID        | ✅            |
| `POST` | `/rooms/:id/leave` | Leave room             | ✅            |
| `POST` | `/rooms/:id/ready` | Set ready status       | ✅            |
| `POST` | `/rooms/:id/start` | Start game (host only) | ✅            |

### Tournament Endpoints

| Method | Endpoint                   | Description                  | Auth Required |
| ------ | -------------------------- | ---------------------------- | ------------- |
| `POST` | `/tournaments/create`      | Create tournament            | ✅            |
| `GET`  | `/tournaments`             | List all tournaments         | ✅            |
| `GET`  | `/tournaments/:id`         | Get tournament details       | ✅            |
| `POST` | `/tournaments/:id/join`    | Join tournament              | ✅            |
| `POST` | `/tournaments/:id/start`   | Start tournament (host only) | ✅            |
| `POST` | `/tournaments/:id/invite`  | Send invitation              | ✅            |
| `GET`  | `/invitations`             | Get user invitations         | ✅            |
| `POST` | `/invitations/:id/accept`  | Accept invitation            | ✅            |
| `POST` | `/invitations/:id/decline` | Decline invitation           | ✅            |

### Statistics Endpoints

| Method | Endpoint                        | Description                   | Auth Required |
| ------ | ------------------------------- | ----------------------------- | ------------- |
| `GET`  | `/stats/leaderboard`            | Get global leaderboard        | ✅            |
| `GET`  | `/stats/leaderboard/:game_type` | Get game-specific leaderboard | ✅            |
| `GET`  | `/stats/match-history`          | Get user match history        | ✅            |

### Notification Endpoints

| Method   | Endpoint                  | Description               | Auth Required |
| -------- | ------------------------- | ------------------------- | ------------- |
| `GET`    | `/notifications`          | Get user notifications    | ✅            |
| `POST`   | `/notifications/:id/read` | Mark notification as read | ✅            |
| `POST`   | `/notifications/read-all` | Mark all as read          | ✅            |
| `DELETE` | `/notifications/:id`      | Delete notification       | ✅            |

### Profile Endpoints

| Method | Endpoint             | Description        | Auth Required |
| ------ | -------------------- | ------------------ | ------------- |
| `PUT`  | `/profile`           | Update profile     | ✅            |
| `POST` | `/profile/password`  | Change password    | ✅            |
| `GET`  | `/profile/:username` | Get public profile | ❌            |

### WebSocket

| Endpoint  | Description                                 |
| --------- | ------------------------------------------- |
| `GET /ws` | WebSocket connection for real-time gameplay |

#### WebSocket Message Types

**Client → Server:**

- `ping` - Keepalive heartbeat
- `game_move` - Player move submission

**Server → Client:**

- `connected` - Connection established
- `pong` - Ping response
- `game_state` - Full game state update
- `game_over` - Game ended
- `spectator_joined` - User joined as spectator
- `spectator_left` - User left as spectator
- `tournament_updated` - Tournament state changed
- `error` - Error message

---

## 🎮 Games

### 1. Tic-Tac-Toe ❌⭕

Classic 3-in-a-row game with support for larger grids.

**Features:**

- Board sizes: 3×3, 4×4, 5×5
- Two players: X and O
- Win conditions: 3/4/5 in a row (row, column, or diagonal)
- Draw detection when board is full

**Customization:**

- Grid size selection
- Turn time limits (optional)

### 2. Connect-4 🔴🟡

Gravity-based game where players drop pieces to connect four.

**Features:**

- Default 7×6 grid (customizable to 4-10 rows/columns)
- Gravity physics (pieces fall to lowest row)
- Win conditions: 4 in a row (horizontal, vertical, diagonal)
- Column full detection

**Customization:**

- Board dimensions
- Win length (4-6 pieces)

### 3. Rock-Paper-Scissors ✊✋✌️

Best-of-rounds simultaneous choice game.

**Features:**

- Simultaneous move submission
- Round-based gameplay (best of 3, 5, 7, or 9)
- Round history tracking
- Animated result reveals
- Auto-advance to next round

**Customization:**

- Number of rounds
- Reveal delay duration

### 4. Dots & Boxes 📦

Strategic line-drawing game with box completion.

**Features:**

- 5×5 dot grid (customizable to 4×4 through 8×8)
- 16 potential boxes (default)
- Line ownership tracking
- Box completion with player colors
- Bonus turn on box completion
- Score tracking

**Customization:**

- Grid size (4×4 to 8×8 dots)
- Turn time limits

---

## 📸 Screenshots

> _Coming soon - Add screenshots of your application here_

### Dashboard

_Main dashboard with quick actions and game cards_

### Matchmaking

_Smart matchmaking queue with ELO-based pairing_

### Game Board

_Real-time gameplay with WebSocket updates_

### Tournament Bracket

_Visual bracket with match status and progression_

### Leaderboard

_Global and per-game leaderboards with rankings_

### Profile

_Player profile with activity graph and statistics_

---

## 📂 Project Structure

```
ArenaMatch/
├── cmd/
│   └── api/
│       └── main.go                     # Application entry point
├── internal/
│   ├── config/
│   │   └── config.go                   # Configuration management
│   ├── database/
│   │   ├── postgres.go                 # PostgreSQL connection
│   │   └── redis.go                    # Redis connection
│   ├── domain/
│   │   ├── user.go                     # User domain models
│   │   ├── matchmaking.go              # Matchmaking types
│   │   ├── room.go                     # Room types
│   │   ├── tournament.go               # Tournament types
│   │   ├── notification.go             # Notification types
│   │   ├── profile.go                  # Profile types
│   │   └── errors.go                   # Domain errors
│   ├── game/
│   │   ├── types.go                    # Game interfaces
│   │   ├── tictactoe.go                # Tic-Tac-Toe logic
│   │   ├── connect4.go                 # Connect-4 logic
│   │   ├── rps.go                      # Rock-Paper-Scissors logic
│   │   └── dotsandboxes.go             # Dots & Boxes logic
│   ├── handlers/
│   │   ├── auth_handler.go             # Authentication handlers
│   │   ├── game_handler.go             # Game handlers
│   │   ├── matchmaking_handler.go      # Matchmaking handlers
│   │   ├── room_handler.go             # Room handlers
│   │   ├── tournament_handler.go       # Tournament handlers
│   │   ├── stats_handler.go            # Statistics handlers
│   │   ├── notification_handler.go     # Notification handlers
│   │   └── errors.go                   # Error handlers
│   ├── middleware/
│   │   └── auth.go                     # JWT authentication
│   ├── repository/
│   │   ├── user_repository.go          # User data access
│   │   ├── game_repository.go          # Game data access
│   │   ├── room_repository.go          # Room data access
│   │   ├── tournament_repository.go    # Tournament data access
│   │   ├── stats_repository.go         # Statistics data access
│   │   └── notification_repository.go  # Notification data access
│   ├── services/
│   │   ├── auth_service.go             # Authentication logic
│   │   ├── game_service.go             # Game logic
│   │   ├── matchmaking_service.go      # Matchmaking logic
│   │   ├── room_service.go             # Room logic
│   │   ├── tournament_service.go       # Tournament logic
│   │   ├── stats_service.go            # Statistics logic
│   │   └── notification_service.go     # Notification logic
│   └── websocket/
│       ├── types.go                    # WebSocket message types
│       ├── hub.go                      # Connection manager
│       ├── handler.go                  # WebSocket handler
│       └── errors.go                   # WebSocket errors
├── migrations/
│   ├── init.sql                        # Initial schema
│   ├── add_notifications.sql           # Notifications table
│   ├── add_tournament_invitations.sql  # Tournament invitations
│   └── down.sql                        # Rollback scripts
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.tsx              # App layout
│   │   │   ├── TicTacToeBoard.tsx      # Tic-Tac-Toe board
│   │   │   ├── Connect4Board.tsx       # Connect-4 board
│   │   │   ├── RPSBoard.tsx            # RPS board
│   │   │   └── DotsAndBoxesBoard.tsx   # Dots & Boxes board
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx         # Auth state management
│   │   ├── hooks/
│   │   │   └── useAuth.ts              # Auth hook
│   │   ├── lib/
│   │   │   ├── api.ts                  # API client
│   │   │   └── websocket.ts            # WebSocket client
│   │   ├── pages/
│   │   │   ├── Login.tsx               # Login page
│   │   │   ├── Signup.tsx              # Signup page
│   │   │   ├── Dashboard.tsx           # Dashboard
│   │   │   ├── Game.tsx                # Game page
│   │   │   ├── Matchmaking.tsx         # Matchmaking page
│   │   │   ├── CreateRoom.tsx          # Room creation
│   │   │   ├── RoomLobby.tsx           # Room lobby
│   │   │   ├── Tournaments.tsx         # Tournament browser
│   │   │   ├── TournamentLobby.tsx     # Tournament bracket
│   │   │   ├── Leaderboard.tsx         # Leaderboards
│   │   │   ├── MatchHistory.tsx        # Match history
│   │   │   ├── Statistics.tsx          # Statistics dashboard
│   │   │   ├── Profile.tsx             # Player profile
│   │   │   ├── Settings.tsx            # User settings
│   │   │   └── Notifications.tsx       # Notifications page
│   │   ├── types/
│   │   │   ├── index.ts                # Common types
│   │   │   ├── game.ts                 # Game types
│   │   │   ├── matchmaking.ts          # Matchmaking types
│   │   │   ├── room.ts                 # Room types
│   │   │   └── tournament.ts           # Tournament types
│   │   ├── App.tsx                     # Main app component
│   │   ├── main.tsx                    # Entry point
│   │   └── index.css                   # Global styles
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
├── scripts/
│   └── test-api.sh                     # API testing script
├── docker-compose.yml                  # Local development setup
├── Dockerfile                          # Production container
├── Makefile                            # Build automation
├── go.mod                              # Go dependencies
├── go.sum                              # Go checksums
└── README.md                           # This file
```

---

## 💻 Development

### Running Tests

```bash
# Backend tests
go test ./...
go test -v ./internal/game/...  # Game logic tests
go test -v ./internal/services/...  # Service tests

# Frontend tests
cd frontend
npm test
```

### Code Quality

```bash
# Go linting
golangci-lint run

# Format Go code
gofmt -w .

# Format frontend code
cd frontend
npm run lint
npm run format
```

### Database Migrations

**Apply migrations:**

```bash
docker exec -i arenamatch-postgres-1 psql -U playforge -d playforge < migrations/init.sql
```

**Rollback migrations:**

```bash
docker exec -i arenamatch-postgres-1 psql -U playforge -d playforge < migrations/down.sql
```

### Debugging

**Backend with Delve debugger:**

```bash
dlv debug cmd/api/main.go
```

**Frontend with browser DevTools:**

Open browser DevTools (F12) and use React Developer Tools extension.

### Environment Variables

| Variable       | Description                          | Default                 |
| -------------- | ------------------------------------ | ----------------------- |
| `PORT`         | Backend server port                  | `8080`                  |
| `DATABASE_URL` | PostgreSQL connection string         | See `.env.example`      |
| `REDIS_URL`    | Redis connection string              | `localhost:6379`        |
| `JWT_SECRET`   | JWT signing secret                   | Change in production!   |
| `CORS_ORIGINS` | Allowed CORS origins                 | `http://localhost:5173` |
| `ENVIRONMENT`  | Environment (development/production) | `development`           |

---

## 🧪 Testing

### Testing Guide

Comprehensive testing guides are available for each development week:

- **Week 1**: [WEEK1_TESTING.md](WEEK1_TESTING.md) - Authentication tests
- **Week 2**: [WEEK2_TESTING.md](WEEK2_TESTING.md) - WebSocket and game engine tests
- **Week 3**: [WEEK3_TESTING.md](WEEK3_TESTING.md) - Matchmaking and rooms tests
- **Week 4**: [WEEK4_TESTING.md](WEEK4_TESTING.md) - Multi-game and customization tests
- **Week 5**: [WEEK5_TESTING.md](WEEK5_TESTING.md) - Tournament system tests
- **Week 6**: [WEEK6_TESTING.md](WEEK6_TESTING.md) - Spectator mode tests
- **Week 7**: [WEEK7_TESTING.md](WEEK7_TESTING.md) - Notifications and profile tests

### Manual Testing Flow

1. **Sign Up & Login**

   - Create a new account
   - Login with credentials
   - Verify JWT tokens are stored

2. **Quick Play**

   - Click "Find Match"
   - Join matchmaking queue
   - Get matched with another player
   - Play a game

3. **Private Room**

   - Create a room with custom settings
   - Share join code
   - Have friend join
   - Start game

4. **Tournament**

   - Create a tournament (8 players)
   - Join tournament
   - Wait for bracket generation
   - Play tournament matches

5. **Statistics**
   - View leaderboards
   - Check match history
   - Review personal stats
   - Examine activity graph

### Automated API Testing

```bash
chmod +x scripts/test-api.sh
./scripts/test-api.sh
```

---

## 🚢 Deployment

### Production Build

**Backend:**

```bash
# Build binary
make build

# Or manually
go build -o bin/api cmd/api/main.go
```

**Frontend:**

```bash
cd frontend
npm run build
# Build output in frontend/dist/
```

### Docker Deployment

**Build image:**

```bash
docker build -t arenamatch:latest .
```

**Run with Docker Compose:**

```bash
docker-compose up -d
```

This starts all services (frontend, backend, PostgreSQL, Redis).

### Environment Setup

For production deployment:

1. Set secure `JWT_SECRET`
2. Use production database credentials
3. Configure proper `CORS_ORIGINS`
4. Set `ENVIRONMENT=production`
5. Use HTTPS with SSL/TLS certificates
6. Set up database backups
7. Configure Redis persistence
8. Use a reverse proxy (nginx/Caddy)

### Kubernetes Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed Kubernetes deployment instructions.

### Performance Optimization

- **Redis Caching**: Game state cached with TTL
- **Connection Pooling**: PostgreSQL connection pooling
- **WebSocket Scaling**: Redis pub/sub for cross-instance messaging
- **Static Asset CDN**: Serve frontend from CDN
- **Database Indexes**: Optimized queries with proper indexes

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Getting Started

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Guidelines

- **Code Style**: Follow existing patterns (Go, TypeScript)
- **Testing**: Add tests for new features
- **Documentation**: Update README and docs
- **Commits**: Use clear, descriptive commit messages
- **Issues**: Check existing issues before creating new ones

### Development Workflow

1. Create an issue describing the feature/bug
2. Discuss implementation approach
3. Fork and create branch
4. Implement with tests
5. Submit PR with description
6. Address review feedback
7. Merge! 🎉

### Areas for Contribution

- 🎮 New game implementations
- 🏆 Tournament formats (double elimination, round robin)
- 🤖 AI opponents
- 🎨 UI/UX improvements
- 📱 Mobile app (React Native)
- 🌐 Internationalization (i18n)
- 📊 Advanced analytics
- 🔔 Push notifications
- 💬 In-game chat
- 🎥 Game replays

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with ❤️ using Go and React
- Inspired by classic multiplayer games
- WebSocket implementation powered by gorilla/websocket
- UI components styled with TailwindCSS
- Database persistence with PostgreSQL
- Real-time state management with Redis

---

## 📧 Contact

**Project Maintainer**: Your Name

- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com
- Website: [yourwebsite.com](https://yourwebsite.com)

**Project Link**: [https://github.com/yourusername/ArenaMatch](https://github.com/yourusername/ArenaMatch)

---

## 🗺️ Roadmap

### Completed ✅

- [x] User authentication (JWT)
- [x] Four playable games
- [x] Real-time multiplayer (WebSocket)
- [x] Matchmaking system
- [x] Private rooms
- [x] Tournament system
- [x] Leaderboards and stats
- [x] Spectator mode
- [x] Notifications
- [x] Profile system
- [x] Activity tracking

### In Progress 🚧

- [ ] Mobile responsiveness polish
- [ ] Production deployment
- [ ] Performance optimization

### Future Features 🔮

- [ ] AI opponents for practice
- [ ] Double elimination tournaments
- [ ] Round robin tournaments
- [ ] In-game chat
- [ ] Game replays
- [ ] Achievement system
- [ ] Friend system
- [ ] Team tournaments
- [ ] Custom themes
- [ ] Mobile apps (iOS/Android)
- [ ] Admin dashboard
- [ ] Moderator tools
- [ ] Reporting system
- [ ] Season rankings
- [ ] Esports features

---

## 📊 Project Stats

- **Total Lines of Code**: ~15,000+
- **Backend Files**: 45+
- **Frontend Files**: 35+
- **API Endpoints**: 40+
- **Games**: 4 fully implemented
- **WebSocket Message Types**: 12+
- **Database Tables**: 10+
- **Development Time**: 7 weeks
- **Test Coverage**: Growing 📈

---

## 🏆 Features Breakdown by Week

<details>
<summary><b>Week 1: Foundation</b></summary>

- Go project structure
- PostgreSQL schema
- JWT authentication
- React frontend setup
- User registration/login

</details>

<details>
<summary><b>Week 2: Game Engine</b></summary>

- WebSocket infrastructure
- Connection manager
- Tic-Tac-Toe implementation
- Real-time gameplay
- Move validation

</details>

<details>
<summary><b>Week 3: Multiplayer</b></summary>

- Matchmaking queue
- ELO-based pairing
- Private rooms
- Join codes
- Room lobbies

</details>

<details>
<summary><b>Week 4: Game Library</b></summary>

- Connect-4 game
- Rock-Paper-Scissors
- Dots & Boxes
- Game customization
- Leaderboards

</details>

<details>
<summary><b>Week 5: Tournaments</b></summary>

- Single-elimination brackets
- Tournament creation
- Bracket visualization
- Automatic advancement
- Tournament lobbies

</details>

<details>
<summary><b>Week 6: Social Features</b></summary>

- Spectator mode
- Tournament invitations
- Private tournaments
- Real-time spectator updates

</details>

<details>
<summary><b>Week 7: Polish & Launch</b></summary>

- Notification system
- Profile pages
- Settings management
- Activity graph
- Production readiness

</details>

---

<div align="center">

**Built with 💪 and ☕ by passionate developers**

⭐ Star this repo if you find it helpful! ⭐

</div>
