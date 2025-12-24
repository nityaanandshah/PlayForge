import { useState, useEffect } from 'react'
import api from '../lib/api'
import Layout from '../components/Layout'
import { useAuth } from '../hooks/useAuth'
import { ScrollText, Gamepad2, X, Circle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface MatchHistoryEntry {
  id: string
  game_type: string
  player1_id: string
  player1_name: string
  player2_id: string
  player2_name: string
  winner_id: string | null
  status: string
  started_at: string
  ended_at: string | null
}

interface MatchHistoryResponse {
  game_type: string
  matches: MatchHistoryEntry[]
}

const MatchHistory = () => {
  const { user } = useAuth()
  const [selectedGame, setSelectedGame] = useState<string>('all')
  const [matches, setMatches] = useState<MatchHistoryEntry[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const matchesPerPage = 5

  const games = [
    { id: 'all', name: 'All Games', Icon: Gamepad2, iconColor: 'text-gray-600' },
    { id: 'tictactoe', name: 'Tic-Tac-Toe', Icon: X, iconColor: 'text-blue-500' },
    { id: 'connect4', name: 'Connect 4', Icon: Circle, iconColor: 'text-red-500' },
    { id: 'rps', name: 'Rock Paper Scissors', Icon: Gamepad2, iconColor: 'text-purple-500' },
    { id: 'dotsandboxes', name: 'Dots & Boxes', Icon: Circle, iconColor: 'text-indigo-500' },
  ]

  useEffect(() => {
    setCurrentPage(1) // Reset to first page when changing game type
    fetchMatchHistory()
  }, [selectedGame])

  const fetchMatchHistory = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get<MatchHistoryResponse>(
        `/stats/history?game_type=${selectedGame}&limit=50`
      )
      setMatches(response.data.matches || [])
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load match history')
    } finally {
      setLoading(false)
    }
  }

  const getMatchResult = (match: MatchHistoryEntry) => {
    if (!match.winner_id) {
      return { text: 'Draw', color: 'text-gray-600', bg: 'bg-gray-100' }
    }
    if (match.winner_id === user?.id) {
      return { text: 'Won', color: 'text-green-600', bg: 'bg-green-100' }
    }
    return { text: 'Lost', color: 'text-red-600', bg: 'bg-red-100' }
  }

  const getOpponentName = (match: MatchHistoryEntry) => {
    return match.player1_id === user?.id ? match.player2_name : match.player1_name
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    }
    return date.toLocaleDateString()
  }

  // Pagination calculations
  const totalPages = Math.ceil(matches.length / matchesPerPage)
  const startIndex = (currentPage - 1) * matchesPerPage
  const endIndex = startIndex + matchesPerPage
  const currentMatches = matches.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <ScrollText className="w-8 h-8" fill="currentColor" />
            Match History
          </h1>
          
          {/* Game Type Selector */}
          <div className="flex flex-wrap gap-2 mb-6">
            {games.map((game) => {
              const IconComponent = game.Icon
              return (
                <button
                  key={game.id}
                  onClick={() => setSelectedGame(game.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    selectedGame === game.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <IconComponent 
                    className={`w-5 h-5 ${selectedGame === game.id ? '' : game.iconColor}`} 
                    fill="currentColor" 
                  />
                  {game.name}
                </button>
              )
            })}
          </div>

          {/* Loading/Error States */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading match history...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Match History List */}
          {!loading && !error && (
            <>
              {matches.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">No match history found.</p>
                  <p className="text-sm mt-2">Play some games to see your match history here!</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {currentMatches.map((match) => {
                      const result = getMatchResult(match)
                      const opponent = getOpponentName(match)
                      
                      return (
                        <div
                          key={match.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                {(() => {
                                  const game = games.find(g => g.id === match.game_type)
                                  const IconComponent = game?.Icon || Gamepad2
                                  const iconColor = game?.iconColor || 'text-gray-600'
                                  return <IconComponent className={`w-6 h-6 ${iconColor}`} fill="currentColor" />
                                })()}
                                <div>
                                  <h3 className="font-semibold text-gray-900">
                                    {games.find(g => g.id === match.game_type)?.name || match.game_type}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    vs {opponent}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className={`${result.bg} ${result.color} px-3 py-1 rounded-full font-bold text-sm mb-1`}>
                                  {result.text}
                                </div>
                                <p className="text-xs text-gray-500">
                                  {formatDate(match.started_at)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        Showing {startIndex + 1}-{Math.min(endIndex, matches.length)} of {matches.length} matches
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* First Page */}
                        <button
                          onClick={() => goToPage(1)}
                          disabled={currentPage === 1}
                          className={`p-2 rounded-lg transition ${
                            currentPage === 1
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                          title="First Page"
                        >
                          <ChevronsLeft className="w-5 h-5" />
                        </button>

                        {/* Previous Page */}
                        <button
                          onClick={() => goToPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`p-2 rounded-lg transition ${
                            currentPage === 1
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                          title="Previous Page"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>

                        {/* Page Numbers */}
                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                            // Show first page, last page, current page, and pages around current
                            if (
                              page === 1 ||
                              page === totalPages ||
                              (page >= currentPage - 1 && page <= currentPage + 1)
                            ) {
                              return (
                                <button
                                  key={page}
                                  onClick={() => goToPage(page)}
                                  className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                                    currentPage === page
                                      ? 'bg-blue-600 text-white'
                                      : 'text-gray-700 hover:bg-gray-100'
                                  }`}
                                >
                                  {page}
                                </button>
                              )
                            } else if (
                              page === currentPage - 2 ||
                              page === currentPage + 2
                            ) {
                              return (
                                <span key={page} className="px-2 text-gray-400">
                                  ...
                                </span>
                              )
                            }
                            return null
                          })}
                        </div>

                        {/* Next Page */}
                        <button
                          onClick={() => goToPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={`p-2 rounded-lg transition ${
                            currentPage === totalPages
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                          title="Next Page"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>

                        {/* Last Page */}
                        <button
                          onClick={() => goToPage(totalPages)}
                          disabled={currentPage === totalPages}
                          className={`p-2 rounded-lg transition ${
                            currentPage === totalPages
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                          title="Last Page"
                        >
                          <ChevronsRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default MatchHistory

