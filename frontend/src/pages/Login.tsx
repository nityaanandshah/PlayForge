import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { LoginRequest } from '../types'

export default function Login() {
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(formData)
      navigate('/dashboard')
    } catch (err: any) {
      console.error('Login error:', err)
      const errorMessage = err.response?.data?.error || err.message || 'Login failed. Please try again.'
      setError(errorMessage)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-main py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-surface-1 p-8 rounded-xl shadow-elevated border border-border-subtle">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-text-primary">
            Sign in to PlayForge
          </h2>
          <p className="mt-2 text-center text-sm text-text-secondary">
            Or{' '}
            <Link
              to="/signup"
              className="font-medium text-accent-primary hover:text-accent-hover"
            >
              create a new account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-danger-soft p-4 border border-danger">
              <div className="text-sm text-danger">{error}</div>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="appearance-none relative block w-full px-3 py-2 bg-surface-3 border border-border-subtle placeholder-text-disabled text-text-primary rounded-md focus:outline-none focus:border-accent-primary sm:text-sm transition-colors"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="appearance-none relative block w-full px-3 py-2 bg-surface-3 border border-border-subtle placeholder-text-disabled text-text-primary rounded-md focus:outline-none focus:border-accent-primary sm:text-sm transition-colors"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-bg-main bg-accent-primary hover:bg-accent-hover active:bg-accent-active focus:outline-none transition-all disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


