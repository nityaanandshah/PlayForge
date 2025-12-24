import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { Inbox, Gamepad2, Trophy, Check, X, Trash2, Bell } from 'lucide-react'

interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  data?: Record<string, any>
  read: boolean
  created_at: string
}

interface TournamentInvitation {
  id: string
  tournament_id: string
  inviter_username: string
  status: string
}

export default function Notifications() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [invitations, setInvitations] = useState<TournamentInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [processingInvite, setProcessingInvite] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    loadNotifications()
    loadInvitations()
    
    // Auto-refresh notifications every 5 seconds for real-time updates
    const interval = setInterval(() => {
      loadNotifications()
      loadInvitations()
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])

  const loadNotifications = async () => {
    try {
      const response = await api.get<{ notifications: Notification[], total: number, unread: number }>('/notifications?limit=100')
      setNotifications(response.data.notifications || [])
    } catch (err) {
      console.error('Failed to load notifications:', err)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const loadInvitations = async () => {
    try {
      const response = await api.get<{ invitations: TournamentInvitation[] }>('/invitations')
      const pending = response.data.invitations?.filter(inv => inv.status === 'pending') || []
      setInvitations(pending)
    } catch (err) {
      console.error('Failed to load invitations:', err)
      setInvitations([])
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await api.post(`/notifications/${notificationId}/read`)
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
    } catch (err) {
      console.error('Failed to mark as read:', err)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await api.delete(`/notifications/${notificationId}`)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
    } catch (err) {
      console.error('Failed to delete notification:', err)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      await handleMarkAsRead(notification.id)
    }

    // Handle different notification types
    if (notification.type === 'invitation_received' && notification.data?.invitation_id) {
      return // Accept/decline handled by buttons
    } else if (notification.data?.tournament_id) {
      navigate(`/tournament/${notification.data.tournament_id}`)
    }
  }

  const handleAcceptInvitation = async (inviteId: string, tournamentId: string) => {
    setProcessingInvite(inviteId)
    try {
      await api.post(`/invitations/${inviteId}/accept`)
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
      setInvitations(prev => prev.filter(inv => inv.id !== inviteId))
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to decline invitation')
    } finally {
      setProcessingInvite(null)
    }
  }

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications

  const unreadCount = notifications.filter(n => !n.read).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading notifications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Inbox className="w-8 h-8" fill="currentColor" />
              All Notifications
              {unreadCount > 0 && (
                <span className="ml-3 bg-blue-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </h1>
            <p className="text-gray-600 mt-1">
              {notifications.length} total notification{notifications.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-600 hover:text-gray-800 font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4 border-t">
          {/* Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'unread'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Mark all as read */}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="ml-auto px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium transition"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Notifications List */}
      {filteredNotifications.length > 0 ? (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => {
            const isInvitation = notification.type === 'invitation_received'
            const invitation = isInvitation ? invitations?.find(inv => inv.id === notification.data?.invitation_id) : null

            return (
              <div
                key={notification.id}
                className={`bg-white shadow rounded-lg border p-5 transition-all ${
                  notification.read ? 'border-gray-200 bg-gray-50' : 'border-blue-300 bg-blue-50'
                } ${!isInvitation ? 'cursor-pointer hover:shadow-md' : ''}`}
                onClick={() => !isInvitation && handleNotificationClick(notification)}
              >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {notification.type === 'invitation_received' && <Gamepad2 className="w-6 h-6" fill="currentColor" />}
                        {notification.type === 'tournament_started' && <Trophy className="w-6 h-6" fill="currentColor" />}
                        {notification.type === 'player_joined' && <Check className="w-6 h-6" fill="currentColor" />}
                        {notification.type === 'invitation_accepted' && <Check className="w-6 h-6 text-green-600" fill="currentColor" />}
                        {notification.type === 'invitation_declined' && <X className="w-6 h-6 text-red-600" fill="currentColor" />}
                        <h4 className="font-bold text-gray-800 text-lg">{notification.title}</h4>
                      {!notification.read && (
                        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 mt-2">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {/* Accept/Decline buttons for invitation notifications */}
                    {isInvitation && invitation && (
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAcceptInvitation(invitation.id, invitation.tournament_id)
                          }}
                          disabled={processingInvite === invitation.id}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingInvite === invitation.id ? 'Processing...' : 'Accept'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeclineInvitation(invitation.id)
                          }}
                          disabled={processingInvite === invitation.id}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingInvite === invitation.id ? 'Processing...' : 'Decline'}
                        </button>
                      </div>
                    )}

                    {/* Mark as read button (only for unread) */}
                    {!notification.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMarkAsRead(notification.id)
                        }}
                        className="p-2 text-gray-400 hover:text-green-500 transition"
                        title="Mark as read"
                      >
                        <Check className="w-5 h-5" fill="currentColor" />
                      </button>
                    )}

                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteNotification(notification.id)
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 transition"
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
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <Bell className="w-24 h-24 mb-4 mx-auto text-gray-400" fill="currentColor" />
          <p className="text-xl font-medium text-gray-900">
            {filter === 'unread' ? 'No unread notifications' : 'No new notifications'}
          </p>
          <p className="text-gray-600 mt-2">
            {filter === 'unread' 
              ? 'All caught up! Great job staying on top of things.'
              : 'Tournament invites and game activity will appear here'}
          </p>
        </div>
      )}
    </div>
  )
}

