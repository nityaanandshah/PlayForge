import { ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Trophy, Crown, BarChart3, ScrollText, User, Zap } from 'lucide-react'

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
    <div className="min-h-screen bg-bg-main">
      <nav className="bg-surface-1 shadow-elevated sticky top-0 z-50 border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex justify-between h-20">
            <div className="flex items-center space-x-12">
              <div 
                className="flex flex-col items-center cursor-pointer group"
                onClick={() => navigate('/dashboard')}
              >
                <div className="relative flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-accent-primary opacity-80 group-hover:opacity-100 transition-opacity" fill="currentColor" />
                  <h1 
                    className="text-xl font-bold tracking-wider group-hover:tracking-widest transition-all"
                    style={{
                      background: 'linear-gradient(180deg, #D6A35C 0%, #C08A3E 50%, #A9742E 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      textShadow: '0px 2px 4px rgba(0, 0, 0, 0.5)',
                      filter: 'drop-shadow(0px 1px 2px rgba(192, 138, 62, 0.4))',
                      fontFamily: 'serif',
                      letterSpacing: '0.05em'
                    }}
                  >
                    PLAYFORGE
                  </h1>
                </div>
                <div className="w-full flex items-center justify-center mt-0.5 gap-1.5">
                  <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-accent-primary to-accent-primary rounded-full"></div>
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-accent-hover to-accent-active shadow-soft border border-accent-primary"></div>
                  <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent via-accent-primary to-accent-primary rounded-full"></div>
                </div>
              </div>
              <div className="hidden md:flex space-x-2">
                {navLinks.map((link) => {
                  const IconComponent = link.icon
                  return (
                    <button
                      key={link.path}
                      onClick={() => navigate(link.path)}
                      className={`px-5 py-3 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                        isActive(link.path)
                          ? 'bg-accent-soft text-accent-primary border-b-2 border-accent-primary'
                          : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
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
                className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-surface-2 transition-all border border-border-subtle"
              >
                <div className="text-sm text-right">
                  <p className="font-semibold text-text-primary">{user?.username}</p>
                  <p className="text-text-muted text-xs">ELO: {user?.elo_rating}</p>
                </div>
                <User className="w-5 h-5 text-accent-primary" fill="currentColor" />
              </button>
              <button
                onClick={handleLogout}
                className="px-6 py-3 text-sm font-semibold text-bg-main bg-accent-primary rounded-lg hover:bg-accent-hover active:bg-accent-active transition-all shadow-soft"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-surface-1 shadow-soft border-b border-border-subtle">
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
                      ? 'text-accent-primary bg-accent-soft'
                      : 'text-text-secondary'
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


