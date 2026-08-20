import { create } from 'zustand'
import { api } from '../api/client'

export const useUsersStore = create((set, get) => ({
  users: [],
  loading: false,
  error: null,

  async fetchUsers() {
    set({ loading: true, error: null })
    try {
      const users = await api.get('/users')
      set({ users, loading: false })
      return { ok: true }
    } catch (e) {
      set({ error: e.message, loading: false })
      return { ok: false, error: e.message }
    }
  },

  async inviteUser({ email, role, position, departmentId }) {
    set({ error: null })
    try {
      const user = await api.post('/users', { email, role, position, departmentId })
      set({ users: [user, ...get().users] })
      return { ok: true }
    } catch (e) {
      set({ error: e.message })
      return { ok: false, error: e.message }
    }
  },

  async deactivateUser(id) {
    set({ error: null })
    try {
      const updated = await api.post(`/users/${id}/deactivate`)
      set({ users: get().users.map((u) => (u.id === id ? updated : u)) })
      return { ok: true }
    } catch (e) {
      set({ error: e.message })
      return { ok: false, error: e.message }
    }
  },
}))
