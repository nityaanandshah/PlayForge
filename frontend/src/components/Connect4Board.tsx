import { Connect4State, Connect4Move } from '../types/game'
import { useState } from 'react'

interface Connect4BoardProps {
  state: Connect4State
  currentUserId: string
  onMove: (move: Connect4Move) => void
  disabled?: boolean
}

const ROWS = 6
const COLS = 7

export default function Connect4Board({ state, currentUserId, onMove, disabled }: Connect4BoardProps) {
  const [hoveredCol, setHoveredCol] = useState<number | null>(null)
  const isMyTurn = state.current_player === currentUserId
  const mySymbol = state.player1_id === currentUserId ? 'R' : 'Y'

  const handleColumnClick = (col: number) => {
    if (disabled || !isMyTurn) {
      return
    }
    // Check if column is not full
    if (state.board[0][col] === '') {
      onMove({ column: col })
    }
  }

  const getLowestEmptyRow = (col: number): number | null => {
    for (let row = ROWS - 1; row >= 0; row--) {
      if (state.board[row][col] === '') {
        return row
      }
    }
    return null
  }

  const getPieceColor = (value: string) => {
    if (value === 'R') return 'bg-red-500'
    if (value === 'Y') return 'bg-yellow-400'
    return 'bg-white'
  }

  const getPieceShadow = (value: string) => {
    if (value === 'R') return 'shadow-red-300'
    if (value === 'Y') return 'shadow-yellow-300'
    return ''
  }

  const isColumnFull = (col: number) => {
    return state.board[0][col] !== ''
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Game Board */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-3xl shadow-2xl">
        <div className="grid grid-cols-7 gap-3">
          {Array.from({ length: COLS }).map((_, col) => (
            <div key={col} className="flex flex-col gap-3">
              {/* Column hover indicator */}
              <div
                className={`h-3 rounded-full transition-all duration-200 ${
                  hoveredCol === col && isMyTurn && !disabled && !isColumnFull(col)
                    ? mySymbol === 'R'
                      ? 'bg-red-400 shadow-lg shadow-red-300'
                      : 'bg-yellow-300 shadow-lg shadow-yellow-200'
                    : 'bg-transparent'
                }`}
              />
              
              {/* Column cells */}
              {Array.from({ length: ROWS }).map((_, row) => {
                const value = state.board[row][col]
                const lowestEmptyRow = getLowestEmptyRow(col)
                const isPreview = hoveredCol === col && row === lowestEmptyRow && isMyTurn && !disabled
                
                return (
                  <button
                    key={`${row}-${col}`}
                    className={`w-16 h-16 rounded-full transition-all duration-200 ${
                      value === ''
                        ? 'bg-white'
                        : `${getPieceColor(value)} shadow-lg ${getPieceShadow(value)} animate-[scale-in_0.3s_ease-out]`
                    } ${
                      isMyTurn && !disabled && !isColumnFull(col)
                        ? 'cursor-pointer'
                        : 'cursor-not-allowed'
                    } ${
                      isPreview
                        ? mySymbol === 'R'
                          ? 'ring-4 ring-red-400 ring-opacity-50'
                          : 'ring-4 ring-yellow-300 ring-opacity-50'
                        : ''
                    }`}
                    onClick={() => handleColumnClick(col)}
                    onMouseEnter={() => setHoveredCol(col)}
                    onMouseLeave={() => setHoveredCol(null)}
                    disabled={disabled || !isMyTurn || isColumnFull(col)}
                  >
                    {/* Piece shine effect */}
                    {value !== '' && (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-white/30 to-transparent" />
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
      
      {/* Turn Indicator */}
      <div className="text-center">
        {isMyTurn && !disabled && (
          <div className="flex items-center gap-3 bg-green-100 px-6 py-3 rounded-full border-2 border-green-400 shadow-md animate-pulse">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
            <p className="text-lg font-bold text-green-700">
              Your Turn! ({mySymbol === 'R' ? '🔴 Red' : '🟡 Yellow'})
            </p>
          </div>
        )}
        {!isMyTurn && !disabled && (
          <div className="flex items-center gap-3 bg-gray-100 px-6 py-3 rounded-full border-2 border-gray-300 shadow-md">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <p className="text-lg font-semibold text-gray-600">Opponent's Turn...</p>
          </div>
        )}
      </div>

      {/* Instructions */}
      {isMyTurn && !disabled && (
        <div className="text-center text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
          💡 Click on any column to drop your piece
        </div>
      )}
    </div>
  )
}


