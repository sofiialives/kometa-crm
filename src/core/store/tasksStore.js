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

  /**
   * standalone: true — только личные задачи (без привязки к работе из
   * Иерархии). Личная доска «Задачи» всегда вызывает именно так — задачи
   * из Иерархии туда не должны попадать никогда, даже себе.
   */
  async fetchTasks({ standalone } = {}) {
    set({ loading: true, error: null })
    try {
      const query = standalone ? '?standalone=true' : ''
      const tasks = await api.get(`/tasks${query}`)
      set({ tasks, loading: false })
      return { ok: true }
    } catch (e) {
      set({ error: e.message, loading: false })
      return { ok: false, error: e.message }
    }
  },

  /**
   * ownerIds — массив: можно назначить задачу сразу нескольким людям
   * (только из Иерархии, lead/admin). Бэк создаёт отдельную задачу на
   * каждого и всегда возвращает массив, даже если исполнитель один.
   */
  async createTask({ title, description, deadline, startAt, workId, ownerIds, priority }) {
    set({ error: null })
    try {
      const created = await api.post('/tasks', {
        title,
        description: description || undefined,
        deadline,
        priority,
        // Только у «Задачи на день»: из Иерархии время начала не приходит.
        ...(startAt ? { startAt } : {}),
        ...(workId ? { workId } : {}),
        ...(ownerIds && ownerIds.length > 0 ? { ownerIds } : {}),
      })
      set({ tasks: [...created, ...get().tasks] })
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
