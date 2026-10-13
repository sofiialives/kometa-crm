import { create } from 'zustand'
import { api } from '../api/client'
import { useAuthStore } from './authStore'

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

// Номер последнего запроса каждого вида. Ответ, который пришёл позже
// более свежего (быстро переключили месяц или отдел), просто выбрасывается:
// иначе медленный старый ответ затирал бы данные нового выбора.
const latest = { mine: 0, conditions: 0, team: 0, settings: 0, reviews: 0 }

const EMPTY = {
  mine: null, mineLoading: false, mineError: null,
  conditions: null, conditionsLoading: false, conditionsError: null,
  team: null, teamMonths: [], teamLoading: false, teamError: null, employees: [],
  settings: null, settingsLoading: false, settingsError: null,
  reviews: null, reviewsLoading: false, reviewsError: null, reviewsPending: 0,
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

  reviews: null,
  reviewsLoading: false,
  reviewsError: null,
  reviewsPending: 0,

  /** Всё забыть — при выходе и смене пользователя. */
  reset: () => {
    for (const k of Object.keys(latest)) latest[k] += 1
    set({ ...EMPTY })
  },

  async fetchMine(month) {
    const n = ++latest.mine
    set({ mineLoading: true, mineError: null })
    const res = await call(() => api.get(`/motivation/me${query({ month })}`))
    if (n !== latest.mine) return res
    set(res.ok ? { mine: res.data, mineLoading: false } : { mineError: res.error, mineLoading: false })
    return res
  },

  async fetchConditions(userId) {
    const n = ++latest.conditions
    set({ conditionsLoading: true, conditionsError: null })
    const path = userId ? `/motivation/users/${userId}/conditions` : '/motivation/me/conditions'
    const res = await call(() => api.get(path))
    if (n !== latest.conditions) return res
    set(res.ok ? { conditions: res.data, conditionsLoading: false } : { conditionsError: res.error, conditionsLoading: false })
    return res
  },

  // Что человек видел: время самых свежих записей из ответа на экране.
  markSeen: (until) => call(() => api.post('/motivation/me/seen', until || {})),

  async fetchTeam(params) {
    const n = ++latest.team
    set({ teamLoading: true, teamError: null })
    const res = await call(() => api.get(`/motivation/team${query(params)}`))
    if (n !== latest.team) return res
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

  // Карточка сотрудника у руководителя и владельца — в сторе не держим: она живёт,
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
    const n = ++latest.settings
    set({ settingsLoading: true, settingsError: null })
    const res = await call(() => api.get('/motivation/settings'))
    if (n !== latest.settings) return res
    set(res.ok ? { settings: res.data, settingsLoading: false } : { settingsError: res.error, settingsLoading: false })
    return res
  },

  // Очередь «На проверке»: CRM подсказывает баллы за задачи, начисляет
  // владелец. Счётчик живёт отдельно — он нужен на вкладке раздела, даже
  // когда сама очередь не открыта.
  async fetchReviews(status = 'pending') {
    const n = ++latest.reviews
    set({ reviewsLoading: true, reviewsError: null })
    const res = await call(() => api.get(`/motivation/reviews${query({ status })}`))
    if (n !== latest.reviews) return res
    set(res.ok
      ? { reviews: res.data, reviewsLoading: false }
      : { reviewsError: res.error, reviewsLoading: false })
    return res
  },

  async fetchReviewsCount() {
    const res = await call(() => api.get('/motivation/reviews/count'))
    // На вкладке — и заявки, и подсказки о новых работах.
    if (res.ok) set({ reviewsPending: res.data.pending + (res.data.hints ?? 0) })
    return res
  },

  async approveReview(id, body) {
    const res = await call(() => api.post(`/motivation/reviews/${id}/approve`, body || {}))
    if (res.ok) set((s) => ({ reviewsPending: Math.max(0, s.reviewsPending - 1) }))
    return res
  },

  async rejectReview(id, body) {
    const res = await call(() => api.post(`/motivation/reviews/${id}/reject`, body || {}))
    if (res.ok) set((s) => ({ reviewsPending: Math.max(0, s.reviewsPending - 1) }))
    return res
  },

  // Подсказки «Пополнить банк?» о новых работах в Иерархии.
  fetchHints: () => call(() => api.get('/motivation/hints')),
  async markHintDone(id) {
    const res = await call(() => api.post(`/motivation/hints/${id}/done`, {}))
    if (res.ok) set((s) => ({ reviewsPending: Math.max(0, s.reviewsPending - 1) }))
    return res
  },
  async dismissHint(id) {
    const res = await call(() => api.post(`/motivation/hints/${id}/dismiss`, {}))
    if (res.ok) set((s) => ({ reviewsPending: Math.max(0, s.reviewsPending - 1) }))
    return res
  },

  // Кто работает с клиентом — для «Клиент купил продукт» из карточки клиента.
  fetchClientPeople: (clientId) => call(() => api.get(`/motivation/clients/${clientId}/people`)),

  // Выгрузка итогов месяца: сервер отдаёт файл, браузер его сохраняет.
  downloadExport: (month, format) => call(async () => {
    const res = await api.getRaw(`/motivation/export${query({ month, format })}`)
    const blob = await res.blob()
    const name = /filename="([^"]+)"/.exec(res.headers.get('Content-Disposition') || '')?.[1] || `motivatsiya-${month}.${format}`
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    return { name }
  }),

  // Журнал вечернего звонка и метка «форс-мажор». Журнал живёт в самом
  // разделе: он нужен только там и только за выбранный день.
  fetchCallJournal: (day) => call(() => api.get(`/motivation/calls/${day}`)),
  setCallMark: (day, userId, status) => call(() => api.put(`/motivation/calls/${day}/${userId}`, { status })),
  setAway: (body) => call(() => api.post('/motivation/away', body)),
  endAway: (id) => call(() => api.post(`/motivation/away/${id}/end`, {})),

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

// Сменился пользователь (вышел один, вошёл другой без перезагрузки) — чужие
// банк и баллы не должны мелькнуть ни на кадр. Подписка здесь, а не в
// authStore: авторизации незачем знать про мотивацию.
useAuthStore.subscribe((state, prev) => {
  if (state.user?.id !== prev.user?.id) useMotivationStore.getState().reset()
})
