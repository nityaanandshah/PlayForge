# Week 3 - Testing Guide

## 🚀 Quick Start

### Prerequisites
- Week 1 & 2 working (auth, database, game engine, WebSocket)
- Backend running: `go run cmd/api/main.go`
- Frontend running: `npm run dev` in `frontend/`
- PostgreSQL and Redis containers running

### Test Environment
- Backend: `http://localhost:8080`
- Frontend: `http://localhost:5173`
- 2 browser windows (one incognito for second player)

---

## 🎯 Test Suite 1: Matchmaking

### Test 1.1: Join Matchmaking Queue

**Steps:**
1. Open `http://localhost:5173` and login
2. Click "🎯 Find Match (Matchmaking)"
3. Verify Tic-Tac-Toe is pre-selected
4. Click "Find Match"

**Expected Results:**
- ✅ Page shows "Finding Opponent..."
- ✅ Timer starts counting (0:00, 0:01, 0:02...)
- ✅ Blue animated pulse appears
- ✅ Rating displays (default: 1200)
- ✅ "Cancel" button visible

**Failure Cases:**
- ❌ Error message: "Failed to join queue"
- ❌ Page doesn't change

**API Check:**
```bash
# Get queue status for user
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/v1/matchmaking/status
```

---

### Test 1.2: Cancel Matchmaking

**Steps:**
1. While in queue (from Test 1.1)
2. Click "Cancel" button

**Expected Results:**
- ✅ Returns to game selection screen
- ✅ Timer resets
- ✅ No longer in queue
- ✅ "Find Match" button available again

**API Check:**
```bash
# Should return in_queue: false
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/v1/matchmaking/status
```

---

### Test 1.3: Two Players Matchmaking (Same Rating)

**Window 1 - Player 1:**
1. Login as User A (rating: 1200)
2. Go to Matchmaking
3. Click "Find Match"
4. Wait for match...

**Window 2 - Player 2 (Incognito):**
1. Login as User B (rating: 1200)
2. Go to Matchmaking
3. Click "Find Match"

**Expected Results:**
- ✅ Both players matched within 2-4 seconds
- ✅ Both navigate to room lobby automatically
- ✅ Same room ID in URL for both
- ✅ Both see each other in participant list
- ✅ Room has 2 participants

**Backend Logs:**
```
Matchmaking error for tictactoe: <nil>
Match found! Creating room...
```

---

### Test 1.4: Matchmaking Timeout

**⚠️ This test takes 5+ minutes**

**Steps:**
1. Join matchmaking queue
2. Wait 5 minutes without another player joining

**Expected Results:**
- ✅ After 5 minutes, queue status changes to "timeout"
- ✅ Error message: "Matchmaking timed out. Please try again."
- ✅ Returns to game selection
- ✅ Can rejoin queue

**Note:** For faster testing, modify `queueTimeout` in `matchmaking_service.go` to 30 seconds.

---

### Test 1.5: Rating-Based Matching

**Window 1 - High Rating Player:**
1. Modify user rating in database:
```sql
UPDATE users SET elo_rating = 1800 WHERE username = 'player1';
```
2. Join matchmaking

**Window 2 - Low Rating Player:**
1. Modify user rating:
```sql
UPDATE users SET elo_rating = 1000 WHERE username = 'player2';
```
2. Join matchmaking

**Expected Results:**
- ✅ Players DO NOT match immediately (rating diff = 800 > 200)
- ✅ After ~45 seconds, range expands enough to match
- ✅ Both players matched and navigate to room

**Rating Range Expansion:**
- 0:00 - Range: ±200 (800 diff > 400 total)
- 0:30 - Range: ±250 (800 diff > 500 total)
- 0:60 - Range: ±300 (800 diff > 600 total)
- 1:30 - Range: ±350 (800 diff > 700 total)
- 2:00 - Range: ±400 (800 diff ≤ 800 total) ✅ MATCHED

---

## 🏠 Test Suite 2: Private Rooms

### Test 2.1: Create Private Room

**Steps:**
1. Login and go to Dashboard
2. Click "🎮 Create/Join Room"
3. Verify "Create Room" tab is active
4. Select "Tic-Tac-Toe"
5. Select "Private" room type
6. Keep max players at 2
7. Click "Create Room"

**Expected Results:**
- ✅ Navigate to room lobby
- ✅ URL: `/room/{room_id}`
- ✅ Join code displayed (6 characters, e.g., "ABC123")
- ✅ "Copy Code" button visible
- ✅ You are listed as participant with "Host" badge
- ✅ You have "You" badge
- ✅ Empty slot shows "Waiting for player..."
- ✅ "Start Game" button visible but disabled

**API Check:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/v1/rooms/YOUR_ROOM_ID
```

---

### Test 2.2: Copy Join Code

**Steps:**
1. In room lobby (from Test 2.1)
2. Click "Copy Code" button

**Expected Results:**
- ✅ Alert: "Join code copied to clipboard!"
- ✅ Can paste code elsewhere (test with text editor)

**Manual Check:**
- Press Ctrl/Cmd+V → Should paste the 6-character code

---

### Test 2.3: Join Room by Code

**Window 2 (Incognito):**
1. Login as different user
2. Go to "Create/Join Room"
3. Click "Join by Code" tab
4. Enter the 6-character code from Test 2.2
5. Click "Join Room"

**Expected Results:**
- ✅ Navigate to same room lobby
- ✅ See host (Player 1) in participant list
- ✅ See yourself with "You" badge
- ✅ No empty slots remaining
- ✅ "Ready" button visible (not "Start Game")

**Window 1 (Host):**
- ✅ Participant list auto-updates with Player 2
- ✅ 2/2 players shown
- ✅ "Start Game" button still disabled (not all ready)

---

### Test 2.4: Ready System

**Window 2 (Player 2):**
1. In room lobby
2. Click "Ready" button

**Expected Results (Window 2):**
- ✅ Button text changes to "Not Ready"
- ✅ Your status shows "✓ Ready" (green)

**Expected Results (Window 1):**
- ✅ Player 2 status shows "✓ Ready"
- ✅ "Start Game" button still disabled (host not ready)

**Window 1 (Host):**
1. Click "Ready" button

**Expected Results (Window 1):**
- ✅ Your status shows "✓ Ready"
- ✅ "Start Game" button becomes enabled (green)

**Expected Results (Window 2):**
- ✅ Host status shows "✓ Ready"

---

### Test 2.5: Start Game from Room

**Window 1 (Host):**
1. With all players ready
2. Click "Start Game"

**Expected Results (Both Windows):**
- ✅ Navigate to `/game/{game_id}`
- ✅ Game board displays
- ✅ Player 1 = X (blue)
- ✅ Player 2 = O (red)
- ✅ Turn indicator shows
- ✅ Can play game normally

---

### Test 2.6: Leave Room

**Window 2 (Non-Host Player):**
1. In room lobby (before game starts)
2. Click "Leave Room"

**Expected Results (Window 2):**
- ✅ Navigate back to Dashboard
- ✅ No longer in room

**Expected Results (Window 1):**
- ✅ Player 2 removed from participant list
- ✅ Empty slot appears again
- ✅ Still showing as host
- ✅ "Start Game" disabled again

---

### Test 2.7: Host Transfer on Leave

**Window 1 (Original Host):**
1. Have Player 2 join room again
2. Host clicks "Leave Room"

**Expected Results (Window 1):**
- ✅ Navigate to Dashboard

**Expected Results (Window 2):**
- ✅ Become new host
- ✅ "Host" badge appears on your name
- ✅ "Start Game" button now visible (instead of "Ready")
- ✅ Original host removed from list

---

### Test 2.8: Invalid Join Code

**Steps:**
1. Go to "Create/Join Room"
2. Click "Join by Code"
3. Enter invalid code: "XXXXXX"
4. Click "Join Room"

**Expected Results:**
- ✅ Error message: "room not found with code: XXXXXX"
- ✅ Remain on join page
- ✅ Can try different code

---

### Test 2.9: Quick Play Room

**Steps:**
1. Create room
2. Select "Quick Play" instead of "Private"
3. Click "Create Room"

**Expected Results:**
- ✅ Room created successfully
- ✅ Join code still visible (but less prominent)
- ✅ Room functions same as private
- ✅ Room type badge shows "Quick Play"

---

## 🎮 Test Suite 3: Integration Tests

### Test 3.1: Dashboard Navigation

**Steps:**
1. Login to Dashboard
2. Verify all buttons present

**Expected Results:**
- ✅ "🎯 Find Match (Matchmaking)" button works
- ✅ "🎮 Create/Join Room" button works
- ✅ "⚡ Quick Play (Direct)" still works (old feature)
- ✅ "🏆 Tournaments" disabled (coming soon)

---

### Test 3.2: Direct Quick Play vs Matchmaking

**Window 1:**
1. Click "⚡ Quick Play (Direct)"

**Expected Results:**
- ✅ Creates game immediately
- ✅ Navigate to game page
- ✅ Shows "Waiting for opponent..."
- ✅ Can share game URL manually

**Window 2:**
1. Manually navigate to game URL from Window 1

**Expected Results:**
- ✅ Join game
- ✅ Game starts
- ✅ Works same as before (Week 2 feature)

**Comparison:**
- Quick Play = Manual URL sharing (Week 2)
- Matchmaking = Automatic pairing (Week 3)
- Rooms = Code-based invites (Week 3)

---

### Test 3.3: Room to Game Transition

**Both Windows:**
1. Create/join private room
2. Both mark ready
3. Host starts game

**Expected Results:**
- ✅ Room status changes to "active"
- ✅ Game ID assigned to room
- ✅ Both players navigate to game
- ✅ Game functions normally
- ✅ Can play full match

**After Game:**
- ⚠️ Players remain in game page
- ⚠️ Room likely expired or closed
- ✅ Can return to Dashboard

---

### Test 3.4: Multiple Concurrent Rooms

**Window 1 & 2:**
1. Create Room A, get code: "ABC123"

**Window 3 & 4:**
1. Create Room B, get code: "XYZ789"

**Expected Results:**
- ✅ Both rooms exist independently
- ✅ Can join Room A with "ABC123"
- ✅ Can join Room B with "XYZ789"
- ✅ No cross-room interference
- ✅ Each room has separate participants

---

### Test 3.5: Room Expiration (2 hours)

**⚠️ This test requires 2+ hours**

**Steps:**
1. Create room
2. Note room ID and join code
3. Wait 2 hours
4. Try to retrieve room

**Expected Results:**
- ✅ Room no longer accessible
- ✅ Join code doesn't work
- ✅ API returns "room not found"
- ✅ Redis automatically cleaned up

**Fast Test:**
- Modify `roomTTL` in `room_service.go` to 1 minute
- Restart backend
- Create room and wait 1 minute

---

## 🐛 Test Suite 4: Error Handling

### Test 4.1: Queue While Already in Queue

**Steps:**
1. Join matchmaking queue
2. Open new tab (same user)
3. Try to join queue again

**Expected Results:**
- ✅ Returns existing queue entry
- ✅ Shows current queue status
- ✅ Timer continues from actual queue time
- ⚠️ Or shows error (implementation dependent)

---

### Test 4.2: Join Room Already Full

**3 Players:**
1. Player 1 creates room (max: 2)
2. Player 2 joins successfully
3. Player 3 tries to join with same code

**Expected Results:**
- ✅ Player 3 gets error: "room is full"
- ✅ Room shows 2/2 players
- ✅ Player 3 remains on join page

---

### Test 4.3: Non-Host Tries to Start Game

**Steps:**
1. Player 2 (non-host) tries to POST to start endpoint
```bash
curl -X POST \
  -H "Authorization: Bearer PLAYER2_TOKEN" \
  http://localhost:8080/api/v1/rooms/ROOM_ID/start
```

**Expected Results:**
- ✅ Error: "only host can start the game"
- ✅ Game does not start
- ✅ Room remains in waiting state

---

### Test 4.4: Start Game Without All Ready

**Steps:**
1. Create room with 2 players
2. Only Player 1 marks ready
3. Host tries to start game

**Expected Results:**
- ✅ Error: "not all players are ready"
- ✅ "Start Game" button disabled
- ✅ Game does not start

---

### Test 4.5: Network Interruption During Matchmaking

**Steps:**
1. Join matchmaking queue
2. Disable network/close browser
3. Re-enable network/reopen browser
4. Login again

**Expected Results:**
- ⚠️ Queue entry may have expired
- ✅ Can join queue again
- ✅ No orphaned queue entries
- ✅ System recovers gracefully

---

## 📊 Test Suite 5: Performance & Stress

### Test 5.1: Rapid Queue Join/Leave

**Steps:**
1. Join queue
2. Immediately leave
3. Repeat 10 times rapidly

**Expected Results:**
- ✅ No crashes
- ✅ No orphaned queue entries
- ✅ Redis state consistent
- ✅ Final status accurate

---

### Test 5.2: Many Concurrent Matchmaking

**10+ Browser Windows:**
1. Have 10 players join queue simultaneously
2. Watch matchmaking worker pair them

**Expected Results:**
- ✅ All players paired within 2-4 seconds
- ✅ 5 rooms created (10 players / 2 per room)
- ✅ No duplicate matches
- ✅ All navigate to unique rooms

---

### Test 5.3: Large Room Participant List

**Steps:**
1. Create room with max_players: 4 (if supported)
2. Have 4 players join

**Expected Results:**
- ✅ All 4 participants display correctly
- ✅ UI not broken by 4 participant cards
- ✅ All can mark ready
- ✅ Game starts with correct players

---

## 🔍 Test Suite 6: Backend/Database

### Test 6.1: Redis Queue Structure

**Steps:**
```bash
# Connect to Redis
redis-cli

# Check matchmaking queue for tictactoe
ZRANGE matchmaking:queue:tictactoe 0 -1 WITHSCORES

# Check queue entry
GET matchmaking:entry:YOUR_ENTRY_ID

# Check user mapping
GET matchmaking:user:YOUR_USER_ID
```

**Expected Results:**
- ✅ Queue is sorted set with ratings as scores
- ✅ Entry contains full queue data
- ✅ User mapping points to correct entry ID

---

### Test 6.2: Room Data in Redis

**Steps:**
```bash
redis-cli

# Get room
GET room:YOUR_ROOM_ID

# Get join code mapping
GET room:code:ABC123

# Check TTL
TTL room:YOUR_ROOM_ID
# Should be ~7200 seconds (2 hours)
```

**Expected Results:**
- ✅ Room data is valid JSON
- ✅ Join code maps to correct room ID
- ✅ TTL decreasing over time

---

### Test 6.3: Matchmaking Worker Running

**Backend Logs:**
```
Server starting on port 8080
```

Every 2 seconds, if players in queue:
```
Matchmaking error for tictactoe: <nil>
```

On match:
```
Match found! Creating room...
```

**Expected Results:**
- ✅ Worker runs continuously
- ✅ Processes all game types
- ✅ Handles errors gracefully
- ✅ No memory leaks

---

## ✅ Test Summary Checklist

### Matchmaking
- [ ] Join queue works
- [ ] Queue timer accurate
- [ ] Cancel queue works
- [ ] Two players match automatically
- [ ] Navigate to room on match
- [ ] Queue timeout after 5 minutes
- [ ] Rating-based matching works

### Rooms
- [ ] Create private room
- [ ] Create quick play room
- [ ] Join code generated correctly
- [ ] Copy join code works
- [ ] Join by code works
- [ ] Participant list updates
- [ ] Ready status works
- [ ] Host can start game
- [ ] Game starts for all players
- [ ] Leave room works
- [ ] Host transfer works

### Integration
- [ ] Dashboard navigation works
- [ ] All 3 play modes functional
- [ ] Room to game transition smooth
- [ ] Multiple rooms independent
- [ ] No conflicts between features

### Error Handling
- [ ] Invalid join code handled
- [ ] Full room rejected
- [ ] Non-host can't start
- [ ] Unready players block start
- [ ] Network issues recovered

---

## 🎉 Success Criteria

✅ **Week 3 is successful if:**
1. Two players can find each other via matchmaking
2. Players can create and join private rooms via code
3. Room lobby shows all participants correctly
4. Ready system works and blocks game start
5. Host can start game when all ready
6. Game starts correctly from room
7. All error cases handled gracefully
8. UI is intuitive and responsive

---

## 🐛 Known Issues & Workarounds

**Issue 1:** Matchmaking worker delay
- **Symptom:** 2-4 second delay before match
- **Expected:** Worker runs every 2 seconds
- **Workaround:** None needed, working as designed

**Issue 2:** Room polling overhead
- **Symptom:** HTTP request every 2 seconds
- **Future:** Will upgrade to WebSocket
- **Workaround:** Acceptable for now

**Issue 3:** Direct navigation to room URL
- **Symptom:** Can bypass join code by guessing room ID
- **Future:** Add permission checks
- **Workaround:** Room IDs are UUIDs (hard to guess)

---

## 📞 Troubleshooting

### Problem: "Failed to join queue"
**Solution:**
1. Check backend is running
2. Check Redis is running: `docker ps`
3. Check auth token is valid
4. Check backend logs for errors

### Problem: Players don't match
**Solution:**
1. Check ratings are similar (within range)
2. Wait 30+ seconds for range expansion
3. Check backend logs for matchmaking errors
4. Verify matchmaking worker is running

### Problem: Join code doesn't work
**Solution:**
1. Verify code is exactly 6 characters
2. Check if room expired (2 hours)
3. Try uppercase: codes are case-sensitive
4. Check Redis for room existence

### Problem: "Start Game" button disabled
**Solution:**
1. Ensure all players marked ready
2. Check minimum 2 players in room
3. Verify you are the host
4. Check room status is "waiting" or "ready"

---

**Happy Testing! 🎮**

For bugs or issues, check backend logs and Redis state first.

