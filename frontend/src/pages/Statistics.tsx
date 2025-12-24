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
    { id: 'tictactoe', name: 'Tic-Tac-Toe', Icon: X, bgColor: 'bg-blue-100', iconColor: 'text-blue-500' },
    { id: 'connect4', name: 'Connect 4', Icon: Circle, bgColor: 'bg-yellow-100', iconColor: 'text-red-500' },
    { id: 'rps', name: 'Rock Paper Scissors', Icon: Gamepad2, bgColor: 'bg-purple-100', iconColor: 'text-purple-500' },
    { id: 'dotsandboxes', name: 'Dots & Boxes', Icon: Circle, bgColor: 'bg-green-100', iconColor: 'text-indigo-500' },
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
    if (winRate >= 60) return 'text-green-600'
    if (winRate >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BarChart3 className="w-8 h-8" fill="currentColor" />
            My Statistics
          </h1>

          {/* Loading/Error States */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading statistics...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {!loading && !error && allStats && (
            <>
              {/* Overall Stats Card */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 mb-6 text-white">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Trophy className="w-7 h-7" fill="currentColor" />
                  Overall Performance
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{allStats.total_games}</div>
                    <div className="text-sm opacity-90">Total Games</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{user?.elo_rating || 1200}</div>
                    <div className="text-sm opacity-90">ELO Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{allStats.current_streak}</div>
                    <div className="text-sm opacity-90">Current Streak</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{allStats.best_streak}</div>
                    <div className="text-sm opacity-90">Best Streak</div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="text-center bg-white bg-opacity-20 rounded-lg p-3">
                    <div className="text-2xl font-bold">{allStats.wins}</div>
                    <div className="text-sm opacity-90">Wins</div>
                  </div>
                  <div className="text-center bg-white bg-opacity-20 rounded-lg p-3">
                    <div className="text-2xl font-bold">{allStats.losses}</div>
                    <div className="text-sm opacity-90">Losses</div>
                  </div>
                  <div className="text-center bg-white bg-opacity-20 rounded-lg p-3">
                    <div className="text-2xl font-bold">{allStats.draws}</div>
                    <div className="text-sm opacity-90">Draws</div>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <div className="text-sm opacity-90">Win Rate</div>
                  <div className="text-4xl font-bold">
                    {calculateWinRate(allStats.wins, allStats.total_games)}%
                  </div>
                </div>
              </div>

              {/* Per-Game Stats */}
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Game Breakdown</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {games.map((game, index) => {
                  const stats = gameStats[index]
                  const winRate = parseFloat(calculateWinRate(stats.wins, stats.total_games))
                  const IconComponent = game.Icon
                  
                  return (
                    <div key={game.id} className={`${game.bgColor} rounded-lg p-6 border-2 border-gray-200`}>
                      <div className="flex items-center gap-3 mb-4">
                        <IconComponent className={`w-10 h-10 ${game.iconColor}`} fill="currentColor" />
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{game.name}</h3>
                          <p className="text-sm text-gray-600">{stats.total_games} games played</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="text-center bg-white rounded-lg p-2">
                          <div className="text-lg font-bold text-green-600">{stats.wins}</div>
                          <div className="text-xs text-gray-600">Wins</div>
                        </div>
                        <div className="text-center bg-white rounded-lg p-2">
                          <div className="text-lg font-bold text-red-600">{stats.losses}</div>
                          <div className="text-xs text-gray-600">Losses</div>
                        </div>
                        <div className="text-center bg-white rounded-lg p-2">
                          <div className="text-lg font-bold text-gray-600">{stats.draws}</div>
                          <div className="text-xs text-gray-600">Draws</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-lg p-2">
                          <div className="text-sm text-gray-600">Win Rate</div>
                          <div className={`text-2xl font-bold ${getWinRateColor(winRate)}`}>
                            {winRate}%
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-2">
                          <div className="text-sm text-gray-600">Best Streak</div>
                          <div className="text-2xl font-bold text-blue-600">
                            {stats.best_streak}
                          </div>
                        </div>
                      </div>

                      {stats.current_streak > 0 && (
                        <div className="mt-3 bg-yellow-100 border border-yellow-300 rounded-lg p-2 text-center">
                          <span className="text-sm font-semibold text-yellow-800">
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
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">You haven't played any games yet!</p>
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

