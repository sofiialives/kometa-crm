import { create } from 'zustand'
import { api } from '../api/client'

function query(params) {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') q.set(k, v)
  }
  const s = q.toString()
  return s ? `?${s}` : ''
}

export const useKhochuPlachuStore = create((set, get) => ({
  ambassadors: [],
  themes: [],
  analytics: null,
  unreadCount: 0,
  loading: false,
  error: null,

  async fetchAmbassadors({ q, theme, status } = {}) {
    set({ loading: true, error: null })
    try {
      const ambassadors = await api.get(`/khochu-plachu/ambassadors${query({ q, theme, status })}`)
      set({ ambassadors, loading: false })
      return { ok: true }
    } catch (e) {
      set({ error: e.message, loading: false })
      return { ok: false, error: e.message }
    }
  },

  async fetchThemes() {
    try {
      set({ themes: await api.get('/khochu-plachu/ambassadors/themes') })
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  },

  async createAmbassador(payload, files) {
    const form = new FormData()
    form.append('theme', payload.theme)
    form.append('conditions', payload.conditions)
    if (payload.managerComment) form.append('managerComment', payload.managerComment)
    if (payload.callAt) form.append('callAt', payload.callAt)
    form.append('telegramGroupLink', payload.telegramGroupLink)
    form.append('contactUsername', payload.contactUsername)
    form.append('links', JSON.stringify(payload.links))
    for (const file of files) form.append('screenshots', file)
    try {
      await api.upload('/khochu-plachu/ambassadors', form)
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  },

  async decideAmbassador(id, decision) {
    try {
      await api.post(`/khochu-plachu/ambassadors/${id}/decision`, { decision })
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  },

  async removeFromApproved(id) {
    try {
      await api.post(`/khochu-plachu/ambassadors/${id}/remove`, {})
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  },

  async fetchAnalytics() {
    try {
      set({ analytics: await api.get('/khochu-plachu/analytics') })
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  },

  async screenshotUrl(ambassadorId, screenshotId) {
    try {
      const blob = await api.blob(`/khochu-plachu/ambassadors/${ambassadorId}/screenshots/${screenshotId}/file`)
      return { ok: true, url: URL.createObjectURL(blob) }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  },

  async fetchUnreadCount() {
    try {
      const { count } = await api.get('/khochu-plachu/notifications/unread-count')
      set({ unreadCount: count })
      return { ok: true }
    } catch {
      return { ok: false }
    }
  },

  async markNotificationsRead() {
    try {
      await api.post('/khochu-plachu/notifications/read', {})
      set({ unreadCount: 0 })
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  },
}))
