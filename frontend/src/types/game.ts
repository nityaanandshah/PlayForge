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
  grid_size: number
  win_length: number
}

export interface TicTacToeMove {
  row: number
  col: number
}

export interface Connect4State {
  board: string[][]
  player1_id: string
  player2_id: string
  current_player: string
  move_count: number
  rows: number
  cols: number
  win_length: number
}

export interface Connect4Move {
  column: number
}

export type RPSChoice = 'rock' | 'paper' | 'scissors' | ''

export interface RPSRound {
  round_number: number
  player1_choice: RPSChoice
  player2_choice: RPSChoice
  winner_id?: string
  player1_revealed: boolean
  player2_revealed: boolean
}

export interface RPSState {
  player1_id: string
  player2_id: string
  current_round: number
  player1_score: number
  player2_score: number
  rounds: RPSRound[]
  player1_choice: RPSChoice
  player2_choice: RPSChoice
  both_revealed: boolean
  max_rounds: number
  wins_needed: number
}

export interface RPSMove {
  choice: RPSChoice
}

export type LineOrientation = 'horizontal' | 'vertical'

export interface Line {
  row: number
  col: number
  orientation: LineOrientation
  owner_id: string
}

export interface Box {
  row: number
  col: number
  owner_id: string
}

export interface DotsAndBoxesState {
  player1_id: string
  player2_id: string
  current_player: string
  lines: Line[]
  boxes: Box[]
  player1_score: number
  player2_score: number
  total_boxes: number
  last_move_boxed: boolean
  grid_rows: number
  grid_cols: number
}

export interface DotsAndBoxesMove {
  row: number
  col: number
  orientation: LineOrientation
}

