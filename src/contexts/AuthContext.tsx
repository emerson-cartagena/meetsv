import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import * as bcrypt from 'bcryptjs'
import type { User } from '../types'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (email: string, password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restaurar sesión desde localStorage
    const stored = localStorage.getItem('mycalendar_user')
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch (e) {
        console.error('Error restoring session:', e)
      }
    }
    setLoading(false)
  }, [])

  async function login(email: string, password: string) {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    if (error || !user) {
      throw new Error('Usuario o contraseña incorrectos')
    }

    // Comparar con bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw new Error('Usuario o contraseña incorrectos')
    }

    setUser(user as User)
    localStorage.setItem('mycalendar_user', JSON.stringify(user))
  }

  async function logout() {
    setUser(null)
    localStorage.removeItem('mycalendar_user')
  }

  async function register(email: string, password: string) {
    // Solo admin puede crear nuevos usuarios (esto se validará después)
    if (!user?.id || user.role !== 'admin') {
      throw new Error('No autorizado')
    }

    // Encriptar contraseña con bcrypt
    const hashedPassword = await bcrypt.hash(password, 10)

    const { error } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'user',
      })

    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
