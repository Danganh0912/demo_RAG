import { create } from 'zustand'
import useCallAPI from '@/utils/useCallAPI'
import { URL_API } from '@/utils/urlAPI'

export type UserData = {
  user_id: number
  username: string
  email: string
  created_at?: string
}

type AuthState = {
  user: UserData | null
  loading: boolean
  error: string | null
  login: (credentials: { email: string; password: string }) => Promise<void>
  register: (info: { username: string; email: string; password: string }) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,

  login: async (credentials) => {
    try {
      set({ loading: true, error: null })

      const response = await useCallAPI({method: 'POST' ,url: `${URL_API}login`, data: credentials ,showToast: true})

      const { code, status, data, message } = response

      if (code === 200 && status === 1) {
        set({ user: data, loading: false })
      } else {
        set({ error: message || 'Login failed', loading: false })
      }
    } catch (error: any) {
      set({ error: error.message || 'Something went wrong', loading: false })
    }
  },

  register: async (info) => {
    try {
      set({ loading: true, error: null })

      const response = await useCallAPI({method: 'POST' ,url: `${URL_API}register`, data: info, showToast: true})

      const { code, status, data, message } = response

      if (code === 201 && status === 1) {
        set({ user: data, loading: false })
      } else {
        set({ error: message || 'Registration failed', loading: false })
      }
    } catch (error: any) {
      set({ error: error.message || 'Something went wrong', loading: false })
    }
  },

  logout: () => set({ user: null }),
}))
