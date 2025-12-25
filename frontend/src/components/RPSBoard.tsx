import { RPSState, RPSMove, RPSChoice } from '../types/game'
import { useState, useEffect } from 'react'
import { Circle, Square, Scissors } from 'lucide-react'

interface RPSBoardProps {
  state: RPSState
  currentUserId: string
  onMove: (move: RPSMove) => void
  disabled?: boolean
}

export default function RPSBoard({ state, currentUserId, onMove, disabled }: RPSBoardProps) {
  const [showResult, setShowResult] = useState(false)
  
  const isPlayer1 = state.player1_id === currentUserId
  const isPlayer2 = state.player2_id === currentUserId
  const isSpectator = !isPlayer1 && !isPlayer2
  
  // For spectators, show from player1's perspective (neutral view)
  // For participants, show from their perspective
  const myChoice = isSpectator ? state.player1_choice : (isPlayer1 ? state.player1_choice : state.player2_choice)
  const opponentChoice = isSpectator ? state.player2_choice : (isPlayer1 ? state.player2_choice : state.player1_choice)
  const myScore = isSpectator ? state.player1_score : (isPlayer1 ? state.player1_score : state.player2_score)
  const opponentScore = isSpectator ? state.player2_score : (isPlayer1 ? state.player2_score : state.player1_score)
  
  // Show result when both players have revealed
  useEffect(() => {
    if (state.both_revealed) {
      setShowResult(true)
      // Auto-hide result after 3 seconds
      const timer = setTimeout(() => {
        setShowResult(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [state.both_revealed])

  const handleChoice = (choice: RPSChoice) => {
    if (disabled || myChoice !== '') return
    onMove({ choice })
  }

  const getChoiceIcon = (choice: RPSChoice) => {
    switch (choice) {
      case 'rock': return Circle
      case 'paper': return Square
      case 'scissors': return Scissors
      default: return Circle
    }
  }

  const getChoiceColor = (choice: RPSChoice) => {
    // All choices use wood surface background (game isolated)
    return '#2E2A25' // surface-3
  }
  
  const getIconColor = () => {
    return '#7A6F5B' // RPS game-specific icon color
  }
  
  const getHighlightColor = () => {
    return '#B8A77A' // RPS game-specific highlight color
  }

  const getRoundResult = () => {
    if (!state.both_revealed) return null
    
    const lastRound = state.rounds[state.rounds.length - 1]
    if (!lastRound) return null
    
    if (!lastRound.winner_id) {
      return { text: "It's a Draw!", color: 'text-warning', borderColor: 'border-warning' }
    } else if (isSpectator) {
      // For spectators, show neutral message
      const winnerIsPlayer1 = lastRound.winner_id === state.player1_id
      return { 
        text: winnerIsPlayer1 ? 'Player 1 Won!' : 'Player 2 Won!', 
        color: 'text-success',
        borderColor: 'border-success'
      }
    } else if (lastRound.winner_id === currentUserId) {
      return { text: 'You Won This Round!', color: 'text-success', borderColor: 'border-success' }
    } else {
      return { text: 'You Lost This Round', color: 'text-danger', borderColor: 'border-danger' }
    }
  }

  const result = getRoundResult()

  return (
    <div className="flex flex-col items-center space-y-8 max-w-4xl mx-auto">
      {/* Score Board */}
      <div className="w-full bg-surface-1 rounded-2xl p-6 shadow-elevated border border-border-subtle">
        <div className="flex justify-between items-center">
          <div className="text-center">
            <div className="text-sm text-text-secondary mb-1">Your Score</div>
            <div className="text-5xl font-bold text-accent-primary">{myScore}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-text-primary mb-2">Best of 5</div>
            <div className="text-lg text-text-secondary">Round {state.current_round}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-text-secondary mb-1">Opponent Score</div>
            <div className="text-5xl font-bold text-danger">{opponentScore}</div>
          </div>
        </div>
      </div>

      {/* Round Result */}
      {showResult && result && (
        <div className={`w-full bg-surface-1 rounded-2xl p-8 shadow-elevated border-4 ${result.borderColor} animate-[scale-in_0.5s_ease-out]`}>
          <div className="flex justify-center items-center gap-8 mb-4">
            <div className="text-center">
              {(() => {
                const MyChoiceIcon = getChoiceIcon(myChoice)
                return <MyChoiceIcon className="w-24 h-24 mb-2 mx-auto" style={{ color: getIconColor() }} fill="currentColor" />
              })()}
              <div className="text-lg font-semibold text-text-primary">You</div>
            </div>
            <div className="text-4xl text-text-muted">VS</div>
            <div className="text-center">
              {(() => {
                const OpponentChoiceIcon = getChoiceIcon(opponentChoice)
                return <OpponentChoiceIcon className="w-24 h-24 mb-2 mx-auto" style={{ color: getIconColor() }} fill="currentColor" />
              })()}
              <div className="text-lg font-semibold text-text-primary">Opponent</div>
            </div>
          </div>
          <div className={`text-3xl font-bold text-center ${result.color}`}>
            {result.text}
          </div>
        </div>
      )}

      {/* Choice Buttons */}
      {!state.both_revealed && (
        <div className="w-full">
          <div className="text-center mb-6">
            {myChoice === '' ? (
              <div className="text-2xl font-bold text-text-secondary animate-pulse">
                Make Your Choice!
              </div>
            ) : (
              <div className="text-2xl font-bold text-success">
                ✓ Choice Made! Waiting for opponent...
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            {(['rock', 'paper', 'scissors'] as RPSChoice[]).map((choice) => {
              const ChoiceIcon = getChoiceIcon(choice)
              const isSelected = myChoice === choice
              return (
                <button
                  key={choice}
                  onClick={() => handleChoice(choice)}
                  disabled={disabled || myChoice !== ''}
                  className={`relative group ${
                    isSelected
                      ? 'scale-110'
                      : myChoice !== ''
                      ? 'opacity-30 cursor-not-allowed'
                      : 'hover:scale-110 cursor-pointer'
                  } transition-all duration-300`}
                  style={{
                    boxShadow: isSelected ? `0 0 0 4px ${getHighlightColor()}` : undefined
                  }}
                >
                  <div className="rounded-3xl p-8 shadow-elevated border border-border-subtle" style={{ backgroundColor: getChoiceColor(choice) }}>
                    <ChoiceIcon className="w-32 h-32 mb-4 mx-auto" style={{ color: getIconColor() }} fill="currentColor" />
                    <div className="text-2xl font-bold text-text-primary capitalize">{choice}</div>
                    </div>
                  {isSelected && (
                    <div className="absolute top-4 right-4 rounded-full p-2" style={{ backgroundColor: getHighlightColor() }}>
                      <svg className="w-6 h-6 text-bg-main" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Round History */}
      {state.rounds.length > 0 && (
        <div className="w-full bg-surface-1 rounded-2xl p-6 shadow-elevated border border-border-subtle">
          <h3 className="text-xl font-bold text-text-primary mb-4">Round History</h3>
          <div className="space-y-2">
            {state.rounds.map((round) => {
              const isDraw = !round.winner_id
              
              let isWinner, myRoundChoice, opponentRoundChoice, resultText, bgColor, textColor
              
              if (isSpectator) {
                // For spectators, show player1 vs player2 perspective
                const player1Won = round.winner_id === state.player1_id
                myRoundChoice = round.player1_choice
                opponentRoundChoice = round.player2_choice
                
                if (isDraw) {
                  resultText = 'Draw'
                  bgColor = 'bg-warning-soft border-2 border-warning'
                  textColor = 'text-warning'
                } else if (player1Won) {
                  resultText = 'Won'
                  bgColor = 'bg-success-soft border-2 border-success'
                  textColor = 'text-success'
                } else {
                  resultText = 'Lost'
                  bgColor = 'bg-danger-soft border-2 border-danger'
                  textColor = 'text-danger'
                }
              } else {
                // For participants, show from their perspective
                isWinner = round.winner_id === currentUserId
                myRoundChoice = isPlayer1 ? round.player1_choice : round.player2_choice
                opponentRoundChoice = isPlayer1 ? round.player2_choice : round.player1_choice
                
                if (isDraw) {
                  resultText = 'Draw'
                  bgColor = 'bg-warning-soft border-2 border-warning'
                  textColor = 'text-warning'
                } else if (isWinner) {
                  resultText = 'Won'
                  bgColor = 'bg-success-soft border-2 border-success'
                  textColor = 'text-success'
                } else {
                  resultText = 'Lost'
                  bgColor = 'bg-danger-soft border-2 border-danger'
                  textColor = 'text-danger'
                }
              }
              
              return (
                <div
                  key={round.round_number}
                  className={`flex items-center justify-between p-4 rounded-xl ${bgColor}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-lg font-bold text-text-secondary">R{round.round_number}</div>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const MyRoundChoiceIcon = getChoiceIcon(myRoundChoice)
                        const OpponentRoundChoiceIcon = getChoiceIcon(opponentRoundChoice)
                        return (
                          <>
                            <MyRoundChoiceIcon className="w-8 h-8" style={{ color: getIconColor() }} fill="currentColor" />
                            <span className="text-text-muted">vs</span>
                            <OpponentRoundChoiceIcon className="w-8 h-8" style={{ color: getIconColor() }} fill="currentColor" />
                          </>
                        )
                      })()}
                    </div>
                  </div>
                  <div className={`font-bold ${textColor}`}>
                    {resultText}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Game Rules */}
      <div className="w-full bg-surface-2 rounded-xl p-4 border border-border-subtle">
        <div className="text-sm text-text-secondary text-center">
          <span className="font-semibold">Rules:</span> Rock beats Scissors, Scissors beats Paper, Paper beats Rock
        </div>
      </div>
    </div>
  )
}





