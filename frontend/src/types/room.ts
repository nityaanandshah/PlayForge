export type RoomType = 'quickplay' | 'private' | 'ranked';
export type RoomStatus = 'waiting' | 'ready' | 'active' | 'complete' | 'closed';
export type ParticipantRole = 'host' | 'player' | 'spectator';

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
}

export interface JoinRoomRequest {
  join_code: string;
}

export interface RoomResponse {
  room: Room;
  message?: string;
}

