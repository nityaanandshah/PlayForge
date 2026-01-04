import { useState, useEffect } from 'react'
import { statsApi } from '../lib/api'
import Layout from '../components/Layout'
import { useAuth } from '../hooks/useAuth'
import { BarChart3, Trophy, X, Circle, Gamepad2, Flame } from 'lucide-react'

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
    { 
      id: 'tictactoe', 
      name: 'Tic-Tac-Toe', 
      icons: [
        { Icon: X, color: 'text-accent-primary' }, 
        { Icon: Circle, color: 'text-accent-primary' }
      ],
      bgColor: 'bg-surface-2'
    },
    { 
      id: 'connect4', 
      name: 'Connect 4', 
      icons: [
        { Icon: Circle, color: 'text-accent-primary' }, 
        { Icon: Circle, color: 'text-warning' }
      ],
      bgColor: 'bg-surface-2'
    },
    { 
      id: 'rps', 
      name: 'Rock Paper Scissors', 
      icons: [
        { Icon: Gamepad2, color: 'text-accent-primary' }
      ],
      bgColor: 'bg-surface-2'
    },
    { 
      id: 'dotsandboxes', 
      name: 'Dots & Boxes', 
      icons: [
        { Icon: Circle, color: 'text-accent-primary' }, 
        { Icon: Circle, color: 'text-text-muted' }
      ],
      bgColor: 'bg-surface-2'
    },
  ]

  useEffect(() => {
    fetchStatistics()
  }, [])

  const fetchStatistics = async () => {
    setLoading(true)
    setError('')
    try {
      // Fetch overall stats
      const overallStats = await statsApi.getMyStats()
      setAllStats(overallStats)

      // Fetch stats for each game type
      const gameStatsPromises = games.map(game =>
        statsApi.getStatsByGameType(game.id)
      )
      const gameStatsResults = await Promise.all(gameStatsPromises)
      setGameStats(gameStatsResults)
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
          <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-accent-primary" fill="currentColor" />
            <span 
              style={{
                background: 'linear-gradient(180deg, #D6A35C 0%, #C08A3E 50%, #A9742E 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0px 1px 2px rgba(192, 138, 62, 0.4))'
              }}
            >
              My Statistics
            </span>
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
              <div className="bg-accent-soft border-2 border-accent-primary rounded-xl p-8 mb-10 shadow-elevated">
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-3 text-text-primary">
                  <Trophy className="w-9 h-9 text-accent-primary" fill="currentColor" />
                  Overall Performance
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2 text-text-primary">{allStats.total_games}</div>
                    <div className="text-sm font-semibold text-text-secondary">Total Games</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2 text-text-primary">{user?.elo_rating || 1200}</div>
                    <div className="text-sm font-semibold text-text-secondary">ELO Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2 text-text-primary">{allStats.current_streak}</div>
                    <div className="text-sm font-semibold text-text-secondary">Current Streak</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2 text-text-primary">{allStats.best_streak}</div>
                    <div className="text-sm font-semibold text-text-secondary">Best Streak</div>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-3 gap-4">
                  <div className="text-center bg-success-soft border-2 border-success rounded-xl p-4 shadow-soft">
                    <div className="text-2xl font-bold text-success mb-1">{allStats.wins}</div>
                    <div className="text-sm font-semibold text-success">Wins</div>
                  </div>
                  <div className="text-center bg-danger-soft border-2 border-danger rounded-xl p-4 shadow-soft">
                    <div className="text-2xl font-bold text-danger mb-1">{allStats.losses}</div>
                    <div className="text-sm font-semibold text-danger">Losses</div>
                  </div>
                  <div className="text-center bg-surface-1 border-2 border-border-subtle rounded-xl p-4 shadow-soft">
                    <div className="text-2xl font-bold text-text-primary mb-1">{allStats.draws}</div>
                    <div className="text-sm font-semibold text-text-secondary">Draws</div>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <div className="text-sm font-semibold text-text-primary mb-2">Win Rate</div>
                  <div className="text-4xl font-bold text-accent-primary">
                    {calculateWinRate(allStats.wins, allStats.total_games)}%
                  </div>
                </div>
              </div>

              {/* Per-Game Stats */}
              <h2 className="text-3xl font-bold text-text-primary mb-8">Game Breakdown</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {games.map((game, index) => {
                  const stats = gameStats[index]
                  const winRate = parseFloat(calculateWinRate(stats.wins, stats.total_games))
                  
                  return (
                    <div key={game.id} className={`${game.bgColor} rounded-xl p-8 border-2 border-border-subtle shadow-elevated hover:shadow-lifted transition-shadow`}>
                      <div className="flex items-center gap-4 mb-6">
                        <div className="flex gap-2">
                          {game.icons.map((iconData, idx) => {
                            const IconComponent = iconData.Icon
                            return (
                              <IconComponent 
                                key={idx}
                                className={`w-10 h-10 ${iconData.color}`} 
                                fill="currentColor" 
                              />
                            )
                          })}
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-text-primary">{game.name}</h3>
                          <p className="text-sm text-text-secondary font-medium">{stats.total_games} games played</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center bg-success-soft border-2 border-success rounded-xl p-4 shadow-soft">
                          <div className="text-3xl font-bold text-success mb-1">{stats.wins}</div>
                          <div className="text-sm text-success font-semibold">Wins</div>
                        </div>
                        <div className="text-center bg-danger-soft border-2 border-danger rounded-xl p-4 shadow-soft">
                          <div className="text-3xl font-bold text-danger mb-1">{stats.losses}</div>
                          <div className="text-sm text-danger font-semibold">Losses</div>
                        </div>
                        <div className="text-center bg-surface-3 border-2 border-border-subtle rounded-xl p-4 shadow-soft">
                          <div className="text-3xl font-bold text-text-primary mb-1">{stats.draws}</div>
                          <div className="text-sm text-text-secondary font-semibold">Draws</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-surface-1 border-2 border-border-subtle rounded-xl p-4 shadow-soft">
                          <div className="text-sm text-text-secondary font-semibold mb-2">Win Rate</div>
                          <div className={`text-4xl font-bold ${getWinRateColor(winRate)}`}>
                            {winRate}%
                          </div>
                        </div>
                        <div className="bg-surface-1 border-2 border-border-subtle rounded-xl p-4 shadow-soft">
                          <div className="text-sm text-text-secondary font-semibold mb-2">Best Streak</div>
                          <div className="text-4xl font-bold text-accent-primary">
                            {stats.best_streak}
                          </div>
                        </div>
                      </div>

                      {stats.current_streak > 0 && (
                        <div className="mt-4 bg-warning-soft border-2 border-warning rounded-xl p-4 text-center shadow-soft">
                          <span className="text-base font-bold text-warning flex items-center justify-center gap-2">
                            <Flame className="w-5 h-5" fill="currentColor" />
                            {stats.current_streak} win streak!
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

