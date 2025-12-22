export type TournamentType = 'single_elimination' | 'double_elimination' | 'round_robin';

export type TournamentStatus = 'pending' | 'ready' | 'in_progress' | 'complete' | 'cancelled';

export type TournamentMatchStatus = 'pending' | 'ready' | 'in_progress' | 'complete';

export interface TournamentParticipant {
  user_id: string;
  username: string;
  seed: number;
  elo_rating: number;
  is_eliminated: boolean;
  joined_at: string;
}

export interface BracketMatch {
  match_number: number;
  match_id?: string;
  player1_id?: string;
  player1_name?: string;
  player2_id?: string;
  player2_name?: string;
  winner_id?: string;
  status: TournamentMatchStatus;
  advances_to_match?: number;
}

export interface BracketRound {
  round_number: number;
  round_name: string;
  matches: BracketMatch[];
}

export interface BracketData {
  rounds: BracketRound[];
}

export interface Tournament {
  id: string;
  room_id: string;
  name: string;
  game_type: string;
  tournament_type: TournamentType;
  status: TournamentStatus;
  max_participants: number;
  is_private: boolean;
  join_code?: string;
  bracket_data?: BracketData;
  winner_id?: string;
  created_by: string;
  started_at?: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
  participants: TournamentParticipant[];
  current_round: number;
  total_rounds: number;
}

export interface GameSettings {
  tictactoe_grid_size?: number;
  tictactoe_win_length?: number;
  connect4_rows?: number;
  connect4_cols?: number;
  connect4_win_length?: number;
  rps_best_of?: number;
  dots_grid_size?: number;
}

export interface CreateTournamentRequest {
  name: string;
  game_type: string;
  tournament_type: TournamentType;
  max_participants: number;
  is_private: boolean;
  game_settings?: GameSettings;
}

export interface TournamentResponse {
  tournament: Tournament;
  message?: string;
}

export interface TournamentListResponse {
  tournaments: Tournament[];
  total: number;
}


