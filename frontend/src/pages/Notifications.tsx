import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { Inbox, Gamepad2, Trophy, Check, X, Trash2, Bell, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

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
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

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

  // Pagination calculations
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex)

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filter])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading notifications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-surface-1 shadow-elevated rounded-lg p-6 mb-6 border border-border-subtle">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-text-primary flex items-center gap-2">
              <Inbox className="w-8 h-8 text-accent-primary" />
              All Notifications
              {unreadCount > 0 && (
                <span className="ml-3 bg-accent-primary text-bg-main text-sm font-bold px-3 py-1 rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </h1>
            <p className="text-text-secondary mt-1">
              {notifications.length} total notification{notifications.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-accent-primary hover:text-accent-hover font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4 border-t border-border-subtle">
          {/* Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'all'
                  ? 'bg-accent-primary text-bg-main'
                  : 'bg-surface-2 text-text-secondary hover:bg-surface-3'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'unread'
                  ? 'bg-accent-primary text-bg-main'
                  : 'bg-surface-2 text-text-secondary hover:bg-surface-3'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Mark all as read */}
          <button
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            className={`ml-auto px-4 py-2 rounded-lg font-medium transition ${
              unreadCount > 0
                ? 'bg-success text-bg-main hover:bg-opacity-90'
                : 'bg-surface-2 text-text-muted cursor-not-allowed opacity-50'
            }`}
          >
            Mark all as read
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-danger-soft border border-danger text-danger px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Notifications List */}
      {filteredNotifications.length > 0 ? (
        <div className="space-y-3">
          {paginatedNotifications.map((notification) => {
            const isInvitation = notification.type === 'invitation_received'
            const invitation = isInvitation ? invitations?.find(inv => inv.id === notification.data?.invitation_id) : null

            return (
              <div
                key={notification.id}
                className={`shadow rounded-lg border p-5 transition-all ${
                  notification.read ? 'border-border-subtle bg-surface-1' : 'border-accent-primary bg-accent-soft'
                } ${!isInvitation ? 'cursor-pointer hover:shadow-md' : ''}`}
                onClick={() => !isInvitation && handleNotificationClick(notification)}
              >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {notification.type === 'invitation_received' && <Gamepad2 className="w-6 h-6 text-accent-primary" />}
                        {notification.type === 'tournament_started' && <Trophy className="w-6 h-6 text-accent-primary" />}
                        {notification.type === 'player_joined' && <Check className="w-6 h-6 text-success" />}
                        {notification.type === 'invitation_accepted' && <Check className="w-6 h-6 text-success" />}
                        {notification.type === 'invitation_declined' && <X className="w-6 h-6 text-danger" />}
                        <h4 className="font-bold text-text-primary text-lg">{notification.title}</h4>
                      {!notification.read && (
                        <span className="bg-accent-primary text-bg-main text-xs px-2 py-1 rounded-full font-semibold">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-text-primary mt-2">{notification.message}</p>
                    <p className="text-xs text-text-muted mt-2">
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
                          className="px-4 py-2 bg-success text-text-primary rounded-lg hover:bg-success-soft transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingInvite === invitation.id ? 'Processing...' : 'Accept'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeclineInvitation(invitation.id)
                          }}
                          disabled={processingInvite === invitation.id}
                          className="px-4 py-2 bg-danger text-text-primary rounded-lg hover:bg-danger-soft transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
                        className="p-2 text-text-muted hover:text-success transition"
                        title="Mark as read"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    )}

                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteNotification(notification.id)
                      }}
                      className="p-2 text-text-muted hover:text-danger transition"
                      title="Delete notification"
                    >
                      <Trash2 className="w-5 h-5" fill="currentColor" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Pagination Controls */}
          <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t border-border-subtle">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1 || totalPages <= 1}
              className="p-2 rounded-lg bg-surface-2 text-text-primary hover:bg-accent-soft hover:text-accent-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="First page"
            >
              <ChevronsLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || totalPages <= 1}
              className="p-2 rounded-lg bg-surface-2 text-text-primary hover:bg-accent-soft hover:text-accent-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Previous page"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className={`px-4 py-2 font-medium ${totalPages <= 1 ? 'text-text-muted' : 'text-text-primary'}`}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || totalPages <= 1}
              className="p-2 rounded-lg bg-surface-2 text-text-primary hover:bg-accent-soft hover:text-accent-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Next page"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages || totalPages <= 1}
              className="p-2 rounded-lg bg-surface-2 text-text-primary hover:bg-accent-soft hover:text-accent-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Last page"
            >
              <ChevronsRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-surface-1 shadow-elevated rounded-lg p-12 text-center border border-border-subtle">
          <Bell className="w-24 h-24 mb-4 mx-auto text-text-muted" />
          <p className="text-xl font-medium text-text-primary">
            {filter === 'unread' ? 'No unread notifications' : 'No new notifications'}
          </p>
          <p className="text-text-secondary mt-2">
            {filter === 'unread' 
              ? 'All caught up! Great job staying on top of things.'
              : 'Tournament invites and game activity will appear here'}
          </p>
        </div>
      )}
    </div>
  )
}

