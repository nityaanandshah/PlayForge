import { RPSState, RPSMove, RPSChoice } from '../types/game'
import { useState, useEffect } from 'react'

interface RPSBoardProps {
  state: RPSState
  currentUserId: string
  onMove: (move: RPSMove) => void
  disabled?: boolean
}

export default function RPSBoard({ state, currentUserId, onMove, disabled }: RPSBoardProps) {
  const [selectedChoice, setSelectedChoice] = useState<RPSChoice>('')
  const [showResult, setShowResult] = useState(false)
  
  const isPlayer1 = state.player1_id === currentUserId
  const myChoice = isPlayer1 ? state.player1_choice : state.player2_choice
  const opponentChoice = isPlayer1 ? state.player2_choice : state.player1_choice
  const myScore = isPlayer1 ? state.player1_score : state.player2_score
  const opponentScore = isPlayer1 ? state.player2_score : state.player1_score
  
  // Show result when both players have revealed
  useEffect(() => {
    if (state.both_revealed) {
      setShowResult(true)
      // Auto-hide result after 3 seconds
      const timer = setTimeout(() => {
        setShowResult(false)
        setSelectedChoice('')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [state.both_revealed])

  const handleChoice = (choice: RPSChoice) => {
    if (disabled || myChoice !== '') return
    setSelectedChoice(choice)
    onMove({ choice })
  }

  const getChoiceEmoji = (choice: RPSChoice) => {
    switch (choice) {
      case 'rock': return '✊'
      case 'paper': return '✋'
      case 'scissors': return '✌️'
      default: return '❓'
    }
  }

  const getChoiceColor = (choice: RPSChoice) => {
    switch (choice) {
      case 'rock': return 'from-gray-500 to-gray-700'
      case 'paper': return 'from-blue-500 to-blue-700'
      case 'scissors': return 'from-red-500 to-red-700'
      default: return 'from-gray-400 to-gray-600'
    }
  }

  const getRoundResult = () => {
    if (!state.both_revealed) return null
    
    const lastRound = state.rounds[state.rounds.length - 1]
    if (!lastRound) return null
    
    if (!lastRound.winner_id) {
      return { text: "It's a Draw!", color: 'text-yellow-600' }
    } else if (lastRound.winner_id === currentUserId) {
      return { text: 'You Won This Round!', color: 'text-green-600' }
    } else {
      return { text: 'You Lost This Round', color: 'text-red-600' }
    }
  }

  const result = getRoundResult()

  return (
    <div className="flex flex-col items-center space-y-8 max-w-4xl mx-auto">
      {/* Score Board */}
      <div className="w-full bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 shadow-xl">
        <div className="flex justify-between items-center">
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Your Score</div>
            <div className="text-5xl font-bold text-purple-600">{myScore}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-700 mb-2">Best of 5</div>
            <div className="text-lg text-gray-600">Round {state.current_round}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Opponent Score</div>
            <div className="text-5xl font-bold text-pink-600">{opponentScore}</div>
          </div>
        </div>
      </div>

      {/* Round Result */}
      {showResult && result && (
        <div className={`w-full bg-white rounded-2xl p-8 shadow-2xl border-4 ${
          result.color === 'text-green-600' ? 'border-green-400' :
          result.color === 'text-red-600' ? 'border-red-400' : 'border-yellow-400'
        } animate-[scale-in_0.5s_ease-out]`}>
          <div className="flex justify-center items-center gap-8 mb-4">
            <div className="text-center">
              <div className="text-6xl mb-2">{getChoiceEmoji(myChoice)}</div>
              <div className="text-lg font-semibold text-gray-700">You</div>
            </div>
            <div className="text-4xl text-gray-400">VS</div>
            <div className="text-center">
              <div className="text-6xl mb-2">{getChoiceEmoji(opponentChoice)}</div>
              <div className="text-lg font-semibold text-gray-700">Opponent</div>
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
              <div className="text-2xl font-bold text-gray-700 animate-pulse">
                Make Your Choice!
              </div>
            ) : (
              <div className="text-2xl font-bold text-green-600">
                ✓ Choice Made! Waiting for opponent...
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            {(['rock', 'paper', 'scissors'] as RPSChoice[]).map((choice) => (
              <button
                key={choice}
                onClick={() => handleChoice(choice)}
                disabled={disabled || myChoice !== ''}
                className={`relative group ${
                  myChoice === choice
                    ? 'scale-110 ring-4 ring-green-400'
                    : myChoice !== ''
                    ? 'opacity-30 cursor-not-allowed'
                    : 'hover:scale-110 cursor-pointer'
                } transition-all duration-300`}
              >
                <div className={`bg-gradient-to-br ${getChoiceColor(choice)} rounded-3xl p-8 shadow-2xl ${
                  myChoice === '' && !disabled ? 'group-hover:shadow-3xl' : ''
                }`}>
                  <div className="text-8xl mb-4">{getChoiceEmoji(choice)}</div>
                  <div className="text-2xl font-bold text-white capitalize">{choice}</div>
                </div>
                {myChoice === choice && (
                  <div className="absolute top-4 right-4 bg-green-500 text-white rounded-full p-2">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Round History */}
      {state.rounds.length > 0 && (
        <div className="w-full bg-white rounded-2xl p-6 shadow-xl">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Round History</h3>
          <div className="space-y-2">
            {state.rounds.map((round) => {
              const isWinner = round.winner_id === currentUserId
              const isDraw = !round.winner_id
              const myRoundChoice = isPlayer1 ? round.player1_choice : round.player2_choice
              const opponentRoundChoice = isPlayer1 ? round.player2_choice : round.player1_choice
              
              return (
                <div
                  key={round.round_number}
                  className={`flex items-center justify-between p-4 rounded-xl ${
                    isWinner ? 'bg-green-50 border-2 border-green-300' :
                    isDraw ? 'bg-yellow-50 border-2 border-yellow-300' :
                    'bg-red-50 border-2 border-red-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-lg font-bold text-gray-600">R{round.round_number}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{getChoiceEmoji(myRoundChoice)}</span>
                      <span className="text-gray-400">vs</span>
                      <span className="text-3xl">{getChoiceEmoji(opponentRoundChoice)}</span>
                    </div>
                  </div>
                  <div className={`font-bold ${
                    isWinner ? 'text-green-600' :
                    isDraw ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {isWinner ? 'Won' : isDraw ? 'Draw' : 'Lost'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Game Rules */}
      <div className="w-full bg-blue-50 rounded-xl p-4 border border-blue-200">
        <div className="text-sm text-gray-700 text-center">
          <span className="font-semibold">Rules:</span> Rock beats Scissors, Scissors beats Paper, Paper beats Rock
        </div>
      </div>
    </div>
  )
}



