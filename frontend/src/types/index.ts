export interface User {
  id: string
  username: string
  email: string
  elo_rating: number
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  user: User
  access_token: string
  refresh_token: string
}

export interface SignupRequest {
  username: string
  email: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface ApiError {
  error: string
  code: number
}


