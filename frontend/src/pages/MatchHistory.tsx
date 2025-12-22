import { useState, useEffect } from 'react'
import api from '../lib/api'
import Layout from '../components/Layout'
import { useAuth } from '../hooks/useAuth'

interface MatchHistoryEntry {
  id: string
  game_type: string
  player1_id: string
  player1_name: string
  player2_id: string
  player2_name: string
  winner_id: string | null
  status: string
  started_at: string
  ended_at: string | null
}

interface MatchHistoryResponse {
  game_type: string
  matches: MatchHistoryEntry[]
}

const MatchHistory = () => {
  const { user } = useAuth()
  const [selectedGame, setSelectedGame] = useState<string>('all')
  const [matches, setMatches] = useState<MatchHistoryEntry[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')

  const games = [
    { id: 'all', name: 'All Games', emoji: '🎮' },
    { id: 'tictactoe', name: 'Tic-Tac-Toe', emoji: '❌⭕' },
    { id: 'connect4', name: 'Connect 4', emoji: '🔴🟡' },
    { id: 'rps', name: 'Rock Paper Scissors', emoji: '✊✋✌️' },
    { id: 'dotsandboxes', name: 'Dots & Boxes', emoji: '⚫📦' },
  ]

  useEffect(() => {
    fetchMatchHistory()
  }, [selectedGame])

  const fetchMatchHistory = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get<MatchHistoryResponse>(
        `/stats/history?game_type=${selectedGame}&limit=50`
      )
      setMatches(response.data.matches || [])
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load match history')
    } finally {
      setLoading(false)
    }
  }

  const getGameTypeName = (gameType: string) => {
    const game = games.find(g => g.id === gameType)
    return game ? `${game.emoji} ${game.name}` : gameType
  }

  const getMatchResult = (match: MatchHistoryEntry) => {
    if (!match.winner_id) {
      return { text: 'Draw', color: 'text-gray-600', bg: 'bg-gray-100' }
    }
    if (match.winner_id === user?.id) {
      return { text: 'Won', color: 'text-green-600', bg: 'bg-green-100' }
    }
    return { text: 'Lost', color: 'text-red-600', bg: 'bg-red-100' }
  }

  const getOpponentName = (match: MatchHistoryEntry) => {
    return match.player1_id === user?.id ? match.player2_name : match.player1_name
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    }
    return date.toLocaleDateString()
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">📜 Match History</h1>
          
          {/* Game Type Selector */}
          <div className="flex flex-wrap gap-2 mb-6">
            {games.map((game) => (
              <button
                key={game.id}
                onClick={() => setSelectedGame(game.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedGame === game.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {game.emoji} {game.name}
              </button>
            ))}
          </div>

          {/* Loading/Error States */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading match history...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Match History List */}
          {!loading && !error && (
            <>
              {matches.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">No match history found.</p>
                  <p className="text-sm mt-2">Play some games to see your match history here!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {matches.map((match) => {
                    const result = getMatchResult(match)
                    const opponent = getOpponentName(match)
                    
                    return (
                      <div
                        key={match.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-2xl">
                                {games.find(g => g.id === match.game_type)?.emoji || '🎮'}
                              </span>
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {games.find(g => g.id === match.game_type)?.name || match.game_type}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  vs {opponent}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className={`${result.bg} ${result.color} px-3 py-1 rounded-full font-bold text-sm mb-1`}>
                                {result.text}
                              </div>
                              <p className="text-xs text-gray-500">
                                {formatDate(match.started_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default MatchHistory

