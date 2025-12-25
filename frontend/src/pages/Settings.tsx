import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../lib/api'

export default function Settings() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // Profile form
  const [username, setUsername] = useState(user?.username || '')

  // Password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await api.put('/profile', { username })
      await refreshUser()
      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      setLoading(false)
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    try {
      await api.post('/profile/password', {
        current_password: currentPassword,
        new_password: newPassword,
      })
      setSuccess('Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-surface-1 shadow-elevated rounded-lg p-6 border border-border-subtle">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
          <button
            onClick={() => navigate('/profile')}
            className="text-accent-primary hover:text-accent-hover font-medium"
          >
            ← Back to Profile
          </button>
        </div>

        {success && (
          <div className="mb-4 p-3 bg-success-soft border border-success rounded-md text-success">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-danger-soft border border-danger rounded-md text-danger">
            {error}
          </div>
        )}

        {/* Profile Settings */}
        <div className="border-b border-border-subtle pb-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-text-primary">Profile Information</h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-border-subtle rounded-lg bg-surface-3 text-text-primary focus:ring-2 focus:ring-accent-primary focus:border-accent-primary"
                required
                minLength={3}
                maxLength={20}
              />
              <p className="text-xs text-text-muted mt-1">
                3-20 characters. This will be visible to other players.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2 border border-border-subtle rounded-lg bg-surface-2 text-text-muted cursor-not-allowed"
              />
              <p className="text-xs text-text-muted mt-1">
                Email cannot be changed.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                ELO Rating
              </label>
              <input
                type="text"
                value={user?.elo_rating || 1200}
                disabled
                className="w-full px-4 py-2 border border-border-subtle rounded-lg bg-surface-2 text-text-muted cursor-not-allowed"
              />
              <p className="text-xs text-text-muted mt-1">
                Your rating is determined by your game performance.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || username === user?.username}
              className="bg-accent-primary text-bg-main px-6 py-2 rounded-lg hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </div>

        {/* Password Settings */}
        <div>
          <h2 className="text-xl font-bold mb-4 text-text-primary">Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 border border-border-subtle rounded-lg bg-surface-3 text-text-primary focus:ring-2 focus:ring-accent-primary focus:border-accent-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-border-subtle rounded-lg bg-surface-3 text-text-primary focus:ring-2 focus:ring-accent-primary focus:border-accent-primary"
                required
                minLength={8}
              />
              <p className="text-xs text-text-muted mt-1">
                At least 8 characters.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-border-subtle rounded-lg bg-surface-3 text-text-primary focus:ring-2 focus:ring-accent-primary focus:border-accent-primary"
                required
                minLength={8}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-danger text-text-primary px-6 py-2 rounded-lg hover:bg-danger-soft disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>

      {/* Account Information */}
      <div className="bg-surface-1 shadow-elevated rounded-lg p-6 border border-border-subtle">
        <h2 className="text-xl font-bold mb-4 text-text-primary">Account Information</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">Member Since:</span>
            <span className="font-medium text-text-primary">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Account ID:</span>
            <span className="font-mono text-xs text-text-muted">{user?.id}</span>
          </div>
        </div>
      </div>
    </div>
  )
}



