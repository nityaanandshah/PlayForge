import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../lib/api'
import { WebSocketClient, WebSocketMessage } from '../lib/websocket'
import TicTacToeBoard from '../components/TicTacToeBoard'
import { Game as GameType, TicTacToeState, TicTacToeMove } from '../types/game'

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

  const handleMove = (move: TicTacToeMove) => {
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
  const playerSymbol = isPlayer1 ? 'X' : 'O'

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-2">Tic-Tac-Toe</h1>
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div>
              <span className="font-semibold">You:</span> {user?.username} ({playerSymbol})
            </div>
            <div>
              <span className="font-semibold">Opponent:</span> {opponent || 'Waiting...'}
            </div>
          </div>
        </div>

        {/* Connection Status */}
        {!wsConnected && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
            Connecting to game server...
          </div>
        )}

        {/* Game Status */}
        {game.status === 'waiting' && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md text-center">
            <p className="text-lg font-semibold text-blue-900">Waiting for opponent to join...</p>
            <p className="text-sm text-blue-700 mt-2">Share this game ID: {game.id}</p>
          </div>
        )}

        {game.status === 'completed' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md text-center">
            {game.winner_id === user?.id && (
              <p className="text-2xl font-bold text-green-900">You Won! 🎉</p>
            )}
            {game.winner_id && game.winner_id !== user?.id && (
              <p className="text-2xl font-bold text-red-900">You Lost 😞</p>
            )}
            {!game.winner_id && (
              <p className="text-2xl font-bold text-gray-900">It's a Draw! 🤝</p>
            )}
          </div>
        )}

        {/* Game Board */}
        {game.status === 'active' && game.state && (
          <div className="flex justify-center">
            <TicTacToeBoard
              state={game.state as TicTacToeState}
              currentUserId={user!.id}
              onMove={handleMove}
              disabled={!wsConnected}
            />
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Back to Dashboard
          </button>
          {game.status === 'completed' && (
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Play Again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

