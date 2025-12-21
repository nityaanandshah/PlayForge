# Week 4 Testing Guide: Additional Games

This guide provides comprehensive testing procedures for all 4 games implemented in Week 4.

## Prerequisites
- Backend server running (`go run cmd/api/main.go`)
- Frontend server running (`cd frontend && npm run dev`)
- PostgreSQL and Redis running (`docker-compose up -d`)
- Two user accounts (e.g., "alice" and "bob")

## Test 1: Connect-4 Game

### Test 1.1: Basic Gameplay
**Objective**: Verify Connect-4 game mechanics and win detection

**Steps**:
1. Log in as Alice
2. Navigate to "Find Match"
3. Select "Connect 4" (🔴🟡)
4. Click "Find Match"
5. In another browser/incognito window, log in as Bob
6. Navigate to "Find Match" and select "Connect 4"
7. Wait for matchmaking to pair you

**Expected Results**:
- Both players are matched and enter the game
- 7x6 grid is displayed with blue background
- Alice sees "Your Turn! (🔴 Red)"
- Bob sees "Opponent's Turn..."

### Test 1.2: Column Selection
**Steps** (as Alice):
1. Hover over different columns
2. Observe the hover effects
3. Click on column 3 (middle column)
4. Observe piece placement

**Expected Results**:
- Hovering shows red indicator at top of column
- Hovering highlights the bottom-most empty cell in that column
- Clicking places a red piece at the bottom of column 3
- Turn switches to Bob

### Test 1.3: Gravity and Stacking
**Steps**:
1. Bob clicks column 3
2. Alice clicks column 3 again
3. Bob clicks column 3 again
4. Continue until column 3 is full

**Expected Results**:
- Each piece stacks on top of the previous one
- Pieces animate into place
- When column is full (6 pieces), clicking does nothing
- Hover effect disappears for full columns

### Test 1.4: Horizontal Win
**Steps**:
1. Alice places pieces in columns: 0, 1, 2
2. Bob places pieces elsewhere
3. Alice places piece in column 3 (completing 4 in a row horizontally)

**Expected Results**:
- Game ends immediately
- Alice sees "🎉 VICTORY! 🎉"
- Bob sees "😞 DEFEAT"
- Alice's ELO increases, Bob's decreases

### Test 1.5: Vertical Win
**Steps**:
1. Start a new game
2. Alice places 4 pieces in the same column
3. Bob places pieces elsewhere

**Expected Results**:
- Game ends when Alice completes 4 vertically
- Win/loss messages displayed correctly

### Test 1.6: Diagonal Win
**Steps**:
1. Start a new game
2. Create a diagonal pattern:
   - Alice: column 0 (row 5)
   - Bob: column 1 (row 5)
   - Alice: column 1 (row 4)
   - Bob: column 2 (row 5)
   - Alice: column 2 (row 4)
   - Bob: column 3 (row 5)
   - Alice: column 2 (row 3)
   - Bob: column 3 (row 4)
   - Alice: column 3 (row 3)
   - Bob: column 4 (row 5)
   - Alice: column 3 (row 2) - Diagonal win!

**Expected Results**:
- Game detects diagonal win correctly
- Appropriate win/loss messages

### Test 1.7: Draw
**Steps**:
1. Fill the entire board without either player getting 4 in a row

**Expected Results**:
- Game ends when board is full
- "🤝 DRAW" message displayed
- Both players' ELO adjusted accordingly

---

## Test 2: Rock-Paper-Scissors Game

### Test 2.1: Basic Gameplay
**Objective**: Verify RPS simultaneous move mechanics

**Steps**:
1. Alice and Bob match in RPS game
2. Game shows "Best of 5" with Round 1
3. Both players see three choice buttons: Rock, Paper, Scissors

**Expected Results**:
- Score shows 0-0
- Current round is 1
- Both players can make choices independently

### Test 2.2: Simultaneous Choices
**Steps**:
1. Alice clicks "Rock" (✊)
2. Observe Alice's screen
3. Bob clicks "Scissors" (✌️)
4. Observe both screens

**Expected Results**:
- After Alice chooses, she sees "✓ Choice Made! Waiting for opponent..."
- Her choice button shows a green checkmark
- Other buttons are grayed out
- After Bob chooses, both see the result reveal
- Shows "You: ✊ vs Opponent: ✌️"
- Alice sees "You Won This Round!"
- Bob sees "You Lost This Round"
- Score updates to Alice: 1, Bob: 0
- After 3 seconds, choices reset for Round 2

### Test 2.3: Draw Round
**Steps**:
1. In Round 2, both players choose "Paper"

**Expected Results**:
- Result shows "It's a Draw!"
- Score remains Alice: 1, Bob: 0
- Round advances to 3

### Test 2.4: Round History
**Steps**:
1. Play several rounds
2. Scroll down to see "Round History"

**Expected Results**:
- Each round is listed with:
  - Round number
  - Your choice vs Opponent choice (emojis)
  - Result (Won/Lost/Draw) with color coding
- Green background for won rounds
- Red background for lost rounds
- Yellow background for draws

### Test 2.5: Best of 5 Win
**Steps**:
1. Continue playing until one player wins 3 rounds

**Expected Results**:
- Game ends immediately when a player reaches 3 wins
- Winner sees "🎉 VICTORY! 🎉"
- Loser sees "😞 DEFEAT"
- ELO ratings update

### Test 2.6: Full 5 Rounds
**Steps**:
1. Play a game where score is 2-2 after 4 rounds
2. Play the 5th round

**Expected Results**:
- Game ends after round 5
- Player with higher score wins
- If still tied (unlikely), game ends in draw

---

## Test 3: Dots & Boxes Game

### Test 3.1: Basic Gameplay
**Objective**: Verify line drawing and box completion

**Steps**:
1. Alice and Bob match in Dots & Boxes
2. Observe the 5x5 dot grid

**Expected Results**:
- 25 dots arranged in 5x5 grid
- Gray lines between dots (not yet drawn)
- Score shows 0-0
- "0 / 16 boxes" displayed

### Test 3.2: Drawing Lines
**Steps** (as Alice):
1. Hover over a horizontal line between two dots
2. Observe hover effect
3. Click to draw the line
4. Observe the result

**Expected Results**:
- Hovering shows green highlight on the line
- Clicking draws a blue line (Alice's color)
- Turn switches to Bob
- Line becomes thicker and colored

### Test 3.3: Box Completion
**Steps**:
1. Alice draws top line of a box (horizontal)
2. Bob draws left line of same box (vertical)
3. Alice draws right line of same box (vertical)
4. Bob draws bottom line of same box (horizontal) - Completes the box!

**Expected Results**:
- When Bob completes the 4th side, the box fills with red color
- Bob's score increases to 1
- "1 / 16 boxes" displayed
- **Bob gets another turn** (bonus turn for completing a box)
- Turn indicator still shows "Your Turn!" for Bob

### Test 3.4: Bonus Turn Chain
**Steps**:
1. Set up multiple boxes that can be completed in sequence
2. Complete one box
3. Use the bonus turn to complete another box

**Expected Results**:
- Player keeps getting bonus turns as long as they complete boxes
- Score increases for each box completed
- Turn only switches when a line doesn't complete a box

### Test 3.5: Line Ownership
**Steps**:
1. Observe colors of drawn lines throughout the game

**Expected Results**:
- Alice's lines are blue
- Bob's lines are red
- Line color matches the player who drew it
- Box color matches the player who completed it (drew 4th side)

### Test 3.6: Game End
**Steps**:
1. Continue playing until all 16 boxes are completed

**Expected Results**:
- Game ends when all boxes are filled
- Player with more boxes wins
- "16 / 16 boxes" displayed
- Win/loss messages shown
- ELO ratings update

### Test 3.7: Invalid Moves
**Steps**:
1. Try to click on an already-drawn line

**Expected Results**:
- Nothing happens
- No error message
- Turn doesn't change

---

## Test 4: Matchmaking with All Games

### Test 4.1: Game Selection UI
**Steps**:
1. Navigate to "Find Match"
2. Observe the game selection grid

**Expected Results**:
- 4 game cards displayed:
  - Tic-Tac-Toe (❌⭕) - 2 players
  - Connect 4 (🔴🟡) - 2 players
  - Rock Paper Scissors (✊✋✌️) - Best of 5
  - Dots & Boxes (⚫📦) - 2 players
- All games are clickable (no "Coming Soon" labels)
- Clicking a game highlights it with blue border and shadow

### Test 4.2: Matchmaking for Each Game
**Steps**:
1. Test matchmaking for each game type
2. Verify players are matched correctly

**Expected Results**:
- Matchmaking works for all 4 game types
- Players matched by similar ELO rating
- Correct game board loads after match

---

## Test 5: Private Rooms with All Games

### Test 5.1: Room Creation UI
**Steps**:
1. Navigate to "Rooms" → "Create Room"
2. Observe game selection

**Expected Results**:
- 4 game cards with emojis
- All games are selectable
- No disabled states

### Test 5.2: Create Room for Each Game
**Steps**:
1. Create a private room for Connect-4
2. Copy the join code
3. In another browser, join using the code
4. Start the game

**Expected Results**:
- Room created successfully
- Join code displayed (6 characters)
- Second player can join with code
- Game starts when both players are ready

### Test 5.3: Game Type Persistence
**Steps**:
1. Create room with specific game type
2. Join the room
3. Verify correct game loads

**Expected Results**:
- Room remembers selected game type
- Correct game board loads when game starts
- Game mechanics match selected type

---

## Test 6: Cross-Game Testing

### Test 6.1: ELO Rating Updates
**Steps**:
1. Note Alice's ELO rating on dashboard
2. Play and win a Connect-4 game
3. Return to dashboard
4. Play and win a RPS game
5. Return to dashboard

**Expected Results**:
- ELO increases after each win
- ELO is shared across all games (global rating)
- Dashboard updates automatically

### Test 6.2: Stats Tracking
**Steps**:
1. Play multiple games of different types
2. Check dashboard stats

**Expected Results**:
- Total games played increases
- Wins/losses/draws tracked correctly
- Win rate calculated accurately

### Test 6.3: Game Switching
**Steps**:
1. Play a Connect-4 game
2. Immediately queue for RPS
3. Play RPS game
4. Queue for Dots & Boxes

**Expected Results**:
- No issues switching between game types
- Each game loads correctly
- No state leakage between games

---

## Test 7: WebSocket Real-Time Updates

### Test 7.1: Move Synchronization
**Steps**:
1. In any game, make a move as Alice
2. Observe Bob's screen immediately

**Expected Results**:
- Bob's screen updates within 1 second
- Move is reflected accurately
- Turn indicator updates

### Test 7.2: Connection Status
**Steps**:
1. Start a game
2. Observe connection indicator
3. Temporarily disable network
4. Re-enable network

**Expected Results**:
- "Connected" status shown when online
- "Connecting..." shown when offline
- Automatic reconnection when back online

---

## Test 8: Edge Cases

### Test 8.1: Rapid Moves
**Steps**:
1. In Connect-4, try clicking multiple columns rapidly

**Expected Results**:
- Only one move is registered
- No duplicate moves
- Turn switches correctly

### Test 8.2: Invalid Moves
**Steps**:
1. Try to make a move when it's not your turn
2. Try to click on occupied spaces

**Expected Results**:
- Moves are rejected
- No error messages displayed
- Game state remains consistent

### Test 8.3: Browser Refresh
**Steps**:
1. Start a game
2. Refresh the browser
3. Navigate back to the game

**Expected Results**:
- Game state is restored from server
- Can continue playing
- No data loss

---

## Test 9: UI/UX Testing

### Test 9.1: Responsive Design
**Steps**:
1. Test each game on different screen sizes:
   - Desktop (1920x1080)
   - Tablet (768x1024)
   - Mobile (375x667)

**Expected Results**:
- All games are playable on all screen sizes
- Buttons are clickable
- Text is readable
- Layouts adapt appropriately

### Test 9.2: Animations
**Steps**:
1. Observe animations in each game:
   - Connect-4: Piece drops
   - RPS: Result reveal
   - Dots & Boxes: Line drawing and box fills
   - Tic-Tac-Toe: X and O placement

**Expected Results**:
- All animations are smooth
- No janky movements
- Animations complete in reasonable time

### Test 9.3: Color Accessibility
**Steps**:
1. Verify color contrast in all games
2. Check if colors are distinguishable

**Expected Results**:
- Player colors are clearly different
- Text is readable on all backgrounds
- Hover states are visible

---

## Test 10: Performance Testing

### Test 10.1: Game Load Time
**Steps**:
1. Measure time from match found to game board displayed

**Expected Results**:
- Game loads within 2 seconds
- No loading errors

### Test 10.2: Move Response Time
**Steps**:
1. Make a move
2. Measure time until opponent sees the move

**Expected Results**:
- Move appears on opponent's screen within 500ms
- No noticeable lag

---

## Bug Reporting Template

If you find any issues during testing, please report using this format:

```
**Game**: [Tic-Tac-Toe / Connect-4 / RPS / Dots & Boxes]
**Test**: [Test number and name]
**Steps to Reproduce**:
1. 
2. 
3. 

**Expected Result**:
[What should happen]

**Actual Result**:
[What actually happened]

**Screenshots/Logs**:
[If applicable]

**Browser/OS**:
[e.g., Chrome 120 on macOS]
```

---

## Success Criteria

Week 4 testing is considered successful when:
- ✅ All 4 games are fully playable
- ✅ Win/loss/draw detection works correctly for all games
- ✅ Matchmaking works for all game types
- ✅ Private rooms work for all game types
- ✅ ELO ratings update correctly
- ✅ Real-time updates work via WebSockets
- ✅ No critical bugs or crashes
- ✅ UI is responsive and accessible
- ✅ Animations are smooth

---

## Quick Test Checklist

Use this checklist for rapid testing:

### Connect-4
- [ ] Pieces fall to bottom
- [ ] Horizontal win detected
- [ ] Vertical win detected
- [ ] Diagonal win detected
- [ ] Draw detected
- [ ] Full column rejection

### Rock-Paper-Scissors
- [ ] Simultaneous moves work
- [ ] Round results correct
- [ ] Best of 5 scoring
- [ ] Round history displayed
- [ ] Game ends at 3 wins

### Dots & Boxes
- [ ] Lines can be drawn
- [ ] Box completion detected
- [ ] Bonus turn granted
- [ ] Score tracking correct
- [ ] Game ends at 16 boxes

### All Games
- [ ] Matchmaking works
- [ ] Private rooms work
- [ ] ELO updates
- [ ] WebSocket sync
- [ ] Responsive UI
- [ ] No crashes

---

## Automated Testing (Future)

For future iterations, consider adding:
- Unit tests for game logic
- Integration tests for API endpoints
- E2E tests with Playwright/Cypress
- Load testing for concurrent games
- WebSocket stress testing

