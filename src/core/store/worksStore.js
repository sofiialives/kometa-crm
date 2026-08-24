import { create } from 'zustand'
import { api } from '../api/client'

// Видимость применяет бэк (listWorksVisibleTo): admin — все работы,
// остальные — только свой отдел.
export const useWorksStore = create((set, get) => ({
  works: [],
  loading: false,
  error: null,

  async fetchWorks() {
    set({ loading: true, error: null })
    try {
      const works = await api.get('/works')
      set({ works, loading: false })
      return { ok: true }
    } catch (e) {
      set({ error: e.message, loading: false })
      return { ok: false, error: e.message }
    }
  },

  async createWork({ clientName, title, departmentId, assignees }) {
    set({ error: null })
    try {
      const work = await api.post('/works', { clientName, title, departmentId, assignees })
      set({ works: [work, ...get().works] })
      return { ok: true, work }
    } catch (e) {
      set({ error: e.message })
      return { ok: false, error: e.message }
    }
  },

  async updateWork(id, patch) {
    set({ error: null })
    try {
      const updated = await api.patch(`/works/${id}`, patch)
      set({ works: get().works.map((w) => (w.id === id ? { ...w, ...updated } : w)) })
      return { ok: true, work: updated }
    } catch (e) {
      set({ error: e.message })
      return { ok: false, error: e.message }
    }
  },

  async deleteWork(id) {
    set({ error: null })
    try {
      await api.del(`/works/${id}`)
      set({ works: get().works.filter((w) => w.id !== id) })
      return { ok: true }
    } catch (e) {
      set({ error: e.message })
      return { ok: false, error: e.message }
    }
  },

  /**
   * Клиента как отдельной сущности в базе нет — это просто повторяющееся
   * clientName внутри Work. Удаление сносит разом все работы этого
   * клиента (во всех отделах, раз это делает только admin), их задачи
   * не теряются — отвязываются от работы, как и при удалении одной.
   */
  async deleteClient(clientName) {
    set({ error: null })
    try {
      await api.del(`/works/client/${encodeURIComponent(clientName)}`)
      set({ works: get().works.filter((w) => w.clientName !== clientName) })
      return { ok: true }
    } catch (e) {
      set({ error: e.message })
      return { ok: false, error: e.message }
    }
  },
}))
