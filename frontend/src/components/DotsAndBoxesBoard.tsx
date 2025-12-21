import { DotsAndBoxesState, DotsAndBoxesMove, LineOrientation } from '../types/game'
import { useState } from 'react'

interface DotsAndBoxesBoardProps {
  state: DotsAndBoxesState
  currentUserId: string
  onMove: (move: DotsAndBoxesMove) => void
  disabled?: boolean
}

const ROWS = 5
const COLS = 5
const DOT_SIZE = 12
const CELL_SIZE = 80

export default function DotsAndBoxesBoard({ state, currentUserId, onMove, disabled }: DotsAndBoxesBoardProps) {
  const [hoveredLine, setHoveredLine] = useState<{row: number, col: number, orientation: LineOrientation} | null>(null)
  
  const isMyTurn = state.current_player === currentUserId
  const isPlayer1 = state.player1_id === currentUserId
  const myScore = isPlayer1 ? state.player1_score : state.player2_score
  const opponentScore = isPlayer1 ? state.player2_score : state.player1_score

  const isLineDrawn = (row: number, col: number, orientation: LineOrientation): boolean => {
    return state.lines.some(line => 
      line.row === row && line.col === col && line.orientation === orientation
    )
  }

  const getLineOwner = (row: number, col: number, orientation: LineOrientation): string | null => {
    const line = state.lines.find(line => 
      line.row === row && line.col === col && line.orientation === orientation
    )
    return line ? line.owner_id : null
  }

  const getBoxOwner = (row: number, col: number): string | null => {
    const box = state.boxes.find(box => box.row === row && box.col === col)
    return box ? box.owner_id : null
  }

  const handleLineClick = (row: number, col: number, orientation: LineOrientation) => {
    if (disabled || !isMyTurn || isLineDrawn(row, col, orientation)) {
      return
    }
    onMove({ row, col, orientation })
  }

  const getPlayerColor = (ownerId: string | null) => {
    if (!ownerId) return 'bg-gray-300'
    return ownerId === state.player1_id ? 'bg-blue-500' : 'bg-red-500'
  }

  const getBoxColor = (ownerId: string | null) => {
    if (!ownerId) return ''
    return ownerId === state.player1_id ? 'bg-blue-100 border-blue-400' : 'bg-red-100 border-red-400'
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Score Board */}
      <div className="w-full max-w-2xl bg-gradient-to-r from-blue-100 to-red-100 rounded-2xl p-6 shadow-xl">
        <div className="flex justify-between items-center">
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Your Score</div>
            <div className="text-5xl font-bold text-blue-600">{myScore}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-700">Dots & Boxes</div>
            <div className="text-sm text-gray-600 mt-1">{state.boxes.length} / {state.total_boxes} boxes</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Opponent</div>
            <div className="text-5xl font-bold text-red-600">{opponentScore}</div>
          </div>
        </div>
      </div>

      {/* Turn Indicator */}
      {isMyTurn && !disabled && (
        <div className="flex items-center gap-3 bg-green-100 px-6 py-3 rounded-full border-2 border-green-400 shadow-md animate-pulse">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
          <p className="text-lg font-bold text-green-700">Your Turn!</p>
        </div>
      )}
      {!isMyTurn && !disabled && (
        <div className="flex items-center gap-3 bg-gray-100 px-6 py-3 rounded-full border-2 border-gray-300 shadow-md">
          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
          <p className="text-lg font-semibold text-gray-600">Opponent's Turn...</p>
        </div>
      )}

      {/* Game Board */}
      <div className="relative bg-white p-8 rounded-2xl shadow-2xl">
        <svg
          width={CELL_SIZE * (COLS - 1) + DOT_SIZE}
          height={CELL_SIZE * (ROWS - 1) + DOT_SIZE}
          className="block"
        >
          {/* Draw boxes (filled squares) */}
          {Array.from({ length: ROWS - 1 }).map((_, row) =>
            Array.from({ length: COLS - 1 }).map((_, col) => {
              const owner = getBoxOwner(row, col)
              if (owner) {
                return (
                  <rect
                    key={`box-${row}-${col}`}
                    x={DOT_SIZE / 2 + col * CELL_SIZE}
                    y={DOT_SIZE / 2 + row * CELL_SIZE}
                    width={CELL_SIZE}
                    height={CELL_SIZE}
                    className={`${getBoxColor(owner)} animate-[scale-in_0.3s_ease-out]`}
                    opacity="0.5"
                  />
                )
              }
              return null
            })
          )}

          {/* Draw horizontal lines */}
          {Array.from({ length: ROWS }).map((_, row) =>
            Array.from({ length: COLS - 1 }).map((_, col) => {
              const drawn = isLineDrawn(row, col, 'horizontal')
              const owner = getLineOwner(row, col, 'horizontal')
              const isHovered = hoveredLine?.row === row && hoveredLine?.col === col && hoveredLine?.orientation === 'horizontal'
              
              return (
                <g key={`h-${row}-${col}`}>
                  {/* Clickable area */}
                  <rect
                    x={DOT_SIZE / 2 + col * CELL_SIZE}
                    y={DOT_SIZE / 2 + row * CELL_SIZE - 8}
                    width={CELL_SIZE}
                    height={16}
                    fill="transparent"
                    className={`${!drawn && isMyTurn && !disabled ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                    onClick={() => handleLineClick(row, col, 'horizontal')}
                    onMouseEnter={() => !drawn && setHoveredLine({row, col, orientation: 'horizontal'})}
                    onMouseLeave={() => setHoveredLine(null)}
                  />
                  {/* Line */}
                  <line
                    x1={DOT_SIZE / 2 + col * CELL_SIZE}
                    y1={DOT_SIZE / 2 + row * CELL_SIZE}
                    x2={DOT_SIZE / 2 + (col + 1) * CELL_SIZE}
                    y2={DOT_SIZE / 2 + row * CELL_SIZE}
                    stroke={drawn ? (owner === state.player1_id ? '#3B82F6' : '#EF4444') : (isHovered && isMyTurn && !disabled ? '#10B981' : '#D1D5DB')}
                    strokeWidth={drawn ? 4 : (isHovered && isMyTurn && !disabled ? 3 : 2)}
                    strokeLinecap="round"
                    className={drawn ? 'animate-[scale-in_0.2s_ease-out]' : ''}
                  />
                </g>
              )
            })
          )}

          {/* Draw vertical lines */}
          {Array.from({ length: ROWS - 1 }).map((_, row) =>
            Array.from({ length: COLS }).map((_, col) => {
              const drawn = isLineDrawn(row, col, 'vertical')
              const owner = getLineOwner(row, col, 'vertical')
              const isHovered = hoveredLine?.row === row && hoveredLine?.col === col && hoveredLine?.orientation === 'vertical'
              
              return (
                <g key={`v-${row}-${col}`}>
                  {/* Clickable area */}
                  <rect
                    x={DOT_SIZE / 2 + col * CELL_SIZE - 8}
                    y={DOT_SIZE / 2 + row * CELL_SIZE}
                    width={16}
                    height={CELL_SIZE}
                    fill="transparent"
                    className={`${!drawn && isMyTurn && !disabled ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                    onClick={() => handleLineClick(row, col, 'vertical')}
                    onMouseEnter={() => !drawn && setHoveredLine({row, col, orientation: 'vertical'})}
                    onMouseLeave={() => setHoveredLine(null)}
                  />
                  {/* Line */}
                  <line
                    x1={DOT_SIZE / 2 + col * CELL_SIZE}
                    y1={DOT_SIZE / 2 + row * CELL_SIZE}
                    x2={DOT_SIZE / 2 + col * CELL_SIZE}
                    y2={DOT_SIZE / 2 + (row + 1) * CELL_SIZE}
                    stroke={drawn ? (owner === state.player1_id ? '#3B82F6' : '#EF4444') : (isHovered && isMyTurn && !disabled ? '#10B981' : '#D1D5DB')}
                    strokeWidth={drawn ? 4 : (isHovered && isMyTurn && !disabled ? 3 : 2)}
                    strokeLinecap="round"
                    className={drawn ? 'animate-[scale-in_0.2s_ease-out]' : ''}
                  />
                </g>
              )
            })
          )}

          {/* Draw dots */}
          {Array.from({ length: ROWS }).map((_, row) =>
            Array.from({ length: COLS }).map((_, col) => (
              <circle
                key={`dot-${row}-${col}`}
                cx={DOT_SIZE / 2 + col * CELL_SIZE}
                cy={DOT_SIZE / 2 + row * CELL_SIZE}
                r={DOT_SIZE / 2}
                fill="#374151"
              />
            ))
          )}
        </svg>
      </div>

      {/* Instructions */}
      {isMyTurn && !disabled && (
        <div className="text-center text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
          💡 Click on a line between dots to draw it. Complete boxes to score!
        </div>
      )}
    </div>
  )
}


