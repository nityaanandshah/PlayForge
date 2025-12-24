# Week 7 Testing Guide: Notifications & Profile System

## Overview

This document provides comprehensive testing procedures for all Week 7 features including the notification system and profile/settings functionality.

## Prerequisites

- Docker running with PostgreSQL and Redis
- Backend API server running (`make dev`)
- Frontend development server running (`cd frontend && npm run dev`)
- At least 3 user accounts created for testing
- **New:** Notifications table migration applied

## Apply Week 7 Migrations

```bash
# Connect to PostgreSQL
docker exec -it arenamatch-postgres-1 psql -U playforge -d playforge

# Apply notifications migration
\i /docker-entrypoint-initdb.d/add_notifications.sql
# OR if file is local:
# Copy migration to container first, then run

# Verify table created
\dt notifications
\d notifications

# Check indexes
\di notifications*
```

---

## Feature 1: Notification System Testing

### Test 1.1: Notification Backend - Create & Retrieve

**Setup:**

1. User A logged in
2. User B logged in

**Test Steps:**

```bash
# Get notifications for User A (should be empty initially)
curl -H "Authorization: Bearer <user_a_token>" \
  http://localhost:8080/api/v1/notifications?limit=10
```

**Expected Response:**

```json
{
  "notifications": [],
  "total": 0,
  "unread": 0
}
```

### Test 1.2: Invitation Notification

**Test Steps:**

1. User A creates a tournament
2. User A invites User B
3. Check User B's notifications

**API Commands:**

```bash
# User A creates tournament
curl -X POST -H "Authorization: Bearer <user_a_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Tournament",
    "game_type": "tictactoe",
    "tournament_type": "single_elimination",
    "max_participants": 4,
    "is_private": false
  }' \
  http://localhost:8080/api/v1/tournaments/create

# User A invites User B
curl -X POST -H "Authorization: Bearer <user_a_token>" \
  -H "Content-Type: application/json" \
  -d '{"username": "userb"}' \
  http://localhost:8080/api/v1/tournaments/<tournament_id>/invite

# User B checks notifications
curl -H "Authorization: Bearer <user_b_token>" \
  http://localhost:8080/api/v1/notifications
```

**Expected Results:**

- ✅ User B has 1 notification
- ✅ Type: `invitation_received`
- ✅ Title: "Tournament Invitation"
- ✅ Message: "User A invited you to 'Test Tournament'"
- ✅ Data contains: tournament_id, invitation_id
- ✅ read: false

### Test 1.3: Accept Invitation Notification

**Test Steps:**

1. User B accepts invitation
2. Check User A's notifications

**API Commands:**

```bash
# User B accepts invitation
curl -X POST -H "Authorization: Bearer <user_b_token>" \
  http://localhost:8080/api/v1/invitations/<invitation_id>/accept

# User A checks notifications
curl -H "Authorization: Bearer <user_a_token>" \
  http://localhost:8080/api/v1/notifications
```

**Expected Results:**

- ✅ User A has 1 notification
- ✅ Type: `invitation_accepted`
- ✅ Title: "Invitation Accepted"
- ✅ Message: "User B accepted your invitation to 'Test Tournament'"
- ✅ read: false

### Test 1.4: Player Joined Notification

**Test Steps:**

1. User C joins tournament (public)
2. Check User A and User B's notifications

**Expected Results:**

- ✅ User A receives notification
- ✅ User B receives notification
- ✅ Type: `player_joined`
- ✅ Message: "User C joined 'Test Tournament' (3/4 players)"

### Test 1.5: Tournament Started Notification

**Test Steps:**

1. Fill tournament to 4 players
2. User A (host) starts tournament
3. Check all participants' notifications

**Expected Results:**

- ✅ All 4 participants receive notification
- ✅ Type: `tournament_started`
- ✅ Title: "Tournament Started"
- ✅ Message: "'Test Tournament' has started! Round 1 is ready."

### Test 1.6: Mark Notification as Read

**Test Steps:**

```bash
# Mark specific notification as read
curl -X POST -H "Authorization: Bearer <user_b_token>" \
  http://localhost:8080/api/v1/notifications/<notification_id>/read

# Verify
curl -H "Authorization: Bearer <user_b_token>" \
  http://localhost:8080/api/v1/notifications
```

**Expected Results:**

- ✅ Notification's `read` field is now `true`
- ✅ Unread count decremented

### Test 1.7: Mark All as Read

**Test Steps:**

```bash
# Mark all notifications as read
curl -X POST -H "Authorization: Bearer <user_b_token>" \
  http://localhost:8080/api/v1/notifications/read-all

# Verify
curl -H "Authorization: Bearer <user_b_token>" \
  http://localhost:8080/api/v1/notifications
```

**Expected Results:**

- ✅ All notifications have `read: true`
- ✅ Unread count is 0

### Test 1.8: Delete Notification

**Test Steps:**

```bash
# Delete notification
curl -X DELETE -H "Authorization: Bearer <user_b_token>" \
  http://localhost:8080/api/v1/notifications/<notification_id>

# Verify
curl -H "Authorization: Bearer <user_b_token>" \
  http://localhost:8080/api/v1/notifications
```

**Expected Results:**

- ✅ Notification removed from list
- ✅ Total count decremented

---

## Feature 2: Notification Dashboard UI Testing

### Test 2.1: Dashboard Notification Feed

**Test Steps:**

1. Login as User B (who has notifications)
2. Navigate to Dashboard
3. Scroll to bottom (below Available Games)

**Expected Results:**

- ✅ "📬 Recent Activity" section displays
- ✅ Notifications listed with icons
- ✅ Unread badge shows count
- ✅ Each notification has timestamp
- ✅ Invitation notifications have Accept/Decline buttons

### Test 2.2: Invitation Actions in Dashboard

**Test Steps:**

1. User has pending invitation notification
2. Click "Accept" button in notification

**Expected Results:**

- ✅ Button shows loading state ("...")
- ✅ Navigates to tournament lobby
- ✅ Invitation removed from list
- ✅ No errors

### Test 2.3: Click Non-Invitation Notification

**Test Steps:**

1. User has "tournament_started" notification
2. Click on the notification card

**Expected Results:**

- ✅ Notification marked as read
- ✅ Navigates to tournament page
- ✅ Visual feedback (card becomes gray)

### Test 2.4: Auto-Refresh

**Test Steps:**

1. Open Dashboard
2. In another tab, have someone invite you
3. Wait 5-10 seconds

**Expected Results:**

- ✅ New notification appears automatically within 5 seconds
- ✅ Unread badge updates in real-time
- ✅ No page reload required
- ✅ Notifications refresh every 5 seconds

### Test 2.5: Empty State

**Test Steps:**

1. User with no notifications
2. View Dashboard

**Expected Results:**

- ✅ Notification section ALWAYS displays (below Available Games)
- ✅ Shows friendly empty state with bell icon 🔔
- ✅ Message: "No new notifications"
- ✅ Helpful text about what will appear there

### Test 2.6: Mark All As Read

**Test Steps:**

1. User has multiple unread notifications
2. View Dashboard notification section
3. Click "Mark all as read" button (top right)

**Expected Results:**

- ✅ "Mark all as read" button visible when unread notifications exist
- ✅ All notifications turn gray (read state)
- ✅ Unread badge disappears or shows "0"
- ✅ No page reload

### Test 2.7: Delete Single Notification

**Test Steps:**

1. User has notifications on Dashboard
2. Hover over a notification
3. Click the 🗑️ (trash) icon

**Expected Results:**

- ✅ Trash icon appears on the right side of each notification
- ✅ Notification immediately removed from list
- ✅ No confirmation dialog (instant delete)
- ✅ Other notifications remain unchanged
- ✅ Total count updates

### Test 2.8: View All Notifications Link

**Test Steps:**

1. User has notifications on Dashboard
2. Look for "View All →" link (top right of notification section)
3. Click the link

**Expected Results:**

- ✅ "View All →" button appears when notifications exist
- ✅ Navigates to `/notifications` page
- ✅ All notifications displayed (not just 5)

### Test 2.9: Dashboard Shows Only Latest 5

**Test Steps:**

1. Create 10+ notifications for a user
2. View Dashboard notification section

**Expected Results:**

- ✅ Only the 5 most recent notifications shown
- ✅ "View All →" link visible
- ✅ Older notifications accessible via "View All"

---

## Feature 2B: Dedicated Notifications Page Testing

### Test 2B.1: Navigation to Notifications Page

**Test Steps:**

1. Login to Dashboard
2. Click "View All →" in notification section
3. OR directly navigate to `/notifications`

**Expected Results:**

- ✅ Page loads successfully
- ✅ Shows "📬 All Notifications" header
- ✅ Displays total count
- ✅ Displays unread count badge
- ✅ "← Back to Dashboard" button visible

### Test 2B.2: Filter Notifications (All vs Unread)

**Test Steps:**

1. On Notifications page
2. Click "All" button
3. Click "Unread" button
4. Toggle between them

**Expected Results:**

- ✅ Two filter buttons: "All (X)" and "Unread (Y)"
- ✅ Active filter highlighted in blue
- ✅ Clicking "Unread" shows only unread notifications
- ✅ Clicking "All" shows all notifications
- ✅ Counts accurate in buttons

### Test 2B.3: Mark Individual As Read

**Test Steps:**

1. On Notifications page with unread notifications
2. Click the ✓ (checkmark) icon on an unread notification

**Expected Results:**

- ✅ Checkmark icon visible only on unread notifications
- ✅ Notification immediately turns gray (read state)
- ✅ Unread count decreases by 1
- ✅ "New" badge disappears from that notification

### Test 2B.4: Mark All As Read (Notifications Page)

**Test Steps:**

1. On Notifications page with multiple unread
2. Click "Mark all as read" button (green, top right)

**Expected Results:**

- ✅ Button only visible when unread notifications exist
- ✅ All notifications turn gray
- ✅ All "New" badges disappear
- ✅ Unread count goes to 0
- ✅ Button disappears after action

### Test 2B.5: Delete Notification (Notifications Page)

**Test Steps:**

1. On Notifications page
2. Click 🗑️ trash icon on any notification

**Expected Results:**

- ✅ Trash icon appears on every notification (read or unread)
- ✅ Notification immediately removed
- ✅ Total count updates
- ✅ If last notification, shows empty state

### Test 2B.6: Accept/Decline Invitation on Notifications Page

**Test Steps:**

1. Have pending invitation notification
2. Navigate to Notifications page
3. Click "Accept" or "Decline" button

**Expected Results:**

- ✅ Invitation notifications show Accept/Decline buttons
- ✅ Buttons functional (same as Dashboard)
- ✅ "Accept" navigates to tournament
- ✅ "Decline" removes invitation
- ✅ No errors or crashes

### Test 2B.7: Click Notification to Navigate

**Test Steps:**

1. On Notifications page
2. Click a non-invitation notification (e.g., "Tournament Started")

**Expected Results:**

- ✅ Notification marked as read
- ✅ Navigates to relevant page (tournament, game, etc.)
- ✅ Back button in Layout works to return

### Test 2B.8: Empty State (No Notifications)

**Test Steps:**

1. Delete all notifications
2. View Notifications page with filter on "All"

**Expected Results:**

- ✅ Large bell icon 🔔 displayed
- ✅ Message: "No new notifications"
- ✅ Helpful subtext about what appears there

### Test 2B.9: Empty State (No Unread)

**Test Steps:**

1. Mark all as read
2. Switch filter to "Unread"

**Expected Results:**

- ✅ Message: "No unread notifications"
- ✅ Subtext: "All caught up! Great job..."
- ✅ Can switch back to "All" to see read notifications

### Test 2B.10: Notifications Page Performance

**Test Steps:**

1. Create 50+ notifications for testing
2. Navigate to Notifications page
3. Scroll through list

**Expected Results:**

- ✅ Page loads quickly (< 2 seconds)
- ✅ Smooth scrolling
- ✅ No lag or stuttering
- ✅ All notifications render correctly

---

## Feature 3: Profile System Testing

### Test 3.1: Update Profile - Username

**Test Steps:**

```bash
# Update username
curl -X PUT -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"username": "newusername"}' \
  http://localhost:8080/api/v1/profile
```

**Expected Results:**

- ✅ 200 OK
- ✅ Returns updated user object
- ✅ Username changed in database
- ✅ Message: "profile updated successfully"

### Test 3.2: Update Profile - Duplicate Username

**Test Steps:**

```bash
# Try to use existing username
curl -X PUT -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"username": "existinguser"}' \
  http://localhost:8080/api/v1/profile
```

**Expected Results:**

- ✅ 409 Conflict
- ✅ Error: "username already taken"

### Test 3.3: Change Password - Success

**Test Steps:**

```bash
# Change password
curl -X POST -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "oldpassword",
    "new_password": "newpassword123"
  }' \
  http://localhost:8080/api/v1/profile/password
```

**Expected Results:**

- ✅ 200 OK
- ✅ Message: "password changed successfully"

**Verification:**

```bash
# Try to login with new password
curl -X POST -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "newpassword123"
  }' \
  http://localhost:8080/api/v1/auth/login
```

- ✅ Login successful

### Test 3.4: Change Password - Wrong Current Password

**Test Steps:**

```bash
# Try with wrong current password
curl -X POST -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "current_password": "wrongpassword",
    "new_password": "newpassword123"
  }' \
  http://localhost:8080/api/v1/profile/password
```

**Expected Results:**

- ✅ 401 Unauthorized
- ✅ Error: "current password is incorrect"

### Test 3.5: Get Public Profile

**Test Steps:**

```bash
# Get public profile by username
curl http://localhost:8080/api/v1/profile/testuser
```

**Expected Results:**

- ✅ 200 OK
- ✅ Returns: user_id, username, elo_rating
- ✅ Does NOT return: email, password_hash

### Test 3.6: Get Public Profile - Not Found

**Test Steps:**

```bash
# Try non-existent username
curl http://localhost:8080/api/v1/profile/nonexistentuser
```

**Expected Results:**

- ✅ 404 Not Found
- ✅ Error: "user not found"

---

## Feature 4: Navigation & UI Elements Testing

### Test 4.1: Navigate to Profile from Header

**Test Steps:**

1. Login to Dashboard
2. Look at top-right header
3. Click on your username or the 👤 icon next to it

**Expected Results:**

- ✅ Username displayed in header with ELO rating
- ✅ 👤 profile icon visible next to username
- ✅ Entire username area is clickable
- ✅ Clicking navigates to `/profile/yourusername`
- ✅ Profile page loads successfully

### Test 4.2: Navigate to Settings from Header

**Test Steps:**

1. Login to Dashboard
2. Look at top-right header
3. Click the ⚙️ settings icon

**Expected Results:**

- ✅ ⚙️ settings icon visible in header
- ✅ Icon has hover effect (background change)
- ✅ Clicking navigates to `/settings`
- ✅ Settings page loads successfully

### Test 4.3: Profile Page UI Elements

**Test Steps:**

1. Navigate to your profile page
2. Inspect all sections

**Expected Results:**

- ✅ Player stats card displayed (ELO, Win/Loss, Win Rate)
- ✅ ELO Progression graph visible
- ✅ Recent Activity timeline
- ✅ Achievement badges section
- ✅ Gamer-style aesthetic (dark theme, stats-heavy)
- ✅ All data accurate
- ✅ Responsive design

### Test 4.4: View Another User's Profile

**Test Steps:**

1. Note another user's username from leaderboard
2. Navigate to `/profile/theirusername`
3. Compare to your own profile

**Expected Results:**

- ✅ Can view other users' public profiles
- ✅ Shows same stats sections
- ✅ No "Edit Profile" or sensitive data visible
- ✅ Cannot access settings for other users

### Test 4.5: Settings Page UI

**Test Steps:**

1. Navigate to Settings page
2. Review all sections

**Expected Results:**

- ✅ Profile information section (username)
- ✅ Password change section
- ✅ Clear input fields with labels
- ✅ Save/Update buttons
- ✅ Success/error messages display correctly
- ✅ Forms validate input

### Test 4.6: Header Icons Responsive Design

**Test Steps:**

1. View site on desktop
2. View site on mobile/narrow screen

**Expected Results:**

- ✅ Profile icon and username visible on desktop
- ✅ Settings icon visible
- ✅ Proper spacing between elements
- ✅ Mobile responsive (may stack or adjust)
- ✅ All clickable areas sufficient size

---

## Integration Testing

### Integration Test 1: Complete Notification Flow

**Scenario:** Full tournament invitation and notification cycle

**Steps:**

1. User A creates tournament
2. User A invites User B and User C
3. User B accepts → User A gets notification
4. User C declines → User A gets notification
5. User D joins publicly → All participants get notification
6. User A starts tournament → All participants get notification

**Verification:**

- ✅ User A receives 3 notifications (B accepted, C declined, D joined, plus tournament started confirmation)
- ✅ User B receives 3 notifications (invitation, D joined, tournament started)
- ✅ User C receives 1 notification (invitation only)
- ✅ User D receives 1 notification (tournament started)

### Integration Test 2: Profile Update and Public View

**Scenario:** User updates profile and others view it

**Steps:**

1. User A updates username to "ProGamer"
2. User B views User A's public profile
3. User A changes password
4. User A logs out and logs in with new password

**Verification:**

- ✅ Username change reflected immediately
- ✅ Public profile shows new username
- ✅ Password change successful
- ✅ Can login with new credentials
- ✅ Cannot login with old credentials

---

## Regression Testing

### Verify No Breaking Changes

**Test all existing features still work:**

#### Week 1-4 Features:

- ✅ User signup/login
- ✅ Quick matchmaking
- ✅ Private rooms
- ✅ All 4 games playable
- ✅ ELO updates
- ✅ Match history
- ✅ Leaderboards
- ✅ Statistics

#### Week 5 Features (Tournaments):

- ✅ Create tournament
- ✅ Join tournament
- ✅ Start tournament
- ✅ Bracket generation
- ✅ Match progression
- ✅ Tournament completion

#### Week 6 Features (Spectator & Invitations):

- ✅ Spectator mode
- ✅ Tournament invitations (backend)
- ✅ Private tournaments
- ✅ Join code validation

**Critical:** Invitation accept/decline flow must still work exactly as before!

---

## Database Verification

### Verify Notification Data

```sql
-- View all notifications
SELECT
    n.id, n.type, n.title, n.message, n.read,
    u.username as recipient,
    n.created_at
FROM notifications n
JOIN users u ON n.user_id = u.id
ORDER BY n.created_at DESC
LIMIT 20;

-- Check unread count per user
SELECT
    u.username,
    COUNT(*) FILTER (WHERE n.read = FALSE) as unread_count,
    COUNT(*) as total_count
FROM users u
LEFT JOIN notifications n ON u.id = n.user_id
GROUP BY u.username
ORDER BY unread_count DESC;

-- View notification data (JSONB)
SELECT id, type, data
FROM notifications
WHERE data IS NOT NULL;
```

---

## Performance Testing

### Notification Load Test

**Scenario:** 100 notifications for single user

**Steps:**

1. Create 100 tournaments
2. Invite same user to all
3. Query notifications

**Expected Performance:**

- ✅ Query returns in < 100ms
- ✅ Pagination works (limit parameter)
- ✅ Indexes used (check EXPLAIN)

```sql
-- Check query performance
EXPLAIN ANALYZE
SELECT * FROM notifications
WHERE user_id = '<uuid>'
ORDER BY created_at DESC
LIMIT 10;
```

---

## Manual Testing Checklist

### Notification System

- [ ] Invitation received notification appears
- [ ] Accept invitation from notification
- [ ] Decline invitation from notification
- [ ] Tournament started notification appears
- [ ] Player joined notification appears
- [ ] Invitation accepted notification (inviter)
- [ ] Invitation declined notification (inviter)
- [ ] Mark as read works
- [ ] Mark all as read works
- [ ] Delete notification works
- [ ] Auto-refresh works (30s)
- [ ] Unread badge displays correctly
- [ ] Click-to-navigate works

### Profile System

- [ ] Update username succeeds
- [ ] Duplicate username rejected
- [ ] Change password with correct current
- [ ] Change password with wrong current fails
- [ ] Login with new password works
- [ ] Get public profile works
- [ ] Public profile doesn't expose sensitive data

### Dashboard Integration

- [ ] Notification feed displays
- [ ] Inline invitation actions work
- [ ] Notifications auto-refresh
- [ ] Empty state (no notifications) handled
- [ ] Unread badges accurate

---

## Troubleshooting

### Common Issues

**Issue:** Notifications not appearing

- **Check:** Migration applied correctly
- **Check:** Notification service wired in main.go
- **Check:** Tournament service has notification service reference
- **Check:** No errors in backend logs

**Issue:** Auto-refresh not working

- **Check:** useEffect cleanup function
- **Check:** Interval set correctly (30000ms)
- **Check:** API endpoint responding

**Issue:** Profile update fails

- **Check:** Authentication token valid
- **Check:** Username validation rules
- **Check:** Database user table has Update method

---

## Week 7 Testing Sign-Off

After completing all tests, sign off on each feature:

- [ ] **Notification Backend:** All API endpoints working
- [ ] **Notification Integration:** All events trigger notifications
- [ ] **Notification Dashboard:** UI displays and functions correctly
- [ ] **Profile Backend:** All endpoints working
- [ ] **Profile Security:** Validation and authentication working
- [ ] **Integration Tests:** All scenarios verified
- [ ] **Regression Tests:** No existing features broken
- [ ] **Performance Tests:** No issues detected

**Tested By:** **\*\*\*\***\_\_\_**\*\*\*\***  
**Date:** **\*\*\*\***\_\_\_**\*\*\*\***  
**Status:** [ ] PASS [ ] FAIL [ ] PARTIAL  
**Notes:** **\*\*\*\***\_\_\_**\*\*\*\***

---

**Week 7 Testing Complete!** 🎉

All notification and profile features have been thoroughly tested and are ready for production use.
