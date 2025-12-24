import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { gameApi, statsApi, PlayerStats } from '../lib/api'
import api from '../lib/api'

interface TournamentInvitation {
  id: string;
  tournament_id: string;
  tournament_name: string;
  game_type: string;
  inviter_name: string;
  status: string;
  created_at: string;
  expires_at: string;
}

interface Notification {
  id: string;
  type: 'invitation_received' | 'tournament_started' | 'player_joined' | 'invitation_accepted' | 'invitation_declined';
  title: string;
  message: string;
  data?: {
    tournament_id?: string;
    invitation_id?: string;
    tournament_name?: string;
    [key: string]: any;
  };
  read: boolean;
  created_at: string;
}

export default function Dashboard() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<PlayerStats | null>(null)
  const [invitations, setInvitations] = useState<TournamentInvitation[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [processingInvite, setProcessingInvite] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
    loadInvitations()
    loadNotifications()
    refreshUser() // Refresh user data to get latest ELO
    
    // Poll notifications every 5 seconds for real-time updates
    const interval = setInterval(loadNotifications, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadStats = async () => {
    try {
      const playerStats = await statsApi.getMyStats()
      setStats(playerStats)
    } catch (err) {
      console.error('Failed to load stats:', err)
    }
  }

  const loadInvitations = async () => {
    try {
      const response = await api.get<{ invitations: TournamentInvitation[] }>('/invitations')
      // Filter for pending invitations only
      const allInvitations = response.data.invitations || []
      const pending = allInvitations.filter(inv => inv.status === 'pending')
      setInvitations(pending)
    } catch (err) {
      console.error('Failed to load invitations:', err)
      setInvitations([]) // Set to empty array on error
    }
  }

  const loadNotifications = async () => {
    try {
      const response = await api.get<{ notifications: Notification[], total: number, unread: number }>('/notifications?limit=10')
      setNotifications(response.data.notifications || [])
    } catch (err) {
      console.error('Failed to load notifications:', err)
      setNotifications([]) // Set to empty array on error
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await api.post(`/notifications/${notificationId}/read`)
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n))
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id)
    }

    // Handle different notification types
    if (notification.type === 'invitation_received' && notification.data?.invitation_id) {
      // Accept invitation action is handled by the invitation buttons
      return
    } else if (notification.data?.tournament_id) {
      // Navigate to tournament
      navigate(`/tournament/${notification.data.tournament_id}`)
    }
  }

  const handleAcceptInvitation = async (inviteId: string, tournamentId: string) => {
    setProcessingInvite(inviteId)
    try {
      await api.post(`/invitations/${inviteId}/accept`)
      // Navigate to tournament lobby (singular 'tournament', not 'tournaments')
      navigate(`/tournament/${tournamentId}`)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to accept invitation')
      setProcessingInvite(null)
    }
  }

  const handleDeclineInvitation = async (inviteId: string) => {
    setProcessingInvite(inviteId)
    try {
      await api.post(`/invitations/${inviteId}/decline`)
      // Remove from list
      setInvitations(prev => prev.filter(inv => inv.id !== inviteId))
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to decline invitation')
    } finally {
      setProcessingInvite(null)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all')
      // Update all notifications to read=true
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (err: any) {
      console.error('Failed to mark all as read:', err)
    }
  }

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await api.delete(`/notifications/${notificationId}`)
      // Remove from list
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
    } catch (err: any) {
      console.error('Failed to delete notification:', err)
    }
  }

  const handleQuickPlay = () => {
    // Redirect to matchmaking for game selection
    navigate('/matchmaking')
  }

  const getGameName = (gameType: string) => {
    switch (gameType) {
      case 'tictactoe': return 'Tic-Tac-Toe';
      case 'connect4': return 'Connect-4';
      case 'rps': return 'Rock Paper Scissors';
      case 'dotsandboxes': return 'Dots & Boxes';
      default: return gameType;
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome, {user?.username}!
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-primary-50 rounded-lg p-4">
            <p className="text-sm text-primary-600 font-medium">ELO Rating</p>
            <p className="text-3xl font-bold text-primary-900">{user?.elo_rating}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600 font-medium">Games Won</p>
            <p className="text-3xl font-bold text-green-900">{stats?.wins || 0}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm text-red-600 font-medium">Games Lost</p>
            <p className="text-3xl font-bold text-red-900">{stats?.losses || 0}</p>
          </div>
        </div>
      </div>

      {/* Tournament Invitations */}
      {invitations && invitations.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6 border-2 border-indigo-300">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            ✉️ Tournament Invitations
            <span className="ml-2 bg-indigo-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {invitations.length}
            </span>
          </h3>
          <div className="space-y-3">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:border-indigo-300 transition-colors">
                <div className="flex-1">
                  <h4 className="font-bold text-lg text-gray-800">{invitation.tournament_name}</h4>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{invitation.inviter_name}</span> invited you to play {getGameName(invitation.game_type)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Expires: {new Date(invitation.expires_at).toLocaleDateString()} at {new Date(invitation.expires_at).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleAcceptInvitation(invitation.id, invitation.tournament_id)}
                    disabled={processingInvite === invitation.id}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingInvite === invitation.id ? '...' : '✓ Accept'}
                  </button>
                  <button
                    onClick={() => handleDeclineInvitation(invitation.id)}
                    disabled={processingInvite === invitation.id}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingInvite === invitation.id ? '...' : '✗ Decline'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={handleQuickPlay}
            className="bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition-colors font-medium text-center"
          >
            <div className="text-2xl mb-1">⚡</div>
            <div className="font-bold">Quick Play</div>
            <div className="text-xs opacity-90">Find match with standard rules</div>
          </button>
          <button 
            onClick={() => navigate('/rooms')}
            className="bg-purple-600 text-white px-6 py-4 rounded-lg hover:bg-purple-700 transition-colors font-medium text-center"
          >
            <div className="text-2xl mb-1">🎮</div>
            <div className="font-bold">Custom Game</div>
            <div className="text-xs opacity-90">Create room with your rules</div>
          </button>
          <button 
            onClick={() => navigate('/tournaments')}
            className="bg-orange-600 text-white px-6 py-4 rounded-lg hover:bg-orange-700 transition-colors font-medium text-center"
          >
            <div className="text-2xl mb-1">🏆</div>
            <div className="font-bold">Tournaments</div>
            <div className="text-xs opacity-90">Compete in brackets</div>
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Available Games</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-primary-500 transition-colors">
            <div className="text-2xl mb-2">❌⭕</div>
            <h4 className="font-bold text-lg mb-2">Tic-Tac-Toe</h4>
            <p className="text-sm text-gray-600">Classic 3×3 grid</p>
            <p className="text-xs text-gray-500 mt-1">Custom: up to 5×5</p>
          </div>
          <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-primary-500 transition-colors">
            <div className="text-2xl mb-2">🔴🟡</div>
            <h4 className="font-bold text-lg mb-2">Connect 4</h4>
            <p className="text-sm text-gray-600">Standard 6×7 board</p>
            <p className="text-xs text-gray-500 mt-1">Custom: up to 10×10</p>
          </div>
          <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-primary-500 transition-colors">
            <div className="text-2xl mb-2">✊✋✌️</div>
            <h4 className="font-bold text-lg mb-2">Rock-Paper-Scissors</h4>
            <p className="text-sm text-gray-600">Best of 5 rounds</p>
            <p className="text-xs text-gray-500 mt-1">Custom: 3, 5, 7, or 9</p>
          </div>
          <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-primary-500 transition-colors">
            <div className="text-2xl mb-2">⚫📦</div>
            <h4 className="font-bold text-lg mb-2">Dots & Boxes</h4>
            <p className="text-sm text-gray-600">Classic 5×5 grid</p>
            <p className="text-xs text-gray-500 mt-1">Custom: 4×4 to 8×8</p>
          </div>
        </div>
      </div>

      {/* Notifications Feed - Always Visible */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            📬 Recent Activity
            {notifications && notifications.filter(n => !n.read).length > 0 && (
              <span className="ml-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {notifications.filter(n => !n.read).length} new
              </span>
            )}
          </h3>
          <div className="flex items-center space-x-3">
            {notifications && notifications.filter(n => !n.read).length > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Mark all as read
              </button>
            )}
            {notifications && notifications.length > 0 && (
              <button
                onClick={() => navigate('/notifications')}
                className="text-sm text-gray-600 hover:text-gray-800 font-medium"
              >
                View All →
              </button>
            )}
          </div>
        </div>
        {notifications && notifications.length > 0 ? (
          <div className="space-y-2">
            {notifications.slice(0, 5).map((notification) => {
              const isInvitation = notification.type === 'invitation_received'
              const invitation = isInvitation ? invitations?.find(inv => inv.id === notification.data?.invitation_id) : null

              return (
                <div
                  key={notification.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    notification.read ? 'border-gray-200 bg-gray-50' : 'border-blue-300 bg-blue-50'
                  } ${!isInvitation ? 'cursor-pointer hover:border-blue-400' : ''}`}
                  onClick={() => !isInvitation && handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {notification.type === 'invitation_received' && '🎮'}
                          {notification.type === 'tournament_started' && '🏁'}
                          {notification.type === 'player_joined' && '👥'}
                          {notification.type === 'invitation_accepted' && '✅'}
                          {notification.type === 'invitation_declined' && '❌'}
                        </span>
                        <h4 className="font-bold text-gray-800">{notification.title}</h4>
                        {!notification.read && (
                          <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">New</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {/* Show Accept/Decline buttons for invitation notifications */}
                      {isInvitation && invitation && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptInvitation(invitation.id, invitation.tournament_id)}
                            disabled={processingInvite === invitation.id}
                            className="px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processingInvite === invitation.id ? '...' : 'Accept'}
                          </button>
                          <button
                            onClick={() => handleDeclineInvitation(invitation.id)}
                            disabled={processingInvite === invitation.id}
                            className="px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processingInvite === invitation.id ? '...' : 'Decline'}
                          </button>
                        </div>
                      )}
                      
                      {/* Delete button - always show */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation() // Prevent notification click
                          handleDeleteNotification(notification.id)
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 transition"
                        title="Delete notification"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-4xl mb-2">🔔</p>
            <p className="font-medium">No new notifications</p>
            <p className="text-sm mt-1">You'll see tournament invites, game starts, and player activity here</p>
          </div>
        )}
      </div>
    </div>
  )
}


