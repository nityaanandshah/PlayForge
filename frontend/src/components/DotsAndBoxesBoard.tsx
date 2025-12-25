import { DotsAndBoxesState, DotsAndBoxesMove, LineOrientation } from '../types/game'
import { useState } from 'react'

interface DotsAndBoxesBoardProps {
  state: DotsAndBoxesState
  currentUserId: string
  onMove: (move: DotsAndBoxesMove) => void
  disabled?: boolean
}

const DOT_SIZE = 12
const CELL_SIZE = 80

export default function DotsAndBoxesBoard({ state, currentUserId, onMove, disabled }: DotsAndBoxesBoardProps) {
  const [hoveredLine, setHoveredLine] = useState<{row: number, col: number, orientation: LineOrientation} | null>(null)
  
  // Use grid size from state (defaults to 5 if not provided for backward compatibility)
  const ROWS = state.grid_rows || 5
  const COLS = state.grid_cols || 5
  
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

  // Check if a line would only border already-claimed boxes (making it useless)
  const isLineUseless = (row: number, col: number, orientation: LineOrientation): boolean => {
    if (isLineDrawn(row, col, orientation)) return false
    
    const adjacentBoxes: Array<{row: number, col: number}> = []
    
    if (orientation === 'horizontal') {
      // Box above
      if (row > 0 && row - 1 < ROWS - 1 && col < COLS - 1) {
        adjacentBoxes.push({ row: row - 1, col })
      }
      // Box below
      if (row < ROWS - 1 && col < COLS - 1) {
        adjacentBoxes.push({ row, col })
      }
    } else { // vertical
      // Box to left
      if (col > 0 && row < ROWS - 1 && col - 1 < COLS - 1) {
        adjacentBoxes.push({ row, col: col - 1 })
      }
      // Box to right
      if (col < COLS - 1 && row < ROWS - 1) {
        adjacentBoxes.push({ row, col })
      }
    }
    
    // If no adjacent boxes (edge line), it's not useless
    if (adjacentBoxes.length === 0) return false
    
    // Check if ALL adjacent boxes are claimed
    const allClaimed = adjacentBoxes.every(box => getBoxOwner(box.row, box.col) !== null)
    return allClaimed
  }

  const handleLineClick = (row: number, col: number, orientation: LineOrientation) => {
    if (disabled || !isMyTurn || isLineDrawn(row, col, orientation) || isLineUseless(row, col, orientation)) {
      return
    }
    onMove({ row, col, orientation })
  }

  const getPlayerColor = (ownerId: string | null) => {
    if (!ownerId) return '#3A342D' // border-subtle
    return ownerId === state.player1_id ? '#5A7F6E' : '#6B7C8A' // Player A : Player B
  }

  const getBoxFillColor = (ownerId: string | null) => {
    if (!ownerId) return 'transparent'
    return ownerId === state.player1_id ? 'rgba(90,127,110,0.35)' : 'rgba(107,124,138,0.35)' // Player A : Player B
  }
  
  const getBoxStrokeColor = (ownerId: string | null) => {
    if (!ownerId) return 'transparent'
    return ownerId === state.player1_id ? '#5A7F6E' : '#6B7C8A' // Player A : Player B
  }
  
  const getLineColor = (drawn: boolean, owner: string | null, useless: boolean, isHovered: boolean, canClick: boolean) => {
    if (drawn) {
      return owner === state.player1_id ? '#5A7F6E' : '#6B7C8A' // Player A : Player B
    }
    if (useless) return '#3A342D' // border-subtle
    if (isHovered && canClick) return '#B8A77A' // Highlight color
    return '#3A342D' // border-subtle (undrawn lines)
  }

  return (
    <div className="flex items-center justify-center gap-8 w-full max-w-6xl mx-auto px-4">
      {/* Left Side - Player Info & Your Score */}
      <div className="flex flex-col gap-4 w-48">
        {/* Your Score */}
        <div className="bg-surface-1 rounded-xl p-5 shadow-elevated border border-border-subtle">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-6 h-6 rounded border-2 shadow-md" style={{ backgroundColor: isPlayer1 ? '#5A7F6E' : '#6B7C8A', borderColor: '#3A342D' }}></div>
            <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Your Score</div>
          </div>
          <div className="text-6xl font-bold text-center" style={{ color: isPlayer1 ? '#5A7F6E' : '#6B7C8A' }}>{myScore}</div>
        </div>

        {/* Turn Indicator */}
        {isMyTurn && !disabled && (
          <div className="flex flex-col items-center gap-2 bg-warning-soft px-4 py-3 rounded-xl border-2 shadow-md animate-pulse" style={{ borderColor: '#C8A14A' }}>
            <div className="w-3 h-3 rounded-full animate-ping" style={{ backgroundColor: '#C8A14A' }}></div>
            <p className="text-sm font-bold text-bg-main">Your Turn!</p>
          </div>
        )}
        {!isMyTurn && !disabled && (
          <div className="flex flex-col items-center gap-2 bg-surface-2 px-4 py-3 rounded-xl border-2 border-border-subtle shadow-md">
            <div className="w-3 h-3 bg-text-muted rounded-full"></div>
            <p className="text-sm font-semibold text-text-secondary">Opponent's Turn</p>
          </div>
        )}

        {/* Instructions */}
        {isMyTurn && !disabled && (
          <div className="text-center text-xs text-text-secondary bg-surface-2 px-3 py-2 rounded-lg border border-border-subtle">
            💡 Click lines to draw them
          </div>
        )}
      </div>

      {/* Center - Game Board */}
      <div className="flex flex-col items-center gap-4">
        {/* Title */}
        <div className="text-center">
          <div className="text-2xl font-bold text-text-primary">Dots & Boxes</div>
          <div className="text-sm text-text-secondary mt-1">{state.boxes.length} / {state.total_boxes} boxes</div>
        </div>

        <div className="relative p-8 rounded-2xl shadow-elevated" style={{ backgroundColor: '#2B2621' }}>
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
                    fill={getBoxFillColor(owner)}
                    stroke={getBoxStrokeColor(owner)}
                    strokeWidth="2"
                    opacity="0.7"
                    className="animate-[scale-in_0.3s_ease-out]"
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
              const useless = isLineUseless(row, col, 'horizontal')
              const isHovered = hoveredLine?.row === row && hoveredLine?.col === col && hoveredLine?.orientation === 'horizontal'
              const canClick = !drawn && !useless && isMyTurn && !disabled
              
              return (
                <g key={`h-${row}-${col}`}>
                  {/* Clickable area */}
                  <rect
                    x={DOT_SIZE / 2 + col * CELL_SIZE}
                    y={DOT_SIZE / 2 + row * CELL_SIZE - 8}
                    width={CELL_SIZE}
                    height={16}
                    fill="transparent"
                    className={`${canClick ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                    onClick={() => handleLineClick(row, col, 'horizontal')}
                    onMouseEnter={() => canClick && setHoveredLine({row, col, orientation: 'horizontal'})}
                    onMouseLeave={() => setHoveredLine(null)}
                  />
                  {/* Line */}
                  <line
                    x1={DOT_SIZE / 2 + col * CELL_SIZE}
                    y1={DOT_SIZE / 2 + row * CELL_SIZE}
                    x2={DOT_SIZE / 2 + (col + 1) * CELL_SIZE}
                    y2={DOT_SIZE / 2 + row * CELL_SIZE}
                    stroke={getLineColor(drawn, owner, useless, isHovered, canClick)}
                    strokeWidth={drawn ? 4 : (isHovered && canClick ? 3 : 2)}
                    strokeLinecap="round"
                    strokeDasharray={useless ? '5,5' : undefined}
                    opacity={useless ? 0.3 : 1}
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
              const useless = isLineUseless(row, col, 'vertical')
              const isHovered = hoveredLine?.row === row && hoveredLine?.col === col && hoveredLine?.orientation === 'vertical'
              const canClick = !drawn && !useless && isMyTurn && !disabled
              
              return (
                <g key={`v-${row}-${col}`}>
                  {/* Clickable area */}
                  <rect
                    x={DOT_SIZE / 2 + col * CELL_SIZE - 8}
                    y={DOT_SIZE / 2 + row * CELL_SIZE}
                    width={16}
                    height={CELL_SIZE}
                    fill="transparent"
                    className={`${canClick ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                    onClick={() => handleLineClick(row, col, 'vertical')}
                    onMouseEnter={() => canClick && setHoveredLine({row, col, orientation: 'vertical'})}
                    onMouseLeave={() => setHoveredLine(null)}
                  />
                  {/* Line */}
                  <line
                    x1={DOT_SIZE / 2 + col * CELL_SIZE}
                    y1={DOT_SIZE / 2 + row * CELL_SIZE}
                    x2={DOT_SIZE / 2 + col * CELL_SIZE}
                    y2={DOT_SIZE / 2 + (row + 1) * CELL_SIZE}
                    stroke={getLineColor(drawn, owner, useless, isHovered, canClick)}
                    strokeWidth={drawn ? 4 : (isHovered && canClick ? 3 : 2)}
                    strokeLinecap="round"
                    strokeDasharray={useless ? '5,5' : undefined}
                    opacity={useless ? 0.3 : 1}
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
                fill="#C08A3E"
              />
            ))
          )}
        </svg>
        </div>
      </div>

      {/* Right Side - Opponent Score */}
      <div className="flex flex-col gap-4 w-48">
        {/* Opponent Score */}
        <div className="bg-surface-1 rounded-xl p-5 shadow-elevated border border-border-subtle">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-6 h-6 rounded border-2 shadow-md" style={{ backgroundColor: isPlayer1 ? '#6B7C8A' : '#5A7F6E', borderColor: '#3A342D' }}></div>
            <div className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Opponent</div>
          </div>
          <div className="text-6xl font-bold text-center" style={{ color: isPlayer1 ? '#6B7C8A' : '#5A7F6E' }}>{opponentScore}</div>
        </div>
      </div>
    </div>
  )
}


