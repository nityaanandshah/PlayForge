import { ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate, useLocation } from 'react-router-dom'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const navLinks = [
    { path: '/dashboard', label: '🏠 Home', icon: '🏠' },
    { path: '/leaderboard', label: '🏆 Leaderboard', icon: '🏆' },
    { path: '/statistics', label: '📊 Stats', icon: '📊' },
    { path: '/history', label: '📜 History', icon: '📜' },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 
                className="text-2xl font-bold text-primary-600 cursor-pointer" 
                onClick={() => navigate('/dashboard')}
              >
                PlayForge
              </h1>
              <div className="hidden md:flex space-x-1">
                {navLinks.map((link) => (
                  <button
                    key={link.path}
                    onClick={() => navigate(link.path)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive(link.path)
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {link.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="text-sm text-right">
                  <p className="font-medium text-gray-900">{user?.username}</p>
                  <p className="text-gray-500 text-xs">ELO: {user?.elo_rating}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-around py-2">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`flex flex-col items-center px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  isActive(link.path)
                    ? 'text-primary-700'
                    : 'text-gray-600'
                }`}
              >
                <span className="text-xl mb-1">{link.icon}</span>
                <span>{link.label.replace(/[🏠🏆📊📜]\s/, '')}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}


