# Week 5 Testing Guide: Tournament System

## Overview

This guide covers comprehensive testing of the tournament system implemented in Week 5. Testing includes tournament creation, bracket generation, participant management, match progression, and the complete tournament lifecycle.

## Prerequisites

Before testing, ensure:
- ✅ Backend server is running (`make dev` or `go run cmd/api/main.go`)
- ✅ Frontend is running (`cd frontend && npm run dev`)
- ✅ PostgreSQL and Redis are running (`docker-compose up -d postgres redis`)
- ✅ Multiple user accounts created (minimum 4 for full bracket testing)
- ✅ Users logged in on different browsers/incognito windows

**Recommended Setup:**
- Browser 1: User "Alice" (tournament host)
- Browser 2: User "Bob" 
- Browser 3: User "Charlie"
- Browser 4: User "David"

## Test Environment

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- Database: PostgreSQL (localhost:5432)
- Cache: Redis (localhost:6379)

---

## Part 1: Tournament Creation & Browsing

### Test 1.1: Access Tournament Page

**Steps:**
1. Log in as any user
2. Click "🏆 Tournaments" in the navigation bar
3. Verify tournament browser page loads

**Expected Results:**
- ✅ Tournament page displays with title "🏆 Tournaments"
- ✅ "Create Tournament" button visible in top-right
- ✅ Filter dropdown shows "All Tournaments" by default
- ✅ Empty state message if no tournaments exist
- ✅ Refresh button functional

### Test 1.2: Create Tournament (Valid Input)

**Steps:**
1. On tournament page, click "➕ Create Tournament"
2. Enter tournament name: "Friday Night Championship"
3. Select game type: "❌ Tic-Tac-Toe"
4. Select max participants: "8 Players"
5. Click "Create" button

**Expected Results:**
- ✅ Modal opens with form fields
- ✅ All fields have default values
- ✅ After clicking Create, modal closes
- ✅ Redirected to tournament lobby page
- ✅ Tournament status shows "PENDING"
- ✅ User is listed as first participant with HOST badge
- ✅ Participant count shows "1"

**Backend Verification:**
```bash
# Check tournament in database
psql -U playforge -d playforge -c "SELECT id, name, status FROM tournaments ORDER BY created_at DESC LIMIT 1;"
```

### Test 1.3: Create Tournament (Invalid Input)

**Steps:**
1. Click "Create Tournament"
2. Leave name field empty
3. Try to submit

**Expected Results:**
- ✅ Browser validation prevents submission
- ✅ Required field indicator shows

### Test 1.4: Tournament Browser Display

**Steps:**
1. Create 2-3 tournaments with different statuses
2. Navigate to `/tournaments`
3. Observe tournament cards

**Expected Results:**
- ✅ Each tournament shows as a card
- ✅ Card displays: name, game type emoji, status badge, participant count
- ✅ Status badges colored correctly:
  - Yellow: PENDING
  - Blue: IN PROGRESS
  - Green: COMPLETE
- ✅ "Join" button for pending tournaments
- ✅ "View" button for started/completed tournaments

### Test 1.5: Filter Tournaments by Status

**Steps:**
1. Create tournaments in different statuses (pending, in progress)
2. Use status filter dropdown
3. Select "Open for Join"

**Expected Results:**
- ✅ Only pending tournaments display
- ✅ Filter updates immediately
- ✅ Selecting "All Tournaments" shows all again

---

## Part 2: Joining Tournaments

### Test 2.1: Join Tournament as Second Participant

**Setup:** Tournament created by Alice with 8 max participants

**Steps (as Bob):**
1. Navigate to `/tournaments`
2. Find Alice's tournament
3. Click the tournament card or "Join" button
4. Verify redirect to tournament lobby

**Expected Results:**
- ✅ Successfully joined tournament
- ✅ Participant list shows both Alice and Bob
- ✅ Alice has HOST badge
- ✅ Bob has Seed #2
- ✅ Start button still disabled (need more players for power of 2)

**Backend Verification:**
```bash
# Check participants count
psql -U playforge -d playforge -c "SELECT tournament_id, COUNT(*) FROM tournament_participants GROUP BY tournament_id;"
```

### Test 2.2: Join Tournament (Already Joined)

**Steps:**
1. Bob clicks "Join" again on same tournament
2. Or Bob navigates to tournament lobby

**Expected Results:**
- ✅ No error occurs
- ✅ Participant not duplicated
- ✅ Lobby shows Bob as already participating

### Test 2.3: Multiple Users Join

**Steps:**
1. Charlie joins the tournament
2. David joins the tournament
3. Check participant list in real-time

**Expected Results:**
- ✅ All 4 users appear in participant list
- ✅ Each has unique seed number (1, 2, 3, 4)
- ✅ ELO ratings displayed correctly
- ✅ Participant count updates to "4"
- ✅ Start button becomes enabled for host

**Real-time Update Test:**
- ✅ Alice's browser updates participant list automatically (within 3 seconds)
- ✅ All browsers show same participant list

### Test 2.4: Join Full Tournament

**Steps:**
1. Create tournament with max 4 participants
2. Have 4 users join
3. Try to join with 5th user

**Expected Results:**
- ✅ Error message: "Tournament is full"
- ✅ 5th user not added to participant list
- ✅ HTTP 409 Conflict status

### Test 2.5: Join Started Tournament

**Steps:**
1. Create and start a tournament
2. Try to join with new user

**Expected Results:**
- ✅ Error message: "Tournament has already started"
- ✅ User not added
- ✅ HTTP 409 Conflict status

---

## Part 3: Starting Tournament & Bracket Generation

### Test 3.1: Start Tournament (Insufficient Participants)

**Setup:** Tournament with only 3 participants

**Steps (as host):**
1. Navigate to tournament lobby
2. Try to click "Start Tournament" button

**Expected Results:**
- ✅ Start button is disabled
- ✅ Message shows: "Need at least 2 participants (must be power of 2)"
- ✅ Cannot start tournament

### Test 3.2: Start Tournament (Non-Power-of-2 Participants)

**Setup:** Tournament with 5 participants

**Steps (as host):**
1. Try to click "Start Tournament"

**Expected Results:**
- ✅ Start button disabled OR
- ✅ Error message: "must have a power of 2 participants"
- ✅ Tournament remains in pending status

### Test 3.3: Start Tournament Successfully (4 Participants)

**Setup:** Tournament with exactly 4 participants: Alice, Bob, Charlie, David

**Steps (as Alice - host):**
1. Verify all 4 participants present
2. Click "🚀 Start Tournament" button
3. Wait for bracket generation

**Expected Results:**
- ✅ Button shows "⏳ Starting..." during processing
- ✅ Tournament status changes to "IN PROGRESS"
- ✅ Bracket visualization appears
- ✅ Shows 2 rounds: "Semifinals" and "Finals"
- ✅ Semifinals has 2 matches
- ✅ Finals has 1 match
- ✅ Participants placed in matches (seeded by join order)
- ✅ Match cards show player names
- ✅ All matches show status "READY" (colored indigo)

**Bracket Structure Verification (4 participants):**
```
Semifinals (Round 1):
- Match 1: Alice (Seed 1) vs David (Seed 4)
- Match 2: Bob (Seed 2) vs Charlie (Seed 3)

Finals (Round 2):
- Match 1: Winner of Match 1 vs Winner of Match 2
```

### Test 3.4: Start Tournament (8 Participants)

**Setup:** Get 8 users to join

**Steps:**
1. Start tournament with 8 participants
2. Examine bracket structure

**Expected Results:**
- ✅ 3 rounds: "Quarterfinals", "Semifinals", "Finals"
- ✅ Quarterfinals: 4 matches
- ✅ Semifinals: 2 matches
- ✅ Finals: 1 match
- ✅ Total of 7 matches
- ✅ Seeding: 1v8, 4v5, 2v7, 3v6

**Mathematical Verification:**
- Total rounds = log2(8) = 3 ✅
- Total matches = 8 - 1 = 7 ✅

### Test 3.5: Start Tournament (Non-Host Attempt)

**Steps (as Bob - not host):**
1. Navigate to tournament lobby
2. Look for start button

**Expected Results:**
- ✅ Start button not visible for non-host users
- ✅ If API called directly, returns HTTP 403 Forbidden
- ✅ Error: "Only the tournament host can start the tournament"

---

## Part 4: Bracket Visualization

### Test 4.1: Bracket Display Accuracy

**Setup:** Started tournament with 4 participants

**Steps:**
1. View tournament lobby after start
2. Examine bracket layout

**Expected Results:**
- ✅ Bracket displays horizontally (left to right)
- ✅ Each round in separate column
- ✅ Round headers show correct names
- ✅ Match cards display both players
- ✅ "vs" separator between players
- ✅ Match numbers shown (Match 1, Match 2, etc.)
- ✅ Player avatars (initials in colored circles)
- ✅ Blue avatar for Player 1, Red avatar for Player 2

### Test 4.2: Match Status Indicators

**Steps:**
1. Observe match card colors
2. Check status progression

**Expected Results:**
- ✅ Ready matches: Indigo border and background
- ✅ Pending matches (TBD players): Gray border
- ✅ In Progress matches: Blue border (if applicable)
- ✅ Complete matches: Green border with trophy emoji

### Test 4.3: TBD Player Display

**Steps:**
1. Look at Round 2+ matches before Round 1 completes
2. Check player slots

**Expected Results:**
- ✅ Shows "TBD" for unknown players
- ✅ Question mark avatar
- ✅ Match status shows "Pending"

### Test 4.4: Responsive Bracket Design

**Steps:**
1. View bracket on desktop (1920px width)
2. View on tablet (768px width)
3. View on mobile (375px width)

**Expected Results:**
- ✅ Desktop: All rounds visible side-by-side
- ✅ Tablet: Horizontal scroll available
- ✅ Mobile: Horizontal scroll with touch gestures
- ✅ Match cards readable at all sizes
- ✅ No layout breaking

---

## Part 5: Playing Tournament Matches

### Test 5.1: Navigate to Tournament Match

**Setup:** Tournament started, first round matches ready

**Steps:**
1. In tournament lobby, find your match
2. Click "▶️ Watch/Play" button
3. Verify navigation to game page

**Expected Results:**
- ✅ Button visible for ready matches
- ✅ Clicking navigates to `/game/{game_id}`
- ✅ Game loads normally
- ✅ Can play the match
- ✅ Game type matches tournament (Tic-Tac-Toe)

### Test 5.2: Complete Tournament Match

**Steps:**
1. Play and complete a match (Alice vs David)
2. Alice wins the game
3. Return to tournament lobby

**Expected Results:**
- ✅ Game completes normally
- ✅ Winner declared
- ✅ Navigating back to tournament shows:
  - Match status changed to "Complete"
  - Green border on match card
  - Alice shown with 🏆 trophy icon
  - Winner's name highlighted (green background)

**Note:** Auto-advancement to next round may require manual backend trigger in current implementation. Check if winner auto-fills in next round's match.

### Test 5.3: Bracket Advancement

**Steps:**
1. Complete Match 1: Alice beats David
2. Complete Match 2: Bob beats Charlie
3. Check Finals match

**Expected Results:**
- ✅ Semifinals matches both show "Complete"
- ✅ Finals match updates:
  - Player 1: Alice (winner of Match 1)
  - Player 2: Bob (winner of Match 2)
  - Status: "Ready" (colored indigo)
- ✅ "Watch/Play" button appears on Finals match

---

## Part 6: Tournament Completion

### Test 6.1: Complete Final Match

**Setup:** Finals match ready (Alice vs Bob)

**Steps:**
1. Play finals match
2. Alice wins
3. Return to tournament lobby

**Expected Results:**
- ✅ Finals match shows "Complete"
- ✅ Alice marked as winner with trophy
- ✅ Tournament status changes to "COMPLETE"
- ✅ Winner announcement appears:
  - Large trophy emoji (🏆)
  - "Tournament Complete!" message
  - Winner name displayed
  - Gold/orange gradient background
- ✅ Tournament no longer appears in "Open for Join" filter

### Test 6.2: View Completed Tournament

**Steps:**
1. Navigate away from tournament
2. Return to `/tournaments`
3. Find completed tournament
4. Click to view

**Expected Results:**
- ✅ Tournament listed with green "COMPLETE" badge
- ✅ Can still view full bracket
- ✅ All match results preserved
- ✅ Winner highlighted throughout bracket
- ✅ No action buttons (start/join)

### Test 6.3: Tournament History

**Steps:**
1. Check user's match history page
2. Look for tournament games

**Expected Results:**
- ✅ Tournament matches appear in history
- ✅ Clearly marked as tournament games
- ✅ Shows tournament name
- ✅ Links back to tournament bracket

---

## Part 7: Edge Cases & Error Handling

### Test 7.1: Tournament with Minimum Participants (2)

**Steps:**
1. Create tournament with 2 participants
2. Start tournament

**Expected Results:**
- ✅ Bracket generates with 1 round (Finals only)
- ✅ Both participants face each other directly
- ✅ Winner determined after 1 match

### Test 7.2: Tournament with Maximum Participants (32)

**Steps:**
1. Create tournament with max 32 participants
2. Get 32 users to join (use script/automation if needed)
3. Start tournament

**Expected Results:**
- ✅ Bracket generates with 5 rounds
- ✅ Round 1: 16 matches
- ✅ All matches properly seeded
- ✅ Performance acceptable (loads within 2 seconds)

### Test 7.3: Leave During Pending Status

**Steps:**
1. Join tournament
2. Try to leave before it starts

**Expected Results:**
- ✅ Leave functionality available (if implemented)
- ✅ OR: No leave option, must wait for start
- ✅ Participant list updates correctly

### Test 7.4: Abandon Match in Tournament

**Steps:**
1. Start tournament match
2. Close browser/disconnect
3. Reconnect and check tournament

**Expected Results:**
- ✅ Game handles disconnection gracefully
- ✅ Match may auto-forfeit after timeout
- ✅ OR: Match can resume on reconnect
- ✅ Tournament bracket updates accordingly

### Test 7.5: Concurrent Tournaments

**Steps:**
1. Create 3 separate tournaments
2. Different users host each
3. Start all simultaneously

**Expected Results:**
- ✅ All tournaments independent
- ✅ Brackets generate correctly
- ✅ No data corruption
- ✅ Users can participate in one at a time

### Test 7.6: Network Interruption

**Steps:**
1. In tournament lobby
2. Disconnect internet
3. Reconnect after 10 seconds

**Expected Results:**
- ✅ Error state shown
- ✅ Upon reconnect, data reloads
- ✅ Tournament state preserved
- ✅ Polling resumes automatically

---

## Part 8: API Testing

### Test 8.1: Create Tournament API

**Request:**
```bash
curl -X POST http://localhost:8080/api/v1/tournaments/create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Test Tournament",
    "game_type": "tictactoe",
    "tournament_type": "single_elimination",
    "max_participants": 8
  }'
```

**Expected Response:**
- ✅ HTTP 201 Created
- ✅ Returns tournament object with ID
- ✅ Status: "pending"
- ✅ Participants array contains creator

### Test 8.2: List Tournaments API

**Request:**
```bash
curl -X GET http://localhost:8080/api/v1/tournaments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
- ✅ HTTP 200 OK
- ✅ Returns array of tournaments
- ✅ Each tournament has full data
- ✅ Total count included

**With Filter:**
```bash
curl -X GET "http://localhost:8080/api/v1/tournaments?status=pending&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
- ✅ Only pending tournaments returned
- ✅ Limit respected

### Test 8.3: Get Tournament Details API

**Request:**
```bash
curl -X GET http://localhost:8080/api/v1/tournaments/{TOURNAMENT_ID} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
- ✅ HTTP 200 OK
- ✅ Full tournament object
- ✅ Includes participants array
- ✅ Includes bracket_data if started

### Test 8.4: Join Tournament API

**Request:**
```bash
curl -X POST http://localhost:8080/api/v1/tournaments/{TOURNAMENT_ID}/join \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
- ✅ HTTP 200 OK
- ✅ Updated tournament with new participant
- ✅ User added to participants array

**Error Case - Already Joined:**
- ✅ HTTP 200 OK (idempotent)
- ✅ No duplicate participant

**Error Case - Tournament Full:**
- ✅ HTTP 409 Conflict
- ✅ Error message: "Tournament is full"

### Test 8.5: Start Tournament API

**Request:**
```bash
curl -X POST http://localhost:8080/api/v1/tournaments/{TOURNAMENT_ID}/start \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
- ✅ HTTP 200 OK
- ✅ Tournament status: "in_progress"
- ✅ Bracket data populated
- ✅ Matches created in database

**Error Case - Not Host:**
- ✅ HTTP 403 Forbidden
- ✅ Error message: "Only the tournament host can start"

**Error Case - Insufficient Participants:**
- ✅ HTTP 409 Conflict
- ✅ Error message: "must have a power of 2 participants"

---

## Part 9: Database Verification

### Test 9.1: Check Tournament Record

```sql
-- View tournament
SELECT id, name, game_type, status, created_by, started_at 
FROM tournaments 
WHERE name = 'Friday Night Championship';

-- Check bracket data
SELECT id, name, bracket_data::json
FROM tournaments
WHERE status = 'in_progress'
LIMIT 1;
```

**Expected Results:**
- ✅ Tournament record exists
- ✅ Status correct
- ✅ Bracket data is valid JSON
- ✅ Timestamps populated

### Test 9.2: Check Tournament Matches

```sql
-- View tournament matches
SELECT tm.id, tm.round, tm.match_number, tm.status,
       u1.username as player1, u2.username as player2,
       w.username as winner
FROM tournament_matches tm
LEFT JOIN users u1 ON tm.player1_id = u1.id
LEFT JOIN users u2 ON tm.player2_id = u2.id
LEFT JOIN users w ON tm.winner_id = w.id
WHERE tm.tournament_id = 'YOUR_TOURNAMENT_ID'
ORDER BY tm.round, tm.match_number;
```

**Expected Results:**
- ✅ All matches present
- ✅ Round numbers correct
- ✅ Player assignments correct
- ✅ Winner recorded for completed matches

### Test 9.3: Check Room Integration

```sql
-- Verify tournament room
SELECT t.id as tournament_id, t.name, r.id as room_id, r.code
FROM tournaments t
JOIN rooms r ON t.room_id = r.id
WHERE t.name = 'Friday Night Championship';
```

**Expected Results:**
- ✅ Room exists for tournament
- ✅ Room has unique join code
- ✅ Room participants match tournament participants

---

## Part 10: Performance Testing

### Test 10.1: Page Load Performance

**Steps:**
1. Open browser DevTools (Network tab)
2. Navigate to `/tournaments`
3. Measure load time

**Expected Results:**
- ✅ Initial load: < 1 second
- ✅ Tournament list API: < 500ms
- ✅ No redundant requests
- ✅ Proper caching headers

### Test 10.2: Bracket Rendering Performance

**Steps:**
1. Create tournament with 32 participants
2. Start tournament
3. Measure bracket rendering time

**Expected Results:**
- ✅ Bracket renders in < 2 seconds
- ✅ No UI freezing
- ✅ Smooth scrolling
- ✅ React re-renders optimized

### Test 10.3: Real-time Update Performance

**Steps:**
1. Open tournament lobby on 5 different devices/browsers
2. Add participants
3. Measure update propagation

**Expected Results:**
- ✅ Updates appear within 3 seconds (polling interval)
- ✅ No missed updates
- ✅ Consistent state across all clients
- ✅ Server load acceptable

---

## Part 11: Security Testing

### Test 11.1: Unauthorized Access

**Steps:**
1. Logout
2. Try to access `/tournaments`

**Expected Results:**
- ✅ Redirected to login page
- ✅ Cannot view tournaments without auth

### Test 11.2: Authorization Checks

**Steps:**
1. As non-host, try to call start tournament API
2. Use curl with different user's token

**Expected Results:**
- ✅ HTTP 403 Forbidden
- ✅ Tournament not started
- ✅ Error message clear

### Test 11.3: Data Tampering

**Steps:**
1. Try to manually edit tournament ID in URL
2. Try to submit invalid participant count

**Expected Results:**
- ✅ Invalid ID returns 404
- ✅ Invalid data rejected with 400
- ✅ No SQL injection possible
- ✅ XSS protection working

---

## Test Summary Checklist

### Core Functionality
- [ ] Tournament creation with all game types
- [ ] Tournament browsing and filtering
- [ ] Joining tournaments
- [ ] Starting tournaments (power of 2 validation)
- [ ] Bracket generation (4, 8, 16, 32 participants)
- [ ] Bracket visualization
- [ ] Match status tracking
- [ ] Winner advancement
- [ ] Tournament completion

### User Experience
- [ ] Navigation integration
- [ ] Real-time updates
- [ ] Error messages clear and helpful
- [ ] Loading states shown
- [ ] Responsive design
- [ ] Accessibility (keyboard navigation)

### Integration
- [ ] Room system integration
- [ ] Game system integration
- [ ] User authentication
- [ ] ELO rating display
- [ ] Match history tracking

### Edge Cases
- [ ] Minimum participants (2)
- [ ] Maximum participants (32)
- [ ] Non-power-of-2 rejected
- [ ] Concurrent tournaments
- [ ] Network interruptions
- [ ] Browser refresh handling

### Performance
- [ ] Fast page loads
- [ ] Smooth bracket rendering
- [ ] Efficient polling
- [ ] Database queries optimized

### Security
- [ ] Authentication required
- [ ] Authorization enforced
- [ ] No data leaks
- [ ] Input validation
- [ ] XSS/CSRF protection

---

## Known Issues & Limitations

1. **Auto-Advancement:** Winner advancement may require manual backend trigger
2. **Bye Rounds:** Not implemented (requires exactly power of 2)
3. **Seeding:** Based on join order, not ELO
4. **Real-time:** Uses polling, not WebSocket (can be upgraded)
5. **Leave Tournament:** Not implemented for pending status

---

## Conclusion

This comprehensive testing guide covers all aspects of the tournament system. Following these tests ensures the tournament feature is production-ready and provides an excellent user experience. Any issues found should be documented and prioritized for fixes.

**Testing Complete When:**
- ✅ All core functionality tests pass
- ✅ No critical bugs found
- ✅ Performance acceptable
- ✅ Security validated
- ✅ User experience smooth

**Next Steps After Testing:**
- Document any bugs found
- Create issues for enhancements
- Gather user feedback
- Plan Week 6 features (Spectator Mode)

---

**Happy Testing! 🏆**





