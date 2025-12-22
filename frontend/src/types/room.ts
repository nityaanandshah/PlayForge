export type RoomType = 'quickplay' | 'private' | 'ranked';
export type RoomStatus = 'waiting' | 'ready' | 'active' | 'complete' | 'closed';
export type ParticipantRole = 'host' | 'player' | 'spectator';

export interface GameSettings {
  // Tic-Tac-Toe settings
  tictactoe_grid_size?: number; // 3, 4, or 5
  tictactoe_win_length?: number;
  
  // Connect-4 settings
  connect4_rows?: number; // 4-10
  connect4_cols?: number; // 4-10
  connect4_win_length?: number;
  
  // RPS settings
  rps_best_of?: number; // 3, 5, 7, 9
  
  // Dots & Boxes settings
  dots_grid_size?: number; // 4, 5, 6, 7, 8
}

export interface Participant {
  user_id: string;
  username: string;
  role: ParticipantRole;
  is_ready: boolean;
  joined_at: string;
}

export interface Room {
  id: string;
  type: RoomType;
  status: RoomStatus;
  game_type: string;
  game_settings?: GameSettings;
  join_code: string;
  host_id: string;
  game_id?: string;
  max_players: number;
  participants: Participant[];
  created_at: string;
  updated_at: string;
  started_at?: string;
  expires_at: string;
}

export interface CreateRoomRequest {
  game_type: string;
  type: RoomType;
  max_players: number;
  game_settings?: GameSettings;
}

export interface JoinRoomRequest {
  join_code: string;
}

export interface RoomResponse {
  room: Room;
  message?: string;
}

