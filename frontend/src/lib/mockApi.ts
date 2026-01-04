import type { AuthResponse, User, LoginRequest, SignupRequest } from '../types'
import type { Game, GameType } from '../types/game'
import type { PlayerStats } from './api'
import type { Room, CreateRoomRequest, JoinRoomRequest, RoomResponse } from '../types/room'
import type { MatchmakingRequest, MatchmakingResponse, QueueStatusResponse } from '../types/matchmaking'

// Mock Users Database with predefined users
export const mockUsersDatabase: { [username: string]: User } = {
  'alice': {
    id: 'user-alice',
    username: 'alice',
    email: 'alice@playforge.com',
    elo_rating: 1650,
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  'bob': {
    id: 'user-bob',
    username: 'bob',
    email: 'bob@playforge.com',
    elo_rating: 1580,
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  'charlie': {
    id: 'user-charlie',
    username: 'charlie',
    email: 'charlie@playforge.com',
    elo_rating: 1720,
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  'diana': {
    id: 'user-diana',
    username: 'diana',
    email: 'diana@playforge.com',
    elo_rating: 1890,
    created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
}

// Mock Users (exported for potential use)
export const mockUsers: User[] = Object.values(mockUsersDatabase)

// Current logged-in user
let currentUser: User = mockUsersDatabase['alice']

// Mock Stats Database - per user
const mockStatsDatabase: { [userId: string]: PlayerStats[] } = {
  'user-alice': [
    {
      id: 'stats-alice-1',
      user_id: 'user-alice',
      game_type: 'tictactoe',
      wins: 18,
      losses: 10,
      draws: 4,
      current_streak: 3,
      best_streak: 8,
      total_games: 32,
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'stats-alice-2',
      user_id: 'user-alice',
      game_type: 'connect4',
      wins: 25,
      losses: 15,
      draws: 2,
      current_streak: 5,
      best_streak: 10,
      total_games: 42,
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'stats-alice-3',
      user_id: 'user-alice',
      game_type: 'rps',
      wins: 20,
      losses: 12,
      draws: 8,
      current_streak: 2,
      best_streak: 6,
      total_games: 40,
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'stats-alice-4',
      user_id: 'user-alice',
      game_type: 'dotsandboxes',
      wins: 12,
      losses: 6,
      draws: 1,
      current_streak: 4,
      best_streak: 7,
      total_games: 19,
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  'user-bob': [
    {
      id: 'stats-bob-1',
      user_id: 'user-bob',
      game_type: 'tictactoe',
      wins: 12,
      losses: 14,
      draws: 3,
      current_streak: 1,
      best_streak: 5,
      total_games: 29,
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'stats-bob-2',
      user_id: 'user-bob',
      game_type: 'connect4',
      wins: 18,
      losses: 20,
      draws: 1,
      current_streak: 2,
      best_streak: 7,
      total_games: 39,
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'stats-bob-3',
      user_id: 'user-bob',
      game_type: 'rps',
      wins: 15,
      losses: 17,
      draws: 6,
      current_streak: 0,
      best_streak: 4,
      total_games: 38,
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'stats-bob-4',
      user_id: 'user-bob',
      game_type: 'dotsandboxes',
      wins: 8,
      losses: 9,
      draws: 2,
      current_streak: 1,
      best_streak: 4,
      total_games: 19,
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
}

// Mock Match History - per user
const mockMatchHistoryDatabase: { [userId: string]: any[] } = {
  'user-alice': [
    {
      id: 'match-alice-1',
      game_type: 'tictactoe',
      player1_id: 'user-alice',
      player1_name: 'alice',
      player2_id: 'user-bob',
      player2_name: 'bob',
      winner_id: 'user-alice',
      status: 'completed',
      started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      ended_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'match-alice-2',
      game_type: 'connect4',
      player1_id: 'user-alice',
      player1_name: 'alice',
      player2_id: 'user-charlie',
      player2_name: 'charlie',
      winner_id: 'user-alice',
      status: 'completed',
      started_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      ended_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'match-alice-3',
      game_type: 'rps',
      player1_id: 'user-diana',
      player1_name: 'diana',
      player2_id: 'user-alice',
      player2_name: 'alice',
      winner_id: null,
      status: 'completed',
      started_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      ended_at: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'match-alice-4',
      game_type: 'tictactoe',
      player1_id: 'user-bob',
      player1_name: 'bob',
      player2_id: 'user-alice',
      player2_name: 'alice',
      winner_id: 'user-bob',
      status: 'completed',
      started_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      ended_at: new Date(Date.now() - 47 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'match-alice-5',
      game_type: 'dotsandboxes',
      player1_id: 'user-alice',
      player1_name: 'alice',
      player2_id: 'user-diana',
      player2_name: 'diana',
      winner_id: 'user-alice',
      status: 'completed',
      started_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
      ended_at: new Date(Date.now() - 71 * 60 * 60 * 1000).toISOString(),
    },
  ],
  'user-bob': [
    {
      id: 'match-bob-1',
      game_type: 'tictactoe',
      player1_id: 'user-alice',
      player1_name: 'alice',
      player2_id: 'user-bob',
      player2_name: 'bob',
      winner_id: 'user-alice',
      status: 'completed',
      started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      ended_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'match-bob-2',
      game_type: 'connect4',
      player1_id: 'user-bob',
      player1_name: 'bob',
      player2_id: 'user-charlie',
      player2_name: 'charlie',
      winner_id: 'user-charlie',
      status: 'completed',
      started_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      ended_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
  ],
}

// Mock Notifications - per user
const mockNotificationsDatabase: { [userId: string]: any[] } = {
  'user-alice': [
    {
      id: 'notif-alice-1',
      type: 'tournament_started',
      title: 'Tournament Started!',
      message: 'The "Friday Night Championship" tournament has begun. Your first match is ready.',
      data: {
        tournament_id: 'tournament-1',
        tournament_name: 'Friday Night Championship',
      },
      read: false,
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-alice-2',
      type: 'player_joined',
      title: 'Player Joined',
      message: 'bob has joined your tournament "Weekend Warriors".',
      data: {
        tournament_id: 'tournament-2',
        tournament_name: 'Weekend Warriors',
      },
      read: false,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'notif-alice-3',
      type: 'invitation_accepted',
      title: 'Invitation Accepted',
      message: 'charlie accepted your tournament invitation.',
      data: {},
      read: true,
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  'user-bob': [
    {
      id: 'notif-bob-1',
      type: 'invitation_received',
      title: 'Tournament Invitation',
      message: 'alice invited you to join "Weekend Warriors" tournament.',
      data: {
        tournament_id: 'tournament-2',
        invitation_id: 'invite-bob-1',
        tournament_name: 'Weekend Warriors',
      },
      read: false,
      created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
  ],
}

// Mock Tournaments
const mockTournaments: any[] = [
  {
    id: 'tournament-1',
    name: 'Friday Night Championship',
    game_type: 'tictactoe',
    tournament_type: 'single_elimination',
    status: 'in_progress',
    max_participants: 8,
    is_private: false,
    participants: [
      { user_id: 'user-alice', username: 'alice', status: 'active' },
      { user_id: 'user-bob', username: 'bob', status: 'active' },
      { user_id: 'user-charlie', username: 'charlie', status: 'active' },
      { user_id: 'user-diana', username: 'diana', status: 'active' },
    ],
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'tournament-2',
    name: 'Weekend Warriors',
    game_type: 'connect4',
    tournament_type: 'single_elimination',
    status: 'pending',
    max_participants: 4,
    is_private: false,
    participants: [
      { user_id: 'user-alice', username: 'alice', status: 'pending' },
      { user_id: 'user-charlie', username: 'charlie', status: 'pending' },
    ],
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'tournament-3',
    name: 'RPS Masters',
    game_type: 'rps',
    tournament_type: 'single_elimination',
    status: 'complete',
    max_participants: 8,
    is_private: false,
    participants: [
      { user_id: 'user-bob', username: 'bob', status: 'eliminated' },
      { user_id: 'user-charlie', username: 'charlie', status: 'eliminated' },
      { user_id: 'user-diana', username: 'diana', status: 'winner' },
    ],
    winner_id: 'user-diana',
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
]

// Mock Invitations - per user
const mockInvitationsDatabase: { [userId: string]: any[] } = {
  'user-alice': [],
  'user-bob': [
    {
      id: 'invite-bob-1',
      tournament_id: 'tournament-2',
      tournament_name: 'Weekend Warriors',
      game_type: 'connect4',
      inviter_name: 'alice',
      status: 'pending',
      created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      expires_at: new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString(),
    },
  ],
}

// Mock Games
const mockGames: Game[] = []

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
    const username = data.username.toLowerCase()
    
    // Check if user already exists in database
    if (mockUsersDatabase[username]) {
      currentUser = mockUsersDatabase[username]
    } else {
      // Create new user
      const newUser: User = {
        id: 'user-' + username,
        username: data.username,
        email: data.email,
        elo_rating: 1500,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      mockUsersDatabase[username] = newUser
      currentUser = newUser
      
      // Initialize empty stats for new user
      mockStatsDatabase[newUser.id] = []
      mockMatchHistoryDatabase[newUser.id] = []
      mockNotificationsDatabase[newUser.id] = []
      mockInvitationsDatabase[newUser.id] = []
    }
    
    return {
      user: currentUser,
      access_token: 'mock-access-token-' + generateId(),
      refresh_token: 'mock-refresh-token-' + generateId(),
    }
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    await delay(500)
    // Extract username from email (e.g., "alice@example.com" -> "alice")
    const username = data.email.split('@')[0].toLowerCase()
    
    // Check if user exists in mock database
    if (mockUsersDatabase[username]) {
      currentUser = mockUsersDatabase[username]
    } else {
      // Create a new mock user for this username
      const newUser: User = {
        id: 'user-' + username,
        username: username,
        email: data.email,
        elo_rating: 1500,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      mockUsersDatabase[username] = newUser
      currentUser = newUser
      
      // Initialize empty data for new user
      mockStatsDatabase[newUser.id] = []
      mockMatchHistoryDatabase[newUser.id] = []
      mockNotificationsDatabase[newUser.id] = []
      mockInvitationsDatabase[newUser.id] = []
    }
    
    console.log('[MockAPI] Logged in as:', currentUser.username, 'with ID:', currentUser.id)
    
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
    const userStats = mockStatsDatabase[currentUser.id] || []
    
    // Return aggregated stats across all games
    const totalStats = {
      id: 'aggregate-' + currentUser.id,
      user_id: currentUser.id,
      game_type: 'all',
      wins: userStats.reduce((sum, s) => sum + s.wins, 0),
      losses: userStats.reduce((sum, s) => sum + s.losses, 0),
      draws: userStats.reduce((sum, s) => sum + s.draws, 0),
      current_streak: userStats.length > 0 ? Math.max(...userStats.map(s => s.current_streak)) : 0,
      best_streak: userStats.length > 0 ? Math.max(...userStats.map(s => s.best_streak)) : 0,
      total_games: userStats.reduce((sum, s) => sum + s.total_games, 0),
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }
    return totalStats
  },

  getStatsByGameType: async (gameType: string) => {
    await delay(300)
    const userStats = mockStatsDatabase[currentUser.id] || []
    const stats = userStats.find(s => s.game_type === gameType)
    
    // Return empty stats if not found
    if (!stats) {
      return {
        id: `stats-${currentUser.id}-${gameType}`,
        user_id: currentUser.id,
        game_type: gameType,
        wins: 0,
        losses: 0,
        draws: 0,
        current_streak: 0,
        best_streak: 0,
        total_games: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }
    
    return stats
  },

  getLeaderboard: async (gameType: string) => {
    await delay(400)
    
    // Generate leaderboard from all users
    const entries = Object.values(mockUsersDatabase).map(user => {
      const userStats = mockStatsDatabase[user.id] || []
      let stats
      
      if (gameType === 'all') {
        stats = {
          wins: userStats.reduce((sum, s) => sum + s.wins, 0),
          losses: userStats.reduce((sum, s) => sum + s.losses, 0),
          draws: userStats.reduce((sum, s) => sum + s.draws, 0),
          total_games: userStats.reduce((sum, s) => sum + s.total_games, 0),
        }
      } else {
        const gameStat = userStats.find(s => s.game_type === gameType)
        stats = gameStat ? {
          wins: gameStat.wins,
          losses: gameStat.losses,
          draws: gameStat.draws,
          total_games: gameStat.total_games,
        } : { wins: 0, losses: 0, draws: 0, total_games: 0 }
      }
      
      return {
        user_id: user.id,
        username: user.username,
        elo_rating: user.elo_rating,
        ...stats,
      }
    })
    
    // Sort by ELO rating descending
    entries.sort((a, b) => b.elo_rating - a.elo_rating)
    
    return {
      game_type: gameType,
      entries,
    }
  },

  getMatchHistory: async (gameType: string) => {
    await delay(400)
    const userMatches = mockMatchHistoryDatabase[currentUser.id] || []
    
    // Filter by game type if not 'all'
    const matches = gameType === 'all' 
      ? userMatches 
      : userMatches.filter(m => m.game_type === gameType)
    
    return {
      game_type: gameType,
      matches,
    }
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

// Mock Tournament API
export const mockTournamentApi = {
  getTournaments: async (params?: URLSearchParams) => {
    await delay(400)
    let tournaments = [...mockTournaments]
    
    // Filter by status if provided
    const status = params?.get('status')
    if (status) {
      tournaments = tournaments.filter(t => t.status === status)
    }
    
    return { tournaments }
  },

  getTournament: async (tournamentId: string) => {
    await delay(300)
    const tournament = mockTournaments.find(t => t.id === tournamentId)
    if (!tournament) throw new Error('Tournament not found')
    return { tournament }
  },

  createTournament: async (data: any) => {
    await delay(500)
    const tournament = {
      id: generateId(),
      name: data.name,
      game_type: data.game_type,
      tournament_type: data.tournament_type,
      status: 'pending',
      max_participants: data.max_participants,
      is_private: data.is_private || false,
      join_code: data.is_private ? Math.random().toString(36).substring(2, 8).toUpperCase() : undefined,
      participants: [{
        user_id: currentUser.id,
        username: currentUser.username,
        status: 'pending',
      }],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    mockTournaments.push(tournament)
    return { tournament }
  },

  joinTournament: async (tournamentId: string) => {
    await delay(400)
    const tournament = mockTournaments.find(t => t.id === tournamentId)
    if (!tournament) throw new Error('Tournament not found')
    
    // Check if already joined
    if (tournament.participants.some((p: any) => p.user_id === currentUser.id)) {
      return { tournament, message: 'Already joined' }
    }
    
    tournament.participants.push({
      user_id: currentUser.id,
      username: currentUser.username,
      status: 'pending',
    })
    tournament.updated_at = new Date().toISOString()
    
    return { tournament, message: 'Joined tournament' }
  },

  leaveTournament: async (tournamentId: string) => {
    await delay(300)
    const tournament = mockTournaments.find(t => t.id === tournamentId)
    if (!tournament) throw new Error('Tournament not found')
    
    tournament.participants = tournament.participants.filter((p: any) => p.user_id !== currentUser.id)
    tournament.updated_at = new Date().toISOString()
  },
}

// Mock Notification API
export const mockNotificationApi = {
  getNotifications: async (params?: URLSearchParams) => {
    await delay(300)
    const userNotifications = mockNotificationsDatabase[currentUser.id] || []
    const limit = parseInt(params?.get('limit') || '50')
    
    const notifications = userNotifications.slice(0, limit)
    const unread = notifications.filter(n => !n.read).length
    
    return {
      notifications,
      total: userNotifications.length,
      unread,
    }
  },

  markAsRead: async (notificationId: string) => {
    await delay(200)
    const userNotifications = mockNotificationsDatabase[currentUser.id] || []
    const notification = userNotifications.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
    }
  },

  markAllAsRead: async () => {
    await delay(300)
    const userNotifications = mockNotificationsDatabase[currentUser.id] || []
    userNotifications.forEach(n => n.read = true)
  },

  deleteNotification: async (notificationId: string) => {
    await delay(200)
    const userNotifications = mockNotificationsDatabase[currentUser.id]
    if (userNotifications) {
      const index = userNotifications.findIndex(n => n.id === notificationId)
      if (index !== -1) {
        userNotifications.splice(index, 1)
      }
    }
  },
}

// Mock Invitation API
export const mockInvitationApi = {
  getInvitations: async () => {
    await delay(300)
    const userInvitations = mockInvitationsDatabase[currentUser.id] || []
    return { invitations: userInvitations }
  },

  acceptInvitation: async (invitationId: string) => {
    await delay(400)
    const userInvitations = mockInvitationsDatabase[currentUser.id] || []
    const invitation = userInvitations.find(i => i.id === invitationId)
    
    if (!invitation) throw new Error('Invitation not found')
    
    invitation.status = 'accepted'
    
    // Add user to tournament
    const tournament = mockTournaments.find(t => t.id === invitation.tournament_id)
    if (tournament && !tournament.participants.some((p: any) => p.user_id === currentUser.id)) {
      tournament.participants.push({
        user_id: currentUser.id,
        username: currentUser.username,
        status: 'pending',
      })
    }
    
    return { message: 'Invitation accepted' }
  },

  declineInvitation: async (invitationId: string) => {
    await delay(300)
    const userInvitations = mockInvitationsDatabase[currentUser.id]
    if (userInvitations) {
      const index = userInvitations.findIndex(i => i.id === invitationId)
      if (index !== -1) {
        userInvitations[index].status = 'declined'
      }
    }
    return { message: 'Invitation declined' }
  },
}

// Mock Profile API
export const mockProfileApi = {
  getProfile: async (username: string) => {
    await delay(300)
    const user = Object.values(mockUsersDatabase).find(u => u.username.toLowerCase() === username.toLowerCase())
    
    if (!user) {
      throw new Error('User not found')
    }
    
    return {
      user_id: user.id,
      username: user.username,
      elo_rating: user.elo_rating,
    }
  },
}

