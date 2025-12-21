import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Game from './pages/Game'
import Matchmaking from './pages/Matchmaking'
import CreateRoom from './pages/CreateRoom'
import RoomLobby from './pages/RoomLobby'
import Layout from './components/Layout'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return user ? <>{children}</> : <Navigate to="/login" />
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return !user ? <>{children}</> : <Navigate to="/dashboard" />
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/game/:id"
            element={
              <PrivateRoute>
                <Layout>
                  <Game />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/matchmaking"
            element={
              <PrivateRoute>
                <Layout>
                  <Matchmaking />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/rooms"
            element={
              <PrivateRoute>
                <Layout>
                  <CreateRoom />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/room/:roomId"
            element={
              <PrivateRoute>
                <Layout>
                  <RoomLobby />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App


