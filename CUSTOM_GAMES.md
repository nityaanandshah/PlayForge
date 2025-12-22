# Custom Game Settings Feature

## Overview
Players can now customize game settings when creating private rooms, allowing for varied gameplay experiences beyond the standard rules.

## Supported Customizations

### 1. Rock-Paper-Scissors (RPS)
**Setting**: Best of X rounds  
**Options**: 3, 5, 7, or 9 rounds  
**Default**: Best of 5  
**Win Condition**: First to win majority of rounds (e.g., best of 5 = first to 3 wins)

**How to customize:**
1. Go to "Rooms" → "Create Room"
2. Select "Rock Paper Scissors"
3. Choose your preferred "Best of" value (3, 5, 7, or 9)
4. Create the room

**UI Features:**
- Button selector for quick selection
- Shows win requirement (e.g., "First to win 3 rounds wins the game")
- Purple-themed settings panel

### 2. Dots & Boxes
**Setting**: Grid size  
**Options**: 4x4, 5x5, 6x6, 7x7, or 8x8 dots  
**Default**: 5x5 (creates 16 boxes)  
**Impact**: Larger grids = more boxes = longer games

**Grid sizes:**
- 4x4 dots = 9 boxes (quick game)
- 5x5 dots = 16 boxes (standard)
- 6x6 dots = 25 boxes (medium)
- 7x7 dots = 36 boxes (long)
- 8x8 dots = 49 boxes (very long)

**How to customize:**
1. Go to "Rooms" → "Create Room"
2. Select "Dots & Boxes"
3. Use the slider to adjust grid size
4. Create the room

**UI Features:**
- Slider control for grid size
- Real-time display of resulting box count
- Green-themed settings panel
- Visual scale showing all available sizes

### 3. Tic-Tac-Toe
**Setting**: Grid size  
**Options**: 3x3, 4x4, or 5x5  
**Default**: 3x3  
**Win Condition**: Get [grid size] in a row (e.g., 4 in a row for 4x4)

**Grid sizes:**
- 3x3 = Classic game (3 in a row to win)
- 4x4 = Medium game (4 in a row to win)
- 5x5 = Large game (5 in a row to win)

**How to customize:**
1. Go to "Rooms" → "Create Room"
2. Select "Tic-Tac-Toe"
3. Choose grid size (3x3, 4x4, or 5x5)
4. Create the room

**UI Features:**
- Button selector for quick grid size selection
- Indigo-themed settings panel
- Shows win requirement
- Board automatically adjusts to selected size

### 4. Connect-4
**Settings**: Board dimensions and win length  
**Options**:
- Rows: 4-10
- Columns: 4-10
- Win Length: 4-6 (limited by smallest dimension)
**Default**: 6 rows × 7 columns, 4 in a row

**Popular configurations:**
- 6x7 (Standard Connect-4)
- 8x8 (Larger board, same 4 in a row)
- 6x7 with 5 in a row (Harder to win)
- 10x10 with 5 in a row (Epic games)

**How to customize:**
1. Go to "Rooms" → "Create Room"
2. Select "Connect 4"
3. Adjust rows (4-10) using slider
4. Adjust columns (4-10) using slider
5. Adjust win length (4-6) using slider
6. Create the room

**UI Features:**
- Three separate sliders for rows, columns, and win length
- Orange-themed settings panel
- Real-time display of board dimensions and win requirement
- Win length auto-adjusts if board gets too small
- Board renders dynamically with appropriate cell sizes

## Technical Implementation

### Backend

**Domain Structure:**
```go
type GameSettings struct {
    TicTacToeGridSize  int `json:"tictactoe_grid_size,omitempty"`
    TicTacToeWinLength int `json:"tictactoe_win_length,omitempty"`
    Connect4Rows       int `json:"connect4_rows,omitempty"`
    Connect4Cols       int `json:"connect4_cols,omitempty"`
    Connect4WinLength  int `json:"connect4_win_length,omitempty"`
    RPSBestOf          int `json:"rps_best_of,omitempty"`
    DotsGridSize       int `json:"dots_grid_size,omitempty"`
}
```

**Validation:**
- RPS: Best of must be odd (3, 5, 7, 9)
- Dots & Boxes: Grid size between 4 and 8
- Settings are validated on room creation
- Invalid settings fall back to defaults

**Game State:**
- RPS: `MaxRounds` and `WinsNeeded` calculated from `RPSBestOf`
- Dots & Boxes: `GridRows` and `GridCols` stored in state for dynamic rendering

### Frontend

**Room Creation:**
- Game-specific settings panels appear based on selected game
- Settings are sent with room creation request
- Visual feedback for selected values

**Room Lobby:**
- Custom settings displayed in blue info panel
- Shows meaningful descriptions (e.g., "Best of 5 rounds (First to 3 wins)")
- Only shows settings panel if custom settings exist

**Game Board:**
- Dots & Boxes board dynamically renders based on `grid_rows` and `grid_cols`
- RPS tracks rounds based on `max_rounds` and `wins_needed`

## User Experience

### Creating a Custom Game
1. Navigate to "Rooms" → "Create Room"
2. Select your game type
3. If customization is available, a colored settings panel appears:
   - **Purple panel** for RPS
   - **Green panel** for Dots & Boxes
   - **Gray panel** for Tic-Tac-Toe/Connect-4 (coming soon)
4. Adjust settings using buttons or sliders
5. See real-time feedback on game length/difficulty
6. Create room with custom settings

### Joining a Custom Game
1. Join room via code or matchmaking
2. See custom settings displayed in room lobby
3. All players see the same settings
4. Settings cannot be changed after room creation
5. Game plays with custom rules

### Playing Custom Games
- Game behaves according to custom settings
- No visual difference in controls
- Win conditions automatically adjusted
- Longer games (e.g., RPS best of 9, Dots 8x8) take more time

## Limitations

### Current Limitations:
1. **Matchmaking**: Custom settings only for private rooms
   - Matchmaking uses default settings for fair pairing
   - Custom games are for private play with friends

3. **No Mid-Game Changes**: Settings locked after room creation
   - Prevents unfair advantage
   - Ensures all players agree to rules

### Future Enhancements:
1. **More customization options**
   - Time limits per move
   - Point handicaps
   - Special rules/variants

3. **Preset configurations**
   - "Quick Play" (smaller grids, fewer rounds)
   - "Marathon" (larger grids, more rounds)
   - "Tournament" (standardized competitive settings)

## API Reference

### Create Room with Settings
```typescript
POST /api/v1/rooms

{
  "game_type": "rps",
  "type": "private",
  "max_players": 2,
  "game_settings": {
    "rps_best_of": 7
  }
}
```

### Room Response
```typescript
{
  "room": {
    "id": "...",
    "game_type": "rps",
    "game_settings": {
      "rps_best_of": 7
    },
    ...
  }
}
```

### Game State (Dots & Boxes)
```typescript
{
  "grid_rows": 6,
  "grid_cols": 6,
  "total_boxes": 25,
  ...
}
```

### Game State (RPS)
```typescript
{
  "max_rounds": 7,
  "wins_needed": 4,
  "current_round": 1,
  ...
}
```

## Testing Custom Games

### Test RPS Best of 7:
1. Create private room with RPS
2. Set "Best of" to 7
3. Join with second player
4. Play until someone wins 4 rounds
5. Verify game ends correctly

### Test Dots & Boxes 6x6:
1. Create private room with Dots & Boxes
2. Set grid size to 6
3. Join with second player
4. Verify board shows 6x6 dots (25 boxes)
5. Play and verify all 25 boxes can be completed

### Test Settings Display:
1. Create room with custom settings
2. Verify settings shown in lobby
3. Join as second player
4. Verify both players see same settings
5. Start game and verify rules match settings

## Known Issues

None currently. All implemented customizations are fully functional.

## Changelog

**v1.0 - Custom Game Settings**
- Added RPS best-of customization (3, 5, 7, 9 rounds)
- Added Dots & Boxes grid size customization (4x4 to 8x8)
- Added settings UI in room creation
- Added settings display in room lobby
- Added dynamic board rendering for Dots & Boxes
- Added validation for all settings

**v2.0 - All Games Customizable**
- ✅ Refactored Tic-Tac-Toe to use dynamic slices (3x3, 4x4, 5x5)
- ✅ Refactored Connect-4 to use dynamic slices (4-10 rows, 4-10 cols)
- ✅ Added configurable win length for both games
- ✅ Updated frontend to render dynamic grids
- ✅ All 4 games now fully customizable
- ✅ Intelligent cell sizing based on grid dimensions

**Future:**
- v2.1: Additional customization options (time limits, handicaps)
- v2.2: Preset configurations
- v2.3: Tournament-specific settings

