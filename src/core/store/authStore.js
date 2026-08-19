import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '../api/client'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      error: null,

      isAuthed: () => Boolean(get().token),
      isAdmin: () => get().user?.role === 'admin',
      isLead: () => get().user?.role === 'lead',

      async login({ email, password }) {
        set({ loading: true, error: null })
        try {
          const { user, token } = await mockLogin({ email, password })
          set({ user, token, loading: false })
          return { ok: true }
        } catch (e) {
          set({ error: e.message, loading: false })
          return { ok: false, error: e.message }
        }
      },

      async loginWithGoogle() {
        set({ error: null })
        try {
          await new Promise((r) => setTimeout(r, 600))
          const user = { id: 9, name: 'Google User', role: 'staff', departmentId: 1 }
          set({ user, token: 'mock-google' })
          return { ok: true }
        } catch (e) {
          set({ error: e.message })
          return { ok: false, error: e.message }
        }
      },

      logout() {
        set({ user: null, token: null, error: null })
      },
    }),
    { name: 'kometa-crm-auth' },
  ),
)

async function mockLogin({ email, password }) {
  await new Promise((r) => setTimeout(r, 500))
  if (email === 'admin@kometa.web3' && password === 'admin') {
    return { token: 'mock-admin', user: { id: 1, name: 'Ян', role: 'admin', departmentId: null } }
  }
  if (email === 'lead@kometa.web3' && password === 'lead') {
    return { token: 'mock-lead', user: { id: 2, name: 'София', role: 'lead', departmentId: 1 } }
  }
  if (password === '1234') {
    return { token: 'mock-staff', user: { id: 3, name: email.split('@')[0], role: 'staff', departmentId: 1 } }
  }
  throw new Error('Неверный email или пароль')
}
