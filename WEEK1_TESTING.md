# Week 1 - Testing Guide

## Prerequisites

- Docker and Docker Compose installed
- Go 1.21+ installed
- Node.js 18+ installed

## Step 1: Start Infrastructure

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Wait for services to be healthy (check with)
docker-compose ps
```

## Step 2: Verify Database

```bash
# Connect to PostgreSQL
docker exec -it playforge-postgres psql -U playforge -d playforge

# Check tables exist
\dt

# You should see: users, player_stats, game_matches, rooms, etc.
\q
```

## Step 3: Start Backend

```bash
# Install Go dependencies
go mod download

# Run the API server
go run cmd/api/main.go

# You should see:
# Server starting on port 8080
```

Test health endpoint:

```bash
curl http://localhost:8080/health
# Expected: {"status":"ok","time":"..."}
```

## Step 4: Start Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Frontend will be at: http://localhost:5173
```

## Step 5: End-to-End Testing

### Test 1: Signup Flow

1. Open browser to `http://localhost:5173`
2. You should be redirected to `/login`
3. Click "create a new account" link
4. Fill in the signup form:
   - Username: testuser
   - Email: test@example.com
   - Password: password123
   - Confirm Password: password123
5. Click "Sign up"
6. You should be redirected to `/dashboard`
7. You should see your username and ELO rating (1200)

**Backend Verification:**

```bash
# Check user was created
docker exec -it playforge-postgres psql -U playforge -d playforge -c "SELECT username, email, elo_rating FROM users;"
```

### Test 2: Logout Flow

1. On the dashboard, click "Logout" button
2. You should be redirected to `/login`

### Test 3: Login Flow

1. Fill in the login form:
   - Email: test@example.com
   - Password: password123
2. Click "Sign in"
3. You should be redirected to `/dashboard`
4. Your user data should be displayed

### Test 4: Token Refresh

1. Open browser DevTools (F12)
2. Go to Application > Local Storage
3. You should see:
   - `access_token`
   - `refresh_token`
   - `user` (JSON object)
4. Wait 15+ minutes (or manually delete `access_token`)
5. Refresh the page
6. You should remain logged in (refresh token worked)

### Test 5: Protected Routes

1. Logout
2. Try to access `http://localhost:5173/dashboard` directly
3. You should be redirected to `/login`

### Test 6: Validation

**Signup Validation:**

- Try username with < 3 characters → Error
- Try password with < 8 characters → Error
- Try mismatched passwords → Error
- Try existing email → "user already exists" error

**Login Validation:**

- Try wrong password → "Invalid credentials" error
- Try non-existent email → "Invalid credentials" error

## API Testing with cURL

### Signup

```bash
curl -X POST http://localhost:8080/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "apiuser",
    "email": "api@example.com",
    "password": "password123"
  }'
```

Expected response:

```json
{
  "user": {
    "id": "...",
    "username": "apiuser",
    "email": "api@example.com",
    "elo_rating": 1200,
    "created_at": "...",
    "updated_at": "..."
  },
  "access_token": "...",
  "refresh_token": "..."
}
```

### Login

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "api@example.com",
    "password": "password123"
  }'
```

### Refresh Token

```bash
# Use refresh_token from login response
curl -X POST http://localhost:8080/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "YOUR_REFRESH_TOKEN"
  }'
```

### Logout

```bash
# Use access_token from login response
curl -X POST http://localhost:8080/api/v1/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Redis Verification

```bash
# Connect to Redis
docker exec -it playforge-redis redis-cli

# Check stored refresh tokens
KEYS refresh_token:*

# Check a specific token
GET refresh_token:USER_ID

# Exit
exit
```

## Cleanup

```bash
# Stop all services
docker-compose down

# Remove volumes (clears data)
docker-compose down -v
```

## Success Criteria

✅ PostgreSQL and Redis running  
✅ Backend server starts successfully  
✅ Frontend dev server running  
✅ User can signup with valid credentials  
✅ User data persisted in database  
✅ User can login with credentials  
✅ JWT tokens stored in localStorage  
✅ User can logout  
✅ Token refresh works automatically  
✅ Protected routes redirect to login  
✅ Form validation works correctly  
✅ Error messages display properly

## Common Issues

### Port Already in Use

```bash
# Check what's using port 8080
lsof -i :8080

# Check what's using port 5173
lsof -i :5173

# Kill process if needed
kill -9 PID
```

### Database Connection Failed

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Restart if needed
docker-compose restart postgres
```

### Redis Connection Failed

```bash
# Check if Redis is running
docker-compose ps redis

# Check logs
docker-compose logs redis

# Restart if needed
docker-compose restart redis
```

### Go Module Issues

```bash
# Clear module cache
go clean -modcache

# Re-download
go mod download
```

### Frontend Build Issues

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```
