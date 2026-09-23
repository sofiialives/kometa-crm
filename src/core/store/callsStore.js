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
  // Короткий справочник сотрудников для выбора участников: имя, аватар,
  // отдел. Отдельная ручка, потому что обычный список людей закрыт для
  // рядового сотрудника и отдаёт лишнее — почты, роли, статусы.
  directory: [],
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

  async fetchDirectory() {
    try {
      set({ directory: await api.get('/users/directory') })
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  },

  async createCall({ title, note, scheduledAt, participantIds }) {
    try {
      const created = await api.post('/calls', {
        title,
        note,
        scheduledAt,
        ...(participantIds?.length ? { participantIds } : {}),
      })
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
