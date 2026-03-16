'use client'

import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react'
import type { User, AuthState } from '@/types'

type AuthAction =
  | { type: 'SET_USER'; payload: User }
  | { type: 'CLEAR_USER' }
  | { type: 'SET_LOADING'; payload: boolean }

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, isLoading: false }
    case 'CLEAR_USER':
      return { ...state, user: null, isLoading: false }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    default:
      return state
  }
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (data: { email: string; password: string; firstName: string; lastName: string; country?: string }) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, { user: null, isLoading: true })

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const { user } = await res.json()
        dispatch({ type: 'SET_USER', payload: user })
      } else {
        dispatch({ type: 'CLEAR_USER' })
      }
    } catch {
      dispatch({ type: 'CLEAR_USER' })
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const { error } = await res.json()
      throw new Error(error || 'Login failed')
    }
    const { user } = await res.json()
    dispatch({ type: 'SET_USER', payload: user })
  }

  const register = async (data: { email: string; password: string; firstName: string; lastName: string; country?: string }) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const { error } = await res.json()
      throw new Error(error || 'Registration failed')
    }
    const { user } = await res.json()
    dispatch({ type: 'SET_USER', payload: user })
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    dispatch({ type: 'CLEAR_USER' })
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
