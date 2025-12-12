export type GameType = 'tictactoe' | 'connect4' | 'rps' | 'dotsandboxes'
export type GameStatus = 'waiting' | 'active' | 'completed' | 'abandoned'

export interface Game {
  id: string
  type: GameType
  status: GameStatus
  player1_id: string
  player2_id: string
  player1_name: string
  player2_name: string
  current_turn: string
  winner_id?: string
  state: any
  created_at: string
  updated_at: string
  started_at?: string
  ended_at?: string
}

export interface TicTacToeState {
  board: string[][]
  player1_id: string
  player2_id: string
  current_player: string
  move_count: number
}

export interface TicTacToeMove {
  row: number
  col: number
}

