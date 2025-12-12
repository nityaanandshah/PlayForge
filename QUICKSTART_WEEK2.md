# Week 2 Quick Start Guide

## 🚀 Play Tic-Tac-Toe in Real-Time!

### Prerequisites
- Week 1 working (auth, database, frontend)
- Terminal 1: Backend running (`go run cmd/api/main.go`)
- Terminal 2: Frontend running (`npm run dev` in `frontend/`)

### How to Play (Two Players)

#### Option 1: Two Browser Windows (Easiest)

**Window 1 - Player 1:**
1. Open `http://localhost:5173`
2. Login/signup
3. Click "Quick Play - Tic-Tac-Toe"
4. Copy the game ID from URL: `http://localhost:5173/game/{COPY_THIS_ID}`
5. Share the URL with Player 2

**Window 2 - Player 2 (Incognito Mode):**
1. Open browser in incognito/private mode
2. Navigate to `http://localhost:5173`
3. Login/signup with different credentials
4. Paste the full URL: `http://localhost:5173/game/{GAME_ID}`
5. Game starts automatically!

#### Game Play:
- Player 1 = X (blue) = goes first
- Player 2 = O (red) = goes second
- Click cells to make moves
- Game detects wins/draws automatically
- **Moves sync instantly between players!**

### What's New in Week 2?

✅ **Real-Time Gameplay** - Moves appear instantly for both players  
✅ **WebSocket Connection** - Persistent connection for low-latency updates  
✅ **Turn-Based Logic** - Can only move on your turn  
✅ **Win Detection** - Rows, columns, diagonals  
✅ **Draw Detection** - Board full without winner  
✅ **Visual Feedback** - Color-coded moves, turn indicators  
✅ **Auto-Reconnect** - WebSocket reconnects if connection drops  

### Quick Test

```bash
# Terminal 1: Start backend
cd /Users/mac_nit/Desktop/preya/projects/ArenaMatch
go mod tidy
go run cmd/api/main.go

# Terminal 2: Start frontend
cd /Users/mac_nit/Desktop/preya/projects/ArenaMatch/frontend
npm install
npm run dev
```

Then follow the "Option 1" steps above!

### Troubleshooting

**"Failed to connect to game server"**
- Check backend is running: `curl http://localhost:8080/health`
- Check WebSocket URL in browser console

**"Game not found"**
- Make sure you're using the correct game ID
- Game expires after 4 hours

**Moves not syncing**
- Open DevTools → Network → WS tab
- Check WebSocket connection is active
- Look for "game_move" and "game_state" messages

### Testing Checklist

- [ ] Two players can join same game
- [ ] Moves appear instantly for both players
- [ ] Player 1 (X) goes first
- [ ] Turn switches after each move
- [ ] Can't click opponent's turn
- [ ] Can't click occupied cells
- [ ] Win detection works (try getting 3 in a row)
- [ ] Draw detection works (fill board)
- [ ] Winner message displays correctly

### Next Steps

See `WEEK2_TESTING.md` for comprehensive testing guide.

---

**Enjoy playing Tic-Tac-Toe with real-time multiplayer!** 🎮

