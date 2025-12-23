import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../lib/api'
import { WebSocketClient, WebSocketMessage } from '../lib/websocket'
import TicTacToeBoard from '../components/TicTacToeBoard'
import Connect4Board from '../components/Connect4Board'
import RPSBoard from '../components/RPSBoard'
import DotsAndBoxesBoard from '../components/DotsAndBoxesBoard'
import { Game as GameType, TicTacToeState, TicTacToeMove, Connect4State, Connect4Move, RPSState, RPSMove, DotsAndBoxesState, DotsAndBoxesMove } from '../types/game'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws'

export default function Game() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [game, setGame] = useState<GameType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [wsConnected, setWsConnected] = useState(false)
  
  const wsClient = useRef<WebSocketClient | null>(null)

  useEffect(() => {
    if (!id || !user) return

    // Load game
    loadGame()

    // Connect to WebSocket
    connectWebSocket()

    return () => {
      if (wsClient.current) {
        wsClient.current.disconnect()
      }
    }
  }, [id, user])

  const loadGame = async () => {
    try {
      const response = await api.get<GameType>(`/games/${id}`)
      const gameData = response.data
      
      // If game is waiting and current user is not player1, auto-join
      if (gameData.status === 'waiting' && gameData.player1_id !== user?.id) {
        console.log('Auto-joining game as player 2...')
        try {
          const joinResponse = await api.post(`/games/join`, { game_id: id })
          setGame(joinResponse.data)
        } catch (joinErr: any) {
          console.error('Failed to join game:', joinErr)
          setGame(gameData) // Still show the game even if join fails
        }
      } else {
        setGame(gameData)
      }
      
      setLoading(false)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load game')
      setLoading(false)
    }
  }

  const connectWebSocket = async () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setError('No access token found')
      return
    }

    try {
      const client = new WebSocketClient(WS_URL, token)
      await client.connect()
      
      client.onMessage(handleWebSocketMessage)
      wsClient.current = client
      setWsConnected(true)

      // Join the game room to receive game events
      if (id) {
        const joinMessage: WebSocketMessage = {
          type: 'join_game',
          payload: {
            game_id: id,
          },
          timestamp: new Date().toISOString(),
        }
        client.send(joinMessage)
        console.log('Sent join_game message for game:', id)
      }
    } catch (err) {
      console.error('WebSocket connection failed:', err)
      setError('Failed to connect to game server')
    }
  }

  const handleWebSocketMessage = (message: WebSocketMessage) => {
    console.log('Received WebSocket message:', message.type, message.payload)

    switch (message.type) {
      case 'connected':
        console.log('WebSocket connected:', message.payload)
        break

      case 'game_joined':
        console.log('Joined game room:', message.payload)
        break

      case 'game_state':
        if (message.payload) {
          console.log('Updating game state from WebSocket:', message.payload)
          setGame((prevGame) => ({
            ...prevGame!,
            ...message.payload,
            state: message.payload.state,
          }))
        }
        break

      case 'game_over':
        if (message.payload) {
          setGame((prevGame) => ({
            ...prevGame!,
            status: 'completed',
            winner_id: message.payload.winner_id,
          }))
        }
        break

      case 'error':
        console.error('WebSocket error:', message.payload)
        setError(message.payload?.message || 'An error occurred')
        break

      default:
        console.log('Unhandled message type:', message.type)
    }
  }

  const handleMove = (move: TicTacToeMove | Connect4Move | RPSMove | DotsAndBoxesMove) => {
    if (!wsClient.current || !game || !user) return

    const message: WebSocketMessage = {
      type: 'game_move',
      payload: {
        game_id: game.id,
        player_id: user.id,
        move,
      },
      timestamp: new Date().toISOString(),
    }

    wsClient.current.send(message)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading game...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-xl text-red-600 mb-4">{error}</div>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  if (!game) {
    return <div>Game not found</div>
  }

  const isPlayer1 = game.player1_id === user?.id
  const isPlayer2 = game.player2_id === user?.id
  const opponent = isPlayer1 ? game.player2_name : game.player1_name
  
  // Get player symbols based on game type
  const getPlayerSymbols = () => {
    if (game.type === 'tictactoe') {
      return { player1: 'X', player2: 'O' }
    } else if (game.type === 'connect4') {
      return { player1: '🔴 Red', player2: '🟡 Yellow' }
    }
    return { player1: 'P1', player2: 'P2' }
  }
  
  const playerSymbols = getPlayerSymbols()
  const playerSymbol = isPlayer1 ? playerSymbols.player1 : playerSymbols.player2
  
  // Get game title
  const getGameTitle = () => {
    if (game.type === 'tictactoe') return 'Tic-Tac-Toe'
    if (game.type === 'connect4') return 'Connect-4'
    if (game.type === 'rps') return 'Rock Paper Scissors'
    if (game.type === 'dotsandboxes') return 'Dots & Boxes'
    return 'Game'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            {getGameTitle()}
          </h1>
          
          {/* Players Info */}
          <div className="flex justify-center items-center gap-8 mt-6">
            {/* Player 1 */}
            <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl shadow-lg ${isPlayer1 ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600">
                {isPlayer1 ? user?.username.charAt(0).toUpperCase() : game.player1_name?.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <div className="font-bold">{isPlayer1 ? user?.username : game.player1_name}</div>
                <div className="text-sm opacity-80">{playerSymbols.player1}</div>
              </div>
              {isPlayer1 && <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded-full">You</span>}
            </div>
            
            {/* VS */}
            <div className="text-3xl font-bold text-gray-400">VS</div>
            
            {/* Player 2 */}
            <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl shadow-lg ${isPlayer2 ? 'bg-red-500 text-white' : 'bg-white text-gray-700'}`}>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-2xl font-bold text-red-600">
                {isPlayer2 ? user?.username.charAt(0).toUpperCase() : game.player2_name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="text-left">
                <div className="font-bold">{isPlayer2 ? user?.username : game.player2_name || 'Waiting...'}</div>
                <div className="text-sm opacity-80">{playerSymbols.player2}</div>
              </div>
              {isPlayer2 && <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded-full">You</span>}
            </div>
          </div>
        </div>

        {/* Connection Status */}
        {!wsConnected && (
          <div className="mb-6 p-4 bg-yellow-100 border-2 border-yellow-300 rounded-xl text-center animate-pulse">
            <p className="text-yellow-800 font-semibold">🔄 Connecting to game server...</p>
          </div>
        )}

        {/* Game Status Messages */}
        {game.status === 'waiting' && (
          <div className="mb-8 p-6 bg-blue-100 border-2 border-blue-300 rounded-2xl text-center shadow-lg">
            <p className="text-2xl font-bold text-blue-900 mb-2">⏳ Waiting for opponent...</p>
            <p className="text-sm text-blue-700">Share the game link with a friend to start playing!</p>
          </div>
        )}

        {/* Victory/Defeat Banner - Only for Participants */}
        {game.status === 'completed' && (user!.id === game.player1_id || user!.id === game.player2_id) && (
          <div className={`mb-6 p-6 rounded-2xl text-center shadow-2xl border-4 ${
            game.winner_id === user?.id 
              ? 'bg-gradient-to-r from-green-400 to-emerald-500 border-green-300' 
              : game.winner_id 
              ? 'bg-gradient-to-r from-red-400 to-rose-500 border-red-300'
              : 'bg-gradient-to-r from-gray-400 to-slate-500 border-gray-300'
          }`}>
            {game.winner_id === user?.id && (
              <div className="text-white">
                <p className="text-5xl font-extrabold mb-2">🎉 VICTORY! 🎉</p>
                <p className="text-xl">You won the game!</p>
              </div>
            )}
            {game.winner_id && game.winner_id !== user?.id && (
              <div className="text-white">
                <p className="text-5xl font-extrabold mb-2">😞 DEFEAT</p>
                <p className="text-xl">Better luck next time!</p>
              </div>
            )}
            {!game.winner_id && (
              <div className="text-white">
                <p className="text-5xl font-extrabold mb-2">🤝 DRAW</p>
                <p className="text-xl">Well played by both!</p>
              </div>
            )}
          </div>
        )}

        {/* Game Result Banner - For Spectators */}
        {game.status === 'completed' && (user!.id !== game.player1_id && user!.id !== game.player2_id) && (
          <div className="mb-6 p-6 rounded-2xl text-center shadow-2xl border-4 bg-gradient-to-r from-purple-400 to-indigo-500 border-purple-300">
            <div className="text-white">
              <p className="text-4xl font-extrabold mb-2">🏁 Game Completed</p>
              {game.winner_id === game.player1_id && (
                <p className="text-xl">Winner: {game.player1_name} 🏆</p>
              )}
              {game.winner_id === game.player2_id && (
                <p className="text-xl">Winner: {game.player2_name} 🏆</p>
              )}
              {!game.winner_id && (
                <p className="text-xl">Result: Draw 🤝</p>
              )}
            </div>
          </div>
        )}

        {/* Spectator Notice */}
        {(user!.id !== game.player1_id && user!.id !== game.player2_id) && (
          <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg text-center">
            <p className="text-lg font-semibold text-blue-800">👁️ Spectator Mode</p>
            <p className="text-sm text-blue-600">You are watching this game. Only participants can make moves.</p>
          </div>
        )}

        {/* Game Board */}
        {(game.status === 'active' || game.status === 'completed') && game.state && (
          <div className="flex justify-center mb-8">
            {game.type === 'tictactoe' && (
              <TicTacToeBoard
                state={game.state as TicTacToeState}
                currentUserId={user!.id}
                onMove={handleMove}
                disabled={!wsConnected || game.status === 'completed' || (user!.id !== game.player1_id && user!.id !== game.player2_id)}
              />
            )}
            {game.type === 'connect4' && (
              <Connect4Board
                state={game.state as Connect4State}
                currentUserId={user!.id}
                onMove={handleMove}
                disabled={!wsConnected || game.status === 'completed' || (user!.id !== game.player1_id && user!.id !== game.player2_id)}
              />
            )}
            {game.type === 'rps' && (
              <RPSBoard
                state={game.state as RPSState}
                currentUserId={user!.id}
                onMove={handleMove}
                disabled={!wsConnected || game.status === 'completed' || (user!.id !== game.player1_id && user!.id !== game.player2_id)}
              />
            )}
            {game.type === 'dotsandboxes' && (
              <DotsAndBoxesBoard
                state={game.state as DotsAndBoxesState}
                currentUserId={user!.id}
                onMove={handleMove}
                disabled={!wsConnected || game.status === 'completed' || (user!.id !== game.player1_id && user!.id !== game.player2_id)}
              />
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-center gap-4">
          {/* Show "Back to Tournament" for tournament games, otherwise "Back to Dashboard" */}
          {game.tournament_id ? (
            <button
              onClick={() => navigate(`/tournament/${game.tournament_id}`)}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              ← Back to Tournament
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-8 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                ← Back to Dashboard
              </button>
              {game.status === 'completed' && (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                >
                  🎮 Play Again
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

