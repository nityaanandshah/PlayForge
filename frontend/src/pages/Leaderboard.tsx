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
    { id: 'all', name: 'Overall', icons: [{ Icon: Trophy, color: 'text-accent-primary' }] },
    { id: 'tictactoe', name: 'Tic-Tac-Toe', icons: [{ Icon: X, color: 'text-accent-primary' }, { Icon: Circle, color: 'text-accent-primary' }] },
    { id: 'connect4', name: 'Connect 4', icons: [{ Icon: Circle, color: 'text-accent-primary' }, { Icon: Circle, color: 'text-warning' }] },
    { id: 'rps', name: 'Rock Paper Scissors', icons: [{ Icon: Gamepad2, color: 'text-accent-primary' }] },
    { id: 'dotsandboxes', name: 'Dots & Boxes', icons: [{ Icon: Circle, color: 'text-accent-primary' }, { Icon: Circle, color: 'text-text-muted' }] },
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
        <div className="bg-surface-1 shadow-elevated rounded-xl p-8 mb-8 border border-border-subtle">
          <h1 className="text-3xl font-bold text-text-primary mb-8 flex items-center gap-2">
            <Trophy className="w-8 h-8 text-accent-primary" fill="currentColor" />
            Leaderboard
          </h1>
          
          {/* Game Type Selector */}
          <div className="flex flex-wrap gap-3 mb-8">
            {games.map((game) => {
              const isSelected = selectedGame === game.id
              return (
                <button
                  key={game.id}
                  onClick={() => setSelectedGame(game.id)}
                  className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-accent-primary text-bg-main shadow-elevated'
                      : 'bg-surface-2 text-text-secondary border border-border-subtle hover:bg-surface-3 shadow-soft'
                  }`}
                >
                  <div className="flex gap-1">
                    {game.icons.map((iconData, idx) => {
                      const IconComponent = iconData.Icon
                      return (
                        <IconComponent 
                          key={idx}
                          className={`w-5 h-5 ${isSelected ? '' : iconData.color}`} 
                          fill="currentColor" 
                        />
                      )
                    })}
                  </div>
                  {game.name}
                </button>
              )
            })}
          </div>

          {/* Loading/Error States */}
          {loading && (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-accent-primary mx-auto"></div>
              <p className="text-text-secondary mt-6 text-lg font-medium">Loading leaderboard...</p>
            </div>
          )}

          {error && (
            <div className="bg-danger-soft border-2 border-danger rounded-xl p-6 mb-8 shadow-soft">
              <p className="text-danger font-medium">{error}</p>
            </div>
          )}

          {/* Leaderboard Table */}
          {!loading && !error && (
            <>
              {leaderboard.length === 0 ? (
                <div className="text-center py-16 text-text-muted">
                  <Trophy className="w-20 h-20 mx-auto text-text-disabled mb-4" fill="currentColor" />
                  <p className="text-xl font-semibold mb-2 text-text-secondary">No players found for this game type yet.</p>
                  <p className="text-sm mt-2">Be the first to play and claim the top spot!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border-subtle">
                    <thead className="bg-surface-2">
                      <tr>
                        <th className="px-8 py-5 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                          Rank
                        </th>
                        <th className="px-8 py-5 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                          Player
                        </th>
                        <th className="px-8 py-5 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                          ELO Rating
                        </th>
                        <th className="px-8 py-5 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                          Games
                        </th>
                        <th className="px-8 py-5 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                          Record
                        </th>
                        <th className="px-8 py-5 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                          Win Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {leaderboard.map((entry, index) => (
                        <tr
                          key={entry.user_id}
                          className={`transition-all hover:bg-surface-2 ${
                            index === 0 ? 'bg-accent-soft' : index % 2 === 0 ? 'bg-surface-1' : 'bg-surface-2'
                          }`}
                        >
                          <td className="px-8 py-6 whitespace-nowrap">
                            <span className={`text-2xl font-bold ${index === 0 ? 'text-accent-primary' : 'text-text-primary'}`}>
                              {getRankMedal(index + 1)}
                            </span>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap">
                            <div className={`text-base font-semibold ${index === 0 ? 'text-accent-primary' : 'text-text-primary'}`}>
                              {entry.username}
                            </div>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className={`text-2xl font-bold ${index === 0 ? 'text-accent-primary' : 'text-text-primary'}`}>
                                {entry.elo_rating}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap">
                            <span className="text-base font-medium text-text-primary">
                              {entry.total_games}
                            </span>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap">
                            <span className="text-base text-text-primary">
                              <span className="text-success font-bold">{entry.wins}W</span>
                              {' / '}
                              <span className="text-danger font-bold">{entry.losses}L</span>
                              {entry.draws > 0 && (
                                <>
                                  {' / '}
                                  <span className="text-text-muted font-bold">{entry.draws}D</span>
                                </>
                              )}
                            </span>
                          </td>
                          <td className="px-8 py-6 whitespace-nowrap">
                            <span className="text-base font-bold text-text-primary">
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

