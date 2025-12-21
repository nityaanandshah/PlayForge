import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { gameApi, statsApi, PlayerStats } from '../lib/api'

export default function Dashboard() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<PlayerStats | null>(null)

  useEffect(() => {
    loadStats()
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

  const handleQuickPlay = async () => {
    setLoading(true)
    setError('')
    
    try {
      const game = await gameApi.createGame('tictactoe')
      navigate(`/game/${game.id}`)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create game')
    } finally {
      setLoading(false)
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

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={() => navigate('/matchmaking')}
            className="bg-primary-600 text-white px-6 py-4 rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            🎯 Find Match (Matchmaking)
          </button>
          <button 
            onClick={() => navigate('/rooms')}
            className="bg-purple-600 text-white px-6 py-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            🎮 Create/Join Room
          </button>
          <button 
            onClick={handleQuickPlay}
            disabled={loading}
            className="bg-green-600 text-white px-6 py-4 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : '⚡ Quick Play (Direct)'}
          </button>
          <button 
            className="bg-orange-600 text-white px-6 py-4 rounded-lg hover:bg-orange-700 transition-colors font-medium opacity-50 cursor-not-allowed"
            disabled
          >
            🏆 Tournaments (Coming Soon)
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Available Games</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-primary-500 cursor-pointer transition-colors">
            <h4 className="font-bold text-lg mb-2">Tic-Tac-Toe</h4>
            <p className="text-sm text-gray-600">Classic 3x3 grid game</p>
          </div>
          <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-primary-500 cursor-pointer transition-colors">
            <h4 className="font-bold text-lg mb-2">Connect-4</h4>
            <p className="text-sm text-gray-600">Connect four in a row</p>
          </div>
          <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-primary-500 cursor-pointer transition-colors">
            <h4 className="font-bold text-lg mb-2">Rock-Paper-Scissors</h4>
            <p className="text-sm text-gray-600">Best of 5 rounds</p>
          </div>
          <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-primary-500 cursor-pointer transition-colors">
            <h4 className="font-bold text-lg mb-2">Dots & Boxes</h4>
            <p className="text-sm text-gray-600">Strategic line game</p>
          </div>
        </div>
      </div>
    </div>
  )
}


