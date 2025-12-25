import { Connect4State, Connect4Move } from '../types/game'
import { useState } from 'react'

interface Connect4BoardProps {
  state: Connect4State
  currentUserId: string
  onMove: (move: Connect4Move) => void
  disabled?: boolean
}

export default function Connect4Board({ state, currentUserId, onMove, disabled }: Connect4BoardProps) {
  const [hoveredCol, setHoveredCol] = useState<number | null>(null)
  
  // Use dynamic grid size from state (defaults for backward compatibility)
  const ROWS = state.rows || 6
  const COLS = state.cols || 7
  
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
    if (value === 'R') return '#9E2F3B' // Game-specific red
    if (value === 'Y') return '#E1B84C' // Game-specific yellow
    return '#3A342D' // Empty slot (dark wood border color)
  }

  const getPieceShadow = (value: string) => {
    if (value === 'R') return 'shadow-md'
    if (value === 'Y') return 'shadow-md'
    return ''
  }

  const isColumnFull = (col: number) => {
    return state.board[0][col] !== ''
  }

  // Calculate cell size based on grid dimensions
  const getCellSize = () => {
    // Smaller cells for larger grids
    if (ROWS > 8 || COLS > 8) return 'w-12 h-12'
    if (ROWS > 6 || COLS > 7) return 'w-14 h-14'
    return 'w-16 h-16' // Default size
  }
  
  const cellSize = getCellSize()

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Game Board */}
      <div className="p-6 rounded-3xl shadow-elevated" style={{ backgroundColor: '#2B2621' }}>
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
          {Array.from({ length: COLS }).map((_, col) => (
            <div key={col} className="flex flex-col gap-3">
              {/* Column hover indicator */}
              <div
                className="h-3 rounded-full transition-all duration-200"
                style={{
                  backgroundColor: hoveredCol === col && isMyTurn && !disabled && !isColumnFull(col)
                    ? mySymbol === 'R' ? '#9E2F3B' : '#E1B84C'
                    : 'transparent'
                }}
              />
              
              {/* Column cells */}
              {Array.from({ length: ROWS }).map((_, row) => {
                const value = state.board[row][col]
                const lowestEmptyRow = getLowestEmptyRow(col)
                const isPreview = hoveredCol === col && row === lowestEmptyRow && isMyTurn && !disabled
                
                return (
                  <button
                    key={`${row}-${col}`}
                    className={`${cellSize} rounded-full transition-all duration-200 ${
                      value !== '' ? `${getPieceShadow(value)} animate-[scale-in_0.3s_ease-out]` : ''
                    } ${
                      isMyTurn && !disabled && !isColumnFull(col)
                        ? 'cursor-pointer'
                        : 'cursor-not-allowed'
                    }`}
                    style={{
                      backgroundColor: getPieceColor(value),
                      boxShadow: isPreview
                        ? mySymbol === 'R'
                          ? '0 0 0 3px rgba(158, 47, 59, 0.4)'
                          : '0 0 0 3px rgba(225, 184, 76, 0.4)'
                        : undefined
                    }}
                    onClick={() => handleColumnClick(col)}
                    onMouseEnter={() => setHoveredCol(col)}
                    onMouseLeave={() => setHoveredCol(null)}
                    disabled={disabled || !isMyTurn || isColumnFull(col)}
                  >
                    {/* Piece shine effect */}
                    {value !== '' && (
                      <div className="w-full h-full rounded-full opacity-20" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 100%)' }} />
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
          <div className="flex items-center gap-3 bg-warning-soft px-6 py-3 rounded-full border-2 shadow-md animate-pulse" style={{ borderColor: '#C8A14A' }}>
            <div className="w-3 h-3 rounded-full animate-ping" style={{ backgroundColor: '#C8A14A' }}></div>
            <p className="text-lg font-bold text-bg-main">
              Your Turn! ({mySymbol === 'R' ? 'Red' : 'Yellow'})
            </p>
          </div>
        )}
        {!isMyTurn && !disabled && (
          <div className="flex items-center gap-3 bg-surface-2 px-6 py-3 rounded-full border-2 border-border-subtle shadow-md">
            <div className="w-3 h-3 bg-text-muted rounded-full"></div>
            <p className="text-lg font-semibold text-text-secondary">Opponent's Turn...</p>
          </div>
        )}
      </div>

      {/* Instructions */}
      {isMyTurn && !disabled && (
        <div className="text-center text-sm text-text-secondary bg-surface-2 px-4 py-2 rounded-lg border border-border-subtle">
          💡 Click on any column to drop your piece
        </div>
      )}
    </div>
  )
}


