import { create } from 'zustand'
import { api } from '../api/client'

/**
 * Вкладка «Мотивация». Свой стор: данные — деньги и оценки сотрудников, и
 * смешивать их с общими списками CRM незачем.
 *
 * Всё посчитано на сервере, здесь лежит готовое. После любого действия
 * (пополнение, баллы, отмена) экран просто перезапрашивается: пересчитывать
 * шкалу в браузере значило бы держать вторую арифметику, которая однажды
 * разойдётся с первой.
 */

function query(params) {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params || {})) {
    if (v !== undefined && v !== null && v !== '') q.set(k, v)
  }
  const s = q.toString()
  return s ? `?${s}` : ''
}

// Все вызовы отвечают одинаково: { ok, data } или { ok: false, error }.
// Страница на это рассчитывает, а сообщение показывает сама.
async function call(fn) {
  try {
    return { ok: true, data: await fn() }
  } catch (e) {
    return { ok: false, error: e.message }
  }
}

export const useMotivationStore = create((set) => ({
  // Экран сотрудника про себя.
  mine: null,
  mineLoading: false,
  mineError: null,

  // «Мои условия».
  conditions: null,
  conditionsLoading: false,
  conditionsError: null,

  // Раздел «Команда».
  team: null,
  teamMonths: [],
  teamLoading: false,
  teamError: null,
  employees: [],

  // Раздел «Настройки».
  settings: null,
  settingsLoading: false,
  settingsError: null,

  async fetchMine(month) {
    set({ mineLoading: true, mineError: null })
    const res = await call(() => api.get(`/motivation/me${query({ month })}`))
    set(res.ok ? { mine: res.data, mineLoading: false } : { mineError: res.error, mineLoading: false })
    return res
  },

  async fetchConditions(userId) {
    set({ conditionsLoading: true, conditionsError: null })
    const path = userId ? `/motivation/users/${userId}/conditions` : '/motivation/me/conditions'
    const res = await call(() => api.get(path))
    set(res.ok ? { conditions: res.data, conditionsLoading: false } : { conditionsError: res.error, conditionsLoading: false })
    return res
  },

  markSeen: () => call(() => api.post('/motivation/me/seen')),

  async fetchTeam(params) {
    set({ teamLoading: true, teamError: null })
    const res = await call(() => api.get(`/motivation/team${query(params)}`))
    set(res.ok ? { team: res.data, teamLoading: false } : { teamError: res.error, teamLoading: false })
    return res
  },

  async fetchTeamMonths() {
    const res = await call(() => api.get('/motivation/team/months'))
    if (res.ok) set({ teamMonths: res.data })
    return res
  },

  async fetchEmployees() {
    const res = await call(() => api.get('/motivation/employees'))
    if (res.ok) set({ employees: res.data })
    return res
  },

  // Карточка сотрудника у руководителя — в сторе не держим: она живёт,
  // пока открыто окно, и у каждого окна своя.
  fetchEmployee: (id, month) => call(() => api.get(`/motivation/users/${id}${query({ month })}`)),
  fetchEmployeeConditions: (id) => call(() => api.get(`/motivation/users/${id}/conditions`)),
  fetchManualOptions: (id) => call(() => api.get(`/motivation/users/${id}/options`)),

  topUp: (body) => call(() => api.post('/motivation/bank/top-up', body)),
  writeOff: (body) => call(() => api.post('/motivation/bank/write-off', body)),
  addManual: (body) => call(() => api.post('/motivation/events', body)),
  addProduct: (body) => call(() => api.post('/motivation/events/product', body)),
  cancelEvent: (id, reason) => call(() => api.post(`/motivation/events/${id}/cancel`, { reason })),

  async fetchSettings() {
    set({ settingsLoading: true, settingsError: null })
    const res = await call(() => api.get('/motivation/settings'))
    set(res.ok ? { settings: res.data, settingsLoading: false } : { settingsError: res.error, settingsLoading: false })
    return res
  },

  updateGeneral: (body) => call(() => api.patch('/motivation/settings', body)),
  saveGlobalScale: (levels) => call(() => api.put('/motivation/scale', { levels })),
  saveWorkLevels: (levels) => call(() => api.put('/motivation/work-levels', { levels })),
  createProfile: (body) => call(() => api.post('/motivation/profiles', body)),
  updateProfile: (id, body) => call(() => api.patch(`/motivation/profiles/${id}`, body)),
  deleteProfile: (id) => call(() => api.del(`/motivation/profiles/${id}`)),
  saveProfileScale: (id, levels) => call(() => api.put(`/motivation/profiles/${id}/scale`, { levels })),
  createEventType: (profileId, body) => call(() => api.post(`/motivation/profiles/${profileId}/events`, body)),
  updateEventType: (id, body) => call(() => api.patch(`/motivation/event-types/${id}`, body)),
  deleteEventType: (id) => call(() => api.del(`/motivation/event-types/${id}`)),
  assignProfile: (userId, profileId) => call(() => api.put(`/motivation/assignments/${userId}`, { profileId })),
}))
