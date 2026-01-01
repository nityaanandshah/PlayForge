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

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
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

export default api



