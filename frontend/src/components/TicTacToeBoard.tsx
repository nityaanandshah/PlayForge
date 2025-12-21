import { TicTacToeState, TicTacToeMove } from '../types/game'

interface TicTacToeBoardProps {
  state: TicTacToeState
  currentUserId: string
  onMove: (move: TicTacToeMove) => void
  disabled?: boolean
}

export default function TicTacToeBoard({ state, currentUserId, onMove, disabled }: TicTacToeBoardProps) {
  const isMyTurn = state.current_player === currentUserId

  const handleCellClick = (row: number, col: number) => {
    if (disabled || !isMyTurn || state.board[row][col] !== '') {
      return
    }
    onMove({ row, col })
  }

  const getCellContent = (value: string) => {
    if (value === 'X') {
      return (
        <div className="relative w-full h-full flex items-center justify-center animate-[scale-in_0.3s_ease-out]">
          <svg viewBox="0 0 100 100" className="w-16 h-16">
            <line x1="20" y1="20" x2="80" y2="80" stroke="#3B82F6" strokeWidth="8" strokeLinecap="round" />
            <line x1="80" y1="20" x2="20" y2="80" stroke="#3B82F6" strokeWidth="8" strokeLinecap="round" />
          </svg>
        </div>
      )
    }
    if (value === 'O') {
      return (
        <div className="relative w-full h-full flex items-center justify-center animate-[scale-in_0.3s_ease-out]">
          <svg viewBox="0 0 100 100" className="w-16 h-16">
            <circle cx="50" cy="50" r="30" stroke="#EF4444" strokeWidth="8" fill="none" />
          </svg>
        </div>
      )
    }
    return null
  }

  const getCellClass = (row: number, col: number) => {
    const value = state.board[row][col]
    
    let baseClass = 'w-28 h-28 bg-white border-4 border-gray-300 flex items-center justify-center transition-all duration-200 rounded-xl shadow-md'
    
    if (value === '') {
      if (isMyTurn && !disabled) {
        baseClass += ' hover:bg-blue-50 hover:border-blue-400 hover:shadow-lg cursor-pointer hover:scale-105'
      } else {
        baseClass += ' cursor-not-allowed opacity-50'
      }
    } else if (value === 'X') {
      baseClass += ' bg-blue-50 border-blue-300'
    } else {
      baseClass += ' bg-red-50 border-red-300'
    }
    
    return baseClass
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Game Board */}
      <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-4 rounded-2xl shadow-2xl">
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((row) => (
            [0, 1, 2].map((col) => (
              <button
                key={`${row}-${col}`}
                className={getCellClass(row, col)}
                onClick={() => handleCellClick(row, col)}
                disabled={disabled || !isMyTurn || state.board[row][col] !== ''}
              >
                {getCellContent(state.board[row][col])}
              </button>
            ))
          ))}
        </div>
      </div>
      
      {/* Turn Indicator */}
      <div className="text-center">
        {isMyTurn && !disabled && (
          <div className="flex items-center gap-2 bg-green-100 px-6 py-3 rounded-full border-2 border-green-400 shadow-md animate-pulse">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
            <p className="text-lg font-bold text-green-700">Your Turn!</p>
          </div>
        )}
        {!isMyTurn && !disabled && (
          <div className="flex items-center gap-2 bg-gray-100 px-6 py-3 rounded-full border-2 border-gray-300 shadow-md">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <p className="text-lg font-semibold text-gray-600">Opponent's Turn...</p>
          </div>
        )}
      </div>
    </div>
  )
}

