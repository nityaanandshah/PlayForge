# Week 2 - Testing Guide

## Prerequisites

- Week 1 completed and tested
- Docker, Go, Node.js installed
- Postgres and Redis running

## Step 1: Update Dependencies

```bash
# Update Go dependencies
go mod tidy

# Update frontend dependencies (if needed)
cd frontend
npm install
```

## Step 2: Restart Backend

```bash
# Stop the old backend (Ctrl+C in the terminal where it's running)

# Start the new backend with WebSocket support
go run cmd/api/main.go
```

You should see:

```
Server starting on port 8080
```

## Step 3: Restart Frontend

```bash
# In the frontend directory
npm run dev
```

## Step 4: Two-Player Game Testing

### Setup: Open Two Browser Windows

1. **Window 1 (Player 1):**

   - Open `http://localhost:5173`
   - Login or signup as Player 1
   - Username: player1
   - Email: player1@test.com
   - Password: password123

2. **Window 2 (Player 2):**
   - Open `http://localhost:5173` in **incognito/private mode**
   - Login or signup as Player 2
   - Username: player2
   - Email: player2@test.com
   - Password: password123

### Test 1: Create and Join Game

**In Window 1 (Player 1):**

1. Click "Quick Play - Tic-Tac-Toe"
2. You should be redirected to `/game/{game_id}`
3. You should see "Waiting for opponent to join..."
4. Copy the game ID from the URL

**In Window 2 (Player 2):**

1. Manually navigate to `http://localhost:5173/game/{game_id}` (paste the ID)
2. Game should start
3. Both players should see the game board

### Test 2: Play a Complete Game

**Expected behavior:**

- Player 1 (X) goes first
- Player 1 sees "Your turn!" message
- Player 2 sees "Opponent's turn..." message

**Player 1 Actions:**

1. Click on top-left cell (0,0)
2. Cell should show "X" in blue
3. Turn should switch to Player 2

**Player 2 Actions:**

1. Should now see "Your turn!"
2. Click on top-middle cell (0,1)
3. Cell should show "O" in red
4. Turn should switch to Player 1

**Continue playing:**

- Alternate turns
- Try to win or draw
- Game should automatically detect winner

### Test 3: Win Condition

**Scenario: Player 1 Wins**

Play this sequence:

- Player 1 (X): (0,0)
- Player 2 (O): (1,0)
- Player 1 (X): (0,1)
- Player 2 (O): (1,1)
- Player 1 (X): (0,2) ← Wins!

**Expected:**

- Player 1 sees: "You Won! 🎉"
- Player 2 sees: "You Lost 😞"
- Both see the final board state
- No more moves can be made

### Test 4: Draw Condition

Play until all 9 cells are filled without a winner:

```
X | O | X
---------
O | X | X
---------
O | X | O
```

**Expected:**

- Both players see: "It's a Draw! 🤝"

### Test 5: Real-Time Updates

**Test move synchronization:**

1. Player 1 makes a move
2. **Instantly**, Player 2 should see the move appear
3. Player 2 makes a move
4. **Instantly**, Player 1 should see the move appear

**Expected latency:** < 150ms between move and update

### Test 6: Invalid Moves

**Try these invalid actions:**

1. Click on an already occupied cell
   - ❌ Nothing should happen
2. Try to move when it's opponent's turn
   - ❌ Cell should not be clickable
3. Try to move after game is over
   - ❌ Board should be disabled

### Test 7: WebSocket Reconnection

**Test connection resilience:**

1. Start a game with both players
2. In browser DevTools → Network → set "Offline"
3. Wait 5 seconds
4. Set back to "Online"
5. **Expected:** WebSocket should reconnect automatically

### Test 8: Backend Validation

**Test with cURL:**

Create a game:

```bash
TOKEN="your_access_token_here"

curl -X POST http://localhost:8080/api/v1/games/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"game_type": "tictactoe"}'
```

Expected response:

```json
{
  "id": "...",
  "type": "tictactoe",
  "status": "waiting",
  "player1_id": "...",
  "player1_name": "...",
  ...
}
```

Get game state:

```bash
GAME_ID="game_id_from_above"

curl http://localhost:8080/api/v1/games/$GAME_ID \
  -H "Authorization: Bearer $TOKEN"
```

### Test 9: Multiple Concurrent Games

1. Create Game A with Player 1 & 2
2. Create Game B with Player 3 & 4
3. Both games should run independently
4. Moves in Game A should NOT appear in Game B

### Test 10: Database Persistence

**Verify game state in Redis:**

```bash
docker exec -it playforge-redis redis-cli

# List all game keys
KEYS game:*

# Get a specific game
GET game:{game_id}

# Should see JSON game state
```

## Success Criteria

✅ WebSocket connection establishes successfully  
✅ Two players can join the same game  
✅ Moves appear in real-time for both players  
✅ Turn-based logic works correctly  
✅ Win detection works (rows, columns, diagonals)  
✅ Draw detection works  
✅ Invalid moves are blocked  
✅ UI shows correct player turn  
✅ Game state persists in Redis  
✅ WebSocket auto-reconnects on disconnect  
✅ P95 latency < 150ms for moves

## Common Issues

### WebSocket Connection Fails

**Error:** "Failed to connect to game server"

**Solutions:**

1. Check backend is running: `curl http://localhost:8080/health`
2. Check WebSocket URL in browser console
3. Verify JWT token is valid
4. Check CORS settings

### Game Not Loading

**Error:** "Game not found"

**Solutions:**

1. Verify game ID in URL
2. Check Redis is running: `docker ps | grep redis`
3. Check game hasn't expired (4 hour TTL)

### Moves Not Syncing

**Problem:** Player 2 doesn't see Player 1's move

**Solutions:**

1. Open browser DevTools → Network → WS
2. Check WebSocket messages are being sent/received
3. Verify both players are in the same game
4. Check backend logs for errors

### Frontend Build Errors

```bash
cd frontend
rm -rf node_modules
npm install
npm run dev
```

## Performance Testing

### Measure Move Latency

**In Browser DevTools → Console:**

```javascript
// Before making a move
const start = performance.now();

// Make move on board

// When opponent sees it (check Network → WS tab for message)
const end = performance.now();
console.log(`Latency: ${end - start}ms`);
```

**Target:** < 150ms

### Load Testing

**Simulate multiple games:**

```bash
# Create 10 concurrent games
for i in {1..10}; do
  curl -X POST http://localhost:8080/api/v1/games/create \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"game_type": "tictactoe"}' &
done
wait
```

## Debugging Tips

### View WebSocket Messages

**Browser DevTools:**

1. Network tab
2. Filter by "WS"
3. Click on websocket connection
4. View "Messages" tab
5. See real-time message flow

### View Backend Logs

```bash
# In terminal where backend is running
# You should see:
# - Client registered: {client_id}
# - Client added to game {game_id}
# - Game move from client {client_id}
```

### Check Game State in Redis

```bash
docker exec -it playforge-redis redis-cli

# Get specific game
GET game:{game_id}

# Check TTL
TTL game:{game_id}

# Should show remaining seconds (max 14400 = 4 hours)
```

## Next Steps (Week 3)

After Week 2 is tested and working:

- Matchmaking queue system
- Private room creation with codes
- Room management (multiple participants)
- Spectator mode

---

**Status:** Week 2 Complete  
**Deliverable:** Two players can play Tic-Tac-Toe in real-time ✅
