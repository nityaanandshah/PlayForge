import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { statsApi, PlayerStats } from '../lib/api'
import api from '../lib/api'
import { Mail, Zap, Gamepad2, Trophy, X, Check, Trash2, Bell, Inbox, Circle } from 'lucide-react'

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
    <div className="space-y-8">
      <div className="bg-surface-1 shadow-elevated rounded-xl p-8 border border-border-subtle">
        <h2 className="text-3xl font-bold text-text-primary mb-6">
          Welcome, {user?.username}!
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-accent-soft rounded-xl p-6 shadow-soft border border-accent-primary">
            <p className="text-sm text-accent-primary font-semibold mb-2">ELO Rating</p>
            <p className="text-4xl font-bold text-accent-primary">{user?.elo_rating}</p>
          </div>
          <div className="bg-success-soft rounded-xl p-6 shadow-soft border border-success">
            <p className="text-sm text-success font-semibold mb-2">Games Won</p>
            <p className="text-4xl font-bold text-success">{stats?.wins || 0}</p>
          </div>
          <div className="bg-danger-soft rounded-xl p-6 shadow-soft border border-danger">
            <p className="text-sm text-danger font-semibold mb-2">Games Lost</p>
            <p className="text-4xl font-bold text-danger">{stats?.losses || 0}</p>
          </div>
        </div>
      </div>

      {/* Tournament Invitations */}
      {invitations && invitations.length > 0 && (
        <div className="bg-surface-1 shadow-lifted rounded-xl p-8 border border-border-subtle border-l-4 border-l-accent-primary">
          <h3 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-3">
            <Mail className="w-7 h-7 text-accent-primary" fill="currentColor" />
            Tournament Invitations
            <span className="ml-2 bg-accent-primary text-bg-main text-sm font-bold px-3 py-1 rounded-full">
              {invitations.length}
            </span>
          </h3>
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="bg-surface-2 border border-border-subtle shadow-soft rounded-xl p-6 flex items-center justify-between hover:shadow-elevated transition-all">
                <div className="flex-1">
                  <h4 className="font-bold text-xl text-text-primary mb-2">{invitation.tournament_name}</h4>
                  <p className="text-sm text-text-secondary mb-1">
                    <span className="font-semibold text-text-primary">{invitation.inviter_name}</span> invited you to play {getGameName(invitation.game_type)}
                  </p>
                  <p className="text-xs text-text-muted">
                    Expires: {new Date(invitation.expires_at).toLocaleDateString()} at {new Date(invitation.expires_at).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex gap-3 ml-6">
                  <button
                    onClick={() => handleAcceptInvitation(invitation.id, invitation.tournament_id)}
                    disabled={processingInvite === invitation.id}
                    className="px-6 py-3 bg-success text-text-primary rounded-lg hover:bg-success/80 transition-all shadow-soft font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {processingInvite === invitation.id ? '...' : <><Check className="w-5 h-5" fill="currentColor" /> Accept</>}
                  </button>
                  <button
                    onClick={() => handleDeclineInvitation(invitation.id)}
                    disabled={processingInvite === invitation.id}
                    className="px-6 py-3 bg-danger text-text-primary rounded-lg hover:bg-danger/80 transition-all shadow-soft font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {processingInvite === invitation.id ? '...' : <><X className="w-5 h-5" fill="currentColor" /> Decline</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-surface-1 shadow-elevated rounded-xl p-8 border border-border-subtle">
        <h3 className="text-2xl font-bold text-text-primary mb-6">Quick Actions</h3>
        
        {error && (
          <div className="mb-6 p-4 bg-danger-soft border border-danger rounded-xl text-danger shadow-soft">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button 
            onClick={handleQuickPlay}
            className="bg-accent-primary text-bg-main px-8 py-6 rounded-xl hover:bg-accent-hover active:bg-accent-active transition-all shadow-elevated font-medium text-center"
          >
            <Zap className="w-10 h-10 mb-3 mx-auto" fill="currentColor" />
            <div className="font-bold text-lg mb-1">Quick Play</div>
            <div className="text-sm opacity-90">Find match with standard rules</div>
          </button>
          <button 
            onClick={() => navigate('/rooms')}
            className="bg-surface-2 text-text-primary border border-border-subtle px-8 py-6 rounded-xl hover:bg-surface-3 transition-all shadow-elevated font-medium text-center"
          >
            <Gamepad2 className="w-10 h-10 mb-3 mx-auto text-accent-primary" fill="currentColor" />
            <div className="font-bold text-lg mb-1">Custom Game</div>
            <div className="text-sm text-text-secondary">Create room with your rules</div>
          </button>
          <button 
            onClick={() => navigate('/tournaments')}
            className="bg-surface-2 text-text-primary border border-border-subtle px-8 py-6 rounded-xl hover:bg-surface-3 transition-all shadow-elevated font-medium text-center"
          >
            <Trophy className="w-10 h-10 mb-3 mx-auto text-accent-primary" fill="currentColor" />
            <div className="font-bold text-lg mb-1">Tournaments</div>
            <div className="text-sm text-text-secondary">Compete in brackets</div>
          </button>
        </div>
      </div>

      <div className="bg-surface-1 shadow-elevated rounded-xl p-8 border border-border-subtle">
        <h3 className="text-2xl font-bold text-text-primary mb-6">Available Games</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-surface-2 border border-border-subtle shadow-soft rounded-xl p-6 hover:shadow-elevated hover:border-accent-primary transition-all">
            <div className="flex gap-2 mb-4">
              <X className="w-7 h-7 text-accent-primary" fill="currentColor" />
              <Circle className="w-7 h-7 text-accent-primary" fill="currentColor" />
            </div>
            <h4 className="font-bold text-xl mb-3 text-text-primary">Tic-Tac-Toe</h4>
            <p className="text-sm text-text-secondary mb-2">Classic 3×3 grid</p>
            <p className="text-xs text-text-muted">Custom: up to 5×5</p>
          </div>
          <div className="bg-surface-2 border border-border-subtle shadow-soft rounded-xl p-6 hover:shadow-elevated hover:border-accent-primary transition-all">
            <div className="flex gap-2 mb-4">
              <Circle className="w-7 h-7 text-accent-primary" fill="currentColor" />
              <Circle className="w-7 h-7 text-warning" fill="currentColor" />
            </div>
            <h4 className="font-bold text-xl mb-3 text-text-primary">Connect 4</h4>
            <p className="text-sm text-text-secondary mb-2">Standard 6×7 board</p>
            <p className="text-xs text-text-muted">Custom: up to 10×10</p>
          </div>
          <div className="bg-surface-2 border border-border-subtle shadow-soft rounded-xl p-6 hover:shadow-elevated hover:border-accent-primary transition-all">
            <Gamepad2 className="w-9 h-9 mb-4 text-accent-primary" fill="currentColor" />
            <h4 className="font-bold text-xl mb-3 text-text-primary">Rock-Paper-Scissors</h4>
            <p className="text-sm text-text-secondary mb-2">Best of 5 rounds</p>
            <p className="text-xs text-text-muted">Custom: 3, 5, 7, or 9</p>
          </div>
          <div className="bg-surface-2 border border-border-subtle shadow-soft rounded-xl p-6 hover:shadow-elevated hover:border-accent-primary transition-all">
            <div className="flex gap-2 mb-4">
              <Circle className="w-7 h-7 text-accent-primary" fill="currentColor" />
              <Circle className="w-7 h-7 text-text-muted" fill="currentColor" />
            </div>
            <h4 className="font-bold text-xl mb-3 text-text-primary">Dots & Boxes</h4>
            <p className="text-sm text-text-secondary mb-2">Classic 5×5 grid</p>
            <p className="text-xs text-text-muted">Custom: 4×4 to 8×8</p>
          </div>
        </div>
      </div>

      {/* Notifications Feed - Always Visible */}
      <div className="bg-surface-1 shadow-elevated rounded-xl p-8 border border-border-subtle">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            <Inbox className="w-7 h-7 text-accent-primary" fill="currentColor" />
            Recent Activity
            {notifications && notifications.filter(n => !n.read).length > 0 && (
              <span className="ml-2 bg-accent-primary text-bg-main text-sm font-bold px-3 py-1 rounded-full">
                {notifications.filter(n => !n.read).length} new
              </span>
            )}
          </h3>
          <div className="flex items-center space-x-4">
            {notifications && notifications.filter(n => !n.read).length > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-accent-primary hover:text-accent-hover font-semibold"
              >
                Mark all as read
              </button>
            )}
            {notifications && notifications.length > 0 && (
              <button
                onClick={() => navigate('/notifications')}
                className="text-sm text-text-secondary hover:text-text-primary font-semibold"
              >
                View All →
              </button>
            )}
          </div>
        </div>
        {notifications && notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.slice(0, 5).map((notification) => {
              const isInvitation = notification.type === 'invitation_received'
              const invitation = isInvitation ? invitations?.find(inv => inv.id === notification.data?.invitation_id) : null

              return (
                <div
                  key={notification.id}
                  className={`border rounded-xl p-5 transition-all shadow-soft ${
                    notification.read ? 'border-border-subtle bg-surface-2' : 'border-accent-primary bg-accent-soft'
                  } ${!isInvitation ? 'cursor-pointer hover:shadow-elevated' : ''}`}
                  onClick={() => !isInvitation && handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        {notification.type === 'invitation_received' && <Gamepad2 className="w-6 h-6 text-accent-primary" fill="currentColor" />}
                        {notification.type === 'tournament_started' && <Trophy className="w-6 h-6 text-accent-primary" fill="currentColor" />}
                        {notification.type === 'player_joined' && <Check className="w-6 h-6 text-success" fill="currentColor" />}
                        {notification.type === 'invitation_accepted' && <Check className="w-6 h-6 text-success" fill="currentColor" />}
                        {notification.type === 'invitation_declined' && <X className="w-6 h-6 text-danger" fill="currentColor" />}
                        <h4 className="font-bold text-lg text-text-primary">{notification.title}</h4>
                        {!notification.read && (
                          <span className="bg-accent-primary text-bg-main text-xs px-3 py-1 rounded-full font-semibold">New</span>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary mt-2 ml-9">{notification.message}</p>
                      <p className="text-xs text-text-muted mt-2 ml-9">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 ml-6">
                      {/* Show Accept/Decline buttons for invitation notifications */}
                      {isInvitation && invitation && (
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleAcceptInvitation(invitation.id, invitation.tournament_id)}
                            disabled={processingInvite === invitation.id}
                            className="px-4 py-2 bg-success text-text-primary text-sm rounded-lg hover:bg-success/80 transition-all shadow-soft font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processingInvite === invitation.id ? '...' : 'Accept'}
                          </button>
                          <button
                            onClick={() => handleDeclineInvitation(invitation.id)}
                            disabled={processingInvite === invitation.id}
                            className="px-4 py-2 bg-danger text-text-primary text-sm rounded-lg hover:bg-danger/80 transition-all shadow-soft font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
                        className="p-2 text-text-muted hover:text-danger transition-all rounded-lg hover:bg-danger-soft"
                        title="Delete notification"
                      >
                        <Trash2 className="w-5 h-5" fill="currentColor" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-text-muted">
            <Bell className="w-20 h-20 mb-4 mx-auto text-text-disabled" fill="currentColor" />
            <p className="font-semibold text-lg text-text-secondary">No new notifications</p>
            <p className="text-sm mt-2">You'll see tournament invites, game starts, and player activity here</p>
          </div>
        )}
      </div>
    </div>
  )
}


