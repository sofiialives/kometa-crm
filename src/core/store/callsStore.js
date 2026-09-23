import { create } from 'zustand'
import { api } from '../api/client'

/**
 * Видимость решает бэк (call.service.js → listCallsVisibleTo): сотрудник
 * получает свои звонки, главный — весь отдел, админ со scope=all — всё
 * агентство. Стор хранит то, что вернул сервер, и не дублирует правила.
 *
 * Два отдельных списка, а не один: «Все звонки» у админа — это другой
 * запрос с другим объёмом данных, и складывать их в один массив значило
 * бы, что открытая общая вкладка подменяет собой личный календарь.
 */
export const useCallsStore = create((set, get) => ({
  calls: [],
  allCalls: [],
  loading: false,
  error: null,

  async fetchCalls() {
    set({ loading: true, error: null })
    try {
      const calls = await api.get('/calls')
      set({ calls, loading: false })
      return { ok: true }
    } catch (e) {
      set({ error: e.message, loading: false })
      return { ok: false, error: e.message }
    }
  },

  async fetchAllCalls() {
    set({ loading: true, error: null })
    try {
      const allCalls = await api.get('/calls?scope=all')
      set({ allCalls, loading: false })
      return { ok: true }
    } catch (e) {
      set({ error: e.message, loading: false })
      return { ok: false, error: e.message }
    }
  },

  async createCall({ title, note, scheduledAt }) {
    try {
      const created = await api.post('/calls', { title, note: note || undefined, scheduledAt })
      set({ calls: [...get().calls, created], allCalls: [...get().allCalls, created] })
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  },

  async editCall(id, patch) {
    try {
      const updated = await api.patch(`/calls/${id}`, patch)
      const swap = (list) => list.map((c) => (c.id === id ? updated : c))
      set({ calls: swap(get().calls), allCalls: swap(get().allCalls) })
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  },

  async removeCall(id) {
    try {
      await api.del(`/calls/${id}`)
      const drop = (list) => list.filter((c) => c.id !== id)
      set({ calls: drop(get().calls), allCalls: drop(get().allCalls) })
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  },
}))
