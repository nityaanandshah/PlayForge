export type MatchmakingStatus = 'queued' | 'matched' | 'timeout' | 'cancelled';

export interface QueueEntry {
  id: string;
  user_id: string;
  username: string;
  game_type: string;
  rating: number;
  status: MatchmakingStatus;
  queued_at: string;
  matched_room_id?: string;
  expires_at: string;
}

export interface MatchmakingRequest {
  game_type: string;
}

export interface MatchmakingResponse {
  queue_entry: QueueEntry;
  message?: string;
}

export interface MatchFoundResponse {
  room_id: string;
  join_code: string;
  message: string;
}

export interface QueueStatusResponse {
  in_queue: boolean;
  queue_entry?: QueueEntry;
}

