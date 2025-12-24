import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { statsApi, PlayerStats } from '../lib/api'
import api from '../lib/api'

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
    if (elo >= 2000) return { name: 'Grandmaster', color: 'from-yellow-400 to-yellow-600', emoji: '👑' }
    if (elo >= 1800) return { name: 'Master', color: 'from-purple-400 to-purple-600', emoji: '💎' }
    if (elo >= 1600) return { name: 'Expert', color: 'from-blue-400 to-blue-600', emoji: '⭐' }
    if (elo >= 1400) return { name: 'Advanced', color: 'from-green-400 to-green-600', emoji: '🎯' }
    return { name: 'Intermediate', color: 'from-gray-400 to-gray-600', emoji: '🎮' }
  }

  const getAchievements = () => {
    if (!stats) return []
    const achievements = []
    
    if (stats.wins >= 1) achievements.push({ name: 'First Victory', emoji: '🎉', unlocked: true })
    if (stats.wins >= 10) achievements.push({ name: '10 Wins', emoji: '🏆', unlocked: true })
    if (stats.wins >= 50) achievements.push({ name: '50 Wins', emoji: '💪', unlocked: true })
    if (stats.wins >= 100) achievements.push({ name: 'Century', emoji: '💯', unlocked: true })
    
    if (stats.total_games >= 10) achievements.push({ name: 'Veteran', emoji: '🎖️', unlocked: true })
    if (stats.total_games >= 100) achievements.push({ name: 'Dedicated', emoji: '🔥', unlocked: true })
    
    if (stats.current_win_streak >= 5) achievements.push({ name: 'Hot Streak', emoji: '🔥', unlocked: true })
    if (stats.current_win_streak >= 10) achievements.push({ name: 'Unstoppable', emoji: '⚡', unlocked: true })
    
    return achievements
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">Loading profile...</div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-red-800 mb-2">Error</h2>
        <p className="text-red-600">{error || 'Profile not found'}</p>
      </div>
    )
  }

  const rank = getRankBadge(profile.elo_rating)
  const achievements = getAchievements()
  const winRate = stats ? ((stats.wins / stats.total_games) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl">
              {rank.emoji}
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">{profile.username}</h1>
              <div className={`inline-block px-4 py-2 bg-gradient-to-r ${rank.color} rounded-full text-white font-bold`}>
                {rank.name}
              </div>
            </div>
          </div>
          {isOwnProfile && (
            <button
              onClick={() => navigate('/settings')}
              className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              ⚙️ Settings
            </button>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-indigo-600 mb-2">{profile.elo_rating}</div>
          <div className="text-sm text-gray-600">ELO Rating</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">{stats?.wins || 0}</div>
          <div className="text-sm text-gray-600">Wins</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">{winRate}%</div>
          <div className="text-sm text-gray-600">Win Rate</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-orange-600 mb-2">{stats?.total_games || 0}</div>
          <div className="text-sm text-gray-600">Total Games</div>
        </div>
      </div>

      {/* Performance Details */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-bold text-lg mb-3">Overall Record</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Wins:</span>
                <span className="font-bold text-green-600">{stats?.wins || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Losses:</span>
                <span className="font-bold text-red-600">{stats?.losses || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Draws:</span>
                <span className="font-bold text-gray-600">{stats?.draws || 0}</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-3">Streaks</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Current Streak:</span>
                <span className="font-bold">{stats?.current_win_streak || 0} {stats && stats.current_win_streak > 0 ? '🔥' : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Best Streak:</span>
                <span className="font-bold">{stats?.best_win_streak || 0} ⚡</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">🏆 Achievements ({achievements.length})</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.name}
                className={`border-2 rounded-lg p-4 text-center transition ${
                  achievement.unlocked
                    ? 'border-yellow-400 bg-yellow-50'
                    : 'border-gray-300 bg-gray-100 opacity-50'
                }`}
              >
                <div className="text-3xl mb-2">{achievement.emoji}</div>
                <div className="text-sm font-bold">{achievement.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity Placeholder */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
        <p className="text-gray-600 text-center py-8">
          View your recent matches in the <button onClick={() => navigate('/history')} className="text-indigo-600 hover:underline font-bold">Match History</button> page
        </p>
      </div>
    </div>
  )
}


