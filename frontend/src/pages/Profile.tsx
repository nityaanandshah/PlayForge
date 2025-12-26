import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { statsApi, PlayerStats } from '../lib/api'
import api from '../lib/api'
import { Crown, Gem, Star, Target, Gamepad2, PartyPopper, Trophy, Dumbbell, Flame, Zap, Medal, Settings, Lock } from 'lucide-react'

interface PublicProfile {
  user_id: string
  username: string
  elo_rating: number
}

export default function Profile() {
  const { username } = useParams<{ username: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [stats, setStats] = useState<PlayerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const isOwnProfile = !username || username === user?.username

  useEffect(() => {
    loadProfile()
  }, [username])

  const loadProfile = async () => {
    try {
      setLoading(true)
      if (isOwnProfile && user) {
        // Load own profile
        setProfile({
          user_id: user.id,
          username: user.username,
          elo_rating: user.elo_rating,
        })
        const playerStats = await statsApi.getMyStats()
        setStats(playerStats)
      } else if (username) {
        // Load public profile
        const response = await api.get<PublicProfile>(`/profile/${username}`)
        setProfile(response.data)
        // Note: Stats API doesn't have a public endpoint yet, using own stats as fallback
        const playerStats = await statsApi.getMyStats()
        setStats(playerStats)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const getRankBadge = (elo: number) => {
    if (elo >= 2000) return { 
      name: 'Grandmaster', 
      color: 'bg-accent-primary', 
      Icon: Crown,
      description: '2000+ ELO - Highest rank! Legendary player',
      nextRank: null
    }
    if (elo >= 1800) return { 
      name: 'Master', 
      color: 'bg-accent-hover', 
      Icon: Gem,
      description: '1800-1999 ELO - Elite player',
      nextRank: 'Grandmaster (2000 ELO)'
    }
    if (elo >= 1600) return { 
      name: 'Expert', 
      color: 'bg-warning', 
      Icon: Star,
      description: '1600-1799 ELO - Skilled player',
      nextRank: 'Master (1800 ELO)'
    }
    if (elo >= 1400) return { 
      name: 'Advanced', 
      color: 'bg-success', 
      Icon: Target,
      description: '1400-1599 ELO - Proficient player',
      nextRank: 'Expert (1600 ELO)'
    }
    return { 
      name: 'Intermediate', 
      color: 'bg-text-secondary', 
      Icon: Gamepad2,
      description: 'Below 1400 ELO - Keep playing to rank up!',
      nextRank: 'Advanced (1400 ELO)'
    }
  }

  const getAchievements = () => {
    if (!stats) return []
    
    const allAchievements = [
      // Win-based achievements
      { 
        name: 'First Victory', 
        Icon: PartyPopper, 
        requirement: 'Win your first game',
        unlocked: stats.wins >= 1,
        progress: `${Math.min(stats.wins, 1)}/1`
      },
      { 
        name: '10 Wins', 
        Icon: Trophy, 
        requirement: 'Win 10 games',
        unlocked: stats.wins >= 10,
        progress: `${Math.min(stats.wins, 10)}/10`
      },
      { 
        name: '50 Wins', 
        Icon: Dumbbell, 
        requirement: 'Win 50 games',
        unlocked: stats.wins >= 50,
        progress: `${Math.min(stats.wins, 50)}/50`
      },
      { 
        name: 'Century', 
        Icon: Trophy, 
        requirement: 'Win 100 games',
        unlocked: stats.wins >= 100,
        progress: `${Math.min(stats.wins, 100)}/100`
      },
      
      // Game activity achievements
      { 
        name: 'Veteran', 
        Icon: Medal, 
        requirement: 'Play 10 total games',
        unlocked: stats.total_games >= 10,
        progress: `${Math.min(stats.total_games, 10)}/10`
      },
      { 
        name: 'Dedicated', 
        Icon: Flame, 
        requirement: 'Play 100 total games',
        unlocked: stats.total_games >= 100,
        progress: `${Math.min(stats.total_games, 100)}/100`
      },
      
      // Win streak achievements
      { 
        name: 'Hot Streak', 
        Icon: Flame, 
        requirement: 'Get a 5-game win streak',
        unlocked: stats.best_streak >= 5,
        progress: `Best: ${stats.best_streak}`
      },
      { 
        name: 'Unstoppable', 
        Icon: Zap, 
        requirement: 'Get a 10-game win streak',
        unlocked: stats.best_streak >= 10,
        progress: `Best: ${stats.best_streak}`
      },
    ]
    
    return allAchievements
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-text-secondary">Loading profile...</div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="bg-danger-soft border border-danger rounded-lg p-6">
        <h2 className="text-xl font-bold text-danger mb-2">Error</h2>
        <p className="text-danger">{error || 'Profile not found'}</p>
      </div>
    )
  }

  const rank = getRankBadge(profile.elo_rating)
  const achievements = getAchievements()
  const winRate = stats ? ((stats.wins / stats.total_games) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-surface-1 rounded-xl shadow-elevated p-10 border border-border-subtle">
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
            <div 
              className="w-28 h-28 rounded-full flex items-center justify-center cursor-help shadow-lifted border-4 border-accent-primary"
              style={{
                background: 'linear-gradient(135deg, #D6A35C 0%, #C08A3E 50%, #A9742E 100%)'
              }}
              title={`${rank.name} - ${rank.description}${rank.nextRank ? `\nNext rank: ${rank.nextRank}` : ''}`}
            >
              <span className="text-6xl font-bold text-bg-main">
                {profile.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-5xl font-bold mb-4 text-text-primary">{profile.username}</h1>
              <div 
                className={`inline-block px-6 py-3 ${rank.color} rounded-full text-bg-main font-bold cursor-help shadow-soft`}
                title={`${rank.description}${rank.nextRank ? `\nNext rank: ${rank.nextRank}` : ''}`}
              >
                {rank.name}
              </div>
            </div>
          </div>
          {isOwnProfile && (
            <button
              onClick={() => navigate('/settings')}
              className="bg-accent-primary text-bg-main px-8 py-4 rounded-xl font-bold hover:bg-accent-hover transition shadow-soft flex items-center gap-2"
            >
              <Settings className="w-5 h-5" fill="currentColor" />
              Settings
            </button>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-surface-1 rounded-xl shadow-elevated p-8 text-center hover:shadow-lifted transition-shadow border border-border-subtle">
          <div className="text-4xl font-bold text-accent-primary mb-3">{profile.elo_rating}</div>
          <div className="text-sm text-text-secondary font-medium">ELO Rating</div>
        </div>
        <div className="bg-surface-1 rounded-xl shadow-elevated p-8 text-center hover:shadow-lifted transition-shadow border border-border-subtle">
          <div className="text-4xl font-bold text-success mb-3">{stats?.wins || 0}</div>
          <div className="text-sm text-text-secondary font-medium">Wins</div>
        </div>
        <div className="bg-surface-1 rounded-xl shadow-elevated p-8 text-center hover:shadow-lifted transition-shadow border border-border-subtle">
          <div className="text-4xl font-bold text-warning mb-3">{winRate}%</div>
          <div className="text-sm text-text-secondary font-medium">Win Rate</div>
        </div>
        <div className="bg-surface-1 rounded-xl shadow-elevated p-8 text-center hover:shadow-lifted transition-shadow border border-border-subtle">
          <div className="text-4xl font-bold text-accent-hover mb-3">{stats?.total_games || 0}</div>
          <div className="text-sm text-text-secondary font-medium">Total Games</div>
        </div>
      </div>

      {/* Performance Details */}
      <div className="bg-surface-1 rounded-xl shadow-elevated p-8 border border-border-subtle">
        <h2 className="text-3xl font-bold mb-8 text-text-primary">Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <h3 className="font-bold text-xl mb-6 text-text-primary">Overall Record</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-surface-2 rounded-lg border border-border-subtle">
                <span className="text-text-secondary font-medium">Wins:</span>
                <span className="font-bold text-success text-xl">{stats?.wins || 0}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-surface-2 rounded-lg border border-border-subtle">
                <span className="text-text-secondary font-medium">Losses:</span>
                <span className="font-bold text-danger text-xl">{stats?.losses || 0}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-surface-2 rounded-lg border border-border-subtle">
                <span className="text-text-secondary font-medium">Draws:</span>
                <span className="font-bold text-text-muted text-xl">{stats?.draws || 0}</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-xl mb-6 text-text-primary">Streaks</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-surface-2 rounded-lg border border-border-subtle">
                <span className="text-text-secondary font-medium">Current Streak:</span>
                <span className="font-bold flex items-center gap-2 text-xl text-text-primary">
                  {stats?.current_streak || 0} 
                  {stats && stats.current_streak > 0 && <Flame className="w-5 h-5 text-warning" fill="currentColor" />}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-surface-2 rounded-lg border border-border-subtle">
                <span className="text-text-secondary font-medium">Best Streak:</span>
                <span className="font-bold flex items-center gap-2 text-xl text-text-primary">
                  {stats?.best_streak || 0} <Zap className="w-5 h-5 text-accent-primary" fill="currentColor" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-surface-1 rounded-xl shadow-elevated p-8 border border-border-subtle">
        <h2 className="text-3xl font-bold mb-8 flex items-center gap-3 text-text-primary">
          <Trophy className="w-9 h-9 text-accent-primary" fill="currentColor" />
          Achievements ({achievements.filter(a => a.unlocked).length}/{achievements.length})
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6">
          {achievements.map((achievement) => {
            const IconComponent = achievement.Icon
            return (
              <div
                key={achievement.name}
                className={`border-2 rounded-xl p-5 text-center transition cursor-help ${
                  achievement.unlocked
                    ? 'border-accent-primary bg-accent-soft shadow-soft hover:shadow-elevated text-accent-primary'
                    : 'border-border-subtle bg-surface-2 opacity-60 hover:opacity-80 text-text-muted'
                }`}
                title={`${achievement.name}\n${achievement.requirement}\nProgress: ${achievement.progress}`}
              >
                <IconComponent className="w-10 h-10 mb-3 mx-auto" fill="currentColor" />
                <div className="text-xs font-bold">{achievement.name}</div>
                {!achievement.unlocked && (
                  <div className="text-xs mt-2">
                    <Lock className="w-4 h-4 mx-auto" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Game Activity Contribution Graph */}
      <ContributionGraph userId={profile?.user_id || ''} username={profile?.username || ''} />
    </div>
  )
}

interface MatchHistoryEntry {
  id: string
  game_type: string
  started_at: string
  ended_at: string | null
}

interface ContributionGraphProps {
  userId: string
  username: string
}

function ContributionGraph({ userId }: ContributionGraphProps) {
  const navigate = useNavigate()
  const [matches, setMatches] = useState<MatchHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      loadMatchHistory()
    }
  }, [userId])

  const loadMatchHistory = async () => {
    try {
      const response = await api.get<{ matches: MatchHistoryEntry[] }>('/stats/history?game_type=all&limit=1000')
      setMatches(response.data.matches || [])
    } catch (err) {
      console.error('Failed to load match history:', err)
      setMatches([])
    } finally {
      setLoading(false)
    }
  }

  // Group matches by date
  const getContributionData = () => {
    const data: { [date: string]: number } = {}
    
    matches.forEach(match => {
      const date = new Date(match.started_at).toDateString()
      data[date] = (data[date] || 0) + 1
    })
    
    return data
  }

  // Calculate streaks
  const calculateStreaks = () => {
    const contributionData = getContributionData()
    const dates = Object.keys(contributionData).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    let lastDate: Date | null = null

    // Check if today has activity
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()
    const hasActivityToday = contributionData[today] > 0
    const hasActivityYesterday = contributionData[yesterday] > 0

    // Calculate current streak (counting backwards from today/yesterday)
    const now = new Date()
    let checkDate = new Date(now)
    
    // Start from today if has activity, otherwise yesterday
    if (!hasActivityToday && !hasActivityYesterday) {
      currentStreak = 0
    } else {
      if (!hasActivityToday) {
        checkDate = new Date(Date.now() - 86400000) // Start from yesterday
      }
      
      while (true) {
        const dateStr = checkDate.toDateString()
        if (contributionData[dateStr]) {
          currentStreak++
          checkDate = new Date(checkDate.getTime() - 86400000)
        } else {
          break
        }
      }
    }

    // Calculate longest streak
    dates.forEach((dateStr) => {
      const date = new Date(dateStr)
      
      if (lastDate && date.getTime() - lastDate.getTime() === 86400000) {
        // Consecutive day
        tempStreak++
      } else {
        // Streak broken
        tempStreak = 1
      }
      
      longestStreak = Math.max(longestStreak, tempStreak)
      lastDate = date
    })

    return { currentStreak, longestStreak }
  }

  // Generate 52 weeks of data (GitHub style)
  const generateWeeksData = () => {
    const weeks: { date: Date; count: number }[][] = []
    const contributionData = getContributionData()
    const today = new Date()
    const oneYearAgo = new Date(today.getTime() - 365 * 86400000)

    // Start from Sunday of the week containing oneYearAgo
    const startDate = new Date(oneYearAgo)
    startDate.setDate(startDate.getDate() - startDate.getDay())

    let currentWeek: { date: Date; count: number }[] = []
    let currentDate = new Date(startDate)

    while (currentDate <= today) {
      const dateStr = currentDate.toDateString()
      const count = contributionData[dateStr] || 0
      
      currentWeek.push({ date: new Date(currentDate), count })
      
      if (currentDate.getDay() === 6) {
        // Saturday, end of week
        weeks.push(currentWeek)
        currentWeek = []
      }
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    if (currentWeek.length > 0) {
      weeks.push(currentWeek)
    }

    return weeks
  }

  const getContributionColor = (count: number) => {
    if (count === 0) return 'bg-surface-2'
    if (count === 1) return 'bg-success-soft'
    if (count <= 3) return 'bg-success'
    if (count <= 5) return 'bg-accent-active'
    return 'bg-accent-primary'
  }

  const { currentStreak, longestStreak } = calculateStreaks()
  const weeksData = generateWeeksData()
  const totalGames = matches.length

  if (loading) {
    return (
      <div className="bg-surface-1 rounded-xl shadow-elevated p-8 border border-border-subtle">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface-1 rounded-xl shadow-lifted p-10 border border-border-subtle">
      <div className="flex items-center justify-between mb-10">
        <h2 className="text-3xl font-bold flex items-center gap-3 text-text-primary">
          <Gamepad2 className="w-9 h-9 text-accent-primary" fill="currentColor" />
          Game Activity
        </h2>
        <button
          onClick={() => navigate('/history')}
          className="text-sm text-accent-primary hover:text-accent-hover font-medium px-4 py-2 rounded-lg bg-surface-2 hover:bg-surface-3 transition-colors border border-border-subtle"
        >
          View Details →
        </button>
      </div>

      {/* Contribution Stats */}
      <div className="grid grid-cols-3 gap-8 mb-10">
        <div className="bg-surface-2 rounded-xl p-6 text-center border-2 border-border-subtle hover:border-success transition-all shadow-soft hover:shadow-elevated">
          <div className="text-5xl font-bold text-success mb-2">{totalGames}</div>
          <div className="text-sm text-text-secondary font-medium">games in last year</div>
        </div>
        <div className="bg-surface-2 rounded-xl p-6 text-center border-2 border-border-subtle hover:border-warning transition-all shadow-soft hover:shadow-elevated">
          <div className="text-5xl font-bold text-warning flex items-center justify-center gap-3 mb-2">
            {currentStreak} <Flame className="w-10 h-10" fill="currentColor" />
          </div>
          <div className="text-sm text-text-secondary font-medium">day streak</div>
        </div>
        <div className="bg-surface-2 rounded-xl p-6 text-center border-2 border-border-subtle hover:border-accent-primary transition-all shadow-soft hover:shadow-elevated">
          <div className="text-5xl font-bold text-accent-primary flex items-center justify-center gap-3 mb-2">
            {longestStreak} <Trophy className="w-10 h-10" fill="currentColor" />
          </div>
          <div className="text-sm text-text-secondary font-medium">longest streak</div>
        </div>
      </div>

      {/* Contribution Graph */}
      {totalGames > 0 ? (
          <div className="w-full">
          <div className="flex items-start gap-2">
            {/* Day labels */}
            <div className="flex flex-col gap-[2px] text-xs text-text-muted pt-6 flex-shrink-0">
              <div style={{ height: '11px' }}></div>
              <div style={{ height: '11px', lineHeight: '11px' }}>Mon</div>
              <div style={{ height: '11px' }}></div>
              <div style={{ height: '11px', lineHeight: '11px' }}>Wed</div>
              <div style={{ height: '11px' }}></div>
              <div style={{ height: '11px', lineHeight: '11px' }}>Fri</div>
              <div style={{ height: '11px' }}></div>
            </div>

            {/* Weeks grid */}
            <div className="flex-1">
              {/* Month labels - dynamically positioned */}
              <div className="relative mb-2 text-xs text-text-muted h-6">
                {(() => {
                  const monthLabels: { label: string; position: number }[] = []
                  let lastMonth = -1
                  
                  weeksData.forEach((week, weekIndex) => {
                    if (week.length > 0) {
                      const firstDay = week[0]
                      const month = firstDay.date.getMonth()
                      
                      if (month !== lastMonth && weekIndex > 0) {
                        monthLabels.push({
                          label: firstDay.date.toLocaleDateString('en-US', { month: 'short' }),
                          position: (weekIndex / weeksData.length) * 100
                        })
                      }
                      lastMonth = month
                    }
                  })
                  
                  return monthLabels.map((label, idx) => (
                    <div
                      key={idx}
                      className="absolute"
                      style={{ left: `${label.position}%` }}
                    >
                      {label.label}
                    </div>
                  ))
                })()}
              </div>

              <div className="flex gap-[2px] w-full">
                {weeksData.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-[2px] flex-1">
                    {week.map((day, dayIndex) => (
                      <div
                        key={dayIndex}
                        className={`h-[11px] rounded-sm ${getContributionColor(day.count)} hover:ring-2 hover:ring-accent-primary transition-all cursor-pointer border border-border-subtle`}
                        title={`${day.date.toDateString()}: ${day.count} game${day.count !== 1 ? 's' : ''}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-2 mt-6 text-xs text-text-muted">
            <span>Less</span>
            <div className="w-[11px] h-[11px] bg-surface-2 rounded-sm border border-border-subtle"></div>
            <div className="w-[11px] h-[11px] bg-success-soft rounded-sm border border-border-subtle"></div>
            <div className="w-[11px] h-[11px] bg-success rounded-sm border border-border-subtle"></div>
            <div className="w-[11px] h-[11px] bg-accent-active rounded-sm border border-border-subtle"></div>
            <div className="w-[11px] h-[11px] bg-accent-primary rounded-sm border border-border-subtle"></div>
            <span>More</span>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <Gamepad2 className="w-24 h-24 mb-4 mx-auto text-text-muted" fill="currentColor" />
          <p className="text-text-secondary">No games played yet</p>
          <p className="text-sm text-text-muted mt-2">Start playing to build your streak!</p>
        </div>
      )}
    </div>
  )
}


