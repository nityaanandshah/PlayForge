# Mock Data Fixes for Vercel Deployment

## Issues Identified

When deployed to Vercel with `VITE_USE_MOCK_DATA=true`, the following issues occurred:

1. **Zero ELO/Stats displayed** - Mock API always returned generic "DemoPlayer" data regardless of login username
2. **Failed to load Tournament page** - No mock tournament API implementation
3. **Failed to load Leaderboard page** - No mock leaderboard API implementation  
4. **Failed to load Stats page** - Stats didn't load for specific users
5. **Failed to load History page** - No mock match history API implementation
6. **Failed to load Profile page** - No mock profile API implementation
7. **No notifications showing** - No mock notifications API implementation

## Root Causes

1. **Single User Mock Data**: The mock API only supported one generic "currentUser" instead of multiple users with their own data
2. **Login Not Switching Users**: When logging in as "alice" or "bob", the mock API didn't switch to that user's data
3. **Missing Mock Implementations**: Several API endpoints had no mock implementations
4. **Empty Interceptor Responses**: The API interceptor was returning empty arrays instead of proper mock data

## Solutions Implemented

### 1. Enhanced Mock User Database (`mockApi.ts`)

Created a comprehensive mock database structure:

```typescript
// Multiple predefined users (alice, bob, charlie, diana)
const mockUsersDatabase: { [username: string]: User } = {
  'alice': { /* full user data */ },
  'bob': { /* full user data */ },
  // ... etc
}

// Per-user stats database
const mockStatsDatabase: { [userId: string]: PlayerStats[] } = {
  'user-alice': [ /* alice's stats for each game type */ ],
  'user-bob': [ /* bob's stats for each game type */ ],
}

// Per-user match history
const mockMatchHistoryDatabase: { [userId: string]: any[] } = {
  'user-alice': [ /* alice's match history */ ],
}

// Per-user notifications
const mockNotificationsDatabase: { [userId: string]: any[] } = {
  'user-alice': [ /* alice's notifications */ ],
}

// Per-user invitations
const mockInvitationsDatabase: { [userId: string]: any[] } = {
  'user-alice': [],
  'user-bob': [ /* bob's pending invitations */ ],
}

// Shared tournaments list
const mockTournaments: any[] = [ /* active tournaments */ ]
```

### 2. Fixed Login to Switch Users

Updated `mockAuthApi.login()` to:
- Check if username exists in `mockUsersDatabase`
- Switch `currentUser` to the logged-in user's data
- Create new users automatically if they don't exist
- Log the switched user for debugging

### 3. Updated All Mock Stats APIs

Modified `mockStatsApi` to:
- Use `mockStatsDatabase[currentUser.id]` instead of hardcoded stats
- Return user-specific aggregated stats
- Return empty stats (zeros) if user has no games played
- Implemented `getLeaderboard()` - generates leaderboard from all users sorted by ELO
- Implemented `getMatchHistory()` - returns user-specific match history filtered by game type

### 4. Added New Mock API Implementations

#### Tournament API (`mockTournamentApi`)
- `getTournaments()` - returns list of tournaments with filtering
- `getTournament(id)` - returns specific tournament
- `createTournament()` - creates new tournament with current user as host
- `joinTournament()` - adds current user to tournament participants
- `leaveTournament()` - removes current user from tournament

#### Notification API (`mockNotificationApi`)
- `getNotifications()` - returns user-specific notifications with unread count
- `markAsRead(id)` - marks notification as read
- `markAllAsRead()` - marks all user's notifications as read
- `deleteNotification(id)` - removes notification

#### Invitation API (`mockInvitationApi`)
- `getInvitations()` - returns pending tournament invitations for current user
- `acceptInvitation(id)` - accepts invitation and adds user to tournament
- `declineInvitation(id)` - declines invitation

#### Profile API (`mockProfileApi`)
- `getProfile(username)` - returns public profile for any user

### 5. Enhanced Request Interceptor

Added request interceptor in `api.ts` that:
- Intercepts all axios requests when `USE_MOCK_DATA=true`
- Routes requests to appropriate mock APIs based on URL pattern
- Returns mock responses immediately without making HTTP requests
- Handles all REST methods (GET, POST, DELETE)
- Logs intercepted requests for debugging

### 6. Exported New API Functions

Added to `api.ts`:
```typescript
export const tournamentApi = { ... }
export const notificationApi = { ... }
export const invitationApi = { ... }
export const profileApi = { ... }
```

### 7. Removed Empty Fallback Responses

Removed the empty response fallbacks from the response interceptor since we now have proper mock implementations.

## Mock Data Details

### Users
- **alice**: 1650 ELO, 75 wins, 43 losses, 133 total games
- **bob**: 1580 ELO, 53 wins, 60 losses, 125 total games  
- **charlie**: 1720 ELO (basic stats)
- **diana**: 1890 ELO (basic stats)

### Alice's Data
- **Notifications**: 3 notifications (2 unread)
- **Match History**: 5 recent matches
- **Tournaments**: Participant in "Friday Night Championship" and host of "Weekend Warriors"
- **Stats**: Detailed stats for all 4 game types (tictactoe, connect4, rps, dotsandboxes)

### Bob's Data
- **Notifications**: 1 invitation notification
- **Invitations**: 1 pending tournament invitation from alice
- **Match History**: 2 recent matches
- **Stats**: Detailed stats for all 4 game types

### Tournaments
1. **Friday Night Championship** - Tic-Tac-Toe, In Progress, 4/8 players
2. **Weekend Warriors** - Connect 4, Pending, 2/4 players
3. **RPS Masters** - Rock-Paper-Scissors, Completed

## Testing

To test the fixes:

1. Deploy to Vercel with `VITE_USE_MOCK_DATA=true` environment variable
2. Login as "alice" (any password)
3. Verify:
   - ✅ Dashboard shows alice's ELO (1650), wins (75), losses (43)
   - ✅ Dashboard shows 2 unread notifications
   - ✅ Tournament page loads with 3 tournaments
   - ✅ Leaderboard page loads with all users ranked by ELO
   - ✅ Statistics page shows alice's detailed stats for each game
   - ✅ Match History page shows alice's 5 matches
   - ✅ Profile page shows alice's profile with achievements

4. Login as "bob" (any password)
5. Verify:
   - ✅ Dashboard shows bob's ELO (1580), wins (53), losses (60)
   - ✅ Dashboard shows 1 pending tournament invitation
   - ✅ All pages load with bob's data

## Benefits

1. **Realistic Demo**: Multiple users with different stats for better showcase
2. **User-Specific Data**: Each login shows appropriate data for that user
3. **Complete Feature Coverage**: All pages now work in mock mode
4. **Easy Testing**: Can test multiplayer features without backend
5. **Vercel-Ready**: Works perfectly in Vercel deployment with environment variable

## Console Logging

Added helpful console logs:
- `[PlayForge] API Mode: MOCK DATA` on app start
- `[MockAPI] Logged in as: alice with ID: user-alice` on login
- `[MockAPI] Intercepting request: GET /tournaments` on each API call
- `[MockAPI] Returning mock response for: /tournaments` on successful mock

## Files Modified

1. `/frontend/src/lib/mockApi.ts` - Complete rewrite with multi-user support
2. `/frontend/src/lib/api.ts` - Added request interceptor and new API exports

