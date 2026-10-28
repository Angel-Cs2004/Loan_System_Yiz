import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as authApi from '../api/auth'
import { tokens } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(Boolean(tokens.access))

  const loadProfile = useCallback(async () => {
    const { data } = await authApi.getPerfil()
    setUser(data)
    return data
  }, [])

  useEffect(() => {
    if (!tokens.access) return
    loadProfile()
      .catch(() => tokens.clear())
      .finally(() => setChecking(false))
  }, [loadProfile])

  useEffect(() => {
    const expired = () => setUser(null)
    window.addEventListener('auth:expired', expired)
    return () => window.removeEventListener('auth:expired', expired)
  }, [])

  const login = useCallback(async (email, password) => {
    await authApi.login(email, password)
    return loadProfile()
  }, [loadProfile])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      tokens.clear()
    }
    setUser(null)
  }, [])

  const value = useMemo(() => ({
    user,
    checking,
    isAdmin: user?.tipo_usuario === 'ADMINISTRATOR',
    login,
    logout,
    setUser,
  }), [user, checking, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
