import { useState, useEffect } from 'react'
import api from '../lib/api'
import { AxiosResponse } from 'axios'
import Layout from '../components/Layout'
import { useAuth } from '../hooks/useAuth'
import { BarChart3, Trophy, X, Circle, Gamepad2 } from 'lucide-react'

interface GameStats {
  id: string
  user_id: string
  game_type: string
  wins: number
  losses: number
  draws: number
  current_streak: number
  best_streak: number
  total_games: number
}

const Statistics = () => {
  const { user } = useAuth()
  const [allStats, setAllStats] = useState<GameStats | null>(null)
  const [gameStats, setGameStats] = useState<GameStats[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')

  const games = [
    { id: 'tictactoe', name: 'Tic-Tac-Toe', Icon: X, bgColor: 'bg-surface-2', iconColor: 'text-tictactoe-x' },
    { id: 'connect4', name: 'Connect 4', Icon: Circle, bgColor: 'bg-surface-2', iconColor: 'text-connect4-red' },
    { id: 'rps', name: 'Rock Paper Scissors', Icon: Gamepad2, bgColor: 'bg-surface-2', iconColor: 'text-rps-icon' },
    { id: 'dotsandboxes', name: 'Dots & Boxes', Icon: Circle, bgColor: 'bg-surface-2', iconColor: 'text-dots-a' },
  ]

  useEffect(() => {
    fetchStatistics()
  }, [])

  const fetchStatistics = async () => {
    setLoading(true)
    setError('')
    try {
      // Fetch overall stats
      const overallResponse = await api.get<GameStats>('/stats/')
      setAllStats(overallResponse.data)

      // Fetch stats for each game type
      const gameStatsPromises = games.map(game =>
        api.get<GameStats>(`/stats/${game.id}`)
      )
      const gameStatsResults = await Promise.all(gameStatsPromises)
      setGameStats(gameStatsResults.map((r: AxiosResponse<GameStats>) => r.data))
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }

  const calculateWinRate = (wins: number, totalGames: number): string => {
    if (totalGames === 0) return '0.0'
    return ((wins / totalGames) * 100).toFixed(1)
  }

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 60) return 'text-success'
    if (winRate >= 40) return 'text-warning'
    return 'text-danger'
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="bg-surface-1 shadow-floating rounded-xl p-8 mb-8 border border-border-subtle">
          <h1 className="text-3xl font-bold text-text-primary mb-8 flex items-center gap-2">
            <BarChart3 className="w-8 h-8" fill="currentColor" />
            My Statistics
          </h1>

          {/* Loading/Error States */}
          {loading && (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-accent-primary mx-auto"></div>
              <p className="text-text-secondary mt-6 text-lg font-medium">Loading statistics...</p>
            </div>
          )}

          {error && (
            <div className="bg-danger-soft border border-danger rounded-xl p-6 mb-8 shadow-soft">
              <p className="text-danger font-medium">{error}</p>
            </div>
          )}

          {!loading && !error && allStats && (
            <>
              {/* Overall Stats Card */}
              <div className="bg-accent-soft border border-accent-primary rounded-xl p-10 mb-10 shadow-elevated">
                <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                  <Trophy className="w-9 h-9" fill="currentColor" />
                  Overall Performance
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">{allStats.total_games}</div>
                    <div className="text-sm font-medium opacity-90">Total Games</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">{user?.elo_rating || 1200}</div>
                    <div className="text-sm font-medium opacity-90">ELO Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">{allStats.current_streak}</div>
                    <div className="text-sm font-medium opacity-90">Current Streak</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">{allStats.best_streak}</div>
                    <div className="text-sm font-medium opacity-90">Best Streak</div>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-3 gap-6">
                  <div className="text-center bg-white bg-opacity-20 rounded-xl p-5 shadow-soft">
                    <div className="text-3xl font-bold mb-1">{allStats.wins}</div>
                    <div className="text-sm font-medium opacity-90">Wins</div>
                  </div>
                  <div className="text-center bg-white bg-opacity-20 rounded-xl p-5 shadow-soft">
                    <div className="text-3xl font-bold mb-1">{allStats.losses}</div>
                    <div className="text-sm font-medium opacity-90">Losses</div>
                  </div>
                  <div className="text-center bg-white bg-opacity-20 rounded-xl p-5 shadow-soft">
                    <div className="text-3xl font-bold mb-1">{allStats.draws}</div>
                    <div className="text-sm font-medium opacity-90">Draws</div>
                  </div>
                </div>

                <div className="mt-8 text-center">
                  <div className="text-sm font-medium opacity-90 mb-2">Win Rate</div>
                  <div className="text-5xl font-bold">
                    {calculateWinRate(allStats.wins, allStats.total_games)}%
                  </div>
                </div>
              </div>

              {/* Per-Game Stats */}
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Game Breakdown</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {games.map((game, index) => {
                  const stats = gameStats[index]
                  const winRate = parseFloat(calculateWinRate(stats.wins, stats.total_games))
                  const IconComponent = game.Icon
                  
                  return (
                    <div key={game.id} className={`${game.bgColor} rounded-xl p-8 border-2 border-gray-200 shadow-elevated hover:shadow-lifted transition-shadow`}>
                      <div className="flex items-center gap-4 mb-6">
                        <IconComponent className={`w-12 h-12 ${game.iconColor}`} fill="currentColor" />
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">{game.name}</h3>
                          <p className="text-sm text-gray-600 font-medium">{stats.total_games} games played</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center bg-success-soft border border-success rounded-xl p-4 shadow-soft">
                          <div className="text-2xl font-bold text-success mb-1">{stats.wins}</div>
                          <div className="text-xs text-text-secondary font-medium">Wins</div>
                        </div>
                        <div className="text-center bg-danger-soft border border-danger rounded-xl p-4 shadow-soft">
                          <div className="text-2xl font-bold text-danger mb-1">{stats.losses}</div>
                          <div className="text-xs text-text-secondary font-medium">Losses</div>
                        </div>
                        <div className="text-center bg-surface-2 border border-border-subtle rounded-xl p-4 shadow-soft">
                          <div className="text-2xl font-bold text-text-muted mb-1">{stats.draws}</div>
                          <div className="text-xs text-text-secondary font-medium">Draws</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-surface-3 border border-border-subtle rounded-xl p-4 shadow-soft">
                          <div className="text-sm text-text-secondary font-medium mb-1">Win Rate</div>
                          <div className={`text-3xl font-bold ${getWinRateColor(winRate)}`}>
                            {winRate}%
                          </div>
                        </div>
                        <div className="bg-surface-3 border border-border-subtle rounded-xl p-4 shadow-soft">
                          <div className="text-sm text-text-secondary font-medium mb-1">Best Streak</div>
                          <div className="text-3xl font-bold text-accent-primary">
                            {stats.best_streak}
                          </div>
                        </div>
                      </div>

                      {stats.current_streak > 0 && (
                        <div className="mt-4 bg-warning-soft border border-warning rounded-xl p-3 text-center shadow-soft">
                          <span className="text-sm font-bold text-warning">
                            🔥 {stats.current_streak} win streak!
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* No games played message */}
              {allStats.total_games === 0 && (
                <div className="text-center py-16 text-text-muted">
                  <BarChart3 className="w-20 h-20 mx-auto text-text-disabled mb-4" fill="currentColor" />
                  <p className="text-xl font-semibold mb-2">You haven't played any games yet!</p>
                  <p className="text-sm mt-2">Start playing to see your statistics here.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default Statistics

