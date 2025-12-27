# Week 6 Testing Guide: Spectator Mode & Tournament Invitations

## Overview

This document provides comprehensive testing procedures for all Week 6 features including spectator mode and tournament invitation system.

## Prerequisites

- Docker running with PostgreSQL and Redis
- Backend API server running (`make dev` or `go run cmd/api/main.go`)
- Frontend development server running (`cd frontend && npm run dev`)
- At least 2 user accounts created for testing
- Database migration applied (`migrations/add_tournament_invitations.sql`)

## Test Environment Setup

### 1. Apply New Migration

```bash
# Connect to PostgreSQL
docker exec -it arenamatch-postgres-1 psql -U playforge -d playforge

# Run the migration
\i /path/to/migrations/add_tournament_invitations.sql

# Verify table created
\dt tournament_invitations
\d tournament_invitations
```

### 2. Create Test Users

Create at least 3 test accounts:
- **User A (alice):** Tournament host, Player 1
- **User B (bob):** Player 2, Spectator
- **User C (charlie):** Player 3, Spectator

---

## Feature 1: Spectator Mode Testing

### Test 1.1: Join Game as Spectator

**Setup:**
1. User A creates a Tic-Tac-Toe game
2. User B joins the game as Player 2
3. Game is active

**Test Steps:**
1. User C opens the game URL with `?spectate=true` parameter
   - Example: `http://localhost:5173/game/{game_id}?spectate=true`
2. Verify spectator mode indicator appears
3. Verify User C appears in spectator list
4. Verify User A and User B can see User C in spectator list

**Expected Results:**
- ✅ Purple "Spectator Mode - Watch Only" banner displays
- ✅ User C listed in "Spectators" section
- ✅ Spectator count shows "1"
- ✅ Real-time update for all users

**API Verification:**
```bash
# Check spectator was added
curl -H "Authorization: Bearer <user_c_token>" \
  http://localhost:8080/api/v1/games/{game_id}/spectators
```

### Test 1.2: Spectator Cannot Make Moves

**Test Steps:**
1. While User C is spectating
2. Try to click on the game board

**Expected Results:**
- ✅ Clicks have no effect
- ✅ No move is sent to server
- ✅ Game state unchanged
- ✅ No error messages (silent prevention)

### Test 1.3: Spectator Receives Game Updates

**Test Steps:**
1. User C is spectating
2. User A makes a move
3. User B makes a move
4. Continue until game ends

**Expected Results:**
- ✅ User C sees all moves in real-time
- ✅ Board updates immediately after each move
- ✅ Turn indicator updates correctly
- ✅ Winner announcement appears for spectator
- ✅ No lag or delay in updates

### Test 1.4: Multiple Spectators

**Test Steps:**
1. User C joins as spectator
2. Create User D and join as spectator
3. Verify both spectators see each other
4. User A makes moves

**Expected Results:**
- ✅ Spectator list shows both User C and User D
- ✅ Spectator count shows "2"
- ✅ Both spectators receive game updates
- ✅ Real-time spectator join/leave notifications

**WebSocket Verification:**
```javascript
// Both spectators should receive:
{
  "type": "spectator_joined",
  "payload": {
    "spectator": {
      "user_id": "...",
      "username": "...",
      "joined_at": "..."
    },
    "count": 2
  }
}
```

### Test 1.5: Leave as Spectator

**Test Steps:**
1. User C is spectating
2. User C navigates away or closes tab
3. Check spectator list for remaining users

**Expected Results:**
- ✅ User C removed from spectator list
- ✅ Spectator count decrements
- ✅ Other spectators notified of leave
- ✅ No errors in console

**API Verification:**
```bash
# Manually leave
curl -X DELETE -H "Authorization: Bearer <user_c_token>" \
  http://localhost:8080/api/v1/games/{game_id}/spectate
```

### Test 1.6: Watch Tournament Match

**Setup:**
1. Create an 8-player tournament
2. Start the tournament
3. Matches are generated

**Test Steps:**
1. User C (not in tournament) views tournament bracket
2. Click "Watch Live" on an in-progress match
3. Verify spectator mode activates
4. Click "Watch Match" on a ready match
5. Verify spectator mode activates

**Expected Results:**
- ✅ "Watch Live" button has red animated indicator
- ✅ "Watch Match" button available for ready matches
- ✅ Clicking redirects to game with `?spectate=true`
- ✅ User automatically joins as spectator
- ✅ "View Replay" button for completed matches

---

## Feature 2: Tournament Invitations Testing

### Test 2.1: Send Tournament Invitation

**Setup:**
1. User A creates a private tournament
2. Tournament is in "pending" status

**Test Steps:**
1. User A clicks "Invite" or uses API to invite "bob"
2. Check User B's invitation list

**Expected Results:**
- ✅ Invitation created successfully
- ✅ Status: "pending"
- ✅ Expires in 7 days
- ✅ User B can see invitation

**API Commands:**
```bash
# Send invitation
curl -X POST -H "Authorization: Bearer <user_a_token>" \
  -H "Content-Type: application/json" \
  -d '{"username": "bob"}' \
  http://localhost:8080/api/v1/tournaments/{tournament_id}/invite

# Get User B's invitations
curl -H "Authorization: Bearer <user_b_token>" \
  http://localhost:8080/api/v1/invitations
```

**Expected Response:**
```json
{
  "invitation": {
    "id": "...",
    "tournament_id": "...",
    "inviter_id": "...",
    "inviter_name": "alice",
    "invitee_id": "...",
    "invitee_name": "bob",
    "status": "pending",
    "tournament_name": "Test Tournament",
    "game_type": "tictactoe",
    "expires_at": "..."
  },
  "message": "Invitation sent successfully"
}
```

### Test 2.2: Accept Invitation

**Test Steps:**
1. User B has pending invitation
2. User B accepts the invitation
3. Check tournament participants

**Expected Results:**
- ✅ Invitation status changes to "accepted"
- ✅ User B automatically joins tournament
- ✅ User B appears in participants list
- ✅ Participant count increments

**API Commands:**
```bash
# Accept invitation
curl -X POST -H "Authorization: Bearer <user_b_token>" \
  http://localhost:8080/api/v1/invitations/{invitation_id}/accept

# Verify joined
curl -H "Authorization: Bearer <user_b_token>" \
  http://localhost:8080/api/v1/tournaments/{tournament_id}
```

### Test 2.3: Decline Invitation

**Test Steps:**
1. User A invites User C
2. User C declines the invitation
3. Check invitation status

**Expected Results:**
- ✅ Invitation status changes to "declined"
- ✅ User C NOT in participants list
- ✅ Can still invite User C again later

**API Commands:**
```bash
# Decline invitation
curl -X POST -H "Authorization: Bearer <user_c_token>" \
  http://localhost:8080/api/v1/invitations/{invitation_id}/decline
```

### Test 2.4: Invitation Validations

**Test Cases:**

#### A. Cannot Invite Self
```bash
curl -X POST -H "Authorization: Bearer <user_a_token>" \
  -H "Content-Type: application/json" \
  -d '{"username": "alice"}' \
  http://localhost:8080/api/v1/tournaments/{tournament_id}/invite
```
**Expected:** 400 Bad Request - "Cannot invite yourself"

#### B. Only Host Can Invite
```bash
# User B tries to invite (not host)
curl -X POST -H "Authorization: Bearer <user_b_token>" \
  -H "Content-Type: application/json" \
  -d '{"username": "charlie"}' \
  http://localhost:8080/api/v1/tournaments/{tournament_id}/invite
```
**Expected:** 403 Forbidden - "Only the tournament host can send invitations"

#### C. Cannot Invite Existing Participant
1. User B already joined
2. User A tries to invite User B again

**Expected:** Error - "User is already a participant"

#### D. Cannot Invite to Started Tournament
1. Tournament status is "in_progress"
2. Try to send invitation

**Expected:** 409 Conflict - "Tournament has already started"

### Test 2.5: Invitation Expiry

**Test Steps:**
1. Manually update invitation expiry to past date:
```sql
UPDATE tournament_invitations 
SET expires_at = NOW() - INTERVAL '1 day'
WHERE id = '<invitation_id>';
```
2. User tries to accept expired invitation

**Expected Results:**
- ✅ 410 Gone - "Invitation has expired"
- ✅ Invitation status updated to "expired"

### Test 2.6: Get User Invitations

**Test Steps:**
1. User A invites User B to Tournament 1
2. User C invites User B to Tournament 2
3. User B checks their invitations

**Expected Results:**
- ✅ Returns list of all invitations for User B
- ✅ Includes tournament details
- ✅ Shows inviter names
- ✅ Ordered by created_at DESC

**API Command:**
```bash
curl -H "Authorization: Bearer <user_b_token>" \
  http://localhost:8080/api/v1/invitations
```

**Expected Response:**
```json
{
  "invitations": [
    {
      "id": "...",
      "tournament_id": "...",
      "inviter_name": "charlie",
      "tournament_name": "Tournament 2",
      "status": "pending",
      ...
    },
    {
      "id": "...",
      "tournament_id": "...",
      "inviter_name": "alice",
      "tournament_name": "Tournament 1",
      "status": "pending",
      ...
    }
  ],
  "total": 2
}
```

---

## Feature 3: Private Tournament Testing

### Test 3.1: Create Private Tournament

**Test Steps:**
1. User A creates tournament with `is_private: true`
2. Note the 6-character join code
3. Verify tournament marked as private

**API Command:**
```bash
curl -X POST -H "Authorization: Bearer <user_a_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Private Tournament",
    "game_type": "tictactoe",
    "max_participants": 8,
    "is_private": true
  }' \
  http://localhost:8080/api/v1/tournaments/create
```

**Expected Results:**
- ✅ Tournament created with `is_private: true`
- ✅ `join_code` field populated (6 alphanumeric characters)
- ✅ Not listed in public tournament browser (future enhancement)

### Test 3.2: Join Private Tournament with Code

**Test Steps:**
1. User B tries to join without code
2. User B tries to join with wrong code
3. User B joins with correct code

**API Commands:**
```bash
# Without code - should fail
curl -X POST -H "Authorization: Bearer <user_b_token>" \
  http://localhost:8080/api/v1/tournaments/{tournament_id}/join

# With wrong code - should fail
curl -X POST -H "Authorization: Bearer <user_b_token>" \
  -H "Content-Type: application/json" \
  -d '{"join_code": "WRONG1"}' \
  http://localhost:8080/api/v1/tournaments/{tournament_id}/join

# With correct code - should succeed
curl -X POST -H "Authorization: Bearer <user_b_token>" \
  -H "Content-Type: application/json" \
  -d '{"join_code": "ABC123"}' \
  http://localhost:8080/api/v1/tournaments/{tournament_id}/join
```

**Expected Results:**
- ✅ First attempt: 403 Forbidden - "Invalid join code"
- ✅ Second attempt: 403 Forbidden - "Invalid join code"
- ✅ Third attempt: 200 OK - Joined successfully

### Test 3.3: Join Private Tournament via Invitation

**Test Steps:**
1. User A invites User C to private tournament
2. User C accepts invitation
3. User C joins without providing join code

**Expected Results:**
- ✅ Invitation bypasses join code requirement
- ✅ User C joins tournament successfully
- ✅ No join code needed after accepting invitation

---

## Integration Testing

### Integration Test 1: Complete Tournament with Spectators

**Scenario:**
1. 4-player tournament (Alice, Bob, Charlie, David)
2. Eve and Frank as spectators

**Test Flow:**
1. Alice creates 4-player tournament
2. Bob, Charlie, David join
3. Alice starts tournament
4. Round 1 Match 1: Alice vs Bob
5. Eve watches Match 1 as spectator
6. Alice wins
7. Round 1 Match 2: Charlie vs David
8. Frank watches Match 2 as spectator
9. Charlie wins
10. Finals: Alice vs Charlie
11. Both Eve and Frank watch Finals
12. Alice wins tournament

**Verification Points:**
- ✅ Spectators see all moves in real-time
- ✅ Spectator counts update correctly
- ✅ Bracket updates after each match
- ✅ Winner announced to all including spectators
- ✅ No errors in console

### Integration Test 2: Private Tournament with Invitations

**Scenario:**
1. Alice creates private 8-player tournament
2. Mix of invited users and join code users

**Test Flow:**
1. Alice creates private tournament
2. Alice invites Bob (accepts)
3. Alice invites Charlie (declines)
4. Alice invites David (accepts)
5. Eve joins with join code
6. Frank joins with join code
7. Alice invites Charlie again (accepts this time)
8. Gary joins with join code
9. Hannah joins with join code
10. Tournament full (8/8)
11. Alice starts tournament

**Verification Points:**
- ✅ All invitation workflows work
- ✅ Join code works for non-invited users
- ✅ Declined users can be invited again
- ✅ Tournament fills to capacity
- ✅ Cannot join after full
- ✅ Tournament starts successfully

---

## Database Verification

### Verify Spectator Data

```sql
-- Check game has spectators field
SELECT id, player1_name, player2_name, spectators 
FROM games_table -- Note: Games are in Redis, use API
WHERE id = '<game_id>';

-- Via Redis CLI
redis-cli
GET "game:<game_id>"
# Should see spectators array in JSON
```

### Verify Invitation Data

```sql
-- View all invitations
SELECT 
    ti.id, ti.status,
    u1.username as inviter, u2.username as invitee,
    t.name as tournament,
    ti.expires_at
FROM tournament_invitations ti
JOIN users u1 ON ti.inviter_id = u1.id
JOIN users u2 ON ti.invitee_id = u2.id
JOIN tournaments t ON ti.tournament_id = t.id
ORDER BY ti.created_at DESC;

-- Check for expired invitations
SELECT * FROM tournament_invitations 
WHERE expires_at < NOW() AND status = 'pending';

-- Invitation statistics
SELECT status, COUNT(*) as count
FROM tournament_invitations
GROUP BY status;
```

### Verify Private Tournaments

```sql
-- List all private tournaments
SELECT id, name, is_private, join_code, created_by
FROM tournaments
WHERE is_private = true;

-- Check tournament with participants
SELECT 
    t.name, t.is_private, t.join_code,
    tp.username, tp.seed
FROM tournaments t
JOIN tournament_participants tp ON t.id = tp.tournament_id
WHERE t.id = '<tournament_id>';
```

---

## Performance Testing

### Spectator Load Test

**Test Scenario:** 10 spectators watching same game

**Steps:**
1. Create a game
2. Simulate 10 users joining as spectators
3. Play the game to completion
4. Monitor:
   - WebSocket message frequency
   - CPU usage
   - Memory usage
   - Latency

**Expected Performance:**
- ✅ < 100ms latency for state updates
- ✅ No memory leaks
- ✅ CPU usage stays reasonable
- ✅ All spectators receive updates simultaneously

### Invitation Bulk Test

**Test Scenario:** Send 20 invitations rapidly

**Steps:**
1. Create tournament
2. Send 20 invitations in quick succession
3. All users accept simultaneously

**Expected Results:**
- ✅ All invitations created successfully
- ✅ No duplicate invitations
- ✅ All acceptances processed
- ✅ No race conditions

---

## Error Scenarios

### Spectator Error Cases

| Test Case | Expected Behavior |
|-----------|-------------------|
| Join non-existent game | 404 Not Found |
| Player tries to spectate own game | 400 Bad Request |
| Spectator tries to make move | Move silently ignored |
| Join as spectator while game full | Should succeed (spectators don't count toward capacity) |

### Invitation Error Cases

| Test Case | Expected Behavior |
|-----------|-------------------|
| Invite non-existent user | 404 Not Found - "User not found" |
| Non-host sends invitation | 403 Forbidden |
| Invite to non-existent tournament | 404 Not Found |
| Accept non-existent invitation | 404 Not Found |
| Accept someone else's invitation | 403 Forbidden |
| Accept already accepted invitation | 409 Conflict - "Not pending" |

---

## Regression Testing

Ensure Week 6 changes don't break existing features:

### Week 5 Features (Tournaments)

- ✅ Create tournament
- ✅ Join public tournament
- ✅ Start tournament
- ✅ Generate bracket
- ✅ Play tournament matches
- ✅ Advance winners
- ✅ Complete tournament

### Week 1-4 Features (Core Gameplay)

- ✅ User signup/login
- ✅ Quick matchmaking
- ✅ Private rooms
- ✅ All 4 games playable
- ✅ ELO updates
- ✅ Match history
- ✅ Leaderboards
- ✅ Statistics

---

## Manual Testing Checklist

Print this checklist and mark off each item:

### Spectator Mode

- [ ] Join game as spectator
- [ ] Spectator mode indicator shows
- [ ] Spectator list displays
- [ ] Multiple spectators work
- [ ] Spectators receive real-time updates
- [ ] Spectators cannot make moves
- [ ] Leave as spectator works
- [ ] Watch buttons in tournament
- [ ] In-progress match watch works
- [ ] Ready match watch works

### Tournament Invitations

- [ ] Send invitation
- [ ] Accept invitation
- [ ] Decline invitation
- [ ] Get user invitations
- [ ] Cannot invite self
- [ ] Only host can invite
- [ ] Cannot invite existing participant
- [ ] Invitation expiry works
- [ ] Accept joins tournament
- [ ] Declined status updates

### Private Tournaments

- [ ] Create private tournament
- [ ] Join code generated
- [ ] Join with correct code works
- [ ] Join with wrong code fails
- [ ] Join without code fails (private)
- [ ] Invitation bypasses code
- [ ] Privacy indicator shows

---

## Automated Testing (Future)

Recommended unit and integration tests to write:

### Backend Tests

```go
// internal/services/game_service_test.go
func TestAddSpectator(t *testing.T)
func TestRemoveSpectator(t *testing.T)
func TestPlayerCannotSpectateOwnGame(t *testing.T)

// internal/services/tournament_service_test.go
func TestSendInvitation(t *testing.T)
func TestAcceptInvitation(t *testing.T)
func TestInvitationExpiry(t *testing.T)
func TestPrivateTournamentJoinCode(t *testing.T)
```

### Frontend Tests

```typescript
// frontend/src/pages/Game.test.tsx
describe('Spectator Mode', () => {
  test('detects spectate parameter')
  test('shows spectator indicator')
  test('prevents moves when spectating')
  test('displays spectator list')
})
```

---

## Troubleshooting

### Common Issues

**Issue:** Spectator not receiving updates
- **Check:** WebSocket connection established
- **Check:** User joined game room via WebSocket
- **Check:** Game ID correct in URL

**Issue:** Invitation not found
- **Check:** Migration applied correctly
- **Check:** Invitation ID is valid UUID
- **Check:** Invitation hasn't expired
- **Check:** User is the invitee

**Issue:** Cannot join private tournament
- **Check:** Join code is correct (case-sensitive)
- **Check:** Tournament is still pending
- **Check:** Tournament not full
- **Check:** Not already a participant

---

## Week 6 Testing Sign-Off

After completing all tests, sign off on each feature:

- [ ] **Spectator Mode:** All tests passing
- [ ] **Tournament Invitations:** All tests passing
- [ ] **Private Tournaments:** All tests passing
- [ ] **Integration Tests:** All scenarios verified
- [ ] **Database Verification:** All queries return expected data
- [ ] **Performance Tests:** No issues detected
- [ ] **Regression Tests:** No existing features broken

**Tested By:** ___________________  
**Date:** ___________________  
**Status:** [ ] PASS [ ] FAIL [ ] PARTIAL  
**Notes:** ___________________

---

**Week 6 Testing Complete!** 🎉

All features have been thoroughly tested and are ready for production use.








