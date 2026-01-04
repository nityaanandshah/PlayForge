import axios, { AxiosError } from 'axios'
import type { AuthResponse, LoginRequest, SignupRequest } from '../types'
import type { 
  CreateRoomRequest, 
  JoinRoomRequest, 
  Room, 
  RoomResponse 
} from '../types/room'
import type { 
  MatchmakingRequest, 
  MatchmakingResponse, 
  QueueStatusResponse 
} from '../types/matchmaking'
import {
  mockAuthApi,
  mockGameApi,
  mockStatsApi,
  mockMatchmakingApi,
  mockRoomApi,
  mockTournamentApi,
  mockNotificationApi,
  mockInvitationApi,
  mockProfileApi,
} from './mockApi'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true'

// Log current mode
console.log('[PlayForge] API Mode:', USE_MOCK_DATA ? 'MOCK DATA' : 'REAL API')
console.log('[PlayForge] API URL:', API_URL)

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token AND handle mock API routing
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // If using mock data, intercept requests and route to mock APIs
    if (USE_MOCK_DATA && config.url) {
      console.log('[MockAPI] Intercepting request:', config.method?.toUpperCase(), config.url)
      
      try {
        let mockResponse: any = null
        const url = config.url
        
        // Route to appropriate mock API based on URL
        if (url.includes('/tournaments') && config.method === 'get') {
          if (url.match(/\/tournaments\/[^/]+$/)) {
            const tournamentId = url.split('/').pop()!
            mockResponse = await mockTournamentApi.getTournament(tournamentId)
          } else {
            const params = new URLSearchParams(url.split('?')[1])
            mockResponse = await mockTournamentApi.getTournaments(params)
          }
        } else if (url.includes('/tournaments') && config.method === 'post') {
          if (url.includes('/create')) {
            mockResponse = await mockTournamentApi.createTournament(config.data)
          } else if (url.includes('/join')) {
            const tournamentId = url.split('/')[2]
            mockResponse = await mockTournamentApi.joinTournament(tournamentId)
          }
        } else if (url.includes('/invitations') && config.method === 'get') {
          mockResponse = await mockInvitationApi.getInvitations()
        } else if (url.includes('/invitations') && url.includes('/accept') && config.method === 'post') {
          const inviteId = url.split('/')[2]
          mockResponse = await mockInvitationApi.acceptInvitation(inviteId)
        } else if (url.includes('/invitations') && url.includes('/decline') && config.method === 'post') {
          const inviteId = url.split('/')[2]
          mockResponse = await mockInvitationApi.declineInvitation(inviteId)
        } else if (url.includes('/notifications') && config.method === 'get') {
          const params = new URLSearchParams(url.split('?')[1])
          mockResponse = await mockNotificationApi.getNotifications(params)
        } else if (url.includes('/notifications') && url.includes('/read-all') && config.method === 'post') {
          mockResponse = await mockNotificationApi.markAllAsRead()
        } else if (url.includes('/notifications') && url.includes('/read') && config.method === 'post') {
          const notifId = url.split('/')[2]
          mockResponse = await mockNotificationApi.markAsRead(notifId)
        } else if (url.includes('/notifications') && config.method === 'delete') {
          const notifId = url.split('/')[2]
          mockResponse = await mockNotificationApi.deleteNotification(notifId)
        } else if (url.includes('/stats/leaderboard')) {
          const params = new URLSearchParams(url.split('?')[1])
          const gameType = params.get('game_type') || 'all'
          mockResponse = await mockStatsApi.getLeaderboard(gameType)
        } else if (url.includes('/stats/history')) {
          const params = new URLSearchParams(url.split('?')[1])
          const gameType = params.get('game_type') || 'all'
          mockResponse = await mockStatsApi.getMatchHistory(gameType)
        } else if (url.includes('/profile/')) {
          const username = url.split('/profile/')[1]
          mockResponse = await mockProfileApi.getProfile(username)
        }
        
        // If we got a mock response, return it and cancel the real request
        if (mockResponse !== null) {
          console.log('[MockAPI] Returning mock response for:', url)
          // Create a fake successful response
          const fakeResponse = {
            data: mockResponse,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
          }
          
          // Cancel the request by throwing a special error with the response attached
          const cancelError: any = new Error('Mock API Response')
          cancelError.mockResponse = fakeResponse
          throw cancelError
        }
      } catch (error: any) {
        // If it's our special mock response error, return the mock response
        if (error.mockResponse) {
          return Promise.resolve(error.mockResponse)
        }
        // Otherwise re-throw the error
        throw error
      }
    }
    
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (!refreshToken) {
          throw new Error('No refresh token')
        }

        console.log('Token expired, refreshing...')
        const response = await axios.post<AuthResponse>(
          `${API_URL}/auth/refresh`,
          { refresh_token: refreshToken },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )

        const { access_token, refresh_token: new_refresh_token, user } = response.data
        localStorage.setItem('access_token', access_token)
        localStorage.setItem('refresh_token', new_refresh_token)
        if (user) {
          localStorage.setItem('user', JSON.stringify(user))
        }

        console.log('Token refreshed successfully, retrying original request...')
        // Update the original request with new token
        if (!originalRequest.headers) {
          originalRequest.headers = {}
        }
        originalRequest.headers.Authorization = `Bearer ${access_token}`
        
        // Retry the original request
        return api(originalRequest)
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError)
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export const authApi = {
  signup: async (data: SignupRequest): Promise<AuthResponse> => {
    if (USE_MOCK_DATA) return mockAuthApi.signup(data)
    const response = await api.post<AuthResponse>('/auth/signup', data)
    return response.data
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    if (USE_MOCK_DATA) return mockAuthApi.login(data)
    const response = await api.post<AuthResponse>('/auth/login', data)
    return response.data
  },

  logout: async (): Promise<void> => {
    if (USE_MOCK_DATA) return mockAuthApi.logout()
    await api.post('/auth/logout')
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    if (USE_MOCK_DATA) return mockAuthApi.refreshToken(refreshToken)
    const response = await api.post<AuthResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    })
    return response.data
  },

  getMe: async () => {
    if (USE_MOCK_DATA) return mockAuthApi.getMe()
    const response = await api.get('/auth/me')
    return response.data
  },
}

export const gameApi = {
  createGame: async (gameType: string) => {
    if (USE_MOCK_DATA) return mockGameApi.createGame(gameType)
    const response = await api.post('/games/create', { game_type: gameType })
    return response.data
  },

  joinGame: async (gameId: string) => {
    if (USE_MOCK_DATA) return mockGameApi.joinGame(gameId)
    const response = await api.post('/games/join', { game_id: gameId })
    return response.data
  },

  getGame: async (gameId: string) => {
    if (USE_MOCK_DATA) return mockGameApi.getGame(gameId)
    const response = await api.get(`/games/${gameId}`)
    return response.data
  },

  joinAsSpectator: async (gameId: string) => {
    if (USE_MOCK_DATA) return mockGameApi.joinAsSpectator(gameId)
    const response = await api.post(`/games/${gameId}/spectate`)
    return response.data
  },

  leaveAsSpectator: async (gameId: string) => {
    if (USE_MOCK_DATA) return mockGameApi.leaveAsSpectator(gameId)
    await api.delete(`/games/${gameId}/spectate`)
  },

  getSpectators: async (gameId: string) => {
    if (USE_MOCK_DATA) return mockGameApi.getSpectators(gameId)
    const response = await api.get(`/games/${gameId}/spectators`)
    return response.data
  },
}

export interface PlayerStats {
  id: string
  user_id: string
  game_type: string
  wins: number
  losses: number
  draws: number
  current_streak: number
  best_streak: number
  total_games: number
  created_at: string
  updated_at: string
}

export const statsApi = {
  getMyStats: async () => {
    if (USE_MOCK_DATA) return mockStatsApi.getMyStats()
    const response = await api.get('/stats/')
    return response.data
  },

  getStatsByGameType: async (gameType: string) => {
    if (USE_MOCK_DATA) return mockStatsApi.getStatsByGameType(gameType)
    const response = await api.get(`/stats/${gameType}`)
    return response.data
  },

  getLeaderboard: async (gameType: string, limit: number = 50) => {
    if (USE_MOCK_DATA) return mockStatsApi.getLeaderboard(gameType)
    const response = await api.get(`/stats/leaderboard?game_type=${gameType}&limit=${limit}`)
    return response.data
  },

  getMatchHistory: async (gameType: string, limit: number = 50) => {
    if (USE_MOCK_DATA) return mockStatsApi.getMatchHistory(gameType)
    const response = await api.get(`/stats/history?game_type=${gameType}&limit=${limit}`)
    return response.data
  },
}

export const matchmakingApi = {
  joinQueue: async (data: MatchmakingRequest): Promise<MatchmakingResponse> => {
    if (USE_MOCK_DATA) return mockMatchmakingApi.joinQueue(data)
    const response = await api.post<MatchmakingResponse>('/matchmaking/queue', data)
    return response.data
  },

  leaveQueue: async (): Promise<void> => {
    if (USE_MOCK_DATA) return mockMatchmakingApi.leaveQueue()
    await api.delete('/matchmaking/queue')
  },

  getQueueStatus: async (): Promise<QueueStatusResponse> => {
    if (USE_MOCK_DATA) return mockMatchmakingApi.getQueueStatus()
    const response = await api.get<QueueStatusResponse>('/matchmaking/status')
    return response.data
  },
}

export const roomApi = {
  createRoom: async (data: CreateRoomRequest): Promise<RoomResponse> => {
    if (USE_MOCK_DATA) return mockRoomApi.createRoom(data)
    const response = await api.post<RoomResponse>('/rooms/create', data)
    return response.data
  },

  getRoom: async (roomId: string): Promise<Room> => {
    if (USE_MOCK_DATA) return mockRoomApi.getRoom(roomId)
    const response = await api.get<Room>(`/rooms/${roomId}`)
    return response.data
  },

  joinRoom: async (roomId: string): Promise<RoomResponse> => {
    if (USE_MOCK_DATA) return mockRoomApi.joinRoom(roomId)
    const response = await api.post<RoomResponse>(`/rooms/${roomId}/join`)
    return response.data
  },

  joinRoomByCode: async (data: JoinRoomRequest): Promise<RoomResponse> => {
    if (USE_MOCK_DATA) return mockRoomApi.joinRoomByCode(data)
    const response = await api.post<RoomResponse>('/rooms/join', data)
    return response.data
  },

  leaveRoom: async (roomId: string): Promise<void> => {
    if (USE_MOCK_DATA) return mockRoomApi.leaveRoom(roomId)
    await api.post(`/rooms/${roomId}/leave`)
  },

  setReady: async (roomId: string, isReady: boolean): Promise<RoomResponse> => {
    if (USE_MOCK_DATA) return mockRoomApi.setReady(roomId, isReady)
    const response = await api.post<RoomResponse>(`/rooms/${roomId}/ready`, {
      is_ready: isReady,
    })
    return response.data
  },

  startGame: async (roomId: string): Promise<RoomResponse> => {
    if (USE_MOCK_DATA) return mockRoomApi.startGame(roomId)
    const response = await api.post<RoomResponse>(`/rooms/${roomId}/start`)
    return response.data
  },
}

// Tournament API - These routes are used but weren't explicitly exported
export const tournamentApi = {
  getTournaments: async (params?: URLSearchParams) => {
    if (USE_MOCK_DATA) return mockTournamentApi.getTournaments(params)
    const queryString = params ? `?${params.toString()}` : ''
    const response = await api.get(`/tournaments${queryString}`)
    return response.data
  },

  getTournament: async (tournamentId: string) => {
    if (USE_MOCK_DATA) return mockTournamentApi.getTournament(tournamentId)
    const response = await api.get(`/tournaments/${tournamentId}`)
    return response.data
  },

  createTournament: async (data: any) => {
    if (USE_MOCK_DATA) return mockTournamentApi.createTournament(data)
    const response = await api.post('/tournaments/create', data)
    return response.data
  },

  joinTournament: async (tournamentId: string, joinCode?: string) => {
    if (USE_MOCK_DATA) return mockTournamentApi.joinTournament(tournamentId)
    const response = await api.post(`/tournaments/${tournamentId}/join`, joinCode ? { join_code: joinCode } : {})
    return response.data
  },

  leaveTournament: async (tournamentId: string) => {
    if (USE_MOCK_DATA) return mockTournamentApi.leaveTournament(tournamentId)
    await api.post(`/tournaments/${tournamentId}/leave`)
  },
}

// Notification API
export const notificationApi = {
  getNotifications: async (params?: URLSearchParams) => {
    if (USE_MOCK_DATA) return mockNotificationApi.getNotifications(params)
    const queryString = params ? `?${params.toString()}` : ''
    const response = await api.get(`/notifications${queryString}`)
    return response.data
  },

  markAsRead: async (notificationId: string) => {
    if (USE_MOCK_DATA) return mockNotificationApi.markAsRead(notificationId)
    await api.post(`/notifications/${notificationId}/read`)
  },

  markAllAsRead: async () => {
    if (USE_MOCK_DATA) return mockNotificationApi.markAllAsRead()
    await api.post('/notifications/read-all')
  },

  deleteNotification: async (notificationId: string) => {
    if (USE_MOCK_DATA) return mockNotificationApi.deleteNotification(notificationId)
    await api.delete(`/notifications/${notificationId}`)
  },
}

// Invitation API
export const invitationApi = {
  getInvitations: async () => {
    if (USE_MOCK_DATA) return mockInvitationApi.getInvitations()
    const response = await api.get('/invitations')
    return response.data
  },

  acceptInvitation: async (invitationId: string) => {
    if (USE_MOCK_DATA) return mockInvitationApi.acceptInvitation(invitationId)
    const response = await api.post(`/invitations/${invitationId}/accept`)
    return response.data
  },

  declineInvitation: async (invitationId: string) => {
    if (USE_MOCK_DATA) return mockInvitationApi.declineInvitation(invitationId)
    const response = await api.post(`/invitations/${invitationId}/decline`)
    return response.data
  },
}

// Profile API
export const profileApi = {
  getProfile: async (username: string) => {
    if (USE_MOCK_DATA) return mockProfileApi.getProfile(username)
    const response = await api.get(`/profile/${username}`)
    return response.data
  },
}

export default api



