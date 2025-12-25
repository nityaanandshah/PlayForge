import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { SignupRequest } from '../types'

interface ValidationErrors {
  username?: string
  email?: string
  password?: string
  confirmPassword?: string
}

export default function Signup() {
  const [formData, setFormData] = useState<SignupRequest>({
    username: '',
    email: '',
    password: '',
  })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [loading, setLoading] = useState(false)
  const { signup } = useAuth()
  const navigate = useNavigate()

  const validateUsername = (username: string): string | undefined => {
    if (!username) return undefined
    if (username.length < 3) return 'Username must be at least 3 characters'
    if (username.length > 20) return 'Username cannot exceed 20 characters'
    return undefined
  }

  const validateEmail = (email: string): string | undefined => {
    if (!email) return undefined
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return 'Please enter a valid email address'
    return undefined
  }

  const validatePassword = (password: string): string | undefined => {
    if (!password) return undefined
    if (password.length < 8) return 'Password must be at least 8 characters'
    if (!/[A-Za-z]/.test(password)) return 'Password must contain at least one letter'
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number'
    return undefined
  }

  const validateConfirmPassword = (confirm: string, password: string): string | undefined => {
    if (!confirm) return undefined
    if (confirm !== password) return 'Passwords do not match'
    return undefined
  }

  const handleUsernameChange = (value: string) => {
    setFormData({ ...formData, username: value })
    setValidationErrors({ ...validationErrors, username: validateUsername(value) })
  }

  const handleEmailChange = (value: string) => {
    setFormData({ ...formData, email: value })
    setValidationErrors({ ...validationErrors, email: validateEmail(value) })
  }

  const handlePasswordChange = (value: string) => {
    setFormData({ ...formData, password: value })
    setValidationErrors({ 
      ...validationErrors, 
      password: validatePassword(value),
      confirmPassword: confirmPassword ? validateConfirmPassword(confirmPassword, value) : undefined
    })
  }

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value)
    setValidationErrors({ 
      ...validationErrors, 
      confirmPassword: validateConfirmPassword(value, formData.password)
    })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate all fields
    const errors: ValidationErrors = {
      username: validateUsername(formData.username),
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
      confirmPassword: validateConfirmPassword(confirmPassword, formData.password),
    }

    setValidationErrors(errors)

    // Check if there are any validation errors
    if (Object.values(errors).some(err => err !== undefined)) {
      setError('Please fix all validation errors before submitting')
      return
    }

    setLoading(true)

    try {
      await signup(formData)
      navigate('/dashboard')
    } catch (err: any) {
      console.error('Signup error:', err)
      const errorMessage = err.response?.data?.error || err.message || 'Signup failed. Please try again.'
      setError(errorMessage)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-main py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-surface-1 p-8 rounded-xl shadow-elevated border border-border-subtle">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-text-primary">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-text-secondary">
            Or{' '}
            <Link
              to="/login"
              className="font-medium text-accent-primary hover:text-accent-hover"
            >
              sign in to existing account
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
              <label htmlFor="username" className="block text-sm font-medium text-text-primary mb-1">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                className={`appearance-none relative block w-full px-3 py-2 bg-surface-3 border ${
                  validationErrors.username ? 'border-danger' : 'border-border-subtle'
                } placeholder-text-disabled text-text-primary rounded-md focus:outline-none focus:border-accent-primary sm:text-sm transition-colors`}
                placeholder="Enter username (3-20 characters)"
              />
              {validationErrors.username && (
                <p className="mt-1 text-sm text-danger">{validationErrors.username}</p>
              )}
            </div>

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
                onChange={(e) => handleEmailChange(e.target.value)}
                className={`appearance-none relative block w-full px-3 py-2 bg-surface-3 border ${
                  validationErrors.email ? 'border-danger' : 'border-border-subtle'
                } placeholder-text-disabled text-text-primary rounded-md focus:outline-none focus:border-accent-primary sm:text-sm transition-colors`}
                placeholder="Enter your email"
              />
              {validationErrors.email && (
                <p className="mt-1 text-sm text-danger">{validationErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className={`appearance-none relative block w-full px-3 py-2 bg-surface-3 border ${
                  validationErrors.password ? 'border-danger' : 'border-border-subtle'
                } placeholder-text-disabled text-text-primary rounded-md focus:outline-none focus:border-accent-primary sm:text-sm transition-colors`}
                placeholder="Min 8 characters, letters & numbers"
              />
              {validationErrors.password && (
                <p className="mt-1 text-sm text-danger">{validationErrors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-text-primary mb-1">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                className={`appearance-none relative block w-full px-3 py-2 bg-surface-3 border ${
                  validationErrors.confirmPassword ? 'border-danger' : 'border-border-subtle'
                } placeholder-text-disabled text-text-primary rounded-md focus:outline-none focus:border-accent-primary sm:text-sm transition-colors`}
                placeholder="Re-enter your password"
              />
              {validationErrors.confirmPassword && (
                <p className="mt-1 text-sm text-danger">{validationErrors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-bg-main bg-accent-primary hover:bg-accent-hover active:bg-accent-active focus:outline-none transition-all disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


