import { create } from 'zustand'
import { api } from '../api/client'

export const useDepartmentsStore = create((set, get) => ({
  departments: [],
  loading: false,
  error: null,

  async fetchDepartments() {
    set({ loading: true, error: null })
    try {
      const departments = await api.get('/departments')
      set({ departments, loading: false })
      return { ok: true }
    } catch (e) {
      set({ error: e.message, loading: false })
      return { ok: false, error: e.message }
    }
  },

  async createDepartment({ name, positions }) {
    set({ error: null })
    try {
      const dep = await api.post('/departments', { name, positions })
      set({ departments: [dep, ...get().departments] })
      return { ok: true }
    } catch (e) {
      set({ error: e.message })
      return { ok: false, error: e.message }
    }
  },

  async addPosition(departmentId, position) {
    const dep = get().departments.find((d) => d.id === departmentId)
    if (!dep) return { ok: false, error: 'Отдел не найден' }
    if (dep.positions.includes(position)) return { ok: true }

    const positions = [...dep.positions, position]
    try {
      const updated = await api.patch(`/departments/${departmentId}`, { positions })
      set({ departments: get().departments.map((d) => (d.id === departmentId ? updated : d)) })
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  },
}))
