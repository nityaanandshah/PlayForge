# Vercel Deployment Guide - Mock Data Mode

## Environment Variables Setup

In your Vercel project settings, add this environment variable:

```
VITE_USE_MOCK_DATA=true
```

## Test Credentials

You can login with any of these usernames (any password works):

### Full Test Users
- **alice** - Most complete data (recommended for demo)
  - 1650 ELO, 75 wins, 43 losses
  - 3 notifications (2 unread)
  - 5 match history entries
  - Participating in 2 tournaments
  
- **bob** - Second test user
  - 1580 ELO, 53 wins, 60 losses  
  - 1 pending tournament invitation
  - 2 match history entries

- **charlie** - Basic user (1720 ELO)
- **diana** - Basic user (1890 ELO)

### Any Username
You can also login with any username (e.g., "test", "demo", "john") and it will:
- Create a new mock user automatically
- Start with 1500 ELO
- Have empty stats (0 games played)
- Show empty states for all pages

## Testing Checklist

After deploying to Vercel:

### 1. Login as "alice"
- [ ] Dashboard shows ELO: 1650
- [ ] Dashboard shows Wins: 75, Losses: 43
- [ ] Dashboard shows 2 notifications
- [ ] Dashboard shows tournament invitation section

### 2. Navigation Tests
- [ ] Click "Tournaments" - should show 3 tournaments
- [ ] Click "Leaderboard" - should show 4 users ranked by ELO
- [ ] Click "Statistics" - should show alice's game breakdowns
- [ ] Click "Match History" - should show 5 matches
- [ ] Click profile icon → "Profile" - should show alice's profile

### 3. Interaction Tests
- [ ] In Tournaments page, can see tournament cards with proper icons
- [ ] In Leaderboard, diana should be #1 (1890 ELO)
- [ ] In Statistics, each game type shows correct win/loss/draw counts
- [ ] In Match History, can see opponent names and results
- [ ] In Profile, achievements show based on stats

### 4. Login as "bob"
- [ ] Logout
- [ ] Login as "bob"
- [ ] Dashboard shows different ELO: 1580
- [ ] Dashboard shows 1 pending invitation
- [ ] All pages show bob's data (not alice's)

### 5. Browser Console
Open browser console and verify:
- [ ] See `[PlayForge] API Mode: MOCK DATA` on page load
- [ ] See `[MockAPI] Logged in as: alice` on login
- [ ] See `[MockAPI] Intercepting request:` messages when navigating
- [ ] No 404 or network errors

## Common Issues

### Issue: Still seeing empty data
**Solution**: Make sure `VITE_USE_MOCK_DATA=true` is set in Vercel environment variables, then redeploy

### Issue: Console shows "REAL API" mode
**Solution**: Environment variable not set correctly. In Vercel:
1. Go to Project Settings
2. Go to Environment Variables
3. Add: `VITE_USE_MOCK_DATA` = `true`
4. Redeploy the project

### Issue: Getting 404 errors
**Solution**: The app might be trying to call real API. Check console for `[MockAPI]` logs. If missing, environment variable didn't apply.

## Deployment Commands

```bash
# Test locally with mock data first
cd frontend
VITE_USE_MOCK_DATA=true npm run dev

# Build for Vercel (Vercel will use environment variables from settings)
npm run build
```

## Vercel Settings

Ensure these settings in `vercel.json`:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite"
}
```

## Expected Behavior

When everything is working correctly:

1. **Fast Loading**: No API calls to backend, instant responses
2. **Consistent Data**: Same data on every page refresh
3. **User Switching**: Different users show different data
4. **No Errors**: Clean console with only `[MockAPI]` logs
5. **All Features Work**: Every page and feature functions properly

## Demo Flow

Best way to demo the app:

1. Login as **alice**
2. Show Dashboard with stats and notifications
3. Click through all navigation items:
   - Quick Play → Matchmaking
   - Tournaments → Show tournament list
   - Leaderboard → Show rankings
   - Statistics → Show detailed stats
   - History → Show past matches
   - Profile → Show achievements
4. Logout and login as **bob** to show different user data

## Screenshots to Take

Useful for documentation:

1. Dashboard with alice's stats and notifications
2. Tournament page showing 3 tournaments
3. Leaderboard with 4 ranked players
4. Statistics page with game breakdowns
5. Match History with past games
6. Profile page with achievements and contribution graph

## Live URL

After deploying, your app will be at:
```
https://your-project-name.vercel.app
```

Share this URL to demo the app without needing a backend!

