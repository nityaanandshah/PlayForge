import type { AuthResponse, User, LoginRequest, SignupRequest } from '../types'
import type { Game, GameType } from '../types/game'
import type { PlayerStats } from './api'
import type { Room, CreateRoomRequest, JoinRoomRequest, RoomResponse } from '../types/room'
import type { MatchmakingRequest, MatchmakingResponse, QueueStatusResponse } from '../types/matchmaking'

// Mock Users (exported for potential use)
export const mockUsers: User[] = [
  {
    id: 'user-1',
    username: 'GameMaster',
    email: 'gamemaster@playforge.com',
    elo_rating: 1850,
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'user-2',
    username: 'ProPlayer',
    email: 'proplayer@playforge.com',
    elo_rating: 2100,
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'user-3',
    username: 'ChessKnight',
    email: 'chess@playforge.com',
    elo_rating: 1650,
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'user-4',
    username: 'StrategyKing',
    email: 'strategy@playforge.com',
    elo_rating: 1920,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
]

// Current logged-in user
let currentUser: User = {
  id: 'current-user',
  username: 'DemoPlayer',
  email: 'demo@playforge.com',
  elo_rating: 1500,
  created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  updated_at: new Date().toISOString(),
}

// Mock Games
const mockGames: Game[] = [
  {
    id: 'game-1',
    type: 'tictactoe',
    status: 'completed',
    player1_id: 'current-user',
    player2_id: 'user-2',
    player1_name: 'DemoPlayer',
    player2_name: 'ProPlayer',
    current_turn: 'user-2',
    winner_id: 'user-2',
    state: {
      board: [['X', 'O', 'X'], ['O', 'X', 'O'], ['O', 'X', 'X']],
      player1_id: 'current-user',
      player2_id: 'user-2',
      current_player: 'user-2',
      move_count: 9,
      grid_size: 3,
      win_length: 3,
    },
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    ended_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'game-2',
    type: 'connect4',
    status: 'completed',
    player1_id: 'current-user',
    player2_id: 'user-1',
    player1_name: 'DemoPlayer',
    player2_name: 'GameMaster',
    current_turn: 'current-user',
    winner_id: 'current-user',
    state: {
      board: Array(6).fill(null).map(() => Array(7).fill('')),
      player1_id: 'current-user',
      player2_id: 'user-1',
      current_player: 'current-user',
      move_count: 14,
      rows: 6,
      cols: 7,
      win_length: 4,
    },
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    started_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    ended_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
]

// Mock Stats
const mockStats: PlayerStats[] = [
  {
    id: 'stats-1',
    user_id: 'current-user',
    game_type: 'tictactoe',
    wins: 15,
    losses: 12,
    draws: 5,
    current_streak: 2,
    best_streak: 7,
    total_games: 32,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'stats-2',
    user_id: 'current-user',
    game_type: 'connect4',
    wins: 22,
    losses: 18,
    draws: 3,
    current_streak: 4,
    best_streak: 9,
    total_games: 43,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'stats-3',
    user_id: 'current-user',
    game_type: 'rps',
    wins: 18,
    losses: 15,
    draws: 7,
    current_streak: 1,
    best_streak: 5,
    total_games: 40,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'stats-4',
    user_id: 'current-user',
    game_type: 'dotsandboxes',
    wins: 10,
    losses: 8,
    draws: 2,
    current_streak: 3,
    best_streak: 6,
    total_games: 20,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
]

// Mock Rooms
const mockRooms: Room[] = []

// Helper to generate random ID
const generateId = () => Math.random().toString(36).substring(2, 15)

// Delay helper for realistic API simulation
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Mock Auth API
export const mockAuthApi = {
  signup: async (data: SignupRequest): Promise<AuthResponse> => {
    await delay(500)
    currentUser = {
      id: generateId(),
      username: data.username,
      email: data.email,
      elo_rating: 1500,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    return {
      user: currentUser,
      access_token: 'mock-access-token-' + generateId(),
      refresh_token: 'mock-refresh-token-' + generateId(),
    }
  },

  login: async (_data: LoginRequest): Promise<AuthResponse> => {
    await delay(500)
    // For demo, accept any credentials
    return {
      user: currentUser,
      access_token: 'mock-access-token-' + generateId(),
      refresh_token: 'mock-refresh-token-' + generateId(),
    }
  },

  logout: async (): Promise<void> => {
    await delay(300)
    // Nothing to do in mock
  },

  refreshToken: async (_refreshToken: string): Promise<AuthResponse> => {
    await delay(400)
    return {
      user: currentUser,
      access_token: 'mock-access-token-' + generateId(),
      refresh_token: 'mock-refresh-token-' + generateId(),
    }
  },

  getMe: async () => {
    await delay(200)
    return { user: currentUser }
  },
}

// Mock Game API
export const mockGameApi = {
  createGame: async (gameType: string) => {
    await delay(300)
    const newGame: Game = {
      id: generateId(),
      type: gameType as GameType,
      status: 'waiting',
      player1_id: currentUser.id,
      player2_id: '',
      player1_name: currentUser.username,
      player2_name: '',
      current_turn: currentUser.id,
      state: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    mockGames.push(newGame)
    return { game: newGame }
  },

  joinGame: async (gameId: string) => {
    await delay(300)
    const game = mockGames.find(g => g.id === gameId)
    if (!game) throw new Error('Game not found')
    
    game.player2_id = currentUser.id
    game.player2_name = currentUser.username
    game.status = 'active'
    game.updated_at = new Date().toISOString()
    
    return { game }
  },

  getGame: async (gameId: string) => {
    await delay(200)
    const game = mockGames.find(g => g.id === gameId)
    if (!game) throw new Error('Game not found')
    return { game }
  },

  joinAsSpectator: async (_gameId: string) => {
    await delay(200)
    return { success: true }
  },

  leaveAsSpectator: async (_gameId: string) => {
    await delay(200)
  },

  getSpectators: async (_gameId: string) => {
    await delay(200)
    return { spectators: [] }
  },
}

// Mock Stats API
export const mockStatsApi = {
  getMyStats: async () => {
    await delay(300)
    // Return aggregated stats across all games
    const totalStats = {
      id: 'aggregate',
      user_id: 'current-user',
      game_type: 'all',
      wins: mockStats.reduce((sum, s) => sum + s.wins, 0),
      losses: mockStats.reduce((sum, s) => sum + s.losses, 0),
      draws: mockStats.reduce((sum, s) => sum + s.draws, 0),
      current_streak: 3,
      best_streak: 9,
      total_games: mockStats.reduce((sum, s) => sum + s.total_games, 0),
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }
    return totalStats
  },

  getStatsByGameType: async (gameType: string) => {
    await delay(300)
    const stats = mockStats.find(s => s.game_type === gameType)
    return stats || null
  },
}

// Mock Matchmaking API
export const mockMatchmakingApi = {
  joinQueue: async (_data: MatchmakingRequest): Promise<MatchmakingResponse> => {
    await delay(500)
    const queueEntry = {
      id: generateId(),
      user_id: currentUser.id,
      username: currentUser.username,
      game_type: _data.game_type,
      rating: currentUser.elo_rating,
      status: 'queued' as const,
      queued_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    }
    return {
      queue_entry: queueEntry,
      message: 'Joined matchmaking queue',
    }
  },

  leaveQueue: async (): Promise<void> => {
    await delay(300)
  },

  getQueueStatus: async (): Promise<QueueStatusResponse> => {
    await delay(200)
    return {
      in_queue: false,
    }
  },
}

// Mock Room API
export const mockRoomApi = {
  createRoom: async (data: CreateRoomRequest): Promise<RoomResponse> => {
    await delay(400)
    const newRoom: Room = {
      id: generateId(),
      type: data.type,
      status: 'waiting',
      game_type: data.game_type,
      game_settings: data.game_settings,
      join_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
      host_id: currentUser.id,
      max_players: data.max_players,
      participants: [
        {
          user_id: currentUser.id,
          username: currentUser.username,
          role: 'host',
          is_ready: false,
          joined_at: new Date().toISOString(),
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    }
    mockRooms.push(newRoom)
    return { room: newRoom, message: 'Room created successfully' }
  },

  getRoom: async (roomId: string): Promise<Room> => {
    await delay(200)
    const room = mockRooms.find(r => r.id === roomId)
    if (!room) throw new Error('Room not found')
    return room
  },

  joinRoom: async (roomId: string): Promise<RoomResponse> => {
    await delay(300)
    const room = mockRooms.find(r => r.id === roomId)
    if (!room) throw new Error('Room not found')
    
    room.participants.push({
      user_id: currentUser.id,
      username: currentUser.username,
      role: 'player',
      is_ready: false,
      joined_at: new Date().toISOString(),
    })
    room.updated_at = new Date().toISOString()
    
    return { room, message: 'Joined room successfully' }
  },

  joinRoomByCode: async (data: JoinRoomRequest): Promise<RoomResponse> => {
    await delay(300)
    const room = mockRooms.find(r => r.join_code === data.join_code)
    if (!room) throw new Error('Room not found')
    
    room.participants.push({
      user_id: currentUser.id,
      username: currentUser.username,
      role: 'player',
      is_ready: false,
      joined_at: new Date().toISOString(),
    })
    room.updated_at = new Date().toISOString()
    
    return { room, message: 'Joined room successfully' }
  },

  leaveRoom: async (roomId: string): Promise<void> => {
    await delay(300)
    const room = mockRooms.find(r => r.id === roomId)
    if (room) {
      room.participants = room.participants.filter(p => p.user_id !== currentUser.id)
      room.updated_at = new Date().toISOString()
    }
  },

  setReady: async (roomId: string, isReady: boolean): Promise<RoomResponse> => {
    await delay(200)
    const room = mockRooms.find(r => r.id === roomId)
    if (!room) throw new Error('Room not found')
    
    const participant = room.participants.find(p => p.user_id === currentUser.id)
    if (participant) {
      participant.is_ready = isReady
    }
    room.updated_at = new Date().toISOString()
    
    return { room, message: 'Ready status updated' }
  },

  startGame: async (roomId: string): Promise<RoomResponse> => {
    await delay(500)
    const room = mockRooms.find(r => r.id === roomId)
    if (!room) throw new Error('Room not found')
    
    room.status = 'active'
    room.game_id = generateId()
    room.started_at = new Date().toISOString()
    room.updated_at = new Date().toISOString()
    
    return { room, message: 'Game started' }
  },
}

