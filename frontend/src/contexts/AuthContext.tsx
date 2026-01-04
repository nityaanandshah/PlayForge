import { createContext, useState, useEffect, ReactNode } from 'react'
import { authApi } from '../lib/api'
import type { User, LoginRequest, SignupRequest } from '../types'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (data: LoginRequest) => Promise<void>
  signup: (data: SignupRequest) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('user')
    const accessToken = localStorage.getItem('access_token')

    if (storedUser && accessToken) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Failed to parse stored user:', error)
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (data: LoginRequest) => {
    const response = await authApi.login(data)
    setUser(response.user)
    localStorage.setItem('user', JSON.stringify(response.user))
    localStorage.setItem('access_token', response.access_token)
    localStorage.setItem('refresh_token', response.refresh_token)
  }

  const signup = async (data: SignupRequest) => {
    const response = await authApi.signup(data)
    setUser(response.user)
    localStorage.setItem('user', JSON.stringify(response.user))
    localStorage.setItem('access_token', response.access_token)
    localStorage.setItem('refresh_token', response.refresh_token)
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      localStorage.removeItem('user')
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    }
  }

  const refreshUser = async () => {
    try {
      const response = await authApi.getMe()
      setUser(response.user)
      localStorage.setItem('user', JSON.stringify(response.user))
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}


