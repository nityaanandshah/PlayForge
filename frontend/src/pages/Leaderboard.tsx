import { useState, useEffect } from 'react'
import api from '../lib/api'
import Layout from '../components/Layout'
import { Trophy, X, Circle, Gamepad2, Medal } from 'lucide-react'

interface LeaderboardEntry {
  user_id: string
  username: string
  elo_rating: number
  wins: number
  losses: number
  draws: number
  total_games: number
}

interface LeaderboardResponse {
  game_type: string
  entries: LeaderboardEntry[]
}

const Leaderboard = () => {
  const [selectedGame, setSelectedGame] = useState<string>('all')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')

  const games = [
    { id: 'all', name: 'Overall', Icon: Trophy, color: 'text-yellow-500' },
    { id: 'tictactoe', name: 'Tic-Tac-Toe', Icon: X, color: 'text-blue-500' },
    { id: 'connect4', name: 'Connect 4', Icon: Circle, color: 'text-red-500' },
    { id: 'rps', name: 'Rock Paper Scissors', Icon: Gamepad2, color: 'text-purple-500' },
    { id: 'dotsandboxes', name: 'Dots & Boxes', Icon: Circle, color: 'text-indigo-500' },
  ]

  useEffect(() => {
    fetchLeaderboard()
  }, [selectedGame])

  const fetchLeaderboard = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get<LeaderboardResponse>(
        `/stats/leaderboard?game_type=${selectedGame}&limit=50`
      )
      setLeaderboard(response.data.entries || [])
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load leaderboard')
    } finally {
      setLoading(false)
    }
  }

  const calculateWinRate = (wins: number, totalGames: number) => {
    if (totalGames === 0) return '0.0%'
    return ((wins / totalGames) * 100).toFixed(1) + '%'
  }

  const getRankMedal = (rank: number) => {
    if (rank === 1) return <Medal className="w-6 h-6 text-yellow-500 inline" fill="currentColor" />
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400 inline" fill="currentColor" />
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-600 inline" fill="currentColor" />
    return `#${rank}`
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow-elevated rounded-xl p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-2">
            <Trophy className="w-8 h-8" fill="currentColor" />
            Leaderboard
          </h1>
          
          {/* Game Type Selector */}
          <div className="flex flex-wrap gap-3 mb-8">
            {games.map((game) => {
              const IconComponent = game.Icon
              const isSelected = selectedGame === game.id
              return (
                <button
                  key={game.id}
                  onClick={() => setSelectedGame(game.id)}
                  className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-elevated'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-soft'
                  }`}
                >
                  <IconComponent 
                    className={`w-5 h-5 ${isSelected ? '' : game.color}`} 
                    fill="currentColor" 
                  />
                  {game.name}
                </button>
              )
            })}
          </div>

          {/* Loading/Error States */}
          {loading && (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-6 text-lg font-medium">Loading leaderboard...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-8 shadow-soft">
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Leaderboard Table */}
          {!loading && !error && (
            <>
              {leaderboard.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <Trophy className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="currentColor" />
                  <p className="text-xl font-semibold mb-2">No players found for this game type yet.</p>
                  <p className="text-sm mt-2">Be the first to play and claim the top spot!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-8 py-5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                          Rank
                        </th>
                        <th className="px-8 py-5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                          Player
                        </th>
                        <th className="px-8 py-5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                          ELO Rating
                        </th>
                        <th className="px-8 py-5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                          Games
                        </th>
                        <th className="px-8 py-5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                          Record
                        </th>
                        <th className="px-8 py-5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                          Win Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {leaderboard.map((entry, index) => (
                        <tr
                          key={entry.user_id}
                          className={`transition-all hover:shadow-elevated ${
                            index < 3 ? 'bg-yellow-50' : ''
                          }`}
                        >
                          <td className="px-8 py-6 whitespace-nowrap">
                            <span className="text-2xl font-bold">
                              {getRankMedal(index + 1)}
                            </span>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap">
                            <div className="text-base font-semibold text-gray-900">
                              {entry.username}
                            </div>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-2xl font-bold text-blue-600">
                                {entry.elo_rating}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap">
                            <span className="text-base font-medium text-gray-900">
                              {entry.total_games}
                            </span>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap">
                            <span className="text-base text-gray-900">
                              <span className="text-green-600 font-bold">{entry.wins}W</span>
                              {' / '}
                              <span className="text-red-600 font-bold">{entry.losses}L</span>
                              {entry.draws > 0 && (
                                <>
                                  {' / '}
                                  <span className="text-gray-600 font-bold">{entry.draws}D</span>
                                </>
                              )}
                            </span>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap">
                            <span className="text-base font-bold text-gray-900">
                              {calculateWinRate(entry.wins, entry.total_games)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default Leaderboard

