import { ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Trophy, Crown, BarChart3, ScrollText, User } from 'lucide-react'

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
    { path: '/dashboard', label: 'Home', icon: Home },
    { path: '/tournaments', label: 'Tournaments', icon: Trophy },
    { path: '/leaderboard', label: 'Leaderboard', icon: Crown },
    { path: '/statistics', label: 'Stats', icon: BarChart3 },
    { path: '/history', label: 'History', icon: ScrollText },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-elevated sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex justify-between h-20">
            <div className="flex items-center space-x-12">
              <h1 
                className="text-3xl font-bold text-primary-600 cursor-pointer" 
                onClick={() => navigate('/dashboard')}
              >
                PlayForge
              </h1>
              <div className="hidden md:flex space-x-2">
                {navLinks.map((link) => {
                  const IconComponent = link.icon
                  return (
                    <button
                      key={link.path}
                      onClick={() => navigate(link.path)}
                      className={`px-5 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                        isActive(link.path)
                          ? 'bg-primary-50 text-primary-700 shadow-soft'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-soft'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" fill="currentColor" />
                      {link.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex items-center space-x-4 ml-auto">
              <button
                onClick={() => navigate(`/profile/${user?.username}`)}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-all hover:shadow-soft"
              >
                <div className="text-sm text-right">
                  <p className="font-semibold text-gray-900">{user?.username}</p>
                  <p className="text-gray-500 text-xs">ELO: {user?.elo_rating}</p>
                </div>
                <User className="w-5 h-5" fill="currentColor" />
              </button>
              <button
                onClick={handleLogout}
                className="px-6 py-3 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-all shadow-soft hover:shadow-elevated"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-white shadow-soft">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-around py-3">
            {navLinks.map((link) => {
              const IconComponent = link.icon
              return (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className={`flex flex-col items-center px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive(link.path)
                      ? 'text-primary-700 bg-primary-50'
                      : 'text-gray-600'
                  }`}
                >
                  <IconComponent className="w-6 h-6 mb-1" fill="currentColor" />
                  <span>{link.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
        {children}
      </main>
    </div>
  )
}


