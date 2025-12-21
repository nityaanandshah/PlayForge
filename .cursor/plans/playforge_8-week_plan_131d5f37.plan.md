---
name: PlayForge 8-Week Plan
overview: Build PlayForge multiplayer game platform from scratch using Go backend + React frontend, implementing 4 games with real-time WebSocket gameplay, matchmaking, tournaments, and production-ready infrastructure over 8 weeks as a solo developer.
todos: []
---

# PlayForge: 8-Week Implementation Plan

## Tech Stack Decision

**Backend:**

- Go 1.21+ with Gin (HTTP) + Gorilla WebSocket
- JWT authentication (golang-jwt)
- Redis for game state, matchmaking queues, pub/sub
- PostgreSQL for users, game history, tournaments
- Prometheus + Grafana for observability

**Frontend:**

- React 18 + TypeScript + Vite
- TanStack Query for API state
- Socket.io-client or native WebSocket
- TailwindCSS for styling

**Infrastructure:**

- Docker + Docker Compose (local dev)
- Kubernetes + Helm (production)
- GitHub Actions (CI/CD)

---

## Week 1: Foundation & Authentication

**Goal:** Project scaffolding, database setup, user auth system

### Backend Tasks

- Initialize Go project structure (cmd/api, internal/models, internal/handlers, internal/services)
- Setup PostgreSQL schema with migrations (users, sessions, game_history, tournaments)
- Implement user registration/login with bcrypt password hashing
- JWT token generation and validation middleware
- Basic REST API endpoints: POST /auth/register, POST /auth/login, GET /auth/me
- Docker Compose setup: Go app + Postgres + Redis

### Frontend Tasks

- Bootstrap React + TypeScript + Vite project
- Setup routing (react-router-dom): /login, /signup, /dashboard
- Create auth context and protected route wrapper
- Build login/signup forms with form validation
- Store JWT in httpOnly cookie or localStorage with refresh mechanism

### Deliverable

✅ Users can sign up, log in, and access authenticated routes

---

## Week 2: User Profiles & Core API

**Goal:** Player profiles, ELO rating system, leaderboard API

### Backend Tasks

- Extend users table: elo_rating (default 1200), wins, losses, current_streak, best_streak
- Profile endpoints: GET /users/:id, PATCH /users/me (update avatar, bio)
- Leaderboard endpoint: GET /leaderboard?game=all&limit=100 (sorted by ELO)
- Game history endpoint: GET /users/:id/history (paginated)
- Implement ELO calculation service (K-factor = 32 for new players, 16 for established)
- Rate limiting middleware (10 req/sec per IP using Redis)

### Frontend Tasks

- Build profile page showing ELO, win/loss ratio, streaks, recent games
- Create leaderboard component with filters (game type, time period)
- Design navigation header with user dropdown
- Setup TanStack Query for data fetching with caching

### Deliverable

✅ Public profiles, leaderboards