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

  const getCellClass = (row: number, col: number) => {
    const baseClass = 'w-24 h-24 border-2 border-gray-400 flex items-center justify-center text-4xl font-bold transition-colors'
    const value = state.board[row][col]
    
    if (value === '') {
      return `${baseClass} ${isMyTurn && !disabled ? 'hover:bg-gray-100 cursor-pointer' : 'cursor-not-allowed'}`
    }
    
    if (value === 'X') {
      return `${baseClass} text-blue-600 bg-blue-50`
    }
    
    return `${baseClass} text-red-600 bg-red-50`
  }

  return (
    <div className="flex flex-col items-center">
      <div className="grid grid-cols-3 gap-1 bg-gray-400 p-1">
        {[0, 1, 2].map((row) => (
          [0, 1, 2].map((col) => (
            <button
              key={`${row}-${col}`}
              className={getCellClass(row, col)}
              onClick={() => handleCellClick(row, col)}
              disabled={disabled || !isMyTurn || state.board[row][col] !== ''}
            >
              {state.board[row][col]}
            </button>
          ))
        ))}
      </div>
      
      <div className="mt-4 text-center">
        {isMyTurn && !disabled && (
          <p className="text-lg font-semibold text-green-600">Your turn!</p>
        )}
        {!isMyTurn && !disabled && (
          <p className="text-lg font-semibold text-gray-600">Opponent's turn...</p>
        )}
      </div>
    </div>
  )
}

