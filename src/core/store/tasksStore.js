import { create } from 'zustand'
import { api } from '../api/client'

/**
 * Видимость и права уже применены на бэке (task.service.js →
 * listTasksVisibleTo): staff получает только свои задачи, lead — весь
 * свой отдел, admin — вообще всё. Стор просто хранит то, что вернул сервер,
 * без дублирования этой логики на фронте.
 */
export const useTasksStore = create((set, get) => ({
  tasks: [],
  loading: false,
  error: null,

  async fetchTasks() {
    set({ loading: true, error: null })
    try {
      const tasks = await api.get('/tasks')
      set({ tasks, loading: false })
      return { ok: true }
    } catch (e) {
      set({ error: e.message, loading: false })
      return { ok: false, error: e.message }
    }
  },

  async createTask({ title, description, deadline, workId, ownerId }) {
    set({ error: null })
    try {
      const task = await api.post('/tasks', {
        title,
        description: description || undefined,
        deadline,
        ...(workId ? { workId } : {}),
        ...(ownerId ? { ownerId } : {}),
      })
      set({ tasks: [task, ...get().tasks] })
      return { ok: true }
    } catch (e) {
      set({ error: e.message })
      return { ok: false, error: e.message }
    }
  },

  async moveTask(id, status) {
    try {
      const updated = await api.patch(`/tasks/${id}/status`, { status })
      set({ tasks: get().tasks.map((t) => (t.id === id ? updated : t)) })
      return { ok: true }
    } catch (e) {
      set({ error: e.message })
      return { ok: false, error: e.message }
    }
  },

  async extendDeadline(id, deadline) {
    try {
      const updated = await api.patch(`/tasks/${id}/deadline`, { deadline })
      set({ tasks: get().tasks.map((t) => (t.id === id ? updated : t)) })
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  },

  async editTask(id, patch) {
    try {
      const updated = await api.patch(`/tasks/${id}`, patch)
      set({ tasks: get().tasks.map((t) => (t.id === id ? updated : t)) })
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  },

  async removeTask(id) {
    try {
      await api.del(`/tasks/${id}`)
      set({ tasks: get().tasks.filter((t) => t.id !== id) })
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  },
}))