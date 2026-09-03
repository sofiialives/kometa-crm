import { create } from 'zustand'
import { api } from '../api/client'

export const useUsersStore = create((set, get) => ({
  users: [],
  loading: false,
  error: null,
  // Копилка done/overdue на каждого сотрудника, которая переживает
  // ночную чистку Задачника — { [userId]: { doneCount, overdueCount } }.
  taskStats: {},

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

  async fetchTaskStats() {
    try {
      const rows = await api.get('/users/task-stats')
      const taskStats = {}
      for (const r of rows) taskStats[r.userId] = r
      set({ taskStats })
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  },

  async inviteUser({ email, role, position, departmentId }) {
    set({ error: null })
    try {
      const user = await api.post('/users', { email, role, position, departmentId })
      set({ users: [user, ...get().users] })
      return { ok: true, user }
    } catch (e) {
      set({ error: e.message })
      return { ok: false, error: e.message }
    }
  },

  async updateUser(id, patch) {
    set({ error: null })
    try {
      const updated = await api.patch(`/users/${id}`, patch)
      set({ users: get().users.map((u) => (u.id === id ? updated : u)) })
      return { ok: true, user: updated }
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