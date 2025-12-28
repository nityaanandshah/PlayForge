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

**PlayForge** is a modern, feature-rich multiplayer gaming platform built from the ground up with scalability, real-time performance, and competitive gaming in mind. Players can compete in multiple classic games, join tournaments, track their stats, and climb leaderboards—all in real-time.

### What Makes ArenaMatch Special?

- ** Four Games**: Tic-Tac-Toe, Connect-4, Rock-Paper-Scissors, and Dots & Boxes
- ** Real-Time Gameplay**: WebSocket-powered instant multiplayer action
- ** Tournament System**: Single-elimination brackets with automatic advancement
- ** Smart Matchmaking**: ELO-based rating system with intelligent player pairing
- ** Private Rooms**: Create custom games with friends using join codes
- ** Comprehensive Stats**: Detailed leaderboards, match history, and performance tracking
- ** Live Notifications**: Real-time updates for invitations, tournaments, and matches
- ** Spectator Mode**: Watch any ongoing match in real-time
- ** Activity Tracking**: GitHub-style contribution graph showing your gaming streaks
- ** Custom Game Settings**: Configurable board sizes, rounds, and rules

---

## Features

### Gameplay Features

- **Multiple Game Modes**
  - Quick Play matchmaking with ELO-based pairing
  - Private rooms with customizable settings
  - Tournament competitions with brackets
- **Real-Time Multiplayer**
  - WebSocket-powered instant updates
  - Automatic reconnection handling
  - Low-latency move synchronization
  - Live spectator viewing
- **Four Games**
  - **Tic-Tac-Toe**: 3×3, 4×4, or 5×5 grids
  - **Connect-4**: Customizable 4-10 rows/columns with gravity
  - **Rock-Paper-Scissors**: Best of 3, 5, 7, or 9 rounds
  - **Dots & Boxes**: 4×4 to 8×8 dot grids with bonus turns

### Competitive Features

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

### Social & Stats Features

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

### Platform Features

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

## Tech Stack

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

### Key Design Patterns

- **Repository Pattern**: Data access abstraction
- **Service Layer**: Business logic encapsulation
- **Clean Architecture**: Domain-driven design with dependency inversion
- **WebSocket Hub**: Centralized connection management
- **Redis Pub/Sub**: Cross-instance event broadcasting
- **JWT Middleware**: Authentication layer

---

## Quick Start

### Prerequisites

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

## Acknowledgments

- Built with ❤️ using Go and React
- Inspired by classic multiplayer games
- WebSocket implementation powered by gorilla/websocket
- UI components styled with TailwindCSS
- Database persistence with PostgreSQL
- Real-time state management with Redis

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