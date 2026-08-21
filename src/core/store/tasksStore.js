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

  async createTask({ title, description, deadline, workId }) {
    set({ error: null })
    try {
      const task = await api.post('/tasks', {
        title,
        description: description || undefined,
        deadline,
        ...(workId ? { workId } : {}),
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
}))