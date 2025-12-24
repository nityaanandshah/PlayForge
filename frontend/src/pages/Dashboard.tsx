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

export default function Dashboard() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<PlayerStats | null>(null)
  const [invitations, setInvitations] = useState<TournamentInvitation[]>([])
  const [processingInvite, setProcessingInvite] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
    loadInvitations()
    refreshUser() // Refresh user data to get latest ELO
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
      const pending = response.data.invitations.filter(inv => inv.status === 'pending')
      setInvitations(pending)
    } catch (err) {
      console.error('Failed to load invitations:', err)
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
      {invitations.length > 0 && (
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
    </div>
  )
}


